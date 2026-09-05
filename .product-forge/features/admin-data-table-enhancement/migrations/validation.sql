-- Read-only, fail-fast validation for the T005 implementation candidate.
-- Run after the adopted 1340 migration. Any mismatch raises an exception and
-- causes a non-zero psql result when invoked with ON_ERROR_STOP=1.

BEGIN TRANSACTION READ ONLY;

DO $$
DECLARE
    missing_columns text;
    unexpected_columns text;
    missing_constraints text;
    missing_indexes text;
BEGIN
    IF to_regclass('content.lo_letter_batch_tasks') IS NULL THEN
        RAISE EXCEPTION 'missing table content.lo_letter_batch_tasks';
    END IF;

    IF to_regclass('content.lo_letter_batch_task_items') IS NULL THEN
        RAISE EXCEPTION 'missing table content.lo_letter_batch_task_items';
    END IF;

    WITH expected(table_name, column_name, data_type, udt_name, is_nullable, max_length, is_identity) AS (
        VALUES
            ('lo_letter_batch_tasks', 'id', 'bigint', 'int8', 'NO', NULL::integer, 'YES'),
            ('lo_letter_batch_tasks', 'public_id', 'uuid', 'uuid', 'NO', NULL, 'NO'),
            ('lo_letter_batch_tasks', 'action', 'character varying', 'varchar', 'NO', 24, 'NO'),
            ('lo_letter_batch_tasks', 'selection_mode', 'character varying', 'varchar', 'NO', 16, 'NO'),
            ('lo_letter_batch_tasks', 'selection_query', 'jsonb', 'jsonb', 'YES', NULL, 'NO'),
            ('lo_letter_batch_tasks', 'selection_hash', 'character varying', 'varchar', 'NO', 64, 'NO'),
            ('lo_letter_batch_tasks', 'expected_count', 'integer', 'int4', 'NO', NULL, 'NO'),
            ('lo_letter_batch_tasks', 'target_count', 'integer', 'int4', 'NO', NULL, 'NO'),
            ('lo_letter_batch_tasks', 'reason', 'text', 'text', 'YES', NULL, 'NO'),
            ('lo_letter_batch_tasks', 'requested_by_operator_id', 'uuid', 'uuid', 'NO', NULL, 'NO'),
            ('lo_letter_batch_tasks', 'idempotency_key', 'character varying', 'varchar', 'NO', 128, 'NO'),
            ('lo_letter_batch_tasks', 'status', 'character varying', 'varchar', 'NO', 32, 'NO'),
            ('lo_letter_batch_tasks', 'processed_count', 'integer', 'int4', 'NO', NULL, 'NO'),
            ('lo_letter_batch_tasks', 'succeeded_count', 'integer', 'int4', 'NO', NULL, 'NO'),
            ('lo_letter_batch_tasks', 'failed_count', 'integer', 'int4', 'NO', NULL, 'NO'),
            ('lo_letter_batch_tasks', 'skipped_count', 'integer', 'int4', 'NO', NULL, 'NO'),
            ('lo_letter_batch_tasks', 'last_error_code', 'character varying', 'varchar', 'YES', 64, 'NO'),
            ('lo_letter_batch_tasks', 'created_at', 'timestamp with time zone', 'timestamptz', 'NO', NULL, 'NO'),
            ('lo_letter_batch_tasks', 'updated_at', 'timestamp with time zone', 'timestamptz', 'NO', NULL, 'NO'),
            ('lo_letter_batch_tasks', 'started_at', 'timestamp with time zone', 'timestamptz', 'YES', NULL, 'NO'),
            ('lo_letter_batch_tasks', 'completed_at', 'timestamp with time zone', 'timestamptz', 'YES', NULL, 'NO'),
            ('lo_letter_batch_task_items', 'id', 'bigint', 'int8', 'NO', NULL, 'YES'),
            ('lo_letter_batch_task_items', 'task_id', 'bigint', 'int8', 'NO', NULL, 'NO'),
            ('lo_letter_batch_task_items', 'item_no', 'integer', 'int4', 'NO', NULL, 'NO'),
            ('lo_letter_batch_task_items', 'content_id', 'uuid', 'uuid', 'NO', NULL, 'NO'),
            ('lo_letter_batch_task_items', 'revision_id', 'uuid', 'uuid', 'YES', NULL, 'NO'),
            ('lo_letter_batch_task_items', 'status', 'character varying', 'varchar', 'NO', 16, 'NO'),
            ('lo_letter_batch_task_items', 'error_code', 'character varying', 'varchar', 'YES', 64, 'NO'),
            ('lo_letter_batch_task_items', 'error_message', 'text', 'text', 'YES', NULL, 'NO'),
            ('lo_letter_batch_task_items', 'retry_count', 'integer', 'int4', 'NO', NULL, 'NO'),
            ('lo_letter_batch_task_items', 'last_attempt_at', 'timestamp with time zone', 'timestamptz', 'YES', NULL, 'NO'),
            ('lo_letter_batch_task_items', 'completed_at', 'timestamp with time zone', 'timestamptz', 'YES', NULL, 'NO'),
            ('lo_letter_batch_task_items', 'created_at', 'timestamp with time zone', 'timestamptz', 'NO', NULL, 'NO'),
            ('lo_letter_batch_task_items', 'updated_at', 'timestamp with time zone', 'timestamptz', 'NO', NULL, 'NO')
    ), actual AS (
        SELECT table_name, column_name, data_type, udt_name, is_nullable,
               character_maximum_length AS max_length, is_identity
        FROM information_schema.columns
        WHERE table_schema = 'content'
          AND table_name IN ('lo_letter_batch_tasks', 'lo_letter_batch_task_items')
    )
    SELECT string_agg(format('%s.%s', e.table_name, e.column_name), ', ' ORDER BY e.table_name, e.column_name)
    INTO missing_columns
    FROM expected e
    LEFT JOIN actual a
      ON a.table_name = e.table_name
     AND a.column_name = e.column_name
     AND a.data_type = e.data_type
     AND a.udt_name = e.udt_name
     AND a.is_nullable = e.is_nullable
     AND a.max_length IS NOT DISTINCT FROM e.max_length
     AND a.is_identity = e.is_identity
    WHERE a.column_name IS NULL;

    IF missing_columns IS NOT NULL THEN
        RAISE EXCEPTION 'missing or mismatched columns: %', missing_columns;
    END IF;

    WITH expected(table_name, column_name) AS (
        VALUES
            ('lo_letter_batch_tasks', 'id'), ('lo_letter_batch_tasks', 'public_id'),
            ('lo_letter_batch_tasks', 'action'), ('lo_letter_batch_tasks', 'selection_mode'),
            ('lo_letter_batch_tasks', 'selection_query'), ('lo_letter_batch_tasks', 'selection_hash'),
            ('lo_letter_batch_tasks', 'expected_count'), ('lo_letter_batch_tasks', 'target_count'),
            ('lo_letter_batch_tasks', 'reason'), ('lo_letter_batch_tasks', 'requested_by_operator_id'),
            ('lo_letter_batch_tasks', 'idempotency_key'), ('lo_letter_batch_tasks', 'status'),
            ('lo_letter_batch_tasks', 'processed_count'), ('lo_letter_batch_tasks', 'succeeded_count'),
            ('lo_letter_batch_tasks', 'failed_count'), ('lo_letter_batch_tasks', 'skipped_count'),
            ('lo_letter_batch_tasks', 'last_error_code'), ('lo_letter_batch_tasks', 'created_at'),
            ('lo_letter_batch_tasks', 'updated_at'), ('lo_letter_batch_tasks', 'started_at'),
            ('lo_letter_batch_tasks', 'completed_at'),
            ('lo_letter_batch_task_items', 'id'), ('lo_letter_batch_task_items', 'task_id'),
            ('lo_letter_batch_task_items', 'item_no'), ('lo_letter_batch_task_items', 'content_id'),
            ('lo_letter_batch_task_items', 'revision_id'), ('lo_letter_batch_task_items', 'status'),
            ('lo_letter_batch_task_items', 'error_code'), ('lo_letter_batch_task_items', 'error_message'),
            ('lo_letter_batch_task_items', 'retry_count'), ('lo_letter_batch_task_items', 'last_attempt_at'),
            ('lo_letter_batch_task_items', 'completed_at'), ('lo_letter_batch_task_items', 'created_at'),
            ('lo_letter_batch_task_items', 'updated_at')
    )
    SELECT string_agg(format('%s.%s', c.table_name, c.column_name), ', ' ORDER BY c.table_name, c.ordinal_position)
    INTO unexpected_columns
    FROM information_schema.columns c
    LEFT JOIN expected e USING (table_name, column_name)
    WHERE c.table_schema = 'content'
      AND c.table_name IN ('lo_letter_batch_tasks', 'lo_letter_batch_task_items')
      AND e.column_name IS NULL;

    IF unexpected_columns IS NOT NULL THEN
        RAISE EXCEPTION 'unexpected columns: %', unexpected_columns;
    END IF;

    WITH expected(name, kind) AS (
        VALUES
            ('lo_letter_batch_tasks_pkey', 'p'),
            ('lo_letter_batch_tasks_public_id_key', 'u'),
            ('lo_letter_batch_tasks_operator_idempotency_key', 'u'),
            ('lo_letter_batch_tasks_action_check', 'c'),
            ('lo_letter_batch_tasks_selection_mode_check', 'c'),
            ('lo_letter_batch_tasks_selection_query_check', 'c'),
            ('lo_letter_batch_tasks_selection_hash_check', 'c'),
            ('lo_letter_batch_tasks_counts_positive_check', 'c'),
            ('lo_letter_batch_tasks_frozen_count_check', 'c'),
            ('lo_letter_batch_tasks_reason_check', 'c'),
            ('lo_letter_batch_tasks_status_check', 'c'),
            ('lo_letter_batch_tasks_counters_nonnegative_check', 'c'),
            ('lo_letter_batch_tasks_counter_sum_check', 'c'),
            ('lo_letter_batch_tasks_processed_target_check', 'c'),
            ('lo_letter_batch_tasks_terminal_count_check', 'c'),
            ('lo_letter_batch_tasks_lifecycle_time_check', 'c'),
            ('lo_letter_batch_task_items_pkey', 'p'),
            ('lo_letter_batch_task_items_task_fk', 'f'),
            ('lo_letter_batch_task_items_task_item_key', 'u'),
            ('lo_letter_batch_task_items_task_content_key', 'u'),
            ('lo_letter_batch_task_items_item_no_check', 'c'),
            ('lo_letter_batch_task_items_status_check', 'c'),
            ('lo_letter_batch_task_items_retry_count_check', 'c'),
            ('lo_letter_batch_task_items_result_check', 'c'),
            ('lo_letter_batch_task_items_lifecycle_time_check', 'c')
    ), actual AS (
        SELECT conname AS name, contype::text AS kind
        FROM pg_constraint
        WHERE conrelid IN (
            'content.lo_letter_batch_tasks'::regclass,
            'content.lo_letter_batch_task_items'::regclass
        )
          AND convalidated
    )
    SELECT string_agg(format('%s (%s)', e.name, e.kind), ', ' ORDER BY e.name)
    INTO missing_constraints
    FROM expected e
    LEFT JOIN actual a USING (name, kind)
    WHERE a.name IS NULL;

    IF missing_constraints IS NOT NULL THEN
        RAISE EXCEPTION 'missing or unvalidated constraints: %', missing_constraints;
    END IF;

    WITH expected(index_name, table_name, is_unique, is_partial) AS (
        VALUES
            ('lo_letter_batch_tasks_pkey', 'lo_letter_batch_tasks', true, false),
            ('lo_letter_batch_tasks_public_id_key', 'lo_letter_batch_tasks', true, false),
            ('lo_letter_batch_tasks_operator_idempotency_key', 'lo_letter_batch_tasks', true, false),
            ('idx_lo_letter_batch_tasks_queue', 'lo_letter_batch_tasks', false, true),
            ('idx_lo_letter_batch_tasks_owned_history', 'lo_letter_batch_tasks', false, false),
            ('lo_letter_batch_task_items_pkey', 'lo_letter_batch_task_items', true, false),
            ('lo_letter_batch_task_items_task_item_key', 'lo_letter_batch_task_items', true, false),
            ('lo_letter_batch_task_items_task_content_key', 'lo_letter_batch_task_items', true, false),
            ('idx_lo_letter_batch_task_items_status', 'lo_letter_batch_task_items', false, false)
    ), actual AS (
        SELECT i.relname AS index_name,
               t.relname AS table_name,
               x.indisunique AS is_unique,
               x.indpred IS NOT NULL AS is_partial,
               x.indisvalid,
               x.indisready
        FROM pg_index x
        JOIN pg_class i ON i.oid = x.indexrelid
        JOIN pg_class t ON t.oid = x.indrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'content'
          AND t.relname IN ('lo_letter_batch_tasks', 'lo_letter_batch_task_items')
    )
    SELECT string_agg(e.index_name, ', ' ORDER BY e.index_name)
    INTO missing_indexes
    FROM expected e
    LEFT JOIN actual a USING (index_name, table_name, is_unique, is_partial)
    WHERE a.index_name IS NULL OR NOT a.indisvalid OR NOT a.indisready;

    IF missing_indexes IS NOT NULL THEN
        RAISE EXCEPTION 'missing, invalid, or unready indexes: %', missing_indexes;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        WHERE c.conname = 'lo_letter_batch_task_items_task_fk'
          AND c.conrelid = 'content.lo_letter_batch_task_items'::regclass
          AND c.confrelid = 'content.lo_letter_batch_tasks'::regclass
          AND c.confdeltype = 'r'
          AND c.convalidated
    ) THEN
        RAISE EXCEPTION 'item-to-task FK is missing, invalid, or not ON DELETE RESTRICT';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'content'
          AND t.relname IN ('lo_letter_batch_tasks', 'lo_letter_batch_task_items')
          AND c.contype = 'f'
          AND c.conname <> 'lo_letter_batch_task_items_task_fk'
    ) THEN
        RAISE EXCEPTION 'unexpected physical FK found on Lao-letter batch tables';
    END IF;
END
$$;

COMMIT;
