# Migration Plan — 管理端通用数据表增强

> Generated: 2026-09-05T01:11:12+08:00  
> DB: PostgreSQL 18  
> Strategy: additive expand-only / zero-downtime  
> Owner: Content

## Authority and scope

This is an implementation-planning artifact, not database authority. The canonical field and constraint contract remains `docs/docs/developer/reference/domains/content/database.md`, with ownership and retention fixed by ADR-028. `forward.sql` is a runnable candidate for SpecKit task T005 to adopt into the new forward migration `database/migrations/1340_content_letter_batch_tasks.sql` after review. It must not be copied over a frozen migration or treated as independently authoritative.

The change adds two empty Content-owned tables. It does not alter any existing table, rewrite rows, introduce a cross-domain FK, or change an applied migration.

## Schema diff

| Change | Object | Type | Before | After | Reversible? |
| --- | --- | --- | --- | --- | :---: |
| ADD | `content.lo_letter_batch_tasks` | table | absent | Durable task, selection, idempotency, lifecycle, counters, reason and audit timestamps | Yes before writes; destructive after writes |
| ADD | `content.lo_letter_batch_task_items` | table | absent | Frozen Content/Revision UUID targets and durable per-item outcomes | Yes before writes; destructive after writes |
| ADD | item → task | physical FK | absent | `task_id → lo_letter_batch_tasks(id) ON DELETE RESTRICT` | Yes with table rollback |
| ADD | task indexes | indexes | absent | Active queue and creator-history access paths | Yes |
| ADD | item indexes | indexes | absent | Stable task/status/item result access path plus uniqueness | Yes |

Operator, Content and Revision UUIDs remain logical references without physical foreign keys. No existing data is transformed.
After T005 adopts the migration and updates the repository inventory, the expected catalog is 133 total tables (131 business + 2 infrastructure) with 38 tables in `content`, matching the corrected technical plan. <!-- CR-001: correct derived table counts to the current 1330 repository baseline -->

## Strategy per change

- Both tables and all their constraints use **additive expand-only** DDL. They are new objects, so the migration does not rewrite or lock any existing business table.
- The item-to-task FK is created with the new empty tables and `ON DELETE RESTRICT`; validation rejects any additional physical FK on these tables.
- Indexes are created normally inside the migration transaction. `CREATE INDEX CONCURRENTLY` is unnecessary for empty new tables and is incompatible with the repository runner's per-migration transaction.
- Deploy the schema before any application version that reads or writes it. An application rollback should leave the additive tables in place. Contract/removal work is not part of this feature.

## Execution sequence

1. Complete every pre-check and take a restorable backup/snapshot according to the environment runbook.
2. Have T005 re-ground the candidate against the canonical Content database page and adopt reviewed SQL as exactly `1340_content_letter_batch_tasks.sql`.
3. Apply through the repository migration runner, which holds its advisory lock, executes one migration transaction, and records the frozen file checksum.
4. Run `validation.sql` with `psql -v ON_ERROR_STOP=1` against the migrated database.
5. Run the database clean-install and 1330→1340 upgrade tests, expected-schema audit, and generated migration-manifest checks required by T004/T005/T049.
6. Deploy the backend/worker only after database validation passes. Keep task admission disabled until worker readiness is confirmed.

## Pre-migration checklist

- [ ] Confirm the target is PostgreSQL 18 and currently includes the applied 1330 baseline with no checksum mismatch.
- [ ] Confirm neither target table already exists; if either exists, stop and investigate repository drift.
- [ ] Confirm no pending migration uses sequence number `1340` or either target object name.
- [ ] Re-read the canonical Content database contract and ADR-028 at the commit being deployed.
- [ ] Review the adopted 1340 checksum and migration manifest as one change set; never hand-edit the generated hash.
- [ ] Take and test a restorable backup/snapshot before deployment.
- [ ] Verify migration advisory-lock observability, database error alerts, lock-wait alerts, and replica-lag alerts.
- [ ] Dry-run clean install, 1330→1340 upgrade, validation, and rollback on a disposable staging database.
- [ ] Confirm the application version deployed before migration does not query the new tables.
- [ ] Confirm the Content team is named incident owner and the database operator is available for rollback authorization.

## Zero-downtime characteristics

- The forward migration only creates new, initially empty objects in the existing `content` schema.
- No backfill, scan, rewrite, trigger, dual-write window, or contract/drop phase is required.
- Existing application processes remain compatible while the new objects are created.
- The migration runner provides atomicity. A DDL failure rolls back the candidate migration and does not register its checksum.

## Backfill decision

No backfill is required because both tables are new and represent only tasks submitted after the feature is enabled. Existing Content and Revision rows are not copied into them. Consequently, this phase intentionally does **not** create `backfill.md`.

## Post-migration validation

`validation.sql` runs in a read-only transaction and fails on missing/mismatched tables or columns, missing/unvalidated constraints, missing/invalid indexes, an incorrect delete action on the item-to-task FK, or any unexpected physical FK. It does not insert test rows or mutate production data. Behavioral constraint tests with disposable rows remain part of T004/T005 and should run only on a disposable database.

## Rollback triggers and decision

Use these triggers during the migration/application release window:

- Migration transaction fails: allow its automatic rollback; do not manually mark 1340 as applied.
- Any `validation.sql` assertion fails before task writes are enabled: stop deployment and run `rollback.sql` only after confirming no rows exist.
- Database lock wait caused by the migration exceeds 5 seconds or replica replay lag exceeds 30 seconds: pause rollout and assess; because the DDL is atomic and additive, prefer waiting for transaction rollback or completion over killing unrelated sessions.
- After enabling the application, database/API errors attributable to the new schema exceed 1% for 5 minutes and are at least twice the preceding 30-minute baseline: disable task admission and roll back the application first, leaving the tables intact.
- Constraint behavior permits an invalid lifecycle/counter/result row in disposable verification: block application deployment and revise the unapplied candidate. If already applied anywhere, create a new corrective forward migration; never edit frozen bytes.

`rollback.sql` is schema-destructive and permanently removes all task/item history. Once any production task row exists, it requires explicit Content-owner and database-operator approval plus a verified backup. The preferred production rollback is application rollback with the additive schema retained.

## Files produced

- `migrations/forward.sql` — runnable T005 implementation candidate; non-authoritative.
- `migrations/rollback.sql` — destructive reverse script with explicit warning.
- `migrations/validation.sql` — read-only, fail-fast catalog validation.
- `migrations/risk-matrix.md` — concrete risk controls and verification.
- `migrations/digest.md` — phase handoff summary.

## Owner

Content owns migration acceptance, task/item retention, and application behavior. The database operator owns execution and restore mechanics. Operations is consulted for logical Operator UUID and audit integration but does not own these tables.
