import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import path from 'node:path';
import pg from 'pg';
import { requiredMigrations } from '../../src/database/required-migrations.generated.js';
import type { DatabaseExecutor } from '../../src/database/executor.js';

const execFileAsync = promisify(execFile);
const { Client } = pg;

function quoteIdentifier(value: string): string { return `"${value.replaceAll('"', '""')}"`; }
export type TestDatabase = { name: string; url: string; dispose(): Promise<void> };
export type SeededTestDatabase<Fixture> = TestDatabase & { fixture: Fixture };

export async function createEmptyTestDatabase(adminUrl: string, label = 'empty'): Promise<TestDatabase> {
  const name = `zh_lao_fnd_${label}_${Date.now()}_${randomUUID().replaceAll('-', '').slice(0, 8)}`;
  const admin = new Client({ connectionString: adminUrl });
  await admin.connect();
  try { await admin.query(`CREATE DATABASE ${quoteIdentifier(name)} TEMPLATE template0`); } finally { await admin.end(); }
  const url = new URL(adminUrl); url.pathname = `/${name}`;
  const databaseUrl = url.toString();
  return { name, url: databaseUrl, async dispose() {
    if (process.env.KEEP_TEST_DATABASE === '1') return;
    const cleanup = new Client({ connectionString: adminUrl }); await cleanup.connect();
    try { await cleanup.query(`DROP DATABASE ${quoteIdentifier(name)} WITH (FORCE)`); } finally { await cleanup.end(); }
  } };
}

export async function createTestDatabase(adminUrl: string, label = 'complete'): Promise<TestDatabase> {
  const database = await createEmptyTestDatabase(adminUrl, label);
  const migrationScript = path.resolve(import.meta.dirname, '../../../../database/scripts/migrate.mjs');
  try {
    await execFileAsync(process.execPath, [migrationScript], { env: { ...process.env, DATABASE_URL: database.url } });
  } catch (error) {
    await database.dispose();
    throw new Error(`Failed to migrate integration database ${database.name}`, { cause: error });
  }
  return database;
}

/**
 * Creates a fully migrated database, seeds it through one short-lived client,
 * and disposes the database automatically when setup fails. The returned
 * database keeps the normal explicit dispose contract so each integration
 * suite remains in control of its own lifetime.
 */
export async function createSeededTestDatabase<Fixture>(
  adminUrl: string,
  label: string,
  seed: (database: DatabaseExecutor) => Promise<Fixture>,
): Promise<SeededTestDatabase<Fixture>> {
  const database = await createTestDatabase(adminUrl, label);
  const client = new Client({ connectionString: database.url });

  try {
    await client.connect();
    const fixture = await seed(client);
    return { ...database, fixture };
  } catch (error) {
    await database.dispose();
    throw new Error(`Failed to seed integration database ${database.name}`, { cause: error });
  } finally {
    await client.end().catch(() => undefined);
  }
}

export async function createPartialTestDatabase(adminUrl: string, migrationCount = 3): Promise<TestDatabase> {
  const database = await createEmptyTestDatabase(adminUrl, 'partial');
  const client = new Client({ connectionString: database.url });
  await client.connect();
  try {
    await client.query(`CREATE TABLE public.v2_schema_migrations (
      filename text PRIMARY KEY, sha256 char(64) NOT NULL, applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    for (const migration of requiredMigrations.slice(0, migrationCount)) {
      const sql = await readFile(path.resolve(import.meta.dirname, '../../../../database/migrations', migration.filename), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO public.v2_schema_migrations(filename, sha256) VALUES ($1, $2)', [migration.filename, migration.sha256]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } catch (error) {
    await client.end();
    await database.dispose();
    throw error;
  }
  await client.end();
  return database;
}
