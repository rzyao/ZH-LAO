---
status: frozen
phase: 7
phase_name: Audio Production Domain
document: AUDIO_PRODUCTION_CONTRACTS
design_only: true
implementation_started: false
last_updated: 2026-08-31
---

# ZH-LAO V2 — Audio Production / Review / Publish Contracts

## 1. Task State Machine

### TTS creation

```text
CreateTtsTask
  -> validate Content + Slot requirement + preset
  -> Task(status=producing)
  -> Attempt #1(status=queued)
  -> task_created event
  -> production_started event
```

Both Task and first Attempt are created in one Audio transaction. `task_created` records `from_status=null,to_status=producing`; `production_started` records the production start fact. Duplicate client idempotency returns the canonical Task rather than creating another active Task.

### Human creation

```text
no assignee: pending_assignment
explicit valid assignee: assigned
pending_assignment -> assigned -> producing -> pending_review
```

### Common review/publication

```text
pending_review -> approved -> published
pending_review -> rejected
approved -> pending_review        (approval_revoked, pre-publication only)
```

### Failure / retry / cancel

```text
TTS producing -> production_failed
TTS production_failed -> producing   (new generation Attempt)

pending_assignment -> canceled
assigned           -> canceled
producing          -> canceled
production_failed  -> canceled
```

`rejected | published | canceled` are final. `approved` may only publish or revoke approval; it cannot be canceled.

## 2. Active Task Invariant

The frozen partial UNIQUE on Slot is the final guard for statuses:

```text
pending_assignment, assigned, producing,
pending_review, production_failed, approved
```

Application checks improve errors but are not the sole concurrency control. Any unique conflict maps to `AUDIO_ACTIVE_TASK_EXISTS` and re-resolves the current active Task.

## 3. Task Mutation Concurrency

All mutable Task commands accept `expectedLockVersion` except naturally idempotent worker reconciliation. Mutation transaction:

1. lock Task row `FOR UPDATE`;
2. compare `lock_version`;
3. validate current status/action;
4. write next status/timestamps and increment `lock_version`;
5. append required Task Event in the same transaction;
6. commit.

Stale version -> `AUDIO_TASK_VERSION_CONFLICT`.

## 4. TTS Attempt State Machine

```text
queued -> submitting
submitting -> processing
submitting -> retry_wait -> submitting      (transport retry, same Attempt)
processing -> succeeded
processing -> failed
queued|submitting|retry_wait|processing -> canceled
submitting|processing|retry_wait -> dead_letter
```

Definitions:

- `failed`: TTS service/provider has confirmed a terminal generation failure for this Attempt.
- `dead_letter`: the worker can no longer drive the Attempt safely after bounded transport/protocol recovery, including exhausted retry policy or ambiguous external state requiring operator intervention.
- `retry_wait`: same provider request identity will be retried; it is not a new generation Attempt.
- new Attempt is created only after the previous Attempt is terminal and Task is `production_failed`.

### Sequencing

Create new Attempt under Task row lock:

```text
attempt_no = max(existing attempt_no) + 1
```

`UNIQUE(task_id,attempt_no)` is final race protection. Each Attempt gets one stable `request_id`; HTTP/network retries reuse it. `external_job_id` is persisted once known and treated immutable by application policy.

## 5. Worker / Lease Contract

V1 reuses Foundation `Job` / `WorkerHost` / `pollingJob`; no Redis/Kafka/RabbitMQ.

Worker polling candidate:

```text
status in queued/retry_wait/submitting/processing
AND (next_retry_at IS NULL OR next_retry_at <= now)
AND (lease_until IS NULL OR lease_until < now)
```

Claim uses PostgreSQL row locking / `SKIP LOCKED` plus a bounded `lease_until`. A worker renews only its current lease and never assumes process memory is ownership authority. Crash recovery occurs after lease expiry.

Exact lease/retry durations are deployment policy, not frozen business facts; implementation must put them in typed server configuration with bounded safe defaults and tests, not in new Audio tables.

## 6. Polling Model

V1 chooses **polling**, not provider callback:

```text
queued
-> worker claims
-> submit TTS request(task snapshots + preset key + request_id)
-> accepted external_job_id
-> processing
-> periodic poll
-> terminal success/failure
```

The TTS service owns provider/model/voice configuration. Audio sends canonical production inputs plus preset key and records only the frozen usage facts.

Callback support is `DEFERRED`; no internal callback HTTP endpoint is required by V1 design.

## 7. TTS Success -> Asset Version

TTS service is expected to have uploaded/registered the produced object with Asset Infrastructure and return stable `asset_id` plus needed audio technical metadata.

Before Audio materializes the version it verifies through Asset Infrastructure abstraction:

```text
asset exists
asset.status = ready
asset.mimeType is audio-compatible
asset is not deleted/failed
```

Then one Audio transaction locks Slot/Task/Attempt:

1. ensure Task method = tts, status=producing;
2. ensure Attempt belongs Task and is the winning nonterminal Attempt;
3. ensure no Asset Version already exists for Task;
4. allocate Slot version under Slot lock: `max(version)+1`;
5. insert Asset Version with `generation_attempt_id`, asset logical UUID, content revision/hash, duration/sample_rate/channels;
6. Attempt -> succeeded/completed_at;
7. Task -> pending_review/completed_at as production completion timestamp;
8. append `asset_created` event;
9. commit.

`UNIQUE(task_id)`, `UNIQUE(generation_attempt_id)`, `UNIQUE(asset_id)`, `UNIQUE(slot_id,version)` remain final guards.

If Asset Infrastructure succeeded but Audio transaction did not commit, retry reconciliation must first query Audio by Task/Attempt/asset and either finish idempotently or ask Asset Infrastructure to clean an unreferenced production object. No Audio cleanup table is introduced.

## 8. TTS Failure -> Retry

Provider-confirmed `failed` or worker `dead_letter` records failure code/message without secrets. In the same Audio transaction:

```text
Attempt terminal
Task -> production_failed
append production_failed event
```

`RetryTtsProduction` locks Task, requires `production_failed`, creates next Attempt queued, sets Task -> producing, appends `production_retry`. It may be initiated by an authorized operator or by a bounded server retry policy; either way it is the same business Task.

## 9. Human Recording

Human flow:

```text
pending_assignment
-> assigned(operator)
-> producing
-> browser records locally
-> backend/Asset Infrastructure receives final selected recording
-> Asset ready
-> Audio validates metadata
-> Asset Version(generation_attempt_id=NULL, producer_operator_id=operator)
-> pending_review
```

Browser may record/re-record multiple local previews; only the final submitted asset enters canonical production history. Browser cannot select canonical bucket/key or write Audio/Asset SQL.

Human re-record before final asset submission remains the same Task in `producing`; after Asset Version creation, quality failure must use Review reject + successor, because one Task can have only one Asset Version.

## 10. Technical Audio Validation

Audio validates only facts required by its schema/business use:

- asset is ready and audio-compatible;
- `duration_ms > 0`;
- optional `sample_rate_hz > 0` when supplied;
- optional `channels > 0` when supplied.

Provider/bucket/key/MIME/size/checksum remain Asset Infrastructure facts. MIME may be read for validation but is never copied into `audio_asset_versions`.

## 11. Review Projection Contract

Every Review is INSERT-only.

### Approve

Preconditions: Task `pending_review`, Asset projection `pending_review`, request_id new.

Transaction:

```text
insert review(approved)
asset.review_status -> approved
task.status -> approved
append review_approved
```

### Reject

Preconditions: pending review; reject reason required by DB enum/check.

```text
insert review(rejected)
asset.review_status -> rejected
task.status -> rejected
append review_rejected
```

### Revoke approval

Allowed only when:

```text
task.status = approved
asset.review_status = approved
asset.first_published_at IS NULL
slot.official_asset_version_id != asset.id
```

Transaction:

```text
insert review(approval_revoked, remark required)
asset.review_status -> pending_review
task.status -> pending_review
append review_revoked
```

Published/ever-published asset review approval is not revoked in V1.

## 12. Publish Transaction

Lock order to prevent deadlocks:

```text
Slot -> Task -> Asset Version
```

Revalidate Content current published source before opening the short mutation transaction; inside transaction verify stored Slot required revision/hash still match the just-validated requirement. If changed, abort as `AUDIO_SOURCE_STALE` and retry from Content validation.

Transaction writes:

```text
first_published_at = COALESCE(first_published_at, now())
slot.official_asset_version_id = asset.id
task.status = published
task.completed_at = now()
append published event
```

Duplicate publish of the already canonical Task/Asset returns success. A competing different candidate must pass locks and current state/freshness; otherwise conflict.

## 13. Task Events

All state-changing Task lifecycle facts write one of the frozen 12 event types. State mutation and event INSERT are same Audio transaction.

Actor rules:

- operator command -> `actor_type=operator`, `actor_id=Operations operator UUID`;
- worker/system transition -> `actor_type=system`, `actor_id=NULL`;
- direct TTS-originated reconciliation may use `actor_type=tts`, `actor_id=NULL`.

Payload allowlist: attempt number/id, asset-version id, non-secret error code, previous/current assignment id, preset key, safe reason metadata. Forbidden: provider credentials/tokens, raw storage key/bucket, signed URL, full text/pronunciation snapshots, Authorization headers, secrets.

`request_id` must be unique and stable across retry of the same lifecycle mutation.

## 14. Batch Contract

Batch item creation may run in bounded chunks, but persisted semantics remain snapshot-based. `creating` means item creation is in progress; `completed` means requested item creation is finished, not that child Tasks are complete.

Counts are persisted creation results only. Querying execution progress means aggregating Task states separately and must not rewrite Batch status/count history.

## 15. Default Preset Contract

Mapping is current configuration and may UPDATE/DELETE. A disabled mapping is ignored. Explicit operator override is allowed only if TTS service validates the key. Historical `audio_tasks.tts_preset_key` never changes when mapping changes.

## 16. Outbox Decision

Current required consumers can synchronously resolve official audio through `audio/public`; no frozen requirement identifies an asynchronous Audio event consumer.

```text
Required Audio V1 Outbox events = none
```

`audio_task_events` does not become an outbox. If a future consumer needs reliable publication events, use the shared `infrastructure.system_outbox_events` in the same owner transaction after a separately frozen event contract.
