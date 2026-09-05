# Migration Plan — Digest

> **Feature:** admin-data-table-enhancement  
> **Phase:** migration-plan  
> **Generated at:** 2026-09-05T01:11:12+08:00  
> **DB:** PostgreSQL 18  
> **Owner:** Content

## Outcome

Prepared an additive, expand-only, zero-downtime migration package for the two new Content-owned Lao-letter batch task tables. The package is planning input for SpecKit task T005 and does not replace the canonical Content database contract or create the authoritative `database/migrations/1340_content_letter_batch_tasks.sql` file.

## Key decisions

- Add two initially empty tables; do not modify existing tables or frozen migrations.
- Keep Operator, Content and Revision UUIDs as logical references; item-to-task is the only physical FK and uses `ON DELETE RESTRICT`.
- Create queue, owner-history and stable item-result indexes atomically with the empty tables.
- The post-adoption catalog target is 133 total tables (131 business + 2 infrastructure), including 38 Content tables. <!-- CR-001: correct derived table counts to the current 1330 repository baseline -->
- No backfill exists or is needed, so no `backfill.md` was created.
- Prefer application rollback with the additive schema retained. SQL rollback is destructive after the first task is written and requires explicit approval plus a verified backup.

## Artifacts

- `migration-plan.md` — schema diff, strategy, pre-checks, rollout and rollback criteria.
- `forward.sql` — runnable, non-authoritative candidate for T005 adoption.
- `rollback.sql` — destructive reverse DDL with data-loss warning.
- `validation.sql` — read-only fail-fast verification of tables, columns, constraints, indexes and FK boundary.
- `risk-matrix.md` — twelve risks with measurable detection and concrete mitigation.

## Implementation handoff

T005 must re-check the current canonical Content database page and ADR-028, adopt the reviewed SQL into exactly `1340_content_letter_batch_tasks.sql`, generate the migration manifest, update expected-schema/report inputs, and prove clean install plus 1330→1340 upgrade on disposable PostgreSQL. Do not modify any applied migration.
