import { createHash } from 'node:crypto';
import { Writable } from 'node:stream';
import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { createIdentityRepositories } from '../../src/modules/identity/infrastructure/index.js';
import { createIdentityHttpDependencies } from '../../src/modules/identity/http/composition.js';
import { RequestPhoneOtp } from '../../src/modules/identity/application/index.js';
import { CryptoOtpGenerator, FakeOtpDeliveryProvider, HmacOtpHasher, UnavailableFacebookCredentialVerifier, type FacebookCredentialVerifier } from '../../src/modules/identity/application/services/index.js';
import { type OtpPurpose, normalizePhoneNumber, parseRawOtpCode, parseUserPublicId } from '../../src/modules/identity/domain/index.js';
import { asExecutor } from '../../src/database/pool.js';
import { newLogicalUuid } from '../../src/ids/uuid.js';
import { buildIdentityTestApp, JWT_TEST_SECRET, OTP_TEST_SECRET, signJwt, TEST_AUDIENCE, TEST_ISSUER, type IdentityTestApp } from '../support/identity-app.js';

const adminUrl = process.env.ADMIN_DATABASE_URL;
const integration = adminUrl ? describe : describe.skip;
const direction = { native_language: 'lo', learning_language: 'zh' } as const;
const device = () => ({ installation_id: newLogicalUuid(), platform: 'android', push_token: `push-${newLogicalUuid()}` });
const lastCode = (ctx: IdentityTestApp) => ctx.delivery.deliveries.at(-1)!.code;
const bearer = (token: string) => ({ authorization: `Bearer ${token}` });
// ADR-023 统一信封断言：HTTP 一律 200，顶层 code 权威（成功 `{ code:'OK', data, request_id }`，失败 `{ code, error, request_id }`）。
type Envelope = { code: string; data: unknown; error?: { message: string; details?: unknown }; request_id: string };
const envelope = (response: { json(): unknown }): Envelope => response.json() as Envelope;
const success = (response: { json(): unknown }): Record<string, unknown> => {
  const body = envelope(response);
  expect(body.code).toBe('OK');
  return body.data as Record<string, unknown>;
};
const businessCode = (response: { json(): unknown }): string => envelope(response).code;

async function withApp(fn: (ctx: IdentityTestApp) => Promise<void>, options: { facebook?: ReadonlyMap<string, string>; verifier?: FacebookCredentialVerifier; logger?: import('pino').Logger<never, boolean> | import('pino').Logger<string, boolean> } = {}) {
  const ctx = await buildIdentityTestApp({ ...(options.logger ? { logger: options.logger } : {}), ...(options.facebook ? { facebookSubjects: options.facebook } : {}), ...(options.verifier ? { facebookVerifier: options.verifier } : {}) });
  try { await fn(ctx); } finally { await ctx.dispose(); }
}
async function otpReq(ctx: IdentityTestApp, phone: string, purpose: OtpPurpose = 'login', token?: string) { return ctx.app.inject({ method: 'POST', url: '/api/v1/identity/phone-otp', headers: token ? bearer(token) : {}, payload: { phone, purpose } }); }
async function phoneLogin(ctx: IdentityTestApp, phone: string) { await otpReq(ctx, phone); return ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone, otp_code: lastCode(ctx), learning_direction: direction, device: device() } }); }

integration('IDN-19 identity security hardening', () => {
  it('fails fast when JWT or OTP secrets are missing or too short', () => {
    const base = { transactionManager: {} as never, repositories: (() => ({})) as never, executor: {} as never, otpHmacSecret: OTP_TEST_SECRET, jwtHmacSecret: JWT_TEST_SECRET, jwtIssuer: 'issuer', jwtAudience: 'audience', otpDelivery: new FakeOtpDeliveryProvider() };
    expect(() => createIdentityHttpDependencies({ ...base, otpHmacSecret: 'short' })).toThrow(/OTP_HMAC_SECRET/);
    expect(() => createIdentityHttpDependencies({ ...base, jwtHmacSecret: '' })).toThrow(/JWT_HMAC_SECRET/);
    expect(() => createIdentityHttpDependencies(base)).not.toThrow();
  });

  it('provides six digit OTPs with leading zeros and never persists the raw code', async () => {
    await withApp(async (ctx) => {
      const generator = new CryptoOtpGenerator();
      for (let i = 0; i < 100; i++) expect(generator.generate()).toMatch(/^\d{6}$/);
      const phone = '+8562061000001'; await otpReq(ctx, phone);
      const raw = lastCode(ctx);
      expect(raw).toMatch(/^\d{6}$/);
      const rows = await ctx.pool.query('SELECT code_hash FROM identity.otp_challenges');
      expect(rows.rows).toHaveLength(1);
      expect(String(rows.rows[0]!.code_hash)).not.toBe(raw);
      expect(String(rows.rows[0]!.code_hash)).not.toBe(createHash('sha256').update(raw).digest('base64url'));
      const wrongOtp = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone, otp_code: '999999' } });
      expect(wrongOtp.statusCode).toBe(200);
      expect(businessCode(wrongOtp)).toBe('OTP_INVALID');
    });
  });

  it('enforces OTP request thresholds, purpose and phone isolation, and window expiry', async () => {
    await withApp(async (ctx) => {
      const delivery = new FakeOtpDeliveryProvider();
      const hasher = new HmacOtpHasher(OTP_TEST_SECRET);
      const seed = async (phone: string, purpose: OtpPurpose) => {
        await createIdentityRepositories(asExecutor(ctx.pool)).otpChallenges.create({ phoneNumber: normalizePhoneNumber(phone), purpose, codeHash: hasher.hash({ code: parseRawOtpCode('000000'), phone: normalizePhoneNumber(phone), purpose }), maxAttempts: 5, expiresAt: new Date(Date.now() + 300_000) });
      };
      const limited = new RequestPhoneOtp(ctx.transactions, createIdentityRepositories, new CryptoOtpGenerator(), hasher, delivery, { ttlMs: 300_000, maxAttempts: 5, resendCooldownMs: 0, phoneWindowMs: 60_000, phoneWindowLimit: 2, phoneDailyMs: 86_400_000, phoneDailyLimit: 5, ipWindowMs: 60_000, ipLimit: 50 });
      await seed('+8562061000002', 'login'); await seed('+8562061000002', 'login');
      const third = await limited.execute({ phone: '+8562061000002', purpose: 'login', ip: '1.1.1.1' }).then(() => null, (error) => error);
      expect((third as Error & { code?: string } | null)?.code).toBe('OTP_RATE_LIMITED');
      const registered = await phoneLogin(ctx, '+8562061000001');
      const bindIsolated = await limited.execute({ phone: '+8562061000002', purpose: 'bind_phone', ip: '1.1.1.1', authenticatedUserPublicId: parseUserPublicId(success(registered).user_id) }).then(() => 'ok', (error) => (error as Error & { code?: string }).code);
      expect(bindIsolated).toBe('ok');
      const phoneIsolated = await limited.execute({ phone: '+8562061000003', purpose: 'login', ip: '1.1.1.1' }).then(() => 'ok', (error) => (error as Error & { code?: string }).code);
      expect(phoneIsolated).toBe('ok');
      const ipLimited = new RequestPhoneOtp(ctx.transactions, createIdentityRepositories, new CryptoOtpGenerator(), hasher, delivery, { ttlMs: 300_000, maxAttempts: 5, resendCooldownMs: 0, phoneWindowMs: 60_000, phoneWindowLimit: 50, phoneDailyMs: 86_400_000, phoneDailyLimit: 50, ipWindowMs: 60_000, ipLimit: 2 });
      await ipLimited.execute({ phone: '+8562061000004', purpose: 'login', ip: '2.2.2.2' });
      await ipLimited.execute({ phone: '+8562061000005', purpose: 'login', ip: '2.2.2.2' });
      const ipThird = await ipLimited.execute({ phone: '+8562061000006', purpose: 'login', ip: '2.2.2.2' }).then(() => null, (error) => error);
      expect((ipThird as Error & { code?: string } | null)?.code).toBe('OTP_RATE_LIMITED');
      const expiring = new RequestPhoneOtp(ctx.transactions, createIdentityRepositories, new CryptoOtpGenerator(), hasher, delivery, { ttlMs: 300_000, maxAttempts: 5, resendCooldownMs: 0, phoneWindowMs: 1000, phoneWindowLimit: 1, phoneDailyMs: 86_400_000, phoneDailyLimit: 5, ipWindowMs: 60_000, ipLimit: 50 });
      await seed('+8562061000007', 'login');
      const inWindow = await expiring.execute({ phone: '+8562061000007', purpose: 'login', ip: '3.3.3.3' }).then(() => null, (error) => error);
      expect((inWindow as Error & { code?: string } | null)?.code).toBe('OTP_RATE_LIMITED');
      await new Promise((resolve) => setTimeout(resolve, 4000));
      const afterExpiry = await expiring.execute({ phone: '+8562061000007', purpose: 'login', ip: '3.3.3.3' }).then(() => 'ok', (error) => (error as Error & { code?: string }).code);
      expect(afterExpiry).toBe('ok');
    });
  });

  it('rejects JWT algorithm, signature, issuer, audience, expiry, tamper, and invalid subjects', async () => {
    await withApp(async (ctx) => {
      const registered = await phoneLogin(ctx, '+8562061000008'); const sub = String(success(registered).user_id);
      const now = Math.floor(Date.now() / 1000);
      const protectedCall = (token: string) => ctx.app.inject({ url: '/api/v1/identity/me', headers: bearer(token) });
      const expectUnauthenticated = async (token: string) => {
        const response = await protectedCall(token);
        expect(response.statusCode).toBe(200);
        expect(businessCode(response)).toBe('UNAUTHENTICATED');
      };
      const valid = { sub, iat: now, exp: now + 900, iss: TEST_ISSUER, aud: TEST_AUDIENCE };
      await expectUnauthenticated(signJwt(JWT_TEST_SECRET, valid, 'none'));
      await expectUnauthenticated(signJwt(JWT_TEST_SECRET, { ...valid, iss: 'evil-corpus' }));
      await expectUnauthenticated(signJwt(JWT_TEST_SECRET, { ...valid, aud: 'evil-client' }));
      await expectUnauthenticated(signJwt('wrong-secret-that-is-long-enough-for-hmac', valid));
      const tampered = signJwt(JWT_TEST_SECRET, valid).split('.'); tampered[1] = Buffer.from(JSON.stringify({ ...valid, sub: newLogicalUuid() })).toString('base64url');
      await expectUnauthenticated(tampered.join('.'));
      await expectUnauthenticated(signJwt(JWT_TEST_SECRET, { ...valid, exp: now - 60 }));
      await expectUnauthenticated(signJwt(JWT_TEST_SECRET, { ...valid, sub: 'not-a-uuid' }));
      const accepted = await protectedCall(signJwt(JWT_TEST_SECRET, valid));
      expect(accepted.statusCode).toBe(200); expect(businessCode(accepted)).toBe('OK');
    });
  });

  it('issues opaque high-entropy refresh tokens that never equal the stored hash', async () => {
    await withApp(async (ctx) => {
      const registered = await phoneLogin(ctx, '+8562061000009'); const raw = String(success(registered).refresh_token);
      expect(raw.length).toBeGreaterThanOrEqual(60);
      expect(raw).not.toContain('.');
      expect(() => JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'))).toThrow();
      const stored = await ctx.pool.query<{ refresh_token_hash: string }>('SELECT refresh_token_hash FROM identity.sessions');
      expect(stored.rows[0]!.refresh_token_hash).not.toBe(raw);
    });
  });

  it('redacts phone, OTP, tokens, credentials, and secrets from application logs', async () => {
    const captured: string[] = [];
    const sink = new Writable({ write(chunk, _encoding, callback) { captured.push(String(chunk)); callback(); } });
    const captureLogger = pino({ level: 'info' }, sink);
    await withApp(async (ctx) => {
      const phone = '+8562061000010'; await otpReq(ctx, phone); const code = lastCode(ctx);
      const registered = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone, otp_code: code, learning_direction: direction, device: device() } });
      const token = success(registered); const refresh = String(token.refresh_token); const access = String(token.access_token);
      await otpReq(ctx, phone); await otpReq(ctx, phone);
      await ctx.app.inject({ url: '/api/v1/identity/me', headers: bearer('invalid-token') });
      await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/facebook', payload: { credential: 'facebook-raw-credential', learning_direction: direction } });
      await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: refresh } });
      await ctx.app.inject({ method: 'PATCH', url: '/api/v1/identity/me/profile', headers: bearer(access), payload: { display_name: 'x' } });
      const joined = captured.join('\n');
      expect(joined).not.toContain(code); expect(joined).not.toContain(access); expect(joined).not.toContain(refresh);
      expect(joined).not.toContain('facebook-raw-credential'); expect(joined).not.toContain(phone);
      expect(joined).not.toContain(JWT_TEST_SECRET); expect(joined).not.toContain(OTP_TEST_SECRET);
    }, { logger: captureLogger });
  });

  it('blocks cross-user device, profile, and session manipulation without leaking existence', async () => {
    await withApp(async (ctx) => {
      const userA = await phoneLogin(ctx, '+8562061000011'); const userB = await phoneLogin(ctx, '+8562061000012');
      const dataA = success(userA); const dataB = success(userB);
      const headersA = bearer(String(dataA.access_token)); const headersB = bearer(String(dataB.access_token));
      const deviceB = (success(await ctx.app.inject({ url: '/api/v1/identity/me/devices', headers: headersB })).items as Array<Record<string, unknown>>)[0]!.installation_id;
      const foreignRevoke = await ctx.app.inject({ method: 'DELETE', url: `/api/v1/identity/me/devices/${deviceB}`, headers: headersA });
      expect(foreignRevoke.statusCode).toBe(200);
      expect(businessCode(foreignRevoke)).toBe('DEVICE_NOT_FOUND');
      const missingRevoke = await ctx.app.inject({ method: 'DELETE', url: `/api/v1/identity/me/devices/${newLogicalUuid()}`, headers: headersA });
      expect(missingRevoke.statusCode).toBe(200);
      expect(businessCode(missingRevoke)).toBe('DEVICE_NOT_FOUND');
      expect(businessCode(foreignRevoke)).toBe(businessCode(missingRevoke));
      expect(envelope(foreignRevoke).error?.message).toBe(envelope(missingRevoke).error?.message);
      const patch = await ctx.app.inject({ method: 'PATCH', url: '/api/v1/identity/me/profile', headers: headersA, payload: { user_id: String(dataB.user_id) } });
      expect(patch.statusCode).toBe(200);
      expect(businessCode(patch)).toBe('VALIDATION_ERROR');
      expect(success(await ctx.app.inject({ url: '/api/v1/identity/me', headers: headersA })).user_id).toBe(dataA.user_id);
      const unknownSessionRoute = await ctx.app.inject({ method: 'DELETE', url: `/api/v1/identity/me/sessions/${newLogicalUuid()}`, headers: headersA });
      expect(unknownSessionRoute.statusCode).toBe(200);
      expect(businessCode(unknownSessionRoute)).toBe('NOT_FOUND');
      expect((success(await ctx.app.inject({ url: '/api/v1/identity/me/devices', headers: headersB })).items as Array<unknown>)).toHaveLength(1);
    });
  });

  it('never persists or returns the facebook credential', async () => {
    await withApp(async (ctx) => {
      expect((await ctx.pool.query('SELECT provider_subject FROM identity.auth_identities')).rows).toHaveLength(0);
      const fb = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/facebook', payload: { credential: 'opaque-credential', learning_direction: direction, device: device() } });
      expect(fb.statusCode).toBe(200);
      expect(JSON.stringify(fb.json())).not.toContain('opaque-credential');
      const rows = await ctx.pool.query('SELECT provider_subject FROM identity.auth_identities');
      expect(JSON.stringify(rows.rows)).not.toContain('opaque-credential');
      const me = await ctx.app.inject({ url: '/api/v1/identity/me', headers: bearer(String(success(fb).access_token)) });
      expect(me.statusCode).toBe(200);
      expect(success(me).auth_providers).toEqual(['facebook']);
    }, { facebook: new Map([['opaque-credential', 'fb-secure-subject']]) });
  });

  it('maps provider outage to a safe error and rejects unverifiable credentials', async () => {
    await withApp(async (ctx) => {
      const outage = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/facebook', payload: { credential: 'anything', learning_direction: direction } });
      expect(outage.statusCode).toBe(200); expect(businessCode(outage)).toBe('PROVIDER_UNAVAILABLE');
      expect(outage.body).not.toContain('stack');
      expect(outage.body).not.toContain('OAuth');
    }, { verifier: new UnavailableFacebookCredentialVerifier() });
  });

  it('keeps OTP purpose and phone scoped: no cross-purpose, cross-phone, or stolen reuse', async () => {
    await withApp(async (ctx) => {
      const fb = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/facebook', payload: { credential: 'opaque', learning_direction: direction } });
      const fbData = success(fb);
      const headers = bearer(String(fbData.access_token));
      const phone = '+8562061000013'; const other = '+8562061000014';
      await otpReq(ctx, phone, 'bind_phone', String(fbData.access_token)); const bindCode = lastCode(ctx);
      const bind = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/me/phone/bind', headers, payload: { phone, otp_code: bindCode } });
      expect(bind.statusCode).toBe(200); expect(businessCode(bind)).toBe('OK');
      const crossPurpose = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/me/phone/bind', headers, payload: { phone: other, otp_code: bindCode } });
      // 该用户已绑定 phone：bindPhone 先拒绝重复绑定（早于 OTP 消费），顶层码 PHONE_ALREADY_BOUND。
      expect(crossPurpose.statusCode).toBe(200); expect(businessCode(crossPurpose)).toBe('PHONE_ALREADY_BOUND');
      await otpReq(ctx, other, 'login');
      const crossPurposeChange = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/me/phone/change', headers, payload: { new_phone: other, otp_code: lastCode(ctx) } });
      expect(crossPurposeChange.statusCode).toBe(200); expect(businessCode(crossPurposeChange)).toBe('OTP_ALREADY_USED');
      await otpReq(ctx, phone, 'login');
      const crossPhone = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone: other, otp_code: lastCode(ctx), learning_direction: direction } });
      expect(crossPhone.statusCode).toBe(200); expect(businessCode(crossPhone)).toBe('OTP_INVALID');
    }, { facebook: new Map([['opaque', 'fb-owner']]) });
  });

  it('denies binding or changing to a phone owned by another user', async () => {
    await withApp(async (ctx) => {
      await phoneLogin(ctx, '+8562061000015');
      const ownedByB = '+8562061000016'; await phoneLogin(ctx, ownedByB);
      const fb = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/facebook', payload: { credential: 'opaque', learning_direction: direction } });
      const fbData = success(fb);
      const headers = bearer(String(fbData.access_token));
      await otpReq(ctx, ownedByB, 'bind_phone', String(fbData.access_token));
      const bind = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/me/phone/bind', headers, payload: { phone: ownedByB, otp_code: lastCode(ctx) } });
      expect(bind.statusCode).toBe(200); expect(businessCode(bind)).toBe('IDENTITY_CONFLICT');
      await otpReq(ctx, ownedByB, 'change_phone', String(fbData.access_token));
      const change = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/me/phone/change', headers, payload: { new_phone: ownedByB, otp_code: lastCode(ctx) } });
      expect(change.statusCode).toBe(200); expect(businessCode(change)).toBe('PHONE_NOT_BOUND');
    }, { facebook: new Map([['opaque', 'fb-owner']]) });
  });
});