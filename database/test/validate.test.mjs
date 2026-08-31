import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { validate } from '../scripts/validate.mjs';
import { quoteIdentifier, withClient } from '../scripts/db.mjs';

const adminUrl = process.env.ADMIN_DATABASE_URL;
const databaseUrl = (name) => { const url = new URL(adminUrl); url.pathname = `/${name}`; return url.toString(); };
const exists = (name) => withClient(adminUrl, async (client) => (await client.query('SELECT 1 FROM pg_database WHERE datname=$1', [name])).rowCount === 1);

test('validate drops its temporary database after successful validation', { skip: !adminUrl, timeout: 120_000 }, async () => {
  const result = await validate({ databaseUrl: null, adminDatabaseUrl: adminUrl, writeReport: false });
  assert.equal(result.status, 'PASS');
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
