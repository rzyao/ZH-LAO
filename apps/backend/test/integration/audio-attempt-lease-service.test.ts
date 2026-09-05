import crypto from 'node:crypto';
import pg from 'pg';
import pino from 'pino';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPgPool } from '../../src/database/pool.js';
import { TransactionManager } from '../../src/database/transaction-manager.js';
import { AudioAttemptLeaseService } from '../../src/modules/audio/application/audio-attempt-lease-service.js';
import { createTestDatabase, type TestDatabase } from '../support/test-database.js';

const adminUrl = process.env.ADMIN_DATABASE_URL;
const integration = adminUrl ? describe : describe.skip;

integration('AudioAttemptLeaseService PostgreSQL', () => {
  let database: TestDatabase;
  let pool: pg.Pool;
  beforeAll(async () => {
    database = await createTestDatabase(adminUrl!);
    pool = createPgPool({ url: database.url, poolMin: 0, poolMax: 4, connectionTimeoutMs: 2000, idleTimeoutMs: 2000 }, pino({ level: 'silent' }));
  }, 120000);
  afterAll(async () => { await pool?.end(); await database?.dispose(); });

  async function seedAttempt(status = 'queued'): Promise<string> {
    const slotId = crypto.randomUUID(), taskId = crypto.randomUUID(), attemptId = crypto.randomUUID();
    await pool.query(`INSERT INTO audio.audio_slots(id,source_domain,content_entity_type,content_entity_id,language_code,audio_role,required_content_revision_id,required_audio_input_hash) VALUES($1,'content','lo_letter',$2,'lo','pronunciation',$3,'hash')`, [slotId, crypto.randomUUID(), crypto.randomUUID()]);
    await pool.query(`INSERT INTO audio.audio_tasks(id,slot_id,production_method,status,content_revision_id,text_snapshot,audio_input_hash,tts_preset_key,created_by_operator_id,client_idempotency_key) VALUES($1,$2,'tts','producing',$3,'ກ','hash','lo.default',$4,$5)`, [taskId, slotId, crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()]);
    await pool.query(`INSERT INTO audio.audio_generation_attempts(id,task_id,attempt_no,request_id,status,next_retry_at,lease_until) VALUES($1,$2,1,$3,$4::varchar,CASE WHEN $4::varchar='retry_wait' THEN now()-interval '1 second' END,CASE WHEN $4::varchar='processing' THEN now()-interval '1 second' END)`, [attemptId, taskId, crypto.randomUUID(), status]);
    return attemptId;
  }

  it('claims ready work exactly once, reclaims expired leases, and records the external job', async () => {
    const service = new AudioAttemptLeaseService(new TransactionManager(pool, pino({ level: 'silent' })));
    const firstId = await seedAttempt();
    const first = await service.claimReady(10, 60_000);
    expect(first.map((item) => item.attemptId)).toEqual([firstId]);
    await expect(service.claimReady(10, 60_000)).resolves.toEqual([]);
    expect(await service.markProcessing(firstId, 'provider-job-1', 60_000)).toBe(true);
    expect(await service.markProcessing(firstId, 'provider-job-2', 60_000)).toBe(false);

    const expiredId = await seedAttempt('processing');
    const reclaimed = await service.claimReady(10, 60_000);
    expect(reclaimed.map((item) => item.attemptId)).toContain(expiredId);
  });
});
