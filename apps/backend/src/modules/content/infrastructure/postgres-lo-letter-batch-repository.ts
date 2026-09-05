import type { QueryResultRow } from '../../../database/executor.js';
import type {
  ContentTransactionExecutor,
  ContentTransactionRunner,
  CreateLaoLetterBatchTaskRecord,
  LaoLetterBatchItemOutcome,
  LaoLetterBatchTaskItemRecord,
  LaoLetterBatchTaskItemPage,
  LaoLetterBatchTaskPage,
  LaoLetterBatchTaskRecord,
  LaoLetterSelectionTarget,
} from '../application/ports/lo-letter-admin-repository.js';
import { AppError } from '../../../errors/app-error.js';
import type { NormalizedLaoLetterQuery } from '../domain/index.js';

type TaskRow = QueryResultRow & {
  id: string | bigint;
  public_id: string;
  action: LaoLetterBatchTaskRecord['action'];
  selection_mode: LaoLetterBatchTaskRecord['selectionMode'];
  selection_query: NormalizedLaoLetterQuery | null;
  selection_hash: string;
  expected_count: number;
  target_count: number;
  reason: string | null;
  requested_by_operator_id: string;
  idempotency_key: string;
  status: LaoLetterBatchTaskRecord['status'];
  processed_count: number;
  succeeded_count: number;
  failed_count: number;
  skipped_count: number;
  last_error_code: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  started_at: Date | string | null;
  completed_at: Date | string | null;
};

type ItemRow = QueryResultRow & {
  id: string | bigint;
  task_id: string | bigint;
  item_no: number;
  content_id: string;
  revision_id: string | null;
  status: LaoLetterBatchTaskItemRecord['status'];
  error_code: string | null;
  error_message: string | null;
  retry_count: number;
  last_attempt_at: Date | string | null;
  completed_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

function date(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function nullableDate(value: Date | string | null): Date | null {
  return value === null ? null : date(value);
}

function mapTask(row: TaskRow): LaoLetterBatchTaskRecord {
  return {
    internalId: BigInt(row.id),
    taskId: row.public_id,
    action: row.action,
    selectionMode: row.selection_mode,
    selectionQuery: row.selection_query,
    selectionHash: row.selection_hash,
    expectedCount: Number(row.expected_count),
    targetCount: Number(row.target_count),
    reason: row.reason,
    requestedByOperatorId: row.requested_by_operator_id,
    idempotencyKey: row.idempotency_key,
    status: row.status,
    processedCount: Number(row.processed_count),
    succeededCount: Number(row.succeeded_count),
    failedCount: Number(row.failed_count),
    skippedCount: Number(row.skipped_count),
    lastErrorCode: row.last_error_code,
    createdAt: date(row.created_at),
    updatedAt: date(row.updated_at),
    startedAt: nullableDate(row.started_at),
    completedAt: nullableDate(row.completed_at),
  };
}

function mapItem(row: ItemRow): LaoLetterBatchTaskItemRecord {
  return {
    internalId: BigInt(row.id),
    taskInternalId: BigInt(row.task_id),
    itemNo: Number(row.item_no),
    contentId: row.content_id,
    revisionId: row.revision_id,
    status: row.status,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    retryCount: Number(row.retry_count),
    lastAttemptAt: nullableDate(row.last_attempt_at),
    completedAt: nullableDate(row.completed_at),
    createdAt: date(row.created_at),
    updatedAt: date(row.updated_at),
  };
}

const TASK_COLUMNS = `
  id, public_id, action, selection_mode, selection_query, selection_hash,
  expected_count, target_count, reason, requested_by_operator_id, idempotency_key,
  status, processed_count, succeeded_count, failed_count, skipped_count,
  last_error_code, created_at, updated_at, started_at, completed_at`;
const ITEM_COLUMNS = `
  id, task_id, item_no, content_id, revision_id, status, error_code,
  error_message, retry_count, last_attempt_at, completed_at, created_at, updated_at`;
const QUALIFIED_TASK_COLUMNS = TASK_COLUMNS.replace(
  /\b([a-z][a-z0-9_]*)\b/g,
  'task.$1',
);
const QUALIFIED_ITEM_COLUMNS = ITEM_COLUMNS.replace(
  /\b([a-z][a-z0-9_]*)\b/g,
  'item.$1',
);

export class PostgresLaoLetterBatchRepository {
  constructor(private readonly transactions: ContentTransactionRunner) {}

  async getQueueTelemetry(executor: ContentTransactionExecutor) {
    const result = await executor.query<{ depth: number | string; oldest_age_ms: number | string }>(`
      SELECT count(*)::integer AS depth,
             COALESCE(EXTRACT(EPOCH FROM (clock_timestamp() - min(task.created_at))) * 1000, 0)::double precision AS oldest_age_ms
      FROM content.lo_letter_batch_task_items item
      JOIN content.lo_letter_batch_tasks task ON task.id = item.task_id
      WHERE item.status = 'queued' AND task.status IN ('queued', 'running')`);
    return {
      depth: Number(result.rows[0]?.depth ?? 0),
      oldestAgeMs: Math.max(0, Number(result.rows[0]?.oldest_age_ms ?? 0)),
    };
  }

  async countActive(executor: ContentTransactionExecutor): Promise<number> {
    await executor.query("SELECT pg_advisory_xact_lock(hashtext('content.lo_letter_batch_admission'))");
    const result = await executor.query<{ count: number | string }>(`
      SELECT count(*)::integer AS count
      FROM content.lo_letter_batch_tasks
      WHERE status IN ('queued', 'running')`);
    return Number(result.rows[0]?.count ?? 0);
  }

  async findByIdempotencyKey(
    executor: ContentTransactionExecutor,
    operatorId: string,
    idempotencyKey: string,
  ): Promise<LaoLetterBatchTaskRecord | null> {
    const result = await executor.query<TaskRow>(`
      SELECT ${TASK_COLUMNS}
      FROM content.lo_letter_batch_tasks
      WHERE requested_by_operator_id = $1 AND idempotency_key = $2`, [operatorId, idempotencyKey]);
    return result.rows[0] ? mapTask(result.rows[0]) : null;
  }

  async create(
    executor: ContentTransactionExecutor,
    input: CreateLaoLetterBatchTaskRecord,
  ): Promise<LaoLetterBatchTaskRecord> {
    const task = await executor.query<TaskRow>(`
      INSERT INTO content.lo_letter_batch_tasks (
        public_id, action, selection_mode, selection_query, selection_hash,
        expected_count, target_count, reason, requested_by_operator_id, idempotency_key
      ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10)
      RETURNING ${TASK_COLUMNS}`,
    [
      input.taskId,
      input.action,
      input.selection.mode,
      input.selection.query === null ? null : JSON.stringify(input.selection.query),
      input.selection.hash,
      input.selection.expectedCount,
      input.selection.targets.length,
      input.reason,
      input.requestedByOperatorId,
      input.idempotencyKey,
    ]);
    const row = task.rows[0];
    if (!row) throw new Error('Lao-letter batch task insert returned no row');

    for (const [index, target] of input.selection.targets.entries()) {
      await executor.query(`
        INSERT INTO content.lo_letter_batch_task_items (
          task_id, item_no, content_id, revision_id
        ) VALUES ($1, $2, $3, $4)`, [row.id, index + 1, target.contentId, target.revisionId]);
    }
    return mapTask(row);
  }

  async listSelectionTargets(
    executor: ContentTransactionExecutor,
    taskInternalId: bigint,
  ): Promise<readonly LaoLetterSelectionTarget[]> {
    const result = await executor.query<{ content_id: string; revision_id: string | null }>(`
      SELECT content_id, revision_id
      FROM content.lo_letter_batch_task_items
      WHERE task_id = $1
      ORDER BY item_no`, [taskInternalId.toString()]);
    return result.rows.map((row) => ({ contentId: row.content_id, revisionId: row.revision_id }));
  }

  async listOwned(
    operatorId: string,
    page: number,
    pageSize: number,
  ): Promise<LaoLetterBatchTaskPage> {
    return this.transactions.run(async (executor) => {
      const result = await executor.query<TaskRow & { total: number | string }>(`
        SELECT ${TASK_COLUMNS}, count(*) OVER()::integer AS total
        FROM content.lo_letter_batch_tasks
        WHERE requested_by_operator_id = $1
        ORDER BY created_at DESC, id DESC
        LIMIT $2 OFFSET $3`, [operatorId, pageSize, (page - 1) * pageSize]);
      return {
        items: result.rows.map(mapTask),
        page,
        pageSize,
        total: Number(result.rows[0]?.total ?? 0),
      };
    });
  }

  async findOwned(operatorId: string, taskId: string): Promise<LaoLetterBatchTaskRecord | null> {
    return this.transactions.run(async (executor) => {
      const result = await executor.query<TaskRow>(`
        SELECT ${TASK_COLUMNS}
        FROM content.lo_letter_batch_tasks
        WHERE public_id = $1 AND requested_by_operator_id = $2`, [taskId, operatorId]);
      return result.rows[0] ? mapTask(result.rows[0]) : null;
    });
  }

  async listOwnedItems(
    operatorId: string,
    taskId: string,
    page: number,
    pageSize: number,
    status?: LaoLetterBatchTaskItemRecord['status'],
  ): Promise<LaoLetterBatchTaskItemPage> {
    return this.transactions.run(async (executor) => {
      const values: unknown[] = [taskId, operatorId];
      const statusFilter = status === undefined ? '' : (values.push(status), `AND item.status = $${values.length}`);
      values.push(pageSize, (page - 1) * pageSize);
      const result = await executor.query<ItemRow & { total: number | string }>(`
        SELECT ${QUALIFIED_ITEM_COLUMNS}, count(*) OVER()::integer AS total
        FROM content.lo_letter_batch_task_items item
        JOIN content.lo_letter_batch_tasks task ON task.id = item.task_id
        WHERE task.public_id = $1 AND task.requested_by_operator_id = $2
          ${statusFilter}
        ORDER BY item.item_no ASC, item.id ASC
        LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
      return {
        items: result.rows.map(mapItem),
        page,
        pageSize,
        total: Number(result.rows[0]?.total ?? 0),
      };
    });
  }

  async claimProcessableTask(
    executor: ContentTransactionExecutor,
  ): Promise<LaoLetterBatchTaskRecord | null> {
    const result = await executor.query<TaskRow>(`
      WITH candidate AS (
        SELECT task.id
        FROM content.lo_letter_batch_tasks task
        WHERE task.status IN ('queued', 'running')
          AND EXISTS (
            SELECT 1 FROM content.lo_letter_batch_task_items item
            WHERE item.task_id = task.id AND item.status = 'queued'
          )
        ORDER BY task.created_at, task.id
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      UPDATE content.lo_letter_batch_tasks task
      SET status = 'running', started_at = COALESCE(task.started_at, now()), updated_at = now()
      FROM candidate
      WHERE task.id = candidate.id
      RETURNING ${QUALIFIED_TASK_COLUMNS}`);
    return result.rows[0] ? mapTask(result.rows[0]) : null;
  }

  async claimQueuedItem(
    executor: ContentTransactionExecutor,
    taskInternalId: bigint,
  ): Promise<LaoLetterBatchTaskItemRecord | null> {
    const result = await executor.query<ItemRow>(`
      WITH candidate AS (
        SELECT id
        FROM content.lo_letter_batch_task_items
        WHERE task_id = $1 AND status = 'queued'
        ORDER BY item_no
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      UPDATE content.lo_letter_batch_task_items item
      SET status = 'running', last_attempt_at = clock_timestamp(), updated_at = clock_timestamp()
      FROM candidate
      WHERE item.id = candidate.id
      RETURNING ${QUALIFIED_ITEM_COLUMNS}`, [taskInternalId.toString()]);
    return result.rows[0] ? mapItem(result.rows[0]) : null;
  }

  async recordItemOutcome(
    executor: ContentTransactionExecutor,
    itemInternalId: bigint,
    outcome: LaoLetterBatchItemOutcome,
  ): Promise<void> {
    const item = await executor.query<{ task_id: string | bigint }>(`
      UPDATE content.lo_letter_batch_task_items
      SET status = $2, error_code = $3, error_message = $4,
          completed_at = clock_timestamp(), updated_at = clock_timestamp()
      WHERE id = $1 AND status = 'running'
      RETURNING task_id`, [
      itemInternalId.toString(),
      outcome.status,
      outcome.errorCode,
      outcome.errorMessage,
    ]);
    const taskId = item.rows[0]?.task_id;
    if (taskId === undefined) throw new Error('Claimed Lao-letter batch item was not running');
    await executor.query(`
      UPDATE content.lo_letter_batch_tasks task
      SET processed_count = aggregate.processed_count,
          succeeded_count = aggregate.succeeded_count,
          failed_count = aggregate.failed_count,
          skipped_count = aggregate.skipped_count,
          updated_at = now()
      FROM (
        SELECT task_id,
          count(*) FILTER (WHERE status IN ('succeeded', 'failed', 'skipped'))::integer AS processed_count,
          count(*) FILTER (WHERE status = 'succeeded')::integer AS succeeded_count,
          count(*) FILTER (WHERE status = 'failed')::integer AS failed_count,
          count(*) FILTER (WHERE status = 'skipped')::integer AS skipped_count
        FROM content.lo_letter_batch_task_items
        WHERE task_id = $1
        GROUP BY task_id
      ) aggregate
      WHERE task.id = aggregate.task_id`, [String(taskId)]);
  }

  async finalize(
    executor: ContentTransactionExecutor,
    taskInternalId: bigint,
  ): Promise<LaoLetterBatchTaskRecord> {
    await executor.query(
      'SELECT id FROM content.lo_letter_batch_tasks WHERE id = $1 FOR UPDATE',
      [taskInternalId.toString()],
    );
    const result = await executor.query<TaskRow>(`
      UPDATE content.lo_letter_batch_tasks task
      SET status = CASE
            WHEN task.processed_count = task.target_count
              AND task.failed_count = 0 AND task.skipped_count = 0 THEN 'completed'
            WHEN task.processed_count = task.target_count THEN 'completed_with_issues'
            ELSE task.status
          END,
          completed_at = CASE
            WHEN task.processed_count = task.target_count THEN COALESCE(task.completed_at, now())
            ELSE task.completed_at
          END,
          updated_at = now()
      WHERE task.id = $1
      RETURNING ${QUALIFIED_TASK_COLUMNS}`, [taskInternalId.toString()]);
    const row = result.rows[0];
    if (!row) throw new Error('Lao-letter batch task not found during finalization');
    return mapTask(row);
  }

  async failTask(
    executor: ContentTransactionExecutor,
    taskInternalId: bigint,
    errorCode: string,
  ): Promise<LaoLetterBatchTaskRecord> {
    await executor.query(`
      UPDATE content.lo_letter_batch_task_items
      SET status = 'failed',
          error_code = $2,
          error_message = 'Task execution failed',
          last_attempt_at = COALESCE(last_attempt_at, statement_timestamp()),
          completed_at = clock_timestamp(),
          updated_at = clock_timestamp()
      WHERE task_id = $1 AND status IN ('queued', 'running')`, [taskInternalId.toString(), errorCode]);
    const result = await executor.query<TaskRow>(`
      UPDATE content.lo_letter_batch_tasks task
      SET status = 'failed',
          last_error_code = $2,
          processed_count = aggregate.processed_count,
          succeeded_count = aggregate.succeeded_count,
          failed_count = aggregate.failed_count,
          skipped_count = aggregate.skipped_count,
          started_at = COALESCE(task.started_at, clock_timestamp()),
          completed_at = clock_timestamp(),
          updated_at = clock_timestamp()
      FROM (
        SELECT task_id,
          count(*) FILTER (WHERE status IN ('succeeded', 'failed', 'skipped'))::integer AS processed_count,
          count(*) FILTER (WHERE status = 'succeeded')::integer AS succeeded_count,
          count(*) FILTER (WHERE status = 'failed')::integer AS failed_count,
          count(*) FILTER (WHERE status = 'skipped')::integer AS skipped_count
        FROM content.lo_letter_batch_task_items
        WHERE task_id = $1
        GROUP BY task_id
      ) aggregate
      WHERE task.id = $1 AND task.status IN ('queued', 'running')
        AND aggregate.task_id = task.id
      RETURNING ${QUALIFIED_TASK_COLUMNS}`, [taskInternalId.toString(), errorCode]);
    const row = result.rows[0];
    if (!row) throw new Error('Lao-letter batch task could not transition to failed');
    return mapTask(row);
  }

  async requeueOwnedFailedItems(
    executor: ContentTransactionExecutor,
    operatorId: string,
    taskId: string,
  ): Promise<LaoLetterBatchTaskRecord | null> {
    const locked = await executor.query<TaskRow>(`
      SELECT ${TASK_COLUMNS}
      FROM content.lo_letter_batch_tasks
      WHERE public_id = $1 AND requested_by_operator_id = $2
      FOR UPDATE`, [taskId, operatorId]);
    const task = locked.rows[0];
    if (!task) return null;
    if ((task.status !== 'completed_with_issues' && task.status !== 'failed')
      || Number(task.failed_count) < 1) {
      throw new AppError({
        code: 'BATCH_TASK_NOT_RETRYABLE',
        message: 'Batch task has no retryable failed items',
        httpStatus: 409,
      });
    }
    const reset = await executor.query(`
      UPDATE content.lo_letter_batch_task_items
      SET status = 'queued', error_code = NULL, error_message = NULL,
          retry_count = retry_count + 1, last_attempt_at = NULL,
          completed_at = NULL, updated_at = clock_timestamp()
      WHERE task_id = $1 AND status = 'failed'`, [task.id]);
    if (reset.rowCount !== Number(task.failed_count)) {
      throw new AppError({ code: 'CONFLICT', message: 'Batch task counters changed concurrently', httpStatus: 409 });
    }
    const result = await executor.query<TaskRow>(`
      UPDATE content.lo_letter_batch_tasks task
      SET status = 'queued', processed_count = processed_count - failed_count,
          failed_count = 0, started_at = NULL, completed_at = NULL,
          last_error_code = NULL, updated_at = clock_timestamp()
      WHERE id = $1
      RETURNING ${QUALIFIED_TASK_COLUMNS}`, [task.id]);
    return mapTask(result.rows[0]!);
  }
}
