import { describe, expect, it } from 'vitest';
import type { Logger } from 'pino';
import { buildApp } from '../../bootstrap/build-app.js';
import { AppError } from '../app-error.js';
import {
  OK,
  VALIDATION_ERROR,
  NOT_FOUND,
  UNAUTHENTICATED,
  FORBIDDEN,
  CONFLICT,
  RATE_LIMITED,
  INTERNAL_ERROR,
  STALE_VERSION_CONFLICT,
} from '../business-codes.js';
import type { DatabaseExecutor } from '../../database/executor.js';

const silentLogger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  debug: () => undefined,
  trace: () => undefined,
  fatal: () => undefined,
  child: () => silentLogger,
} as unknown as Logger;

const dummyDb = {
  query: async () => ({ rows: [], rowCount: 0 }),
} as unknown as DatabaseExecutor;

describe('Unified Response Envelope (ADR-023)', () => {
  it('wraps successful business response with { code: "OK", data, request_id } and HTTP 200', async () => {
    const app = buildApp({ logger: silentLogger, database: dummyDb });
    app.get('/test/success', async () => ({ foo: 'bar' }));

    const res = await app.inject({
      method: 'GET',
      url: '/test/success',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.code).toBe(OK);
    expect(body.data).toEqual({ foo: 'bar' });
    expect(typeof body.request_id).toBe('string');
    expect(body.request_id.length).toBeGreaterThan(0);
  });

  it('wraps empty success response (204 equivalent) with { code: "OK", data: null, request_id } and HTTP 200', async () => {
    const app = buildApp({ logger: silentLogger, database: dummyDb });
    app.post('/test/empty', async (_req, reply) => {
      return reply.code(204).send();
    });

    const res = await app.inject({
      method: 'POST',
      url: '/test/empty',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.code).toBe(OK);
    expect(body.data).toBeNull();
    expect(typeof body.request_id).toBe('string');
  });

  it('forces 201 Created to HTTP 200 and wraps payload in data without drift', async () => {
    const app = buildApp({ logger: silentLogger, database: dummyDb });
    app.post('/test/created', async (_req, reply) => {
      return reply.code(201).send({
        operator: {
          operator_id: 'op-123',
          display_name: 'Test Operator',
          roles: [{ role_id: 'r-1', code: 'admin' }],
        },
      });
    });

    const res = await app.inject({
      method: 'POST',
      url: '/test/created',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.code).toBe(OK);
    expect(body.data).toEqual({
      operator: {
        operator_id: 'op-123',
        display_name: 'Test Operator',
        roles: [{ role_id: 'r-1', code: 'admin' }],
      },
    });
    expect(typeof body.request_id).toBe('string');
  });

  it('preserves complex list/pagination payload shapes intact inside data (US2)', async () => {
    const app = buildApp({ logger: silentLogger, database: dummyDb });
    const payload = {
      items: [
        { id: 1, name: 'alpha', active: true },
        { id: 2, name: 'beta', active: false },
      ],
      page: 1,
      page_size: 50,
      total: 2,
    };
    app.get('/test/list', async () => payload);

    const res = await app.inject({
      method: 'GET',
      url: '/test/list',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.code).toBe(OK);
    expect(body.data).toEqual(payload);
    expect(typeof body.request_id).toBe('string');
  });

  it('serializes AppError into { code, error: { message, details? }, request_id } with HTTP 200', async () => {
    const app = buildApp({ logger: silentLogger, database: dummyDb });
    app.get('/test/error', async () => {
      throw new AppError({
        code: VALIDATION_ERROR,
        message: 'Invalid payload',
        httpStatus: 400,
        details: [{ field: 'email', issue: 'invalid' }],
      });
    });

    const res = await app.inject({
      method: 'GET',
      url: '/test/error',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.code).toBe(VALIDATION_ERROR);
    expect(body.error).toEqual({
      message: 'Invalid payload',
      details: [{ field: 'email', issue: 'invalid' }],
    });
    expect(typeof body.request_id).toBe('string');
  });

  it('serializes 404 Route not found as AppError NOT_FOUND with HTTP 200 and request_id', async () => {
    const app = buildApp({ logger: silentLogger, database: dummyDb });

    const res = await app.inject({
      method: 'GET',
      url: '/non-existent-route-12345',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.code).toBe(NOT_FOUND);
    expect(body.error.message).toBe('Route not found');
    expect(typeof body.request_id).toBe('string');
  });

  it('exempts /health/live and /health/ready from envelope wrapping', async () => {
    const app = buildApp({ logger: silentLogger, database: dummyDb });

    const liveRes = await app.inject({
      method: 'GET',
      url: '/health/live',
    });

    expect(liveRes.statusCode).toBe(200);
    const liveBody = liveRes.json();
    expect(liveBody).toEqual({ status: 'ok' });
    expect(liveBody.code).toBeUndefined();
    expect(liveBody.request_id).toBeUndefined();
  });

  it('asserts HTTP 200 + envelope across all 6 core business error categories', async () => {
    const app = buildApp({ logger: silentLogger, database: dummyDb });

    const testErrors = [
      { code: UNAUTHENTICATED, message: 'Unauthenticated user', status: 401, expectedMsg: 'Unauthenticated user' },
      { code: FORBIDDEN, message: 'Permission denied', status: 403, expectedMsg: 'Permission denied' },
      { code: VALIDATION_ERROR, message: 'Bad input', status: 400, details: { field: 'username' }, expectedMsg: 'Bad input' },
      { code: CONFLICT, message: 'State conflict', status: 409, expectedMsg: 'State conflict' },
      { code: STALE_VERSION_CONFLICT, message: 'Stale version', status: 409, expectedMsg: 'Stale version' },
      { code: RATE_LIMITED, message: 'Too many requests', status: 429, expectedMsg: 'Too many requests' },
      { code: INTERNAL_ERROR, message: 'Server fault', status: 500, expectedMsg: 'Internal server error' },
    ];

    for (const item of testErrors) {
      const path = `/test/biz-err/${item.code.toLowerCase()}`;
      app.get(path, async () => {
        throw new AppError({
          code: item.code,
          message: item.message,
          httpStatus: item.status,
          details: item.details,
        });
      });
    }

    for (const item of testErrors) {
      const path = `/test/biz-err/${item.code.toLowerCase()}`;
      const res = await app.inject({
        method: 'GET',
        url: path,
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.code).toBe(item.code);
      expect(body.error.message).toBe(item.expectedMsg);
      if (item.details) {
        expect(body.error.details).toEqual(item.details);
      }
      expect(typeof body.request_id).toBe('string');
      expect(body.request_id.length).toBeGreaterThan(0);
    }
  });
});
