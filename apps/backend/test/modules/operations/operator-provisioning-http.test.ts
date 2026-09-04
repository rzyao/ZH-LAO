import pino from 'pino';
import { describe, expect, it, vi } from 'vitest';
import { buildApp } from '../../../src/bootstrap/build-app.js';
import type { DatabaseExecutor } from '../../../src/database/executor.js';
import { AppError } from '../../../src/errors/app-error.js';
import { registerOperationsRoutes } from '../../../src/modules/operations/http/routes.js';

const subjectId = '00000000-0000-4000-8000-000000000001';
const operator = {
  id: '00000000-0000-4000-8000-000000000002', authSubjectId: subjectId, displayName: '张三', status: 'active' as const,
  createdAt: new Date('2026-09-04T00:00:00.000Z'), updatedAt: new Date('2026-09-04T00:00:00.000Z'),
};

async function appFor(options: { allowed?: boolean; createError?: Error } = {}) {
  const create = vi.fn();
  if (options.createError) create.mockRejectedValue(options.createError);
  else create.mockResolvedValue({ operator, initialPassword: 'GeneratedPassword123' });
  const service = {
    requirePermission: vi.fn().mockImplementation(async () => {
      if (options.allowed === false) throw new AppError({ code: 'FORBIDDEN', message: 'Permission denied', httpStatus: 403 });
      return { operatorId: 'actor-1', authSubjectId: subjectId };
    }),
  };
  const app = buildApp({ logger: pino({ level: 'silent' }), database: {} as DatabaseExecutor });
  await registerOperationsRoutes(app, {
    service: service as never,
    authentication: { authenticate: async () => ({ subjectId: subjectId as never }) },
    provisioning: { create } as never,
  });
  return { app, create };
}

describe('POST /api/v1/admin/operations/operators', () => {
  it('accepts username and display_name only, returns a no-store one-time password response', async () => {
    const { app, create } = await appFor();
    try {
      const response = await app.inject({ method: 'POST', url: '/api/v1/admin/operations/operators', payload: { username: 'operator_zhang', display_name: '张三' } });
      expect(response.statusCode).toBe(200);
      expect(response.headers['cache-control']).toBe('no-store');
      expect(response.headers.pragma).toBe('no-cache');
      expect(response.json()).toMatchObject({ code: 'OK', data: { operator: { operator_id: operator.id, display_name: '张三' }, initial_password: 'GeneratedPassword123' } });
      expect(create).toHaveBeenCalledWith({ operatorId: 'actor-1', authSubjectId: subjectId }, expect.objectContaining({ username: 'operator_zhang', displayName: '张三' }));
    } finally { await app.close(); }
  });

  it('rejects legacy UUID input before provisioning', async () => {
    const { app, create } = await appFor();
    try {
      const response = await app.inject({ method: 'POST', url: '/api/v1/admin/operations/operators', payload: { auth_subject_id: subjectId, display_name: '张三' } });
      // ADR-023 keeps business failures in a 200 envelope; `code` is authoritative.
      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ code: 'INVALID_ARGUMENT' });
      expect(create).not.toHaveBeenCalled();
    } finally { await app.close(); }
  });

  it('rejects an unauthorized caller before provisioning', async () => {
    const { app, create } = await appFor({ allowed: false });
    try {
      const response = await app.inject({ method: 'POST', url: '/api/v1/admin/operations/operators', payload: { username: 'operator_zhang', display_name: '张三' } });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ code: 'FORBIDDEN' });
      expect(create).not.toHaveBeenCalled();
    } finally { await app.close(); }
  });

  it('returns ADMIN_USERNAME_CONFLICT and does not expose an initial password for a duplicate username', async () => {
    const { app } = await appFor({ createError: new AppError({ code: 'ADMIN_USERNAME_CONFLICT', message: 'Username is already in use', httpStatus: 409 }) });
    try {
      const response = await app.inject({ method: 'POST', url: '/api/v1/admin/operations/operators', payload: { username: 'operator_zhang', display_name: '张三' } });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ code: 'ADMIN_USERNAME_CONFLICT' });
      expect(response.json()).not.toHaveProperty('data.initial_password');
    } finally { await app.close(); }
  });
});
