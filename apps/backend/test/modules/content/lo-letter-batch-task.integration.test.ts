import pino from 'pino';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { TransactionManager } from '../../../src/database/transaction-manager.js';
import { AppError } from '../../../src/errors/app-error.js';
import { ManageLaoLetterSelection } from '../../../src/modules/content/application/use-cases/manage-lo-letter-selection.js';
import type { LaoLetterQueryInput } from '../../../src/modules/content/domain/lo-letter-admin-query.js';
import { PostgresLaoLetterAdminRepository } from '../../../src/modules/content/infrastructure/postgres-lo-letter-admin-repository.js';
import { createLaoLetterBatchTestDatabase } from './lo-letter-batch-fixtures.js';

const repositoryModulePath = '../../../src/modules/content/infrastructure/postgres-lo-letter-batch-repository.js';
const useCaseModulePath = '../../../src/modules/content/application/use-cases/manage-lo-letter-batch-tasks.js';

type Selection =
  | Readonly<{ mode: 'explicit_ids'; contentIds: readonly string[]; expectedCount: number }>
  | Readonly<{ mode: 'query_all'; query: Readonly<Record<string, unknown>>; expectedCount: number; selectionHash: string }>;
type CreateTaskInput = Readonly<{
  operatorId: string;
  idempotencyKey: string;
  action: 'submit_review' | 'approve' | 'reject' | 'publish' | 'archive';
  selection: Selection;
  reason?: string;
}>;
type TaskResult = Readonly<{ taskId: string; targetCount: number; reason: string | null; status: string }>;
type TaskManager = Readonly<{
  createTask(input: CreateTaskInput): Promise<TaskResult>;
  listOwnedTasks(input: { operatorId: string; page: number; pageSize: number }): Promise<{ items: readonly TaskResult[]; total: number }>;
  getOwnedTask(input: { operatorId: string; taskId: string; page: number; pageSize: number; status?: 'queued' | 'running' | 'succeeded' | 'failed' | 'skipped' }): Promise<{ task: TaskResult; results: { items: readonly { status: string }[]; total: number } }>;
  retryFailed(input: { operatorId: string; taskId: string }): Promise<TaskResult>;
}>;
type BatchRepositoryModule = Readonly<{
  PostgresLaoLetterBatchRepository: new (transactions: TransactionManager) => unknown;
}>;
type BatchUseCaseModule = Readonly<{
  ManageLaoLetterBatchTasks: new (dependencies: Readonly<{
    repository: unknown;
    selection: ManageLaoLetterSelection;
    transactions: TransactionManager;
    authorization: Readonly<{ requirePermission(operatorId: string, permission: string): Promise<void> }>;
    activeTaskLimit: number;
    retryAfterSeconds: number;
  }>) => TaskManager;
}>;
const adminUrl = process.env.ADMIN_DATABASE_URL;
const integration = adminUrl ? describe.sequential : describe.skip;

integration('PostgreSQL Lao-letter batch task admission (TC-003/TC-004/TC-007)', () => {
  let database: Awaited<ReturnType<typeof createLaoLetterBatchTestDatabase>>;
  let pool: pg.Pool;
  let transactions: TransactionManager;
  let createManager: (
    activeTaskLimit?: number,
    authorization?: Readonly<{ requirePermission(operatorId: string, permission: string): Promise<void> }>,
  ) => TaskManager;
  const authorizedPermissions: string[] = [];

  beforeAll(async () => {
    database = await createLaoLetterBatchTestDatabase(adminUrl!, { pageSize: 4, pageCount: 2 });
    pool = new pg.Pool({ connectionString: database.url, max: 8 });
    transactions = new TransactionManager(pool, pino({ level: 'silent' }));

    // Load only after the disposable PostgreSQL database exists so a missing
    // implementation is a genuine red gate rather than an environment skip.
    const repositoryModule = await import(/* @vite-ignore */ repositoryModulePath) as BatchRepositoryModule;
    const useCaseModule = await import(/* @vite-ignore */ useCaseModulePath) as BatchUseCaseModule;
    const batchRepository = new repositoryModule.PostgresLaoLetterBatchRepository(transactions);
    const selectionRepository = new PostgresLaoLetterAdminRepository(transactions);
    const selection = new ManageLaoLetterSelection(selectionRepository, transactions);
    createManager = (activeTaskLimit = 100, authorization = {
      requirePermission: async (_operatorId: string, permission: string) => { authorizedPermissions.push(permission); },
    }) => new useCaseModule.ManageLaoLetterBatchTasks({
      repository: batchRepository,
      selection,
      transactions,
      authorization,
      activeTaskLimit,
      retryAfterSeconds: 5,
    });
  }, 120_000);

  beforeEach(async () => {
    authorizedPermissions.length = 0;
    await pool.query('TRUNCATE content.lo_letter_batch_task_items, content.lo_letter_batch_tasks RESTART IDENTITY');
  });

  afterAll(async () => {
    await pool?.end();
    await database?.dispose();
  }, 30_000);

  it('freezes the exact stable UUID/revision set and persists zeroed counters atomically', async () => {
    const targets = database.fixture.letters.slice(0, 3);
    const task = await createManager().createTask({
      operatorId: database.fixture.operators[0]!.id,
      idempotencyKey: 'freeze-explicit-1',
      action: 'archive',
      reason: '  清理过期内容  ',
      selection: {
        mode: 'explicit_ids',
        contentIds: [targets[2]!.contentId, targets[0]!.contentId, targets[1]!.contentId],
        expectedCount: 3,
      },
    });

    expect(task).toMatchObject({ targetCount: 3, reason: '清理过期内容', status: 'queued' });
    expect(authorizedPermissions).toContain('content.lo_letters.write');
    expect(task.taskId).toMatch(/^[0-9a-f-]{36}$/u);
    const persisted = await pool.query<{
      public_id: string; expected_count: number; target_count: number; processed_count: number;
      succeeded_count: number; failed_count: number; skipped_count: number;
    }>('SELECT public_id, expected_count, target_count, processed_count, succeeded_count, failed_count, skipped_count FROM content.lo_letter_batch_tasks');
    expect(persisted.rows).toEqual([expect.objectContaining({
      public_id: task.taskId,
      expected_count: 3,
      target_count: 3,
      processed_count: 0,
      succeeded_count: 0,
      failed_count: 0,
      skipped_count: 0,
    })]);
    const items = await pool.query<{ item_no: number; content_id: string; revision_id: string | null; status: string }>(
      'SELECT item_no, content_id, revision_id, status FROM content.lo_letter_batch_task_items ORDER BY item_no',
    );
    const expectedTargets = [...targets]
      .sort((left, right) => left.contentId.localeCompare(right.contentId, 'en'))
      .map((target, index) => ({
        item_no: index + 1,
        content_id: target.contentId,
        revision_id: target.workingRevisionId,
        status: 'queued',
      }));
    expect(items.rows).toEqual(expectedTargets);
  });

  it('enforces the configured active-task admission limit without imposing a target-count limit', async () => {
    const manager = createManager(1);
    const first = database.fixture.letters[0]!;
    await manager.createTask({
      operatorId: database.fixture.operators[0]!.id,
      idempotencyKey: 'active-limit-1',
      action: 'archive',
      reason: 'first',
      selection: { mode: 'explicit_ids', contentIds: [first.contentId], expectedCount: 1 },
    });
    await expect(manager.createTask({
      operatorId: database.fixture.operators[0]!.id,
      idempotencyKey: 'active-limit-2',
      action: 'archive',
      reason: 'second',
      selection: {
        mode: 'explicit_ids',
        contentIds: database.fixture.letters.map((letter) => letter.contentId),
        expectedCount: database.fixture.letters.length,
      },
    })).rejects.toMatchObject({ code: 'RATE_LIMITED', details: { retry_after_seconds: 5 } });
    expect((await pool.query('SELECT 1 FROM content.lo_letter_batch_tasks')).rowCount).toBe(1);
  });

  it('rechecks the exact action permission before opening an admission transaction', async () => {
    const manager = createManager(100, {
      requirePermission: async (_operatorId, permission) => {
        expect(permission).toBe('content.lo_letters.review');
        throw new AppError({ code: 'FORBIDDEN', message: 'Permission denied', httpStatus: 403 });
      },
    });
    await expect(manager.createTask({
      operatorId: database.fixture.operators[0]!.id,
      idempotencyKey: 'permission-denied-1',
      action: 'approve',
      selection: { mode: 'explicit_ids', contentIds: [database.fixture.letters[0]!.contentId], expectedCount: 1 },
    })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect((await pool.query('SELECT 1 FROM content.lo_letter_batch_tasks')).rowCount).toBe(0);
  });

  it('returns the original task for the same canonical request and rejects key reuse for a different request', async () => {
    const manager = createManager();
    const input: CreateTaskInput = {
      operatorId: database.fixture.operators[0]!.id,
      idempotencyKey: 'canonical-replay-1',
      action: 'archive',
      reason: '  canonical reason  ',
      selection: {
        mode: 'explicit_ids',
        contentIds: database.fixture.letters.slice(0, 2).map((letter) => letter.contentId),
        expectedCount: 2,
      },
    };
    const first = await manager.createTask(input);
    const replay = await manager.createTask({ ...input, reason: 'canonical reason' });
    expect(replay.taskId).toBe(first.taskId);
    expect((await pool.query('SELECT 1 FROM content.lo_letter_batch_tasks')).rowCount).toBe(1);
    expect((await pool.query('SELECT 1 FROM content.lo_letter_batch_task_items')).rowCount).toBe(2);

    await expect(manager.createTask({ ...input, action: 'reject' })).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(manager.createTask({ ...input, reason: 'different reason' })).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(manager.createTask({
      ...input,
      selection: { mode: 'explicit_ids', contentIds: [database.fixture.letters[0]!.contentId], expectedCount: 1 },
    })).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it.each([
    ['reject', undefined],
    ['archive', '   '],
    ['approve', 'not allowed'],
    ['publish', 'not allowed'],
    ['submit_review', 'not allowed'],
  ] as const)('rejects invalid reason combination for %s', async (action, reason) => {
    const before = await pool.query('SELECT 1 FROM content.lo_letter_batch_tasks');
    await expect(createManager().createTask({
      operatorId: database.fixture.operators[0]!.id,
      idempotencyKey: `reason-${action}`,
      action,
      ...(reason === undefined ? {} : { reason }),
      selection: { mode: 'explicit_ids', contentIds: [database.fixture.letters[0]!.contentId], expectedCount: 1 },
    })).rejects.toMatchObject({ code: expect.stringMatching(/VALIDATION_ERROR|INVALID_ARGUMENT/u) });
    expect((await pool.query('SELECT 1 FROM content.lo_letter_batch_tasks')).rowCount).toBe(before.rowCount);
  });

  it('rejects query-all selection drift and commits neither task nor frozen items', async () => {
    const manager = createManager();
    const selection = new ManageLaoLetterSelection(new PostgresLaoLetterAdminRepository(transactions), transactions);
    const query: LaoLetterQueryInput = { contentStatus: ['active'], sort: 'sort_order', order: 'asc' };
    const preview = await selection.previewQuery(query);
    const changed = database.fixture.letters.find((letter) => letter.contentStatus === 'active')!;
    await pool.query("UPDATE content.contents SET status = 'archived' WHERE public_id = $1", [changed.contentId]);

    await expect(manager.createTask({
      operatorId: database.fixture.operators[0]!.id,
      idempotencyKey: 'drift-1',
      action: 'submit_review',
      selection: {
        mode: 'query_all',
        query,
        expectedCount: preview.expectedCount,
        selectionHash: preview.selectionHash,
      },
    })).rejects.toMatchObject({ code: 'BATCH_SELECTION_CHANGED' });
    const counts = await pool.query<{ tasks: number; items: number }>(`
      SELECT
        (SELECT count(*)::int FROM content.lo_letter_batch_tasks) AS tasks,
        (SELECT count(*)::int FROM content.lo_letter_batch_task_items) AS items`);
    expect(counts.rows[0]).toEqual({ tasks: 0, items: 0 });
  });

  it('pages creator-owned history with a task-status filter and stable totals', async () => {
    const manager = createManager();
    for (const [index, letter] of database.fixture.letters.slice(0, 2).entries()) {
      await manager.createTask({
        operatorId: database.fixture.operators[0]!.id,
        idempotencyKey: `owned-history-${index}`,
        action: 'archive',
        reason: 'history',
        selection: { mode: 'explicit_ids', contentIds: [letter.contentId], expectedCount: 1 },
      });
    }
    const page = await manager.listOwnedTasks({ operatorId: database.fixture.operators[0]!.id, page: 1, pageSize: 1 });
    expect(page.total).toBe(2);
    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({ status: 'queued' });
  });

  it('does not disclose another operator task and pages owned items by status', async () => {
    const manager = createManager();
    const task = await manager.createTask({
      operatorId: database.fixture.operators[0]!.id,
      idempotencyKey: 'owned-detail-1',
      action: 'archive',
      reason: 'detail',
      selection: {
        mode: 'explicit_ids',
        contentIds: database.fixture.letters.slice(0, 2).map((letter) => letter.contentId),
        expectedCount: 2,
      },
    });
    await expect(manager.getOwnedTask({ operatorId: database.fixture.operators[1]!.id, taskId: task.taskId, page: 1, pageSize: 20 }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(manager.getOwnedTask({ operatorId: database.fixture.operators[0]!.id, taskId: task.taskId, page: 1, pageSize: 1, status: 'queued' }))
      .resolves.toMatchObject({ task: { taskId: task.taskId }, results: { total: 2, items: [{ status: 'queued' }] } });
  });

  it('validates owned-task paging and requeues a creator-owned failed item through the service', async () => {
    const manager = createManager();
    await expect(manager.listOwnedTasks({ operatorId: database.fixture.operators[0]!.id, page: 0, pageSize: 20 }))
      .rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    await expect(manager.getOwnedTask({ operatorId: 'invalid', taskId: crypto.randomUUID(), page: 1, pageSize: 20 }))
      .rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    await expect(manager.retryFailed({ operatorId: database.fixture.operators[0]!.id, taskId: 'invalid' }))
      .rejects.toMatchObject({ code: 'VALIDATION_ERROR' });

    const task = await manager.createTask({
      operatorId: database.fixture.operators[0]!.id,
      idempotencyKey: 'owned-retry-service-1',
      action: 'archive',
      reason: 'retry',
      selection: { mode: 'explicit_ids', contentIds: [database.fixture.letters[0]!.contentId], expectedCount: 1 },
    });
    await pool.query(`UPDATE content.lo_letter_batch_task_items
      SET status='failed', error_code='INTERNAL_ERROR', error_message='Task execution failed', last_attempt_at=now(), completed_at=now()
      WHERE task_id=(SELECT id FROM content.lo_letter_batch_tasks WHERE public_id=$1)`, [task.taskId]);
    await pool.query(`UPDATE content.lo_letter_batch_tasks
      SET status='failed', processed_count=1, failed_count=1, started_at=now(), completed_at=now(), last_error_code='INTERNAL_ERROR'
      WHERE public_id=$1`, [task.taskId]);
    await expect(manager.retryFailed({ operatorId: database.fixture.operators[0]!.id, taskId: task.taskId }))
      .resolves.toMatchObject({ status: 'queued' });
    expect(authorizedPermissions).toContain('content.lo_letters.write');
  });
});
