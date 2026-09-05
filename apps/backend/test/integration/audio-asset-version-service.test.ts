import crypto from 'node:crypto';
import pg from 'pg';
import pino from 'pino';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPgPool } from '../../src/database/pool.js';
import { TransactionManager } from '../../src/database/transaction-manager.js';
import { AudioAssetVersionService } from '../../src/modules/audio/application/audio-asset-version-service.js';
import { createTestDatabase, type TestDatabase } from '../support/test-database.js';

const adminUrl = process.env.ADMIN_DATABASE_URL;
const integration = adminUrl ? describe : describe.skip;
integration('AudioAssetVersionService PostgreSQL', () => {
  let database: TestDatabase; let pool: pg.Pool;
  beforeAll(async () => { database = await createTestDatabase(adminUrl!); pool = createPgPool({ url: database.url, poolMin: 0, poolMax: 4, connectionTimeoutMs: 2000, idleTimeoutMs: 2000 }, pino({ level: 'silent' })); }, 120000);
  afterAll(async () => { await pool?.end(); await database?.dispose(); });
  it('atomically records a TTS asset, completion state, and audit event', async () => {
    const slot = crypto.randomUUID(), task = crypto.randomUUID(), attempt = crypto.randomUUID();
    await pool.query(`INSERT INTO audio.audio_slots(id,source_domain,content_entity_type,content_entity_id,language_code,audio_role,required_content_revision_id,required_audio_input_hash) VALUES($1,'content','lo_letter',$2,'lo','pronunciation',$3,'h')`, [slot, crypto.randomUUID(), crypto.randomUUID()]);
    await pool.query(`INSERT INTO audio.audio_tasks(id,slot_id,production_method,status,content_revision_id,text_snapshot,audio_input_hash,tts_preset_key,created_by_operator_id,client_idempotency_key) VALUES($1,$2,'tts','producing',$3,'x','h','lo.default',$4,$5)`, [task, slot, crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()]);
    await pool.query(`INSERT INTO audio.audio_generation_attempts(id,task_id,attempt_no,request_id,status) VALUES($1,$2,1,$3,'processing')`, [attempt, task, crypto.randomUUID()]);
    const service = new AudioAssetVersionService(new TransactionManager(pool, pino({ level: 'silent' })));
    const input = { attemptId: attempt, assetId: crypto.randomUUID(), durationMs: 500, sampleRateHz: 24_000, channels: 1, requestId: 'asset-1' };
    const created = await service.registerTtsAsset(input); expect(created.replayed).toBe(false);
    await expect(service.registerTtsAsset(input)).resolves.toMatchObject({ id: created.id, replayed: true });
    expect((await pool.query(`SELECT review_status,version FROM audio.audio_asset_versions WHERE id=$1`, [created.id])).rows[0]).toMatchObject({ review_status: 'pending_review', version: 1 });
    expect((await pool.query(`SELECT status FROM audio.audio_tasks WHERE id=$1`, [task])).rows[0]).toMatchObject({ status: 'pending_review' });
    expect((await pool.query(`SELECT event_type FROM audio.audio_task_events WHERE task_id=$1`, [task])).rows[0]).toMatchObject({ event_type: 'asset_created' });
  });
});
