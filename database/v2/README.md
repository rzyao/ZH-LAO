# ZH-LAO V2 PostgreSQL baseline

This directory contains the forward-only PostgreSQL 18 baseline derived from
the frozen ZH-LAO Domain documentation dated 2026-08-30.

## Status

**Baseline status: PASS.** The executable baseline creates all 11 business
schemas, completes the original 121-table business inventory, and adds the
Content-owned `content.content_revisions` table required by the now-frozen
revision contract (122 business tables total). The shared infrastructure
schema contains the canonical `assets` table and transactional
`system_outbox_events` table.

The physical contracts resolved in this increment are recorded in
`checks/frozen-physical-contracts.md`. See
`reports/V2_DATABASE_BASELINE_REPORT.md` for the catalog-derived result.

## Commands

Install the isolated tool package:

```bash
pnpm install --frozen-lockfile
```

Apply pending migrations to an explicitly selected database:

```bash
DATABASE_URL='postgresql://...' pnpm run migrate
```

Audit without changing the database:

```bash
DATABASE_URL='postgresql://...' pnpm run audit
```

Regenerate the Markdown and JSON catalog reports:

```bash
DATABASE_URL='postgresql://...' pnpm run report
```

Validate an already selected disposable database:

```bash
DATABASE_URL='postgresql://...' pnpm run validate
```

Alternatively, omit `DATABASE_URL` and provide an admin connection. Validation
then creates a uniquely named `zh_lao_v2_validation_<timestamp>_<suffix>`
database from `template0` and drops it in `finally`, including after failures:

```bash
ADMIN_DATABASE_URL='postgresql://.../postgres' pnpm run validate
```

Set `KEEP_VALIDATION_DATABASE=1` only when a temporary validation database must
be retained for debugging. A database supplied explicitly through
`DATABASE_URL` is never deleted by validation.

Real credentials must remain in environment variables and must never be added
to this directory. `.env.example` contains placeholders only.
For local development, package scripts automatically load an ignored `.env`
file when it exists; explicitly supplied process environment variables still
take precedence.

## Migration behavior

The runner takes a PostgreSQL advisory lock and records filename, SHA-256, and
application time in `public.v2_schema_migrations`. Each migration runs in its
own transaction. Re-running is a no-op; changing a previously applied file is
treated as an error. Schema changes after this baseline must use a new migration.

Migration order:

1. `0000_infrastructure.sql` — schemas, comments, and `pg_trgm`
2. `0100_identity.sql` — four executable Identity tables
3. `0200_operations.sql` — Operators, RBAC, and audit logs
4. `0300_platform.sql` — six runtime control-plane tables
5. `0400_content.sql` — 31 canonical content tables and trigram indexes
6. `0500_learning.sql` — ten user learning fact/state tables
7. `0600_audio.sql` — nine audio production tables
8. `0700_social.sql` — 19 profile, relationship, and content tables
9. `0800_chat.sql` — seven frozen Chat tables
10. `0900_commerce.sql` — 16 Commerce tables
11. `1000_rewards.sql` — five Rewards tables
12. `1100_trust.sql` — five non-conflicting Trust tables
13. `1200_asset_infrastructure.sql` — canonical physical asset facts
14. `1210_trust_evidence.sql` — Trust evidence with logical `asset_id`
15. `1220_identity_auth_runtime.sql` — OTP, devices, and revocable sessions
16. `1230_system_outbox.sql` — shared transactional outbox
17. `1240_content_revision.sql` — Content revision history and publication

The standalone boundary query in `checks/illegal_cross_domain_fk.sql` must
return zero rows. The Node audit runs the same catalog rule and also verifies
business/infrastructure schemas, tables, PK coverage, logical UUID contracts,
extensions, constraints, and indexes.

## Next stage boundary

This task stops at the V2 PostgreSQL Database Baseline. Repository, Service,
API, frontend, and legacy-data migration remain a separate Domain-by-Domain
Application Migration task.
