# Code Review: 管理端通用数据表增强

> Feature: `admin-data-table-enhancement` | Date: 2026-09-05  
> Files reviewed: 67 declared paths plus recorded integration adapters | Tasks covered: 58/58  
> Status: **READY FOR HUMAN APPROVAL — APPROVE WITH CONDITIONS**

## Machine gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Types | PASS | Backend and Admin type checks exit 0. |
| Lint / architecture | PASS | Backend lint and architecture boundaries pass; Admin has 0 errors and 38 pre-existing warnings. |
| SCA / SAST | DEGRADED PASS | `osv-scanner` and project SAST are not installed. Public npm registry production-lockfile audits for Backend and Admin report no known vulnerabilities. |
| Coverage thresholds | PASS | Dedicated enforced per-layer commands pass: Admin 51/51 with 93.68% lines; Backend 103/103 with services 92.79%, domain 96.02%, repositories 98.45%, and HTTP routes 93.96%. |

## Summary

| Dimension | Open CRITICAL | Open HIGH | Open MEDIUM | Open LOW | Resolved |
| --- | :---: | :---: | :---: | :---: | :---: |
| Quality | 0 | 0 | 1 | 0 | 2 |
| Security | 0 | 0 | 0 | 0 | 1 |
| Patterns | 0 | 0 | 1 | 0 | 2 |
| Tests | 0 | 0 | 0 | 0 | 1 |
| Doc↔Code | 0 | 0 | 0 | 0 | 3 |
| **Total** | **0** | **0** | **2** | **0** | **9** |

**Recommendation:** **APPROVE WITH CONDITIONS**. All CRITICAL/HIGH findings are resolved and independently re-reviewed. Carry REV-008 as a throughput improvement and REV-010 as a Content contract-owner decision.

## Re-review result — 2026-09-05 06:21 +08:00

- REV-001 through REV-007 are resolved. The transaction fix now rolls back unexpected action failures before a separate recovery transaction safely fails all unfinished items and leaves them eligible for owner retry.
- The current-page guard compares actual UUID membership across page changes; row actions are restricted by each row's `available_actions`; task history, error recovery and hidden→visible polling are reachable and tested.
- REV-009 and REV-011 were also resolved: rejected revisions no longer advertise submit, and the downstream component map points to the feature-local implementation.
- Three independent delta reviews found no remaining CRITICAL/HIGH issue.

## Positive Highlights

- Server-mode DataTable behavior is opt-in and preserves existing client-mode defaults.
- Query values are parameter-bound and sort/order use fixed allowlists; query-all re-resolves the complete UUID set and freezes it transactionally.
- Content owns task state while Operations owns authorization/audit; owner-scoped lookups and public UUID DTOs prevent cross-operator and internal-ID disclosure.
- The successful worker path commits Content mutation, Operations audit, item outcome and counters in one transaction.

## Findings

### REV-001 [RESOLVED]: A failed item can commit partial Content mutations

| Field | Value |
| --- | --- |
| **Dimension** | Security / transaction integrity |
| **Severity** | CRITICAL |
| **File** | `apps/backend/src/modules/content/application/use-cases/process-lo-letter-batch.ts:104`; `apps/backend/src/modules/content/worker/composition.ts:61`; `apps/backend/src/modules/content/infrastructure/postgres-structured-content-repository.ts:214` |
| **Rule** | FR-020, SC-011 and plan item-transaction atomicity |

**What:** `contentActions.execute()` runs inside the item transaction, but an `AppError` is caught inside that same transaction and converted into a persisted failed outcome. A multi-statement action such as publish can update revisions, then fail during materialization; catching the error allows the outer transaction to commit those earlier writes while returning `failed` and omitting the success audit.

**Why it matters:** The system can report failure while content is partly published, breaking data integrity and audit truth.

**Suggested fix:** isolate the action with a savepoint and roll it back before recording the failed result.

```ts
await executor.query('SAVEPOINT lo_letter_item_action')
try {
  await contentActions.execute(executor, input)
} catch (error) {
  await executor.query('ROLLBACK TO SAVEPOINT lo_letter_item_action')
  if (!(error instanceof AppError)) throw error
  await repository.recordItemOutcome(executor, item.id, failedOutcome(error))
}
```

Add a real PostgreSQL test in which the action writes first and then throws `AppError`; assert that the business write is rolled back, item/counters say failed, and audit count is zero.

### REV-002 [RESOLVED]: Partial page selection can upgrade to the whole query

| Field | Value |
| --- | --- |
| **Dimension** | Doc↔Code / selection safety |
| **Severity** | HIGH |
| **File** | `apps/admin/src/features/content/structured/lo-letter-batch-bar.tsx:22`; `apps/admin/src/features/content/structured/lo-letter-selection.ts:16` |
| **Rule** | US-003, FR-014 and plan line 171 |

**What:** The upgrade affordance appears whenever `total > selectedCount`; neither state nor component verifies that all rows on the current page are selected.

**Why it matters:** Selecting one row can expose an action that expands scope to every filtered record.

**Suggested fix:** pass an explicit page-all-selected invariant and enforce it in both UI and transition logic.

```tsx
{allPageSelected && total > selectedCount ? <Button onClick={onUpgrade}>…</Button> : null}
```

Add a negative partial-selection component test and retain the full-page positive E2E.

### REV-003 [RESOLVED]: The fixed operation column is an inert placeholder

| Field | Value |
| --- | --- |
| **Dimension** | Quality / product behavior |
| **Severity** | HIGH |
| **File** | `apps/admin/src/features/content/structured/lo-letter-columns.tsx:50` |
| **Rule** | FR-012-AS01 requires the fixed operation column to remain operable |

**What:** The row button has no handler, menu or action callback.

**Why it matters:** The new first-page implementation visually offers row actions but cannot perform them, regressing existing single-record administration.

**Suggested fix:** inject a feature-local row-action renderer/handler driven by `available_actions` and reuse the existing single-item commands and confirmations.

```tsx
cell: ({ row }) => <LaoLetterRowActions row={row.original} onAction={onRowAction} />
```

Test actual action invocation, not only focus/sticky styling.

### REV-004 [RESOLVED]: Creator task history has no reachable UI

| Field | Value |
| --- | --- |
| **Dimension** | Doc↔Code |
| **Severity** | HIGH |
| **File** | `apps/admin/src/features/content/structured/lo-letter-page.tsx:81`; `apps/admin/src/features/content/structured/queries.ts:83` |
| **Rule** | US-005 and FR-018 require long-lived creator-visible task history |

**What:** The page can display only the task UUID held in transient `activeTaskId`. The implemented task-list hook is unused, so refresh/re-entry loses access to prior tasks.

**Why it matters:** Long-term persistence exists in the database but is unavailable to the intended user.

**Suggested fix:** add a paginated owner-history panel and allow a history row to open task detail; cover create → refresh → reopen from history in E2E.

```tsx
const history = useLaoLetterBatchTaskList(historyPage, 20)
<TaskHistory tasks={history.data?.items ?? []} onOpen={setActiveTaskId} />
```

### REV-005 [RESOLVED]: Task-level `failed` is unreachable

| Field | Value |
| --- | --- |
| **Dimension** | Quality / durability |
| **Severity** | HIGH |
| **File** | `apps/backend/src/modules/content/application/use-cases/process-lo-letter-batch.ts:36`; `apps/backend/src/modules/content/infrastructure/postgres-lo-letter-batch-repository.ts:350` |
| **Rule** | FR-017/FR-018 task state machine and safe `last_error_code` |

**What:** The worker seam has no task-failure operation, and repository code never writes task `status='failed'` or `last_error_code`. Unexpected errors roll back and leave the task claimable forever.

**Why it matters:** A persistent system failure can create an endless retry loop while an advertised terminal state remains impossible.

**Suggested fix:** define a safe task-failure transition in the repository/use case, execute it in a separate recovery transaction after an unrecoverable cycle error, and test failure plus legal failed-item retry.

```ts
await recoveryTransactions.run((db) => repository.failTask(db, taskId, safeErrorCode))
```

### REV-006 [RESOLVED]: Task observation errors have no recovery state

| Field | Value |
| --- | --- |
| **Dimension** | Patterns / critical-path error handling |
| **Severity** | HIGH |
| **File** | `apps/admin/src/features/content/structured/lo-letter-batch-task-panel.tsx:35`; `apps/admin/src/features/content/structured/lo-letter-batch-task-panel.tsx:65` |
| **Rule** | FR-019 recoverable request state; TanStack Query data-access pattern |

**What:** Poll and retry promises have no catch path. Initial failure leaves the panel permanently loading; retry failure has no user-visible message. The panel also bypasses the already-built Query hooks and AbortSignal behavior.

**Why it matters:** Operators cannot recover task tracking after a transient network or business error.

**Suggested fix:** consume `useLaoLetterBatchTask`/`useLaoLetterBatchRetry`, render accessible error and retry states, and bind polling to page visibility.

```tsx
const detail = useLaoLetterBatchTask(taskId, page, 20, status, visible)
if (detail.isError) return <RecoverableTaskError onRetry={() => detail.refetch()} />
```

### REV-007 [RESOLVED]: Required coverage gate cannot pass

| Field | Value |
| --- | --- |
| **Dimension** | Tests |
| **Severity** | HIGH |
| **File** | `apps/admin/package.json:18`; `apps/backend/package.json:4`; `apps/admin/e2e/content-management.spec.ts:131`; `apps/backend/test/modules/content/lo-letter-admin-http.contract.test.ts:462` |
| **Rule** | Product Forge testing strategy minimums |

**What:** Admin coverage cannot start because its declared provider is absent, Backend has no coverage command, several public list/preview/history/detail/retry routes lack paired validation/auth cases, and named E2E cases do not exercise all documented exits (column settings/paging, batch approve-to-completion, required reason).

**Why it matters:** The required per-layer minimums cannot be demonstrated; current traceability overstates some E2E coverage.

**Suggested fix:** restore runnable per-workspace coverage commands, add the missing public-route happy/4xx/auth matrix and complete the three named E2E journeys; then regenerate coverage/traceability evidence.

```json
{ "devDependencies": { "@vitest/coverage-v8": "<version matching vitest>" } }
```

### REV-008: One large task is effectively processed serially

| Field | Value |
| --- | --- |
| **Dimension** | Quality / capacity |
| **Severity** | MEDIUM |
| **File** | `apps/backend/src/modules/content/application/use-cases/process-lo-letter-batch.ts:54`; `apps/backend/src/modules/content/infrastructure/postgres-lo-letter-batch-repository.ts:270` |
| **Rule** | Configured worker concurrency should protect unbounded batch throughput |

**What:** Every item transaction first locks the task row and holds it through the content action. Other workers skip the same task, so concurrency benefits only multiple tasks, not the common single large task.

**Suggested fix:** claim eligible items without holding a task-row lock across the business action; short-lock the task only for state/counter transitions. Add a barrier test proving overlap for multiple items in one task.

### REV-009 [RESOLVED]: Rejected revisions advertise an illegal submit action

| Field | Value |
| --- | --- |
| **Dimension** | Patterns / domain consistency |
| **Severity** | MEDIUM |
| **File** | `apps/backend/src/modules/content/infrastructure/postgres-lo-letter-admin-repository.ts:110`; `apps/backend/src/modules/content/domain/language-structure.ts:125` |
| **Rule** | The single-item revision state machine is the only legality source |

**What:** `availableActions()` exposes `submit_review` for rejected revisions, while the authoritative state machine permits rejected → re_edit only.

**Suggested fix:** advertise submit only for draft, or explicitly run the existing re-edit flow before any later submit.

### REV-010: Retry Idempotency-Key is validated but ignored

| Field | Value |
| --- | --- |
| **Dimension** | Patterns / contract consistency |
| **Severity** | MEDIUM |
| **File** | `apps/backend/src/modules/content/http/lo-letter-batch-routes.ts:297`; `apps/admin/src/features/content/structured/api.ts:109` |
| **Rule** | Required contract parameters must have defined semantics |

**What:** Retry validates the required header but does not pass or persist it; the client generates a fresh UUID per call. The canonical Content contract defines idempotency only for task creation, while downstream OpenAPI also requires the header for retry.

**Suggested fix:** ask the Content contract owner to choose one path: remove the retry header from downstream OpenAPI/client/routes, or approve and implement retry replay semantics. Do not infer a canonical contract change from code.

### REV-011 [RESOLVED]: Component map points to components not used by the implementation

| Field | Value |
| --- | --- |
| **Dimension** | Doc↔Code |
| **Severity** | LOW |
| **File** | `.product-forge/features/admin-data-table-enhancement/product-spec/mockups/component-map.yml:11` |
| **Rule** | Mockup component mapping should match implementation reality |

**What:** The map points to shared batch-bar/feedback components, while implementation uses feature-local components and directly composes Dialog/Input.

**Suggested fix:** after behavior fixes, update the downstream component map to actual paths or refactor to the mapped shared components. No canonical Product/Domain/API change is implied.

## Required Before Verification (Phase 7)

No CRITICAL/HIGH remediation remains. Human approval of this code-review gate is required before Phase 7.

## Suggested Improvements (Optional)

- REV-008: allow concurrency within one large task and prove it with a barrier test.
- REV-009: derive advertised actions strictly from the revision state machine.
- REV-010: reconcile retry header semantics through the Content contract owner.
- REV-011: reconcile the downstream component map.

## Test Coverage Gap Analysis

| Requirement | Test status | Gap |
| --- | :---: | --- |
| FR-014 | PASS | Partial selection and equal-sized prior-page selection cannot upgrade; full-page positive flow remains covered. |
| FR-018 / US-005 | PASS | Refresh/re-entry history and owner detail reopening are covered. |
| FR-019 | PASS | Load, poll, retry and hidden→visible recovery are covered. |
| FR-020 / SC-011 | PASS | Write-then-throw action rollback and unexpected task-failure recovery are covered with real PostgreSQL. |
| Public API surface | PASS | All six public routes have happy, validation/failure and authentication/authorization coverage. |
| TC-E2E-001..003 | PASS | Named journeys cover column settings, sticky operations, paging, query-all confirmation, completion refresh, stale selection and retry. |
| Per-layer numeric thresholds | PASS | Dedicated Admin and Backend configurations enforce the Product Forge layer minimums and exit 0. |

## Suggested canonical-spec updates

No Product, Domain, Architecture, Database or API authority should be changed to match the current code. REV-010 requires an explicit Content contract-owner decision before any canonical update; all other behavior drift should be fixed in implementation/downstream evidence.

## Review Checklist

- [x] All CRITICAL findings addressed
- [x] All HIGH findings addressed or explicitly acknowledged
- [x] Test coverage adequate for Must Have stories
- [x] No confirmed injection, ownership-bypass, secret, XSS or direct error-leak vulnerability in new code
