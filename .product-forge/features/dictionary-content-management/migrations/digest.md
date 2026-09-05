# Migration Plan — Digest

Forward-only implementation: `1340_content_idempotency.sql`. The Content replay ledger supports aggregate mutation and revision-flow request replay. Existing frozen `pg_trgm` indexes remain authoritative for dictionary search; no frozen migration was modified. An isolated PostgreSQL 18 clean-install/replay/audit validation passed with 1340 applied.
