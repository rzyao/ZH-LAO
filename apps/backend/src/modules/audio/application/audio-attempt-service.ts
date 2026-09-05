import { newLogicalUuid } from '../../../ids/uuid.js';
import type { DatabaseExecutor } from '../../../database/executor.js';
import { TransactionManager } from '../../../database/transaction-manager.js';

export type AudioAttempt = { id: string; attemptNo: number };

export class AudioAttemptService {
  constructor(private readonly db: DatabaseExecutor, private readonly transactions: TransactionManager) {}

  async startAttempt(taskId: string, requestId: string): Promise<AudioAttempt> {
    return this.transactions.run(async (tx) => {
      const replay = await tx.query<{ id: string; attempt_no: number }>(
        `SELECT id, attempt_no FROM audio.audio_generation_attempts WHERE request_id = $1`,
        [requestId]
      );
      if (replay.rows[0]) return { id: replay.rows[0].id, attemptNo: replay.rows[0].attempt_no };

      // Locking the task serializes both request-id replays and attempt allocation.
      const task = await tx.query<{ id: string; production_method: string; status: string }>(
        `SELECT id, production_method, status FROM audio.audio_tasks WHERE id = $1 FOR UPDATE`, [taskId]
      );
      if (!task.rows[0] || task.rows[0].production_method !== 'tts' || !['pending_assignment', 'assigned', 'production_failed', 'producing'].includes(task.rows[0].status)) throw new Error('AUDIO_TASK_NOT_TTS_STARTABLE');
      const lockedReplay = await tx.query<{ id: string; attempt_no: number }>(
        `SELECT id, attempt_no FROM audio.audio_generation_attempts WHERE request_id = $1`, [requestId]
      );
      if (lockedReplay.rows[0]) return { id: lockedReplay.rows[0].id, attemptNo: lockedReplay.rows[0].attempt_no };
      await tx.query(`UPDATE audio.audio_tasks SET status='producing',started_at=COALESCE(started_at,now()),updated_at=now(),lock_version=lock_version+1 WHERE id=$1`, [taskId]);

      const next = await tx.query<{ attempt_no: number }>(
        `SELECT COALESCE(MAX(attempt_no), 0) + 1 AS attempt_no
         FROM audio.audio_generation_attempts WHERE task_id = $1`,
        [taskId]
      );
      const id = newLogicalUuid();
      const attemptNo = Number(next.rows[0]!.attempt_no);
      await tx.query(
        `INSERT INTO audio.audio_generation_attempts(id, task_id, attempt_no, request_id, status, transport_retry_count)
         VALUES($1, $2, $3, $4, 'queued', 0)`,
        [id, taskId, attemptNo, requestId]
      );
      return { id, attemptNo };
    });
  }
  async markRetryWait(attemptId: string, reason: string, nextRetryAt: Date): Promise<void> {
    await this.db.query(
      `UPDATE audio.audio_generation_attempts
       SET status = 'retry_wait', transport_retry_count = transport_retry_count + 1, failure_message = $2,
           next_retry_at = $3, lease_until = NULL
       WHERE id = $1 AND status IN ('queued', 'submitting', 'processing')`,
      [attemptId, reason, nextRetryAt]
    );
  }

  async deadLetter(attemptId: string, reason: string): Promise<void> {
    await this.db.query(
      `UPDATE audio.audio_generation_attempts
       SET status = 'dead_letter', failure_message = $2, completed_at = now(), lease_until = NULL
       WHERE id = $1`,
      [attemptId, reason]
    );
  }
}
