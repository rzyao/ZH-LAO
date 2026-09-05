# Authority Decision Package ADP-004 — Curriculum lifecycle idempotency storage

**Status:** accepted  
**Date:** 2026-09-05  
**Decision owner:** Content / Database / Architecture authority  
**Scope:** forward-only support for the existing Content Revision lifecycle requirement.

## Decision requested

Accept the authoritative persistence location and replay semantics for the
existing `Idempotency-Key` requirement on Curriculum submit, review, and
publish commands. The decision must use a forward migration only and must not
modify frozen Content migrations.

## Evidence

- [Content versioning and review](../../../docs/docs/developer/reference/domains/content/versioning-review.md)
  already requires idempotency for submit, review, and publish.
- [CONTENT_API](../../../docs/docs/developer/reference/contracts/content/CONTENT_API.md)
  declares `Idempotency-Key` for lifecycle writes.
- The frozen schema and later forward migrations have no Content command
  receipt/idempotency table, key column, or unique constraint for Course or
  Lesson revision transitions.
- A process-local cache cannot survive retry across processes and cannot make
  audit plus state transition atomic.

## Proposed minimum shape

Add a Content-owned forward migration for a command receipt keyed by the
operator UUID, aggregate UUID, command kind, and `Idempotency-Key`. It stores a
request fingerprint and successful response identity. Same key plus same
fingerprint replays the original success; same key plus a different fingerprint
returns the canonical conflict error. The receipt, revision transition,
root-pointer change, and Operations audit must commit or roll back together.

The table must only store public UUID references and never expose internal
BIGINT values through HTTP.

## Alternatives rejected

1. Treating repeat lifecycle requests as state-machine conflicts: violates the
   existing idempotency requirement.
2. Reusing Lao-letter batch idempotency rows: changes the meaning and ownership
   of batch-task data.
3. HTTP memory cache: not durable or transactionally atomic.

## Consequence if not accepted

The implemented optimistic-lock and transaction safeguards remain valid, but
the Course/Lesson lifecycle endpoints must be documented as not transport
idempotent. Task TC006/T007 cannot be marked complete.

## Resolution

Accepted by the authority owner on 2026-09-05. The authoritative decision and
the precise persistence/API semantics are recorded in
[ADR-032](../../../docs/docs/developer/reference/adr/ADR-032-curriculum-lifecycle-idempotency.md).
