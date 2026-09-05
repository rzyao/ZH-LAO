import pino from 'pino';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { DatabaseExecutor } from '../../../src/database/executor.js';
import { TransactionManager } from '../../../src/database/transaction-manager.js';
import { AppError } from '../../../src/errors/app-error.js';
import { PostgresLaoLetterAdminRepository } from '../../../src/modules/content/infrastructure/postgres-lo-letter-admin-repository.js';
import { createLaoLetterBatchTestDatabase } from './lo-letter-batch-fixtures.js';

const repositoryModulePath = '../../../src/modules/content/infrastructure/postgres-lo-letter-batch-repository.js';
const workerModulePath = '../../../src/modules/content/application/use-cases/process-lo-letter-batch.js';

type WorkerDependencies = Readonly<{
  repository: unknown;
  transactions: TransactionManager;
  permissions: Readonly<{
    requireOperatorPermission(executor: DatabaseExecutor, operatorId: string, permission: string): Promise<void>;
  }>;
  contentActions: Readonly<{
    execute(executor: DatabaseExecutor, input: Readonly<Record<string, unknown>>): Promise<void>;
  }>;
  audit: Readonly<{
    recordSuccessfulAction(executor: DatabaseExecutor, input: Readonly<Record<string, unknown>>): Promise<void>;
  }>;
  batchSize: number;
  concurrency: number;
}>;
type Worker = Readonly<{ processCycle(): Promise<void> }>;
type WorkerModule = Readonly<{
  ProcessLaoLetterBatch: new (dependencies: WorkerDependencies) => Worker;
}>;
type RepositoryModule = Readonly<{
  PostgresLaoLetterBatchRepository: new (transactions: TransactionManager) => unknown;
}>;
type RecoveryRepository = Readonly<{
  requeueOwnedFailedItems(executor: DatabaseExecutor, operatorId: string, taskId: string): Promise<Readonly<{ status: string }> | null>;
  finalize(executor: DatabaseExecutor, taskInternalId: bigint): Promise<Readonly<{ status: string }>>;
}>;

const adminUrl = process.env.ADMIN_DATABASE_URL;
const integration = adminUrl ? describe.sequential : describe.skip;

integration('PostgreSQL Lao-letter batch worker (TC-005/TC-006/TC-008/TC-010)', () => {
  let database: Awaited<ReturnType<typeof createLaoLetterBatchTestDatabase>>;
  let pool: pg.Pool;
  let transactions: TransactionManager;
  let repository: unknown;
  let recoveryRepository: RecoveryRepository;
  let WorkerConstructor: new (dependencies: WorkerDependencies) => Worker;

  beforeAll(async () => {
    database = await createLaoLetterBatchTestDatabase(adminUrl!, { pageSize: 4, pageCount: 2 });
    pool = new pg.Pool({ connectionString: database.url, max: 12 });
    transactions = new TransactionManager(pool, pino({ level: 'silent' }));
    await pool.query('CREATE TABLE content.lo_letter_batch_test_effects (content_id uuid PRIMARY KEY, task_id uuid NOT NULL)');
    await pool.query('CREATE TABLE content.lo_letter_batch_test_audits (content_id uuid PRIMARY KEY, task_id uuid NOT NULL)');

    const workerModule = await import(/* @vite-ignore */ workerModulePath) as WorkerModule;
    const repositoryModule = await import(/* @vite-ignore */ repositoryModulePath) as RepositoryModule;
    WorkerConstructor = workerModule.ProcessLaoLetterBatch;
    repository = new repositoryModule.PostgresLaoLetterBatchRepository(transactions);
    recoveryRepository = repository as RecoveryRepository;
    // Ensure the real selection repository is constructible in the same migrated database.
    new PostgresLaoLetterAdminRepository(transactions);
  }, 120_000);

  beforeEach(async () => {
    await pool.query(`TRUNCATE
      content.lo_letter_batch_test_effects,
      content.lo_letter_batch_test_audits,
      content.lo_letter_batch_task_items,
      content.lo_letter_batch_tasks
      RESTART IDENTITY`);
  });

  afterAll(async () => {
    await pool?.end();
    await database?.dispose();
  }, 30_000);

  async function seedTask(contentIds: readonly string[]): Promise<string> {
    const taskId = crypto.randomUUID();
    const task = await pool.query<{ id: string }>(`
      INSERT INTO content.lo_letter_batch_tasks (
        public_id, action, selection_mode, selection_query, selection_hash,
        expected_count, target_count, reason, requested_by_operator_id, idempotency_key
      ) VALUES ($1, 'approve', 'explicit_ids', NULL, $2, $3, $3, NULL, $4, $5)
      RETURNING id`, [taskId, 'a'.repeat(64), contentIds.length, database.fixture.operators[0]!.id, `worker-${taskId}`]);
    for (const [index, contentId] of contentIds.entries()) {
      const fixture = database.fixture.letters.find((letter) => letter.contentId === contentId)!;
      await pool.query(`
        INSERT INTO content.lo_letter_batch_task_items (task_id, item_no, content_id, revision_id)
        VALUES ($1, $2, $3, $4)`, [task.rows[0]!.id, index + 1, contentId, fixture.workingRevisionId]);
    }
    return taskId;
  }

  function createWorker(overrides: Partial<WorkerDependencies> = {}): Worker {
    const permissions = overrides.permissions ?? {
      requireOperatorPermission: async () => undefined,
    };
    const contentActions = overrides.contentActions ?? {
      execute: async (executor: DatabaseExecutor, input: Readonly<Record<string, unknown>>) => {
        await executor.query(
          'INSERT INTO content.lo_letter_batch_test_effects(content_id, task_id) VALUES ($1, $2)',
          [input.contentId, input.taskId],
        );
      },
    };
    const audit = overrides.audit ?? {
      recordSuccessfulAction: async (executor: DatabaseExecutor, input: Readonly<Record<string, unknown>>) => {
        await executor.query(
          'INSERT INTO content.lo_letter_batch_test_audits(content_id, task_id) VALUES ($1, $2)',
          [input.contentId, input.batchTaskId],
        );
      },
    };
    return new WorkerConstructor({
      repository,
      transactions,
      permissions,
      contentActions,
      audit,
      batchSize: overrides.batchSize ?? 50,
      concurrency: overrides.concurrency ?? 4,
    });
  }

  it('allows four concurrent workers to claim every item exactly once', async () => {
    const contentIds = database.fixture.letters.slice(0, 8).map((letter) => letter.contentId);
    await seedTask(contentIds);
    const workers = Array.from({ length: 4 }, () => createWorker({ concurrency: 1 }));
    await Promise.all(workers.map((worker) => worker.processCycle()));

    const effects = await pool.query<{ content_id: string; count: number }>(`
      SELECT content_id, count(*)::int AS count
      FROM content.lo_letter_batch_test_effects GROUP BY content_id ORDER BY content_id`);
    expect(effects.rows).toHaveLength(contentIds.length);
    expect(effects.rows.every((row) => row.count === 1)).toBe(true);
    expect((await pool.query("SELECT 1 FROM content.lo_letter_batch_task_items WHERE status <> 'succeeded'")).rowCount).toBe(0);
  });

  it('continues through mixed success, domain failure, and revoked permission with persisted counters', async () => {
    const contentIds = database.fixture.letters.slice(0, 3).map((letter) => letter.contentId);
    const taskId = await seedTask(contentIds);
    let permissionChecks = 0;
    const worker = createWorker({
      concurrency: 1,
      permissions: {
        requireOperatorPermission: async () => {
          permissionChecks += 1;
          if (permissionChecks === 3) {
            throw new AppError({ code: 'FORBIDDEN', message: 'Permission revoked', httpStatus: 403 });
          }
        },
      },
      contentActions: {
        execute: async (executor, input) => {
          if (input.contentId === contentIds[1]) {
            throw new AppError({ code: 'ILLEGAL_STATE_TRANSITION', message: 'Not approvable', httpStatus: 409 });
          }
          await executor.query(
            'INSERT INTO content.lo_letter_batch_test_effects(content_id, task_id) VALUES ($1, $2)',
            [input.contentId, input.taskId],
          );
        },
      },
    });
    await worker.processCycle();

    const items = await pool.query<{ status: string; error_code: string | null }>(
      'SELECT status, error_code FROM content.lo_letter_batch_task_items ORDER BY item_no',
    );
    expect(items.rows).toEqual([
      { status: 'succeeded', error_code: null },
      { status: 'failed', error_code: 'ILLEGAL_STATE_TRANSITION' },
      { status: 'skipped', error_code: 'FORBIDDEN' },
    ]);
    const task = await pool.query(`
      SELECT status, processed_count, succeeded_count, failed_count, skipped_count
      FROM content.lo_letter_batch_tasks WHERE public_id = $1`, [taskId]);
    expect(task.rows[0]).toEqual({
      status: 'completed_with_issues',
      processed_count: 3,
      succeeded_count: 1,
      failed_count: 1,
      skipped_count: 1,
    });
  });

  it('rolls back partial Content writes before committing a failed item outcome', async () => {
    const contentId = database.fixture.letters[0]!.contentId;
    await seedTask([contentId]);
    await createWorker({
      concurrency: 1,
      contentActions: {
        execute: async (executor, input) => {
          await executor.query(
            'INSERT INTO content.lo_letter_batch_test_effects(content_id, task_id) VALUES ($1, $2)',
            [input.contentId, input.taskId],
          );
          throw new AppError({ code: 'ILLEGAL_STATE_TRANSITION', message: 'simulated domain failure', httpStatus: 409 });
        },
      },
    }).processCycle();

    expect((await pool.query('SELECT 1 FROM content.lo_letter_batch_test_effects')).rowCount).toBe(0);
    expect((await pool.query('SELECT status, error_code FROM content.lo_letter_batch_task_items')).rows[0])
      .toEqual({ status: 'failed', error_code: 'ILLEGAL_STATE_TRANSITION' });
    expect((await pool.query('SELECT 1 FROM content.lo_letter_batch_test_audits')).rowCount).toBe(0);
  });

  it('persists a safe terminal task failure without exposing internal text', async () => {
    const contentId = database.fixture.letters[0]!.contentId;
    const taskId = await seedTask([contentId]);
    const internal = await pool.query<{ id: string }>(
      'SELECT id FROM content.lo_letter_batch_tasks WHERE public_id = $1',
      [taskId],
    );
    await transactions.run((executor) => (recoveryRepository as RecoveryRepository & {
      failTask(db: DatabaseExecutor, taskInternalId: bigint, errorCode: string): Promise<unknown>;
    }).failTask(executor, BigInt(internal.rows[0]!.id), 'INTERNAL_ERROR'));

    expect((await pool.query('SELECT status, error_code, error_message FROM content.lo_letter_batch_task_items')).rows[0])
      .toEqual({ status: 'failed', error_code: 'INTERNAL_ERROR', error_message: 'Task execution failed' });
    expect((await pool.query('SELECT status, processed_count, failed_count, last_error_code FROM content.lo_letter_batch_tasks WHERE public_id = $1', [taskId])).rows[0])
      .toEqual({ status: 'failed', processed_count: 1, failed_count: 1, last_error_code: 'INTERNAL_ERROR' });
    const retried = await transactions.run((executor) => recoveryRepository.requeueOwnedFailedItems(
      executor, database.fixture.operators[0]!.id, taskId,
    ));
    expect(retried).toMatchObject({ status: 'queued' });
  });

  it('rolls back an unexpected action error then fails the task in a separate recovery transaction', async () => {
    const contentIds = database.fixture.letters.slice(0, 2).map((letter) => letter.contentId);
    const taskId = await seedTask(contentIds);
    await createWorker({
      concurrency: 1,
      contentActions: {
        execute: async (executor, input) => {
          await executor.query(
            'INSERT INTO content.lo_letter_batch_test_effects(content_id, task_id) VALUES ($1, $2)',
            [input.contentId, input.taskId],
          );
          throw new Error('sensitive internal action failure');
        },
      },
    }).processCycle();

    expect((await pool.query('SELECT 1 FROM content.lo_letter_batch_test_effects')).rowCount).toBe(0);
    expect((await pool.query('SELECT 1 FROM content.lo_letter_batch_test_audits')).rowCount).toBe(0);
    expect((await pool.query('SELECT status, error_code, error_message FROM content.lo_letter_batch_task_items ORDER BY item_no')).rows)
      .toEqual(contentIds.map(() => ({ status: 'failed', error_code: 'INTERNAL_ERROR', error_message: 'Task execution failed' })));
    expect((await pool.query('SELECT status, processed_count, failed_count, last_error_code FROM content.lo_letter_batch_tasks WHERE public_id = $1', [taskId])).rows[0])
      .toEqual({ status: 'failed', processed_count: 2, failed_count: 2, last_error_code: 'INTERNAL_ERROR' });
  });

  it('rolls back the Content mutation, audit, and item claim together when success audit fails', async () => {
    const contentId = database.fixture.letters[0]!.contentId;
    await seedTask([contentId]);
    const worker = createWorker({
      concurrency: 1,
      audit: {
        recordSuccessfulAction: async () => {
          throw new Error('simulated audit persistence failure');
        },
      },
    });
    await worker.processCycle().catch(() => undefined);

    expect((await pool.query('SELECT 1 FROM content.lo_letter_batch_test_effects')).rowCount).toBe(0);
    expect((await pool.query('SELECT 1 FROM content.lo_letter_batch_test_audits')).rowCount).toBe(0);
    expect((await pool.query('SELECT status FROM content.lo_letter_batch_task_items')).rows[0]).toEqual({ status: 'queued' });
  });

  it('finalizes from persisted counters and never repeats a committed success/audit on later cycles', async () => {
    const contentIds = database.fixture.letters.slice(0, 2).map((letter) => letter.contentId);
    const taskId = await seedTask(contentIds);
    const worker = createWorker({ concurrency: 2 });
    await worker.processCycle();
    await worker.processCycle();
    const task = await pool.query(`SELECT status, processed_count, succeeded_count, failed_count, skipped_count
      FROM content.lo_letter_batch_tasks WHERE public_id = $1`, [taskId]);
    expect(task.rows[0]).toEqual({ status: 'completed', processed_count: 2, succeeded_count: 2, failed_count: 0, skipped_count: 0 });
    expect((await pool.query('SELECT 1 FROM content.lo_letter_batch_test_effects')).rowCount).toBe(2);
    expect((await pool.query('SELECT 1 FROM content.lo_letter_batch_test_audits')).rowCount).toBe(2);
  });

  it('rolls an audit crash back to queued and completes it exactly once after restart', async () => {
    const contentId = database.fixture.letters[0]!.contentId;
    await seedTask([contentId]);
    await createWorker({
      concurrency: 1,
      audit: {
        recordSuccessfulAction: async () => {
          throw new Error('simulated audit process crash');
        },
      },
    }).processCycle().catch(() => undefined);
    expect((await pool.query('SELECT status FROM content.lo_letter_batch_task_items')).rows[0]).toEqual({ status: 'queued' });
    expect((await pool.query('SELECT 1 FROM content.lo_letter_batch_test_effects')).rowCount).toBe(0);
    await createWorker({ concurrency: 1 }).processCycle();
    expect((await pool.query('SELECT status FROM content.lo_letter_batch_task_items')).rows[0]).toEqual({ status: 'succeeded' });
    expect((await pool.query('SELECT 1 FROM content.lo_letter_batch_test_audits')).rowCount).toBe(1);
  });

  it('requeues failed items only and rejects retry for a completed task without failures', async () => {
    const contentIds = database.fixture.letters.slice(0, 2).map((letter) => letter.contentId);
    const taskId = await seedTask(contentIds);
    await createWorker({
      concurrency: 1,
      contentActions: {
        execute: async (executor, input) => {
          if (input.contentId === contentIds[1]) throw new AppError({ code: 'ILLEGAL_STATE_TRANSITION', message: 'failure', httpStatus: 409 });
          await executor.query('INSERT INTO content.lo_letter_batch_test_effects(content_id, task_id) VALUES ($1, $2)', [input.contentId, input.taskId]);
        },
      },
    }).processCycle();
    const retried = await transactions.run((executor) => recoveryRepository.requeueOwnedFailedItems(
      executor, database.fixture.operators[0]!.id, taskId,
    ));
    expect(retried).toMatchObject({ status: 'queued' });
    expect((await pool.query('SELECT status, retry_count FROM content.lo_letter_batch_task_items ORDER BY item_no')).rows).toEqual([
      { status: 'succeeded', retry_count: 0 },
      { status: 'queued', retry_count: 1 },
    ]);

    await pool.query("UPDATE content.lo_letter_batch_task_items SET status='succeeded', error_code=NULL, error_message=NULL, last_attempt_at=now(), completed_at=now() WHERE status='queued'");
    await pool.query("UPDATE content.lo_letter_batch_tasks SET status='completed', processed_count=2, succeeded_count=2, failed_count=0, completed_at=now(), started_at=coalesce(started_at,now()) WHERE public_id=$1", [taskId]);
    await expect(transactions.run((executor) => recoveryRepository.requeueOwnedFailedItems(
      executor, database.fixture.operators[0]!.id, taskId,
    ))).rejects.toMatchObject({ code: 'BATCH_TASK_NOT_RETRYABLE' });
  });

  it('serializes concurrent retry and finalization without corrupting counters', async () => {
    const taskId = await seedTask([database.fixture.letters[0]!.contentId]);
    await createWorker({
      concurrency: 1,
      contentActions: { execute: async () => { throw new AppError({ code: 'ILLEGAL_STATE_TRANSITION', message: 'failure', httpStatus: 409 }); } },
    }).processCycle();
    const internal = await pool.query<{ id: string }>('SELECT id FROM content.lo_letter_batch_tasks WHERE public_id=$1', [taskId]);
    const outcomes = await Promise.allSettled([
      transactions.run((executor) => recoveryRepository.requeueOwnedFailedItems(executor, database.fixture.operators[0]!.id, taskId)),
      transactions.run((executor) => recoveryRepository.finalize(executor, BigInt(internal.rows[0]!.id))),
    ]);
    expect(outcomes.every((outcome) => outcome.status === 'fulfilled')).toBe(true);
    const task = await pool.query('SELECT processed_count, succeeded_count, failed_count, skipped_count FROM content.lo_letter_batch_tasks WHERE public_id=$1', [taskId]);
    expect(task.rows[0].processed_count).toBe(task.rows[0].succeeded_count + task.rows[0].failed_count + task.rows[0].skipped_count);
  });

  it('reports queue depth, oldest age, cycle duration, and bounded outcome counts', async () => {
    const contentIds = database.fixture.letters.slice(0, 3).map((letter) => letter.contentId);
    await seedTask(contentIds);
    const telemetry = await (createWorker({ batchSize: 3, concurrency: 2 }) as unknown as {
      processCycle(): Promise<{
        queueDepth: number;
        oldestAgeMs: number;
        cycleDurationMs: number;
        outcomes: { succeeded: number; failed: number; skipped: number };
      }>;
    }).processCycle();

    expect(telemetry.queueDepth).toBe(3);
    expect(telemetry.oldestAgeMs).toBeGreaterThanOrEqual(0);
    expect(telemetry.cycleDurationMs).toBeGreaterThanOrEqual(0);
    expect(Object.keys(telemetry.outcomes).sort()).toEqual(['failed', 'skipped', 'succeeded']);
    expect(Object.values(telemetry.outcomes).reduce((sum, count) => sum + count, 0)).toBe(3);
    expect(JSON.stringify(telemetry)).not.toMatch(/reason|contentId|revisionId|internalId|sql|stack/iu);
  });
});
