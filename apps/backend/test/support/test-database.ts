import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import pg from 'pg';

const execFileAsync = promisify(execFile);
const { Client } = pg;

function quoteIdentifier(value: string): string { return `"${value.replaceAll('"', '""')}"`; }
export type TestDatabase = { name: string; url: string; dispose(): Promise<void> };

export async function createTestDatabase(adminUrl: string): Promise<TestDatabase> {
  const name = `zh_lao_fnd_${Date.now()}_${randomUUID().replaceAll('-', '').slice(0, 8)}`;
  const admin = new Client({ connectionString: adminUrl });
  await admin.connect();
  try { await admin.query(`CREATE DATABASE ${quoteIdentifier(name)} TEMPLATE template0`); } finally { await admin.end(); }
  const url = new URL(adminUrl); url.pathname = `/${name}`;
  const databaseUrl = url.toString();
  const migrationScript = path.resolve(import.meta.dirname, '../../../../database/v2/scripts/migrate.mjs');
  try {
    await execFileAsync(process.execPath, [migrationScript], { env: { ...process.env, DATABASE_URL: databaseUrl } });
  } catch (error) {
    if (process.env.KEEP_TEST_DATABASE !== '1') {
      const cleanup = new Client({ connectionString: adminUrl }); await cleanup.connect();
      try { await cleanup.query(`DROP DATABASE ${quoteIdentifier(name)} WITH (FORCE)`); } finally { await cleanup.end(); }
    }
    throw new Error(`Failed to migrate integration database ${name}`, { cause: error });
  }
  return { name, url: databaseUrl, async dispose() {
    if (process.env.KEEP_TEST_DATABASE === '1') return;
    const cleanup = new Client({ connectionString: adminUrl }); await cleanup.connect();
    try {
      await cleanup.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=$1 AND pid <> pg_backend_pid()', [name]);
      await cleanup.query(`DROP DATABASE ${quoteIdentifier(name)}`);
    } finally { await cleanup.end(); }
  } };
}
