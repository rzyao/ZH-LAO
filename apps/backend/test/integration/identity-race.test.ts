import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { asExecutor } from '../../src/database/pool.js';
import { OutboxWriter } from '../../src/outbox/outbox-writer.js';
import { DeviceLifecycle, IdentityEventWriter, IdentityState, RequestPhoneOtp } from '../../src/modules/identity/application/index.js';
import { CryptoOtpGenerator, FakeOtpDeliveryProvider, HmacOtpHasher, type FacebookCredentialVerifier } from '../../src/modules/identity/application/services/index.js';
import { createIdentityRepositories } from '../../src/modules/identity/infrastructure/index.js';
import { normalizePhoneNumber, parseInstallationId, parseUserPublicId, type OtpPurpose } from '../../src/modules/identity/domain/index.js';
import { newLogicalUuid } from '../../src/ids/uuid.js';
import { buildIdentityTestApp, OTP_TEST_SECRET, type IdentityTestApp } from '../support/identity-app.js';

const adminUrl = process.env.ADMIN_DATABASE_URL;
const integration = adminUrl ? describe : describe.skip;
const logger = pino({ level: 'silent' });
const direction = { native_language: 'lo', learning_language: 'zh' } as const;
const device = (installationId = newLogicalUuid()) => ({ installation_id: installationId, platform: 'android', push_token: `push-${installationId}` });
const lastCode = (ctx: IdentityTestApp) => ctx.delivery.deliveries.at(-1)!.code;
const bearer = (token: string) => ({ authorization: `Bearer ${token}` });

async function withApp(fn: (ctx: IdentityTestApp) => Promise<void>, options: { facebook?: ReadonlyMap<string, string>; verifier?: FacebookCredentialVerifier } = {}) {
  const ctx = await buildIdentityTestApp({ logger, ...(options.facebook ? { facebookSubjects: options.facebook } : {}), ...(options.verifier ? { facebookVerifier: options.verifier } : {}) });
  try { await fn(ctx); } finally { await ctx.dispose(); }
}
async function otpReq(ctx: IdentityTestApp, phone: string, purpose: OtpPurpose = 'login', token?: string) { return ctx.app.inject({ method: 'POST', url: '/api/v1/identity/phone-otp', headers: token ? bearer(token) : {}, payload: { phone, purpose } }); }
async function phoneLogin(ctx: IdentityTestApp, phone: string) { await otpReq(ctx, phone); return ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone, otp_code: lastCode(ctx), learning_direction: direction, device: device() } }); }
const dbCount = async (ctx: IdentityTestApp, sql: string, values: readonly unknown[] = []) => { const r = await ctx.pool.query<{ count: string }>(sql, values as unknown[]); return Number(r.rows[0]!.count); };

integration('IDN-19 identity race hardening', () => {
  it('OTP request race keeps exactly one valid pending challenge per phone and purpose', async () => {
    await withApp(async (ctx) => {
      const delivery = new FakeOtpDeliveryProvider();
      const useCase = new RequestPhoneOtp(ctx.transactions, createIdentityRepositories, new CryptoOtpGenerator(), new HmacOtpHasher(OTP_TEST_SECRET), delivery);
      const phone = '+8562071000001';
      const results = await Promise.allSettled(Array.from({ length: 4 }, () => useCase.execute({ phone, purpose: 'login', ip: '10.1.1.1' })));
      expect(results.filter((result) => result.status === 'fulfilled').length).toBeGreaterThanOrEqual(1);
      const pending = await dbCount(ctx, "SELECT count(*) AS count FROM identity.otp_challenges WHERE phone_number=$1 AND purpose=$2 AND status='pending'", [normalizePhoneNumber(phone), 'login']);
      expect(pending).toBe(1);
    });
  });

  it('OTP consume race allows exactly one success per code', async () => {
    await withApp(async (ctx) => {
      const phone = '+8562071000002'; await otpReq(ctx, phone); const code = lastCode(ctx);
      const attempt = () => ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone, otp_code: code, learning_direction: direction, device: device() } });
      const results = await Promise.allSettled([attempt(), attempt(), attempt()]);
      const succeeded = results.filter((result) => result.status === 'fulfilled' && result.value.statusCode === 200);
      expect(succeeded).toHaveLength(1);
      expect(await dbCount(ctx, 'SELECT count(*) AS count FROM identity.users', [])).toBe(1);
      expect(await dbCount(ctx, "SELECT count(*) AS count FROM infrastructure.system_outbox_events WHERE event_type='identity.user_registered.v1'", [])).toBe(1);
    });
  });

  it('OTP attempt race never loses attempts and locks at the limit', async () => {
    await withApp(async (ctx) => {
      const phone = '+8562071000003'; await otpReq(ctx, phone); const code = lastCode(ctx); const wrong = code === '000000' ? '000001' : '000000';
      const attempt = () => ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone, otp_code: wrong, learning_direction: direction, device: device() } });
      for (let i = 0; i < 4; i++) expect((await attempt()).statusCode).toBe(400);
      const results = await Promise.allSettled(Array.from({ length: 5 }, () => attempt()));
      expect(results.some((result) => result.status === 'fulfilled' && result.value.statusCode === 400)).toBe(true);
      const challenge = await ctx.pool.query('SELECT attempt_count, status FROM identity.otp_challenges WHERE phone_number=$1 AND purpose=$2', [normalizePhoneNumber(phone), 'login']);
      expect(Number(challenge.rows[0]!.attempt_count)).toBe(5);
      expect(String(challenge.rows[0]!.status)).toBe('locked');
      const afterLock = await attempt();
      expect(afterLock.statusCode).toBe(409);
    });
  });

  it('phone registration race produces a single canonical user, profile, and event', async () => {
    await withApp(async (ctx) => {
      const phone = '+8562071000004'; await otpReq(ctx, phone); const code = lastCode(ctx);
      const attempt = () => ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone, otp_code: code, learning_direction: direction, device: device() } });
      const results = await Promise.allSettled(Array.from({ length: 4 }, () => attempt()));
      expect(results.filter((result) => result.status === 'fulfilled' && result.value.statusCode === 200)).toHaveLength(1);
      const identity = await createIdentityRepositories(asExecutor(ctx.pool)).authIdentities.findByProviderAndSubject('phone', normalizePhoneNumber(phone));
      expect(identity).not.toBeNull();
      expect(await dbCount(ctx, 'SELECT count(*) AS count FROM identity.users', [])).toBe(1);
      expect(await dbCount(ctx, 'SELECT count(*) AS count FROM identity.auth_identities WHERE provider=$1', ['phone'])).toBe(1);
      expect(await dbCount(ctx, 'SELECT count(*) AS count FROM identity.basic_profiles', [])).toBe(1);
      expect(await dbCount(ctx, 'SELECT count(*) AS count FROM identity.learning_profiles', [])).toBe(1);
      expect(await dbCount(ctx, "SELECT count(*) AS count FROM infrastructure.system_outbox_events WHERE event_type='identity.user_registered.v1'", [])).toBe(1);
      const orphans = await ctx.pool.query('SELECT count(*)::text AS count FROM identity.users u WHERE NOT EXISTS (SELECT 1 FROM identity.auth_identities a WHERE a.user_id = u.id)');
      expect(Number(orphans.rows[0]!.count)).toBe(0);
    });
  });

  it('facebook registration race produces a single canonical user and event', async () => {
    const subjects = new Map([['c1', 'same-fb-subject'], ['c2', 'same-fb-subject'], ['c3', 'same-fb-subject']]);
    await withApp(async (ctx) => {
      const attempt = (credential: string) => ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/facebook', payload: { credential, learning_direction: direction, device: device() } });
      const results = await Promise.allSettled([attempt('c1'), attempt('c2'), attempt('c3')]);
      expect(results.filter((result) => result.status === 'fulfilled' && result.value.statusCode === 200)).toHaveLength(1);
      expect(await dbCount(ctx, 'SELECT count(*) AS count FROM identity.users', [])).toBe(1);
      expect(await dbCount(ctx, 'SELECT count(*) AS count FROM identity.auth_identities WHERE provider=$1', ['facebook'])).toBe(1);
      expect(await dbCount(ctx, "SELECT count(*) AS count FROM infrastructure.system_outbox_events WHERE event_type='identity.user_registered.v1'", [])).toBe(1);
    }, { facebook: subjects });
  });

  it('bind phone race keeps at most one phone auth identity per user', async () => {
    await withApp(async (ctx) => {
      const fb = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/facebook', payload: { credential: 'opaque', learning_direction: direction } });
      const user = (await createIdentityRepositories(asExecutor(ctx.pool)).users.findByPublicId(parseUserPublicId(fb.json().user_id)))!;
      const phone = '+8562071000005';
      await otpReq(ctx, phone, 'bind_phone', fb.json().access_token); const code = lastCode(ctx);
      const attempt = () => ctx.app.inject({ method: 'POST', url: '/api/v1/identity/me/phone/bind', headers: bearer(fb.json().access_token), payload: { phone, otp_code: code } });
      const results = await Promise.allSettled([attempt(), attempt(), attempt()]);
      expect(results.filter((result) => result.status === 'fulfilled' && result.value.statusCode === 200)).toHaveLength(1);
      expect(await dbCount(ctx, 'SELECT count(*) AS count FROM identity.auth_identities WHERE user_id=$1 AND provider=$2', [user.id.toString(), 'phone'])).toBe(1);
      expect(await dbCount(ctx, 'SELECT count(*) AS count FROM identity.users', [])).toBe(1);
    }, { facebook: new Map([['opaque', 'fb-bind-owner']]) });
  });

  it('change phone race keeps exactly one phone auth identity', async () => {
    await withApp(async (ctx) => {
      const registered = await phoneLogin(ctx, '+8562071000006'); const headers = bearer(registered.json().access_token);
      const first = '+8562071000007'; const second = '+8562071000008';
      await otpReq(ctx, first, 'change_phone', registered.json().access_token); const codeA = lastCode(ctx);
      await otpReq(ctx, second, 'change_phone', registered.json().access_token); const codeB = lastCode(ctx);
      const results = await Promise.allSettled([
        ctx.app.inject({ method: 'POST', url: '/api/v1/identity/me/phone/change', headers, payload: { new_phone: first, otp_code: codeA } }),
        ctx.app.inject({ method: 'POST', url: '/api/v1/identity/me/phone/change', headers, payload: { new_phone: second, otp_code: codeB } })
      ]);
      expect(results.some((result) => result.status === 'fulfilled' && result.value.statusCode === 200)).toBe(true);
      const user = (await createIdentityRepositories(asExecutor(ctx.pool)).users.findByPublicId(parseUserPublicId(registered.json().user_id)))!;
      expect(await dbCount(ctx, 'SELECT count(*) AS count FROM identity.auth_identities WHERE user_id=$1 AND provider=$2', [user.id.toString(), 'phone'])).toBe(1);
    });
  });

  it('refresh race produces exactly one successor', async () => {
    await withApp(async (ctx) => {
      const registered = await phoneLogin(ctx, '+8562071000009'); const refresh = registered.json().refresh_token;
      const attempt = () => ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: refresh } });
      const results = await Promise.allSettled([attempt(), attempt(), attempt()]);
      expect(results.filter((result) => result.status === 'fulfilled' && result.value.statusCode === 200)).toHaveLength(1);
      expect(await dbCount(ctx, "SELECT count(*) AS count FROM identity.sessions WHERE status='active' AND user_id = (SELECT id FROM identity.users LIMIT 1)", [])).toBe(1);
    });
  });

  it('logout vs refresh stays consistent: logout never leaves a stale refresh alive', async () => {
    await withApp(async (ctx) => {
      const registered = await phoneLogin(ctx, '+8562071000010'); const token = registered.json();
      const [l, r] = await Promise.allSettled([
        ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/logout', payload: { refresh_token: token.refresh_token } }),
        ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: token.refresh_token } })
      ]);
      const logoutOk = l.status === 'fulfilled' && l.value.statusCode === 204;
      const refreshOk = r.status === 'fulfilled' && r.value.statusCode === 200;
      if (refreshOk) {
        const rotated = (r as { value: { json(): { refresh_token: string } } }).value.json().refresh_token;
        expect((await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: rotated } })).statusCode).toBe(200);
        await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/logout-all', headers: bearer(token.access_token) });
      } else {
        expect(logoutOk).toBe(true);
        expect(await dbCount(ctx, "SELECT count(*) AS count FROM identity.sessions WHERE status='active'", [])).toBe(0);
      }
    });
  });

  it('logout-all vs refresh never leaves an active session', async () => {
    await withApp(async (ctx) => {
      const registered = await phoneLogin(ctx, '+8562071000011'); const token = registered.json();
      const [logoutAll, refresh] = await Promise.allSettled([
        ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/logout-all', headers: bearer(token.access_token) }),
        ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: token.refresh_token } })
      ]);
      expect(logoutAll.status === 'fulfilled' && logoutAll.value.statusCode === 204).toBe(true);
      void refresh;
      expect(await dbCount(ctx, "SELECT count(*) AS count FROM identity.sessions WHERE status='active'", [])).toBe(0);
    });
  });

  it('device revoke vs refresh leaves no usable refresh for the session', async () => {
    await withApp(async (ctx) => {
      const installation = newLogicalUuid(); const phone = '+8562071000012';
      await otpReq(ctx, phone);
      const registered = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone, otp_code: lastCode(ctx), learning_direction: direction, device: device(installation) } });
      const token = registered.json();
      const devices = new DeviceLifecycle(ctx.transactions, createIdentityRepositories);
      const [revoked, refreshed] = await Promise.allSettled([
        devices.revokeDevice(parseUserPublicId(token.user_id), parseInstallationId(installation)),
        ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: token.refresh_token } })
      ]);
      expect(revoked.status).toBe('fulfilled');
      expect(await dbCount(ctx, "SELECT count(*) AS count FROM identity.sessions WHERE status='active'", [])).toBe(0);
      const rotated = refreshed.status === 'fulfilled' && refreshed.value.statusCode === 200 ? refreshed.value.json().refresh_token : token.refresh_token;
      expect((await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: rotated } })).statusCode).toBe(401);
    });
  });

  it('device restore race is self-consistent under the device row lock', async () => {
    await withApp(async (ctx) => {
      const phone = '+8562071000013'; const registered = await phoneLogin(ctx, phone);
      const repos = createIdentityRepositories(asExecutor(ctx.pool));
      const user = (await repos.users.findByPublicId(parseUserPublicId(registered.json().user_id)))!;
      const installed = await repos.devices.create({ userId: user.id, installationId: parseInstallationId(newLogicalUuid()), platform: 'android' });
      await repos.devices.revoke(installed.id, new Date());
      const [restore, revoke] = await Promise.allSettled([
        repos.devices.restoreForSameUser(installed.id, user.id),
        repos.devices.revoke(installed.id, new Date())
      ]);
      expect(restore.status).toBe('fulfilled'); expect(revoke.status).toBe('fulfilled');
      const device = (await repos.devices.findByUserId(user.id))[0]!;
      const activeSessions = await dbCount(ctx, "SELECT count(*) AS count FROM identity.sessions WHERE status='active'", []);
      expect(activeSessions).toBe(1);
      if (device.revokedAt === null) {
        expect((await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: registered.json().refresh_token } })).statusCode).toBe(200);
      } else {
        expect((await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: registered.json().refresh_token } })).statusCode).toBe(401);
      }
    });
  });

  it('push token race preserves the partial unique invariant', async () => {
    await withApp(async (ctx) => {
      const phone = '+8562071000014'; const registered = await phoneLogin(ctx, phone);
      const repos = createIdentityRepositories(asExecutor(ctx.pool));
      const user = (await repos.users.findByPublicId(parseUserPublicId(registered.json().user_id)))!;
      const installationA = newLogicalUuid(); const installationB = newLogicalUuid();
      await repos.devices.create({ userId: user.id, installationId: parseInstallationId(installationA), platform: 'android' });
      await repos.devices.create({ userId: user.id, installationId: parseInstallationId(installationB), platform: 'android' });
      const claimedToken = `shared-push-${newLogicalUuid()}`;
      const devices = new DeviceLifecycle(ctx.transactions, createIdentityRepositories);
      const results = await Promise.allSettled([
        devices.registerOrUpdate(parseUserPublicId(registered.json().user_id), { installationId: parseInstallationId(installationA), platform: 'android', pushToken: claimedToken }),
        devices.registerOrUpdate(parseUserPublicId(registered.json().user_id), { installationId: parseInstallationId(installationB), platform: 'android', pushToken: claimedToken })
      ]);
      expect(results.some((result) => result.status === 'fulfilled')).toBe(true);
      expect(await dbCount(ctx, 'SELECT count(*) AS count FROM identity.devices WHERE push_token=$1 AND revoked_at IS NULL', [claimedToken])).toBe(1);
    });
  });

  it('disable vs refresh leaves no usable active session', async () => {
    await withApp(async (ctx) => {
      const phone = '+8562071000015'; const registered = await phoneLogin(ctx, phone); const token = registered.json();
      const state = new IdentityState(ctx.transactions, createIdentityRepositories, new IdentityEventWriter(new OutboxWriter()));
      const [disabled, refreshed] = await Promise.allSettled([
        state.changeStatus(parseUserPublicId(token.user_id), 'disabled'),
        ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: token.refresh_token } })
      ]);
      expect(disabled.status).toBe('fulfilled');
      expect((await ctx.pool.query('SELECT status FROM identity.users LIMIT 1')).rows[0]!.status).toBe('disabled');
      expect(await dbCount(ctx, "SELECT count(*) AS count FROM identity.sessions WHERE status='active'", [])).toBe(0);
      const rotated = refreshed.status === 'fulfilled' && refreshed.value.statusCode === 200 ? refreshed.value.json().refresh_token : token.refresh_token;
      expect((await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: rotated } })).statusCode).toBe(401);
    });
  });

  it('close vs login never leaves an active session for a closed user', async () => {
    await withApp(async (ctx) => {
      const phone = '+8562071000016'; const registered = await phoneLogin(ctx, phone);
      const userId = registered.json().user_id;
      await otpReq(ctx, phone); const loginCode = lastCode(ctx);
      const state = new IdentityState(ctx.transactions, createIdentityRepositories, new IdentityEventWriter(new OutboxWriter()));
      const login = () => ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone, otp_code: loginCode, learning_direction: direction, device: device() } });
      const [closed, loggedIn] = await Promise.allSettled([
        state.changeStatus(parseUserPublicId(userId), 'closed'),
        login()
      ]);
      expect(closed.status).toBe('fulfilled');
      expect((await ctx.pool.query('SELECT status FROM identity.users LIMIT 1')).rows[0]!.status).toBe('closed');
      expect(await dbCount(ctx, "SELECT count(*) AS count FROM identity.sessions WHERE status='active'", [])).toBe(0);
      if (loggedIn.status === 'fulfilled' && loggedIn.value.statusCode === 200) {
        expect((await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: loggedIn.value.json().refresh_token } })).statusCode).toBe(401);
      }
      expect(await dbCount(ctx, 'SELECT count(*) AS count FROM identity.users', [])).toBe(1);
    });
  });
});