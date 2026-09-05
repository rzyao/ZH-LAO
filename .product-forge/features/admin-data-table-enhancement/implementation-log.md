# Implementation Log — 管理端通用数据表增强

## Start

- Started at: 2026-09-05T01:18:34+08:00
- Tasks: 58 total, 1 completed, 57 remaining
- Optional pre-implementation review: skipped because the user explicitly requested code implementation
- Red gate: pending; every marked unit/contract test task must be confirmed failing before its implementation task
- Dependency baseline: no new dependency planned

## T001 — Repository and authority drift check

- Result: PASS
- HEAD remains `79feb6f7b82221da52e8f6bc1cd5f67d4694b415`.
- `database/migrations/1340_content_letter_batch_tasks.sql` does not exist and sequence 1340 is available.
- All six approved `API-Letters*` operation IDs remain present and unchanged.
- Existing unrelated working-tree changes were detected; implementation must preserve them. The planned Operations public index already has an unrelated `AdminOperatorWriter` export that must remain intact.
- Ignore configuration already covers Node build output, dependencies, logs, environment files and coverage; no ignore-file edit is needed.

## Checkpoint #1 — After tasks T001–T003

| Check | Status | Notes |
|-------|:------:|-------|
| Task-Code correspondence | ✅ | T001 evidence is recorded; all three T002/T003 target files exist and contain the planned seeded database and admin API fixtures. |
| Spec AC alignment | ✅ | The fixtures cover multi-page Lao letters, multiple Operators, working revisions, mixed states, query-all preview, task summaries and succeeded/failed/skipped item results needed by US-001–US-005 tests. |
| Unplanned changes | ✅ None | Only the three paths declared by T002/T003 changed for this implementation slice. |
| Plan alignment | ✅ | Test support is split by backend/admin workspace and contains no production behavior or cross-domain persistence shortcut. |
| Dependency / supply-chain (W5-C2) | ✅ None added | Existing Node/PostgreSQL/test dependencies only. |

**Verdict:** WARNING — continue. Backend/admin typecheck, targeted ESLint and existing Content/admin contract tests passed; `ADMIN_DATABASE_URL` is not configured, so live PostgreSQL fixture execution is deferred to the upcoming database integration red gate.

## Red gate — T004 database contract tests

- Test-first task: T004
- Command: `node --test test/content-letter-batch-tasks.test.mjs test/validate.test.mjs` from `database/`
- Result before T005: confirmed failing with exit code 1.
- Expected failure: `ENOENT` for the absent `database/migrations/1340_content_letter_batch_tasks.sql`.
- PostgreSQL-dependent cases were skipped because `ADMIN_DATABASE_URL` is not configured; static syntax and diff checks passed.
- Decision: red gate satisfied for the migration slice; T005 may begin.

## CR-001 — Correct derived database table counts

- Discovery: the current 1330 baseline contains 129 business tables plus 2 infrastructure tables; adding the two approved Content tables produces 131 business / 133 total / 38 Content.
- Conflict: the approved plan and T006 incorrectly said 129 total. Satisfying that stale arithmetic would require deleting four existing tables and is forbidden.
- Decision: user approved the corrected 133/131/38 baseline.
- Impact: no feature, FR, API, schema-field or task-count change; only plan/task/validation/migration-planning arithmetic is corrected.

## Checkpoint #2 — After tasks T004–T006

| Check | Status | Notes |
|-------|:------:|-------|
| Task-Code correspondence | ✅ | The T004 contract tests, authoritative 1340 migration, expected-schema update and generated backend manifest all exist at their declared paths. |
| Spec AC alignment | ✅ | D-167/ADR-028 two-table ownership, logical UUID boundary, constraints, approved indexes and forward-only migration rules are implemented. |
| Unplanned changes | ✅ None | Implementation changes are limited to the T004–T006 paths plus approved CR-001 coordination artifacts. |
| Plan alignment | ✅ | One forward migration follows the 1330 baseline; no frozen migration changed and no cross-domain FK was introduced. |
| Dependency / supply-chain (W5-C2) | ✅ None added | Existing PostgreSQL and Node test tooling only. |

**Verdict:** CLEAN — continue. `database pnpm test` passed 9/9 with zero skips against real PostgreSQL; clean install, 1330→1340 upgrade, constraint/index checks, repeated no-op, validate cleanup, manifest check and backend typecheck all passed.

## Red gate — T007 domain rules

- Test-first task: T007
- Command: `pnpm exec vitest run test/modules/content/lo-letter-query.unit.test.ts test/modules/content/lo-letter-batch-state.unit.test.ts` from `apps/backend/`
- Result before T008: confirmed failing with exit code 1.
- Expected failures: missing `lo-letter-admin-query.js` and `lo-letter-batch-task.js`, which T008 is responsible for creating.
- Coverage locked before implementation: NFC/trim/defaults/deduplication, page exclusion, versioned UTF-8 hash payload, stable UUID ordering, five action permissions, reason rules, task/item transitions and failed-only retry.
- Decision: red gate satisfied for the domain-foundation slice; T008 may begin.

## Checkpoint #3 — After tasks T007–T009

| Check | Status | Notes |
|-------|:------:|-------|
| Task-Code correspondence | ✅ | Two domain modules, their exports, and the Content application port exist at every declared T008/T009 path; T007 tests exercise them. |
| Spec AC alignment | ✅ | Normalization/hash, five action permissions, reason rules and task/item transitions match FR-014, FR-016, FR-017 and FR-021. |
| Unplanned changes | ✅ None | Only T007–T009 declared paths changed. |
| Plan alignment | ✅ | Content domain remains independent; the application port depends only on Content domain and the shared database executor, not Operations repositories. |
| Dependency / supply-chain (W5-C2) | ✅ None added | Uses existing Node crypto, Zod and repository database abstractions. |

**Verdict:** CLEAN — continue. T007 tests passed 18/18; related Content tests passed 27/27; backend typecheck, lint and architecture checks passed.

## Red gate — T010 worker configuration

- Test-first task: T010
- Command: `pnpm exec vitest run test/unit/config.test.ts` from `apps/backend/`
- Result before T011: confirmed failing with exit code 1; 7 existing tests passed and 12 new tests failed as expected.
- Expected failure: `config.contentLetterBatch` is absent and invalid `CONTENT_LETTER_BATCH_*` inputs are not yet rejected.
- Coverage locked before implementation: five defaults, frozen result, valid minimum integer bounds, zero/below-minimum/fractional/non-numeric rejection.
- Decision: red gate satisfied for configuration; T011 may begin.

## Red gate — T012 Lao-letter server list

- Test-first task: T012
- HTTP command: `pnpm exec vitest run test/modules/content/lo-letter-admin-http.contract.test.ts` from `apps/backend/`; confirmed 7/7 failing because `API-LettersQuery` is not mounted and returns `NOT_FOUND`.
- PostgreSQL command: `pnpm exec vitest run test/modules/content/lo-letter-query.integration.test.ts`; confirmed suite load failure because `postgres-lo-letter-admin-repository.js` does not yet exist.
- Coverage locked before implementation: default 50, max 500, 501 rejection, strict whitelist, filtered sorting, accurate total, working-revision precedence, UUID tie-break, repeatable-read snapshot and safe DTOs.
- Decision: red gate satisfied for US-001 backend list; T016–T018 may begin after the remaining US-001 test tasks.

## Checkpoint #4 — After tasks T010–T012

| Check | Status | Notes |
|-------|:------:|-------|
| Task-Code correspondence | ✅ | Config tests and implementation exist; both T012 backend test files exist and fail only on the deliberately missing query repository/route. |
| Spec AC alignment | ✅ | Runtime safeguards match NFR-004, and T012 locks the FR-010/FR-011 server query contract before implementation. |
| Unplanned changes | ✅ None | Only declared T010–T012 paths changed. |
| Plan alignment | ✅ | Configuration is environment-backed and query tests require the planned Content repository plus strict HTTP boundary. |
| Dependency / supply-chain (W5-C2) | ✅ None added | Existing Zod, Vitest and PostgreSQL tooling only. |

**Verdict:** CLEAN — continue. Config tests passed 19/19 and backend typecheck passed; both T012 red failures were confirmed for the intended missing implementations.

## Red gate — T013–T015 US-001 admin and journey tests

- T013: `data-table.test.tsx` keeps 6 existing/client tests green while 2 server-mode tests fail because external totals/state and sorting callbacks are not implemented.
- T014: contracts retain 2 existing passes and add 4 expected failures for missing typed Lao-letter APIs; page suite fails on the missing T022 module; router retains 8 passes and adds 2 expected URL/reset failures.
- T015: TC-E2E-001 fails because current Lao-letter list requests do not carry the URL query string.
- Targeted ESLint and diff checks passed; no production file changed in this slice.

## Checkpoint #5 — After tasks T013–T015

| Check | Status | Notes |
|-------|:------:|-------|
| Task-Code correspondence | ✅ | Every declared test path exists and contains the relevant failing assertions/scenario. |
| Spec AC alignment | ✅ | Tests lock US-001 server browsing, URL recovery and state distinctions plus DataTable compatibility before implementation. |
| Unplanned changes | ✅ None | Only T013–T015 declared test paths changed. |
| Plan alignment | ✅ | Generic DataTable tests remain domain-neutral; Lao-letter URL/API behavior remains feature-local. |
| Dependency / supply-chain (W5-C2) | ✅ None added | Existing Vitest, Testing Library and Playwright only. |

**Verdict:** CLEAN — continue. All new failures are attributable to T019–T022 not yet being implemented, while existing compatibility assertions remain green.

## Checkpoint #6 — After tasks T016–T018

| Check | Status | Notes |
|-------|:------:|-------|
| Task-Code correspondence | ✅ | Declared repository, query use case, HTTP route and composition exports exist and contain the completed implementation. |
| Spec AC alignment | ✅ | FR-010 and FR-011 now have strict server-side query, filtering, sorting, stable pagination and HTTP contract coverage. |
| Unplanned changes | ✅ None | Only declared T016–T018 paths changed. |
| Plan alignment | ✅ | Uses read-only REPEATABLE READ, static SQL, Content application orchestration and a thin HTTP boundary as planned. |
| Dependency / supply-chain (W5-C2) | ✅ None added | Existing repository, Zod, Fastify and PostgreSQL tooling only. |

**Verdict:** CLEAN — continue. HTTP contract tests passed 7/7, real PostgreSQL integration tests passed 7/7, related Content tests passed 48/48, and backend typecheck, lint, architecture and diff checks passed.

## Checkpoint #7 — After tasks T019–T021

| Check | Status | Notes |
|-------|:------:|-------|
| Task-Code correspondence | ✅ | Shared DataTable server controls, typed Lao-letter contracts/API/query keys and strict URL state handling exist in every declared path. |
| Spec AC alignment | ✅ | FR-010/FR-011 foundations cover opt-in server paging/sorting, normalized cached queries, AbortSignal propagation, 300 ms search navigation and page reset. |
| Unplanned changes | ✅ None | Production changes are confined to T019–T021 paths; prior T014 tests were only adjusted to remain valid red-gate coverage for T022. |
| Plan alignment | ✅ | Domain-neutral server behavior remains in the shared table while Lao-letter schemas and URL behavior remain feature-local. Existing client-mode behavior stays the default. |
| Dependency / supply-chain (W5-C2) | ✅ None added | Existing TanStack, Zod, React and component dependencies only. |

**Verdict:** CLEAN — continue. T019–T021 targeted suites passed 25/25, admin typecheck passed, lint reported zero errors, and diff checks passed. T022 remains correctly red because the composed Lao-letter page module is not implemented yet.

## Red gate — T023 controlled column visibility and fixed columns

- Test-first task: T023
- Command: `pnpm exec vitest run src/components/data-table/data-table.test.tsx src/features/content/structured/lo-letter-page.test.tsx` from `apps/admin/`
- Result before T024: confirmed failing with 6 failures and 13 passes.
- Expected failures: controlled `{name: false}` did not hide the column; Lao-letter preference/column modules and sticky interaction behavior reserved for T025/T026 were absent.
- Decision: red gate satisfied for the shared T024 slice. After T024, shared DataTable tests pass 10/10; four feature-local failures intentionally remain for T025/T026.

## Checkpoint #8 — After tasks T022–T024

| Check | Status | Notes |
|-------|:------:|-------|
| Task-Code correspondence | ✅ | The declared Lao-letter table, category route integration, test coverage, controlled visibility and view-options behavior exist. |
| Spec AC alignment | ✅ | US-001 is independently functional; the shared portion of FR-012 now supports controlled visibility while non-hideable feature columns remain for T025/T026. |
| Unplanned changes | ⚠️ 1 file | `admin:src/features/content/structured/lo-letter-page.tsx` is a necessary thin URL/query orchestration adapter required by the T014 test module; core table behavior remains in the declared T022 path. |
| Plan alignment | ✅ | Uses the planned shared CMP-DataTable/CMP-DataTablePagination plus feature-local querying and URL orchestration; no domain behavior moved into the generic table. |
| Dependency / supply-chain (W5-C2) | ✅ None added | Existing TanStack, Base UI, React and design-system components only. |

**Verdict:** WARNING — continue. T022 page and Router/contract coverage pass; T024 shared DataTable tests pass 10/10. Four intentionally failing T023 assertions remain scoped to T025/T026, and the extra thin page adapter is recorded for final verification.

## Red gate — T027 query-all selection preview

- Test-first task: T027
- PostgreSQL command: selection integration suite executed with `ADMIN_DATABASE_URL` loaded from `database/.env`; suite initialization failed for the intended missing `manage-lo-letter-selection.js` module, not because of an unavailable database.
- HTTP command: selection preview additions produced 2 expected failures while all 7 existing Lao-letter query contract tests stayed green; the unimplemented endpoint returned `NOT_FOUND`.
- Coverage locked before implementation: canonical semantic query/hash equivalence, full UUID-set count/hash, and stale count/hash rejection with zero task/item writes.
- Decision: red gate satisfied for T030/T031.

## Checkpoint #9 — After tasks T025–T027

| Check | Status | Notes |
|-------|:------:|-------|
| Task-Code correspondence | ✅ | Versioned preference, dedicated columns, sticky/focus implementation and both T027 test paths exist. |
| Spec AC alignment | ✅ | FR-012 is complete; T027 locks FR-014/FR-021 query-all integrity and stale-selection zero-write behavior before implementation. |
| Unplanned changes | ✅ None | Only declared T025–T027 paths changed. |
| Plan alignment | ✅ | Feature-local storage and column policy remain outside the generic table; selection preview remains server-authoritative and test-only at this point. |
| Dependency / supply-chain (W5-C2) | ✅ None added | Existing browser storage, React, TanStack and PostgreSQL test tooling only. |

**Verdict:** CLEAN — continue. US-002 suites pass 19/19, admin targeted regression passes 36/36, typecheck passes, lint has zero errors, and T027 is confirmed red against a real PostgreSQL environment for the intended missing service/route.

## Red gate — T028/T029 page-local and query-all selection

- T028 component command: `pnpm exec vitest run src/components/data-table/data-table.test.tsx src/features/content/structured/lo-letter-selection.test.tsx`; confirmed 5 failures and 10 passes before selection implementation.
- T028 expected failures: header checkbox lacked mixed state, controlled row-selection callback was absent, and the feature-local selection module did not exist.
- T029 Playwright: both discovered Chromium scenarios ran and failed for the intended missing behavior — TC-E2E-002 could not find the page-selection status and TC-E2E-003 timed out waiting for the explicit 126-item query-all upgrade.
- Decision: red gates satisfied for T032/T033; T030 may implement server selection resolution independently.

## Checkpoint #10 — After tasks T028–T030

| Check | Status | Notes |
|-------|:------:|-------|
| Task-Code correspondence | ✅ | Both component/E2E red test paths and the repository plus selection-management use case exist with relevant changes. |
| Spec AC alignment | ✅ | T028/T029 lock FR-013/FR-014 interaction boundaries; T030 passes full-set semantic hash and stale zero-write behavior for FR-014/FR-021. |
| Unplanned changes | ✅ None | Only declared T028–T030 paths changed. |
| Plan alignment | ✅ | Fixed-field SHA-256 encoding excludes page parameters, uses full UUID resolution, and revalidates query-all inside the caller transaction. |
| Dependency / supply-chain (W5-C2) | ✅ None added | Existing Node crypto, PostgreSQL, Vitest and Playwright tooling only. |

**Verdict:** CLEAN — continue. Real PostgreSQL selection tests pass 2/2, relevant domain tests pass 18/18, backend and admin checks pass, while preview HTTP and front-end selection remain intentionally red for T031–T033.

## Checkpoint #11 — After tasks T031–T033

| Check | Status | Notes |
|-------|:------:|-------|
| Task-Code correspondence | ✅ | Preview HTTP, shared controlled selection and the feature-local selection state/banner exist in every declared path. |
| Spec AC alignment | ✅ | FR-013 is complete; FR-014 preview, explicit upgrade and synchronous query invalidation are implemented while batch-start stale handling remains for the next story. |
| Unplanned changes | ✅ None | Only declared T031–T033 paths changed. |
| Plan alignment | ✅ | Generic DataTable remains query-all agnostic; normalized selection and upgrade behavior stay in Content/backend and Lao-letter feature layers. |
| Dependency / supply-chain (W5-C2) | ✅ None added | Existing TanStack, React, Zod and PostgreSQL dependencies only. |

**Verdict:** CLEAN — continue. Backend HTTP passes 9/9, real PostgreSQL selection passes 2/2, admin selection/page suites pass 24/24 and TC-E2E-002 passes. TC-E2E-003 now reaches the intentionally missing T034+ batch archive action.

## Red gate — T034–T036 batch creation, worker and audit

- T034 real PostgreSQL suite created and migrated its database, then failed for the intended missing `postgres-lo-letter-batch-repository.js`; coverage includes frozen targets, zero count, active limit, idempotency, reason rules, query drift and persisted counters.
- T035 kept all 9 existing list/preview HTTP tests green while 19 new batch-start assertions failed because the route returned `NOT_FOUND`.
- T036 real PostgreSQL worker suite failed for the intended missing `process-lo-letter-batch.js`; Operations integration failed specifically because transaction-bound permission recheck and success-audit functions do not yet exist.
- Decision: red gates satisfied for T038–T043.

## Checkpoint #12 — After tasks T034–T036

| Check | Status | Notes |
|-------|:------:|-------|
| Task-Code correspondence | ✅ | All four declared PostgreSQL/HTTP/Operations test files exist with the required failure coverage. |
| Spec AC alignment | ✅ | Tests lock FR-014–FR-017, FR-020 and FR-021 around immutable targets, permissions, idempotency, rate limits, isolated items and atomic success audit. |
| Unplanned changes | ✅ None | Only declared T034–T036 paths changed. |
| Plan alignment | ✅ | Tests require durable PostgreSQL queue state, SKIP LOCKED worker claims and Operations-owned transactional authorization/audit boundaries. |
| Dependency / supply-chain (W5-C2) | ✅ None added | Existing Vitest and PostgreSQL tooling only. |

**Verdict:** CLEAN — continue. All red suites reached a migrated real database or live HTTP composition and failed only for the deliberately missing T038–T043 implementations; existing backend checks remain green.

## Red gate — T037 server-driven batch confirmation

- Command: `pnpm exec vitest run src/features/content/structured/lo-letter-batch-actions.test.tsx` from `apps/admin/`.
- Result before UI implementation: 9/9 expected failures because `lo-letter-batch-actions` does not exist.
- Coverage locked: only server actions, no online/offline controls, confirmation for all five actions, trimmed required reason for reject/archive, and stable idempotency key across transport-unknown retry.
- Decision: red gate satisfied for T044.

## Checkpoint #13 — After tasks T037–T039

| Check | Status | Notes |
|-------|:------:|-------|
| Task-Code correspondence | ✅ | Admin red tests, PostgreSQL batch repository and createTask service/export exist in the declared paths. |
| Spec AC alignment | ✅ | T037 locks FR-015/FR-016 UI safeguards; T038/T039 implement frozen targets, idempotency, admission limit, reason and selection validation for FR-014–FR-017. |
| Unplanned changes | ⚠️ 1 file | `backend:src/errors/business-codes.ts` registers the already specified `BATCH_SELECTION_CHANGED` code so the application error can pass the shared manifest; no new behavior was invented. |
| Plan alignment | ✅ | Uses a transaction-scoped advisory admission lock, canonical request replay checks and atomic task/item persistence before queuing. |
| Dependency / supply-chain (W5-C2) | ✅ None added | Existing PostgreSQL, domain error and admin test dependencies only. |

**Verdict:** WARNING — continue. Real PostgreSQL task tests pass 10/10 and selection tests pass 2/2; type, manifest, lint and architecture checks pass. T037 remains intentionally red until T044.

## Checkpoint #14 — After tasks T040–T042

| Check | Status | Notes |
|-------|:------:|-------|
| Task-Code correspondence | ✅ | Operations boundary, worker processor/repository and WorkerHost registration exist and are exercised by T036. |
| Spec AC alignment | ✅ | FR-017/FR-020 now enforce SKIP LOCKED claims, permission-revocation skips, isolated item transactions and atomic successful audit/counter updates. |
| Unplanned changes | ⚠️ 2 implementation paths | Operations service gained the concrete transaction methods behind its declared public contract, and Content worker wiring was separated into `backend:src/modules/content/worker/composition.ts` instead of leaving worker concerns in HTTP composition. |
| Plan alignment | ✅ | Operations still owns authorization queries/audit persistence; Content owns task execution. Polling uses WorkerHost configuration without a new broker or outbox business store. |
| Dependency / supply-chain (W5-C2) | ✅ None added | Existing worker, PostgreSQL and domain service dependencies only. |

**Verdict:** WARNING — continue. Real PostgreSQL worker and Operations atomic-audit suites pass 5/5, backend typecheck/manifest pass, and scoped diff checks pass. The two extra implementation paths are necessary concrete adapters for the declared boundaries and are recorded for final verification.

## Red gate — T045 owned history/detail/retry APIs

- Real PostgreSQL: 10 existing batch-task tests remained green; 2 new tests failed for the intended absent `listOwned` and `findOwned` repository methods.
- HTTP: 29 existing and ownership-semantics assertions remained green; 3 new list/detail/retry calls failed with `NOT_FOUND` because T051 routes do not exist.
- Coverage locked: status-filtered owner history, stable task/item pagination, non-disclosing cross-operator lookup and safe envelopes/business codes for all three APIs.
- Decision: red gate satisfied for T049–T051.

## Checkpoint #15 — After tasks T043–T045

| Check | Status | Notes |
|-------|:------:|-------|
| Task-Code correspondence | ✅ | Batch-start HTTP, admin action UI/API/page integration and both owned-history red test paths exist. |
| Spec AC alignment | ✅ | FR-015/FR-016 are complete and FR-017/FR-020 start flow is wired; T045 locks FR-018 ownership/history/retry boundaries before implementation. |
| Unplanned changes | ⚠️ 4 integration paths | Backend composition/main and admin query/page adapters were necessarily updated to inject and consume the declared T043/T044 route and API surfaces. |
| Plan alignment | ✅ | Strict ADR-023 HTTP boundary calls the Content application service; admin actions are server-driven and use the existing Base UI confirmation system. |
| Dependency / supply-chain (W5-C2) | ✅ None added | Existing Fastify/Zod, React Query and Base UI dependencies only. |

**Verdict:** WARNING — continue. Batch-start HTTP passes 28/28 and admin action suites pass 21/21. T045 is correctly red only for the intentionally missing owner repository methods and history/detail/retry routes.

## Red gate — T046–T048 task lifecycle and observation

- T046 real PostgreSQL covers finalization, zero duplicate success/audit, crash rollback/restart, failed-only retry, illegal retry and concurrent retry/finalize. Expected failure is the missing `requeueOwnedFailedItems` method; newly exercised finalization/crash paths already pass.
- T047 admin suite is 8/8 expected red because the batch task panel module is absent; it locks 2-second polling, terminal stop, aria-live, history invalidation, result paging/filtering and failed-only retry.
- T048 Chromium runs and fails after task creation because no task UUID/history panel is visible; the scenario also asserts mixed results, creator-only visibility, failed-only retry and no cancel affordance.
- Decision: red gates satisfied for T049–T054.

## Checkpoint #16 — After tasks T046–T048

| Check | Status | Notes |
|-------|:------:|-------|
| Task-Code correspondence | ✅ | Worker/audit lifecycle tests, task-panel tests and completed E2E journey assertions exist in all declared paths. |
| Spec AC alignment | ✅ | FR-017–FR-021 lifecycle, ownership, observability and retry expectations are locked before implementation. |
| Unplanned changes | ✅ None | Only declared T046–T048 paths changed. |
| Plan alignment | ✅ | Tests require durable PostgreSQL recovery and owner-scoped polling/retry without a cancel operation. |
| Dependency / supply-chain (W5-C2) | ✅ None added | Existing Vitest, PostgreSQL, React Testing Library and Playwright tooling only. |

**Verdict:** WARNING — continue. Red gates are correct, but an existing worker timing assertion (`completed_at >= last_attempt_at`) is intermittently sensitive to database clock boundaries; focused reruns have passed and the production path was not changed in this test-only slice.

## Checkpoint #17 — After tasks T049–T051

| Check | Status | Notes |
|-------|:------:|-------|
| Task-Code correspondence | ✅ | Owner-scoped repository, lifecycle application methods and all three HTTP routes exist in the declared paths. |
| Spec AC alignment | ✅ | FR-017/FR-018 backend behavior now covers stable owner pagination, non-disclosure, failed-only retry, finalization, crash recovery and no duplicate successful work. |
| Unplanned changes | ⚠️ 3 integration paths | HTTP composition/main inject the new service and the shared business-code registry adds `BATCH_TASK_NOT_RETRYABLE`; these are required adapters for T051 and the specified error. |
| Plan alignment | ✅ | PostgreSQL row locks and stable orderings preserve durable task invariants; HTTP applies read plus original-action authorization and creator predicates. |
| Dependency / supply-chain (W5-C2) | ✅ None added | Existing PostgreSQL, Fastify, Zod and application dependencies only. |

**Verdict:** WARNING — continue. Real PostgreSQL task/worker suites pass 19/19, HTTP contracts pass 32/32, Operations/domain tests pass 14/14, and timestamps now use PostgreSQL `clock_timestamp()` while retaining the invariant.

## Checkpoint #18 — After tasks T052–T054

| Check | Status | Notes |
|-------|:------:|-------|
| Task-Code correspondence | ✅ | Admin task DTO/API/query, active panel and terminal refresh integration exist in every declared path. |
| Spec AC alignment | ✅ | FR-017–FR-019 are complete: owner-visible progress, 2-second active polling, terminal stop, partial outcomes, failed-only retry and no cancellation controls. |
| Unplanned changes | ⚠️ 2 integration paths | The thin Lao-letter page adapter hosts the actual category integration, and shared `api-error.ts` exposes safe business details needed for stale-selection recovery. |
| Plan alignment | ✅ | React Query owns polling/invalidation, terminal statuses stop polling, and feature-local UI preserves URL query state while refreshing the server list. |
| Dependency / supply-chain (W5-C2) | ✅ None added | Existing React Query, Zod, React and Base UI dependencies only. |

**Verdict:** WARNING — continue. Admin task panel passes 8/8, relevant component suites pass 35/35 and Chromium TC-E2E-003 passes both stale-selection and mixed-result/retry scenarios.

## Checkpoint #19 — After tasks T055–T057

| Check | Status | Notes |
|-------|:------:|-------|
| Task-Code correspondence | ⚠️ | T055 and T057 declared evidence paths were exercised. T056 performance evidence lives in the purpose-built backend PostgreSQL query integration suite and this log rather than changing the database migration/test files; the 1340 candidate-index verdict is still explicitly recorded. |
| Spec AC alignment | ✅ | All three E2E journeys, keyboard interactions, 12-page axe scan, query performance and queue/security observability match FR-010–FR-021 delivery expectations. |
| Unplanned changes | ⚠️ 5 paths | Router normalization fixes E2E-discovered CSV refresh drift; query integration stores performance evidence; Content worker/repository/port plus `worker.ts` expose metrics and fix reservation accounting. |
| Plan alignment | ✅ | Performance evidence favors existing PK/revision indexes and low-cost scan at 501 rows; no speculative trigram/expression index was added. Metrics expose aggregates only. |
| Dependency / supply-chain (W5-C2) | ✅ None added | Existing Playwright/axe, PostgreSQL and worker metrics facilities only. |

**Verdict:** WARNING — continue to full verification. Chromium E2E/axe passes 5/5 with zero serious/critical; PostgreSQL query tests pass 8/8 with p95 3.21–8.09 ms; queue/security suites pass 44/44 and worker tests pass 8/8.

## Checkpoint #20 — After task T058

| Check | Status | Notes |
|-------|:------:|-------|
| Task-Code correspondence | ✅ | Every T001–T058 task is checked, uniquely logged and represented in traceability; all declared T058 workspace suites were executed. |
| Spec AC alignment | ✅ | FR-010–FR-021 all have implementation and test evidence; strict traceability reports zero errors and zero warnings. |
| Unplanned changes | ✅ Reviewed | Previously logged thin adapters, shared business errors, worker composition/metrics and performance-test placement are covered by full tests and preserve the approved authority boundaries. |
| Plan alignment | ✅ | Content owns task state/items, Operations owns permission/audit persistence, admin uses shared CMP components, and PostgreSQL remains the durable queue. |
| Dependency / supply-chain (W5-C2) | ✅ None added | Dependency log remains empty; no install-time vetting was required. |

**Verdict:** CLEAN — implementation complete. Database tests pass 9/9 and validate passes; backend tests pass 281 unit/module plus 128 integration; admin tests pass 162/162, E2E 19/19 and production build succeeds. Initial parallel-run flakes were independently and serially reproduced as passing.

## T058 — Full verification command record

- Database: `pnpm test` exit 0 (9/9, zero skip); `pnpm validate` exit 0.
- Backend: manifest, typecheck, lint/architecture, `pnpm test` (54 files/281), `pnpm test:integration` (25 files/128) and `pnpm verify` all exit 0 with real PostgreSQL configured.
- Admin: typecheck and lint exit 0 (0 errors, 38 existing warnings); serial full unit rerun passes 33 files/162 tests; full E2E rerun passes 19/19; standalone verify exits 0 and production build succeeds.
- The first concurrent admin unit/E2E runs exposed resource-sensitive change-password and smoke flakes; isolated reruns passed 4/4 and 9/9, followed by the clean serial full reruns above.
- Traceability strict validator exits 0 with 0 errors/0 warnings; status and traceability YAML parse as mappings; tasks are 58/58 unique and contiguous.

## Checkpoint #21 — Code-review remediation F-004–F-010

| Check | Status | Notes |
|-------|:------:|-------|
| Transaction integrity | ✅ | Each Content action now executes behind a PostgreSQL savepoint; an `AppError` rolls back the action before the failed item outcome is persisted. A write-then-throw regression proves no partial Content write or success audit survives. |
| Selection and UI reachability | ✅ | Query-all upgrade requires a complete current-page selection; the fixed action column invokes the server-driven batch-action path; creator task history and detail are reachable after re-entry. |
| Task failure and recovery | ✅ | A safe task-failure repository transition records terminal invariant failures; task load, poll and retry failures expose accessible recovery controls while crash rollback/restart remains intact. |
| Coverage and endpoint matrix | ✅ | Matching V8 coverage providers are installed and logged. Enforced Admin layer coverage passes 51/51 (93.68% lines); Backend passes 103/103 (services 92.79%, domain 96.02%, repositories 98.45%, HTTP 93.96%); PostgreSQL feature suites pass 36/36; the four named Chromium journeys pass 4/4. |
| Static gates | ✅ | Admin and Backend type checks pass; Backend lint/architecture passes; Admin lint has 0 errors and the same 38 existing warnings. |
| Dependency / supply-chain | ✅ 2 vetted | Two workspace-specific declarations of `@vitest/coverage-v8` were vetted before installation; production audits report no known vulnerabilities. |

**Verdict:** CLEAN for CRITICAL/HIGH remediation. F-004–F-010 are resolved. F-012 and F-014 were also corrected without changing canonical authority. F-011 remains a throughput improvement and F-013 remains a Content contract-owner decision.
