import { AppError } from '../../../errors/app-error.js';
import type { DatabaseExecutor } from '../../../database/executor.js';
import type { OperationsBatchWorkerBoundary } from '../../operations/public/index.js';
import type { ContentTransactionRunner } from '../application/ports/lo-letter-admin-repository.js';
import { ManageStructuredContentUseCases } from '../application/use-cases/manage-structured-content.js';
import { ProcessLaoLetterBatch } from '../application/use-cases/process-lo-letter-batch.js';
import {
  PostgresLaoLetterBatchRepository,
  PostgresStructuredContentRepository,
} from '../infrastructure/index.js';

export function createLaoLetterBatchProcessor(dependencies: Readonly<{
  transactions: ContentTransactionRunner;
  operations: OperationsBatchWorkerBoundary;
  batchSize: number;
  concurrency: number;
}>): ProcessLaoLetterBatch {
  const repository = new PostgresLaoLetterBatchRepository(dependencies.transactions);
  return new ProcessLaoLetterBatch({
    repository,
    transactions: dependencies.transactions,
    batchSize: dependencies.batchSize,
    concurrency: dependencies.concurrency,
    permissions: {
      requireOperatorPermission: (executor, operatorId, permission) =>
        dependencies.operations.requireOperatorPermissionInTransaction(executor, operatorId, permission),
    },
    contentActions: { execute: executeLaoLetterBatchAction },
    audit: {
      recordSuccessfulAction: (executor, input) =>
        dependencies.operations.recordBatchSuccessfulActionInTransaction(executor, {
          operatorId: requireString(input, 'operatorId'),
          actionKey: requireString(input, 'actionKey'),
          contentId: requireString(input, 'contentId'),
          batchTaskId: requireString(input, 'batchTaskId'),
        }),
    },
  });
}

async function executeLaoLetterBatchAction(
  executor: DatabaseExecutor,
  input: Readonly<Record<string, unknown>>,
): Promise<void> {
  const action = requireString(input, 'action');
  const contentId = requireString(input, 'contentId');
  const operatorId = requireString(input, 'operatorId');
  try {
    if (action === 'archive') {
      const archived = await executor.query(
        `UPDATE content.contents
            SET status = 'archived', updated_at = now()
          WHERE public_id = $1 AND language = 'lo' AND content_type = 'lo_letter'
            AND status <> 'archived'`,
        [contentId],
      );
      if (archived.rowCount !== 1) throw new Error('Lao-letter is not archivable');
      return;
    }

    const revisionId = requireString(input, 'revisionId');
    const useCases = new ManageStructuredContentUseCases(
      new PostgresStructuredContentRepository(executor),
    );
    if (action === 'submit_review') await useCases.submit(contentId, revisionId);
    else if (action === 'approve') await useCases.review(contentId, revisionId, 'approve', operatorId);
    else if (action === 'reject') {
      await useCases.review(contentId, revisionId, 'reject', operatorId, requireString(input, 'reason'));
    } else if (action === 'publish') await useCases.publish(contentId, revisionId);
    else throw new Error(`Unsupported Lao-letter batch action: ${action}`);
  } catch (cause) {
    if (cause instanceof AppError) throw cause;
    throw new AppError({
      code: 'ILLEGAL_STATE_TRANSITION',
      message: 'Lao-letter action is not valid for its current state',
      httpStatus: 409,
      cause,
    });
  }
}

function requireString(input: Readonly<Record<string, unknown>>, key: string): string {
  const value = input[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing Lao-letter batch action field: ${key}`);
  }
  return value;
}
