# Technical Plan: Dictionary Content Management

## Architecture

Extend the existing Content structured aggregate workflow for `zh_word` and `lo_word`. Store complete dictionary sections in the parent revision snapshot; use normalized dictionary tables only as a Content-owned public query materialization, updated atomically with the parent publish transaction. After commit, synchronously call Operations success audit per §14.8; audit failure returns internal error without rollback.

## Workstreams

1. Backend: aggregate snapshot schema, validators, management PUT endpoints, category permission checks, idempotency/lock handling, and runtime lookup/search/detail projection.
2. Database: inspect current highest migration; add only a new forward migration if indexes/constraints/materialization support is required. Never modify 0400/1240/1290.
3. Admin: extend existing Word category editor, version comparison, review, preflight confirmation, and error/toast patterns; no generic table work.
4. Tests: transaction/permission/idempotency/zero-leakage coverage; Test Plan maps all 21 pending Journey/Edge references.

## Verification

Use real PostgreSQL clean-install and upgrade checks; exercise publication rollback and post-commit audit failure separately; assert DTOs contain no BIGINT and public queries omit every non-public parent/target.
