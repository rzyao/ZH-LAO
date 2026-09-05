import pino from 'pino';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { DatabaseExecutor } from '../../src/database/executor.js';
import { TransactionManager } from '../../src/database/transaction-manager.js';
import { OperationsService } from '../../src/modules/operations/application/services/operations-service.js';
import { PostgresOperationsRepository } from '../../src/modules/operations/infrastructure/index.js';
import { createLaoLetterBatchTestDatabase } from '../modules/content/lo-letter-batch-fixtures.js';

type BatchWorkerOperations = Readonly<{
  requireOperatorPermissionInTransaction(
    executor: DatabaseExecutor,
    operatorId: string,
    permission: 'content.lo_letters.review',
  ): Promise<void>;
  recordBatchSuccessfulActionInTransaction(executor: DatabaseExecutor, input: Readonly<{
    operatorId: string;
    actionKey: string;
    contentId: string;
    batchTaskId: string;
  }>): Promise<void>;
}>;

type TransactionalCurriculumAudit = Readonly<{
  recordSuccessfulActionInTransaction(executor: DatabaseExecutor, input: Readonly<{
    operatorId: string;
    actionKey: string;
    target: { domain: 'content'; type: 'course' | 'lesson'; id: string };
    details?: Readonly<Record<string, unknown>>;
  }>): Promise<void>;
}>;

const adminUrl = process.env.ADMIN_DATABASE_URL;
const integration = adminUrl ? describe.sequential : describe.skip;

integration('Operations public Content batch permission/audit boundary (TC-005/TC-006)', () => {
  let database: Awaited<ReturnType<typeof createLaoLetterBatchTestDatabase>>;
  let pool: pg.Pool;
  let transactions: TransactionManager;
  let operations: BatchWorkerOperations;

  beforeAll(async () => {
    database = await createLaoLetterBatchTestDatabase(adminUrl!, { pageSize: 2, pageCount: 1 });
    pool = new pg.Pool({ connectionString: database.url, max: 6 });
    transactions = new TransactionManager(pool, pino({ level: 'silent' }));
    const service = new OperationsService(
      transactions,
      pool,
      new PostgresOperationsRepository(),
      {} as never,
    );
    operations = service as unknown as BatchWorkerOperations;
  }, 120_000);

  afterAll(async () => {
    await pool?.end();
    await database?.dispose();
  }, 30_000);

  it('rechecks the stored Operator permission inside the caller transaction after revocation', async () => {
    const operator = database.fixture.operators[0]!;
    await transactions.run((executor) => operations.requireOperatorPermissionInTransaction(
      executor,
      operator.id,
      'content.lo_letters.review',
    ));
    await pool.query(`
      DELETE FROM operations.role_permissions
      WHERE permission_key = 'content.lo_letters.review'
        AND role_id IN (SELECT role_id FROM operations.operator_roles WHERE operator_id = $1)`, [operator.id]);
    await expect(transactions.run((executor) => operations.requireOperatorPermissionInTransaction(
      executor,
      operator.id,
      'content.lo_letters.review',
    ))).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('commits exactly one success audit with batch_task_id, and rolls it back with the caller transaction', async () => {
    const operator = database.fixture.operators[0]!;
    const contentId = database.fixture.letters[0]!.contentId;
    const rolledBackTaskId = crypto.randomUUID();
    await expect(transactions.run(async (executor) => {
      await operations.recordBatchSuccessfulActionInTransaction(executor, {
        operatorId: operator.id,
        actionKey: 'content.lo_letters.approve',
        contentId,
        batchTaskId: rolledBackTaskId,
      });
      throw new Error('rollback caller transaction');
    })).rejects.toThrow('rollback caller transaction');
    expect((await pool.query(
      "SELECT 1 FROM operations.operator_audit_logs WHERE details->>'batch_task_id' = $1",
      [rolledBackTaskId],
    )).rowCount).toBe(0);

    const committedTaskId = crypto.randomUUID();
    await transactions.run((executor) => operations.recordBatchSuccessfulActionInTransaction(executor, {
      operatorId: operator.id,
      actionKey: 'content.lo_letters.approve',
      contentId,
      batchTaskId: committedTaskId,
    }));
    const audits = await pool.query<{ target_id: string; details: Record<string, unknown> }>(`
      SELECT target_id, details FROM operations.operator_audit_logs
      WHERE details->>'batch_task_id' = $1`, [committedTaskId]);
    expect(audits.rows).toEqual([{
      target_id: contentId,
      details: expect.objectContaining({ batch_task_id: committedTaskId }),
    }]);
  });

  it('records Course UUID audit inside the caller transaction and rolls it back together', async () => {
    const operator = database.fixture.operators[0]!;
    const curriculumAudit = operations as unknown as TransactionalCurriculumAudit;
    const courseId = crypto.randomUUID();
    await expect(transactions.run(async (executor) => {
      await curriculumAudit.recordSuccessfulActionInTransaction(executor, {
        operatorId: operator.id,
        actionKey: 'content.curriculum.publish',
        target: { domain: 'content', type: 'course', id: courseId },
        details: { revision_id: crypto.randomUUID() },
      });
      throw new Error('rollback curriculum publication');
    })).rejects.toThrow('rollback curriculum publication');
    expect((await pool.query(
      'SELECT 1 FROM operations.operator_audit_logs WHERE target_id = $1', [courseId],
    )).rowCount).toBe(0);

    await transactions.run((executor) => curriculumAudit.recordSuccessfulActionInTransaction(executor, {
      operatorId: operator.id,
      actionKey: 'content.curriculum.publish',
      target: { domain: 'content', type: 'course', id: courseId },
      details: { revision_id: crypto.randomUUID() },
    }));
    const audit = await pool.query<{ target_domain: string; target_type: string; target_id: string }>(
      'SELECT target_domain, target_type, target_id FROM operations.operator_audit_logs WHERE target_id = $1', [courseId],
    );
    expect(audit.rows).toEqual([{ target_domain: 'content', target_type: 'course', target_id: courseId }]);
  });
});
