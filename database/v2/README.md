# ZH-LAO V2 PostgreSQL baseline

This directory contains the forward-only PostgreSQL 18 baseline derived from
the frozen ZH-LAO Domain documentation dated 2026-08-30.

## Status

The executable baseline creates all 11 business schemas and 117 business
tables. It intentionally does not invent physical contracts for four blocked
tables:

- `identity.otp_challenges`
- `identity.sessions`
- `identity.devices`
- `trust.moderation_evidence`

Asset/Media Infrastructure, `system_outbox_events`, and the Content Revision
physical model are also specification blockers. See
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
then creates and retains a uniquely named `zh_lao_v2_validation_<timestamp>`
database from `template0`:

```bash
ADMIN_DATABASE_URL='postgresql://.../postgres' pnpm run validate
```

Real credentials must remain in environment variables and must never be added
to this directory. `.env.example` contains placeholders only.

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

The standalone boundary query in `checks/illegal_cross_domain_fk.sql` must
return zero rows. The Node audit runs the same catalog rule and also verifies
schemas, tables, PK coverage, logical UUID contracts, extensions, constraints,
and indexes.
