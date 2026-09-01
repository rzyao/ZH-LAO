---
status: complete
phase: 1
phase_name: Application Foundation
completed_at: 2026-08-30
gate: PASS
lifecycle: historical
---

# ZH-LAO  — Application Foundation Implementation Report

## Result

`APPLICATION_FOUNDATION = COMPLETE`  
`FOUNDATION_GATE = PASS`

Phase 1 established the application and Worker runtime without implementing any business Domain. The implementation uses the frozen PostgreSQL  baseline as its only physical schema authority and did not alter migrations `0000`–`1240`.

## Scope completed

- Node.js 22 / TypeScript / ESM backend package with reproducible pnpm lockfile.
- Zod-validated immutable configuration and non-sensitive configuration summary.
- Pino structured logging, request IDs, request context, response correlation header, and sensitive-field redaction.
- Shared `pg` pool factory, common database executor, explicit transaction manager, rollback logging, and pool lifecycle.
- Logical UUID generator, validator, and branded application type.
- Unified `AppError`, PostgreSQL constraint normalization, and safe HTTP error envelope.
- Fastify application factory with public liveness and database/schema-aware readiness routes.
- Lightweight FND-16 compatibility check that requires every frozen migration filename and SHA256 in `public.v2_schema_migrations`, plus the required infrastructure tables; the check never runs migrations or the full database audit.
- Authentication provider/context/hook skeleton with protected routes failing closed when no provider exists.
- Transaction-bound Outbox Writer matching `infrastructure.system_outbox_events` exactly.
- Concurrent Outbox Publisher using `FOR UPDATE SKIP LOCKED`, `available_at` leases, bounded exponential retry, success/failure persistence, and unknown-event retry behavior.
- Worker registry, polling job, abortable lifecycle, and graceful shutdown handling.
- Asset canonical metadata model/repository matching `infrastructure.assets`, plus an object-storage port without a production provider.
- Disposable real-PostgreSQL integration database automation using the existing frozen migration runner.
- Validation database lifecycle that drops tool-owned databases in `finally` after success or failure while preserving explicitly supplied databases and supporting `KEEP_VALIDATION_DATABASE=1`.
- Domain import, direct Pool construction, HTTP SQL, and shared-to-domain dependency boundary audit.
- CI workflow covering install, typecheck, lint, unit tests, build, PostgreSQL integration tests, frozen migration validation, and database audit.

## Main files changed

- `apps/backend/src/bootstrap/` — API/Worker composition and shutdown.
- `apps/backend/src/config/`, `logging/`, `database/`, `ids/`, `errors/` — shared runtime foundations.
- `apps/backend/src/auth/`, `http/` — request, health, error, and authentication contracts.
- `apps/backend/src/events/`, `outbox/`, `jobs/`, `assets/` — event, Worker, Outbox, and Asset foundations.
- `apps/backend/src/database/migration-compatibility.ts` and generated required-migration manifest — lightweight readiness compatibility.
- `apps/backend/test/` — unit, architecture, and real PostgreSQL integration coverage.
- `database/scripts/migration-files.mjs`, `migrate.mjs`, and `validate.mjs` — shared migration hash loading and safe validation database cleanup.
- `database/test/validate.test.mjs` — real PostgreSQL validation lifecycle tests.
- `.github/workflows/foundation.yml` — Foundation CI gate.
- `.gitignore` — environment and coverage exclusions.

## Technical decisions

1. `database` remains the only migration authority; the backend never auto-creates or migrates production schemas.
2. Application services must pass an explicit transaction-scoped executor to repositories and the Outbox Writer.
3. The frozen Outbox table has no claim column, so `available_at` is also the bounded lease deadline. Claims increment `attempt_count`; success writes `published_at`; failure writes `last_error` and a retry time.
4. Unknown event types are retained and retried, never silently acknowledged.
5. Authentication is deliberately only a contract in Phase 1. The missing-provider path returns a safe 503 and never grants access.
6. Production object storage remains unselected; only the port and canonical Asset metadata adapter are present.
7. Frozen migration files remain the sole schema authority. The existing runner and Backend manifest generator share one filename/SHA256 loader; typecheck and build fail if the derived Backend manifest is stale.
8. Readiness performs two lightweight catalog/registry queries. It checks required objects, all 17 required filenames, and their exact stored SHA256 values without running migrations or a full audit.

## Database changes

None. All 17 frozen migrations are unchanged, and no incremental migration was required.

## Verification evidence

Executed on 2026-08-30:

- TypeScript typecheck: PASS.
- ESLint and architecture boundary audit: PASS.
- Unit tests: 14/14 PASS across 8 files.
- Production TypeScript build: PASS.
- Foundation integration tests: 10/10 PASS against PostgreSQL 18.6; zero tests exit with code 1 because `--passWithNoTests` was removed.
- Database validation lifecycle tests: 3/3 PASS (success cleanup, failure cleanup, explicit database preservation).
- Fresh database migrations: 17 executed from zero.
- Second migration run: 0 executed (idempotency PASS).
- Database audit: PASS.
- Catalog result: 122 business tables and 2 infrastructure tables.
- Illegal cross-domain physical FK: 0.
- Logical UUID violation: 0.
- Disposable integration, audit, partial, empty, registry-only, explicit-validation, and validation databases: removed after verification; residual temporary database count = 0.

The integration suite proves transaction commit/rollback and row mapping, same-transaction probe + Outbox atomicity, duplicate/JSON database constraints, concurrent Publisher claiming, publication and retry persistence, Asset create/read/uniqueness/state constraints, and the absence of backend schema mutation.

## FND-16 closure evidence

Real PostgreSQL 18.6 route-level tests now prove:

- Complete 17-migration baseline and matching checksums → `/health/ready` 200.
- Empty `template0` database → 503.
- Database containing only `public.v2_schema_migrations` → 503.
- Genuine partial baseline with migrations `0000`, `0100`, and `0200` applied → 503.
- Complete physical schema with a required registry row removed → 503.
- Complete physical schema with one required SHA256 changed → 503.
- Unavailable PostgreSQL endpoint → 503.
- Restoring the required registry filename and checksum → 200.

The Backend performs no migration and the frozen migration files `0000`–`1240` have no diff.

## Final verification commands and results

- `pnpm --dir apps/backend typecheck` → PASS, including generated migration manifest freshness.
- `pnpm --dir apps/backend lint` → PASS, including architecture boundary audit.
- `pnpm --dir apps/backend build` → PASS.
- `pnpm --dir apps/backend test` → 14/14 PASS.
- `pnpm --dir apps/backend test:integration` → 10/10 PASS on PostgreSQL 18.6.
- Zero-test Vitest probe → exit code 1 as required.
- `pnpm --dir database test` → 3/3 PASS on PostgreSQL 18.6.
- Fresh validation with no explicit `DATABASE_URL` → 17 migrations applied; repeat → 0; database audit → PASS.
- Temporary database cleanup query → no `zh_lao_fnd_*`, `zh_lao_v2_validation_*`, or `zh_lao_v2_explicit_*` databases remain.
- CI workflow inspection → Backend verify/build/integration, database validation tests, and `database validate` remain mandatory; no zero-test bypass is configured.

## Architecture boundary evidence

The source audit passes the legal cross-domain `public/` fixture and rejects fixtures that import another Domain's internal infrastructure or construct a Domain-local PostgreSQL Pool. It also rejects SQL execution from business HTTP adapters and dependencies from shared technical code into business modules.

## Known limitations

- No business handlers are registered yet; business event handlers arrive with their owning Domain phases.
- No production object-storage provider is selected or configured.
- Authentication does not implement login, OTP, sessions, devices, RBAC, or ban policy.
- PostgreSQL polling is the intentional initial Outbox transport; no external broker or Redis is introduced.
- Production deployment infrastructure is outside Phase 1.

## TECH_DEBT

None blocking. Outbox throughput and external broker adoption must be reassessed only when measured production load exceeds the PostgreSQL polling design; owner: Production Readiness / future infrastructure revision; removal condition: evidence of insufficient throughput or delivery latency.

## OUT_OF_SCOPE_FINDING

None requiring a Foundation change.

## Exit Gate

All Phase 1 Foundation capabilities and failure paths required for the next Domain are implemented and verified. No unresolved Foundation blocker remains. Work stops here and does not enter Identity.
