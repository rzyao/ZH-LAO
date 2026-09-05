# Plan — Digest

> **Feature:** curriculum-authoring-publishing
> **Phase:** plan
> **Generated at:** 2026-09-05T00:00:00+08:00
> **Artifact owner:** speckit.product-forge.plan

## Diff since last approved state

Initial version — no prior state.

## Key decisions

- Implement the aggregate within the existing Content module and consume Operations only through public contracts.
- Add only an ADR-029-compatible forward migration for Course/Lesson pointers; snapshot pins remain application-validated JSON schemas.
- Sequence backend invariants and tests before Admin/Mobile consumers; no new external service or generic table redesign.

## Artifacts produced

- `plan.md` — module, migration, transaction, UI and verification sequencing.

## Open risks

- Existing dirty Content/Admin files require implementation-time ownership checks.
- The forward migration and all feature code remain unimplemented.

## Handoff notes for next phase

- Tasks must sequence migration/repository/domain before HTTP/Admin/Mobile, and assign explicit P0 tests for reference validation, atomic rollback and draft isolation.
- Prior lessons applied: none.
