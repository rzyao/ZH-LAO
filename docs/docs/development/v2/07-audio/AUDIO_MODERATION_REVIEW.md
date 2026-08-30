---
status: blocked-design-candidate
last_updated: 2026-08-31
---

# Audio Moderation & Review

## Review lifecycle

Every candidate audio result has a current moderation projection and immutable transition history. Required concepts are `moderation_status`, `rejection_reason`, review queue membership and admin review entrypoints.

Allowed business outcomes include pending review, approved, rejected and revocation where the physical model supports it. Invalid transitions are rejected rather than coerced. Rejection reason is mandatory for rejection; actor identity and request ID are mandatory for operator-driven actions.

## Immutable history

The target `audio_review_events` contract records actor type/id, from status, to status, reason/remark, request ID and timestamp. Existing frozen `audio_reviews` already provides append-only review facts and `audio_task_events` provides task audit; mapping/replacement is part of AUDIO-DESIGN-B01.

## Escalation

- copyright/DMCA concern -> documented legal/DMCA path;
- privacy/security incident -> security/support escalation path;
- abuse or policy-sensitive content -> Trust & Safety handoff where the subject contract applies;
- ordinary pronunciation/quality defects -> Audio review queue.

Do not create phase-specific external ticket systems or duplicate moderation queues.

## Publish rule

Only a candidate satisfying the approved review state and source/hash invariants may become the current public pointer. Re-review must never rewrite immutable historical review facts.