import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { asExecutor } from '../../src/database/pool.js';
import { OutboxWriter } from '../../src/outbox/outbox-writer.js';
import { IdentityEventWriter, IdentityState, DeviceLifecycle } from '../../src/modules/identity/application/index.js';
import { createIdentityRepositories } from '../../src/modules/identity/infrastructure/index.js';
import { normalizePhoneNumber, parseInstallationId, parseUserPublicId } from '../../src/modules/identity/domain/index.js';
import { newLogicalUuid } from '../../src/ids/uuid.js';
import { buildIdentityTestApp, type IdentityTestApp } from '../support/identity-app.js';

const adminUrl = process.env.ADMIN_DATABASE_URL;
const integration = adminUrl ? describe : describe.skip;
const logger = pino({ level: 'silent' });
const direction = { native_language: 'lo', learning_language: 'zh' } as const;
const device = (installationId: string = newLogicalUuid()) => ({ installation_id: installationId, platform: 'ios', device_name: 'iPhone', app_version: '2.0.1', push_token: `push-${installationId}` });
const lastCode = (ctx: IdentityTestApp) => ctx.delivery.deliveries.at(-1)!.code;
const bearer = (token: string) => ({ authorization: `Bearer ${token}` });
const success = (response: { json(): unknown }) => {
  const envelope = response.json() as { code: string; data: Record<string, unknown> };
  expect(envelope.code).toBe('OK');
  return envelope.data;
};
const businessCode = (response: { json(): unknown }) => (response.json() as { code: string }).code;

async function withApp(fn: (ctx: IdentityTestApp) => Promise<void>, options: { facebook?: string[]; eventWriter?: IdentityEventWriter } = {}) {
  const ctx = await buildIdentityTestApp({
    logger,
    ...(options.facebook ? { facebookSubjects: new Map(options.facebook.map((credential, index) => [credential, `fb-e2e-${index}`])) } : {}),
    ...(options.eventWriter ? { eventWriter: options.eventWriter } : {})
  });
  try { await fn(ctx); } finally { await ctx.dispose(); }
}

async function requests(ctx: IdentityTestApp, phone: string) { return ctx.app.inject({ method: 'POST', url: '/api/v1/identity/phone-otp', payload: { phone, purpose: 'login' } }); }
async function phoneRegister(ctx: IdentityTestApp, phone: string) {
  await requests(ctx, phone);
  return ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone, otp_code: lastCode(ctx), learning_direction: direction, device: device() } });
}
async function db(ctx: IdentityTestApp, sql: string, values: readonly unknown[] = []) { return ctx.pool.query(sql, values as unknown[]); }
async function count(ctx: IdentityTestApp, sql: string, values: readonly unknown[] = []): Promise<number> { const r = await db(ctx, sql, values); return Number(r.rows[0]!.count); }

integration('IDN-18 Domain E2E against real PostgreSQL', () => {
  it('phone new user: full HTTP chain produces exact canonical rows and safe storage', async () => {
    await withApp(async (ctx) => {
      const phone = '+8562051000001'; const response = await phoneRegister(ctx, phone);
      expect(response.statusCode).toBe(200);
      const body = success(response);
      expect(body).toMatchObject({ account_status: 'active', is_new_user: true, token_type: 'Bearer' });
      const user = (await createIdentityRepositories(asExecutor(ctx.pool)).users.findByPublicId(parseUserPublicId(body.user_id)))!;
      expect(await count(ctx, 'SELECT count(*) AS count FROM identity.auth_identities WHERE user_id=$1 AND provider=$2', [user.id.toString(), 'phone'])).toBe(1);
      expect(await count(ctx, 'SELECT count(*) AS count FROM identity.basic_profiles WHERE user_id=$1', [user.id.toString()])).toBe(1);
      expect(await count(ctx, 'SELECT count(*) AS count FROM identity.learning_profiles WHERE user_id=$1', [user.id.toString()])).toBe(1);
      expect(await count(ctx, 'SELECT count(*) AS count FROM identity.devices WHERE user_id=$1', [user.id.toString()])).toBe(1);
      expect(await count(ctx, 'SELECT count(*) AS count FROM identity.sessions WHERE user_id=$1 AND status=$2', [user.id.toString(), 'active'])).toBe(1);
      expect(await count(ctx, "SELECT count(*) AS count FROM infrastructure.system_outbox_events WHERE event_type='identity.user_registered.v1' AND aggregate_id=$1", [body.user_id])).toBe(1);
      const otpRows = await db(ctx, 'SELECT code_hash FROM identity.otp_challenges');
      expect(JSON.stringify(otpRows.rows)).not.toContain(ctx.delivery.deliveries[0]!.code);
      const sessionRows = await db(ctx, 'SELECT refresh_token_hash FROM identity.sessions');
      expect(JSON.stringify(sessionRows.rows)).not.toContain(body.refresh_token);
    });
  });

  it('existing phone login reuses the canonical user and never duplicates registration', async () => {
    await withApp(async (ctx) => {
      const phone = '+8562051000002';
      const first = await phoneRegister(ctx, phone); const userId = success(first).user_id;
      const second = await phoneRegister(ctx, phone);
      expect(success(second).is_new_user).toBe(false); expect(success(second).user_id).toBe(userId);
      const user = (await createIdentityRepositories(asExecutor(ctx.pool)).users.findByPublicId(parseUserPublicId(userId)))!;
      expect(await count(ctx, 'SELECT count(*) AS count FROM identity.sessions WHERE user_id=$1 AND status=$2', [user.id.toString(), 'active'])).toBe(2);
      expect(await count(ctx, "SELECT count(*) AS count FROM infrastructure.system_outbox_events WHERE event_type='identity.user_registered.v1' AND aggregate_id=$1", [userId])).toBe(1);
      expect(await count(ctx, 'SELECT count(*) AS count FROM identity.users', [])).toBe(1);
    });
  });

  it('facebook registration and existing login share one canonical user', async () => {
    await withApp(async (ctx) => {
      const facebook = (payload: Record<string, unknown>) => ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/facebook', payload });
      const first = await facebook({ credential: 'opaque', learning_direction: direction, device: device() });
      expect(success(first).is_new_user).toBe(true);
      const user = (await createIdentityRepositories(asExecutor(ctx.pool)).users.findByPublicId(parseUserPublicId(success(first).user_id)))!;
      expect(await count(ctx, 'SELECT count(*) AS count FROM identity.auth_identities WHERE user_id=$1 AND provider=$2', [user.id.toString(), 'facebook'])).toBe(1);
      expect(await count(ctx, 'SELECT count(*) AS count FROM identity.basic_profiles WHERE user_id=$1', [user.id.toString()])).toBe(1);
      expect(await count(ctx, 'SELECT count(*) AS count FROM identity.learning_profiles WHERE user_id=$1', [user.id.toString()])).toBe(1);
      expect(await count(ctx, "SELECT count(*) AS count FROM infrastructure.system_outbox_events WHERE event_type='identity.user_registered.v1' AND aggregate_id=$1", [success(first).user_id])).toBe(1);
      const second = await facebook({ credential: 'opaque' });
      expect(success(second).is_new_user).toBe(false); expect(success(second).user_id).toBe(success(first).user_id);
      expect(await count(ctx, "SELECT count(*) AS count FROM infrastructure.system_outbox_events WHERE event_type='identity.user_registered.v1' AND aggregate_id=$1", [success(first).user_id])).toBe(1);
    }, { facebook: ['opaque'] });
  });

  it('refresh rotation: replay blocked, sliding TTL extended, only latest hash kept', async () => {
    await withApp(async (ctx) => {
      const registered = await phoneRegister(ctx, '+8562051000003'); const rawA = String(success(registered).refresh_token);
      const first = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: rawA } });
      expect(first.statusCode).toBe(200); const rawB = String(success(first).refresh_token);
      expect(businessCode(await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: rawA } }))).toBe('INVALID_CREDENTIAL');
      const second = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: rawB } });
      expect(second.statusCode).toBe(200); success(second);
      const sessionRows = await db(ctx, 'SELECT refresh_token_hash, expires_at FROM identity.sessions');
      expect(sessionRows.rows).toHaveLength(1);
      expect(JSON.stringify(sessionRows.rows[0]!)).not.toContain(rawB);
      const expiresAt = new Date(String(sessionRows.rows[0]!.expires_at));
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now() + 28 * 24 * 3600 * 1000);
    });
  });

  it('logout current is idempotent and logout-all revokes every session', async () => {
    await withApp(async (ctx) => {
      const token = success(await phoneRegister(ctx, '+8562051000004'));
      expect(success(await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/logout', payload: { refresh_token: token.refresh_token } }))).toBeNull();
      expect(businessCode(await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: token.refresh_token } }))).toBe('INVALID_CREDENTIAL');
      const tokenB = success(await phoneRegister(ctx, '+8562051000005'));
      const tokenC = success(await phoneRegister(ctx, '+8562051000005'));
      expect(success(await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/logout-all', headers: bearer(String(tokenB.access_token)) }))).toBeNull();
      expect(businessCode(await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: tokenB.refresh_token } }))).toBe('INVALID_CREDENTIAL');
      expect(businessCode(await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: tokenC.refresh_token } }))).toBe('INVALID_CREDENTIAL');
    });
  });

  it('device lifecycle: revoke kills bound sessions; ordinary update cannot restore; fresh auth restores', async () => {
    await withApp(async (ctx) => {
      const installation = newLogicalUuid(); const phone = '+8562051000006';
      await requests(ctx, phone);
      const login1 = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone, otp_code: lastCode(ctx), learning_direction: direction, device: device(installation) } });
      const loginData = success(login1); const headers = bearer(String(loginData.access_token));
      expect((success(await ctx.app.inject({ url: '/api/v1/identity/me/devices', headers })).items as Array<Record<string, unknown>>)[0]!.installation_id).toBe(installation);
      expect(success(await ctx.app.inject({ method: 'DELETE', url: `/api/v1/identity/me/devices/${installation}`, headers }))).toBeNull();
      expect((success(await ctx.app.inject({ url: '/api/v1/identity/me/devices', headers })).items as Array<Record<string, unknown>>)[0]).toMatchObject({ revoked: true });
      const ordinaryUpdate = new DeviceLifecycle(ctx.transactions, createIdentityRepositories);
      await expect(ordinaryUpdate.registerOrUpdate(parseUserPublicId(loginData.user_id), { installationId: parseInstallationId(installation), platform: 'ios', deviceName: 'iPhone' })).rejects.toMatchObject({ code: 'DEVICE_REVOKED' });
      expect(businessCode(await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: loginData.refresh_token } }))).toBe('INVALID_CREDENTIAL');
      await requests(ctx, phone);
      const sameUser = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone, otp_code: lastCode(ctx), learning_direction: direction, device: device(installation) } });
      expect(sameUser.statusCode).toBe(200); expect(success(sameUser).is_new_user).toBe(false);
      expect((success(await ctx.app.inject({ url: '/api/v1/identity/me/devices', headers: bearer(String(success(sameUser).access_token)) })).items as Array<Record<string, unknown>>)[0]!.revoked).toBe(false);
      expect(success(await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: success(sameUser).refresh_token } }))).toBeDefined();
    });
  });

  it('profile lifecycle: absent preserved, null clears, birth_date stable, avatar preserved', async () => {
    await withApp(async (ctx) => {
      const registered = await phoneRegister(ctx, '+8562051000007'); const headers = bearer(String(success(registered).access_token));
      const avatar = newLogicalUuid();
      const patched = await ctx.app.inject({ method: 'PATCH', url: '/api/v1/identity/me/profile', headers, payload: { display_name: 'X', birth_date: '2000-01-31', avatar_media_id: avatar } });
      expect(success(patched)).toMatchObject({ display_name: 'X', birth_date: '2000-01-31', avatar_media_id: avatar, gender: null });
      const nulled = await ctx.app.inject({ method: 'PATCH', url: '/api/v1/identity/me/profile', headers, payload: { display_name: null } });
      expect(success(nulled)).toMatchObject({ display_name: null, birth_date: '2000-01-31', avatar_media_id: avatar });
      const read = await ctx.app.inject({ url: '/api/v1/identity/me/profile', headers });
      expect(success(read)).toMatchObject({ display_name: null, birth_date: '2000-01-31', avatar_media_id: avatar });
    });
  });

  it('learning profile is frozen after registration', async () => {
    await withApp(async (ctx) => {
      const phone = '+8562051000008';
      const registered = await phoneRegister(ctx, phone); const headers = bearer(String(success(registered).access_token));
      expect(success(await ctx.app.inject({ url: '/api/v1/identity/me/learning-profile', headers }))).toEqual(direction);
      for (const payload of [{ native_language: 'zh' }, { learning_language: 'lo' }, { native_language: 'zh', learning_language: 'lo' }]) {
        expect(businessCode(await ctx.app.inject({ method: 'PATCH', url: '/api/v1/identity/me/profile', headers, payload }))).toBe('VALIDATION_ERROR');
      }
      await requests(ctx, phone);
      const conflict = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone, otp_code: lastCode(ctx), learning_direction: { native_language: 'zh', learning_language: 'lo' }, device: device() } });
      expect(conflict.statusCode).toBe(200); expect(businessCode(conflict)).toBe('LEARNING_DIRECTION_IMMUTABLE');
    });
  });

  it('bind phone adds a phone credential to the facebook-first user without creating a new user', async () => {
    await withApp(async (ctx) => {
      const fb = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/facebook', payload: { credential: 'opaque', learning_direction: direction } });
      const fbData = success(fb); const headers = bearer(String(fbData.access_token)); const userId = fbData.user_id;
      const phone = '+8562051000009';
      expect((await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/phone-otp', headers, payload: { phone, purpose: 'bind_phone' } })).statusCode).toBe(200);
      const bind = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/me/phone/bind', headers, payload: { phone, otp_code: lastCode(ctx) } });
      expect(bind.statusCode).toBe(200);
      const user = (await createIdentityRepositories(asExecutor(ctx.pool)).users.findByPublicId(parseUserPublicId(userId)))!;
      expect(await count(ctx, 'SELECT count(*) AS count FROM identity.users', [])).toBe(1);
      expect(await count(ctx, 'SELECT count(*) AS count FROM identity.auth_identities WHERE user_id=$1 AND provider=$2', [user.id.toString(), 'phone'])).toBe(1);
      const phoneLogin = await phoneRegister(ctx, phone);
      expect(success(phoneLogin).user_id).toBe(userId); expect(success(phoneLogin).is_new_user).toBe(false);
    }, { facebook: ['opaque'] });
  });

  it('change phone updates the single credential, old number never resolves, session stays alive', async () => {
    await withApp(async (ctx) => {
      const oldPhone = '+8562051000010'; const newPhone = '+8613866666666';
      const registered = await phoneRegister(ctx, oldPhone); const registeredData = success(registered); const headers = bearer(String(registeredData.access_token)); const userId = registeredData.user_id;
      expect((await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/phone-otp', headers, payload: { phone: newPhone, purpose: 'change_phone' } })).statusCode).toBe(200);
      const change = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/me/phone/change', headers, payload: { new_phone: newPhone, otp_code: lastCode(ctx) } });
      expect(change.statusCode).toBe(200);
      const user = (await createIdentityRepositories(asExecutor(ctx.pool)).users.findByPublicId(parseUserPublicId(userId)))!;
      const phoneIdentities = (await createIdentityRepositories(asExecutor(ctx.pool)).authIdentities.listByUserId(user.id)).filter((identity) => identity.provider === 'phone');
      expect(phoneIdentities).toHaveLength(1);
      expect((await createIdentityRepositories(asExecutor(ctx.pool)).authIdentities.findByProviderAndSubject('phone', normalizePhoneNumber(newPhone)))?.userId.toString()).toBe(user.id.toString());
      expect(await createIdentityRepositories(asExecutor(ctx.pool)).authIdentities.findByProviderAndSubject('phone', normalizePhoneNumber(oldPhone))).toBeNull();
      const oldLogin = await phoneRegister(ctx, oldPhone); expect(success(oldLogin).is_new_user).toBe(true);
      expect(success(await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: registeredData.refresh_token } }))).toBeDefined();
      const newLogin = await phoneRegister(ctx, newPhone); expect(success(newLogin).is_new_user).toBe(false); expect(success(newLogin).user_id).toBe(userId);
    });
  });

  it('account state transitions revoke sessions atomically and block auth, refresh, and protected access', async () => {
    await withApp(async (ctx) => {
      const phone = '+8562051000011'; const registered = await phoneRegister(ctx, phone);
      const token = success(registered); const user = (await createIdentityRepositories(asExecutor(ctx.pool)).users.findByPublicId(parseUserPublicId(token.user_id)))!;
      const state = new IdentityState(ctx.transactions, createIdentityRepositories, new IdentityEventWriter(new OutboxWriter()));
      await state.changeStatus(parseUserPublicId(token.user_id), 'disabled');
      expect((await db(ctx, 'SELECT status FROM identity.users WHERE id=$1', [user.id.toString()])).rows[0]!.status).toBe('disabled');
      expect(await count(ctx, 'SELECT count(*) AS count FROM identity.sessions WHERE user_id=$1 AND status=$2', [user.id.toString(), 'active'])).toBe(0);
      expect(await count(ctx, "SELECT count(*) AS count FROM infrastructure.system_outbox_events WHERE event_type='identity.account_status_changed.v1' AND aggregate_id=$1", [token.user_id])).toBe(1);
      await requests(ctx, phone);
      const login = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone, otp_code: lastCode(ctx), learning_direction: direction, device: device() } });
      expect(login.statusCode).toBe(200); expect(businessCode(login)).toBe('ACCOUNT_DISABLED');
      expect(businessCode(await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: token.refresh_token } }))).toBe('INVALID_CREDENTIAL');
      expect(businessCode(await ctx.app.inject({ url: '/api/v1/identity/me', headers: bearer(String(token.access_token)) }))).toBe('UNAUTHENTICATED');
      await state.changeStatus(parseUserPublicId(token.user_id), 'active');
      expect((await db(ctx, 'SELECT status FROM identity.users WHERE id=$1', [user.id.toString()])).rows[0]!.status).toBe('active');
      expect(await count(ctx, 'SELECT count(*) AS count FROM identity.sessions WHERE user_id=$1 AND status=$2', [user.id.toString(), 'active'])).toBe(0);
      expect(businessCode(await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: token.refresh_token } }))).toBe('INVALID_CREDENTIAL');
      await state.changeStatus(parseUserPublicId(token.user_id), 'closed');
      await expect(state.changeStatus(parseUserPublicId(token.user_id), 'active')).rejects.toMatchObject({ code: 'INVALID_DATA' });
    });
  });

  it('outbox write failure rolls back the whole phone registration', async () => {
    class FailingOutboxWriter extends OutboxWriter { override async write(): Promise<void> { throw new Error('outbox unavailable'); } }
    await withApp(async (ctx) => {
      const phone = '+8562051000012';
      await requests(ctx, phone);
      const response = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/phone', payload: { phone, otp_code: lastCode(ctx), learning_direction: direction, device: device() } });
      expect(response.statusCode).toBe(200); expect(businessCode(response)).toBe('INTERNAL_ERROR');
      expect(await count(ctx, 'SELECT count(*) AS count FROM identity.users', [])).toBe(0);
      expect(await count(ctx, 'SELECT count(*) AS count FROM identity.auth_identities', [])).toBe(0);
      expect(await count(ctx, 'SELECT count(*) AS count FROM identity.learning_profiles', [])).toBe(0);
      expect(await count(ctx, "SELECT count(*) AS count FROM infrastructure.system_outbox_events WHERE event_type='identity.user_registered.v1'", [])).toBe(0);
      expect(await count(ctx, 'SELECT count(*) AS count FROM identity.otp_challenges WHERE status=$1', ['verified'])).toBe(0);
    }, { eventWriter: new IdentityEventWriter(new FailingOutboxWriter()) });
  });

  it('account status outbox failure rolls back status and revocation atomically', async () => {
    class FailingOutboxWriter extends OutboxWriter { override async write(): Promise<void> { throw new Error('outbox unavailable'); } }
    await withApp(async (ctx) => {
      const registered = await phoneRegister(ctx, '+8562051000013'); const token = success(registered);
      const user = (await createIdentityRepositories(asExecutor(ctx.pool)).users.findByPublicId(parseUserPublicId(token.user_id)))!;
      const state = new IdentityState(ctx.transactions, createIdentityRepositories, new IdentityEventWriter(new FailingOutboxWriter()));
      await expect(state.changeStatus(parseUserPublicId(token.user_id), 'disabled')).rejects.toThrow('outbox unavailable');
      expect((await db(ctx, 'SELECT status FROM identity.users WHERE id=$1', [user.id.toString()])).rows[0]!.status).toBe('active');
      expect(await count(ctx, 'SELECT count(*) AS count FROM identity.sessions WHERE user_id=$1 AND status=$2', [user.id.toString(), 'active'])).toBe(1);
      expect(await count(ctx, "SELECT count(*) AS count FROM infrastructure.system_outbox_events WHERE event_type='identity.account_status_changed.v1'", [])).toBe(0);
      expect(success(await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/sessions/refresh', payload: { refresh_token: token.refresh_token } }))).toBeDefined();
    });
  });
});
