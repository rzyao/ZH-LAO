import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { access } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { quoteIdentifier, withClient } from '../scripts/db.mjs';
import { loadRequiredMigrations } from '../scripts/migration-files.mjs';
import { migrate } from '../scripts/migrate.mjs';

const targetMigration = '1340_content_letter_batch_tasks.sql';
const here = path.dirname(fileURLToPath(import.meta.url));
const migrationPath = path.resolve(here, '..', 'migrations', targetMigration);
const adminUrl = process.env.ADMIN_DATABASE_URL;

const databaseUrl = (name) => {
  const url = new URL(adminUrl);
  url.pathname = `/${name}`;
  return url.toString();
};

async function withDisposableDatabase(label, operation) {
  const name = `zh_lao_letter_batch_${label}_${randomUUID().replaceAll('-', '').slice(0, 10)}`;
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

async function applyThrough1330(connectionString) {
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

async function expectRejected(client, label, sql, values = []) {
  const savepoint = quoteIdentifier(`reject_${label}`);
  await client.query(`SAVEPOINT ${savepoint}`);
  try {
    await assert.rejects(client.query(sql, values), undefined, label);
  } finally {
    await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
    await client.query(`RELEASE SAVEPOINT ${savepoint}`);
  }
}

async function insertTask(client, overrides = {}) {
  const values = {
    publicId: randomUUID(),
    action: 'approve',
    selectionMode: 'explicit_ids',
    selectionQuery: null,
    selectionHash: 'a'.repeat(64),
    expectedCount: 1,
    targetCount: 1,
    reason: null,
    operatorId: randomUUID(),
    idempotencyKey: `fixture-${randomUUID()}`,
    status: 'queued',
    processedCount: 0,
    succeededCount: 0,
    failedCount: 0,
    skippedCount: 0,
    startedAt: null,
    completedAt: null,
    ...overrides,
  };
  return client.query(
    `INSERT INTO content.lo_letter_batch_tasks (
       public_id, action, selection_mode, selection_query, selection_hash,
       expected_count, target_count, reason, requested_by_operator_id,
       idempotency_key, status, processed_count, succeeded_count, failed_count,
       skipped_count, started_at, completed_at
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
     ) RETURNING id, status, processed_count`,
    [
      values.publicId,
      values.action,
      values.selectionMode,
      values.selectionQuery,
      values.selectionHash,
      values.expectedCount,
      values.targetCount,
      values.reason,
      values.operatorId,
      values.idempotencyKey,
      values.status,
      values.processedCount,
      values.succeededCount,
      values.failedCount,
      values.skippedCount,
      values.startedAt,
      values.completedAt,
    ],
  );
}

async function assertSchemaContract(connectionString) {
  await withClient(connectionString, async (client) => {
    const columns = await client.query(`
      SELECT table_name, column_name, data_type, udt_name, is_nullable, is_identity
      FROM information_schema.columns
      WHERE table_schema = 'content'
        AND table_name IN ('lo_letter_batch_tasks', 'lo_letter_batch_task_items')
      ORDER BY table_name, ordinal_position
    `);
    const byTable = Map.groupBy(columns.rows, (row) => row.table_name);
    assert.deepEqual(
      byTable.get('lo_letter_batch_tasks')?.map((row) =>
        `${row.column_name}:${row.udt_name}:${row.is_nullable}:${row.is_identity}`),
      [
        'id:int8:NO:YES', 'public_id:uuid:NO:NO', 'action:varchar:NO:NO',
        'selection_mode:varchar:NO:NO', 'selection_query:jsonb:YES:NO',
        'selection_hash:varchar:NO:NO', 'expected_count:int4:NO:NO',
        'target_count:int4:NO:NO', 'reason:text:YES:NO',
        'requested_by_operator_id:uuid:NO:NO', 'idempotency_key:varchar:NO:NO',
        'status:varchar:NO:NO', 'processed_count:int4:NO:NO',
        'succeeded_count:int4:NO:NO', 'failed_count:int4:NO:NO',
        'skipped_count:int4:NO:NO', 'last_error_code:varchar:YES:NO',
        'created_at:timestamptz:NO:NO', 'updated_at:timestamptz:NO:NO',
        'started_at:timestamptz:YES:NO', 'completed_at:timestamptz:YES:NO',
      ],
    );
    assert.deepEqual(
      byTable.get('lo_letter_batch_task_items')?.map((row) =>
        `${row.column_name}:${row.udt_name}:${row.is_nullable}:${row.is_identity}`),
      [
        'id:int8:NO:YES', 'task_id:int8:NO:NO', 'item_no:int4:NO:NO',
        'content_id:uuid:NO:NO', 'revision_id:uuid:YES:NO',
        'status:varchar:NO:NO', 'error_code:varchar:YES:NO',
        'error_message:text:YES:NO', 'retry_count:int4:NO:NO',
        'last_attempt_at:timestamptz:YES:NO', 'completed_at:timestamptz:YES:NO',
        'created_at:timestamptz:NO:NO', 'updated_at:timestamptz:NO:NO',
      ],
    );
    for (const table of ['lo_letter_batch_tasks', 'lo_letter_batch_task_items']) {
      const identity = byTable.get(table)?.find((row) => row.column_name === 'id');
      assert.deepEqual(
        { dataType: identity?.data_type, nullable: identity?.is_nullable, identity: identity?.is_identity },
        { dataType: 'bigint', nullable: 'NO', identity: 'YES' },
      );
    }
    const uuidColumns = columns.rows
      .filter((row) => row.udt_name === 'uuid')
      .map((row) => `${row.table_name}.${row.column_name}`)
      .sort();
    assert.deepEqual(uuidColumns, [
      'lo_letter_batch_task_items.content_id',
      'lo_letter_batch_task_items.revision_id',
      'lo_letter_batch_tasks.public_id',
      'lo_letter_batch_tasks.requested_by_operator_id',
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
        AND src.relname IN ('lo_letter_batch_tasks', 'lo_letter_batch_task_items')
    `);
    assert.deepEqual(foreignKeys.rows, [{
      source_table: 'lo_letter_batch_task_items',
      source_column: 'task_id',
      target_schema: 'content',
      target_table: 'lo_letter_batch_tasks',
      target_column: 'id',
      delete_action: 'r',
    }]);

    const indexes = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'content'
        AND tablename IN ('lo_letter_batch_tasks', 'lo_letter_batch_task_items')
    `);
    const indexDefinitions = new Map(indexes.rows.map((row) => [row.indexname, row.indexdef]));
    assert.match(indexDefinitions.get('idx_lo_letter_batch_tasks_queue') ?? '', /\(status, created_at\).*WHERE.*queued.*running/i);
    assert.match(indexDefinitions.get('idx_lo_letter_batch_tasks_owned_history') ?? '', /requested_by_operator_id, created_at DESC, id DESC/i);
    assert.match(indexDefinitions.get('idx_lo_letter_batch_task_items_status') ?? '', /task_id, status, item_no/i);
  });
}

test('declares the forward 1340 Lao-letter batch migration', async () => {
  await access(migrationPath);
});

test('clean migration creates the two-table contract and enforces its invariants', {
  skip: !adminUrl,
  timeout: 120_000,
}, async () => {
  await withDisposableDatabase('clean', async (connectionString) => {
    const first = await migrate(connectionString);
    assert.ok(first.executed.includes(targetMigration));
    await assertSchemaContract(connectionString);

    await withClient(connectionString, async (client) => {
      await client.query('BEGIN');
      try {
        const validTask = await insertTask(client);
        const taskId = validTask.rows[0].id;
        assert.deepEqual(
          {
            status: validTask.rows[0].status,
            processedCount: validTask.rows[0].processed_count,
          },
          { status: 'queued', processedCount: 0 },
        );
        const contentId = randomUUID();
        const validItem = await client.query(
          `INSERT INTO content.lo_letter_batch_task_items (task_id, item_no, content_id)
           VALUES ($1, 1, $2)
           RETURNING status, retry_count`,
          [taskId, contentId],
        );
        assert.deepEqual(validItem.rows[0], { status: 'queued', retry_count: 0 });

        await expectRejected(client, 'task public UUID is unique',
          `INSERT INTO content.lo_letter_batch_tasks (
             public_id, action, selection_mode, selection_hash, expected_count,
             target_count, requested_by_operator_id, idempotency_key
           ) SELECT public_id, action, selection_mode, selection_hash, expected_count,
                    target_count, $2, $3
               FROM content.lo_letter_batch_tasks WHERE id = $1`,
          [taskId, randomUUID(), randomUUID()]);
        await expectRejected(client, 'Operator idempotency key is unique',
          `INSERT INTO content.lo_letter_batch_tasks (
             public_id, action, selection_mode, selection_hash, expected_count,
             target_count, requested_by_operator_id, idempotency_key
           ) SELECT $2, action, selection_mode, selection_hash, expected_count,
                    target_count, requested_by_operator_id, idempotency_key
               FROM content.lo_letter_batch_tasks WHERE id = $1`,
          [taskId, randomUUID()]);

        await expectRejected(client, 'task action enum',
          `INSERT INTO content.lo_letter_batch_tasks (
             public_id, action, selection_mode, selection_hash, expected_count,
             target_count, requested_by_operator_id, idempotency_key
           ) VALUES ($1, 'delete', 'explicit_ids', $2, 1, 1, $3, $4)`,
          [randomUUID(), 'a'.repeat(64), randomUUID(), randomUUID()]);
        await expectRejected(client, 'query_all requires an object query',
          `INSERT INTO content.lo_letter_batch_tasks (
             public_id, action, selection_mode, selection_hash, expected_count,
             target_count, requested_by_operator_id, idempotency_key
           ) VALUES ($1, 'approve', 'query_all', $2, 1, 1, $3, $4)`,
          [randomUUID(), 'a'.repeat(64), randomUUID(), randomUUID()]);
        await expectRejected(client, 'selection hash is lowercase SHA-256',
          `INSERT INTO content.lo_letter_batch_tasks (
             public_id, action, selection_mode, selection_hash, expected_count,
             target_count, requested_by_operator_id, idempotency_key
           ) VALUES ($1, 'approve', 'explicit_ids', $2, 1, 1, $3, $4)`,
          [randomUUID(), 'A'.repeat(64), randomUUID(), randomUUID()]);
        await expectRejected(client, 'expected and frozen target counts agree',
          `INSERT INTO content.lo_letter_batch_tasks (
             public_id, action, selection_mode, selection_hash, expected_count,
             target_count, requested_by_operator_id, idempotency_key
           ) VALUES ($1, 'approve', 'explicit_ids', $2, 2, 1, $3, $4)`,
          [randomUUID(), 'a'.repeat(64), randomUUID(), randomUUID()]);
        await expectRejected(client, 'reject requires a trimmed reason',
          `INSERT INTO content.lo_letter_batch_tasks (
             public_id, action, selection_mode, selection_hash, expected_count,
             target_count, reason, requested_by_operator_id, idempotency_key
           ) VALUES ($1, 'reject', 'explicit_ids', $2, 1, 1, '  ', $3, $4)`,
          [randomUUID(), 'a'.repeat(64), randomUUID(), randomUUID()]);
        await expectRejected(client, 'task counters sum to processed',
          `UPDATE content.lo_letter_batch_tasks SET processed_count = 1 WHERE id = $1`,
          [taskId]);
        await expectRejected(client, 'completed tasks process every target',
          `UPDATE content.lo_letter_batch_tasks
           SET status = 'completed', started_at = now(), completed_at = now()
           WHERE id = $1`,
          [taskId]);
        await expectRejected(client, 'item number remains positive',
          `INSERT INTO content.lo_letter_batch_task_items (task_id, item_no, content_id)
           VALUES ($1, 0, $2)`,
          [taskId, randomUUID()]);
        await expectRejected(client, 'task item number is unique',
          `INSERT INTO content.lo_letter_batch_task_items (task_id, item_no, content_id)
           VALUES ($1, 1, $2)`,
          [taskId, randomUUID()]);
        await expectRejected(client, 'task item content is unique',
          `INSERT INTO content.lo_letter_batch_task_items (task_id, item_no, content_id)
           SELECT task_id, 2, content_id FROM content.lo_letter_batch_task_items
           WHERE task_id = $1 AND item_no = 1`,
          [taskId]);
        await expectRejected(client, 'failed item requires safe error code',
          `INSERT INTO content.lo_letter_batch_task_items (
             task_id, item_no, content_id, status, last_attempt_at, completed_at
           ) VALUES ($1, 2, $2, 'failed', now(), now())`,
          [taskId, randomUUID()]);
        await expectRejected(client, 'item retry count remains non-negative',
          `INSERT INTO content.lo_letter_batch_task_items (
             task_id, item_no, content_id, retry_count
           ) VALUES ($1, 2, $2, -1)`,
          [taskId, randomUUID()]);
        await expectRejected(client, 'task deletion is restricted while items exist',
          'DELETE FROM content.lo_letter_batch_tasks WHERE id = $1',
          [taskId]);
      } finally {
        await client.query('ROLLBACK');
      }
    });
  });
});

test('1330 upgrade applies later forward migrations and a repeated migration is a no-op', {
  skip: !adminUrl,
  timeout: 120_000,
}, async () => {
  await withDisposableDatabase('upgrade', async (connectionString) => {
    await applyThrough1330(connectionString);
    const upgraded = await migrate(connectionString);
    assert.deepEqual(upgraded.executed, [
      targetMigration,
      '1350_curriculum_revision_pointers.sql',
      '1360_admin_credentials_password_change_required.sql',
      '1370_curriculum_lifecycle_idempotency.sql',
    ]);
    await assertSchemaContract(connectionString);

    const repeated = await migrate(connectionString);
    assert.deepEqual(repeated.executed, []);
    assert.ok(repeated.skipped.includes(targetMigration));
    const ledger = await withClient(connectionString, (client) => client.query(
      'SELECT count(*)::integer AS count FROM public.v2_schema_migrations WHERE filename = $1',
      [targetMigration],
    ));
    assert.equal(ledger.rows[0].count, 1);
  });
});
