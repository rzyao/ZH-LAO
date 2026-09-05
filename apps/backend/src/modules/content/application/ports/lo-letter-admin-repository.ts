import type { DatabaseExecutor } from '../../../../database/executor.js';
import type {
  LaoLetterBatchAction,
  LaoLetterBatchItemStatus,
  LaoLetterBatchTaskStatus,
  LaoLetterContentStatus,
  LaoLetterType,
  NormalizedLaoLetterQuery,
} from '../../domain/index.js';

export type ContentTransactionExecutor = DatabaseExecutor;

/** Compatible with the repository-wide TransactionManager without coupling Content to pg. */
export interface ContentTransactionRunner {
  run<Result>(
    operation: (executor: ContentTransactionExecutor) => Promise<Result>,
  ): Promise<Result>;
}

export type LaoLetterAdminListQuery = Readonly<{
  selection: NormalizedLaoLetterQuery;
  page: number;
  pageSize: number;
}>;

export type LaoLetterAdminListItem = Readonly<{
  contentId: string;
  character: string;
  letterType: LaoLetterType;
  letterClass: string | null;
  name: string | null;
  romanization: string | null;
  sortOrder: number | null;
  contentStatus: LaoLetterContentStatus;
  workingRevisionId: string | null;
  workingRevisionStatus: 'draft' | 'pending_review' | 'approved' | 'rejected' | null;
  lockVersion: number | null;
  updatedAt: Date;
  availableActions: readonly LaoLetterBatchAction[];
}>;

export type LaoLetterAdminListPage = Readonly<{
  items: readonly LaoLetterAdminListItem[];
  page: number;
  pageSize: number;
  total: number;
}>;

export type LaoLetterSelectionTarget = Readonly<{
  contentId: string;
  revisionId: string | null;
}>;

export interface LaoLetterAdminRepository {
  /** Returns page and count from one read-only repeatable-read snapshot. */
  list(query: LaoLetterAdminListQuery): Promise<LaoLetterAdminListPage>;
  /** Resolves every matching target inside the caller's task-creation transaction. */
  resolveQuerySelection(
    executor: ContentTransactionExecutor,
    query: NormalizedLaoLetterQuery,
  ): Promise<readonly LaoLetterSelectionTarget[]>;
  /** Resolves and validates an explicit UUID selection inside the caller's transaction. */
  resolveExplicitSelection(
    executor: ContentTransactionExecutor,
    contentIds: readonly string[],
  ): Promise<readonly LaoLetterSelectionTarget[]>;
}

export type LaoLetterBatchSelectionSnapshot =
  | Readonly<{
    mode: 'explicit_ids';
    query: null;
    hash: string;
    expectedCount: number;
    targets: readonly LaoLetterSelectionTarget[];
  }>
  | Readonly<{
    mode: 'query_all';
    query: NormalizedLaoLetterQuery;
    hash: string;
    expectedCount: number;
    targets: readonly LaoLetterSelectionTarget[];
  }>;

export type LaoLetterBatchTaskRecord = Readonly<{
  internalId: bigint;
  taskId: string;
  action: LaoLetterBatchAction;
  selectionMode: 'explicit_ids' | 'query_all';
  selectionQuery: NormalizedLaoLetterQuery | null;
  selectionHash: string;
  expectedCount: number;
  targetCount: number;
  reason: string | null;
  requestedByOperatorId: string;
  idempotencyKey: string;
  status: LaoLetterBatchTaskStatus;
  processedCount: number;
  succeededCount: number;
  failedCount: number;
  skippedCount: number;
  lastErrorCode: string | null;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}>;

export type LaoLetterBatchTaskItemRecord = Readonly<{
  internalId: bigint;
  taskInternalId: bigint;
  itemNo: number;
  contentId: string;
  revisionId: string | null;
  status: LaoLetterBatchItemStatus;
  errorCode: string | null;
  errorMessage: string | null;
  retryCount: number;
  lastAttemptAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}>;

export type CreateLaoLetterBatchTaskRecord = Readonly<{
  taskId: string;
  action: LaoLetterBatchAction;
  selection: LaoLetterBatchSelectionSnapshot;
  reason: string | null;
  requestedByOperatorId: string;
  idempotencyKey: string;
}>;

export type LaoLetterBatchTaskPage = Readonly<{
  items: readonly LaoLetterBatchTaskRecord[];
  page: number;
  pageSize: number;
  total: number;
}>;

export type LaoLetterBatchTaskItemPage = Readonly<{
  items: readonly LaoLetterBatchTaskItemRecord[];
  page: number;
  pageSize: number;
  total: number;
}>;

export type LaoLetterBatchItemOutcome = Readonly<{
  status: 'succeeded' | 'failed' | 'skipped';
  errorCode: string | null;
  errorMessage: string | null;
  completedAt: Date;
}>;

export type LaoLetterBatchQueueTelemetry = Readonly<{
  depth: number;
  oldestAgeMs: number;
}>;

export interface LaoLetterBatchTaskRepository {
  getQueueTelemetry(executor: ContentTransactionExecutor): Promise<LaoLetterBatchQueueTelemetry>;
  /** Serializes queue admission and returns the current active task count. */
  countActive(executor: ContentTransactionExecutor): Promise<number>;
  findByIdempotencyKey(
    executor: ContentTransactionExecutor,
    operatorId: string,
    idempotencyKey: string,
  ): Promise<LaoLetterBatchTaskRecord | null>;
  create(
    executor: ContentTransactionExecutor,
    input: CreateLaoLetterBatchTaskRecord,
  ): Promise<LaoLetterBatchTaskRecord>;
  listSelectionTargets(
    executor: ContentTransactionExecutor,
    taskInternalId: bigint,
  ): Promise<readonly LaoLetterSelectionTarget[]>;

  listOwned(
    operatorId: string,
    page: number,
    pageSize: number,
  ): Promise<LaoLetterBatchTaskPage>;
  findOwned(
    operatorId: string,
    taskId: string,
  ): Promise<LaoLetterBatchTaskRecord | null>;
  listOwnedItems(
    operatorId: string,
    taskId: string,
    page: number,
    pageSize: number,
    status?: LaoLetterBatchItemStatus,
  ): Promise<LaoLetterBatchTaskItemPage>;

  claimProcessableTask(
    executor: ContentTransactionExecutor,
  ): Promise<LaoLetterBatchTaskRecord | null>;
  claimQueuedItem(
    executor: ContentTransactionExecutor,
    taskInternalId: bigint,
  ): Promise<LaoLetterBatchTaskItemRecord | null>;
  recordItemOutcome(
    executor: ContentTransactionExecutor,
    itemInternalId: bigint,
    outcome: LaoLetterBatchItemOutcome,
  ): Promise<void>;
  finalize(
    executor: ContentTransactionExecutor,
    taskInternalId: bigint,
  ): Promise<LaoLetterBatchTaskRecord>;
  failTask(
    executor: ContentTransactionExecutor,
    taskInternalId: bigint,
    errorCode: string,
  ): Promise<LaoLetterBatchTaskRecord>;
  requeueOwnedFailedItems(
    executor: ContentTransactionExecutor,
    operatorId: string,
    taskId: string,
  ): Promise<LaoLetterBatchTaskRecord | null>;
}
