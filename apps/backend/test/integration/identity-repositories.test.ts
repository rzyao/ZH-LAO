import pg from 'pg';
import pino from 'pino';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { asExecutor, createPgPool } from '../../src/database/pool.js';
import { TransactionManager } from '../../src/database/transaction-manager.js';
import { newLogicalUuid } from '../../src/ids/uuid.js';
import { createIdentityRepositories } from '../../src/modules/identity/infrastructure/index.js';
import { createLearningDirection, normalizePhoneNumber, parseInstallationId, parseOtpCodeHash, parseRefreshTokenHash, parseUserPublicId } from '../../src/modules/identity/domain/index.js';
import { createTestDatabase, type TestDatabase } from '../support/test-database.js';

const adminUrl = process.env.ADMIN_DATABASE_URL; const integration = adminUrl ? describe : describe.skip;
const logger = pino({ level: 'silent' });
integration('Identity repositories on a fresh PostgreSQL V2 database', () => {
  let database: TestDatabase; let pool: pg.Pool; let transactions: TransactionManager;
  beforeAll(async () => { database = await createTestDatabase(adminUrl!); pool = createPgPool({ url: database.url, poolMin: 0, poolMax: 6, connectionTimeoutMs: 2_000, idleTimeoutMs: 2_000 }, logger); transactions = new TransactionManager(pool, logger); }, 120_000);
  afterAll(async () => { await pool?.end(); await database?.dispose(); }, 30_000);
  const repos = () => createIdentityRepositories(asExecutor(pool));
  async function newUser() { return repos().users.create({ publicId: parseUserPublicId(newLogicalUuid()), status: 'active' }); }

  it('persists all seven repository models and keeps nullable values', async () => {
    const u = await newUser(); expect((await repos().users.findByPublicId(u.publicId))?.id).toBe(u.id);
    await expect(repos().users.create({ publicId: u.publicId, status: 'active' })).rejects.toMatchObject({ code: 'IDENTITY_CONFLICT' });
    expect((await repos().users.updateStatus(u.id, 'disabled'))?.status).toBe('disabled'); expect((await repos().users.updateLastActiveAt(u.id, new Date()))?.lastActiveAt).toBeInstanceOf(Date);
    const phone = normalizePhoneNumber('+8562012345678'); const a = await repos().authIdentities.create({ userId: u.id, provider: 'phone', providerSubject: phone }); await repos().authIdentities.create({ userId: u.id, provider: 'facebook', providerSubject: 'fb-1' }); expect((await repos().authIdentities.findPhoneByUserId(u.id))?.id).toBe(a.id); await expect(repos().authIdentities.create({ userId: u.id, provider: 'phone', providerSubject: phone })).rejects.toMatchObject({ code: 'IDENTITY_CONFLICT' });
    const p = await repos().basicProfiles.create({ userId: u.id }); expect(p.gender).toBeNull(); const birthday = '2000-01-01'; expect((await repos().basicProfiles.update(u.id, { birthDate: birthday, gender: 'unspecified', avatarMediaId: newLogicalUuid() }))?.birthDate).toBe(birthday);
    expect((await repos().learningProfiles.create({ userId: u.id, direction: createLearningDirection('lo', 'zh') })).direction.nativeLanguage).toBe('lo');
    const challenge = await repos().otpChallenges.create({ phoneNumber: phone, purpose: 'login', codeHash: parseOtpCodeHash('hash'), maxAttempts: 5, expiresAt: new Date(Date.now() + 60_000) }); expect((await repos().otpChallenges.incrementAttemptCount(challenge.id))?.attemptCount).toBe(1); expect(await repos().otpChallenges.countRecentRequests(phone, 'login', new Date(Date.now() - 60_000))).toBe(1); expect((await repos().otpChallenges.markVerified(challenge.id, new Date()))?.status).toBe('verified');
    const d = await repos().devices.create({ userId: u.id, installationId: parseInstallationId(newLogicalUuid()), platform: 'android', pushToken: 'push-1' }); expect((await repos().devices.findByInstallationId(d.installationId))?.pushToken).toBe('push-1'); await expect(repos().devices.create({ userId: u.id, installationId: parseInstallationId(newLogicalUuid()), platform: 'ios', pushToken: 'push-1' })).rejects.toMatchObject({ code: 'IDENTITY_CONFLICT' });
    const s = await repos().sessions.create({ userId: u.id, deviceId: d.id, refreshTokenHash: parseRefreshTokenHash('refresh-hash'), expiresAt: new Date(Date.now() + 60_000) }); expect((await repos().sessions.findByRefreshTokenHash(parseRefreshTokenHash('refresh-hash')))?.deviceId).toBe(d.id); expect((await repos().sessions.revoke(s.id, new Date(), 'test'))?.status).toBe('revoked');
  });

  it('uses transaction-scoped executors for rollback and isolation', async () => { const publicId=parseUserPublicId(newLogicalUuid()); await expect(transactions.run(async executor => { await createIdentityRepositories(executor).users.create({ publicId, status:'active' }); expect(await repos().users.findByPublicId(publicId)).toBeNull(); throw new Error('rollback'); })).rejects.toThrow('rollback'); expect(await repos().users.findByPublicId(publicId)).toBeNull(); });

  it('serializes user, session, and OTP advisory locks without serializing another phone', async () => {
    const u=await newUser(); await repos().sessions.create({userId:u.id,refreshTokenHash:parseRefreshTokenHash('lock-hash'),expiresAt:new Date(Date.now()+60_000)}); const phone=normalizePhoneNumber('+8562099999999');
    let userSecond=false; let userLocked!: () => void; const userReady=new Promise<void>(resolve=>{userLocked=resolve;}); const first=transactions.run(async executor=>{await createIdentityRepositories(executor).users.lockByInternalId(u.id);userLocked();await new Promise(resolve=>setTimeout(resolve,120));}); await userReady; const second=transactions.run(async executor=>{await createIdentityRepositories(executor).users.lockByInternalId(u.id);userSecond=true;}); await new Promise(resolve=>setTimeout(resolve,40));expect(userSecond).toBe(false);await Promise.all([first,second]);
    let sessionSecond=false;let sessionLocked!:()=>void;const sessionReady=new Promise<void>(resolve=>{sessionLocked=resolve;});const third=transactions.run(async executor=>{await createIdentityRepositories(executor).sessions.lockByRefreshTokenHash(parseRefreshTokenHash('lock-hash'));sessionLocked();await new Promise(resolve=>setTimeout(resolve,120));});await sessionReady;const fourth=transactions.run(async executor=>{await createIdentityRepositories(executor).sessions.lockByRefreshTokenHash(parseRefreshTokenHash('lock-hash'));sessionSecond=true;});await new Promise(resolve=>setTimeout(resolve,40));expect(sessionSecond).toBe(false);await Promise.all([third,fourth]);
    let sameSecond=false;let otherDone=false;let otpLocked!:()=>void;const otpReady=new Promise<void>(resolve=>{otpLocked=resolve;});const fifth=transactions.run(async executor=>{await createIdentityRepositories(executor).otpChallenges.acquireRequestAdvisoryLock(phone,'login');otpLocked();await new Promise(resolve=>setTimeout(resolve,120));});await otpReady;const sixth=transactions.run(async executor=>{await createIdentityRepositories(executor).otpChallenges.acquireRequestAdvisoryLock(phone,'login');sameSecond=true;});const seventh=transactions.run(async executor=>{await createIdentityRepositories(executor).otpChallenges.acquireRequestAdvisoryLock(normalizePhoneNumber('+8562088888888'),'login');otherDone=true;});await new Promise(resolve=>setTimeout(resolve,40));expect(sameSecond).toBe(false);expect(otherDone).toBe(true);await Promise.all([fifth,sixth,seventh]);
  });
});
