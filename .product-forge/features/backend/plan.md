> ⚠ BACKFILLED ARTIFACT
> Reverse-engineered from `apps/backend` on 2026-09-04.
> This is NOT the original intent of the feature; it is an inferred
> description based on code inspection. Treat as documentation, not spec.

# Architecture as observed

## 1. Modules and call flow

`src/main.ts` loads configuration, creates the Pino logger and PostgreSQL pool, builds the Fastify app, and registers Identity, Operations, Content, and Platform routes. Identity supplies the authentication provider consumed by Operations, Content, and Platform management routes. `src/bootstrap/build-app.ts` installs request context, authentication context, error handling, response-envelope behavior, and health routes before domain routes are mounted.

Domain modules follow `domain`, `application`, `infrastructure`, `http`, and `public` layers. The module boundary document prohibits imports into another module except through that module's `public` directory. The worker bootstraps a polling outbox publisher through a job registry.

| Area | Observed responsibilities |
| --- | --- |
| Foundation | configuration, UUIDs, logging, HTTP hooks, errors, database pool/transactions, migrations, events/outbox, jobs, assets/capability ports |
| Identity | phone/Facebook authentication, OTP, JWT/session/device lifecycle, profile operations, administrator authentication and audit adapter |
| Operations | operators, roles/permissions, authorization, audit, and bootstrap |
| Platform | feature flags, runtime configuration, application versions, announcements, regions, and admin menus |
| Content | Lao character/revision domain, PostgreSQL repository, public alphabet read and editorial draft/review/publish routes protected by Operations RBAC and successful-action audit |

## 2. Data model (observed references)

- Identity repositories access `identity.users`, `identity.auth_identities`, `identity.basic_profiles`, `identity.learning_profiles`, `identity.otp_challenges`, `identity.devices`, and `identity.sessions`.
- Operations and Platform use their owning repositories/schemas; their physical schema is not duplicated here and remains owned by frozen migrations and canonical domain documentation.
- Content repository references Lao-character and revision persistence. This artifact does not restate database field definitions.
- Foundation uses `infrastructure.system_outbox_events` through outbox components and contains asset-storage abstractions.

## 3. HTTP/API surface (observed)

- Health: `GET /health/live`, `GET /health/ready`.
- Identity: phone-OTP request; phone/Facebook authentication; refresh, logout and logout-all; current-identity/profile/learning-profile reads and profile/phone updates; administrator login and password change under `/api/v1/identity` and `/api/v1/admin/auth`.
- Operations: protected administrative operations routes under the Operations HTTP module.
- Platform: public platform routes plus protected admin routes for feature flags, runtime config, app versions, announcements, regions, menu configuration, and route-target lookup.
- Content: public alphabet endpoint is mounted at `/api/v1/content/letters`; editorial endpoints are mounted at `/api/v1/admin/content/letters*`, with Identity authentication, Operations permissions, and audit recording.

Request parsing is primarily Zod-based in newer routes. Response/error semantics must defer to the canonical architecture API standard and ADR-023 rather than this observed summary.

## 4. Dependencies

- External packages: Fastify, Zod, PostgreSQL (`pg`), Pino, libphonenumber-js; Node crypto facilities.
- Internal dependencies: frozen database migrations, shared Foundation adapters, Identity public queries, Operations authorization/audit, and Platform public services.
- Provider ports/adapters: cache, media, object storage, translation, TTS, OTP delivery, and Facebook credential verification.

## 5. Known technical debt (observed)

- No `TODO`, `FIXME`, `HACK`, or `XXX` markers were found in `apps/backend` during this scan.
- `apps/backend/README.md` still describes a foundation exposing only health endpoints, whereas `src/main.ts` registers Identity, Operations, and Platform routes.
- Content mounting was completed after the initial backfill. The existing Content data-model drift recorded in the canonical Content spec remains outside this change.
- Several provider implementations are deliberately unavailable or fake; production integration status is unknown.
