import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../../src/bootstrap/build-app.js';
import { AppError } from '../../src/errors/app-error.js';
import { requireAuthentication } from '../../src/auth/auth-hook.js';
import { newLogicalUuid } from '../../src/ids/uuid.js';
import type { DatabaseExecutor } from '../../src/database/executor.js';

const database = { query: async () => ({ rows: [{ database_ok: true }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }) } as DatabaseExecutor;
const logger = pino({ level: 'silent' });

describe('Fastify foundation', () => {
  it('serves liveness and readiness with request IDs', async () => {
    const app = buildApp({ logger, database });
    expect((await app.inject('/health/live')).statusCode).toBe(200);
    const ready = await app.inject('/health/ready'); expect(ready.statusCode).toBe(200); expect(ready.headers['x-request-id']).toBeDefined();
    await app.close();
  });
  it('returns a safe unified error envelope', async () => {
    const app = buildApp({ logger, database });
    app.get('/known', async () => { throw new AppError({ code: 'KNOWN', message: 'Safe', httpStatus: 400 }); });
    app.get('/unknown', async () => { throw new Error('secret stack'); });
    expect((await app.inject('/known')).json().error.message).toBe('Safe');
    const unknown = await app.inject('/unknown'); expect(unknown.statusCode).toBe(500); expect(unknown.body).not.toContain('secret stack'); expect(unknown.json().error.request_id).toBeTruthy();
    const missing = await app.inject('/missing'); expect(missing.statusCode).toBe(404); expect(missing.json().error.code).toBe('NOT_FOUND');
    await app.close();
  });
  it('keeps protected routes fail-closed and accepts a test provider', async () => {
    const app = buildApp({ logger, database });
    app.get('/closed', { preHandler: requireAuthentication() }, async () => ({ ok: true }));
    const subjectId = newLogicalUuid();
    app.get('/open', { preHandler: requireAuthentication({ authenticate: async () => ({ subjectId }) }) }, async (request) => ({ subjectId: request.authContext?.subjectId }));
    expect((await app.inject('/closed')).statusCode).toBe(503);
    expect((await app.inject('/open')).json().subjectId).toBe(subjectId);
    expect((await app.inject('/health/live')).statusCode).toBe(200);
    await app.close();
  });
  it('reports not ready on unavailable or incomplete database', async () => {
    const app = buildApp({ logger, database: { query: async () => { throw new Error('offline'); } } as DatabaseExecutor });
    expect((await app.inject('/health/ready')).statusCode).toBe(503); await app.close();
  });
});
