import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { AppError } from '../../../../errors/app-error.js';
import type { DatabaseExecutor } from '../../../../database/executor.js';
import type {
  ContentTransactionRunner,
  LaoLetterBatchSelectionSnapshot,
  LaoLetterBatchTaskItemPage,
  LaoLetterBatchTaskPage,
  LaoLetterBatchTaskRecord,
  LaoLetterBatchTaskRepository,
  LaoLetterSelectionTarget,
} from '../ports/lo-letter-admin-repository.js';
import { ManageLaoLetterSelection } from './manage-lo-letter-selection.js';
import {
  createLaoLetterSelectionHash,
  getLaoLetterBatchActionPolicy,
  normalizeLaoLetterBatchReason,
  normalizeLaoLetterQuery,
  type LaoLetterBatchAction,
  type LaoLetterBatchItemStatus,
  type LaoLetterBatchPermission,
  type LaoLetterQueryInput,
  type NormalizedLaoLetterQuery,
} from '../../domain/index.js';

const uuid = z.string().uuid();

export type CreateLaoLetterBatchTaskInput = Readonly<{
  operatorId: string;
  idempotencyKey: string;
  action: LaoLetterBatchAction;
  selection:
    | Readonly<{ mode: 'explicit_ids'; contentIds: readonly string[]; expectedCount: number }>
    | Readonly<{
      mode: 'query_all';
      query: LaoLetterQueryInput;
      expectedCount: number;
      selectionHash: string;
    }>;
  reason?: string;
}>;

export interface LaoLetterBatchSubmissionAuthorizer {
  requirePermission(operatorId: string, permission: LaoLetterBatchPermission): Promise<void>;
}

export class ManageLaoLetterBatchTasks {
  constructor(private readonly dependencies: Readonly<{
    repository: Pick<LaoLetterBatchTaskRepository,
      'countActive' | 'findByIdempotencyKey' | 'create' | 'listSelectionTargets'
      | 'listOwned' | 'findOwned' | 'listOwnedItems' | 'requeueOwnedFailedItems'>;
    selection: ManageLaoLetterSelection;
    transactions: ContentTransactionRunner;
    authorization: LaoLetterBatchSubmissionAuthorizer;
    activeTaskLimit: number;
    retryAfterSeconds: number;
  }>) {}

  async createTask(input: CreateLaoLetterBatchTaskInput): Promise<LaoLetterBatchTaskRecord> {
    const policy = getLaoLetterBatchActionPolicy(input.action);
    await this.dependencies.authorization.requirePermission(input.operatorId, policy.permission);
    const reason = parseReason(input.action, input.reason);
    validateAdmissionInput(input);

    return this.dependencies.transactions.run(async (executor) => {
      const activeCount = await this.dependencies.repository.countActive(executor);
      const existing = await this.dependencies.repository.findByIdempotencyKey(
        executor,
        input.operatorId,
        input.idempotencyKey,
      );
      if (existing) {
        const matches = await canonicalRequestMatches(
          this.dependencies.repository,
          executor,
          existing,
          input,
          reason,
        );
        if (!matches) throw conflict();
        return existing;
      }
      if (activeCount >= this.dependencies.activeTaskLimit) {
        throw new AppError({
          code: 'RATE_LIMITED',
          message: 'Too many active Lao-letter batch tasks',
          httpStatus: 429,
          details: { retry_after_seconds: this.dependencies.retryAfterSeconds },
        });
      }

      const selection = await freezeSelection(executor, input, this.dependencies.selection);
      return this.dependencies.repository.create(executor, {
        taskId: randomUUID(),
        action: input.action,
        selection,
        reason,
        requestedByOperatorId: input.operatorId,
        idempotencyKey: input.idempotencyKey,
      });
    });
  }

  async listOwnedTasks(input: Readonly<{
    operatorId: string;
    page: number;
    pageSize: number;
  }>): Promise<LaoLetterBatchTaskPage> {
    validatePage(input.page, input.pageSize);
    return this.dependencies.repository.listOwned(input.operatorId, input.page, input.pageSize);
  }

  async getOwnedTask(input: Readonly<{
    operatorId: string;
    taskId: string;
    page: number;
    pageSize: number;
    status?: LaoLetterBatchItemStatus;
  }>): Promise<Readonly<{ task: LaoLetterBatchTaskRecord; results: LaoLetterBatchTaskItemPage }>> {
    validateTaskLookup(input);
    const task = await this.dependencies.repository.findOwned(input.operatorId, input.taskId);
    if (!task) throw notFound();
    const results = await this.dependencies.repository.listOwnedItems(
      input.operatorId,
      input.taskId,
      input.page,
      input.pageSize,
      input.status,
    );
    return { task, results };
  }

  async retryFailed(input: Readonly<{ operatorId: string; taskId: string }>): Promise<LaoLetterBatchTaskRecord> {
    if (!uuid.safeParse(input.operatorId).success || !uuid.safeParse(input.taskId).success) {
      throw validation('Invalid task lookup UUID');
    }
    const owned = await this.dependencies.repository.findOwned(input.operatorId, input.taskId);
    if (!owned) throw notFound();
    await this.dependencies.authorization.requirePermission(
      input.operatorId,
      getLaoLetterBatchActionPolicy(owned.action).permission,
    );
    return this.dependencies.transactions.run(async (executor) => {
      const task = await this.dependencies.repository.requeueOwnedFailedItems(
        executor,
        input.operatorId,
        input.taskId,
      );
      if (!task) throw notFound();
      return task;
    });
  }
}

function validateTaskLookup(input: Readonly<{ operatorId: string; taskId: string; page: number; pageSize: number }>): void {
  if (!uuid.safeParse(input.operatorId).success || !uuid.safeParse(input.taskId).success) {
    throw validation('Invalid task lookup UUID');
  }
  validatePage(input.page, input.pageSize);
}

function validatePage(page: number, pageSize: number): void {
  if (!Number.isSafeInteger(page) || page < 1
    || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw validation('Invalid batch task pagination');
  }
}

function notFound(): AppError {
  return new AppError({ code: 'NOT_FOUND', message: 'Batch task not found', httpStatus: 404 });
}

function validateAdmissionInput(input: CreateLaoLetterBatchTaskInput): void {
  if (!uuid.safeParse(input.operatorId).success) throw validation('Invalid Operator UUID');
  if (input.idempotencyKey.trim().length < 1 || input.idempotencyKey.length > 128) {
    throw validation('Invalid idempotency key');
  }
  if (!Number.isSafeInteger(input.selection.expectedCount) || input.selection.expectedCount < 1) {
    throw validation('Selection expected count must be positive');
  }
  if (input.selection.mode === 'explicit_ids') {
    if (input.selection.contentIds.length < 1
      || input.selection.contentIds.some((contentId) => !uuid.safeParse(contentId).success)
      || new Set(input.selection.contentIds).size !== input.selection.contentIds.length
      || input.selection.contentIds.length !== input.selection.expectedCount) {
      throw validation('Explicit selection must contain unique UUIDs matching expected count');
    }
  } else if (!/^[a-f0-9]{64}$/u.test(input.selection.selectionHash)) {
    throw validation('Invalid selection hash');
  }
}

function parseReason(action: LaoLetterBatchAction, reason: string | undefined): string | null {
  try {
    return normalizeLaoLetterBatchReason(action, reason);
  } catch {
    throw validation('Invalid batch action reason');
  }
}

async function freezeSelection(
  executor: DatabaseExecutor,
  input: CreateLaoLetterBatchTaskInput,
  selectionManager: ManageLaoLetterSelection,
): Promise<LaoLetterBatchSelectionSnapshot> {
  if (input.selection.mode === 'query_all') {
    const query = normalizeLaoLetterQuery(input.selection.query);
    const targets = sortTargets(await selectionManager.resolveQueryAll(executor, input.selection));
    return {
      mode: 'query_all',
      query,
      hash: input.selection.selectionHash,
      expectedCount: input.selection.expectedCount,
      targets,
    };
  }
  const contentIds = [...input.selection.contentIds].sort((left, right) => left.localeCompare(right, 'en'));
  const targets = sortTargets(await selectionManager.resolveExplicit(
    executor,
    contentIds,
    input.selection.expectedCount,
  ));
  return {
    mode: 'explicit_ids',
    query: null,
    hash: explicitSelectionHash(contentIds),
    expectedCount: input.selection.expectedCount,
    targets,
  };
}

function explicitSelectionHash(contentIds: readonly string[]): string {
  return createLaoLetterSelectionHash(normalizeLaoLetterQuery({}), contentIds);
}

function sortTargets(targets: readonly LaoLetterSelectionTarget[]): readonly LaoLetterSelectionTarget[] {
  return [...targets].sort((left, right) => left.contentId.localeCompare(right.contentId, 'en'));
}

async function canonicalRequestMatches(
  repository: Pick<LaoLetterBatchTaskRepository, 'listSelectionTargets'>,
  executor: DatabaseExecutor,
  existing: LaoLetterBatchTaskRecord,
  input: CreateLaoLetterBatchTaskInput,
  reason: string | null,
): Promise<boolean> {
  if (existing.action !== input.action || existing.reason !== reason
    || existing.selectionMode !== input.selection.mode
    || existing.expectedCount !== input.selection.expectedCount) return false;
  if (input.selection.mode === 'query_all') {
    const query = normalizeLaoLetterQuery(input.selection.query);
    return existing.selectionHash === input.selection.selectionHash
      && normalizedQueriesEqual(existing.selectionQuery, query);
  }
  const contentIds = [...input.selection.contentIds].sort((left, right) => left.localeCompare(right, 'en'));
  if (existing.selectionHash !== explicitSelectionHash(contentIds)) return false;
  const targets = await repository.listSelectionTargets(executor, existing.internalId);
  return targets.length === contentIds.length
    && targets.every((target, index) => target.contentId === contentIds[index]);
}

function normalizedQueriesEqual(left: NormalizedLaoLetterQuery | null, right: NormalizedLaoLetterQuery): boolean {
  return left !== null && JSON.stringify(left) === JSON.stringify(right);
}

function validation(message: string): AppError {
  return new AppError({ code: 'VALIDATION_ERROR', message, httpStatus: 400 });
}

function conflict(): AppError {
  return new AppError({ code: 'CONFLICT', message: 'Idempotency key request conflict', httpStatus: 409 });
}
