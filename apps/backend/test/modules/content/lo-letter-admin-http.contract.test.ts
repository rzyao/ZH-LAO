import pino from 'pino';
import { describe, expect, it, vi } from 'vitest';
import { buildApp } from '../../../src/bootstrap/build-app.js';
import type { DatabaseExecutor } from '../../../src/database/executor.js';
import { AppError } from '../../../src/errors/app-error.js';
import type {
  LaoLetterAdminListQuery,
  LaoLetterAdminRepository,
} from '../../../src/modules/content/application/ports/lo-letter-admin-repository.js';
import type { ContentRepository } from '../../../src/modules/content/application/ports/repositories.js';
import { registerContentRoutes } from '../../../src/modules/content/http/composition.js';

const operatorId = '00000000-0000-4000-8000-000000000001';
const contentId = '00000000-0000-4000-8000-000000000002';
const revisionId = '00000000-0000-4000-8000-000000000003';
const updatedAt = new Date('2026-02-01T00:00:00.000Z');
const taskId = '00000000-0000-4000-8000-000000000004';

function createHarness(custom: Readonly<{
  createTask?: (input: Record<string, unknown>) => Promise<Record<string, unknown>>;
  deniedPermissions?: readonly string[];
  ownedTaskExists?: boolean;
  unauthenticated?: boolean;
  retryError?: AppError;
}> = {}) {
  const queries: LaoLetterAdminListQuery[] = [];
  const permissions: string[] = [];
  const batchTaskRequests: Record<string, unknown>[] = [];
  const laoLetterAdminRepository: LaoLetterAdminRepository = {
    list: async (query) => {
      queries.push(query);
      return {
        page: query.page,
        pageSize: query.pageSize,
        total: 777,
        items: [{
          contentId,
          character: 'ກ-draft',
          letterType: 'consonant',
          letterClass: 'cons_middle',
          name: 'ko-draft',
          romanization: 'k-draft',
          sortOrder: 1,
          contentStatus: 'active',
          workingRevisionId: revisionId,
          workingRevisionStatus: 'draft',
          lockVersion: 2,
          updatedAt,
          availableActions: ['submit_review', 'archive'],
        }],
      };
    },
    resolveQuerySelection: async () => [],
    resolveExplicitSelection: async () => [],
  };
  const fallbackContentRepository = {
    listManagedCharacters: vi.fn(async () => []),
  } as unknown as ContentRepository;
  const app = buildApp({ logger: pino({ level: 'silent' }), database: {} as DatabaseExecutor });
  const options = {
    contentRepository: fallbackContentRepository,
    laoLetterAdminRepository,
    laoLetterBatchTaskManager: {
      createTask: async (input: Record<string, unknown>) => {
        batchTaskRequests.push(input);
        return custom.createTask?.(input) ?? {
          taskId,
          action: input.action,
          selectionMode: (input.selection as { mode?: string } | undefined)?.mode,
          status: 'queued',
          targetCount: 2,
          processedCount: 0,
          succeededCount: 0,
          failedCount: 0,
          skippedCount: 0,
          createdAt: updatedAt,
          startedAt: null,
          completedAt: null,
          lastErrorCode: null,
        };
      },
      listOwnedTasks: async ({ page, pageSize }: { page: number; pageSize: number }) => ({
        items: [batchTaskFixture()], page, pageSize, total: 1,
      }),
      getOwnedTask: async ({ page, pageSize }: { page: number; pageSize: number }) => {
        if (custom.ownedTaskExists === false) throw new AppError({ code: 'NOT_FOUND', message: 'Batch task not found', httpStatus: 404 });
        return {
          task: batchTaskFixture(),
          results: {
            items: [{
              internalId: 1n, taskInternalId: 1n, itemNo: 1, contentId, revisionId,
              status: 'failed', errorCode: 'ILLEGAL_STATE_TRANSITION', errorMessage: 'State changed',
              retryCount: 0, lastAttemptAt: updatedAt, completedAt: updatedAt,
              createdAt: updatedAt, updatedAt,
            }],
            page, pageSize, total: 1,
          },
        };
      },
      retryFailed: async () => {
        if (custom.retryError) throw custom.retryError;
        return batchTaskFixture({ status: 'queued', failedCount: 0 });
      },
    },
    contentTransactions: {
      run: async <Result>(operation: (executor: DatabaseExecutor) => Promise<Result>) => operation({
        query: async () => ({ command: 'SET', oid: 0, rows: [], fields: [], rowCount: 0 }),
      }),
    },
    authentication: {
      authenticate: async () => custom.unauthenticated ? null : ({ subjectId: operatorId as never }),
    },
    authorizer: {
      requirePermission: async (_context: unknown, permission: string) => {
        permissions.push(permission);
        if (custom.deniedPermissions?.includes(permission)) {
          throw new AppError({ code: 'FORBIDDEN', message: 'Permission denied', httpStatus: 403 });
        }
        return { operatorId, authSubjectId: operatorId };
      },
    },
    audit: { recordSuccessfulAction: async () => undefined },
  };

  return { app, options, queries, permissions, batchTaskRequests, fallbackContentRepository };
}

function batchTaskFixture(patch: Readonly<Record<string, unknown>> = {}) {
  return {
    internalId: 1n,
    taskId,
    action: 'archive',
    selectionMode: 'explicit_ids',
    selectionQuery: null,
    selectionHash: 'a'.repeat(64),
    expectedCount: 2,
    targetCount: 2,
    reason: 'cleanup',
    requestedByOperatorId: operatorId,
    idempotencyKey: 'fixture',
    status: 'completed_with_issues',
    processedCount: 2,
    succeededCount: 1,
    failedCount: 1,
    skippedCount: 0,
    lastErrorCode: null,
    createdAt: updatedAt,
    updatedAt,
    startedAt: updatedAt,
    completedAt: updatedAt,
    ...patch,
  } as never;
}

async function register(harness: ReturnType<typeof createHarness>) {
  await registerContentRoutes(
    harness.app,
    harness.options as unknown as Parameters<typeof registerContentRoutes>[1],
  );
}

describe('API-LettersQuery HTTP contract (TC-001)', () => {
  it('defaults page size to 50, requires read permission, and uses the ADR-023 envelope', async () => {
    const harness = createHarness();
    await register(harness);
    const response = await harness.app.inject({
      method: 'GET',
      url: '/api/v1/admin/content/lo/letters',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      code: 'OK',
      request_id: expect.any(String),
      data: { page: 1, page_size: 50, total: 777 },
    });
    expect(harness.queries[0]).toMatchObject({ page: 1, pageSize: 50 });
    expect(harness.permissions).toContain('content.lo_letters.read');
    expect(harness.fallbackContentRepository.listManagedCharacters).not.toHaveBeenCalled();
    await harness.app.close();
  });

  it('accepts page_size=500 and parses normalized comma-separated whitelist filters', async () => {
    const harness = createHarness();
    await register(harness);
    const response = await harness.app.inject({
      method: 'GET',
      url: '/api/v1/admin/content/lo/letters?q=%20e%CC%81%20&letter_type=vowel,consonant,vowel&letter_class=cons_middle,cons_high&content_status=disabled,active&revision_status=none,draft&sort=updated_at&order=desc&page=3&page_size=500',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ code: 'OK', data: { page: 3, page_size: 500 } });
    expect(harness.queries[0]).toEqual({
      selection: {
        q: 'é',
        letterType: ['consonant', 'vowel'],
        letterClass: ['cons_high', 'cons_middle'],
        contentStatus: ['active', 'disabled'],
        revisionStatus: ['draft', 'none'],
        sort: 'updated_at',
        order: 'desc',
      },
      page: 3,
      pageSize: 500,
    });
    await harness.app.close();
  });

  it.each([
    ['page_size=501', 'page_size above 500'],
    ['sort=created_at', 'non-whitelisted sort'],
    ['letter_type=consonant%27%20OR%201%3D1', 'non-whitelisted filter'],
    ['unknown_field=value', 'unknown query field'],
  ])('rejects %s (%s) with a safe HTTP-200 validation envelope', async (query) => {
    const harness = createHarness();
    await register(harness);
    const response = await harness.app.inject({
      method: 'GET',
      url: `/api/v1/admin/content/lo/letters?${query}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      code: 'VALIDATION_ERROR',
      request_id: expect.any(String),
      error: { message: expect.any(String) },
    });
    expect(response.body).not.toMatch(/SELECT|content\.contents|stack|constraint/iu);
    expect(harness.queries).toHaveLength(0);
    await harness.app.close();
  });

  it('maps only OpenAPI-safe snake_case fields and exposes no BIGINT or snapshot internals', async () => {
    const harness = createHarness();
    await register(harness);
    const response = await harness.app.inject({
      method: 'GET',
      url: '/api/v1/admin/content/lo/letters',
    });
    const body = response.json() as { data: { items: Array<Record<string, unknown>>; batch_actions: string[] } };
    const item = body.data.items[0]!;

    expect(Object.keys(body.data).sort()).toEqual(['batch_actions', 'items', 'page', 'page_size', 'total']);
    expect(Object.keys(item).sort()).toEqual([
      'available_actions', 'character', 'content_id', 'content_status', 'letter_class',
      'letter_type', 'lock_version', 'name', 'romanization', 'sort_order', 'updated_at',
      'working_revision_id', 'working_revision_status',
    ].sort());
    expect(item).toMatchObject({
      content_id: contentId,
      working_revision_id: revisionId,
      updated_at: updatedAt.toISOString(),
      available_actions: ['submit_review', 'archive'],
    });
    expect(body.data.batch_actions).toEqual(expect.arrayContaining([
      'submit_review', 'approve', 'reject', 'publish', 'archive',
    ]));
    expect(response.body).not.toMatch(/internal_id|database_id|snapshot|entity_id/iu);
    await harness.app.close();
  });

  it.each([
    ['original action permission revoked', new AppError({ code: 'FORBIDDEN', message: 'Permission denied', httpStatus: 403 }), 'FORBIDDEN'],
    ['task is no longer retryable', new AppError({ code: 'BATCH_TASK_NOT_RETRYABLE', message: 'No failed items', httpStatus: 409 }), 'BATCH_TASK_NOT_RETRYABLE'],
  ] as const)('returns the registered retry error when %s', async (_label, retryError, code) => {
    const harness = createHarness({ retryError });
    await register(harness);
    const response = await harness.app.inject({
      method: 'POST',
      url: `/api/v1/admin/content/lo/letters/batch-tasks/${taskId}/retry-failed`,
      headers: { 'idempotency-key': `retry-${code.toLowerCase()}` },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ code, request_id: expect.any(String) });
    await harness.app.close();
  });
});

describe('API-LettersSelectionPreview HTTP contract (TC-002/TC-003)', () => {
  it('returns one normalized query/count/hash for semantically identical query bodies', async () => {
    const harness = createHarness();
    await register(harness);
    const bodies = [
      {
        query: {
          q: ' e\u0301 ', letter_type: ['vowel', 'consonant', 'vowel'],
          content_status: ['disabled', 'active'], sort: 'updated_at', order: 'desc',
        },
      },
      {
        query: {
          q: 'é', letter_type: ['consonant', 'vowel'],
          content_status: ['active', 'disabled'], sort: 'updated_at', order: 'desc',
        },
      },
    ];

    const responses = [];
    for (const body of bodies) {
      responses.push(await harness.app.inject({
        method: 'POST',
        url: '/api/v1/admin/content/lo/letters/selection-preview',
        payload: body,
      }));
    }

    for (const response of responses) {
      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        code: 'OK',
        request_id: expect.any(String),
        data: {
          query: {
            q: 'é',
            letter_type: ['consonant', 'vowel'],
            content_status: ['active', 'disabled'],
            sort: 'updated_at',
            order: 'desc',
          },
          expected_count: expect.any(Number),
          selection_hash: expect.stringMatching(/^[a-f0-9]{64}$/u),
        },
      });
    }
    expect(responses[1]!.json().data).toEqual(responses[0]!.json().data);
    expect(harness.permissions.filter((permission) => permission === 'content.lo_letters.read')).toHaveLength(2);
    await harness.app.close();
  });

  it('rejects unknown preview fields without resolving or writing a selection', async () => {
    const harness = createHarness();
    await register(harness);
    const response = await harness.app.inject({
      method: 'POST',
      url: '/api/v1/admin/content/lo/letters/selection-preview',
      payload: { query: {}, page: 1 },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
    await harness.app.close();
  });
});

describe('API-LettersBatchStart HTTP contract (TC-003/TC-004/TC-007)', () => {
  const url = '/api/v1/admin/content/lo/letters/batch-tasks';
  const explicitSelection = {
    mode: 'explicit_ids',
    content_ids: [contentId, revisionId],
    expected_count: 2,
  } as const;

  it.each([
    ['missing header', undefined, { action: 'archive', selection: explicitSelection, reason: 'cleanup' }],
    ['blank header', ' ', { action: 'archive', selection: explicitSelection, reason: 'cleanup' }],
    ['oversized header', 'x'.repeat(129), { action: 'archive', selection: explicitSelection, reason: 'cleanup' }],
    ['unknown body field', 'strict-1', { action: 'archive', selection: explicitSelection, reason: 'cleanup', unknown: true }],
    ['unknown selection field', 'strict-2', { action: 'archive', selection: { ...explicitSelection, page: 1 }, reason: 'cleanup' }],
    ['invalid UUID', 'strict-3', { action: 'archive', selection: { mode: 'explicit_ids', content_ids: ['database-id-12'], expected_count: 1 }, reason: 'cleanup' }],
    ['duplicate UUID', 'strict-4', { action: 'archive', selection: { mode: 'explicit_ids', content_ids: [contentId, contentId], expected_count: 2 }, reason: 'cleanup' }],
    ['mismatched count', 'strict-5', { action: 'archive', selection: { ...explicitSelection, expected_count: 1 }, reason: 'cleanup' }],
    ['reason on approve', 'strict-6', { action: 'approve', selection: explicitSelection, reason: 'forbidden' }],
    ['blank archive reason', 'strict-7', { action: 'archive', selection: explicitSelection, reason: '   ' }],
  ])('strictly rejects %s', async (_label, idempotencyKey, payload) => {
    const harness = createHarness();
    await register(harness);
    const response = await harness.app.inject({
      method: 'POST',
      url,
      ...(idempotencyKey === undefined ? {} : { headers: { 'idempotency-key': idempotencyKey } }),
      payload,
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      code: 'VALIDATION_ERROR',
      request_id: expect.any(String),
      error: { message: expect.any(String) },
    });
    expect(harness.batchTaskRequests).toHaveLength(0);
    await harness.app.close();
  });

  it.each([
    ['submit_review', 'content.lo_letters.write'],
    ['approve', 'content.lo_letters.review'],
    ['reject', 'content.lo_letters.review'],
    ['publish', 'content.lo_letters.publish'],
    ['archive', 'content.lo_letters.write'],
  ] as const)('requires the exact permission for %s and forwards a canonical request', async (action, permission) => {
    const harness = createHarness();
    await register(harness);
    const reason = action === 'reject' || action === 'archive' ? '  reviewed reason  ' : undefined;
    const response = await harness.app.inject({
      method: 'POST',
      url,
      headers: { 'idempotency-key': `permission-${action}` },
      payload: { action, selection: explicitSelection, ...(reason === undefined ? {} : { reason }) },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ code: 'OK', request_id: expect.any(String) });
    expect(harness.permissions).toContain(permission);
    expect(harness.batchTaskRequests).toEqual([expect.objectContaining({
      operatorId,
      idempotencyKey: `permission-${action}`,
      action,
      selection: { mode: 'explicit_ids', contentIds: [contentId, revisionId], expectedCount: 2 },
      ...(reason === undefined ? {} : { reason: 'reviewed reason' }),
    })]);
    await harness.app.close();

    const denied = createHarness({ deniedPermissions: [permission] });
    await register(denied);
    const forbidden = await denied.app.inject({
      method: 'POST',
      url,
      headers: { 'idempotency-key': `forbidden-${action}` },
      payload: { action, selection: explicitSelection, ...(reason === undefined ? {} : { reason }) },
    });
    expect(forbidden.statusCode).toBe(200);
    expect(forbidden.json()).toMatchObject({ code: 'FORBIDDEN', request_id: expect.any(String) });
    expect(denied.batchTaskRequests).toHaveLength(0);
    await denied.app.close();
  });

  it('returns an ADR-023 envelope containing only the public task UUID and safe summary fields', async () => {
    const harness = createHarness();
    await register(harness);
    const response = await harness.app.inject({
      method: 'POST',
      url,
      headers: { 'idempotency-key': 'safe-response-1' },
      payload: { action: 'archive', selection: explicitSelection, reason: 'cleanup' },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json() as { code: string; request_id: string; data: Record<string, unknown> };
    expect(body.code).toBe('OK');
    expect(body.request_id).toEqual(expect.any(String));
    expect(body.data.task_id).toBe(taskId);
    expect(Object.keys(body.data).sort()).toEqual([
      'action', 'completed_at', 'created_at', 'failed_count', 'last_error_code', 'processed_count',
      'selection_mode', 'skipped_count', 'started_at', 'status', 'succeeded_count', 'target_count', 'task_id',
    ].sort());
    expect(response.body).not.toMatch(/internal_id|database_id|operator_id|selection_hash|selection_query|reason|bigint/iu);
    await harness.app.close();
  });

  it.each([
    ['RATE_LIMITED', { retry_after_seconds: 5 }],
    ['BATCH_SELECTION_CHANGED', undefined],
    ['CONFLICT', undefined],
  ] as const)('maps %s to a safe HTTP-200 business envelope', async (code, details) => {
    const harness = createHarness({
      createTask: async () => {
        throw new AppError({
          code: code as never,
          message: code === 'RATE_LIMITED' ? 'Too many active tasks' : 'Batch request rejected',
          httpStatus: code === 'RATE_LIMITED' ? 429 : 409,
          ...(details === undefined ? {} : { details }),
        });
      },
    });
    await register(harness);
    const response = await harness.app.inject({
      method: 'POST',
      url,
      headers: { 'idempotency-key': `business-${code}` },
      payload: { action: 'archive', selection: explicitSelection, reason: 'cleanup' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      code,
      request_id: expect.any(String),
      error: {
        message: expect.any(String),
        ...(details === undefined ? {} : { details }),
      },
    });
    expect(response.body).not.toMatch(/\bSELECT\b|constraint|stack|internal_id/iu);
    await harness.app.close();
  });
});

describe('owned batch task HTTP contracts (TC-009)', () => {
  it.each([
    ['history', 'GET', '/api/v1/admin/content/lo/letters/batch-tasks?page=1&page_size=20'],
    ['detail', 'GET', `/api/v1/admin/content/lo/letters/batch-tasks/${taskId}?page=1&page_size=20&status=failed`],
    ['retry', 'POST', `/api/v1/admin/content/lo/letters/batch-tasks/${taskId}/retry-failed`],
  ] as const)('returns the safe %s API envelope without exposing ownership', async (_label, method, url) => {
    const harness = createHarness();
    await register(harness);
    const response = await harness.app.inject({ method, url, ...(method === 'POST' ? { headers: { 'idempotency-key': 'retry-1' } } : {}) });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ code: 'OK', request_id: expect.any(String), data: expect.any(Object) });
    expect(response.body).not.toMatch(/requested_by_operator_id|internal_id|database_id/iu);
    await harness.app.close();
  });

  it('maps another operator task to NOT_FOUND instead of revealing ownership', async () => {
    const harness = createHarness({ ownedTaskExists: false });
    await register(harness);
    const response = await harness.app.inject({ method: 'GET', url: `/api/v1/admin/content/lo/letters/batch-tasks/${taskId}` });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ code: 'NOT_FOUND', request_id: expect.any(String) });
    await harness.app.close();
  });

  it.each([
    ['history invalid page', 'GET', '/api/v1/admin/content/lo/letters/batch-tasks?page=0', undefined, undefined],
    ['detail invalid UUID', 'GET', '/api/v1/admin/content/lo/letters/batch-tasks/not-a-uuid', undefined, undefined],
    ['detail unknown query', 'GET', `/api/v1/admin/content/lo/letters/batch-tasks/${taskId}?unknown=true`, undefined, undefined],
    ['retry missing idempotency key', 'POST', `/api/v1/admin/content/lo/letters/batch-tasks/${taskId}/retry-failed`, undefined, undefined],
  ] as const)('returns safe validation for %s', async (_label, method, url, headers, payload) => {
    const harness = createHarness();
    await register(harness);
    const response = await harness.app.inject({ method, url, ...(headers ? { headers } : {}), ...(payload ? { payload } : {}) });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR', request_id: expect.any(String) });
    await harness.app.close();
  });
});

describe('Lao-letter endpoint authentication and read authorization', () => {
  const endpoints = [
    ['list', 'GET', '/api/v1/admin/content/lo/letters', undefined, undefined],
    ['preview', 'POST', '/api/v1/admin/content/lo/letters/selection-preview', undefined, { query: {} }],
    ['start', 'POST', '/api/v1/admin/content/lo/letters/batch-tasks', { 'idempotency-key': 'auth-start' }, { action: 'archive', selection: { mode: 'explicit_ids', content_ids: [contentId], expected_count: 1 }, reason: 'cleanup' }],
    ['history', 'GET', '/api/v1/admin/content/lo/letters/batch-tasks', undefined, undefined],
    ['detail', 'GET', `/api/v1/admin/content/lo/letters/batch-tasks/${taskId}`, undefined, undefined],
    ['retry', 'POST', `/api/v1/admin/content/lo/letters/batch-tasks/${taskId}/retry-failed`, { 'idempotency-key': 'auth-retry' }, undefined],
  ] as const;

  it.each(endpoints)('rejects unauthenticated %s', async (_label, method, url, headers, payload) => {
    const harness = createHarness({ unauthenticated: true });
    await register(harness);
    const response = await harness.app.inject({ method, url, ...(headers ? { headers } : {}), ...(payload ? { payload } : {}) });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ code: 'UNAUTHENTICATED', request_id: expect.any(String) });
    await harness.app.close();
  });

  it.each(endpoints.filter(([label]) => label !== 'start'))('rejects read-denied %s', async (_label, method, url, headers, payload) => {
    const harness = createHarness({ deniedPermissions: ['content.lo_letters.read'] });
    await register(harness);
    const response = await harness.app.inject({ method, url, ...(headers ? { headers } : {}), ...(payload ? { payload } : {}) });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ code: 'FORBIDDEN', request_id: expect.any(String) });
    await harness.app.close();
  });
});
