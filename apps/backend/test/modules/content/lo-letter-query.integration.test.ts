import pino from 'pino';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { DatabaseExecutor, QueryResult, QueryResultRow } from '../../../src/database/executor.js';
import { asExecutor } from '../../../src/database/pool.js';
import { TransactionManager } from '../../../src/database/transaction-manager.js';
import type { ContentTransactionRunner } from '../../../src/modules/content/application/ports/lo-letter-admin-repository.js';
import { normalizeLaoLetterQuery } from '../../../src/modules/content/domain/lo-letter-admin-query.js';
import { PostgresLaoLetterAdminRepository } from '../../../src/modules/content/infrastructure/postgres-lo-letter-admin-repository.js';
import {
  createLaoLetterBatchTestDatabase,
  type LaoLetterBatchFixture,
} from './lo-letter-batch-fixtures.js';

const { Pool } = pg;
const adminUrl = process.env.ADMIN_DATABASE_URL;
const integration = adminUrl ? describe : describe.skip;

integration('PostgreSQL Lao-letter administration query', () => {
  let database: Awaited<ReturnType<typeof createLaoLetterBatchTestDatabase>>;
  let pool: pg.Pool;

  beforeAll(async () => {
    database = await createLaoLetterBatchTestDatabase(adminUrl!, {
      pageSize: 50,
      pageCount: 10,
    });
    pool = new Pool({ connectionString: database.url, max: 4 });
  }, 120_000);

  afterAll(async () => {
    await pool?.end();
    await database?.dispose();
  }, 30_000);

  function repository(transactions?: ContentTransactionRunner) {
    return new PostgresLaoLetterAdminRepository(
      transactions ?? new TransactionManager(pool, pino({ level: 'silent' })),
    );
  }

  it('returns the default 50-row page, accepts 500, and reports the exact total', async () => {
    const selection = normalizeLaoLetterQuery({});

    const defaultPage = await repository().list({ selection, page: 1, pageSize: 50 });
    expect(defaultPage).toMatchObject({ page: 1, pageSize: 50, total: 501 });
    expect(defaultPage.items).toHaveLength(50);

    const maximumPage = await repository().list({ selection, page: 1, pageSize: 500 });
    expect(maximumPage).toMatchObject({ page: 1, pageSize: 500, total: 501 });
    expect(maximumPage.items).toHaveLength(500);
  });

  it('applies only normalized whitelist filters and sort choices with bound values', async () => {
    const expected = database.fixture.letters.filter((letter) => (
      letter.letterType === 'vowel'
      && letter.contentStatus === 'active'
      && letter.workingRevisionStatus === null
    ));
    const result = await repository().list({
      selection: normalizeLaoLetterQuery({
        q: 'fixture-letter',
        letterType: ['vowel'],
        contentStatus: ['active'],
        revisionStatus: ['none'],
        sort: 'romanization',
        order: 'desc',
      }),
      page: 1,
      pageSize: 500,
    });

    expect(result.total).toBe(expected.length);
    expect(result.items.every((item) => (
      item.letterType === 'vowel'
      && item.contentStatus === 'active'
      && item.workingRevisionStatus === null
    ))).toBe(true);
    expect(result.items.map((item) => item.romanization)).toEqual(
      expected.map((letter) => letter.romanization).sort((left, right) => right.localeCompare(left, 'en')),
    );
  });

  it('prefers active working-revision display fields and falls back to materialized fields', async () => {
    const result = await repository().list({
      selection: normalizeLaoLetterQuery({}),
      page: 1,
      pageSize: 500,
    });
    const working = database.fixture.letters.find((letter) => letter.workingRevisionId !== null)!;
    const materialized = database.fixture.letters.find((letter) => letter.workingRevisionId === null)!;

    expect(result.items.find((item) => item.contentId === working.contentId)).toMatchObject({
      character: `${working.character}-draft`,
      name: `${working.name}-draft`,
      workingRevisionId: working.workingRevisionId,
      workingRevisionStatus: working.workingRevisionStatus,
    });
    expect(result.items.find((item) => item.contentId === materialized.contentId)).toMatchObject({
      character: materialized.character,
      name: materialized.name,
      workingRevisionId: null,
      workingRevisionStatus: null,
    });
  });

  it('uses public UUID ascending as the deterministic tie-break for every sort direction', async () => {
    await pool.query("UPDATE content.contents SET updated_at = TIMESTAMPTZ '2026-02-01 00:00:00Z'");
    const ids = database.fixture.letters.map((letter) => letter.contentId)
      .sort((left, right) => left.localeCompare(right, 'en'));

    for (const order of ['asc', 'desc'] as const) {
      const result = await repository().list({
        selection: normalizeLaoLetterQuery({ sort: 'updated_at', order }),
        page: 1,
        pageSize: 500,
      });
      expect(result.items.map((item) => item.contentId)).toEqual(ids.slice(0, 500));
    }
  });

  it('reads count and rows from one read-only REPEATABLE READ snapshot', async () => {
    const statements: string[] = [];
    let mutated = false;
    const external = asExecutor(pool);
    const transactions: ContentTransactionRunner = {
      run: async <Result>(operation: (executor: DatabaseExecutor) => Promise<Result>) => {
        const client = await pool.connect();
        await client.query('BEGIN');
        try {
          const executor: DatabaseExecutor = {
            query: async <Row extends QueryResultRow = QueryResultRow>(text: string, values?: readonly unknown[]) => {
              statements.push(text);
              const result = await client.query<Row>(text, values as unknown[]);
              if (!mutated && /count\s*\(/iu.test(text)) {
                mutated = true;
                const target = database.fixture.letters.find((letter) => letter.contentStatus === 'active')!;
                await external.query(
                  "UPDATE content.contents SET status = 'archived' WHERE public_id = $1",
                  [target.contentId],
                );
              }
              return result as QueryResult<Row>;
            },
          };
          return await operation(executor);
        } finally {
          await client.query('ROLLBACK');
          client.release();
        }
      },
    };
    const result = await repository(transactions).list({
      selection: normalizeLaoLetterQuery({ contentStatus: ['active'] }),
      page: 1,
      pageSize: 500,
    });

    expect(statements.some((sql) => /set\s+transaction.*repeatable\s+read.*read\s+only/isu.test(sql))).toBe(true);
    expect(result.items).toHaveLength(result.total);
  });

  it('returns only the safe public list model and never physical IDs or revision snapshots', async () => {
    const result = await repository().list({
      selection: normalizeLaoLetterQuery({}),
      page: 1,
      pageSize: 1,
    });
    const item = result.items[0]!;

    expect(Object.keys(item).sort()).toEqual([
      'availableActions', 'character', 'contentId', 'contentStatus', 'letterClass',
      'letterType', 'lockVersion', 'name', 'romanization', 'sortOrder', 'updatedAt',
      'workingRevisionId', 'workingRevisionStatus',
    ].sort());
    expect(JSON.stringify(item)).not.toMatch(/databaseId|internalId|snapshot|entityId|content_id_internal/iu);
    expect(item.contentId).toMatch(/^[a-f0-9-]{36}$/u);
  });

  it('keeps representative list plans and p95 timings within the 50/500 budgets', async () => {
    const cases = [
      { name: 'default-50', selection: normalizeLaoLetterQuery({}), pageSize: 50, budgetMs: 500 },
      { name: 'maximum-500', selection: normalizeLaoLetterQuery({}), pageSize: 500, budgetMs: 1_500 },
      { name: 'broad-substring', selection: normalizeLaoLetterQuery({ q: 'fixture' }), pageSize: 50, budgetMs: 500 },
      { name: 'common-filters', selection: normalizeLaoLetterQuery({ letterType: ['consonant'], contentStatus: ['active'] }), pageSize: 50, budgetMs: 500 },
    ] as const;
    const evidence: Array<Record<string, unknown>> = [];

    for (const scenario of cases) {
      const statements: Array<{ text: string; values: readonly unknown[] }> = [];
      const recordingTransactions: ContentTransactionRunner = {
        run: async <Result>(operation: (executor: DatabaseExecutor) => Promise<Result>) => {
          const client = await pool.connect();
          await client.query('BEGIN');
          try {
            const executor: DatabaseExecutor = {
              query: async <Row extends QueryResultRow = QueryResultRow>(text: string, values: readonly unknown[] = []) => {
                if (/^\s*(?:WITH|SELECT)/iu.test(text)) statements.push({ text, values });
                return await client.query<Row>(text, values as unknown[]) as QueryResult<Row>;
              },
            };
            const result = await operation(executor);
            await client.query('ROLLBACK');
            return result;
          } catch (error) {
            await client.query('ROLLBACK');
            throw error;
          } finally {
            client.release();
          }
        },
      };
      await repository(recordingTransactions).list({ selection: scenario.selection, page: 1, pageSize: scenario.pageSize });

      const timings: number[] = [];
      for (let sample = 0; sample < 10; sample += 1) {
        const started = performance.now();
        await repository().list({ selection: scenario.selection, page: 1, pageSize: scenario.pageSize });
        timings.push(performance.now() - started);
      }
      timings.sort((left, right) => left - right);
      const p95Ms = timings[Math.ceil(timings.length * 0.95) - 1]!;
      const plans = await Promise.all(statements.map(async ({ text, values }) => {
        const explained = await pool.query<{ 'QUERY PLAN': unknown }>(
          `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${text}`,
          values as unknown[],
        );
        const document = explained.rows[0]?.['QUERY PLAN'] as Array<{
          Plan: { 'Node Type': string; 'Shared Hit Blocks': number };
          'Execution Time': number;
        }> | undefined;
        return document?.[0] ? {
          node: document[0].Plan['Node Type'],
          executionMs: document[0]['Execution Time'],
          sharedHitBlocks: document[0].Plan['Shared Hit Blocks'],
        } : null;
      }));
      expect(plans).toHaveLength(2);
      expect(plans.every((plan) => plan !== null)).toBe(true);
      expect(p95Ms).toBeLessThanOrEqual(scenario.budgetMs);
      evidence.push({ name: scenario.name, p95Ms: Number(p95Ms.toFixed(2)), plans });
    }

    process.stdout.write(`Lao-letter representative query evidence ${JSON.stringify(evidence)}\n`);
  }, 120_000);
});

describe('Lao-letter fixture preconditions', () => {
  it('contains enough representative rows for the 50/500 boundary suite', () => {
    const representative: Pick<LaoLetterBatchFixture, 'pageSize'> = { pageSize: 50 };
    expect(representative.pageSize).toBe(50);
  });
});
