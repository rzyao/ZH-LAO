---
status: frozen
phase: 7
phase_name: Audio Production Domain
document: AUDIO_API
design_only: true
implementation_started: false
last_updated: 2026-09-02
lifecycle: historical
---

# ZH-LAO  — Audio HTTP / Admin API Contract

> Paths are design contracts only. No route/backend/Admin implementation is created by this recovery task.

## 1. API Layers

```text
Runtime read      /api/v1/audio/**
Admin workbench   /api/v1/admin/audio/**
Internal worker   no public HTTP endpoint required for V1 polling
```

All IDs are UUID strings. Errors reuse Foundation envelope `{ code, message, details?, requestId? }`. Admin routes require Foundation/Identity authentication then Operations exact authorization.

## 2. Runtime

### GET `/api/v1/audio/official`

Query:

```text
entityType
entityId UUID
languageCode
role
revisionId? UUID
```

Semantics: resolve Content current/pinned published revision, resolve Slot official pointer, calculate freshness, and return only an available fresh descriptor.

200:

```json
{
  "status": "available",
  "slotId": "uuid",
  "assetVersionId": "uuid",
  "assetId": "uuid",
  "contentRevisionId": "uuid",
  "durationMs": 1234,
  "sampleRateHz": 48000,
  "channels": 1,
  "fresh": true
}
```

Typed unavailable result may be 404/409 according to global error mapping with stable code:

```text
AUDIO_SLOT_NOT_FOUND
AUDIO_OFFICIAL_NOT_FOUND
AUDIO_SLOT_OFFLINE
AUDIO_SOURCE_UNAVAILABLE
AUDIO_SOURCE_STALE
```

The endpoint does not expose bucket/object key/checksum/TTS provider details.

## 3. Admin Read APIs

All require `audio.tasks.read` unless a more specific mutation permission applies.

```text
GET /api/v1/admin/audio/tasks
GET /api/v1/admin/audio/tasks/:taskId
GET /api/v1/admin/audio/slots/:slotId
GET /api/v1/admin/audio/batches/:batchId
GET /api/v1/admin/audio/presets
```

Task list supports bounded pagination + filters:

```text
status, productionMethod, languageCode, audioRole,
assigneeOperatorId, contentEntityType, contentEntityId,
createdAfter, createdBefore
```

Search must be backed by existing indexed/logically bounded fields; V1 does not promise full-text search infrastructure.

## 4. Task Mutations

### POST `/api/v1/admin/audio/tasks`
Permission: `audio.tasks.manage`

Body conceptual:

```ts
{
  entityType: 'content'|'course'|'lesson'|'exercise'|'question';
  entityId: UUID;
  languageCode: 'zh'|'lo';
  audioRole: string;
  productionMethod: 'tts'|'human_recording';
  ttsPresetKey?: string;
  assigneeOperatorId?: UUID;
  idempotencyKey: string;
}
```

Server resolves current published Content revision and snapshots; client cannot submit authoritative text/hash/revision contents.

### POST `/api/v1/admin/audio/tasks/:taskId/assign`
Permission: `audio.tasks.manage`

Body: `{ assigneeOperatorId, expectedLockVersion, requestId }`.

### POST `/api/v1/admin/audio/tasks/:taskId/start`
Permission: `audio.tasks.produce`

Human recording start; body `{ expectedLockVersion, requestId }`.

### POST `/api/v1/admin/audio/tasks/:taskId/human-asset`
Permission: `audio.tasks.produce`

Body: stable `assetId`, technical audio attributes, expected lock version, requestId. Server validates Asset Infrastructure and producer identity.

### POST `/api/v1/admin/audio/tasks/:taskId/retry`
Permission: `audio.tasks.produce`

TTS `production_failed` -> next Attempt; body `{ expectedLockVersion, requestId }`.

### POST `/api/v1/admin/audio/tasks/:taskId/cancel`
Permission: `audio.tasks.manage`

Allowed only pre-asset states defined by production contract.

### POST `/api/v1/admin/audio/tasks/:taskId/successor`
Permission: `audio.tasks.manage`

Rejected predecessor only. Body may override productionMethod/preset/assignee but not text/revision/hash.

## 5. Review / Publish

### POST `/api/v1/admin/audio/asset-versions/:assetVersionId/reviews`
Permission: `audio.reviews.decide`

Body:

```ts
{
  decision: 'approved'|'rejected'|'approval_revoked';
  rejectReason?: 'pronunciation_error'|'speed_too_fast'|'speed_too_slow'|'noise'|'clipping'|'truncated'|'text_mismatch'|'other';
  remark?: string;
  requestId: string;
  expectedTaskLockVersion: number;
}
```

DB decision/reason checks remain authoritative.

### POST `/api/v1/admin/audio/asset-versions/:assetVersionId/publish`
Permission: `audio.publications.publish`

Body: `{ requestId, expectedTaskLockVersion }`. Server revalidates Content freshness immediately before the atomic publish transaction.

## 6. Slot Serviceability

```text
POST /api/v1/admin/audio/slots/:slotId/offline
POST /api/v1/admin/audio/slots/:slotId/activate
```

Permission: `audio.tasks.manage`.

These actions do not create `audio_task_events` because the frozen event table is Task lifecycle history; they do create Operations success audit.

## 7. Batch

### POST `/api/v1/admin/audio/batches`
Permission: `audio.batches.manage`

Input is a bounded Content selection request that the server resolves to an immutable ordered source snapshot before hashing/creation. The API may support known Content filters without persisting a dynamic query as canonical Batch state.

Required: `productionMethod`, optional TTS preset override, `idempotencyKey`.

### POST `/api/v1/admin/audio/batches/:batchId/cancel`
Permission: `audio.batches.manage`.

Only valid while `creating`; does not cancel already-created Tasks.

## 8. Presets

```text
PUT    /api/v1/admin/audio/presets/default
DELETE /api/v1/admin/audio/presets/default
```

Permission: `audio.presets.manage`.

Body dimensions exactly match frozen mapping schema. PUT validates preset key through TTS service before enabling mapping.

## 9. Operations Permission Requirements

Exact V1 requirement set:

```text
audio.tasks.read
audio.tasks.manage
audio.tasks.produce
audio.reviews.decide
audio.publications.publish
audio.presets.manage
audio.batches.manage
```

All keys satisfy Operations `<domain>.<plural_resource>.<action>` exact three-segment grammar; no wildcard. They are requirements only. Adding them to the Operations static catalog and reconciling `super_admin` is an Audio implementation entry task, not performed here.

## 10. Stable Error Codes

Minimum Audio-specific codes:

```text
AUDIO_SOURCE_NOT_FOUND
AUDIO_SOURCE_INVALID
AUDIO_SOURCE_STALE
AUDIO_SLOT_NOT_FOUND
AUDIO_SLOT_OFFLINE
AUDIO_ACTIVE_TASK_EXISTS
AUDIO_TASK_NOT_FOUND
AUDIO_TASK_INVALID_TRANSITION
AUDIO_TASK_VERSION_CONFLICT
AUDIO_IDEMPOTENCY_KEY_REUSED
AUDIO_PRESET_UNAVAILABLE
AUDIO_ATTEMPT_NOT_FOUND
AUDIO_ATTEMPT_NOT_RETRYABLE
AUDIO_ASSET_NOT_FOUND
AUDIO_ASSET_NOT_READY
AUDIO_ASSET_INVALID_AUDIO
AUDIO_ASSET_ALREADY_BOUND
AUDIO_REVIEW_INVALID
AUDIO_REVIEW_REQUEST_REUSED
AUDIO_PUBLISH_NOT_APPROVED
AUDIO_PUBLISH_CONFLICT
AUDIO_BATCH_NOT_FOUND
AUDIO_BATCH_IDEMPOTENCY_CONFLICT
```

HTTP status follows Foundation semantics: validation 400/422 as established, auth 401, RBAC 403, not-found 404, lifecycle/concurrency/idempotency 409, unavailable external dependency 503.

## 11. Cache / Security

- Admin mutation/read responses: `private,no-store` where state/security sensitive.
- Runtime official descriptor may use short application caching only after freshness semantics are preserved; no immutable CDN policy is invented by this domain contract.
- Signed storage URL generation belongs Asset delivery infrastructure, not Audio HTTP DTO.
- No raw production snapshot in ordinary logs; request IDs and safe logical IDs are sufficient observability context.
