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
// ADR-023 统一信封断言：HTTP 一律 200，并发胜负必须由顶层业务 code 判定（成功 `OK`），不能再依赖 HTTP 状态码。
type Envelope = { code: string; data: unknown; error?: { message: string; details?: unknown }; request_id: string };
const envelope = (response: { json(): unknown }): Envelope => response.json() as Envelope;
const success = (response: { json(): unknown }): Record<string, unknown> => {
  const body = envelope(response);
  expect(body.code).toBe('OK');
  return body.data as Record<string, unknown>;
};
const businessCode = (response: { json(): unknown }): string => envelope(response).code;

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
      const succeeded = results.filter((result) => result.status === 'fulfilled' && businessCode(result.value) === 'OK');
      expect(succeeded).toHaveLength(1);
      expect(await dbCount(ctx, 'SELECT count(*) AS count FROM identity.users', [])).toBe(1);
      expect(await dbCount(ctx, "SELECT count(*) AS count FROM infrastructure.system_outbox_events WHERE event_type='identity.user_registered.v1'", [])).toBe(1);
    });
  });

  it('OTP attempt race never loses attempts and locks at the limit', async () => {
    await withApp(async (ctx) => {
      const phone = '+8562071000003'; await otpReq(ctx, phone); const code = lastCode(ctx); const wrong = code === '000000' ? '000001' : '000000';
      const attempt = () => ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone, otp_code: wrong, learning_direction: direction, device: device() } });
      for (let i = 0; i < 4; i++) {
        const failed = await attempt();
        expect(failed.statusCode).toBe(200);
        expect(businessCode(failed)).toBe('OTP_INVALID');
      }
      const results = await Promise.allSettled(Array.from({ length: 5 }, () => attempt()));
      expect(results.some((result) => result.status === 'fulfilled' && businessCode(result.value) === 'OTP_LOCKED')).toBe(true);
      expect(results.every((result) => result.status === 'fulfilled' && businessCode(result.value) !== 'OK')).toBe(true);
      const challenge = await ctx.pool.query('SELECT attempt_count, status FROM identity.otp_challenges WHERE phone_number=$1 AND purpose=$2', [normalizePhoneNumber(phone), 'login']);
      expect(Number(challenge.rows[0]!.attempt_count)).toBe(5);
      expect(String(challenge.rows[0]!.status)).toBe('locked');
      const afterLock = await attempt();
      expect(afterLock.statusCode).toBe(200);
      expect(businessCode(afterLock)).toBe('OTP_ALREADY_USED');
    });
  });

  it('phone registration race produces a single canonical user, profile, and event', async () => {
    await withApp(async (ctx) => {
      const phone = '+8562071000004'; await otpReq(ctx, phone); const code = lastCode(ctx);
      const attempt = () => ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone, otp_code: code, learning_direction: direction, device: device() } });
      const results = await Promise.allSettled(Array.from({ length: 4 }, () => attempt()));
      expect(results.filter((result) => result.status === 'fulfilled' && businessCode(result.value) === 'OK')).toHaveLength(1);
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
      const responses = results.map((result) => { expect(result.status).toBe('fulfilled'); return (result as PromiseFulfilledResult<{ statusCode: number; json(): unknown }>).value; });
      for (const response of responses) expect(response.statusCode).toBe(200);
      // ADR-023：HTTP 一律 200，并发结果由业务码判定。Facebook 注册路径无共享行锁，
      // 交错决定其余请求是「登录既有用户」(OK, is_new_user=false) 还是被唯一约束拒绝 (CONFLICT)；
      // 不变量是恰好一个请求完成新用户创建，且库内只有一个规范用户/身份/注册事件。
      const creations = responses.filter((response) => {
        const body = envelope(response);
        return body.code === 'OK' && (body.data as { is_new_user?: boolean } | null)?.is_new_user === true;
      });
      expect(creations).toHaveLength(1);
      for (const response of responses) {
        const code = businessCode(response);
        expect(code === 'OK' || code === 'CONFLICT').toBe(true);
      }
      expect(await dbCount(ctx, 'SELECT count(*) AS count FROM identity.users', [])).toBe(1);
      expect(await dbCount(ctx, 'SELECT count(*) AS count FROM identity.auth_identities WHERE provider=$1', ['facebook'])).toBe(1);
      expect(await dbCount(ctx, "SELECT count(*) AS count FROM infrastructure.system_outbox_events WHERE event_type='identity.user_registered.v1'", [])).toBe(1);
    }, { facebook: subjects });
  });

  it('bind phone race keeps at most one phone auth identity per user', async () => {
    await withApp(async (ctx) => {
      const fb = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/facebook', payload: { credential: 'opaque', learning_direction: direction } });
      const fbData = success(fb);
      const user = (await createIdentityRepositories(asExecutor(ctx.pool)).users.findByPublicId(parseUserPublicId(fbData.user_id)))!;
      const phone = '+8562071000005';
      await otpReq(ctx, phone, 'bind_phone', String(fbData.access_token)); const code = lastCode(ctx);
      const attempt = () => ctx.app.inject({ method: 'POST', url: '/api/v1/identity/me/phone/bind', headers: bearer(String(fbData.access_token)), payload: { phone, otp_code: code } });
      const results = await Promise.allSettled([attempt(), attempt(), attempt()]);
      expect(results.filter((result) => result.status === 'fulfilled' && businessCode(result.value) === 'OK')).toHaveLength(1);
      expect(await dbCount(ctx, 'SELECT count(*) AS count FROM identity.auth_identities WHERE user_id=$1 AND provider=$2', [user.id.toString(), 'phone'])).toBe(1);
      expect(await dbCount(ctx, 'SELECT count(*) AS count FROM identity.users', [])).toBe(1);
    }, { facebook: new Map([['opaque', 'fb-bind-owner']]) });
  });

  it('change phone race keeps exactly one phone auth identity', async () => {
    await withApp(async (ctx) => {
      const registered = await phoneLogin(ctx, '+8562071000006'); const registeredData = success(registered); const headers = bearer(String(registeredData.access_token));
      const first = '+8562071000007'; const second = '+8562071000008';
      await otpReq(ctx, first, 'change_phone', String(registeredData.access_token)); const codeA = lastCode(ctx);
      await otpReq(ctx, second, 'change_phone', String(registeredData.access_token)); const codeB = lastCode(ctx);
      const results = await Promise.allSettled([
        ctx.app.inject({ method: 'POST', url: '/api/v1/identity/me/phone/change', headers, payload: { new_phone: first, otp_code: codeA } }),
        ctx.app.inject({ method: 'POST', url: '/api/v1/identity/me/phone/change', headers, payload: { new_phone: second, otp_code: codeB } })
      ]);
      expect(results.some((result) => result.status === 'fulfilled' && businessCode(result.value) === 'OK')).toBe(true);
      const user = (await createIdentityRepositories(asExecutor(ctx.pool)).users.findByPublicId(parseUserPublicId(registeredData.user_id)))!;
      expect(await dbCount(ctx, 'SELECT count(*) AS count FROM identity.auth_identities WHERE user_id=$1 AND provider=$2', [user.id.toString(), 'phone'])).toBe(1);
    });
  });

  it('refresh race produces exactly one successor', async () => {
    await withApp(async (ctx) => {
      const registered = await phoneLogin(ctx, '+8562071000009'); const refresh = String(success(registered).refresh_token);
      const attempt = () => ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: refresh } });
      const results = await Promise.allSettled([attempt(), attempt(), attempt()]);
      expect(results.filter((result) => result.status === 'fulfilled' && businessCode(result.value) === 'OK')).toHaveLength(1);
      expect(await dbCount(ctx, "SELECT count(*) AS count FROM identity.sessions WHERE status='active' AND user_id = (SELECT id FROM identity.users LIMIT 1)", [])).toBe(1);
    });
  });

  it('logout vs refresh stays consistent: logout never leaves a stale refresh alive', async () => {
    await withApp(async (ctx) => {
      const registered = await phoneLogin(ctx, '+8562071000010'); const token = success(registered);
      const [l, r] = await Promise.allSettled([
        ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/logout', payload: { refresh_token: String(token.refresh_token) } }),
        ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: String(token.refresh_token) } })
      ]);
      const logoutOk = l.status === 'fulfilled' && l.value.statusCode === 200 && businessCode(l.value) === 'OK';
      const refreshOk = r.status === 'fulfilled' && r.value.statusCode === 200 && businessCode(r.value) === 'OK';
      if (refreshOk) {
        const rotated = String(success((r as { value: { json(): unknown } }).value).refresh_token);
        const rotatedRefresh = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: rotated } });
        expect(rotatedRefresh.statusCode).toBe(200);
        expect(businessCode(rotatedRefresh)).toBe('OK');
        await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/logout-all', headers: bearer(String(token.access_token)) });
      } else {
        expect(logoutOk).toBe(true);
        expect(await dbCount(ctx, "SELECT count(*) AS count FROM identity.sessions WHERE status='active'", [])).toBe(0);
      }
    });
  });

  it('logout-all vs refresh never leaves an active session', async () => {
    await withApp(async (ctx) => {
      const registered = await phoneLogin(ctx, '+8562071000011'); const token = success(registered);
      const [logoutAll, refresh] = await Promise.allSettled([
        ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/logout-all', headers: bearer(String(token.access_token)) }),
        ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: String(token.refresh_token) } })
      ]);
      expect(logoutAll.status === 'fulfilled' && logoutAll.value.statusCode === 200 && businessCode(logoutAll.value) === 'OK').toBe(true);
      void refresh;
      expect(await dbCount(ctx, "SELECT count(*) AS count FROM identity.sessions WHERE status='active'", [])).toBe(0);
    });
  });

  it('device revoke vs refresh leaves no usable refresh for the session', async () => {
    await withApp(async (ctx) => {
      const installation = newLogicalUuid(); const phone = '+8562071000012';
      await otpReq(ctx, phone);
      const registered = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone, otp_code: lastCode(ctx), learning_direction: direction, device: device(installation) } });
      const token = success(registered);
      const devices = new DeviceLifecycle(ctx.transactions, createIdentityRepositories);
      const [revoked, refreshed] = await Promise.allSettled([
        devices.revokeDevice(parseUserPublicId(token.user_id), parseInstallationId(installation)),
        ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: String(token.refresh_token) } })
      ]);
      expect(revoked.status).toBe('fulfilled');
      expect(await dbCount(ctx, "SELECT count(*) AS count FROM identity.sessions WHERE status='active'", [])).toBe(0);
      const rotated = refreshed.status === 'fulfilled' && refreshed.value.statusCode === 200 && businessCode(refreshed.value) === 'OK'
        ? String(success(refreshed.value).refresh_token)
        : String(token.refresh_token);
      const finalRefresh = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: rotated } });
      expect(finalRefresh.statusCode).toBe(200);
      expect(businessCode(finalRefresh)).toBe('INVALID_CREDENTIAL');
    });
  });

  it('device restore race is self-consistent under the device row lock', async () => {
    await withApp(async (ctx) => {
      const phone = '+8562071000013'; const registered = await phoneLogin(ctx, phone);
      const registeredData = success(registered);
      const repos = createIdentityRepositories(asExecutor(ctx.pool));
      const user = (await repos.users.findByPublicId(parseUserPublicId(registeredData.user_id)))!;
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
      const finalRefresh = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: String(registeredData.refresh_token) } });
      expect(finalRefresh.statusCode).toBe(200);
      if (device.revokedAt === null) {
        expect(businessCode(finalRefresh)).toBe('OK');
      } else {
        expect(businessCode(finalRefresh)).toBe('DEVICE_REVOKED');
      }
    });
  });

  it('push token race preserves the partial unique invariant', async () => {
    await withApp(async (ctx) => {
      const phone = '+8562071000014'; const registered = await phoneLogin(ctx, phone);
      const registeredData = success(registered);
      const repos = createIdentityRepositories(asExecutor(ctx.pool));
      const user = (await repos.users.findByPublicId(parseUserPublicId(registeredData.user_id)))!;
      const installationA = newLogicalUuid(); const installationB = newLogicalUuid();
      await repos.devices.create({ userId: user.id, installationId: parseInstallationId(installationA), platform: 'android' });
      await repos.devices.create({ userId: user.id, installationId: parseInstallationId(installationB), platform: 'android' });
      const claimedToken = `shared-push-${newLogicalUuid()}`;
      const devices = new DeviceLifecycle(ctx.transactions, createIdentityRepositories);
      const results = await Promise.allSettled([
        devices.registerOrUpdate(parseUserPublicId(registeredData.user_id), { installationId: parseInstallationId(installationA), platform: 'android', pushToken: claimedToken }),
        devices.registerOrUpdate(parseUserPublicId(registeredData.user_id), { installationId: parseInstallationId(installationB), platform: 'android', pushToken: claimedToken })
      ]);
      expect(results.some((result) => result.status === 'fulfilled')).toBe(true);
      expect(await dbCount(ctx, 'SELECT count(*) AS count FROM identity.devices WHERE push_token=$1 AND revoked_at IS NULL', [claimedToken])).toBe(1);
    });
  });

  it('disable vs refresh leaves no usable active session', async () => {
    await withApp(async (ctx) => {
      const phone = '+8562071000015'; const registered = await phoneLogin(ctx, phone); const token = success(registered);
      const state = new IdentityState(ctx.transactions, createIdentityRepositories, new IdentityEventWriter(new OutboxWriter()));
      const [disabled, refreshed] = await Promise.allSettled([
        state.changeStatus(parseUserPublicId(token.user_id), 'disabled'),
        ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: String(token.refresh_token) } })
      ]);
      expect(disabled.status).toBe('fulfilled');
      expect((await ctx.pool.query('SELECT status FROM identity.users LIMIT 1')).rows[0]!.status).toBe('disabled');
      expect(await dbCount(ctx, "SELECT count(*) AS count FROM identity.sessions WHERE status='active'", [])).toBe(0);
      const rotated = refreshed.status === 'fulfilled' && refreshed.value.statusCode === 200 && businessCode(refreshed.value) === 'OK'
        ? String(success(refreshed.value).refresh_token)
        : String(token.refresh_token);
      const finalRefresh = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: rotated } });
      expect(finalRefresh.statusCode).toBe(200);
      expect(businessCode(finalRefresh)).toBe('INVALID_CREDENTIAL');
    });
  });

  it('close vs login never leaves an active session for a closed user', async () => {
    await withApp(async (ctx) => {
      const phone = '+8562071000016'; const registered = await phoneLogin(ctx, phone);
      const userId = success(registered).user_id;
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
      if (loggedIn.status === 'fulfilled' && loggedIn.value.statusCode === 200 && businessCode(loggedIn.value) === 'OK') {
        const finalRefresh = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: String(success(loggedIn.value).refresh_token) } });
        expect(finalRefresh.statusCode).toBe(200);
        expect(businessCode(finalRefresh)).toBe('INVALID_CREDENTIAL');
      }
      expect(await dbCount(ctx, 'SELECT count(*) AS count FROM identity.users', [])).toBe(1);
    });
  });
});

integration('HOTFIX-01 account status race regression', () => {
  it('Race A: closed vs disabled from active — closed is never overwritten', async () => {
    await withApp(async (ctx) => {
      const registered = await phoneLogin(ctx, '+8562071000021');
      const publicId = parseUserPublicId(success(registered).user_id);
      const state = new IdentityState(ctx.transactions, createIdentityRepositories, new IdentityEventWriter(new OutboxWriter()));
      const results = await Promise.allSettled([
        state.changeStatus(publicId, 'closed'),
        state.changeStatus(publicId, 'disabled')
      ]);
      expect(results.some((result) => result.status === 'fulfilled' && result.value.status === 'closed')).toBe(true);
      const finalStatus = String((await ctx.pool.query('SELECT status FROM identity.users WHERE public_id=$1', [publicId])).rows[0]!.status);
      expect(finalStatus).toBe('closed');
      const transitions = (await ctx.pool.query<{ payload: Record<string, unknown> }>("SELECT payload FROM infrastructure.system_outbox_events WHERE event_type='identity.account_status_changed.v1' AND aggregate_id=$1 ORDER BY created_at", [publicId])).rows.map((row) => row.payload);
      for (const t of transitions) {
        expect(t.previous_status).not.toBe('closed');
        expect(t.new_status === 'closed' || (t.previous_status === 'active' && t.new_status === 'disabled')).toBe(true);
      }
      expect(transitions.at(-1)!.new_status).toBe('closed');
    });
  });

  it('Race B: disabled vs closed — closed stays terminal', async () => {
    await withApp(async (ctx) => {
      const registered = await phoneLogin(ctx, '+8562071000022');
      const publicId = parseUserPublicId(success(registered).user_id);
      const state = new IdentityState(ctx.transactions, createIdentityRepositories, new IdentityEventWriter(new OutboxWriter()));
      await state.changeStatus(publicId, 'disabled');
      const results = await Promise.allSettled([
        state.changeStatus(publicId, 'closed'),
        state.changeStatus(publicId, 'active')
      ]);
      expect(results.some((result) => result.status === 'fulfilled' && result.value.status === 'closed')).toBe(true);
      const finalStatus = String((await ctx.pool.query('SELECT status FROM identity.users WHERE public_id=$1', [publicId])).rows[0]!.status);
      expect(finalStatus).toBe('closed');
      const transitions = (await ctx.pool.query<{ payload: Record<string, unknown> }>("SELECT payload FROM infrastructure.system_outbox_events WHERE event_type='identity.account_status_changed.v1' AND aggregate_id=$1 ORDER BY created_at", [publicId])).rows.map((row) => row.payload);
      for (const t of transitions) expect(t.previous_status).not.toBe('closed');
      expect(transitions.at(-1)!.new_status).toBe('closed');
    });
  });

  it('Race C: concurrent identical disable emits exactly one real event', async () => {
    await withApp(async (ctx) => {
      const registered = await phoneLogin(ctx, '+8562071000023');
      const publicId = parseUserPublicId(success(registered).user_id);
      const state = new IdentityState(ctx.transactions, createIdentityRepositories, new IdentityEventWriter(new OutboxWriter()));
      const results = await Promise.allSettled([
        state.changeStatus(publicId, 'disabled'),
        state.changeStatus(publicId, 'disabled')
      ]);
      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
      const finalStatus = String((await ctx.pool.query('SELECT status FROM identity.users WHERE public_id=$1', [publicId])).rows[0]!.status);
      expect(finalStatus).toBe('disabled');
      const events = (await ctx.pool.query<{ payload: Record<string, unknown> }>("SELECT payload FROM infrastructure.system_outbox_events WHERE event_type='identity.account_status_changed.v1'")).rows.map((row) => row.payload);
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({ previous_status: 'active', new_status: 'disabled' });
    });
  });

  it('Race D: previous_status comes from the post-lock committed state, never stale', async () => {
    await withApp(async (ctx) => {
      const registered = await phoneLogin(ctx, '+8562071000024');
      const publicId = parseUserPublicId(success(registered).user_id);
      const state = new IdentityState(ctx.transactions, createIdentityRepositories, new IdentityEventWriter(new OutboxWriter()));
      const client = await ctx.pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SELECT id FROM identity.users WHERE public_id=$1 FOR UPDATE', [publicId]);
        const changing = state.changeStatus(publicId, 'closed');
        await client.query("UPDATE identity.users SET status='disabled', updated_at=now() WHERE public_id=$1", [publicId]);
        await client.query('COMMIT');
        const result = await changing;
        expect(result.status).toBe('closed');
      } finally {
        await client.release();
      }
      const finalStatus = String((await ctx.pool.query('SELECT status FROM identity.users WHERE public_id=$1', [publicId])).rows[0]!.status);
      expect(finalStatus).toBe('closed');
      const events = (await ctx.pool.query<{ payload: Record<string, unknown> }>("SELECT payload FROM infrastructure.system_outbox_events WHERE event_type='identity.account_status_changed.v1' AND aggregate_id=$1", [publicId])).rows.map((row) => row.payload);
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({ previous_status: 'disabled', new_status: 'closed' });
    });
  });
});