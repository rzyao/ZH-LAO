import pino from 'pino';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TransactionManager } from '../../../src/database/transaction-manager.js';
import type { DatabaseExecutor } from '../../../src/database/executor.js';
import type { LaoLetterAdminRepository } from '../../../src/modules/content/application/ports/lo-letter-admin-repository.js';
import type { LaoLetterQueryInput } from '../../../src/modules/content/domain/lo-letter-admin-query.js';
import { PostgresLaoLetterAdminRepository } from '../../../src/modules/content/infrastructure/postgres-lo-letter-admin-repository.js';
import { createLaoLetterBatchTestDatabase } from './lo-letter-batch-fixtures.js';

const selectionModulePath = '../../../src/modules/content/application/use-cases/manage-lo-letter-selection.js';
type Preview = Readonly<{ query: unknown; expectedCount: number; selectionHash: string }>;
type SelectionService = Readonly<{
  previewQuery: (query: LaoLetterQueryInput) => Promise<Preview>;
  resolveQueryAll: (executor: DatabaseExecutor, input: Readonly<{
    query: LaoLetterQueryInput;
    expectedCount: number;
    selectionHash: string;
  }>) => Promise<readonly { contentId: string; revisionId: string | null }[]>;
}>;
type SelectionModule = Readonly<{
  ManageLaoLetterSelection: new (
    repository: LaoLetterAdminRepository,
    transactions: TransactionManager,
  ) => SelectionService;
}>;

const adminUrl = process.env.ADMIN_DATABASE_URL;
const integration = adminUrl ? describe : describe.skip;

integration('PostgreSQL Lao-letter selection preview (TC-002/TC-003)', () => {
  let database: Awaited<ReturnType<typeof createLaoLetterBatchTestDatabase>>;
  let pool: pg.Pool;
  let service: SelectionService;
  let transactions: TransactionManager;

  beforeAll(async () => {
    database = await createLaoLetterBatchTestDatabase(adminUrl!, { pageSize: 50, pageCount: 10 });
    pool = new pg.Pool({ connectionString: database.url, max: 4 });
    transactions = new TransactionManager(pool, pino({ level: 'silent' }));
    const repository = new PostgresLaoLetterAdminRepository(transactions) as unknown as LaoLetterAdminRepository;
    const module = await import(/* @vite-ignore */ selectionModulePath) as SelectionModule;
    service = new module.ManageLaoLetterSelection(repository, transactions);
  }, 120_000);

  afterAll(async () => {
    await pool?.end();
    await database?.dispose();
  }, 30_000);

  it('normalizes semantically identical queries to one hash using the complete UUID set', async () => {
    const first = await service.previewQuery({
      q: ' e\u0301 ',
      letterType: ['vowel', 'consonant', 'vowel'],
      contentStatus: ['disabled', 'active'],
      sort: 'updated_at',
      order: 'desc',
      page: 1,
      pageSize: 50,
    });
    const equivalent = await service.previewQuery({
      q: 'é',
      letterType: ['consonant', 'vowel'],
      contentStatus: ['active', 'disabled'],
      sort: 'updated_at',
      order: 'desc',
      page: 9,
      pageSize: 500,
    });

    expect(equivalent.query).toEqual(first.query);
    expect(equivalent.expectedCount).toBe(first.expectedCount);
    expect(equivalent.selectionHash).toBe(first.selectionHash);
    expect(first.selectionHash).toMatch(/^[a-f0-9]{64}$/u);

    const complete = await service.previewQuery({});
    expect(complete.expectedCount).toBe(501);
  });

  it('recomputes all UUIDs and rejects a stale count/hash without writing a task or items', async () => {
    const query: LaoLetterQueryInput = { contentStatus: ['active'] };
    const preview = await service.previewQuery(query);
    const target = database.fixture.letters.find((letter) => letter.contentStatus === 'active')!;
    const before = await pool.query<{ tasks: string; items: string }>(`
      SELECT
        (SELECT count(*) FROM content.lo_letter_batch_tasks)::text AS tasks,
        (SELECT count(*) FROM content.lo_letter_batch_task_items)::text AS items`);

    await pool.query("UPDATE content.contents SET status = 'archived' WHERE public_id = $1", [target.contentId]);
    await expect(transactions.run((executor) => service.resolveQueryAll(executor, {
      query,
      expectedCount: preview.expectedCount,
      selectionHash: preview.selectionHash,
    }))).rejects.toMatchObject({ code: 'BATCH_SELECTION_CHANGED' });

    const after = await pool.query<{ tasks: string; items: string }>(`
      SELECT
        (SELECT count(*) FROM content.lo_letter_batch_tasks)::text AS tasks,
        (SELECT count(*) FROM content.lo_letter_batch_task_items)::text AS items`);
    expect(after.rows[0]).toEqual(before.rows[0]);
  });
});
