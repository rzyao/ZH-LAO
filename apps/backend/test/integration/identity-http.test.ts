import pino from 'pino';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { asExecutor } from '../../src/database/pool.js';
import { createIdentityRepositories } from '../../src/modules/identity/infrastructure/index.js';
import { normalizePhoneNumber, parseUserPublicId } from '../../src/modules/identity/domain/index.js';
import { buildIdentityTestApp, JWT_TEST_SECRET, signJwt, TEST_AUDIENCE, TEST_ISSUER, type IdentityTestApp } from '../support/identity-app.js';
import { newLogicalUuid } from '../../src/ids/uuid.js';
import { createTestDatabase, type TestDatabase } from '../support/test-database.js';

const adminUrl = process.env.ADMIN_DATABASE_URL;
const integration = adminUrl ? describe : describe.skip;
const logger = pino({ level: 'silent' });
const direction = { native_language: 'lo', learning_language: 'zh' } as const;
const reversed = { native_language: 'zh', learning_language: 'lo' } as const;
const device = (installationId: string = newLogicalUuid()) => ({ installation_id: installationId, platform: 'android', device_name: 'Pixel', app_version: '1.0.0', push_token: `push-${installationId}` });
const lastCode = (ctx: IdentityTestApp) => ctx.delivery.deliveries.at(-1)!.code;
const bearer = (token: string) => ({ authorization: `Bearer ${token}` });
// ADR-023 统一信封断言：HTTP 一律 200，顶层 code 权威。
// 成功 `{ code: 'OK', data, request_id }`；失败 `{ code, error: { message, details? }, request_id }`；
// 原 204 无返回体 → `data: null`；/health/live、/health/ready 豁免（本文件不涉及）。
type Envelope = { code: string; data: unknown; error?: { message: string; details?: unknown }; request_id: string };
const envelope = (response: { json(): unknown }): Envelope => response.json() as Envelope;
const success = (response: { json(): unknown }): Record<string, unknown> => {
  const body = envelope(response);
  expect(body.code).toBe('OK');
  return body.data as Record<string, unknown>;
};
const businessCode = (response: { json(): unknown }): string => envelope(response).code;

integration('IDN-17 Identity HTTP/API', () => {
  let database: TestDatabase;
  let ctx: IdentityTestApp;
  beforeAll(async () => { database = await createTestDatabase(adminUrl!); }, 120000);
  afterAll(async () => { await ctx?.dispose(); await database?.dispose(); });
  async function fresh(facebookCredentials: ReadonlyArray<string> = []) {
    await ctx?.dispose();
    ctx = await buildIdentityTestApp({ database, logger, ...(facebookCredentials.length ? { facebookSubjects: new Map(facebookCredentials.map((credential, index) => [credential, `fb-subject-${index}`])) } : {}) });
    return ctx;
  }
  function otpReq(phone: string, purpose: 'login' | 'bind_phone' | 'change_phone' = 'login', token?: string) {
    return ctx.app.inject({ method: 'POST', url: '/api/v1/identity/phone-otp', headers: token ? bearer(token) : {}, payload: { phone, purpose } });
  }
  function phoneAuth(phone: string, payload: Record<string, unknown> = {}) {
    return ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone, otp_code: lastCode(ctx), learning_direction: direction, device: device(), ...payload } });
  }
  async function registerPhone(phone: string, payload: Record<string, unknown> = {}) { await otpReq(phone); return phoneAuth(phone, payload); }

  it('registers the complete frozen endpoint inventory', async () => {
    await fresh();
    const installation = newLogicalUuid();
    const routes: ReadonlyArray<readonly ['GET' | 'POST' | 'PATCH' | 'DELETE', string]> = [
      ['POST', '/api/v1/identity/phone-otp'], ['POST', '/api/v1/identity/auth/phone'], ['POST', '/api/v1/identity/auth/facebook'],
      ['POST', '/api/v1/identity/sessions/refresh'], ['POST', '/api/v1/identity/sessions/logout'], ['POST', '/api/v1/identity/sessions/logout-all'],
      ['GET', '/api/v1/identity/me'], ['GET', '/api/v1/identity/me/status'], ['GET', '/api/v1/identity/me/profile'], ['PATCH', '/api/v1/identity/me/profile'],
      ['GET', '/api/v1/identity/me/learning-profile'], ['GET', '/api/v1/identity/me/devices'], ['DELETE', `/api/v1/identity/me/devices/${installation}`],
      ['GET', '/api/v1/identity/me/sessions'], ['POST', '/api/v1/identity/me/phone/bind'], ['POST', '/api/v1/identity/me/phone/change']
    ];
    for (const [method, url] of routes) {
      const response = await ctx.app.inject({ method, url, payload: {} });
      expect(response.statusCode, `${method} ${url} must be HTTP 200 (ADR-023)`).toBe(200);
      expect(businessCode(response), `${method} ${url} must be a registered route, not NOT_FOUND`).not.toBe('NOT_FOUND');
    }
    const invalidParam = await ctx.app.inject({ method: 'DELETE', url: `/api/v1/identity/me/devices/not-a-uuid` });
    expect(invalidParam.statusCode).toBe(200);
    expect(businessCode(invalidParam)).not.toBe('NOT_FOUND');
    const unknown = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/me/unknown' });
    expect(unknown.statusCode).toBe(200);
    expect(businessCode(unknown)).toBe('NOT_FOUND');
  });

  it('requests login OTP publicly without leaking the code or registration state', async () => {
    await fresh();
    const existingPhone = '+8562031000001'; await registerPhone(existingPhone);
    const known = await otpReq(existingPhone);
    expect(known.statusCode).toBe(200);
    const knownBody = envelope(known);
    expect(knownBody.code).toBe('OK');
    expect(knownBody.data).toEqual({ status: 'accepted', retry_after_seconds: 60 });
    expect(typeof knownBody.request_id).toBe('string');
    const newPhone = '+8562099999999';
    const freshPhone = await otpReq(newPhone);
    expect(freshPhone.statusCode).toBe(200);
    const freshBody = envelope(freshPhone);
    // 注册状态不得泄漏：已注册与新号码的业务载荷必须一致（request_id 按请求唯一，不参与比较）。
    expect(freshBody.code).toBe(knownBody.code);
    expect(freshBody.data).toEqual(knownBody.data);
    expect(JSON.stringify(knownBody)).not.toContain('otp');
  });

  it('requires an authenticated user for bind/change OTP and validates phone', async () => {
    await fresh();
    const bindUnauthenticated = await otpReq('+8562031000002', 'bind_phone');
    expect(bindUnauthenticated.statusCode).toBe(200);
    expect(businessCode(bindUnauthenticated)).toBe('UNAUTHENTICATED');
    const changeUnauthenticated = await otpReq('+8562031000003', 'change_phone');
    expect(changeUnauthenticated.statusCode).toBe(200);
    expect(businessCode(changeUnauthenticated)).toBe('UNAUTHENTICATED');
    const invalidPhone = await otpReq('not-a-phone');
    expect(invalidPhone.statusCode).toBe(200);
    expect(businessCode(invalidPhone)).toBe('INVALID_PHONE');
  });

  it('authenticates a new phone user with device and issues safe token responses', async () => {
    await fresh();
    const phone = '+8562031000005'; const response = await registerPhone(phone);
    expect(response.statusCode).toBe(200);
    const body = success(response);
    expect(body).toMatchObject({ account_status: 'active', is_new_user: true, token_type: 'Bearer', expires_in: 900 });
    expect(String(body.user_id)).toMatch(/^[0-9a-f-]{36}$/);
    expect(typeof body.access_token).toBe('string'); expect(typeof body.refresh_token).toBe('string');
    const identity = await createIdentityRepositories(asExecutor(ctx.pool)).authIdentities.findByProviderAndSubject('phone', normalizePhoneNumber(phone));
    expect(identity?.providerSubject).toBe(normalizePhoneNumber(phone));
    const stored = await ctx.pool.query<{ count: string }>('SELECT count(*)::text AS count FROM identity.users WHERE public_id=$1', [String(body.user_id)]);
    expect(Number(stored.rows[0]!.count)).toBe(1);
    expect(JSON.stringify(body)).not.toContain('refresh_token_hash');
    expect(JSON.stringify(body)).not.toContain('code_hash');
    expect(JSON.stringify(body)).not.toMatch(/"(id|user_id)"\s*:\s*\d+/);
  });

  it('requires learning direction for new users and rejects conflicting direction for existing users', async () => {
    await fresh();
    const phone = '+8562031000006';
    await otpReq(phone); const code = lastCode(ctx);
    const missing = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone, otp_code: code, device: device() } });
    expect(missing.statusCode).toBe(200); expect(businessCode(missing)).toBe('INVALID_CREDENTIAL');
    const registered = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone, otp_code: code, learning_direction: direction, device: device() } });
    expect(registered.statusCode).toBe(200); expect(success(registered).is_new_user).toBe(true);
    await otpReq(phone); const conflicting = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone, otp_code: lastCode(ctx), learning_direction: reversed, device: device() } });
    expect(conflicting.statusCode).toBe(200); expect(businessCode(conflicting)).toBe('LEARNING_DIRECTION_IMMUTABLE');
    const loginAgain = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone, otp_code: lastCode(ctx), learning_direction: direction, device: device() } });
    expect(loginAgain.statusCode).toBe(200); expect(success(loginAgain).is_new_user).toBe(false);
  });

  it('registers and logs in via Facebook and rejects spoofed trusted subjects', async () => {
    await fresh(['opaque']);
    const facebook = (payload: Record<string, unknown>) => ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/facebook', payload });
    const spoofed = await facebook({ credential: 'opaque', provider_subject: 'fb-1', facebook_user_id: 'fb-1', learning_direction: direction, device: device() });
    expect(spoofed.statusCode).toBe(200); expect(businessCode(spoofed)).toBe('VALIDATION_ERROR');
    const fbRegister = await facebook({ credential: 'opaque', learning_direction: direction, device: device() });
    expect(fbRegister.statusCode).toBe(200);
    const registerData = success(fbRegister);
    expect(registerData.is_new_user).toBe(true);
    const fbLogin = await facebook({ credential: 'opaque' });
    expect(fbLogin.statusCode).toBe(200);
    const loginData = success(fbLogin);
    expect(loginData.is_new_user).toBe(false); expect(loginData.user_id).toBe(registerData.user_id);
    const invalid = await facebook({ credential: 'unknown', learning_direction: direction });
    expect(invalid.statusCode).toBe(200); expect(businessCode(invalid)).toBe('INVALID_CREDENTIAL');
  });

  it('rotates refresh tokens with no-store headers and maps replay and revocation safely', async () => {
    await fresh();
    const registered = await registerPhone('+8562031000007');
    const refreshA = String(success(registered).refresh_token);
    const first = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: refreshA } });
    expect(first.statusCode).toBe(200); expect(first.headers['cache-control']).toBe('no-store'); expect(first.headers['pragma']).toBe('no-cache');
    const refreshB = String(success(first).refresh_token);
    const replay = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: refreshA } });
    expect(replay.statusCode).toBe(200); expect(businessCode(replay)).toBe('INVALID_CREDENTIAL');
    const second = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: refreshB } });
    expect(second.statusCode).toBe(200); expect(businessCode(second)).toBe('OK');
    const stored = await ctx.pool.query('SELECT refresh_token_hash FROM identity.sessions');
    expect(JSON.stringify(stored.rows)).not.toContain(refreshA);
    expect(JSON.stringify(stored.rows)).not.toContain(refreshB);
  });

  it('logs out the current session idempotently and all sessions with one call', async () => {
    await fresh();
    const registered = await registerPhone('+8562031000008'); const token = success(registered);
    for (let i = 0; i < 2; i++) {
      const logout = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/logout', payload: { refresh_token: String(token.refresh_token) } });
      expect(logout.statusCode).toBe(200);
      const body = envelope(logout);
      expect(body.code).toBe('OK'); expect(body.data).toBeNull();
    }
    const unknownLogout = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/logout', payload: { refresh_token: 'does-not-exist' } });
    expect(unknownLogout.statusCode).toBe(200);
    expect(envelope(unknownLogout).code).toBe('OK'); expect(envelope(unknownLogout).data).toBeNull();
    expect(businessCode(await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: String(token.refresh_token) } }))).toBe('INVALID_CREDENTIAL');
    const second = await registerPhone('+8562031000009');
    const secondData = success(second);
    const all = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/logout-all', headers: bearer(String(secondData.access_token)) });
    expect(all.statusCode).toBe(200);
    expect(envelope(all).code).toBe('OK'); expect(envelope(all).data).toBeNull();
    expect(businessCode(await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: String(secondData.refresh_token) } }))).toBe('INVALID_CREDENTIAL');
  });

  it('returns a safe identity summary without full phone or internal ids', async () => {
    await fresh();
    const phone = '+8562031000010'; const registered = await registerPhone(phone); const token = success(registered);
    const me = await ctx.app.inject({ url: '/api/v1/identity/me', headers: bearer(String(token.access_token)) });
    expect(me.statusCode).toBe(200);
    const body = success(me);
    expect(String(body.user_id)).toMatch(/^[0-9a-f-]{36}$/); expect(body.status).toBe('active'); expect(body.auth_providers).toEqual(['phone']);
    expect(body.learning_profile).toEqual(direction); expect((body.profile as Record<string, unknown>).display_name).toBeNull();
    expect(JSON.stringify(body)).not.toContain(phone);
    expect(JSON.stringify(body)).not.toContain('refresh_token');
    expect(JSON.stringify(body)).not.toContain('push_token');
    const status = await ctx.app.inject({ url: '/api/v1/identity/me/status', headers: bearer(String(token.access_token)) });
    expect(status.statusCode).toBe(200);
    expect(success(status)).toEqual({ status: 'active' });
  });

  it('reads and patches own profile preserving absent fields and clearing explicit null', async () => {
    await fresh();
    const registered = await registerPhone('+8562031000011'); const headers = bearer(String(success(registered).access_token));
    const avatar = newLogicalUuid();
    const update = await ctx.app.inject({ method: 'PATCH', url: '/api/v1/identity/me/profile', headers, payload: { display_name: 'Lao Student', gender: 'unspecified', birth_date: '2000-01-31', country_code: 'LA', region_code: 'VT', avatar_media_id: avatar } });
    expect(update.statusCode).toBe(200);
    expect(success(update)).toMatchObject({ display_name: 'Lao Student', gender: 'unspecified', birth_date: '2000-01-31', country_code: 'LA', region_code: 'VT', avatar_media_id: avatar });
    const cleared = await ctx.app.inject({ method: 'PATCH', url: '/api/v1/identity/me/profile', headers, payload: { display_name: null } });
    expect(cleared.statusCode).toBe(200);
    const clearedData = success(cleared);
    expect(clearedData.display_name).toBeNull(); expect(clearedData.gender).toBe('unspecified');
    const empty = await ctx.app.inject({ method: 'PATCH', url: '/api/v1/identity/me/profile', headers, payload: {} });
    expect(empty.statusCode).toBe(200); expect(businessCode(empty)).toBe('VALIDATION_ERROR');
    const learning = await ctx.app.inject({ url: '/api/v1/identity/me/learning-profile', headers });
    expect(learning.statusCode).toBe(200);
    expect(success(learning)).toEqual(direction);
  });

  it('lists devices without push tokens and revokes device-bound sessions', async () => {
    await fresh();
    const installation = newLogicalUuid(); const phone = '+8562031000012';
    await otpReq(phone);
    const registered = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone, otp_code: lastCode(ctx), learning_direction: direction, device: device(installation) } });
    const registeredData = success(registered);
    const headers = bearer(String(registeredData.access_token));
    const list = await ctx.app.inject({ url: '/api/v1/identity/me/devices', headers });
    expect(list.statusCode).toBe(200);
    const listData = success(list);
    expect((listData.items as Array<Record<string, unknown>>)[0]).toMatchObject({ installation_id: installation, platform: 'android', device_name: 'Pixel', revoked: false });
    expect(JSON.stringify(listData)).not.toContain('push-');
    for (let i = 0; i < 2; i++) {
      const revoke = await ctx.app.inject({ method: 'DELETE', url: `/api/v1/identity/me/devices/${installation}`, headers });
      expect(revoke.statusCode).toBe(200);
      expect(envelope(revoke).code).toBe('OK'); expect(envelope(revoke).data).toBeNull();
    }
    expect(businessCode(await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: String(registeredData.refresh_token) } }))).toBe('INVALID_CREDENTIAL');
    const missing = await ctx.app.inject({ method: 'DELETE', url: `/api/v1/identity/me/devices/${newLogicalUuid()}`, headers });
    expect(missing.statusCode).toBe(200); expect(businessCode(missing)).toBe('DEVICE_NOT_FOUND');
  });

  it('lists session metadata with device detail and no internal ids', async () => {
    await fresh();
    const registered = await registerPhone('+8562031000013');
    const sessions = await ctx.app.inject({ url: '/api/v1/identity/me/sessions', headers: bearer(String(success(registered).access_token)) });
    expect(sessions.statusCode).toBe(200);
    const item = (success(sessions).items as Array<Record<string, unknown>>)[0]!;
    expect(item.device).toMatchObject({ platform: 'android' });
    expect(JSON.stringify(item)).not.toContain('session_id');
    expect(JSON.stringify(item)).not.toContain('refresh');
  });

  it('binds and changes phone with purpose-specific OTP on the same user', async () => {
    await fresh(['opaque-2']);
    const registered = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/facebook', payload: { credential: 'opaque-2', learning_direction: direction } });
    const token = success(registered); const headers = bearer(String(token.access_token));
    const boundPhone = '+8562031000014';
    await otpReq(boundPhone, 'bind_phone', String(token.access_token)); const bindCode = lastCode(ctx);
    const bind = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/me/phone/bind', headers, payload: { phone: boundPhone, otp_code: bindCode } });
    expect(bind.statusCode).toBe(200); expect(success(bind).phone_bound).toBe(true);
    const meAfterBind = await ctx.app.inject({ url: '/api/v1/identity/me', headers });
    expect(meAfterBind.statusCode).toBe(200);
    expect((success(meAfterBind).auth_providers as Array<string>).sort()).toEqual(['facebook', 'phone']);
    const newPhone = '+8613812388888';
    await otpReq(newPhone, 'change_phone', String(token.access_token)); const changeCode = lastCode(ctx);
    const change = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/me/phone/change', headers, payload: { new_phone: newPhone, otp_code: changeCode } });
    expect(change.statusCode).toBe(200); expect(success(change).phone_changed).toBe(true);
    const oldPhoneLogin = await registerPhone(boundPhone);
    expect(success(oldPhoneLogin).is_new_user).toBe(true); expect(success(oldPhoneLogin).user_id).not.toBe(token.user_id);
    const newPhoneLogin = await registerPhone(newPhone);
    expect(success(newPhoneLogin).is_new_user).toBe(false); expect(success(newPhoneLogin).user_id).toBe(token.user_id);
    const replay = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/me/phone/bind', headers, payload: { phone: boundPhone, otp_code: bindCode } });
    expect(replay.statusCode).toBe(200); expect(businessCode(replay)).toBe('PHONE_ALREADY_BOUND');
  });

  it('enforces the authentication matrix for protected routes', async () => {
    await fresh();
    const registered = await registerPhone('+8562031000015'); const token = success(registered);
    const user = (await createIdentityRepositories(asExecutor(ctx.pool)).users.findByPublicId(parseUserPublicId(token.user_id)))!;
    const expectUnauthenticated = async (headers?: Record<string, string>) => {
      const response = await ctx.app.inject({ url: '/api/v1/identity/me', ...(headers ? { headers } : {}) });
      expect(response.statusCode).toBe(200);
      expect(businessCode(response)).toBe('UNAUTHENTICATED');
    };
    await expectUnauthenticated();
    await expectUnauthenticated(bearer('not-a-jwt'));
    const now = Math.floor(Date.now() / 1000);
    const expired = signJwt(JWT_TEST_SECRET, { sub: String(token.user_id), iat: now - 120, exp: now - 60, iss: TEST_ISSUER, aud: TEST_AUDIENCE });
    await expectUnauthenticated(bearer(expired));
    const wrongSignature = signJwt('a-different-secret-that-is-long-enough-for-hmac', { sub: String(token.user_id), iat: now, exp: now + 900, iss: TEST_ISSUER, aud: TEST_AUDIENCE });
    await expectUnauthenticated(bearer(wrongSignature));
    const valid = await ctx.app.inject({ url: '/api/v1/identity/me', headers: bearer(String(token.access_token)) });
    expect(valid.statusCode).toBe(200); expect(businessCode(valid)).toBe('OK');
    await createIdentityRepositories(asExecutor(ctx.pool)).users.updateStatus(user.id, 'disabled');
    await expectUnauthenticated(bearer(String(token.access_token)));
    await createIdentityRepositories(asExecutor(ctx.pool)).users.updateStatus(user.id, 'closed');
    await expectUnauthenticated(bearer(String(token.access_token)));
  });

  it('rejects unknown fields, status injection, internal ids, and provider_subject injection', async () => {
    await fresh();
    const registered = await registerPhone('+8562031000016'); const headers = bearer(String(success(registered).access_token));
    const unknown = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone: '+8562031000017', otp_code: '123456', learning_direction: direction, provider_subject: 'x' } });
    expect(unknown.statusCode).toBe(200); expect(businessCode(unknown)).toBe('VALIDATION_ERROR');
    for (const payload of [{ status: 'active' }, { user_id: newLogicalUuid() }, { provider_subject: 'x' }, { created_at: '2026-01-01' }, { native_language: 'lo' }]) {
      const response = await ctx.app.inject({ method: 'PATCH', url: '/api/v1/identity/me/profile', headers, payload });
      expect(response.statusCode, JSON.stringify(payload)).toBe(200);
      expect(businessCode(response), JSON.stringify(payload)).toBe('VALIDATION_ERROR');
    }
    const otpUnknownField = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/phone-otp', payload: { phone: '+8562031000018', purpose: 'login', user_id: newLogicalUuid() } });
    expect(otpUnknownField.statusCode).toBe(200); expect(businessCode(otpUnknownField)).toBe('VALIDATION_ERROR');
    const refreshUnknownField = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: 'x', access_token: 'y' } });
    expect(refreshUnknownField.statusCode).toBe(200); expect(businessCode(refreshUnknownField)).toBe('VALIDATION_ERROR');
  });

  it('emits no-store headers on every token endpoint', async () => {
    await fresh(['opaque-3']);
    const phone = '+8562031000019';
    await otpReq(phone);
    const auth = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone, otp_code: lastCode(ctx), learning_direction: direction } });
    expect(auth.headers['cache-control']).toBe('no-store'); expect(auth.headers['pragma']).toBe('no-cache');
    const fb = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/facebook', payload: { credential: 'opaque-3', learning_direction: direction } });
    expect(fb.headers['cache-control']).toBe('no-store'); expect(fb.headers['pragma']).toBe('no-cache');
    const refresh = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: String(success(auth).refresh_token) } });
    expect(refresh.headers['cache-control']).toBe('no-store'); expect(refresh.headers['pragma']).toBe('no-cache');
  });

  it('writes one canonical registration event per first registration', async () => {
    await fresh();
    const phone = '+8562031000020';
    const first = await registerPhone(phone);
    await registerPhone(phone);
    const rows = await ctx.pool.query<{ count: string }>(`SELECT count(*)::text AS count FROM infrastructure.system_outbox_events WHERE event_type='identity.user_registered.v1' AND aggregate_id=$1`, [String(success(first).user_id)]);
    expect(Number(rows.rows[0]!.count)).toBe(1);
  });
});
