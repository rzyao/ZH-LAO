> ⚠ BACKFILLED ARTIFACT
> Reverse-engineered from `apps/backend` on 2026-09-04.
> This is NOT the original intent of the feature; it is an inferred
> description based on code inspection. Treat as documentation, not spec.

# Existing components

- [x] T001 — Application bootstrap and server lifecycle — `apps/backend/src/main.ts`, `apps/backend/src/bootstrap/`
- [x] T002 — Worker bootstrap and job host — `apps/backend/src/worker.ts`, `apps/backend/src/jobs/`, `apps/backend/src/bootstrap/build-worker.ts`
- [x] T003 — Configuration loading and validation — `apps/backend/src/config/`
- [x] T004 — Database executor, transaction manager, pool, and migration compatibility — `apps/backend/src/database/`
- [x] T005 — HTTP request context, health checks, response envelope, and server support — `apps/backend/src/http/`
- [x] T006 — Application errors and business-code handling — `apps/backend/src/errors/`
- [x] T007 — Authentication context and request hook — `apps/backend/src/auth/`
- [x] T008 — Logging and logical UUID utilities — `apps/backend/src/logging/`, `apps/backend/src/ids/`
- [x] T009 — Domain-event registry and outbox persistence/publisher — `apps/backend/src/events/`, `apps/backend/src/outbox/`
- [x] T010 — Asset repository and object-storage abstraction — `apps/backend/src/assets/`
- [x] T011 — Capability ports and providers for cache/media/translation/TTS — `apps/backend/src/capabilities/`
- [x] T012 — Identity domain types and identifiers — `apps/backend/src/modules/identity/domain/`
- [x] T013 — Identity application use cases and services — `apps/backend/src/modules/identity/application/`
- [x] T014 — Identity PostgreSQL repositories and authentication provider — `apps/backend/src/modules/identity/infrastructure/`
- [x] T015 — Identity public query boundary — `apps/backend/src/modules/identity/public/`
- [x] T016 — Identity and administrator HTTP routes/composition — `apps/backend/src/modules/identity/http/`
- [x] T017 — Operations domain and public permission contracts — `apps/backend/src/modules/operations/domain/`, `apps/backend/src/modules/operations/public/`
- [x] T018 — Operations service, repositories, and HTTP composition — `apps/backend/src/modules/operations/application/`, `infrastructure/`, `http/`
- [x] T019 — Platform domain types — `apps/backend/src/modules/platform/domain/`
- [x] T020 — Platform feature-flag and runtime-config use cases — `apps/backend/src/modules/platform/application/use-cases/feature-flag-use-cases.ts`, `runtime-config-use-cases.ts`
- [x] T021 — Platform app-version, announcement, and region use cases — `apps/backend/src/modules/platform/application/use-cases/`
- [x] T022 — Platform menu management use cases and tests — `apps/backend/src/modules/platform/application/use-cases/menu-use-cases.ts`, `__tests__/`
- [x] T023 — Platform repositories and public readers — `apps/backend/src/modules/platform/infrastructure/`, `public/`
- [x] T024 — Platform public and management HTTP routes — `apps/backend/src/modules/platform/http/`
- [x] T025 — Content Lao-character/revision domain — `apps/backend/src/modules/content/domain/`
- [x] T026 — Content draft, revision, review, and publishing use cases — `apps/backend/src/modules/content/application/`
- [x] T027 — Content PostgreSQL repository — `apps/backend/src/modules/content/infrastructure/`
- [x] T028 — Content public and editorial route plugins — `apps/backend/src/modules/content/http/`
- [x] T029 — Unit, module, and integration test suites — `apps/backend/test/`, `apps/backend/src/**/__tests__/`
- [x] T030 — Build, lint, typecheck, migration-manifest, and verification scripts — `apps/backend/package.json`, `apps/backend/scripts/`
- [x] T031 — Content route composition, management authorization, and audit integration — `apps/backend/src/modules/content/http/composition.ts`, `apps/backend/src/main.ts`
