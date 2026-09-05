import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { requireAuthentication } from '../../../auth/auth-hook.js';
import type { AuthenticationProvider } from '../../../auth/authentication-provider.js';
import type { AdminAuthenticationService } from '../application/use-cases/admin-authentication.js';
import type { AdminCredentialOperations } from '../application/use-cases/admin-credential-ops.js';
import type { AdminAuditRecorder } from '../application/ports/admin-audit-port.js';
import { AppError } from '../../../errors/app-error.js';
import { parseInstallationId, parseRawOtpCode, parseRawRefreshToken, parseUserPublicId } from '../domain/index.js';
import type { AuthenticateWithFacebook, AuthenticateWithPhoneOtp, DeviceLifecycle, IdentityState, PhoneCredentialOperations, ProfileOperations, RequestPhoneOtp, SessionLifecycle } from '../application/index.js';

const direction = z.object({ native_language: z.enum(['lo', 'zh']), learning_language: z.enum(['lo', 'zh']) }).strict();
const device = z.object({ installation_id: z.string().uuid(), platform: z.enum(['android', 'ios']), device_name: z.string().max(200).nullable().optional(), app_version: z.string().max(100).nullable().optional(), push_token: z.string().max(1024).nullable().optional() }).strict();
const profile = z.object({ display_name: z.string().max(200).nullable().optional(), gender: z.enum(['male', 'female', 'other', 'unspecified']).nullable().optional(), birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(), country_code: z.string().max(8).nullable().optional(), region_code: z.string().max(32).nullable().optional(), avatar_media_id: z.string().uuid().nullable().optional() }).strict().refine(value => Object.keys(value).length > 0, 'Profile update cannot be empty');
const parse = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      httpStatus: 400,
      // `path` lets clients identify the invalid request field without exposing input values.
      details: result.error.issues.map(({ code, message, path }) => ({ code, message, path })),
    });
  }
  return result.data;
};
const subject = (request: FastifyRequest) => { if (!request.authContext) throw new AppError({ code: 'UNAUTHENTICATED', message: 'Authentication required', httpStatus: 401 }); return parseUserPublicId(request.authContext.subjectId); };
const iso = (value: Date | null) => value?.toISOString() ?? null;
const tokenHeaders = { 'cache-control': 'no-store', pragma: 'no-cache' };
const mapDevice = (value: z.infer<typeof device>) => ({ installationId: parseInstallationId(value.installation_id), platform: value.platform, ...(value.device_name !== undefined ? { deviceName: value.device_name } : {}), ...(value.app_version !== undefined ? { appVersion: value.app_version } : {}), ...(value.push_token !== undefined ? { pushToken: value.push_token } : {}) });
const mapDirection = (value: z.infer<typeof direction>) => ({ nativeLanguage: value.native_language, learningLanguage: value.learning_language });

export type IdentityHttpDependencies = Readonly<{
  authentication: AuthenticationProvider;
  adminAuth?: AdminAuthenticationService;
  adminCredentials?: AdminCredentialOperations;
  adminAudit?: AdminAuditRecorder;
  requestOtp: RequestPhoneOtp;
  phoneAuth: AuthenticateWithPhoneOtp;
  facebookAuth: AuthenticateWithFacebook;
  sessions: SessionLifecycle;
  devices: DeviceLifecycle;
  profile: ProfileOperations;
  state: IdentityState;
  phones: PhoneCredentialOperations;
}>;

export async function registerIdentityRoutes(app: FastifyInstance, dependencies: IdentityHttpDependencies): Promise<void> {
  const protectedRoute = requireAuthentication(dependencies.authentication);
  if (dependencies.adminAuth) {
    app.post('/api/v1/admin/auth/login', async (request, reply) => {
      const body = parse(z.object({ username: z.string().trim().min(1).max(100), password: z.string().min(1).max(200) }).strict(), request.body);
      const result = await dependencies.adminAuth!.login(body.username, body.password, { ipAddress: request.ip, requestId: request.id });
      reply.headers(tokenHeaders);
      return { user_id: result.userPublicId, access_token: result.accessToken, token_type: 'Bearer', expires_in: result.expiresIn, refresh_token: result.refreshToken, session_expires_at: result.sessionExpiresAt.toISOString(), password_change_required: result.passwordChangeRequired };
    });
  }
  if (dependencies.adminCredentials) {
    app.post('/api/v1/admin/auth/change-password', { preHandler: protectedRoute }, async (request) => {
      const body = parse(z.object({ current_password: z.string().min(1).max(200), new_password: z.string().min(8).max(128) }).strict(), request.body);
      const result = await dependencies.adminCredentials!.changePassword(subject(request), body.current_password, body.new_password, { ipAddress: request.ip, requestId: request.id });
      return { status: result.changed ? 'changed' : 'unchanged', session_revoked: result.sessionRevoked };
    });
  }
  app.post('/api/v1/identity/phone-otp', async (request) => {
    const body = parse(z.object({ phone: z.unknown(), purpose: z.enum(['login', 'bind_phone', 'change_phone']) }).strict(), request.body);
    if (body.purpose !== 'login') await protectedRoute(request);
    await dependencies.requestOtp.execute(body.purpose === 'login' ? { phone: body.phone, purpose: body.purpose, ip: request.ip } : { phone: body.phone, purpose: body.purpose, ip: request.ip, authenticatedUserPublicId: subject(request) });
    return { status: 'accepted', retry_after_seconds: 60 };
  });
  app.post('/api/v1/identity/auth/phone', async (request, reply) => {
    const body = parse(z.object({ phone: z.unknown(), otp_code: z.string(), learning_direction: direction.optional(), device: device.optional() }).strict(), request.body);
    const result = await dependencies.phoneAuth.execute({ phone: body.phone, code: parseRawOtpCode(body.otp_code), ...(body.learning_direction ? { learningDirection: mapDirection(body.learning_direction) } : {}), ...(body.device ? { device: mapDevice(body.device) } : {}) });
    reply.headers(tokenHeaders); return { user_id: result.userPublicId, account_status: result.status, is_new_user: result.isNewUser, access_token: result.accessToken, token_type: 'Bearer', expires_in: result.expiresIn, refresh_token: result.refreshToken, session_expires_at: result.sessionExpiresAt.toISOString() };
  });
  app.post('/api/v1/identity/auth/facebook', async (request, reply) => {
    const body = parse(z.object({ credential: z.string().min(1).max(4096), learning_direction: direction.optional(), device: device.optional() }).strict(), request.body);
    const result = await dependencies.facebookAuth.execute({ credential: body.credential, ...(body.learning_direction ? { learningDirection: mapDirection(body.learning_direction) } : {}), ...(body.device ? { device: mapDevice(body.device) } : {}) });
    reply.headers(tokenHeaders); return { user_id: result.userPublicId, account_status: 'active', is_new_user: result.isNewUser, access_token: result.accessToken, token_type: 'Bearer', expires_in: result.expiresIn, refresh_token: result.refreshToken, session_expires_at: result.sessionExpiresAt.toISOString() };
  });
  app.post('/api/v1/identity/sessions/refresh', async (request, reply) => {
    const body = parse(z.object({ refresh_token: z.string().min(1) }).strict(), request.body);
    const result = await dependencies.sessions.refreshSession(parseRawRefreshToken(body.refresh_token)).catch((error) => { if (error instanceof AppError && (error.code === 'SESSION_REVOKED' || error.code === 'SESSION_EXPIRED')) throw new AppError({ code: 'INVALID_CREDENTIAL', message: 'Invalid credential', httpStatus: 401 }); throw error; });
    if (dependencies.adminAudit) {
      await dependencies.adminAudit.recordSuccessfulAdminAction({
        subjectId: result.userPublicId,
        actionKey: 'identity.admin.refresh',
        target: { domain: 'identity', type: 'operator', id: result.userPublicId },
        requestContext: { requestId: request.id, ipAddress: request.ip },
      });
    }
    reply.headers(tokenHeaders); return { access_token: result.accessToken, token_type: result.tokenType, expires_in: result.expiresIn, refresh_token: result.refreshToken, session_expires_at: result.sessionExpiresAt.toISOString() };
  });
  app.post('/api/v1/identity/sessions/logout', async (request, reply) => {
    const body = parse(z.object({ refresh_token: z.string().min(1) }).strict(), request.body);
    const subjectId = await dependencies.sessions.logoutCurrent(parseRawRefreshToken(body.refresh_token));
    if (subjectId && dependencies.adminAudit) {
      await dependencies.adminAudit.recordSuccessfulAdminAction({
        subjectId,
        actionKey: 'identity.admin.logout',
        target: { domain: 'identity', type: 'operator', id: subjectId },
        requestContext: { requestId: request.id, ipAddress: request.ip },
      });
    }
    return reply.status(204).send();
  });
  app.post('/api/v1/identity/sessions/logout-all', { preHandler: protectedRoute }, async (request, reply) => { await dependencies.sessions.logoutAll(subject(request)); return reply.status(204).send(); });
  app.get('/api/v1/identity/me', { preHandler: protectedRoute }, async request => { const value = await dependencies.state.getIdentitySummary(subject(request)); return { user_id: value.userPublicId, status: value.status, auth_providers: value.authProviders, learning_profile: value.learningProfile && { native_language: value.learningProfile.nativeLanguage, learning_language: value.learningProfile.learningLanguage }, profile: value.basicProfile && { display_name: value.basicProfile.displayName, gender: value.basicProfile.gender, birth_date: value.basicProfile.birthDate, country_code: value.basicProfile.countryCode, region_code: value.basicProfile.regionCode, avatar_media_id: value.basicProfile.avatarMediaId } }; });
  app.get('/api/v1/identity/me/status', { preHandler: protectedRoute }, async (request) => ({ status: (await dependencies.state.getCurrentIdentity(subject(request))).status }));
  app.get('/api/v1/identity/me/profile', { preHandler: protectedRoute }, async request => profileResponse(await dependencies.profile.getOwnBasicProfile(subject(request))));
  app.patch('/api/v1/identity/me/profile', { preHandler: protectedRoute }, async request => profileResponse(await dependencies.profile.updateOwnBasicProfile(subject(request), mapProfile(parse(profile, request.body)))));
  app.get('/api/v1/identity/me/learning-profile', { preHandler: protectedRoute }, async request => { const value = await dependencies.profile.readLearningProfile(subject(request)); if (!value) throw new AppError({ code: 'NOT_FOUND', message: 'Learning profile not found', httpStatus: 404 }); return { native_language: value.direction.nativeLanguage, learning_language: value.direction.learningLanguage }; });
  app.get('/api/v1/identity/me/devices', { preHandler: protectedRoute }, async request => ({ items: (await dependencies.devices.listMyDevices(subject(request))).map(value => ({ installation_id: value.installationId, platform: value.platform, device_name: value.deviceName, app_version: value.appVersion, first_seen_at: value.firstSeenAt.toISOString(), last_seen_at: iso(value.lastSeenAt), revoked: value.revokedAt !== null })) }));
  app.delete('/api/v1/identity/me/devices/:installation_id', { preHandler: protectedRoute }, async (request, reply) => { const params = parse(z.object({ installation_id: z.string().uuid() }).strict(), request.params); await dependencies.devices.revokeDevice(subject(request), parseInstallationId(params.installation_id)); return reply.status(204).send(); });
  app.get('/api/v1/identity/me/sessions', { preHandler: protectedRoute }, async request => ({ items: (await dependencies.sessions.listMySessions(subject(request))).map(value => ({ device: value.device && { installation_id: value.device.installationId, platform: value.device.platform, device_name: value.device.deviceName }, status: value.status, created_at: value.createdAt.toISOString(), last_active_at: iso(value.lastActiveAt), expires_at: value.expiresAt.toISOString() })) }));
  app.post('/api/v1/identity/me/phone/bind', { preHandler: protectedRoute }, async request => { const body = parse(z.object({ phone: z.unknown(), otp_code: z.string() }).strict(), request.body); await dependencies.phones.bindPhone({ userPublicId: subject(request), phone: body.phone, code: parseRawOtpCode(body.otp_code) }); return { phone_bound: true }; });
  app.post('/api/v1/identity/me/phone/change', { preHandler: protectedRoute }, async request => { const body = parse(z.object({ new_phone: z.unknown(), otp_code: z.string() }).strict(), request.body); await dependencies.phones.changePhone({ userPublicId: subject(request), phone: body.new_phone, code: parseRawOtpCode(body.otp_code) }); return { phone_changed: true }; });
}
function mapProfile(value: z.infer<typeof profile>) { return { ...(value.display_name !== undefined ? { displayName: value.display_name } : {}), ...(value.gender !== undefined ? { gender: value.gender } : {}), ...(value.birth_date !== undefined ? { birthDate: value.birth_date } : {}), ...(value.country_code !== undefined ? { countryCode: value.country_code } : {}), ...(value.region_code !== undefined ? { regionCode: value.region_code } : {}), ...(value.avatar_media_id !== undefined ? { avatarMediaId: value.avatar_media_id } : {}) }; }
function profileResponse(value: Awaited<ReturnType<ProfileOperations['getOwnBasicProfile']>>) { if (!value) throw new AppError({ code: 'NOT_FOUND', message: 'Profile not found', httpStatus: 404 }); return { display_name: value.displayName, gender: value.gender, birth_date: value.birthDate, country_code: value.countryCode, region_code: value.regionCode, avatar_media_id: value.avatarMediaId }; }
