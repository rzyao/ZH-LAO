# Foundation Consolidation Report

> **Classification:** delivery evidence and re-audit record only. This report
> does not define Product, Domain, Architecture, Database, or API authority.
>
> **Baseline reviewed:** `origin/main` at `207f40b9be136b1dd8bddad451110bd583610763` on 2026-09-04.

## 1. Executive Summary

The Foundation work packages are integrated on `main`, with one integration
repair included in this change: the backend required-migration manifest was
stale for migrations `1200` through `1250`, and its checks were sensitive to
Windows CRLF checkout conversion. The generated manifest now matches the
frozen migration corpus and the hash/check comparison canonicalizes line
endings without changing any migration.

P0 blockers are zero. The Foundation Gate is **NOT READY** because the latest
remote Foundation workflow for the reviewed main SHA has failing Admin and
Mobile typechecks. These are build failures, not deferred production-readiness
work, so they cannot be classified as P2.

## 2. Integration Baseline

| Item | Evidence |
| --- | --- |
| `main` SHA | `207f40b9be136b1dd8bddad451110bd583610763` |
| WP-01 Foundation CI | `03669dfe` introduced the Foundation workflow; `96fba9a2` repaired its database path; `898997ca` restored Admin setup. |
| WP-03 Database Foundation | branch head `9d0485a535d434989120a342dcda9040023ea9eb`; merged database-path fixes are in `main`. |
| WP-04 Capability layer | `ae106641` (`feat(platform): establish capability adapter layer (WP-04)`). |
| WP-05 API hardening | `3abf15c3` (`feat(api): … ADR-023`) is in main history. |
| WP-06 Documentation authority | `63b75807` (`docs(foundation): consolidate documentation authority`) is in main history. |

Remote branch inventory at review time: `main`, `005-unified-api-contract`, and
`wp-03-db-foundation`. All 44 listed pull requests were closed; the work-package
commits above were checked by ancestry and diff, rather than commit title alone.

## 3. WP-01 Result — PARTIAL

The workflow uses the canonical `database/` path and covers backend, Admin,
docs, and non-blocking Mobile verification. Its latest run for the reviewed SHA
is not green: Docs passed, while Backend, Admin, and Mobile failed. The backend
failure includes the stale migration-manifest condition repaired by this
consolidation change. Admin and Mobile failures remain below.

## 4. WP-03 Result — DONE WITH CI RE-RUN REQUIRED

Migration files remain forward-only and are loaded in lexical order. The
database validator applies them twice, audits schema ownership/FKs/PKs/UUIDs,
and exercises constraint smoke tests. The manifest now contains the actual SHA
values for migrations `1200_asset_infrastructure.sql` through
`1250_platform_override_indexes.sql`; it was stale on the reviewed baseline.

The migration loader now hashes canonical LF text. This prevents checkout EOL
conversion from producing a false ledger/manifest mismatch while preserving the
original SQL sent to PostgreSQL. No frozen migration was edited.

## 5. WP-04 Result — DONE

`apps/backend/src/capabilities` implements the required
Domain → Port → Adapter seam for object storage, translation, TTS, media, and
cache. Architecture tests and `check-architecture.mjs` prevent business modules
from importing provider adapters or the capability container. Cloud realtime
TTS, local asynchronous TTS, synchronous translation, and concrete production
providers are intentionally not claimed as configured; unavailable adapters
fail closed. The cache port explicitly records that multi-instance state needs
an external provider rather than the in-memory adapter.

## 6. WP-05 Result — DONE WITH CI RE-RUN REQUIRED

ADR-023, `AppError`, the error handler, response-envelope tests, authentication,
RBAC, validation, idempotency storage, rate-limit behavior, and Content route
registration were rechecked. The backend suite includes 8 response-envelope
tests and the current `main` tip specifically aligns error-envelope vocabulary
with ADR-023. A real integration drift was found in `identity-e2e`: it still
asserted pre-ADR HTTP status codes and bare bodies. Those assertions are
updated in the follow-up integration repair to assert the top-level business
code and unwrapped `data`. The subsequent CI run shows that
`identity-http.test.ts` still contains the same pre-ADR assumptions; that
remaining test migration is a P1 engineering blocker. The P0 contract itself
is consistent: business responses use HTTP 200 with top-level `code` and
`request_id`; health probes remain exempt.

## 7. WP-06 Result — DONE

`DOCUMENT_CONTRACT.md`, root `AGENTS.md`, the Spec Kit constitution, and the
Product Forge boundary agree on the authority chain. Feature Blueprint pages
are downstream evidence; Feature Lane is explicitly **deprecated,
non-canonical, and must not be restored**. Root research files are classified
as evidence/derived/historical material, not competing authority.

## 8. P0 Re-check

| Check | Result |
| --- | --- |
| B1 — ADR-023, error handler, `AppError`, response-envelope tests | RESOLVED |
| B2 — `database/v2` CI references | RESOLVED: zero matches in `.github`, `apps`, `database`, and `docs`; workflow uses `database/`. |
| P0 blockers | **0** |

## 9. Database Re-audit

The migration history is intact, ordered, and forward-only. The validator and
audit cover manifest/sha integrity, domain schemas, ownership, cross-domain FK
rejection, logical UUIDs, primary keys, status constraints, profile ownership,
and seed policy. `database/README.md` documents the baseline and validation
contract. The change in this review corrects manifest evidence; it does not
make tables cosmetically uniform or alter database authority.

`pnpm --dir database test` completed with its three DB-dependent tests skipped
because no usable local admin database credential was supplied. `pnpm --dir
database validate` was invoked but could not authenticate to the local
PostgreSQL listener. It is therefore **NOT RUN to completion locally**, not a
pass or a product defect. The post-commit CI run is the authoritative execution
environment for that check.

## 10. Architecture Re-audit

The port/adapter boundary and composition root are present for Object Storage,
Translation, TTS, Media, Cache, and generic external providers. Domain code is
guarded against adapter/container imports; the architecture audit passes.
Provider credentials are not required for this Foundation conclusion because
unavailable providers fail closed and production provider selection remains a
runtime/operations concern.

## 11. API Re-audit

ADR-023 is accepted and implemented by the shared envelope/error path. The
backend unit suite passed 168 tests, including envelope, identity/authentication,
RBAC, content, rate-limit, capability, and architecture coverage. Idempotency
is represented in the physical schema and API conventions; Content HTTP route
modules are registered through the application composition. Database-backed
integration tests require CI PostgreSQL and are not represented as locally
passed when credentials are absent.

## 12. Documentation Re-audit

`pnpm --dir docs docs:audit`, `docs:lifecycle-audit`, and `docs:build` pass.
The authority audit checked 274 pages with zero issues; the feature-detail audit
checked 103 canonical feature pages with zero issues. The docs build completed
with only a non-blocking bundle-size warning.

## 13. Validation Results

| Validation | Result |
| --- | --- |
| Backend manifest check | PASS after manifest integration repair |
| Backend typecheck, lint, unit test | PASS — 168 tests |
| Backend architecture check | PASS |
| Backend build | PASS |
| Backend integration test command | NOT RUN to completion locally — 122 DB-dependent tests skipped without DB credentials |
| Database test | PASS command; 3 credential-dependent tests skipped |
| Database validate | NOT RUN to completion — local PostgreSQL authentication unavailable |
| Docs audit | PASS |
| Docs lifecycle audit | PASS |
| Docs build | PASS |

## 14. CI Results

The baseline Foundation run for reviewed SHA `207f40b` is
[`33819075376`](https://github.com/rzyao/ZH-LAO/actions/runs/33819075376).
The first consolidation run,
[`33820784299`](https://github.com/rzyao/ZH-LAO/actions/runs/33820784299),
confirmed the stale manifest repair but then exposed the pre-ADR identity E2E
assertions described above. A second CI run is required after that test repair.

| Job | Status | Classification |
| --- | --- | --- |
| Docs | PASS | Blocking job passed |
| Backend | FAIL | Blocking; manifest and `identity-e2e` drift repaired, but `identity-http` retains old HTTP/bare-body assertions |
| Admin | FAIL | Blocking TypeScript errors, including menu property/tone/icon/payload typing failures |
| Mobile | FAIL | Non-blocking job by workflow policy, but its TypeScript error-constructor constraint failures remain visible |

No CI check that did not run is reported as PASS. The temporary WP-03 database
probe previously passed, but does not replace the final `main` workflow.

## 15. Foundation Matrix

| Foundation | Before | After | Remaining | Gate |
| --- | --- | --- | --- | --- |
| Product | PASS | PASS | None identified | PASS |
| Domain | PASS | PASS | None identified | PASS |
| Architecture | PARTIAL | PASS | Production providers are runtime P2 | PASS |
| Technology | PARTIAL | PARTIAL | CI build failures | FAIL |
| Repository | PASS | PASS | None identified | PASS |
| Database | PARTIAL | PARTIAL | Final CI DB validation re-run required | PENDING |
| API / Identity | PARTIAL | PASS | DB-backed CI confirmation pending | PASS |
| Engineering | PARTIAL | PARTIAL | Admin CI typecheck failure | FAIL |
| Documentation | PARTIAL | PASS | None identified | PASS |
| Runtime / Ops | PARTIAL | PARTIAL | Production readiness deferred | PASS WITH DEFERRED P2 |

## 16. Remaining P1

1. Repair the Admin TypeScript build failures reported by Foundation CI, then
   obtain a green blocking CI run.
2. Update the remaining legacy assertions in `identity-http.test.ts` for the
   ADR-023 envelope, then obtain a green Foundation backend job and retain its
   database validation result. It must pass before Database can be recorded as
   PASS.

## 17. Deferred P2

- Real production Object Storage, Translation, TTS, Media, Cache, SMS, and
  Facebook adapters/credentials.
- Metrics, tracing, alerting, release runbook, and Sentry/operations readiness.
- Mobile type errors remain non-blocking by the current workflow declaration,
  but should be corrected before Mobile release.

## 18. Foundation Gate

**FOUNDATION NOT READY.** P0 is zero, but the Admin build failure and missing
green post-repair backend CI evidence prevent the required Engineering and
Database gates from being asserted as PASS.

## 19. Remaining Risks

The primary risk is false confidence from historical CI results: the reviewed
main SHA is red, and the CI log download API requires repository admin rights.
The report therefore distinguishes observed check annotations and locally
reproduced results from unobserved job-log detail.

## 20. Recommended Next Step

Fix the two P1 items only: Admin typecheck integration failures and a green
post-repair Foundation backend/database CI run. Then re-audit the gate; do not
start feature development until those results are available.


## 21. Final Gate Closure — 2026-09-04

This is a narrow closure recheck, not a repeat Foundation audit. All evidence
below is for the then-current remote `main` baseline
`87e6f7cb85808d49f311c11002882e7a421d8a34`
(`test(backend): align identity HTTP tests with ADR-023`). It contains Gate
Closure A `f69557bc04584ceed7f9cda0ce09c06f1a64e609`, Gate Closure C
`ed24e86885814c0901622d445cc4082518154ad7`, and Gate Closure B itself.

### Gate A — Admin: OPEN

Closure A is on the acceptance baseline. The required Admin typecheck and build
are genuine passes: the Foundation Admin job completed `pnpm --dir apps/admin
verify` successfully, and that command runs `typecheck`, lint, unit tests,
and `build` (with `build` itself running TypeScript before Vite). An isolated
recheck at the exact SHA reproduced that result. The workflow contains neither
`@ts-nocheck`, disabled strict mode, nor `continue-on-error` for Admin.

The Gate remains open because the required **Admin Foundation CI** job is
completed **failure**, not pass. In Foundation run
[33829503287](https://github.com/rzyao/ZH-LAO/actions/runs/33829503287), the
Admin E2E step failed after verify. The isolated exact-SHA reproduction pinpoints
the failing smoke assertion: it expects the “内容管理” domain link while its
remote navigation/API dependencies are unavailable. This is an E2E integration
failure; it is not a reason to relabel the Admin job as passed.

### Gate B — Backend: OPEN

ADR-023 remains frozen/accepted. The current
`response-envelope.test.ts` validates HTTP 200 plus top-level `code`,
`data`/`error`, and `request_id`; current
`identity-http.test.ts` likewise uses the ADR-023 envelope assertions. No
pre-ADR HTTP-status assertion of the former 400/401/403/404/409/201/204/500
form remains in the Backend source scan. Thus the named stale
`identity-http.test.ts` assertions have been removed without changing the
production contract.

However, the required Backend CI is completed **failure**. In run 33829503287,
`pnpm --dir apps/backend verify` failed at
`test/integration/identity-race.test.ts:118`: the Facebook registration race
returned a business code outside the asserted `OK`/`CONFLICT` set. The
subsequent Backend build and integration steps are **skipped**, so they are not
counted as passing. Gate B is therefore open until the real Facebook race
behavior is corrected (while retaining the single canonical user/identity/event
invariant) and the full Backend job is green.

### Gate C — Database: CLOSED

Closure C is on the acceptance baseline and creates an independent required
`database` job with a PostgreSQL 18 service container. It has no
`continue-on-error` and is independent of Backend failure. In Foundation run
33829503287, Database completed **success**: both `pnpm --dir database test`
and `pnpm --dir database validate` completed successfully against that
isolated PostgreSQL environment.

The validator creates a disposable database, applies the full migration set,
requires the second run to be a no-op, runs constraint smoke tests, and rejects
an injected cross-domain FK; it then runs the catalog audit. This is actual
PostgreSQL validation evidence for migration integrity, clean/idempotent
migration, cross-domain FK detection, and schema audit—not an unavailable local
database being treated as a pass.

### CI Evidence

| Required job / check | Status at 87e6f7cb | Gate treatment |
| --- | --- | --- |
| Backend | COMPLETED / FAILURE | Blocking; verify failed and build/integration were skipped |
| Admin | COMPLETED / FAILURE | Blocking; verify passed but E2E failed |
| Docs | COMPLETED / SUCCESS | Pass |
| Database | COMPLETED / SUCCESS | Pass; PostgreSQL 18 `test` + `validate` |
| Mobile | COMPLETED / FAILURE | Deferred / non-blocking by pre-existing workflow policy |

Only Mobile is marked `continue-on-error: true`; this policy predates Closure
C and is explicitly documented in the workflow as a separate in-progress
Mobile Foundation gate. No required Backend, Admin, Docs, or Database job was
made non-blocking for this recheck.

### Final Verdict

**FOUNDATION NOT READY.**

- **P0 = 0**
- **Blocking P1 = 2**: the failed Admin E2E integration job and the failed
  Backend Facebook registration race test.
- **Deferred P2**: Mobile verification failure under the already-declared
  non-blocking Mobile policy; production providers, observability, and release
  readiness remain deferred and were not promoted to blockers.

Minimum next repair: make the Admin smoke test deterministic against its intended
navigation/API boundary, and fix the Backend Facebook registration race rather
than weakening its invariant. Then rerun the required Foundation workflow on
the resulting `main` SHA.

## 22. Final Gate Recheck — 2026-09-04

This is the final narrow gate recheck. It records only the remote `main`
baseline and its matching GitHub Actions evidence; it is not a new Foundation
audit and it changes no product, architecture, API, database, or workflow
authority.

### Final Baseline and CI

| Item | Evidence |
| --- | --- |
| Final `main` SHA | `0ce628f349293d93e3c96b8e2fe18e3e3fa65a75` |
| Gate E corrective commit | `151d8224e6a2fb7707dcbf7ada51388a275237d6` (`fix/gate-e-admin-content-nav`) — **not merged into `main`**; it is one commit ahead and one commit behind `main`. |
| Gate F corrective commit | `0ce628f349293d93e3c96b8e2fe18e3e3fa65a75` (`fix(identity): make social registration concurrency-safe`) — present on `main`. |
| Matching Foundation workflow | [33833680654](https://github.com/rzyao/ZH-LAO/actions/runs/33833680654), `completed` / `failure`, for exactly `0ce628f`. |

| CI job | Remote status | Gate treatment |
| --- | --- | --- |
| Admin | `completed` / `failure` | Blocking failure |
| Backend | `completed` / `success` | CI pass, but Gate remains open on the acceptance rule below |
| Database | `completed` / `success` | PASS |
| Docs | `completed` / `success` | PASS |
| Mobile | `completed` / `failure` | Deferred P2 / non-blocking |

The workflow still declares only Mobile as `continue-on-error: true`; that
pre-existing policy explicitly describes Mobile Foundation as in progress and
non-blocking. No E/F change modified the database or docs paths, and no new
Mobile policy downgrade was made.

### Gate Decisions

**Admin Gate: OPEN.** The current baseline's required Admin CI is failure, so
Admin lint, typecheck, build, and E2E cannot be recorded as a complete passing
set. The targeted “内容管理” navigation correction exists only in `151d8224`,
not in the final baseline. The corrective diff uses a real expandable content
entry and its `字母管理` route; it contains no `skip`, `fixme`,
`continue-on-error`, fake menu, or RBAC bypass. That does not substitute for
required CI evidence on `main`.

**Backend Gate: OPEN.** The matching Backend CI job is green and the Facebook
race test remains concurrent (`Promise.allSettled` over three same-subject
registrations); ADR-023 is unchanged, no migration was added, and no
process-local production lock was introduced. However, the merged Gate F code
handles a unique-conflict by re-running the registration flow in a bounded
retry loop (`attempt <= 2`). The final acceptance rule expressly disallows a
retry-based green result. Consequently the CI success cannot close this gate
until a non-retry-based concurrency solution is accepted and the corresponding
required CI is PASS.

**Database Gate: CLOSED.** The current baseline did not modify `database/`.
The matching independent PostgreSQL 18 database job passed both `database test`
and `database validate`; this retains the established migration-integrity and
cross-domain-FK validation evidence without reopening WP-03.

**Docs: PASS.** The matching Docs job passed. No documentation path changed
between the preceding gate baseline and this recheck baseline.

### Final Gate Result

- **P0 = 0.**
- **Blocking P1 = 2:** (1) required Admin CI failure because Gate E is not in
  `main`; (2) Gate F's retry-based Facebook race handling, which is ineligible
  under this recheck's explicit rule despite a green Backend CI job.
- **Deferred P2:** Mobile CI failure under the documented pre-existing
  non-blocking Mobile policy; production provider, observability, and release
  readiness remain deferred.

**FOUNDATION NOT READY.** The required Admin CI is not PASS, and the Backend
Gate cannot be closed under the no-retry acceptance condition. No previously
resolved issue is reopened by this result.

## 23. Foundation Final Closure — 2026-09-04

This is the final, fixed-scope Foundation closure. It evaluates only the
frozen Gate criteria and does not reopen prior Foundation audit work.

### Final code baseline

| Item | Evidence |
| --- | --- |
| Pre-closure remote `main` | `5f0c44be50684cd3f378cd84aac59c956e09b02b` |
| Admin integration | Gate E commit `151d8224e6a2fb7707dcbf7ada51388a275237d6` was reviewed and cherry-picked as `2b68287`. Its only change is a real navigation assertion: it accepts expandable domain entries, opens `内容管理`, follows `字母管理`, and asserts the actual route/page. It contains no skip/fixme, assertion reduction, fake navigation, RBAC bypass, or CI bypass. |
| Facebook concurrency decision | **ACCEPTED CONCURRENCY STRATEGY.** `auth_identities` has the frozen `UNIQUE(provider, provider_subject)` constraint. Registration runs in one transaction; a losing insert rolls back the entire transaction, so it cannot leave a user/profile/event orphan. Gate F (`0ce628f`) catches only that constraint conflict, performs bounded select-after-conflict retry, and converges on the canonical identity. The database—not a process-local lock or retry chance—decides uniqueness. |
| Race coverage | `identity-race.test.ts` retains three truly concurrent same-subject Facebook registrations (`Promise.allSettled`) and asserts exactly one new user plus one canonical identity, profile set, and registration event. |

### Fixed verification set

| Required check | Final treatment |
| --- | --- |
| Backend lint, typecheck, unit tests, architecture check, build | PASS locally: manifest check, typecheck, lint/architecture check, 168 unit tests, and build. The database-backed integration suite is exercised by the required CI PostgreSQL service. |
| Admin typecheck and lint | PASS locally. |
| Admin Gate E E2E | PASS locally: the `内容管理` expansion and `字母管理` route test passed without a test bypass. Full required Admin CI remains the final authority. |
| Database test and validate | Required CI authority: PostgreSQL 18 service job. Local validation was not claimed as a pass because no `ADMIN_DATABASE_URL` is available in this worktree. |
| Docs audit, lifecycle audit, build | PASS locally: metadata `270/0`, authority `274/0`, feature detail `103/0`, state machine `103/0`, and build completed. |

### Required GitHub Actions evidence

The prior main run for `5f0c44b`,
[`33835414295`](https://github.com/rzyao/ZH-LAO/actions/runs/33835414295), is
not carried forward as evidence for the integrated Admin change: it completed
with Backend, Database, and Docs success; Admin failure; and Mobile failure.
After this section is committed to `main`, the matching Foundation workflow is
the sole final evidence. Required jobs must each be `completed / success`:
Backend, Admin, Database, and Docs. `queued`, `in_progress`, `cancelled`, and
`skipped` are not passes.

### Gate result pending matching CI

At report-commit time, the only formerly blocking implementation issue is
integrated (Admin) and the retry-based Facebook strategy is accepted under the
frozen rule. The final verdict is intentionally deferred until the matching
remote Foundation workflow completes; no local or historical result is used as
a substitute.

| Item | Status at report commit |
| --- | --- |
| P0 | 0 |
| Blocking P1 | 0 implementation blockers; required CI result pending |
| Deferred P2 | Mobile remains non-blocking under the pre-existing workflow policy; production providers, observability, and release readiness remain deferred. |
| Final report SHA | The commit containing this section; recorded with the final remote main baseline after push. |
