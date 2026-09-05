# Plan — Digest

## Key decisions

- Implement a standalone Node.js migration CLI in `database/scripts/`; no HTTP/UI/schema work.
- Use source-ID-derived deterministic UUIDs, a PostgreSQL advisory lock, preflight-first flow and one target write transaction.
- Preserve only canonical source relationships and processed audio; write all dedup and missing-relation exceptions to generated reports.
- Map audio to R2 Asset Infrastructure and create a new pending-review Audio workflow for each draft Content item.

## Artifacts produced

- `specs/007-legacy-lao-content-migration/plan.md` — canonical technical plan.
- `plan.md` — Product Forge pointer to that canonical plan.

## Open risks

- The new-audio lifecycle is planned as pending review with no official pointer; this needs human approval because the source audit history is intentionally not carried over.
- Target Audio table constraints and the R2 adapter must be tested against a disposable PostgreSQL database before any live apply.

## Handoff notes

Tasks must sequence deterministic mapping/unit tests before importer implementation, then database integration tests, dry run, explicit apply and rerun verification. No task may modify frozen migrations or insert source-history facts.

## Prior lessons applied

None.
