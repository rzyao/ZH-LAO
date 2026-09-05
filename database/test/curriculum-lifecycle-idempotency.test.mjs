import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const filename = '1370_curriculum_lifecycle_idempotency.sql';
const here = path.dirname(fileURLToPath(import.meta.url));

test('declares the ADR-032 forward curriculum lifecycle idempotency migration', async () => {
  const migration = path.resolve(here, '..', 'migrations', filename);
  await access(migration);
  const sql = await readFile(migration, 'utf8');
  assert.match(sql, /CREATE TABLE content\.curriculum_command_receipts/);
  assert.match(sql, /UNIQUE \(operator_id, aggregate_type, aggregate_id, command, idempotency_key\)/);
  assert.match(sql, /request_fingerprint/);
  assert.match(sql, /response_payload/);
});
