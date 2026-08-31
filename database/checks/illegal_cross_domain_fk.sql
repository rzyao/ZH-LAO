-- Any returned row is a V2 boundary violation.
-- The audit tool labels the same result as VIOLATION and fails validation.
SELECT
    'VIOLATION' AS result,
    source_ns.nspname AS source_schema,
    source_table.relname AS source_table,
    constraint_row.conname AS constraint_name,
    target_ns.nspname AS target_schema,
    target_table.relname AS target_table,
    pg_get_constraintdef(constraint_row.oid, true) AS definition
FROM pg_constraint AS constraint_row
JOIN pg_class AS source_table
  ON source_table.oid = constraint_row.conrelid
JOIN pg_namespace AS source_ns
  ON source_ns.oid = source_table.relnamespace
JOIN pg_class AS target_table
  ON target_table.oid = constraint_row.confrelid
JOIN pg_namespace AS target_ns
  ON target_ns.oid = target_table.relnamespace
WHERE constraint_row.contype = 'f'
  AND source_ns.nspname IN (
    'identity', 'content', 'learning', 'social', 'chat', 'audio',
    'commerce', 'rewards', 'trust', 'operations', 'platform'
  )
  AND target_ns.nspname IN (
    'identity', 'content', 'learning', 'social', 'chat', 'audio',
    'commerce', 'rewards', 'trust', 'operations', 'platform'
  )
  AND source_ns.nspname <> target_ns.nspname
ORDER BY source_ns.nspname, source_table.relname, constraint_row.conname;
