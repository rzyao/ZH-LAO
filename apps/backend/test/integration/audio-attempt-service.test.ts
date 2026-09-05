import crypto from 'node:crypto';
import pg from 'pg';
import pino from 'pino';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPgPool } from '../../src/database/pool.js';
import { TransactionManager } from '../../src/database/transaction-manager.js';
import { AudioAttemptService } from '../../src/modules/audio/application/audio-attempt-service.js';
import { createTestDatabase, type TestDatabase } from '../support/test-database.js';

const adminUrl = process.env.ADMIN_DATABASE_URL;
const integration = adminUrl ? describe : describe.skip;

integration('AudioAttemptService PostgreSQL', () => {
  let database: TestDatabase;
  let pool: pg.Pool;

  beforeAll(async () => {
    database = await createTestDatabase(adminUrl!);
    pool = createPgPool({ url: database.url, poolMin: 0, poolMax: 4, connectionTimeoutMs: 2000, idleTimeoutMs: 2000 }, pino({ level: 'silent' }));
  }, 120000);
  afterAll(async () => { await pool?.end(); await database?.dispose(); });

  async function createTtsTask(): Promise<string> {
    const slotId = crypto.randomUUID();
    const taskId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO audio.audio_slots(id, source_domain, content_entity_type, content_entity_id, language_code, audio_role, required_content_revision_id, required_audio_input_hash)
       VALUES($1, 'content', 'lo_letter', $2, 'lo', 'pronunciation', $3, 'hash')`,
      [slotId, crypto.randomUUID(), crypto.randomUUID()]
    );
    await pool.query(
      `INSERT INTO audio.audio_tasks(id, slot_id, production_method, status, content_revision_id, text_snapshot, audio_input_hash, tts_preset_key, created_by_operator_id, client_idempotency_key)
       VALUES($1, $2, 'tts', 'pending_assignment', $3, 'ກ', 'hash', 'lo.default', $4, $5)`,
      [taskId, slotId, crypto.randomUUID(), crypto.randomUUID(), `task-${crypto.randomUUID()}`]
    );
    return taskId;
  }

  it('replays request ids, increments attempts under a task lock, and records terminal retry state', async () => {
    const service = new AudioAttemptService(
      { query: (text, values) => pool.query(text, values as unknown[]) },
      new TransactionManager(pool, pino({ level: 'silent' }))
    );
    const taskId = await createTtsTask();
    const first = await service.startAttempt(taskId, 'request-1');
    expect(first.attemptNo).toBe(1);
    await expect(service.startAttempt(taskId, 'request-1')).resolves.toEqual(first);

    await service.markRetryWait(first.id, 'temporary transport failure', new Date(Date.now() + 60_000));
    const second = await service.startAttempt(taskId, 'request-2');
    expect(second.attemptNo).toBe(2);
    await service.deadLetter(second.id, 'provider permanently rejected request');

    const rows = await pool.query<{ attempt_no: number; status: string; transport_retry_count: number }>(
      `SELECT attempt_no, status, transport_retry_count FROM audio.audio_generation_attempts WHERE task_id = $1 ORDER BY attempt_no`,
      [taskId]
    );
    expect(rows.rows).toEqual([
      { attempt_no: 1, status: 'retry_wait', transport_retry_count: 1 },
      { attempt_no: 2, status: 'dead_letter', transport_retry_count: 0 }
    ]);
  });
});
