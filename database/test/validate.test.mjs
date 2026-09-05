import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { validate } from '../scripts/validate.mjs';
import { quoteIdentifier, withClient } from '../scripts/db.mjs';

const adminUrl = process.env.ADMIN_DATABASE_URL;
const databaseUrl = (name) => { const url = new URL(adminUrl); url.pathname = `/${name}`; return url.toString(); };
const exists = (name) => withClient(adminUrl, async (client) => (await client.query('SELECT 1 FROM pg_database WHERE datname=$1', [name])).rowCount === 1);

// CR-001: correct derived table counts to the current 1330 repository baseline.
test('schema inventory registers 135 total, 133 business, and 40 Content tables', async () => {
  const expected = JSON.parse(await readFile(
    new URL('../checks/expected-schema.json', import.meta.url),
    'utf8',
  ));
  const total = Object.values(expected.schemas).reduce((count, tables) => count + tables.length, 0);
  const businessTotal = Object.entries(expected.schemas)
    .filter(([schema]) => schema !== 'infrastructure')
    .reduce((count, [, tables]) => count + tables.length, 0);
  assert.equal(total, 135);
  assert.equal(businessTotal, 133);
  assert.equal(expected.schemas.content.length, 40);
  assert.ok(expected.schemas.content.includes('lo_letter_batch_tasks'));
  assert.ok(expected.schemas.content.includes('lo_letter_batch_task_items'));
  assert.ok(expected.schemas.content.includes('curriculum_command_receipts'));
});

test('validate drops its temporary database after successful validation', { skip: !adminUrl, timeout: 120_000 }, async () => {
  const result = await validate({ databaseUrl: null, adminDatabaseUrl: adminUrl, writeReport: false });
  assert.equal(result.status, 'PASS');
  assert.ok(
    result.firstRun.executed.includes('1340_content_letter_batch_tasks.sql'),
    'clean validation must apply the Lao-letter batch migration',
  );
  assert.ok(
    result.secondRun.skipped.includes('1340_content_letter_batch_tasks.sql'),
    'validation must prove the Lao-letter batch migration is idempotently skipped',
  );
  assert.equal(await exists(result.databaseName), false);
});

test('validate drops its temporary database when validation fails', { skip: !adminUrl, timeout: 30_000 }, async () => {
  let createdName;
  await assert.rejects(validate({
    databaseUrl: null,
    adminDatabaseUrl: adminUrl,
    writeReport: false,
    operations: {
      migrate: async (connectionString) => {
        createdName = new URL(connectionString).pathname.slice(1);
        throw new Error('injected validation failure');
      },
    },
  }), /injected validation failure/);
  assert.ok(createdName);
  assert.equal(await exists(createdName), false);
});

test('validate never deletes an explicitly supplied database', { skip: !adminUrl, timeout: 120_000 }, async () => {
  const name = `zh_lao_v2_explicit_${randomUUID().replaceAll('-', '').slice(0, 10)}`;
  await withClient(adminUrl, (client) => client.query(`CREATE DATABASE ${quoteIdentifier(name)} TEMPLATE template0`));
  try {
    const result = await validate({ databaseUrl: databaseUrl(name), adminDatabaseUrl: adminUrl, writeReport: false });
    assert.equal(result.status, 'PASS');
    assert.equal(await exists(name), true);
  } finally {
    await withClient(adminUrl, (client) => client.query(`DROP DATABASE ${quoteIdentifier(name)} WITH (FORCE)`));
  }
});
