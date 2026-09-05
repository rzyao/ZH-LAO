# Code Review: Curriculum authoring and publishing

> Feature: `curriculum-authoring-publishing` | Date: 2026-09-05
> Status: APPROVED WITH CONDITIONS

## Machine gates

| Gate | Result | Evidence |
|---|---|---|
| Backend lint and types | PASS | Content curriculum files lint clean; backend typecheck passed. |
| Admin lint and types | PASS | Course feature lint clean; admin typecheck passed. |
| Feature tests | PASS | Admin 4 component tests, Chromium journey, backend route/public tests, real PostgreSQL repository cases, mobile 74 tests. |
| Dependency scan | Not run | No dependency was added by this Feature. |

## Summary

| Dimension | CRITICAL | HIGH | MEDIUM | LOW |
|---|:---:|:---:|:---:|:---:|
| Quality | 0 | 0 | 1 | 0 |
| Security | 0 | 0 | 0 | 0 |
| Patterns | 0 | 0 | 0 | 0 |
| Tests | 0 | 0 | 0 | 0 |
| Doc ↔ Code | 0 | 0 | 0 | 0 |

## Positive highlights

- Course and lesson writes consistently enforce root timestamp plus revision lock version.
- Lifecycle commands use persisted idempotency receipts and transactional Operations audit boundaries.
- Runtime only projects published pointers, while admin snapshots retain fixed revision UUIDs.

## Findings

### REV-001: Course workbench needs component decomposition

| Field | Value |
|---|---|
| Dimension | Quality |
| Severity | MEDIUM |
| File | `apps/admin/src/features/content/courses/pages/course-detail.tsx` |
| Rule | Single responsibility / maintainability |

**What:** The course detail workbench now owns editing, Unit/lesson ordering, published-lesson selection and lifecycle presentation in one component.

**Why it matters:** Future changes are harder to review and safely test in isolation.

**Suggested fix:** Extract `UnitEditor`, `PublishedLessonPicker` and `LessonOrderEditor` when the next curriculum UI increment changes this page. This is non-blocking because its current flows are tested and type-safe.

## Required before verification

None. No CRITICAL or HIGH findings.

## Suggested improvements

- Address REV-001 in a follow-up refactor scoped to the course workbench.

## Test coverage assessment

| Requirement | Evidence | Status |
|---|---|:---:|
| FR-001 / FR-006 | PostgreSQL pointer, atomic publish and idempotency tests | ✅ |
| FR-002 / FR-004 | Admin route and invalid-reference integration tests | ✅ |
| FR-003 / FR-007 | Admin course/lesson workbenches and fixed-revision pin tests | ✅ |
| FR-005 / FR-009 | Lifecycle components, route tests and browser journey | ✅ |
| FR-008 | Public route and mobile course tests | ✅ |
