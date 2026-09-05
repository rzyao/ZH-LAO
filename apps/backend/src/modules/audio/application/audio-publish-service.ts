import { newLogicalUuid } from '../../../ids/uuid.js';
import { TransactionManager } from '../../../database/transaction-manager.js';

export class AudioPublishService {
  constructor(private readonly transactions: TransactionManager) {}
  async publish(assetVersionId: string, requestId: string): Promise<{ taskId: string; replayed: boolean }> {
    return this.transactions.run(async (tx) => {
      const replay = await tx.query<{ task_id: string }>(`SELECT task_id FROM audio.audio_task_events WHERE request_id=$1 AND event_type='published'`, [requestId]);
      if (replay.rows[0]) return { taskId: replay.rows[0].task_id, replayed: true };
      const asset = await tx.query<{ slot_id: string; task_id: string }>(`SELECT slot_id,task_id FROM audio.audio_asset_versions WHERE id=$1 AND review_status='approved' FOR UPDATE`, [assetVersionId]);
      if (!asset.rows[0]) throw new Error('AUDIO_ASSET_NOT_APPROVED');
      const a = asset.rows[0];
      const task = await tx.query<{ id: string }>(`SELECT id FROM audio.audio_tasks WHERE id=$1 AND status='approved' FOR UPDATE`, [a.task_id]);
      if (!task.rows[0]) throw new Error('AUDIO_TASK_NOT_APPROVED');
      await tx.query(`UPDATE audio.audio_asset_versions SET first_published_at=COALESCE(first_published_at,now()),updated_at=now() WHERE id=$1`, [assetVersionId]);
      await tx.query(`UPDATE audio.audio_slots SET official_asset_version_id=$2 WHERE id=$1`, [a.slot_id,assetVersionId]);
      await tx.query(`UPDATE audio.audio_tasks SET status='published',updated_at=now(),lock_version=lock_version+1 WHERE id=$1`, [a.task_id]);
      await tx.query(`INSERT INTO audio.audio_task_events(id,task_id,event_type,actor_type,request_id,payload) VALUES($1,$2,'published','system',$3,$4::jsonb)`, [newLogicalUuid(),a.task_id,requestId,JSON.stringify({assetVersionId})]);
      return { taskId: a.task_id, replayed: false };
    });
  }
}
