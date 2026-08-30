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
      expect(response.statusCode, `${method} ${url} must not be 404`).not.toBe(404);
    }
    expect((await ctx.app.inject({ method: 'DELETE', url: `/api/v1/identity/me/devices/not-a-uuid` })).statusCode).not.toBe(404);
    expect((await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/me/unknown' })).statusCode).toBe(404);
  });

  it('requests login OTP publicly without leaking the code or registration state', async () => {
    await fresh();
    const existingPhone = '+8562031000001'; await registerPhone(existingPhone);
    const known = await otpReq(existingPhone);
    expect(known.statusCode).toBe(200);
    const knownJson = known.json();
    expect(knownJson).toEqual({ status: 'accepted', retry_after_seconds: 60 });
    const newPhone = '+8562099999999';
    const freshPhone = await otpReq(newPhone);
    expect(freshPhone.statusCode).toBe(200);
    expect(freshPhone.body).toBe(known.body);
    expect(JSON.stringify(knownJson)).not.toContain('otp');
  });

  it('requires an authenticated user for bind/change OTP and validates phone', async () => {
    await fresh();
    expect((await otpReq('+8562031000002', 'bind_phone')).statusCode).toBe(401);
    expect((await otpReq('+8562031000003', 'change_phone')).statusCode).toBe(401);
    expect((await otpReq('not-a-phone')).statusCode).toBe(400);
  });

  it('authenticates a new phone user with device and issues safe token responses', async () => {
    await fresh();
    const phone = '+8562031000005'; const response = await registerPhone(phone);
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toMatchObject({ account_status: 'active', is_new_user: true, token_type: 'Bearer', expires_in: 900 });
    expect(body.user_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(typeof body.access_token).toBe('string'); expect(typeof body.refresh_token).toBe('string');
    const identity = await createIdentityRepositories(asExecutor(ctx.pool)).authIdentities.findByProviderAndSubject('phone', normalizePhoneNumber(phone));
    expect(identity?.providerSubject).toBe(normalizePhoneNumber(phone));
    const stored = await ctx.pool.query<{ count: string }>('SELECT count(*)::text AS count FROM identity.users WHERE public_id=$1', [body.user_id]);
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
    expect(missing.statusCode).toBe(400);
    const registered = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone, otp_code: code, learning_direction: direction, device: device() } });
    expect(registered.statusCode).toBe(200); expect(registered.json().is_new_user).toBe(true);
    await otpReq(phone); const conflicting = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone, otp_code: lastCode(ctx), learning_direction: reversed, device: device() } });
    expect(conflicting.statusCode).toBe(409); expect(conflicting.json().error.code).toBe('LEARNING_DIRECTION_IMMUTABLE');
    const loginAgain = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone, otp_code: lastCode(ctx), learning_direction: direction, device: device() } });
    expect(loginAgain.statusCode).toBe(200); expect(loginAgain.json().is_new_user).toBe(false);
  });

  it('registers and logs in via Facebook and rejects spoofed trusted subjects', async () => {
    await fresh(['opaque']);
    const facebook = (payload: Record<string, unknown>) => ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/facebook', payload });
    const spoofed = await facebook({ credential: 'opaque', provider_subject: 'fb-1', facebook_user_id: 'fb-1', learning_direction: direction, device: device() });
    expect(spoofed.statusCode).toBe(400); expect(spoofed.json().error.code).toBe('VALIDATION_ERROR');
    const fbRegister = await facebook({ credential: 'opaque', learning_direction: direction, device: device() });
    expect(fbRegister.statusCode).toBe(200); expect(fbRegister.json().is_new_user).toBe(true);
    const fbLogin = await facebook({ credential: 'opaque' });
    expect(fbLogin.statusCode).toBe(200); expect(fbLogin.json().is_new_user).toBe(false); expect(fbLogin.json().user_id).toBe(fbRegister.json().user_id);
    const invalid = await facebook({ credential: 'unknown', learning_direction: direction });
    expect(invalid.statusCode).toBe(401); expect(invalid.json().error.code).toBe('INVALID_CREDENTIAL');
  });

  it('rotates refresh tokens with no-store headers and maps replay and revocation safely', async () => {
    await fresh();
    const registered = await registerPhone('+8562031000007');
    const refreshA = registered.json().refresh_token;
    const first = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: refreshA } });
    expect(first.statusCode).toBe(200); expect(first.headers['cache-control']).toBe('no-store'); expect(first.headers['pragma']).toBe('no-cache');
    const refreshB = first.json().refresh_token;
    const replay = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: refreshA } });
    expect(replay.statusCode).toBe(401); expect(replay.json().error.code).toBe('INVALID_CREDENTIAL');
    expect((await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: refreshB } })).statusCode).toBe(200);
    const stored = await ctx.pool.query('SELECT refresh_token_hash FROM identity.sessions');
    expect(JSON.stringify(stored.rows)).not.toContain(refreshA);
    expect(JSON.stringify(stored.rows)).not.toContain(refreshB);
  });

  it('logs out the current session idempotently and all sessions with one call', async () => {
    await fresh();
    const registered = await registerPhone('+8562031000008'); const token = registered.json();
    for (let i = 0; i < 2; i++) {
      const logout = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/logout', payload: { refresh_token: token.refresh_token } });
      expect(logout.statusCode).toBe(204);
    }
    expect((await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/logout', payload: { refresh_token: 'does-not-exist' } })).statusCode).toBe(204);
    expect((await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: token.refresh_token } })).statusCode).toBe(401);
    const second = await registerPhone('+8562031000009');
    const all = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/logout-all', headers: bearer(second.json().access_token) });
    expect(all.statusCode).toBe(204);
    expect((await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: second.json().refresh_token } })).statusCode).toBe(401);
  });

  it('returns a safe identity summary without full phone or internal ids', async () => {
    await fresh();
    const phone = '+8562031000010'; const registered = await registerPhone(phone); const token = registered.json();
    const me = await ctx.app.inject({ url: '/api/v1/identity/me', headers: bearer(token.access_token) });
    expect(me.statusCode).toBe(200);
    const body = me.json();
    expect(body.user_id).toMatch(/^[0-9a-f-]{36}$/); expect(body.status).toBe('active'); expect(body.auth_providers).toEqual(['phone']);
    expect(body.learning_profile).toEqual(direction); expect(body.profile.display_name).toBeNull();
    expect(JSON.stringify(body)).not.toContain(phone);
    expect(JSON.stringify(body)).not.toContain('refresh_token');
    expect(JSON.stringify(body)).not.toContain('push_token');
    expect((await ctx.app.inject({ url: '/api/v1/identity/me/status', headers: bearer(token.access_token) })).json()).toEqual({ status: 'active' });
  });

  it('reads and patches own profile preserving absent fields and clearing explicit null', async () => {
    await fresh();
    const registered = await registerPhone('+8562031000011'); const headers = bearer(registered.json().access_token);
    const avatar = newLogicalUuid();
    const update = await ctx.app.inject({ method: 'PATCH', url: '/api/v1/identity/me/profile', headers, payload: { display_name: 'Lao Student', gender: 'unspecified', birth_date: '2000-01-31', country_code: 'LA', region_code: 'VT', avatar_media_id: avatar } });
    expect(update.statusCode).toBe(200);
    expect(update.json()).toMatchObject({ display_name: 'Lao Student', gender: 'unspecified', birth_date: '2000-01-31', country_code: 'LA', region_code: 'VT', avatar_media_id: avatar });
    const cleared = await ctx.app.inject({ method: 'PATCH', url: '/api/v1/identity/me/profile', headers, payload: { display_name: null } });
    expect(cleared.json().display_name).toBeNull(); expect(cleared.json().gender).toBe('unspecified');
    expect((await ctx.app.inject({ method: 'PATCH', url: '/api/v1/identity/me/profile', headers, payload: {} })).statusCode).toBe(400);
    expect((await ctx.app.inject({ url: '/api/v1/identity/me/learning-profile', headers })).json()).toEqual(direction);
  });

  it('lists devices without push tokens and revokes device-bound sessions', async () => {
    await fresh();
    const installation = newLogicalUuid(); const phone = '+8562031000012';
    await otpReq(phone);
    const registered = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone, otp_code: lastCode(ctx), learning_direction: direction, device: device(installation) } });
    const headers = bearer(registered.json().access_token);
    const list = await ctx.app.inject({ url: '/api/v1/identity/me/devices', headers });
    expect(list.statusCode).toBe(200);
    expect(list.json().items[0]).toMatchObject({ installation_id: installation, platform: 'android', device_name: 'Pixel', revoked: false });
    expect(JSON.stringify(list.json())).not.toContain('push-');
    expect((await ctx.app.inject({ method: 'DELETE', url: `/api/v1/identity/me/devices/${installation}`, headers })).statusCode).toBe(204);
    expect((await ctx.app.inject({ method: 'DELETE', url: `/api/v1/identity/me/devices/${installation}`, headers })).statusCode).toBe(204);
    expect((await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: registered.json().refresh_token } })).statusCode).toBe(401);
    expect((await ctx.app.inject({ method: 'DELETE', url: `/api/v1/identity/me/devices/${newLogicalUuid()}`, headers })).statusCode).toBe(404);
  });

  it('lists session metadata with device detail and no internal ids', async () => {
    await fresh();
    const registered = await registerPhone('+8562031000013');
    const sessions = await ctx.app.inject({ url: '/api/v1/identity/me/sessions', headers: bearer(registered.json().access_token) });
    expect(sessions.statusCode).toBe(200);
    const item = sessions.json().items[0];
    expect(item.device).toMatchObject({ platform: 'android' });
    expect(JSON.stringify(item)).not.toContain('session_id');
    expect(JSON.stringify(item)).not.toContain('refresh');
  });

  it('binds and changes phone with purpose-specific OTP on the same user', async () => {
    await fresh(['opaque-2']);
    const registered = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/facebook', payload: { credential: 'opaque-2', learning_direction: direction } });
    const token = registered.json(); const headers = bearer(token.access_token);
    const boundPhone = '+8562031000014';
    await otpReq(boundPhone, 'bind_phone', token.access_token); const bindCode = lastCode(ctx);
    const bind = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/me/phone/bind', headers, payload: { phone: boundPhone, otp_code: bindCode } });
    expect(bind.statusCode).toBe(200); expect(bind.json().phone_bound).toBe(true);
    expect((await ctx.app.inject({ url: '/api/v1/identity/me', headers })).json().auth_providers.sort()).toEqual(['facebook', 'phone']);
    const newPhone = '+8613812388888';
    await otpReq(newPhone, 'change_phone', token.access_token); const changeCode = lastCode(ctx);
    const change = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/me/phone/change', headers, payload: { new_phone: newPhone, otp_code: changeCode } });
    expect(change.statusCode).toBe(200); expect(change.json().phone_changed).toBe(true);
    const oldPhoneLogin = await registerPhone(boundPhone); expect(oldPhoneLogin.json().is_new_user).toBe(true); expect(oldPhoneLogin.json().user_id).not.toBe(token.user_id);
    const newPhoneLogin = await registerPhone(newPhone); expect(newPhoneLogin.json().is_new_user).toBe(false); expect(newPhoneLogin.json().user_id).toBe(token.user_id);
    const replay = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/me/phone/bind', headers, payload: { phone: boundPhone, otp_code: bindCode } });
    expect(replay.statusCode).toBe(409);
  });

  it('enforces the authentication matrix for protected routes', async () => {
    await fresh();
    const registered = await registerPhone('+8562031000015'); const token = registered.json();
    const user = (await createIdentityRepositories(asExecutor(ctx.pool)).users.findByPublicId(parseUserPublicId(token.user_id)))!;
    expect((await ctx.app.inject('/api/v1/identity/me')).statusCode).toBe(401);
    expect((await ctx.app.inject({ url: '/api/v1/identity/me', headers: bearer('not-a-jwt') })).statusCode).toBe(401);
    const now = Math.floor(Date.now() / 1000);
    const expired = signJwt(JWT_TEST_SECRET, { sub: token.user_id, iat: now - 120, exp: now - 60, iss: TEST_ISSUER, aud: TEST_AUDIENCE });
    expect((await ctx.app.inject({ url: '/api/v1/identity/me', headers: bearer(expired) })).statusCode).toBe(401);
    const wrongSignature = signJwt('a-different-secret-that-is-long-enough-for-hmac', { sub: token.user_id, iat: now, exp: now + 900, iss: TEST_ISSUER, aud: TEST_AUDIENCE });
    expect((await ctx.app.inject({ url: '/api/v1/identity/me', headers: bearer(wrongSignature) })).statusCode).toBe(401);
    expect((await ctx.app.inject({ url: '/api/v1/identity/me', headers: bearer(token.access_token) })).statusCode).toBe(200);
    await createIdentityRepositories(asExecutor(ctx.pool)).users.updateStatus(user.id, 'disabled');
    expect((await ctx.app.inject({ url: '/api/v1/identity/me', headers: bearer(token.access_token) })).statusCode).toBe(401);
    await createIdentityRepositories(asExecutor(ctx.pool)).users.updateStatus(user.id, 'closed');
    expect((await ctx.app.inject({ url: '/api/v1/identity/me', headers: bearer(token.access_token) })).statusCode).toBe(401);
  });

  it('rejects unknown fields, status injection, internal ids, and provider_subject injection', async () => {
    await fresh();
    const registered = await registerPhone('+8562031000016'); const headers = bearer(registered.json().access_token);
    const unknown = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone: '+8562031000017', otp_code: '123456', learning_direction: direction, provider_subject: 'x' } });
    expect(unknown.statusCode).toBe(400); expect(unknown.json().error.code).toBe('VALIDATION_ERROR');
    for (const payload of [{ status: 'active' }, { user_id: newLogicalUuid() }, { provider_subject: 'x' }, { created_at: '2026-01-01' }, { native_language: 'lo' }]) {
      const response = await ctx.app.inject({ method: 'PATCH', url: '/api/v1/identity/me/profile', headers, payload });
      expect(response.statusCode, JSON.stringify(payload)).toBe(400);
    }
    expect((await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/phone-otp', payload: { phone: '+8562031000018', purpose: 'login', user_id: newLogicalUuid() } })).statusCode).toBe(400);
    expect((await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: 'x', access_token: 'y' } })).statusCode).toBe(400);
  });

  it('emits no-store headers on every token endpoint', async () => {
    await fresh(['opaque-3']);
    const phone = '+8562031000019';
    await otpReq(phone);
    const auth = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone, otp_code: lastCode(ctx), learning_direction: direction } });
    expect(auth.headers['cache-control']).toBe('no-store'); expect(auth.headers['pragma']).toBe('no-cache');
    const fb = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/facebook', payload: { credential: 'opaque-3', learning_direction: direction } });
    expect(fb.headers['cache-control']).toBe('no-store'); expect(fb.headers['pragma']).toBe('no-cache');
    const refresh = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: auth.json().refresh_token } });
    expect(refresh.headers['cache-control']).toBe('no-store'); expect(refresh.headers['pragma']).toBe('no-cache');
  });

  it('writes one canonical registration event per first registration', async () => {
    await fresh();
    const phone = '+8562031000020';
    const first = await registerPhone(phone);
    await registerPhone(phone);
    const rows = await ctx.pool.query<{ count: string }>(`SELECT count(*)::text AS count FROM infrastructure.system_outbox_events WHERE event_type='identity.user_registered.v1' AND aggregate_id=$1`, [first.json().user_id]);
    expect(Number(rows.rows[0]!.count)).toBe(1);
  });
});