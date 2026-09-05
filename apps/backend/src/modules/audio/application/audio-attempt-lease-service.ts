import { TransactionManager } from '../../../database/transaction-manager.js';

export type LeasedAudioAttempt = {
  attemptId: string;
  taskId: string;
  requestId: string;
  ttsPresetKey: string;
  textSnapshot: string;
  pronunciationSnapshot: unknown;
};

/** Database-backed worker lease boundary; it deliberately owns no provider credentials. */
export class AudioAttemptLeaseService {
  constructor(private readonly transactions: TransactionManager) {}

  async claimReady(limit: number, leaseMs: number): Promise<LeasedAudioAttempt[]> {
    if (!Number.isInteger(limit) || limit < 1) throw new Error('AUDIO_ATTEMPT_INVALID_BATCH_SIZE');
    if (!Number.isInteger(leaseMs) || leaseMs < 1) throw new Error('AUDIO_ATTEMPT_INVALID_LEASE_DURATION');
    return this.transactions.run(async (tx) => {
      const result = await tx.query<{
        id: string;
        task_id: string;
        request_id: string;
        tts_preset_key: string;
        text_snapshot: string;
        pronunciation_snapshot: unknown;
      }>(
        `WITH candidates AS (
           SELECT a.id
           FROM audio.audio_generation_attempts a
           WHERE (a.status = 'queued')
              OR (a.status = 'retry_wait' AND a.next_retry_at <= now())
              OR (a.status IN ('submitting', 'processing') AND a.lease_until <= now())
           ORDER BY a.created_at, a.id
           FOR UPDATE SKIP LOCKED
           LIMIT $1
         )
         UPDATE audio.audio_generation_attempts a
         SET status = 'submitting', lease_until = now() + ($2 * interval '1 millisecond'), next_retry_at = NULL
         FROM candidates c, audio.audio_tasks t
         WHERE a.id = c.id AND t.id = a.task_id
         RETURNING a.id, a.task_id, a.request_id, t.tts_preset_key, t.text_snapshot, t.pronunciation_snapshot`,
        [limit, leaseMs]
      );
      return result.rows.map((row) => ({
        attemptId: row.id,
        taskId: row.task_id,
        requestId: row.request_id,
        ttsPresetKey: row.tts_preset_key,
        textSnapshot: row.text_snapshot,
        pronunciationSnapshot: row.pronunciation_snapshot
      }));
    });
  }

  async markProcessing(attemptId: string, externalJobId: string, leaseMs: number): Promise<boolean> {
    const rows = await this.transactions.run(async (tx) => tx.query<{ id: string }>(
      `UPDATE audio.audio_generation_attempts
       SET status = 'processing', external_job_id = $2, submitted_at = COALESCE(submitted_at, now()),
           lease_until = now() + ($3 * interval '1 millisecond')
       WHERE id = $1 AND status = 'submitting'
       RETURNING id`,
      [attemptId, externalJobId, leaseMs]
    ));
    return Boolean(rows.rows[0]);
  }
}
