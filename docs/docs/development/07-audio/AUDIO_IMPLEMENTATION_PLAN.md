---
status: ready-after-upstream-gates
phase: 7
phase_name: Audio Production Domain
document: AUDIO_IMPLEMENTATION_PLAN
design_only: true
implementation_started: false
last_updated: 2026-09-02
lifecycle: historical
---

# ZH-LAO  — Audio Production Implementation Plan

> This plan is frozen by the recovered Design Gate. **Do not execute it until Entry Gate is satisfied in a separate implementation session.**

## Entry Gate

Required before AUD-01:

```text
AUDIO_DESIGN_GATE = PASS
CONTENT_GATE = PASS
Content public Audio capabilities are implemented and tested
OPERATIONS_GATE = PASS
ADMIN_FOUNDATION_GATE = PASS for later Admin integration
0600_audio.sql unchanged unless a separately approved forward migration exists
```

Current recovery-time fact: `CONTENT_GATE` is not evidenced/pass; therefore `AUDIO_IMPLEMENTATION = NOT_STARTED`.

## AUD-00 — Implementation Re-Audit

**Goal:** fetch latest main, gates, migrations, CI, canonical Audio docs.

**Audit:** stop on contract drift; never infer Content capability from design doc alone.

**Gate:** exact upstream Gate evidence present.

## AUD-01 — Module Skeleton / Boundaries

**Scope:** `apps/backend/src/modules/audio/{domain,application,infrastructure,http,public}` plus composition wiring only.

**Tests:** architecture/import boundary; no routes/business SQL before intended step.

**Gate:** no import of Content/Operations infrastructure or repositories.

## AUD-02 — Domain Types / State Machines

Implement frozen statuses, source refs, transitions, errors, idempotency semantics and hash canonicalizer.

**Tests:** exhaustive allowed/forbidden transitions; hash deterministic fixtures.

## AUD-03 — Repository Layer

Implement repositories for exactly the 9 frozen Audio tables using existing DB executor/transaction infrastructure.

**Tests:** real PostgreSQL constraints, partial unique active Task, composite official pointer, Review checks, source checks.

**Audit:** Audio SQL only `audio.*`; no migration edit.

## AUD-04 — Content Public Adapter

Consume implemented Content public capability for source/revision validation and requirement snapshots.

**Tests:** invalid/disabled/unpublished/stale revisions; language/role mismatch; deterministic material.

**Gate:** direct `content.*` SQL = 0.

## AUD-05 — Asset Infrastructure Adapter

Reuse shared Asset Infrastructure abstraction for read/registration/cleanup lifecycle. Add only interface/adaptation code needed to avoid leaking raw infrastructure persistence into Audio domain/application.

**Tests:** ready/deleted/failed/non-audio asset handling; orphan cleanup reconciliation.

**Gate:** storage facts duplicated into Audio = 0.

## AUD-06 — Slot / Requirement / Runtime Read

Implement syncRequirement, lazy Slot creation, current freshness calculation and public official audio resolution.

**Tests:** Content revision change -> stale; stale pointer retained but not served; offline; concurrent Slot create.

## AUD-07 — Task Creation / Assignment / Human Flow

Implement TTS/Human Task create, assignment, start, cancel, human final asset materialization.

**Tests:** one active task race; lock_version; human no generation Attempt; one Task one Asset.

## AUD-08 — TTS Worker / Attempt Lifecycle

Register Audio polling job in Foundation JobRegistry/WorkerHost. Implement lease claim, submit, poll, transport retry, failure/dead-letter, new Attempt retry and graceful abort.

**Tests:** multiple workers/`SKIP LOCKED`, lease expiry crash recovery, request-id reuse, external_job idempotency, shutdown.

**Gate:** Redis/Kafka/new queue infrastructure = 0.

## AUD-09 — Asset Version / Version Allocation

Implement Slot-locked `max(version)+1` allocation and idempotent TTS/human materialization.

**Tests:** concurrent allocation; duplicate asset/task/attempt unique conflicts; cross-Slot official-pointer rejection.

## AUD-10 — Review

Implement approve/reject/pre-publish revoke and projection updates in same transaction with Task Events.

**Tests:** reject reason checks, append-only history, duplicate request_id, self-review allowed, published revoke rejected.

## AUD-11 — Publish / Official Pointer

Implement Content freshness revalidation + atomic Slot/Task/Asset transaction.

**Tests:** stale candidate rejection; duplicate publish idempotency; concurrent publish; first_published_at first-write-only; old official retained.

## AUD-12 — Successor / Batch / Presets

Implement rejected successor revalidation, snapshot batch creation/partial results/cancel, default preset mapping + TTS validation.

**Tests:** active Task conflict, predecessor link, non-inheritance rules, batch same/different hash, duplicate Slot item, mapping mutation does not rewrite old Task.

## AUD-13 — Operations RBAC / Audit Integration

Add the seven frozen Audio permission requirements to Operations catalog through the owner-domain integration process, reconcile `super_admin`, protect Admin routes, and record successful mutations.

**Tests:** 401/403/exact permission/no wildcard; disabled Operator/Role; successful action audit; failed/no-op rules per Operations contract.

**Dependency:** accepted Operations MEDIUM cross-domain audit durability must be handled consistently with the implementation-time integration mechanism; do not direct SQL `operations.*` from Audio.

## AUD-14 — HTTP API

Implement runtime/admin routes from `AUDIO_API.md`, strict Zod validation, stable errors and pagination.

**Tests:** unknown fields/mass assignment/UUID/error envelope/cache headers; no hidden provider/storage fields.

## AUD-15 — Admin Workbench Integration

Only after Audio backend Gate candidate and Operations permissions are live, replace Audio Admin placeholder with queue/detail/record/review/publish/batch/preset surfaces using Admin Foundation.

**Tests:** component/router/Playwright live API/RBAC; microphone path only through browser media APIs + backend Asset workflow.

## AUD-16 — Security / Race / Regression

Run focused races plus backend/DB/Identity/Content/Operations/Admin/docs regressions.

Minimum races:

```text
concurrent Slot/task create
assign vs cancel
worker lease competition
retry vs late poll result
asset materialization duplicate
review vs review
review revoke vs publish
publish vs Content revision change
batch duplicate idempotency
preset update vs task creation
```

## AUD-17 — Final Conformance / Exit Gate

Audit docs ↔ migration ↔ code ↔ public contract ↔ HTTP ↔ workers ↔ Admin. Produce `AUDIO_IMPLEMENTATION_REPORT.md` only after mandatory tests/CI are real.

Exit candidate requires:

```text
BLOCKER = 0
HIGH = 0
mandatory tests = PASS
AUDIO_IMPLEMENTATION = COMPLETE
AUDIO_GATE = PASS
AUDIO_DOMAIN = FROZEN
```

## STOP Rule

This recovery task only freezes the plan. It does not execute AUD-00~17 and must not claim `AUDIO_GATE`.
