import { AppError } from '../../../../errors/app-error.js';
import type { DatabaseExecutor } from '../../../../database/executor.js';
import type {
  ContentTransactionRunner,
  LaoLetterBatchTaskRecord,
  LaoLetterBatchTaskRepository,
} from '../ports/lo-letter-admin-repository.js';
import { getLaoLetterBatchActionPolicy } from '../../domain/index.js';
import type { LaoLetterBatchPermission } from '../../domain/index.js';

export interface LaoLetterBatchWorkerPermissions {
  requireOperatorPermission(
    executor: DatabaseExecutor,
    operatorId: string,
    permission: LaoLetterBatchPermission,
  ): Promise<void>;
}

export interface LaoLetterBatchContentActions {
  execute(executor: DatabaseExecutor, input: Readonly<Record<string, unknown>>): Promise<void>;
}

export interface LaoLetterBatchWorkerAudit {
  recordSuccessfulAction(executor: DatabaseExecutor, input: Readonly<Record<string, unknown>>): Promise<void>;
}

export type LaoLetterBatchCycleTelemetry = Readonly<{
  queueDepth: number;
  oldestAgeMs: number;
  cycleDurationMs: number;
  outcomes: Readonly<{ succeeded: number; failed: number; skipped: number }>;
}>;

export class ProcessLaoLetterBatch {
  constructor(private readonly dependencies: Readonly<{
    repository: Pick<
      LaoLetterBatchTaskRepository,
      'getQueueTelemetry' | 'claimProcessableTask' | 'claimQueuedItem' | 'recordItemOutcome' | 'finalize' | 'failTask'
    >;
    transactions: ContentTransactionRunner;
    permissions: LaoLetterBatchWorkerPermissions;
    contentActions: LaoLetterBatchContentActions;
    audit: LaoLetterBatchWorkerAudit;
    batchSize: number;
    concurrency: number;
  }>) {}

  async processCycle(): Promise<LaoLetterBatchCycleTelemetry> {
    const startedAt = performance.now();
    const queue = await this.dependencies.transactions.run((executor) =>
      this.dependencies.repository.getQueueTelemetry(executor));
    let reservations = 0;
    const outcomes = { succeeded: 0, failed: 0, skipped: 0 };
    const processNext = async (): Promise<void> => {
      while (reservations < this.dependencies.batchSize) {
        reservations += 1;
        const processed = await this.processOne();
        if (!processed) {
          reservations -= 1;
          return;
        }
        outcomes[processed] += 1;
      }
    };
    await Promise.all(Array.from(
      { length: this.dependencies.concurrency },
      () => processNext(),
    ));
    return {
      queueDepth: queue.depth,
      oldestAgeMs: queue.oldestAgeMs,
      cycleDurationMs: performance.now() - startedAt,
      outcomes,
    };
  }

  private async processOne(): Promise<'succeeded' | 'failed' | 'skipped' | null> {
    let claimedTaskId: bigint | null = null;
    try {
      return await this.dependencies.transactions.run(async (executor) => {
        const task = await this.dependencies.repository.claimProcessableTask(executor);
        if (!task) return null;
        claimedTaskId = task.internalId;
        const item = await this.dependencies.repository.claimQueuedItem(executor, task.internalId);
        if (!item) {
          await this.dependencies.repository.failTask(executor, task.internalId, 'INTERNAL_ERROR');
          return null;
        }
        const now = new Date();
        const permission = getLaoLetterBatchActionPolicy(task.action).permission;

        try {
          await this.dependencies.permissions.requireOperatorPermission(
            executor,
            task.requestedByOperatorId,
            permission,
          );
        } catch (error) {
          if (!isAuthorizationFailure(error)) throw error;
          await this.dependencies.repository.recordItemOutcome(executor, item.internalId, {
            status: 'skipped',
            errorCode: 'FORBIDDEN',
            errorMessage: 'Permission denied',
            completedAt: now,
          });
          await this.dependencies.repository.finalize(executor, task.internalId);
          return 'skipped';
        }

        await executor.query('SAVEPOINT lo_letter_item_action');
        try {
          await this.dependencies.contentActions.execute(executor, actionInput(task, item));
        } catch (error) {
          await executor.query('ROLLBACK TO SAVEPOINT lo_letter_item_action');
          await executor.query('RELEASE SAVEPOINT lo_letter_item_action');
          if (!(error instanceof AppError)) {
            throw new UnrecoverableTaskExecutionError('INTERNAL_ERROR', error);
          }
          await this.dependencies.repository.recordItemOutcome(executor, item.internalId, {
            status: 'failed',
            errorCode: error.code,
            errorMessage: error.expose ? error.message : 'Content action failed',
            completedAt: now,
          });
          await this.dependencies.repository.finalize(executor, task.internalId);
          return 'failed';
        }
        await executor.query('RELEASE SAVEPOINT lo_letter_item_action');

        await this.dependencies.audit.recordSuccessfulAction(executor, {
          operatorId: task.requestedByOperatorId,
          actionKey: `content.lo_letters.${task.action}`,
          contentId: item.contentId,
          batchTaskId: task.taskId,
        });
        await this.dependencies.repository.recordItemOutcome(executor, item.internalId, {
          status: 'succeeded',
          errorCode: null,
          errorMessage: null,
          completedAt: now,
        });
        await this.dependencies.repository.finalize(executor, task.internalId);
        return 'succeeded';
      });
    } catch (error) {
      if (!(error instanceof UnrecoverableTaskExecutionError) || claimedTaskId === null) throw error;
      await this.dependencies.transactions.run((executor) =>
        this.dependencies.repository.failTask(executor, claimedTaskId!, error.safeCode));
      return 'failed';
    }
  }
}

class UnrecoverableTaskExecutionError extends Error {
  constructor(readonly safeCode: string, cause: unknown) {
    super('Lao-letter batch task execution failed', { cause });
    this.name = 'UnrecoverableTaskExecutionError';
  }
}

function actionInput(
  task: LaoLetterBatchTaskRecord,
  item: Readonly<{ contentId: string; revisionId: string | null }>,
): Readonly<Record<string, unknown>> {
  return {
    taskId: task.taskId,
    operatorId: task.requestedByOperatorId,
    action: task.action,
    reason: task.reason,
    contentId: item.contentId,
    revisionId: item.revisionId,
  };
}

function isAuthorizationFailure(error: unknown): boolean {
  return error instanceof AppError && [
    'FORBIDDEN',
    'OPERATOR_ACCESS_DENIED',
    'OPERATOR_DISABLED',
    'OPERATOR_NOT_FOUND',
  ].includes(error.code);
}
