# Phase 1 Quickstart: 管理端通用数据表增强验证指南

This guide is runnable after implementation; it does not claim that the feature is currently implemented.

## Prerequisites

- Node.js 22+, pnpm 10.20, and dependencies installed in database, apps/backend, and apps/admin.
- A disposable PostgreSQL admin connection.
- The planned 1340_content_letter_batch_tasks.sql migration and regenerated backend migration manifest.

Never point destructive validation at a shared or production database. Database validation creates and removes a uniquely named disposable database when supplied an admin connection.

## 1. Validate the forward migration

From database/:

```powershell
$env:ADMIN_DATABASE_URL = 'postgresql://<user>:<password>@127.0.0.1:5432/postgres'
pnpm test
pnpm validate
```

Expected: clean and 1330-to-1340 upgrade paths succeed; Content has both batch tables, constraints and indexes; the catalog has 133 total tables (131 business + 2 infrastructure) and no illegal cross-domain FK; repeat migration is a no-op and old checksums are unchanged. <!-- CR-001: correct derived table counts to the current 1330 repository baseline -->

## 2. Backend unit and PostgreSQL integration verification

From apps/backend/:

```powershell
pnpm manifest:check
pnpm typecheck
pnpm lint
pnpm test
$env:ADMIN_DATABASE_URL = 'postgresql://<user>:<password>@127.0.0.1:5432/postgres'
pnpm test:integration
```

Real PostgreSQL evidence must show:

- API-LettersQuery defaults to 50, accepts 500 and rejects 501 with the approved envelope.
- Unchanged query_all freezes the exact UUID set; changed membership returns BATCH_SELECTION_CHANGED and writes nothing.
- Same idempotency key/request returns the original task; a different request returns CONFLICT.
- Concurrent workers never process one item twice.
- Mixed legal/illegal items finish independently and counters equal persisted item states.
- Permission revocation skips untouched items with FORBIDDEN.
- Each committed mutation has exactly one Operations success audit with batch_task_id.
- Worker interruption rolls back the active item and restart reaches a legal terminal state.
- Retry requeues only failed items and never repeats succeeded/skipped work or audit.
- Another Operator cannot discover detail or trigger retry.

## 3. Admin component and feature tests

From apps/admin/:

```powershell
pnpm typecheck
pnpm lint
pnpm test
```

Expected:

- Existing DataTable client-mode tests remain green.
- Controlled mode uses supplied server pagination, sorting and totals without repaginating the returned page.
- Selection/action columns cannot be hidden; the sticky operation column remains usable while scrolling.
- Router search state survives refresh; target-changing query/filter/sort/page-size changes reset selection and the appropriate page.
- Page selection is three-state and never silently becomes query-all.
- Every action confirms; reject/archive require a trimmed reason.
- Transport retry reuses the same idempotency key until the task result is known.
- Polling stops at terminal state, announces status, invalidates the list and corrects an empty page.

## 4. Browser journeys

From apps/admin/:

```powershell
pnpm e2e
```

Required:

1. TC-E2E-001: search/filter/sort/page/page-size and columns round-trip through URL refresh; operation remains fixed.
2. TC-E2E-002: select page, explicitly upgrade to all filtered results, confirm approve, then observe completion and refreshed list.
3. TC-E2E-003: reject/archive reason validation, stale-selection rejection, mixed results, creator-only detail and failed-only retry.

Run axe on all journeys: zero serious/critical violations. Search, selection, confirmation, pagination, result inspection and retry must be keyboard-completable.

## 5. Capacity and query plans

Use a disposable database seeded with representative Lao-letter/revision volume and capture the parameterized default, 500-row, broad substring and common status/type filter plans:

```sql
EXPLAIN (ANALYZE, BUFFERS)
-- run the actual repository query and bound parameters here
```

Acceptance:

- 50-row query p95 is at most 500 ms; 500-row p95 is at most 1.5 s in the recorded environment.
- No API response returns the complete unpaginated target set.
- Queue saturation returns RATE_LIMITED with retry_after_seconds, without limiting one task's target count.
- Worker observability includes queue depth, oldest queued age, cycle duration and outcome counts, never reason text/item payloads.

## 6. Manual acceptance

- Loading, initial-empty, filtered-empty and recoverable-error states are distinct.
- Reset columns restores defaults but never hides selection/action.
- Selection banner always states page versus all-filtered scope and count.
- Confirmation names action, scope and count; “删除” submits archive and never a DELETE/physical delete.
- No online/offline, cancel, export or other-Content generic batch controls exist.
- Completed-with-issues separates succeeded/failed/skipped and offers retry only when failed items exist.
- A second Operator cannot discover the first Operator's task.

## 7. Full package verification

```powershell
Set-Location apps/backend
pnpm verify
Set-Location ../admin
pnpm verify
Set-Location ../../database
pnpm test
pnpm validate
```

Record commands, environment, per-requirement mapping, timings, query plans and failures as evidence. A prose statement that tests “should pass” is not evidence.
