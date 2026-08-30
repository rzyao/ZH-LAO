import pg from 'pg';
import pino from 'pino';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { asExecutor, createPgPool } from '../../src/database/pool.js';
import { TransactionManager } from '../../src/database/transaction-manager.js';
import { OutboxWriter } from '../../src/outbox/outbox-writer.js';
import { AccessTokenService, CryptoOtpGenerator, FakeOtpDeliveryProvider, HmacOtpHasher, IdentityEventWriter, OtpConsumptionEngine, RefreshTokenService, RequestPhoneOtp, UnavailableOtpDeliveryProvider, type OtpDeliveryProvider } from '../../src/modules/identity/application/index.js';
import { AuthenticateWithPhoneOtp } from '../../src/modules/identity/application/use-cases/authenticate-with-phone-otp.js';
import { normalizePhoneNumber } from '../../src/modules/identity/domain/index.js';
import { createIdentityRepositories } from '../../src/modules/identity/infrastructure/index.js';
import { createTestDatabase, type TestDatabase } from '../support/test-database.js';

const adminUrl = process.env.ADMIN_DATABASE_URL;
const integration = adminUrl ? describe : describe.skip;
const logger = pino({ level: 'silent' });
class FailingOutboxWriter extends OutboxWriter { override async write(): Promise<void> { throw new Error('outbox unavailable'); } }

integration('IDN-05 RequestPhoneOtp', () => {
  let database: TestDatabase;
  let pool: pg.Pool;
  let transactions: TransactionManager;
  beforeAll(async () => {
    database = await createTestDatabase(adminUrl!);
    pool = createPgPool({ url: database.url, poolMin: 0, poolMax: 6, connectionTimeoutMs: 2000, idleTimeoutMs: 2000 }, logger);
    transactions = new TransactionManager(pool, logger);
  }, 120000);
  afterAll(async () => { await pool?.end(); await database?.dispose(); });
  const make = (delivery: OtpDeliveryProvider) => new RequestPhoneOtp(transactions, createIdentityRepositories, new CryptoOtpGenerator(), new HmacOtpHasher('test-only-otp-secret-that-is-long-enough'), delivery);

  it('creates only hashed pending OTP and enforces cooldown, replacement, limits and provider compensation', async () => {
    const delivery = new FakeOtpDeliveryProvider();
    const useCase = make(delivery);
    const phone = '+8562012345678';
    await useCase.execute({ phone, purpose: 'login', ip: '127.0.0.1' });
    expect(delivery.deliveries).toHaveLength(1);
    const found = await createIdentityRepositories(asExecutor(pool)).otpChallenges.findLatestPending(normalizePhoneNumber(phone), 'login');
    expect(found?.codeHash).not.toBe(delivery.deliveries[0]?.code);
    await expect(useCase.execute({ phone, purpose: 'login', ip: '127.0.0.1' })).rejects.toMatchObject({ code: 'OTP_RATE_LIMITED' });
    await expect(make(new UnavailableOtpDeliveryProvider()).execute({ phone: '+8613812345678', purpose: 'login', ip: '127.0.0.2' })).rejects.toMatchObject({ code: 'PROVIDER_UNAVAILABLE' });
    expect(await createIdentityRepositories(asExecutor(pool)).otpChallenges.findLatestPending(normalizePhoneNumber('+8613812345678'), 'login')).toBeNull();
  });

  it('consumes OTP atomically to register, issue tokens, and write one public event', async () => {
    const delivery = new FakeOtpDeliveryProvider(); const phone = '+8613812345678';
    await make(delivery).execute({ phone, purpose: 'login', ip: '127.0.0.9' });
    const access = new AccessTokenService('test-jwt-secret-that-is-long-enough-for-hmac', 'issuer', 'audience'); const refresh = new RefreshTokenService();
    const authenticate = new AuthenticateWithPhoneOtp(transactions, createIdentityRepositories, new OtpConsumptionEngine(createIdentityRepositories, new HmacOtpHasher('test-only-otp-secret-that-is-long-enough')), { prepareRefresh: () => refresh.prepare(), issueAccess: user => access.issue(user) }, new IdentityEventWriter(new OutboxWriter()));
    const result = await authenticate.execute({ phone, code: delivery.deliveries[0]!.code, learningDirection: { nativeLanguage: 'zh', learningLanguage: 'lo' } });
    expect(result.isNewUser).toBe(true); expect(access.verify(result.accessToken).subject).toBe(result.userPublicId);
    const identity = await createIdentityRepositories(asExecutor(pool)).authIdentities.findByProviderAndSubject('phone', normalizePhoneNumber(phone));
    expect((await createIdentityRepositories(asExecutor(pool)).learningProfiles.findByUserId(identity!.userId))?.direction.nativeLanguage).toBe('zh');
    expect((await pool.query("SELECT count(*)::int AS count FROM infrastructure.system_outbox_events WHERE event_type='identity.user_registered.v1' ")).rows[0]!.count).toBe(1);
  });

  it('allows at most one concurrent OTP consumption', async () => {
    const delivery = new FakeOtpDeliveryProvider(); const phone = '+8562098765432';
    await make(delivery).execute({ phone, purpose: 'login', ip: '127.0.0.10' });
    const access = new AccessTokenService('test-jwt-secret-that-is-long-enough-for-hmac', 'issuer', 'audience'); const refresh = new RefreshTokenService();
    const authenticate = new AuthenticateWithPhoneOtp(transactions, createIdentityRepositories, new OtpConsumptionEngine(createIdentityRepositories, new HmacOtpHasher('test-only-otp-secret-that-is-long-enough')), { prepareRefresh: () => refresh.prepare(), issueAccess: user => access.issue(user) });
    const values = await Promise.allSettled([authenticate.execute({ phone, code: delivery.deliveries[0]!.code, learningDirection: { nativeLanguage: 'lo', learningLanguage: 'zh' } }), authenticate.execute({ phone, code: delivery.deliveries[0]!.code, learningDirection: { nativeLanguage: 'lo', learningLanguage: 'zh' } })]);
    expect(values.filter(value => value.status === 'fulfilled')).toHaveLength(1);
  });

  it('rolls back registration when the outbox write fails', async () => {
    const delivery = new FakeOtpDeliveryProvider(); const phone = '+8613912345678';
    await make(delivery).execute({ phone, purpose: 'login', ip: '127.0.0.11' });
    const refresh = new RefreshTokenService();
    const authenticate = new AuthenticateWithPhoneOtp(transactions, createIdentityRepositories, new OtpConsumptionEngine(createIdentityRepositories, new HmacOtpHasher('test-only-otp-secret-that-is-long-enough')), { prepareRefresh: () => refresh.prepare(), issueAccess: () => 'unused' }, new IdentityEventWriter(new FailingOutboxWriter()));
    await expect(authenticate.execute({ phone, code: delivery.deliveries[0]!.code, learningDirection: { nativeLanguage: 'zh', learningLanguage: 'lo' } })).rejects.toThrow('outbox unavailable');
    expect(await createIdentityRepositories(asExecutor(pool)).authIdentities.findByProviderAndSubject('phone', normalizePhoneNumber(phone))).toBeNull();
  });
});
