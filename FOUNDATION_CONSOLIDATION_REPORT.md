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
