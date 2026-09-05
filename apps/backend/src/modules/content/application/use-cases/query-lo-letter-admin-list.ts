import type {
  LaoLetterAdminListItem,
  LaoLetterAdminListPage,
  LaoLetterAdminRepository,
} from '../ports/lo-letter-admin-repository.js';
import {
  LO_LETTER_BATCH_ACTIONS,
  getLaoLetterBatchActionPolicy,
  normalizeLaoLetterQuery,
  type LaoLetterBatchAction,
  type LaoLetterQueryInput,
} from '../../domain/index.js';

export type QueryLaoLetterAdminListInput = Readonly<{
  query: LaoLetterQueryInput;
  page?: number;
  pageSize?: number;
  permissions: readonly string[];
}>;

export type LaoLetterAdminListResult = LaoLetterAdminListPage & Readonly<{
  batchActions: readonly LaoLetterBatchAction[];
}>;

function allowedActions(permissions: ReadonlySet<string>): readonly LaoLetterBatchAction[] {
  return LO_LETTER_BATCH_ACTIONS.filter((action) => (
    permissions.has(getLaoLetterBatchActionPolicy(action).permission)
  ));
}

function filterItemActions(
  item: LaoLetterAdminListItem,
  permitted: ReadonlySet<LaoLetterBatchAction>,
): LaoLetterAdminListItem {
  return {
    ...item,
    availableActions: item.availableActions.filter((action) => permitted.has(action)),
  };
}

export class QueryLaoLetterAdminList {
  constructor(private readonly repository: Pick<LaoLetterAdminRepository, 'list'>) {}

  async execute(input: QueryLaoLetterAdminListInput): Promise<LaoLetterAdminListResult> {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 50;
    if (!Number.isSafeInteger(page) || page < 1) throw new TypeError('page must be a positive integer');
    if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 500) {
      throw new TypeError('pageSize must be between 1 and 500');
    }

    const permissionSet = new Set(input.permissions);
    const batchActions = allowedActions(permissionSet);
    const permittedActions = new Set(batchActions);
    const result = await this.repository.list({
      selection: normalizeLaoLetterQuery(input.query),
      page,
      pageSize,
    });

    return {
      ...result,
      items: result.items.map((item) => filterItemActions(item, permittedActions)),
      batchActions,
    };
  }
}
