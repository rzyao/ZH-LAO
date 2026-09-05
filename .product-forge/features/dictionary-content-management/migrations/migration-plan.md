# Migration Plan

Implementation allocated `1340_content_idempotency.sql`, the next actual repository number after the effective 1290–1330 chain. It creates the Content-owned replay ledger `(operator_id, idempotency_key)` with a normalized request hash and recorded response. It does not alter 0400, 1240, or 1290, create child public identities, or add a child lifecycle.

The frozen 0400 schema already provides the required `pg_trgm` word indexes, so no duplicate search index migration is needed. An isolated PostgreSQL 18 validation completed clean install, replayed the migration chain, ran catalog audit and passed with 1340 included. Rollback of a replay ledger is operational only and must not delete records from an applied production migration.
