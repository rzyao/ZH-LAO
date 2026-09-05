# Tasks: Dictionary Content Management

## Foundation

- [x] T001 [S] Define parent-revision dictionary snapshot DTO/schema and aggregate validation rules. Paths: `apps/backend/src/modules/content/domain/`. FR-001..003.
- [x] T002 [S] Determine current migration sequence; add a new forward migration only if required for dictionary query enforcement/indexes. Paths: `database/migrations/`. FR-002/005.

## Backend

- [x] T003 [M] Implement aggregate management PUT use cases/routes with category authorization, lock and idempotency behavior. Paths: `apps/backend/src/modules/content/`. FR-003.
- [x] T004 [M] Implement submit/review/publish validation and atomic Content materialization; call Operations audit after commit and implement §14.8 audit-failure response/logging. Paths: `apps/backend/src/modules/content/`. FR-004.
- [x] T005 [M] Implement published-only dictionary lookup/search/detail with stable cursors and zero-BIGINT DTOs. Paths: `apps/backend/src/modules/content/`. FR-005.

## Admin

- [x] T006 [M] Extend existing Word editor with aggregate dictionary sections and inline target validation. Paths: `apps/admin/src/features/content/`. FR-001..003.
- [x] T007 [S] Extend version comparison/review/preflight feedback for dictionary aggregate sections and post-commit audit error refresh guidance. Paths: `apps/admin/src/features/content/`. FR-004.

## Tests and verification

- [x] T008 [M] Add backend/unit/PostgreSQL tests for permissions, duplicates, locks, idempotency, transactional publish failure, post-commit audit failure, and zero leakage. Paths: `apps/backend/src/modules/content/**/__tests__/`. Test-first: true. FR-001..005.
- [x] T009 [M] Add Admin/API and E2E tests mapped to JRN-001..003 and EDGE-001..012. Paths: `apps/admin/**`, `.product-forge/features/dictionary-content-management/testing/`. Test-first: true.
- [x] T010 [S] Execute clean-install/upgrade migration validation and full scoped test run; update traceability with real test identifiers. Paths: `database/`, `apps/backend/`, `apps/admin/`.
