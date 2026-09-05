import { newLogicalUuid } from '../../../ids/uuid.js';
import { TransactionManager } from '../../../database/transaction-manager.js';

export type ReviewDecision = 'approved' | 'rejected' | 'approval_revoked';
export type RecordAudioReview = { assetVersionId: string; reviewerOperatorId: string; decision: ReviewDecision; rejectReason?: string; remark?: string; requestId: string };

export class AudioReviewService {
  constructor(private readonly transactions: TransactionManager) {}
  async record(input: RecordAudioReview): Promise<{ id: string; replayed: boolean }> {
    if (input.decision === 'rejected' !== Boolean(input.rejectReason)) throw new Error('AUDIO_REVIEW_REJECT_REASON_INVALID');
    if (input.decision === 'approval_revoked' && !input.remark) throw new Error('AUDIO_REVIEW_REVOKE_REMARK_REQUIRED');
    return this.transactions.run(async (tx) => {
      const prior = await tx.query<{ id: string }>(`SELECT id FROM audio.audio_reviews WHERE request_id=$1`, [input.requestId]);
      if (prior.rows[0]) return { id: prior.rows[0].id, replayed: true };
      const asset = await tx.query<{ task_id: string; review_status: string }>(`SELECT task_id,review_status FROM audio.audio_asset_versions WHERE id=$1 FOR UPDATE`, [input.assetVersionId]);
      if (!asset.rows[0]) throw new Error('AUDIO_ASSET_VERSION_NOT_FOUND');
      const lockedPrior = await tx.query<{ id: string }>(`SELECT id FROM audio.audio_reviews WHERE request_id=$1`, [input.requestId]);
      if (lockedPrior.rows[0]) return { id: lockedPrior.rows[0].id, replayed: true };
      const a = asset.rows[0];
      if (input.decision === 'approval_revoked' && a.review_status !== 'approved') throw new Error('AUDIO_REVIEW_NOT_APPROVED');
      if (input.decision !== 'approval_revoked' && a.review_status !== 'pending_review') throw new Error('AUDIO_REVIEW_NOT_PENDING');
      const reviewStatus = input.decision === 'approval_revoked' ? 'pending_review' : input.decision;
      const taskStatus = input.decision === 'approval_revoked' ? 'pending_review' : input.decision;
      const eventType = input.decision === 'approved' ? 'review_approved' : input.decision === 'rejected' ? 'review_rejected' : 'review_revoked';
      const id = newLogicalUuid();
      await tx.query(`INSERT INTO audio.audio_reviews(id,asset_version_id,reviewer_operator_id,decision,reject_reason,remark,request_id) VALUES($1,$2,$3,$4,$5,$6,$7)`, [id,input.assetVersionId,input.reviewerOperatorId,input.decision,input.rejectReason ?? null,input.remark ?? null,input.requestId]);
      await tx.query(`UPDATE audio.audio_asset_versions SET review_status=$2,updated_at=now() WHERE id=$1`, [input.assetVersionId,reviewStatus]);
      await tx.query(`UPDATE audio.audio_tasks SET status=$2,updated_at=now(),lock_version=lock_version+1 WHERE id=$1`, [a.task_id,taskStatus]);
      await tx.query(`INSERT INTO audio.audio_task_events(id,task_id,event_type,actor_type,actor_id,request_id,payload) VALUES($1,$2,$3,'operator',$4,$5,$6::jsonb)`, [newLogicalUuid(),a.task_id,eventType,input.reviewerOperatorId,`event-${input.requestId}`,JSON.stringify({assetVersionId:input.assetVersionId,reviewId:id})]);
      return { id, replayed: false };
    });
  }
}
