# Implementation Plan: 管理端通用数据表增强

**Branch**: `006-admin-data-table-enhancement` | **Date**: 2026-09-05 | **Spec**: [spec.md](./spec.md)  
**Authority base**: `79feb6f7b82221da52e8f6bc1cd5f67d4694b415` plus the approved, uncommitted D-167/ADR-028 authority changes in this working tree  
**Input**: approved feature specification in `specs/006-admin-data-table-enhancement/spec.md`

## Summary

Deliver the first server-backed, batch-capable admin table at `/content/lo/letters`. The backend adds a strict Lao-letter query service and six already-approved HTTP operations, persists a Content-owned batch task plus frozen item set through a new `1340` forward migration, and runs those items through the existing worker host with per-item Content transactions, current Operations authorization, and success audit. The admin extends the shared TanStack DataTable with an opt-in controlled server mode while preserving its existing client mode, then composes letter-specific URL query state, cross-page selection, confirmation, progress, and retry UI around that neutral component.

This plan covers all five Must Have stories. It does not create `tasks.md`, change canonical authority, or begin implementation.

## Plan Brief

| Input | Planning fact |
| --- | --- |
| SpecKit spec | `specs/006-admin-data-table-enhancement/spec.md` |
| Product spec | `.product-forge/features/admin-data-table-enhancement/product-spec/` |
| Codebase analysis | `.product-forge/features/admin-data-table-enhancement/research/codebase-analysis.md` |
| Must Have stories | 5 (`US-001`–`US-005`) |
| Main integration points | 6: migration, Content repository/application/HTTP, worker/config, Operations public ports, shared DataTable, Lao-letter page/query layer |
| Key constraints | UUID-only API boundary; ADR-023 envelope; Content owns task state; Operations owns RBAC/audit; existing revision state machine remains authoritative; frozen migrations remain unchanged |
| Prior lessons forwarded | None — `research/README.md` has no section titled `Prior lessons that apply` |

## Technical Context

**Language/Version**: TypeScript 5.9; Node.js 22+; React 19.2  
**Primary Dependencies**: Fastify 5, Zod 4, PostgreSQL `pg` 8, TanStack Router 1.170, Query 5.102, Table 8.21, Base UI/shadcn primitives  
**Storage**: PostgreSQL 18; new Content tables only through `database/migrations/1340_content_letter_batch_tasks.sql`  
**Testing**: Vitest, Testing Library, PostgreSQL integration tests, Node database validation, Playwright + axe  
**Target Platform**: Linux/Node backend and worker; evergreen desktop browsers for the admin  
**Project Type**: pnpm monorepo web application with separate admin, API process, worker process, and database package  
**Performance Goals**: representative-data list query p95 ≤ 500 ms at 50 rows and p95 ≤ 1.5 s at 500 rows; no full result set returned to the browser; active-task status refresh no faster than once per 2 s per visible page  
**Constraints**: default/max page size 50/500; no product-level batch target limit; configured queue admission and worker concurrency; no cancellation or cleanup; only task creator may read/retry; no new event bus  
**Scale/Scope**: one admin page and one Content type (`lo_letter`), six HTTP operations, two new tables, one polling worker job, five batch actions  
**External Services**: none; PostgreSQL and the in-process Operations public interfaces are repository-internal dependencies

## Constitution Check

### Pre-design gate

| Principle / check | Status | Plan response |
| --- | --- | --- |
| I, II — authority before code | PASS | D-167, ADR-028, Content DB/API and versioning authority define behavior; current code is used only to locate deltas. |
| III, IV — stable and verifiable requirements | PASS | Existing `US-*`, `FR-010`–`FR-021`, `NFR-*`, `API-*` and acceptance IDs remain unchanged and are mapped below. |
| V — lifecycle state machines | PASS | Task and item transitions from the approved spec are implemented as explicit application guards and database checks, with transition/concurrency/retry tests. |
| VI — real contracts | PASS | The plan uses existing `contracts/openapi.yaml`, `contracts/asyncapi.yaml`, Content API and forward-migration authority; it does not fabricate implemented symbols. |
| VII — decision budget | PASS | API shape, DB fields, state transitions, permissions, ownership and error semantics are treated as LOCKED. Module decomposition and runtime tuning remain constrained implementation choices. |
| VIII — conflicts stop | PASS | No unresolved spec/authority conflict was found. Any material authority or migration drift after this plan is a stop condition. |
| IX, X — evidence and grounding | PASS | The verification sequence requires real PostgreSQL, contract, component and E2E evidence; this plan does not claim implementation evidence. |
| XI — single fact ownership | PASS | Content alone stores task/item facts; Operations is reached only through authorization/audit ports and owns no copy of task state. |

### Extended compliance checks

| Area | Status | Design response |
| --- | --- | --- |
| Resilience / timeout / degraded mode | PASS | No remote service is added. API requests retain `ApiClient` timeout/abort behavior; the worker uses durable PostgreSQL state, bounded polling, retryable admission errors, and restart recovery. |
| Rate limiting | PASS | Task admission checks a configured active-queue ceiling and returns `RATE_LIMITED` with `retry_after_seconds`; target count itself remains unlimited. |
| Data / privacy | PASS | Operator UUID and free-text reason are the only new potentially sensitive fields. They remain in Content storage, are never logged as payloads, and are visible only to the creator. Long retention and no deletion handler are locked product behavior. |
| Testing | PASS | Unit, PostgreSQL integration, HTTP contract, component, accessibility and E2E paths are sequenced below; each critical path has a named test target. |
| EDA | N/A | No broker event or handler is introduced; `asyncapi.yaml` intentionally stays empty. |
| Code quality | PASS | Domain-neutral table state remains in shared UI; Lao-letter rules remain feature-local; backend changes stay within Content plus narrow Operations ports, avoiding a dependency cycle. |

### Post-design gate

PASS. The detailed design below introduces no constitutional exception, so Complexity Tracking remains empty.

## Architecture and Data Flow

```text
TanStack Router search params
  -> Lao-letter query adapter / TanStack Query
  -> API-LettersQuery
  -> Content query use case
  -> parameterized PostgreSQL list + count

Page selection -> optional API-LettersSelectionPreview
  -> confirmation (action, scope, count, reason)
  -> API-LettersBatchStart + Idempotency-Key
  -> one Content transaction freezes task + every item
  -> PostgreSQL-backed Content worker
       -> recheck Operator + action permission through Operations public port
       -> one transaction per item
          -> reuse Content lifecycle command
          -> record Operations success audit through a transaction-aware port
          -> persist item outcome + task counters
  -> API-LettersBatchTask polling / API-LettersBatchRetry
  -> terminal-state list invalidation and visible result summary
```

The table never owns Content actions, permissions, query syntax, or the `query_all` descriptor. The Lao-letter page owns those feature rules and passes only controlled table state and page-local selection to the shared component.

## Delivery Workstreams and Dependency Order

1. **Lock tests and contract adapters first.** Add failing contract/unit tests for query normalization, the six stable `API-*` operations, state machines, URL serialization, and DataTable client compatibility.
2. **Add the `1340` forward migration and schema validation.** Create the two D-167 tables, checks and indexes; regenerate the backend required-migration manifest and database expected-schema/report inputs. Do not edit `0400`, `1240`, `1290`, `1310`, or any other applied migration.
3. **Build Content query and batch persistence ports.** Add the letter-specific query model/normalizer/hash function and transaction-bound task repository. Prove selection freezing, idempotency and counters against PostgreSQL before HTTP or UI wiring.
4. **Add worker-safe Operations ports and the Content batch processor.** Extend Operations with an operator-ID permission check and transaction-aware success audit method; then register the Content polling job and recovery logic in `build-worker.ts`.
5. **Mount all six HTTP operations.** Keep route validation strict, return ADR-023 envelopes through existing global handling, and test permissions, ownership, business codes and UUID-only output.
6. **Extend shared DataTable in compatible server mode.** Add optional controlled pagination/sorting/selection and server totals without changing defaults; preserve existing client tests before migrating the letter page.
7. **Integrate `/content/lo/letters`.** Add route search validation, typed APIs/query keys, query/filter toolbar, fixed selection/action columns, cross-page selection, confirmation, task progress/results, and terminal refresh.
8. **Run end-to-end and NFR verification last.** Exercise the three approved journeys, axe/keyboard cases, EXPLAIN/response-size budgets, queue recovery, duplicate delivery and cross-Operator access.

## Backend Design

### 1. Lao-letter query boundary (`US-001`, `FR-010`, `FR-011`, `FR-015`)

- Add a letter-specific application query type rather than widening `StructuredContentRepository.list()` for every Content category. Its Zod boundary accepts only `q`, four filter groups, one sort, one order, `page`, and `page_size` from the Content API whitelist.
- Normalize once in Content application code: NFC + trim `q`, deduplicate/sort multi-value filters, expand default `sort_order/asc`, and exclude `page/page_size` from the selection descriptor. Reuse the exact same normalizer for list, preview and task creation.
- Query `content.contents` plus the active working revision and published/materialized `content.lo_letters` fallback. Admin-visible/searchable/sortable letter fields come from the active revision snapshot when one exists, otherwise from the published/materialized letter row; this keeps never-published drafts visible without changing the physical fact owners. Return `content_id`, display fields, content/revision status, lock version, timestamps and safe action affordances. Never expose BIGINT IDs.
- Execute the filtered count and page query in one read-only `REPEATABLE READ` transaction so `items` and `total` describe one snapshot. Append `c.public_id ASC` to every ordering. If a requested page becomes empty, the server still returns its accurate total; the client replaces the URL with the nearest valid page.
- SQL fragments are selected from static maps. Values remain bound parameters; no column name, order token, JSON key or SQL expression comes from unchecked input.
- `batch_actions` is derived from the current Operator's coarse action permissions. Per-item eligibility and all worker execution still re-run the Content state machine and authorization.

### 2. Selection normalization and fingerprint (`US-003`, `FR-013`, `FR-014`, `NFR-003`)

- `explicit_ids`: parse UUIDs, reject duplicates/empty input, sort by canonical UUID text, check `expected_count`, resolve only `lo_letter` rows, and compute the stored hash server-side.
- `query_all`: recompute the normalized query and the complete, stably ordered Content UUID set inside the task-creation transaction. Compare both count and the opaque preview hash; any difference returns `BATCH_SELECTION_CHANGED` and writes nothing.
- Use one private versioned byte encoder for both preview and submission: explicit normalized query fields in a fixed order followed by newline-delimited sorted UUIDs, UTF-8 encoded, SHA-256 lowercase hex. The browser stores and returns the opaque hash but never reproduces it.
- Query changes that alter target membership or ordering clear the page's selection descriptor. Column visibility changes do not.

### 3. Task application service and idempotency (`US-004`, `US-005`, `FR-016`–`FR-018`, `FR-021`)

- A Content `LaoLetterBatchTaskService` owns `previewSelection`, `createTask`, `listOwnedTasks`, `getOwnedTask`, and `retryFailed`. HTTP routes contain parsing/mapping only.
- Task creation runs one transaction: check queue admission, look up `(requested_by_operator_id,idempotency_key)`, compare the persisted canonical request, freeze targets, insert the task and every item, and expose the task as `queued` only after all inserts succeed.
- Replaying the same key and canonical request returns the existing task. Reusing the key for a different action, reason, selection query/hash, count, or explicit UUID set returns `CONFLICT`.
- `reject` and `archive` require a trimmed non-empty reason; other actions reject a reason. `archive` changes only `contents.status` to `archived` and never deletes Content, revisions, structures, tasks or items.
- Owned history/detail queries always include `requested_by_operator_id`; use `NOT_FOUND` for another Operator's UUID to avoid existence disclosure. Retry additionally verifies the original action permission and locks task/items before resetting only `failed` rows and decrementing the corresponding counters.

### 4. Content worker and Operations seams (`FR-017`, `FR-018`, `FR-020`, `NFR-006`)

- Add a `LaoLetterBatchProcessor` polling job to the existing `WorkerHost`; do not add a broker or reuse the system outbox as a business-task store.
- Add environment-backed runtime settings with validated defaults: `CONTENT_LETTER_BATCH_POLL_INTERVAL_MS=1000`, `CONTENT_LETTER_BATCH_SIZE=50`, `CONTENT_LETTER_BATCH_CONCURRENCY=4`, `CONTENT_LETTER_BATCH_ACTIVE_TASK_LIMIT=100`, and `CONTENT_LETTER_BATCH_RETRY_AFTER_SECONDS=5`. These are deployment safeguards, not product selection limits.
- A cycle finds `queued` or recoverable `running` tasks and then processes at most 50 items with at most four concurrent item transactions. Each transaction selects one `queued` item with `FOR UPDATE SKIP LOCKED`, marks the task running, rechecks the Operator and required permission, re-fetches Content/Revision, invokes the same lifecycle domain behavior as the single-item path, records the Operations success audit, and commits the terminal item status plus counters.
- Extend the Operations public boundary narrowly: one worker-safe permission check by Operator logical UUID and one transaction-aware success-audit writer. Operations continues to own authorization queries and audit persistence; Content never imports an Operations repository or writes its tables directly.
- Keep mutation, successful audit, item terminal state and counter update in the same PostgreSQL transaction. This prevents an action from being committed without its required success audit and prevents retry from duplicating a committed success.
- A permission revocation maps untouched work to `skipped/FORBIDDEN`. A domain/state/concurrency failure maps only that item to `failed` with a safe business code/message. Unexpected task-level failure records `last_error_code` without a stack/SQL message and leaves uncommitted item work queued.
- No item claim commits in `running` independently of its business action; a process crash releases the row lock and rolls back that item. Tasks already marked `running` remain eligible while queued items exist, so restart recovery needs no lease column beyond the approved model.
- Finalization locks the task, recomputes counters from persisted item states, verifies the database invariant, and writes `completed` or `completed_with_issues`. A retry transition returns the same task to `queued`; `completed` and tasks without failed items return `BATCH_TASK_NOT_RETRYABLE`.

### 5. HTTP layer and error behavior (`FR-015`, `FR-016`, `FR-018`, `FR-021`)

- Add letter-only routes under `structured-admin-routes.ts` or a mounted sibling `lo-letter-batch-routes.ts`; a sibling plugin is preferred to keep generic category CRUD from knowing batch rules.
- Preserve the six operation IDs and request/response shapes already present in `contracts/openapi.yaml`: `API-LettersQuery`, `API-LettersSelectionPreview`, `API-LettersBatchStart`, `API-LettersBatchTaskList`, `API-LettersBatchTask`, `API-LettersBatchRetry`.
- Require `content.lo_letters.read` for list/preview/history/detail; map task actions to the exact `write/review/publish` permission from the Content API; recheck at submission and worker execution.
- Use the shared `AppError`/response envelope. All business responses are HTTP 200, include `request_id`, and expose only registered safe codes. Queue admission uses `RATE_LIMITED` with `error.details.retry_after_seconds`; stale selection and invalid retry use their registered codes.
- Continue `ApiClient` cancellation and timeout handling. There is no external downstream timeout or circuit breaker in this feature.

## Database Migration and Query Plan

- Create exactly `database/migrations/1340_content_letter_batch_tasks.sql` from the field/constraint contract in [data-model.md](./data-model.md). Both tables are in schema `content`; item-to-task is the only new physical FK. Operator and Content/Revision references remain logical UUIDs as approved.
- Add every documented CHECK: action/mode/status enums, positive counts/item numbers, reason conditionality, query JSON object, counter arithmetic, completed counter equality, timestamps consistent with terminal/running status, and `query_all` query presence. Use `ON DELETE RESTRICT` and provide no cleanup statement.
- Add the authoritative queue/history/item indexes plus query-support indexes for Lao-letter search and stable ordering. Candidate indexes to validate with real plans include trigram/B-tree indexes for the materialized letter fields, partial expression indexes for the same fields in active revision snapshots, and Content/list lookup indexes covering `(language,content_type,status,updated_at,public_id)`. Keep only indexes demonstrated useful by representative `EXPLAIN (ANALYZE, BUFFERS)` results.
- Regenerate `apps/backend/src/database/required-migrations.generated.ts`; update `database/checks/expected-schema.json` and database validation/report expectations to 133 total tables (131 business + 2 infrastructure), with Content at 38 tables. Do not hand-edit generated hashes. <!-- CR-001: correct derived table counts to the current 1330 repository baseline -->
- Verify a clean database and an upgrade from the current 1330 baseline. Re-applying 1340 must be a no-op through the migration runner; changing any already-applied migration must still fail checksum verification.

## Admin Design

### 1. Shared DataTable server mode (`US-002`, `US-003`, `NFR-005`)

- Extend `DataTable` with one optional controlled `server` configuration carrying pagination, sorting, row count/page count and change callbacks. When absent, retain the current internal sorting, pagination, filtering and row-selection behavior unchanged.
- In server mode, configure TanStack `manualPagination` and `manualSorting`, consume only the returned page, and let the owning page control `RowSelectionState`. `DataTablePagination` receives server totals and exposes 50/100/200/500 for this page without changing defaults for existing callers.
- Keep column visibility inside the shared component but permit a controlled value/change callback. Feature code marks selection and action columns `enableHiding: false`; the action cell/header uses sticky-right styling and the table container owns horizontal overflow.
- The generic table reports page-local selection only. It does not represent `query_all`, render Content action names, infer permissions, or send mutations.

### 2. Lao-letter page composition (`US-001`–`US-005`)

- Add strict TanStack Router search validation for the approved API fields. The route owns canonical URL state; search input may debounce navigation by 300 ms, while filters/sort/page-size update immediately and use replace-navigation for transient edits.
- Add feature-local DTO/Zod contracts, API wrappers and TanStack Query keys containing the normalized query plus page/page size. All requests use the shared `apiClient` and forward `AbortSignal`; no direct `fetch` or new global store.
- Store only column visibility as a non-sensitive local browser preference under a versioned Lao-letter key. Invalid/obsolete column IDs are ignored, and “恢复默认列” clears this preference. Query and selection never live in local storage.
- Model selection as `none | page_ids | query_all`. Page checkboxes use stable `content_id`; a contextual batch bar states the current scope/count and offers the explicit upgrade only after the whole current page is selected. Any target-changing query update resets to `none`.
- Render all five actions from server `batch_actions`, then show one Base UI confirmation dialog with action, normalized scope and count. `reject/archive` uses the existing Textarea/Input primitives with inline required validation; every other action forbids a reason. Generate one idempotency key per confirmation attempt and retain it across transport retry until the result is known.
- Show the active task in a Sheet or inline panel, with status summary and a server-paginated item table (20 default, 100 max). Poll every 2 s only while the page is visible and the task is `queued/running`; stop at terminal state, announce the result through `aria-live="polite"`, invalidate the current letter query, and correct an empty page to the nearest valid page.
- Keep task detail/history and failed-item retry limited to the creator by contract. Do not show cancel, online/offline, physical delete, export, or cross-content generic batch controls.
- Distinguish initial skeleton, background refresh, first empty list, no-filter match, recoverable request error, queued/running, completed and completed-with-issues states. Preserve valid URL state on retry.

## Contract Refinement

Planning introduces no FE↔BE endpoint or event beyond the bridge output, so:

- `contracts/openapi.yaml` remains unchanged and all six existing `API-*` IDs stay stable.
- `contracts/asyncapi.yaml` remains the explicit no-messaging declaration.
- No journey or `traceability.yml` contract reference needs alteration.

Implementation must validate the OpenAPI document against mounted routes and DTO schemas; any discovered contract/authority mismatch is a `SPEC_CONFLICT`, not permission to edit an existing `API-*` meaning during implementation.

## NFR Measurement Plan

| NFR | Design / instrumentation | Required evidence before verification |
| --- | --- | --- |
| NFR-001 Accessibility | Semantic table/caption/header scope, mixed checkbox, named pagination, focus-trapped confirmation, keyboard-operable sticky actions, polite live task state; reduced-motion compatible. | Vitest accessibility assertions; Playwright + axe with 0 serious/critical violations; keyboard-only JRN-001–003 record. |
| NFR-002 Security | Strict Zod/SQL whitelists, bound values, creator-scoped predicates, per-action submission and worker authorization, UUID-only DTOs, safe error mapping, reasons excluded from logs. | API tests for unknown fields, permission bypass, cross-Operator task access and error leakage; response snapshot contains no BIGINT/internal fields. |
| NFR-003 Integrity | One normalizer/hash implementation, transactional freeze, constraints, locked counter transitions and transaction-coupled audit. | PostgreSQL tests for stale preview, idempotency, concurrent retry/finalize, counter queries and exactly one audit per committed success. |
| NFR-004 Capacity | 50/500 API limits, indexed server query, active-task admission protection, batch 50/concurrency 4, 1 s worker poll and 2 s UI poll. | Boundary tests for 50/500/501; representative `EXPLAIN (ANALYZE, BUFFERS)`; p95 timings; queue saturation returns `RATE_LIMITED` with retry hint. |
| NFR-005 Compatibility | Server behavior is opt-in and client-mode state paths remain default. | Existing DataTable suite unchanged plus new controlled-mode tests; all existing callers compile and pass. |
| NFR-006 Durability | Task/items committed before execution; item work, audit and terminal status share one transaction; running tasks with queued items remain claimable after restart. | Kill/restart PostgreSQL integration test, duplicate polling/worker test, and retry evidence showing zero duplicate successful action/audit. |

## Test Strategy and Required Order

| Order | Layer | Critical coverage |
| ---: | --- | --- |
| 1 | Pure unit | Query parsing/normalization, hash determinism, action-to-permission mapping, reason rules, task/item legal and illegal transitions, terminal guards (`TC-001`, `TC-002`, `TC-007`). |
| 2 | Migration/database | Clean + upgrade migration, all constraints/indexes, logical UUID boundaries, frozen target creation, same/different idempotency key, counter invariants and selection drift (`TC-003`, `TC-004`). |
| 3 | Worker PostgreSQL integration | Mixed outcomes, four-way concurrent claims, permission revocation, atomic audit, crash rollback/restart, failed-only retry and finalization (`TC-005`, `TC-006`, `TC-008`, `TC-010`). |
| 4 | HTTP contract/security | Every `API-*`, strict query/body validation, 50/500/501, ADR-023 envelope/request ID, ownership hiding, `RATE_LIMITED`, `BATCH_*` codes and no internal ID leakage (`TC-001`, `TC-003`, `TC-004`, `TC-009`). |
| 5 | Shared admin components | Existing client mode, controlled server pagination/sort, server totals, page-local mixed selection, non-hideable fixed columns and loading/empty/error states (`TC-011`). |
| 6 | Lao-letter feature integration | Router serialization/reset, query cancellation, selection invalidation, confirmation/reason, idempotent retry, task polling/terminal invalidation and empty-page fallback. |
| 7 | Playwright E2E + accessibility | `TC-E2E-001` query/columns; `TC-E2E-002` query-all/approve; `TC-E2E-003` required reason/stale selection/partial failure/retry; axe and keyboard coverage (`TC-012`). |
| 8 | NFR/performance regression | 50/500 response timing and size, query plan/index evidence, queue saturation/recovery, zero duplicate audit, full backend/admin/database verification suites. |

Tests at each layer must pass before beginning the next dependent implementation slice. Database/HTTP integration tests require a disposable real PostgreSQL instance; mocks are insufficient evidence for transaction, locking, migration or recovery requirements.

## Story and Requirement Coverage

| Story | Requirements | Planned implementation | Verification |
| --- | --- | --- | --- |
| US-001 | FR-010, FR-011, FR-019 | Letter query service, strict URL search state, server DataTable, page correction and explicit states | TC-001, TC-E2E-001 |
| US-002 | FR-012 | Controlled visibility, local preference, non-hideable selection/action columns, sticky action column | FR-012-AS01, TC-E2E-001 |
| US-003 | FR-013, FR-014, FR-021 | Page-local mixed selection, explicit query-all preview, shared normalizer/hash and stale rejection | TC-002, TC-003, TC-E2E-002/003 |
| US-004 | FR-015, FR-016, FR-017, FR-020, FR-021 | Permission-driven actions, confirmation/reason, transactional freeze, worker execution and audit | TC-004–TC-007, TC-E2E-002/003 |
| US-005 | FR-017–FR-021 | Owned task history/detail, polling, partial result states, failed-only retry and restart recovery | TC-005, TC-008–TC-010, TC-E2E-003 |

Coverage: **5/5 Must Have stories**, **12/12 functional requirements**, and **6/6 NFRs**.

## Project Structure

### Documentation (this feature)

```text
specs/006-admin-data-table-enhancement/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    ├── openapi.yaml
    └── asyncapi.yaml
```

### Source code (planned deltas)

```text
database/
├── migrations/
│   └── 1340_content_letter_batch_tasks.sql
├── checks/
└── test/

apps/backend/
├── src/
│   ├── config/{schema.ts,env.ts}
│   ├── bootstrap/build-worker.ts
│   ├── database/required-migrations.generated.ts
│   └── modules/
│       ├── content/
│       │   ├── application/{ports,use-cases}/
│       │   ├── domain/
│       │   ├── infrastructure/
│       │   └── http/
│       └── operations/public/
└── test/
    ├── modules/content/
    └── integration/

apps/admin/
├── src/
│   ├── app/router/router.tsx
│   ├── components/data-table/
│   └── features/content/
│       ├── alphabet/
│       └── structured/
└── e2e/content-management.spec.ts
```

**Structure Decision**: retain the existing monorepo boundaries. Database DDL stays in the database package; Content owns list/task/worker behavior; Operations changes only its public authorization/audit seam; shared admin components remain domain-neutral; Lao-letter UI behavior stays feature-local.

## Risks and Stop Conditions

| Risk | Mitigation / stop condition |
| --- | --- |
| A 500-row query or broad substring search scans excessively | Keep server pagination, validate representative query plans, add only evidence-backed indexes; fail the NFR gate if p95/plan budgets are missed. |
| Unlimited target sets exhaust queue/storage | Stream/iterate target UUID inserts inside one transaction without returning them to the client, enforce active-task admission, process bounded batches, and monitor queue age/depth. The target count remains product-unlimited. |
| Audit and Content mutation diverge | Use the transaction-aware Operations public writer inside each item transaction. If Operations cannot expose this seam without violating ownership, stop as `IMPLEMENTATION_BLOCKER`. |
| Existing single-item route behavior drifts from ADR-023 or current structured routes | New endpoints use the frozen envelope. Do not broaden this feature into unrelated legacy migration; stop on a contract collision affecting the six operations. |
| Concurrent retry/finalization duplicates work | Lock task/item rows, allow only `failed -> queued`, couple state/action/audit in one transaction, and require multi-worker integration evidence. |
| Shared DataTable change breaks current callers | Keep server mode opt-in, establish regression tests before integration, and do not replace existing client defaults. |
| Authority or migration changes after plan generation | Re-ground D-167, ADR-028, Content DB/API, current migration manifest and HEAD before tasks/implementation; material drift is `REPOSITORY_DRIFT` and must stop. |

## Complexity Tracking

No constitutional violations or additional project boundaries are required.
