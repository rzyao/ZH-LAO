import type { DatabaseExecutor } from '../../../../database/executor.js';
import { AppError } from '../../../../errors/app-error.js';
import type {
  ContentTransactionRunner,
  LaoLetterAdminRepository,
  LaoLetterSelectionTarget,
} from '../ports/lo-letter-admin-repository.js';
import {
  createLaoLetterSelectionHash,
  normalizeLaoLetterQuery,
  type LaoLetterQueryInput,
  type NormalizedLaoLetterQuery,
} from '../../domain/index.js';

export type LaoLetterSelectionPreview = Readonly<{
  query: NormalizedLaoLetterQuery;
  expectedCount: number;
  selectionHash: string;
}>;

export type ResolveLaoLetterQueryAllInput = Readonly<{
  query: LaoLetterQueryInput;
  expectedCount: number;
  selectionHash: string;
}>;

export class LaoLetterSelectionChangedError extends AppError {
  constructor() {
    super({
      code: 'BATCH_SELECTION_CHANGED',
      message: 'Lao-letter selection changed after preview',
      httpStatus: 409,
    });
    this.name = 'LaoLetterSelectionChangedError';
  }
}

export class ManageLaoLetterSelection {
  constructor(
    private readonly repository: Pick<LaoLetterAdminRepository, 'resolveQuerySelection' | 'resolveExplicitSelection'>,
    private readonly transactions: ContentTransactionRunner,
  ) {}

  async previewQuery(input: LaoLetterQueryInput): Promise<LaoLetterSelectionPreview> {
    const query = normalizeLaoLetterQuery(input);
    return this.transactions.run(async (executor) => {
      await executor.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const targets = await this.repository.resolveQuerySelection(executor, query);
      return preview(query, targets);
    });
  }

  async resolveQueryAll(
    executor: DatabaseExecutor,
    input: ResolveLaoLetterQueryAllInput,
  ): Promise<readonly LaoLetterSelectionTarget[]> {
    const query = normalizeLaoLetterQuery(input.query);
    const targets = await this.repository.resolveQuerySelection(executor, query);
    const current = preview(query, targets);
    if (current.expectedCount !== input.expectedCount || current.selectionHash !== input.selectionHash) {
      throw new LaoLetterSelectionChangedError();
    }
    return targets;
  }

  async resolveExplicit(
    executor: DatabaseExecutor,
    contentIds: readonly string[],
    expectedCount: number,
  ): Promise<readonly LaoLetterSelectionTarget[]> {
    const targets = await this.repository.resolveExplicitSelection(executor, contentIds);
    if (targets.length !== expectedCount
      || targets.some((target, index) => target.contentId !== contentIds[index])) {
      throw new LaoLetterSelectionChangedError();
    }
    return targets;
  }
}

function preview(
  query: NormalizedLaoLetterQuery,
  targets: readonly LaoLetterSelectionTarget[],
): LaoLetterSelectionPreview {
  const contentIds = targets.map((target) => target.contentId);
  return {
    query,
    expectedCount: contentIds.length,
    selectionHash: createLaoLetterSelectionHash(query, contentIds),
  };
}
