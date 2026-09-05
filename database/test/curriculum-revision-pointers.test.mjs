import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { access } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { quoteIdentifier, withClient } from '../scripts/db.mjs';
import { loadRequiredMigrations } from '../scripts/migration-files.mjs';
import { migrate } from '../scripts/migrate.mjs';

const targetMigration = '1350_curriculum_revision_pointers.sql';
const here = path.dirname(fileURLToPath(import.meta.url));
const migrationPath = path.resolve(here, '..', 'migrations', targetMigration);
const adminUrl = process.env.ADMIN_DATABASE_URL;

const databaseUrl = (name) => {
  const url = new URL(adminUrl);
  url.pathname = `/${name}`;
  return url.toString();
};

async function withDisposableDatabase(label, operation) {
  const name = `zh_lao_curriculum_pointers_${label}_${randomUUID().replaceAll('-', '').slice(0, 10)}`;
  await withClient(adminUrl, (client) => client.query(
    `CREATE DATABASE ${quoteIdentifier(name)} TEMPLATE template0`,
  ));
  try {
    return await operation(databaseUrl(name));
  } finally {
    await withClient(adminUrl, (client) => client.query(
      `DROP DATABASE ${quoteIdentifier(name)} WITH (FORCE)`,
    ));
  }
}

async function applyBeforeTarget(connectionString) {
  const migrations = (await loadRequiredMigrations())
    .filter(({ filename }) => filename < targetMigration);
  await withClient(connectionString, async (client) => {
    await client.query(`CREATE TABLE public.v2_schema_migrations (
      filename text PRIMARY KEY,
      sha256 char(64) NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    for (const migration of migrations) {
      await client.query('BEGIN');
      try {
        await client.query(migration.sql);
        await client.query(
          'INSERT INTO public.v2_schema_migrations(filename, sha256) VALUES ($1, $2)',
          [migration.filename, migration.sha256],
        );
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  });
}

async function assertPointerContract(connectionString) {
  await withClient(connectionString, async (client) => {
    const columns = await client.query(`
      SELECT table_name, column_name, udt_name, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'content'
        AND table_name IN ('courses', 'lessons')
        AND column_name IN ('published_revision_id', 'working_revision_id')
      ORDER BY table_name, column_name
    `);
    assert.deepEqual(columns.rows, [
      { table_name: 'courses', column_name: 'published_revision_id', udt_name: 'int8', is_nullable: 'YES' },
      { table_name: 'courses', column_name: 'working_revision_id', udt_name: 'int8', is_nullable: 'YES' },
      { table_name: 'lessons', column_name: 'published_revision_id', udt_name: 'int8', is_nullable: 'YES' },
      { table_name: 'lessons', column_name: 'working_revision_id', udt_name: 'int8', is_nullable: 'YES' },
    ]);

    const foreignKeys = await client.query(`
      SELECT src.relname AS source_table, src_col.attname AS source_column,
             dst_ns.nspname AS target_schema, dst.relname AS target_table,
             dst_col.attname AS target_column, con.confdeltype AS delete_action
      FROM pg_constraint con
      JOIN pg_class src ON src.oid = con.conrelid
      JOIN pg_namespace src_ns ON src_ns.oid = src.relnamespace
      JOIN pg_class dst ON dst.oid = con.confrelid
      JOIN pg_namespace dst_ns ON dst_ns.oid = dst.relnamespace
      JOIN pg_attribute src_col ON src_col.attrelid = src.oid AND src_col.attnum = con.conkey[1]
      JOIN pg_attribute dst_col ON dst_col.attrelid = dst.oid AND dst_col.attnum = con.confkey[1]
      WHERE con.contype = 'f' AND src_ns.nspname = 'content'
        AND src.relname IN ('courses', 'lessons')
        AND src_col.attname IN ('published_revision_id', 'working_revision_id')
      ORDER BY src.relname, src_col.attname
    `);
    assert.deepEqual(foreignKeys.rows, [
      { source_table: 'courses', source_column: 'published_revision_id', target_schema: 'content', target_table: 'content_revisions', target_column: 'id', delete_action: 'r' },
      { source_table: 'courses', source_column: 'working_revision_id', target_schema: 'content', target_table: 'content_revisions', target_column: 'id', delete_action: 'r' },
      { source_table: 'lessons', source_column: 'published_revision_id', target_schema: 'content', target_table: 'content_revisions', target_column: 'id', delete_action: 'r' },
      { source_table: 'lessons', source_column: 'working_revision_id', target_schema: 'content', target_table: 'content_revisions', target_column: 'id', delete_action: 'r' },
    ]);
  });
}

test('declares the ADR-029 forward curriculum pointer migration', async () => {
  await access(migrationPath);
});

test('upgrades legacy empty curriculum rows, enforces pointer FKs, and remains idempotent', {
  skip: !adminUrl,
  timeout: 120_000,
}, async () => {
  await withDisposableDatabase('upgrade', async (connectionString) => {
    await applyBeforeTarget(connectionString);
    await withClient(connectionString, async (client) => {
      await client.query(`
        INSERT INTO content.courses(public_id, learning_language, title)
        VALUES ($1, 'zh', 'Legacy course')
      `, [randomUUID()]);
    });

    const upgraded = await migrate(connectionString);
    assert.deepEqual(upgraded.executed, [
      targetMigration,
      '1360_admin_credentials_password_change_required.sql',
      '1370_curriculum_lifecycle_idempotency.sql',
    ]);
    await assertPointerContract(connectionString);

    await withClient(connectionString, async (client) => {
      const legacy = await client.query(`
        SELECT published_revision_id, working_revision_id
        FROM content.courses WHERE title = 'Legacy course'
      `);
      assert.deepEqual(legacy.rows, [{ published_revision_id: null, working_revision_id: null }]);
      await assert.rejects(
        client.query('UPDATE content.courses SET published_revision_id = 999999 WHERE title = $1', ['Legacy course']),
      );
    });

    const repeated = await migrate(connectionString);
    assert.deepEqual(repeated.executed, []);
    assert.ok(repeated.skipped.includes(targetMigration));
  });
});
