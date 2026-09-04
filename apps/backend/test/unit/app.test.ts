import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../../src/bootstrap/build-app.js';
import { AppError } from '../../src/errors/app-error.js';
import { requireAuthentication } from '../../src/auth/auth-hook.js';
import { newLogicalUuid } from '../../src/ids/uuid.js';
import type { DatabaseExecutor } from '../../src/database/executor.js';
import { requiredMigrations } from '../../src/database/required-migrations.generated.js';
import { identityModule } from '../../src/modules/identity/index.js';
import type { IdentityHttpDependencies } from '../../src/modules/identity/http/routes.js';
import type { AuthenticationProvider } from '../../src/auth/authentication-provider.js';

function stubIdentityDependencies(authenticated: boolean): IdentityHttpDependencies {
  const authentication: AuthenticationProvider = { authenticate: async () => authenticated ? { subjectId: newLogicalUuid() } : null };
  const execution = async () => { throw new AppError({ code: 'INTERNAL_ERROR', message: 'stub', httpStatus: 500, expose: false }); };
  return {
    authentication,
    requestOtp: { execute: execution } as never,
    phoneAuth: { execute: execution } as never,
    facebookAuth: { execute: execution } as never,
    sessions: { refreshSession: execution, logoutCurrent: execution, logoutAll: execution, listMySessions: execution } as never,
    devices: { listMyDevices: execution, revokeDevice: execution } as never,
    profile: { getOwnBasicProfile: execution, updateOwnBasicProfile: execution, readLearningProfile: execution } as never,
    state: { getIdentitySummary: execution, getCurrentIdentity: execution } as never,
    phones: { bindPhone: execution, changePhone: execution } as never
  };
}

const database = { query: async (text: string) => ({
  rows: text.includes('to_regclass')
    ? [{ registry: 'v2_schema_migrations', assets: 'infrastructure.assets', outbox: 'infrastructure.system_outbox_events' }]
    : requiredMigrations.map(({ filename, sha256 }) => ({ filename, sha256 })),
  rowCount: 1, command: 'SELECT', oid: 0, fields: []
}) } as DatabaseExecutor;
const logger = pino({ level: 'silent' });

describe('Fastify foundation', () => {
  it('registers the Identity HTTP contract with fail-closed protected routes', async () => {
    const app = buildApp({ logger, database });
    await identityModule.registerHttp(app, stubIdentityDependencies(false));
    const publicRoute = await app.inject({ method: 'POST', url: '/api/v1/identity/phone-otp', payload: {} });
    expect(publicRoute.statusCode).toBe(200);
    expect(publicRoute.json()).toMatchObject({
      code: 'VALIDATION_ERROR',
      error: {
        message: 'Request validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({ code: expect.any(String), path: ['phone'] }),
          expect.objectContaining({ code: expect.any(String), path: ['purpose'] }),
        ]),
      },
      request_path: '/api/v1/identity/phone-otp',
    });
    const protectedRoute = await app.inject('/api/v1/identity/me');
    expect(protectedRoute.statusCode).toBe(200);
    expect(protectedRoute.json().code).toBe('UNAUTHENTICATED');
    await app.close();
  });
  it('serves liveness and readiness with request IDs', async () => {
    const app = buildApp({ logger, database });
    expect((await app.inject('/health/live')).statusCode).toBe(200);
    const ready = await app.inject('/health/ready'); expect(ready.statusCode).toBe(200); expect(ready.headers['x-request-id']).toBeDefined();
    await app.close();
  });
  it('returns a safe unified error envelope', async () => {
    const app = buildApp({ logger, database });
    app.get('/known', async () => { throw new AppError({ code: 'VALIDATION_ERROR', message: 'Safe', httpStatus: 400 }); });
    app.get('/unknown', async () => { throw new Error('secret stack'); });
    expect((await app.inject('/known')).json().error.message).toBe('Safe');
    const unknown = await app.inject('/unknown'); expect(unknown.statusCode).toBe(200); expect(unknown.body).not.toContain('secret stack'); expect(unknown.json().request_id).toBeTruthy();
    const missing = await app.inject('/missing'); expect(missing.statusCode).toBe(200); expect(missing.json().code).toBe('NOT_FOUND');
    await app.close();
  });
  it('keeps protected routes fail-closed and accepts a test provider', async () => {
    const app = buildApp({ logger, database });
    app.get('/closed', { preHandler: requireAuthentication() }, async () => ({ ok: true }));
    const subjectId = newLogicalUuid();
    app.get('/open', { preHandler: requireAuthentication({ authenticate: async () => ({ subjectId }) }) }, async (request) => ({ subjectId: request.authContext?.subjectId }));
    const closed = await app.inject('/closed');
    expect(closed.statusCode).toBe(200);
    expect(closed.json().code).toBe('AUTHENTICATION_UNAVAILABLE');
    expect((await app.inject('/open')).json().data.subjectId).toBe(subjectId);
    expect((await app.inject('/health/live')).statusCode).toBe(200);
    await app.close();
  });
  it('reports not ready on unavailable or incomplete database', async () => {
    const app = buildApp({ logger, database: { query: async () => { throw new Error('offline'); } } as DatabaseExecutor });
    expect((await app.inject('/health/ready')).statusCode).toBe(503); await app.close();
  });
});
