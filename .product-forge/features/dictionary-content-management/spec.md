# Dictionary Content Management — Spec Kit Bridge

> Feature: `dictionary-content-management` | Source: approved Product Spec and Revalidation

## Authority snapshot

Dictionary/Knowledge specs own dictionary semantics; D-158 and 1290 own the parent revision workflow; Operations RBAC §14.8 owns the post-commit audit boundary. Frozen migrations 0400/1240/1290 remain unchanged.

## User stories

- **US-001:** Operator maintains a Word dictionary aggregate through its parent revision.
- **US-002:** Reviewer/publisher validates and publishes the complete aggregate.
- **US-003:** Runtime client receives only safe published dictionary projections.

## Functional requirements

- **FR-001:** A Word Content UUID is the sole external identity; no dictionary entry or child public identity/lifecycle exists.
- **FR-002:** Aggregate sections cover meanings, sentence examples, cross-language equivalents, same-language relations, and tags; validation rejects duplicates, self-reference, invalid direction/type, and ineligible targets.
- **FR-003:** Mutations enforce category permission, parent lock/idempotency, and successful-action audit after owner commit under Operations §14.8.
- **FR-004:** Parent revision alone follows D-158; Content publish/materialization is atomic and a post-commit audit failure returns stable internal error without fabricated rollback.
- **FR-005:** Runtime lookup/search/detail requires active published parent and published targets, uses bounded cursor semantics, and exposes zero internal BIGINT values.

## Acceptance scenarios

- **FR-002-AS01:** Given an invalid or duplicate child reference, when save/submit/publish runs, then the aggregate has no partial write.
- **FR-003-AS01:** Given missing permission or stale lock, when mutation runs, then it is rejected before persistence/audit; replay with same idempotency key does not duplicate publish/audit.
- **FR-004-AS01:** Given Content publish committed and Operations audit fails, when the response returns, then Content stays published, no second publish occurs, and the Admin is told to refresh.
- **FR-005-AS01:** Given any parent/target is non-public, when lookup/search/detail runs, then it and every internal BIGINT are absent.

## Locked decisions

No frozen migration edits; no child UUID/lifecycle; no Learning history/favorites, course, practice, audio, or generic DataTable scope.
