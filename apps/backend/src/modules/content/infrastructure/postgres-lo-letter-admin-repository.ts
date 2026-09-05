import type { DatabaseExecutor, QueryResultRow } from '../../../database/executor.js';
import type {
  ContentTransactionRunner,
  LaoLetterAdminListItem,
  LaoLetterAdminListPage,
  LaoLetterAdminListQuery,
  LaoLetterSelectionTarget,
} from '../application/ports/lo-letter-admin-repository.js';
import type {
  LaoLetterBatchAction,
  LaoLetterContentStatus,
  LaoLetterType,
} from '../domain/index.js';

type ListRow = QueryResultRow & {
  content_id: string;
  character: string;
  letter_type: LaoLetterType;
  letter_class: string | null;
  name: string | null;
  romanization: string | null;
  sort_order: number | null;
  content_status: LaoLetterContentStatus;
  working_revision_id: string | null;
  working_revision_status: 'draft' | 'pending_review' | 'approved' | 'rejected' | null;
  lock_version: number | null;
  updated_at: Date | string;
};

const EFFECTIVE_LETTERS = `
  SELECT
    c.public_id AS content_id,
    COALESCE(r.snapshot #>> '{fields,character}', l.character) AS character,
    COALESCE(r.snapshot #>> '{fields,letterType}', l.letter_type) AS letter_type,
    COALESCE(r.snapshot #>> '{fields,letterClass}', l.letter_class) AS letter_class,
    COALESCE(r.snapshot #>> '{fields,name}', l.name) AS name,
    COALESCE(r.snapshot #>> '{fields,romanization}', l.romanization) AS romanization,
    COALESCE((r.snapshot #>> '{fields,sortOrder}')::integer, l.sort_order::integer) AS sort_order,
    c.status AS content_status,
    r.revision_public_id AS working_revision_id,
    r.status AS working_revision_status,
    r.lock_version,
    c.updated_at
  FROM content.contents c
  JOIN content.lo_letters l ON l.content_id = c.id
  LEFT JOIN LATERAL (
    SELECT revision_public_id, status, snapshot, lock_version
    FROM content.content_revisions
    WHERE entity_type = 'content'
      AND entity_id = c.public_id
      AND status = ANY(ARRAY['draft', 'pending_review', 'approved', 'rejected']::varchar[])
    ORDER BY revision_number DESC
    LIMIT 1
  ) r ON true
  WHERE c.language = 'lo' AND c.content_type = 'lo_letter'`;

const SORT_SQL = {
  sort_order: 'sort_order',
  character: 'character',
  name: 'name',
  romanization: 'romanization',
  updated_at: 'updated_at',
} as const;

type QueryParts = Readonly<{ where: string; values: readonly unknown[] }>;

function likeLiteral(value: string): string {
  return `%${value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')}%`;
}

function buildFilter(query: LaoLetterAdminListQuery['selection']): QueryParts {
  const clauses: string[] = [];
  const values: unknown[] = [];
  const bind = (value: unknown): string => {
    values.push(value);
    return `$${values.length}`;
  };

  if (query.q) {
    const parameter = bind(likeLiteral(query.q));
    clauses.push(`(character ILIKE ${parameter} ESCAPE '\\' OR name ILIKE ${parameter} ESCAPE '\\' OR romanization ILIKE ${parameter} ESCAPE '\\')`);
  }
  if (query.letterType.length > 0) {
    clauses.push(`letter_type = ANY(${bind(query.letterType)}::text[])`);
  }
  if (query.letterClass.length > 0) {
    clauses.push(`letter_class = ANY(${bind(query.letterClass)}::text[])`);
  }
  if (query.contentStatus.length > 0) {
    clauses.push(`content_status = ANY(${bind(query.contentStatus)}::text[])`);
  }
  if (query.revisionStatus.length > 0) {
    const statuses = query.revisionStatus.filter((status) => status !== 'none');
    const includesNone = statuses.length !== query.revisionStatus.length;
    if (statuses.length > 0 && includesNone) {
      clauses.push(`(working_revision_status = ANY(${bind(statuses)}::text[]) OR working_revision_status IS NULL)`);
    } else if (statuses.length > 0) {
      clauses.push(`working_revision_status = ANY(${bind(statuses)}::text[])`);
    } else {
      clauses.push('working_revision_status IS NULL');
    }
  }

  return {
    where: clauses.length > 0 ? ` WHERE ${clauses.join(' AND ')}` : '',
    values,
  };
}

function availableActions(row: ListRow): readonly LaoLetterBatchAction[] {
  const actions: LaoLetterBatchAction[] = [];
  if (row.working_revision_status === 'draft') {
    actions.push('submit_review');
  }
  if (row.working_revision_status === 'pending_review') actions.push('approve', 'reject');
  if (row.working_revision_status === 'approved') actions.push('publish');
  if (row.content_status !== 'archived') actions.push('archive');
  return actions;
}

function mapRow(row: ListRow): LaoLetterAdminListItem {
  return {
    contentId: String(row.content_id),
    character: String(row.character),
    letterType: row.letter_type,
    letterClass: row.letter_class === null ? null : String(row.letter_class),
    name: row.name === null ? null : String(row.name),
    romanization: row.romanization === null ? null : String(row.romanization),
    sortOrder: row.sort_order === null ? null : Number(row.sort_order),
    contentStatus: row.content_status,
    workingRevisionId: row.working_revision_id === null ? null : String(row.working_revision_id),
    workingRevisionStatus: row.working_revision_status,
    lockVersion: row.lock_version === null ? null : Number(row.lock_version),
    updatedAt: new Date(row.updated_at),
    availableActions: availableActions(row),
  };
}

export class PostgresLaoLetterAdminRepository {
  constructor(
    private readonly transactions: ContentTransactionRunner,
  ) {}

  async list(query: LaoLetterAdminListQuery): Promise<LaoLetterAdminListPage> {
    const filter = buildFilter(query.selection);
    const orderColumn = SORT_SQL[query.selection.sort];
    const orderDirection = query.selection.order === 'desc' ? 'DESC' : 'ASC';

    return this.transactions.run(async (executor) => {
      await executor.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const count = await executor.query<{ total: number | string }>(
        `WITH effective_letters AS (${EFFECTIVE_LETTERS})
         SELECT count(*)::integer AS total FROM effective_letters${filter.where}`,
        filter.values,
      );
      const values = [...filter.values, query.pageSize, (query.page - 1) * query.pageSize];
      const rows = await executor.query<ListRow>(
        `WITH effective_letters AS (${EFFECTIVE_LETTERS})
         SELECT * FROM effective_letters${filter.where}
         ORDER BY ${orderColumn} ${orderDirection} NULLS LAST, content_id ASC
         LIMIT $${filter.values.length + 1} OFFSET $${filter.values.length + 2}`,
        values,
      );

      return {
        items: rows.rows.map(mapRow),
        page: query.page,
        pageSize: query.pageSize,
        total: Number(count.rows[0]?.total ?? 0),
      };
    });
  }

  async resolveQuerySelection(
    executor: DatabaseExecutor,
    query: LaoLetterAdminListQuery['selection'],
  ): Promise<readonly LaoLetterSelectionTarget[]> {
    const filter = buildFilter(query);
    const result = await executor.query<Pick<ListRow, 'content_id' | 'working_revision_id'>>(
      `WITH effective_letters AS (${EFFECTIVE_LETTERS})
       SELECT content_id, working_revision_id
       FROM effective_letters${filter.where}
       ORDER BY content_id ASC`,
      filter.values,
    );
    return result.rows.map((row) => ({
      contentId: String(row.content_id),
      revisionId: row.working_revision_id === null ? null : String(row.working_revision_id),
    }));
  }

  async resolveExplicitSelection(
    executor: DatabaseExecutor,
    contentIds: readonly string[],
  ): Promise<readonly LaoLetterSelectionTarget[]> {
    const result = await executor.query<Pick<ListRow, 'content_id' | 'working_revision_id'>>(
      `WITH effective_letters AS (${EFFECTIVE_LETTERS})
       SELECT content_id, working_revision_id
       FROM effective_letters
       WHERE content_id = ANY($1::uuid[])
       ORDER BY content_id ASC`,
      [contentIds],
    );
    return result.rows.map((row) => ({
      contentId: String(row.content_id),
      revisionId: row.working_revision_id === null ? null : String(row.working_revision_id),
    }));
  }
}
