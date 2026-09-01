---
status: frozen
phase: 7
phase_name: Audio Production Domain
document: AUDIO_USE_CASES
design_only: true
implementation_started: false
last_updated: 2026-09-02
lifecycle: historical
---

# ZH-LAO  — Audio Production Use Cases

## 1. Classification

Use Cases 从 Slot/Task/Attempt/Asset/Review/Publish 产品链推导，不按 9 张表生成 CRUD。

### REQUIRED — 25

| ID | Use Case | Core result |
| --- | --- | --- |
| AUD-UC01 | Sync Source Requirement | validate Content source/revision and upsert Slot required revision/hash |
| AUD-UC02 | Resolve Official Audio | return only fresh/current official audio descriptor or typed unavailable reason |
| AUD-UC03 | Set Slot Active/Offline | control Audio serviceability without deleting history |
| AUD-UC04 | Create TTS Task | validate requirement, enforce one active Task, resolve preset, create Task + first Attempt |
| AUD-UC05 | Create Human Task | validate requirement and create pending/assigned Task |
| AUD-UC06 | Assign Human Task | pending_assignment -> assigned |
| AUD-UC07 | Start Human Recording | assigned -> producing |
| AUD-UC08 | Submit Human Asset | validate Asset Infrastructure record and create immutable Asset Version |
| AUD-UC09 | Claim TTS Attempt | acquire/renew lease for eligible queued/retry processing |
| AUD-UC10 | Submit TTS Attempt | call TTS service with Task snapshots + preset key |
| AUD-UC11 | Poll TTS Attempt | reconcile external job state without new Task |
| AUD-UC12 | Mark TTS Production Failed | terminal attempt failure -> Task production_failed |
| AUD-UC13 | Retry TTS Production | production_failed -> producing + next Attempt |
| AUD-UC14 | Materialize TTS Asset Version | validate returned asset and atomically create Asset Version |
| AUD-UC15 | Approve Candidate | append Review, projection approved, Task approved |
| AUD-UC16 | Reject Candidate | append Review, projection rejected, Task rejected |
| AUD-UC17 | Revoke Approval | pre-publication append revoke, projection/task back to pending_review |
| AUD-UC18 | Publish Candidate | atomic official pointer switch + first_published_at + Task published |
| AUD-UC19 | Create Successor Task | rejected predecessor -> new active Task with refreshed Content input |
| AUD-UC20 | Cancel Pre-asset Task | allowed active pre-review states -> canceled |
| AUD-UC21 | Create Batch | snapshot source list and create batch/items/tasks with partial result |
| AUD-UC22 | Cancel Creating Batch | stop remaining item creation; keep existing Tasks |
| AUD-UC23 | Read Production Queue | workbench aggregate read model with filters/pagination |
| AUD-UC24 | Read Task Detail | Task + attempts + asset + review + task-event timeline |
| AUD-UC25 | Manage Default Preset Mapping | read/upsert/disable/delete current default mapping |

### DEFERRED — 10

1. strict producer/reviewer four-eyes enforcement;
2. automatic task assignment;
3. automatic quality/pronunciation scoring;
4. TTS provider callback endpoint (V1 uses polling);
5. scheduled publication;
6. bulk CSV import/export;
7. waveform/loudness derived data pipeline;
8. transcoding/multi-format renditions;
9. Audio domain outbox events for external consumers;
10. rollback UI to an older published version.

### NOT_SUPPORTED — 12

1. Audio-owned quota ledger;
2. Audio-owned billing events;
3. subscription/tier entitlement decisions inside Audio;
4. voice-profile canonical tables;
5. multiple candidates per Task;
6. `audio_entries/audio_variants/speech_audio` alternate model;
7. resurrected `pronunciation_audios` / `tts_jobs` tables;
8. Audio-owned dictation attempts;
9. Audio-owned listening streaks;
10. browser direct PostgreSQL writes;
11. browser choosing canonical storage bucket/key;
12. physical delete of production/audit history rows.

## 2. Entry Preconditions

All production mutations require:

```text
Content source/revision validates through Content public contract
stable UUIDs only across domains
Slot status compatible with action
Operations authentication + exact permission for Admin actions
idempotency key/request_id where contract defines one
```

Runtime `Resolve Official Audio` requires no operator permission but may only return a fresh official asset for a Content source currently eligible for runtime use.

## 3. Successor Rules

`CreateSuccessorTask` does not copy stale production input. It always revalidates current Content published revision and recomputes the input hash.

Inherited/defaulted behavior:

- same Slot mandatory;
- `predecessor_task_id = rejected task id`;
- production method defaults to predecessor but caller may explicitly switch `tts <-> human_recording`;
- assignee is **not** inherited unless explicitly supplied;
- TTS preset is re-resolved: explicit override, otherwise current enabled default; never blindly inherit an unavailable preset;
- new client idempotency key required;
- predecessor Task/Asset/Reviews/Events remain immutable.

## 4. Workbench Read Model

Queue/detail APIs may aggregate Audio-owned rows plus read-only Content/Asset/Operations display metadata, but no foreign data becomes Audio canonical state.

Queue minimum columns:

```text
taskId, slotId, source ref, language, role, method, task status,
assigneeOperatorId, contentRevisionId, freshness,
latestAttemptStatus?, reviewStatus?, createdAt, updatedAt
```

Task detail additionally provides immutable production snapshots, attempt timeline, asset technical attributes, review history and task lifecycle events. Storage bucket/key/checksum and secret TTS configuration are excluded.

## 5. Mutation Audit Requirement

Every successful state-changing Admin command must produce the Operations success-only operator audit required by the Operations contract. Audio task events remain separate domain lifecycle history.

Read-only workbench queries do not produce canonical operator audit by default.

## 6. Idempotency Expectations

- Create Task: `client_idempotency_key` unique; same semantic request returns existing Task, conflicting payload -> `IDEMPOTENCY_KEY_REUSED`.
- Review: `audio_reviews.request_id` unique.
- Task Event: `audio_task_events.request_id` unique.
- TTS submit: Attempt `request_id` unique and reused for transport retry of the same Attempt.
- Batch: `client_idempotency_key + request_hash` semantics.
- Publish: duplicate request for the same already-published Task/Asset is success-idempotent; trying a different candidate after state changed requires full revalidation.

## 7. No Hidden Product Requirements

Feature flags, route kill switches, subscription entitlements, quotas, billing, dictation and streaks are not entry conditions for these Use Cases because the trusted Audio Brief does not require them. If a future product requirement is approved, it enters through a separate contract change rather than being smuggled into implementation.
