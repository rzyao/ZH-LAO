---
status: complete
phase: 1
phase_name: Application Foundation
completed_at: 2026-08-30
gate: PASS
---

# ZH-LAO V2 — Application Foundation Implementation Report

## Result

`APPLICATION_FOUNDATION = COMPLETE`  
`FOUNDATION_GATE = PASS`

Phase 1 established the application and Worker runtime without implementing any business Domain. The implementation uses the frozen PostgreSQL V2 baseline as its only physical schema authority and did not alter migrations `0000`–`1240`.

## Scope completed

- Node.js 22 / TypeScript / ESM backend package with reproducible pnpm lockfile.
- Zod-validated immutable configuration and non-sensitive configuration summary.
- Pino structured logging, request IDs, request context, response correlation header, and sensitive-field redaction.
- Shared `pg` pool factory, common database executor, explicit transaction manager, rollback logging, and pool lifecycle.
- Logical UUID generator, validator, and branded application type.
- Unified `AppError`, PostgreSQL constraint normalization, and safe HTTP error envelope.
- Fastify application factory with public liveness and database/schema-aware readiness routes.
- Authentication provider/context/hook skeleton with protected routes failing closed when no provider exists.
- Transaction-bound Outbox Writer matching `infrastructure.system_outbox_events` exactly.
- Concurrent Outbox Publisher using `FOR UPDATE SKIP LOCKED`, `available_at` leases, bounded exponential retry, success/failure persistence, and unknown-event retry behavior.
- Worker registry, polling job, abortable lifecycle, and graceful shutdown handling.
- Asset canonical metadata model/repository matching `infrastructure.assets`, plus an object-storage port without a production provider.
- Disposable real-PostgreSQL integration database automation using the existing frozen migration runner.
- Domain import, direct Pool construction, HTTP SQL, and shared-to-domain dependency boundary audit.
- CI workflow covering install, typecheck, lint, unit tests, build, PostgreSQL integration tests, frozen migration validation, and database audit.

## Main files changed

- `apps/backend/src/bootstrap/` — API/Worker composition and shutdown.
- `apps/backend/src/config/`, `logging/`, `database/`, `ids/`, `errors/` — shared runtime foundations.
- `apps/backend/src/auth/`, `http/` — request, health, error, and authentication contracts.
- `apps/backend/src/events/`, `outbox/`, `jobs/`, `assets/` — event, Worker, Outbox, and Asset foundations.
- `apps/backend/test/` — unit, architecture, and real PostgreSQL integration coverage.
- `.github/workflows/foundation.yml` — Foundation CI gate.
- `.gitignore` — environment and coverage exclusions.

## Technical decisions

1. `database/v2` remains the only migration authority; the backend never auto-creates or migrates production schemas.
2. Application services must pass an explicit transaction-scoped executor to repositories and the Outbox Writer.
3. The frozen Outbox table has no claim column, so `available_at` is also the bounded lease deadline. Claims increment `attempt_count`; success writes `published_at`; failure writes `last_error` and a retry time.
4. Unknown event types are retained and retried, never silently acknowledged.
5. Authentication is deliberately only a contract in Phase 1. The missing-provider path returns a safe 503 and never grants access.
6. Production object storage remains unselected; only the port and canonical Asset metadata adapter are present.

## Database changes

None. All 17 frozen migrations are unchanged, and no incremental migration was required.

## Verification evidence

Executed on 2026-08-30:

- TypeScript typecheck: PASS.
- ESLint and architecture boundary audit: PASS.
- Unit tests: 14/14 PASS across 8 files.
- Production TypeScript build: PASS.
- Foundation integration tests: 5/5 PASS against PostgreSQL 18.6.
- Fresh database migrations: 17 executed from zero.
- Second migration run: 0 executed (idempotency PASS).
- Database audit: PASS.
- Catalog result: 122 business tables and 2 infrastructure tables.
- Illegal cross-domain physical FK: 0.
- Logical UUID violation: 0.
- Disposable integration and audit databases: removed after verification.

The integration suite proves transaction commit/rollback and row mapping, same-transaction probe + Outbox atomicity, duplicate/JSON database constraints, concurrent Publisher claiming, publication and retry persistence, Asset create/read/uniqueness/state constraints, readiness against a complete baseline, and the absence of backend schema mutation.

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
