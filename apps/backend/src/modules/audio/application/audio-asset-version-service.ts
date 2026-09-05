import { newLogicalUuid } from '../../../ids/uuid.js';
import { TransactionManager } from '../../../database/transaction-manager.js';

export type RegisterTtsAsset = {
  attemptId: string;
  assetId: string;
  durationMs: number;
  sampleRateHz?: number;
  channels?: number;
  requestId: string;
};

export class AudioAssetVersionService {
  constructor(private readonly transactions: TransactionManager) {}

  async registerTtsAsset(input: RegisterTtsAsset): Promise<{ id: string; replayed: boolean }> {
    if (!Number.isInteger(input.durationMs) || input.durationMs < 1) throw new Error('AUDIO_ASSET_INVALID_DURATION');
    return this.transactions.run(async (tx) => {
      const replay = await tx.query<{ id: string }>(
        `SELECT id FROM audio.audio_asset_versions WHERE generation_attempt_id = $1`, [input.attemptId]
      );
      if (replay.rows[0]) return { id: replay.rows[0].id, replayed: true };
      const source = await tx.query<{ task_id: string; slot_id: string; content_revision_id: string; audio_input_hash: string }>(
        `SELECT a.task_id, t.slot_id, t.content_revision_id, t.audio_input_hash
         FROM audio.audio_generation_attempts a JOIN audio.audio_tasks t ON t.id = a.task_id
         WHERE a.id = $1 AND a.status IN ('submitting', 'processing') FOR UPDATE OF a, t`, [input.attemptId]
      );
      if (!source.rows[0]) throw new Error('AUDIO_ATTEMPT_NOT_ASSET_READY');
      const row = source.rows[0];
      await tx.query(`SELECT id FROM audio.audio_slots WHERE id = $1 FOR UPDATE`, [row.slot_id]);
      const version = await tx.query<{ version: number }>(
        `SELECT COALESCE(MAX(version), 0) + 1 AS version FROM audio.audio_asset_versions WHERE slot_id = $1`, [row.slot_id]
      );
      const id = newLogicalUuid();
      await tx.query(
        `INSERT INTO audio.audio_asset_versions(id,slot_id,task_id,version,generation_attempt_id,content_revision_id,audio_input_hash,asset_id,duration_ms,sample_rate_hz,channels)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [id, row.slot_id, row.task_id, Number(version.rows[0]!.version), input.attemptId, row.content_revision_id, row.audio_input_hash, input.assetId, input.durationMs, input.sampleRateHz ?? null, input.channels ?? null]
      );
      await tx.query(`UPDATE audio.audio_generation_attempts SET status='succeeded', completed_at=now(), lease_until=NULL WHERE id=$1`, [input.attemptId]);
      await tx.query(`UPDATE audio.audio_tasks SET status='pending_review', completed_at=now(), updated_at=now(), lock_version=lock_version+1 WHERE id=$1`, [row.task_id]);
      await tx.query(
        `INSERT INTO audio.audio_task_events(id,task_id,event_type,actor_type,from_status,to_status,request_id,payload)
         VALUES($1,$2,'asset_created','tts','producing','pending_review',$3,$4::jsonb)`,
        [newLogicalUuid(), row.task_id, input.requestId, JSON.stringify({ assetVersionId: id, attemptId: input.attemptId })]
      );
      return { id, replayed: false };
    });
  }
}
