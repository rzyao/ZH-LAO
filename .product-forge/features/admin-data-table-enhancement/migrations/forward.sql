-- IMPLEMENTATION CANDIDATE FOR T005 ONLY.
-- This file is a Product Forge planning artifact, not database authority.
-- T005 must re-check the canonical Content database contract and adopt the
-- reviewed DDL into database/migrations/1340_content_letter_batch_tasks.sql.
-- The repository migration runner wraps each migration in a transaction.

CREATE TABLE content.lo_letter_batch_tasks (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id uuid NOT NULL,
    action varchar(24) NOT NULL,
    selection_mode varchar(16) NOT NULL,
    selection_query jsonb,
    selection_hash varchar(64) NOT NULL,
    expected_count integer NOT NULL,
    target_count integer NOT NULL,
    reason text,
    requested_by_operator_id uuid NOT NULL,
    idempotency_key varchar(128) NOT NULL,
    status varchar(32) NOT NULL DEFAULT 'queued',
    processed_count integer NOT NULL DEFAULT 0,
    succeeded_count integer NOT NULL DEFAULT 0,
    failed_count integer NOT NULL DEFAULT 0,
    skipped_count integer NOT NULL DEFAULT 0,
    last_error_code varchar(64),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    started_at timestamptz,
    completed_at timestamptz,
    CONSTRAINT lo_letter_batch_tasks_public_id_key UNIQUE (public_id),
    CONSTRAINT lo_letter_batch_tasks_operator_idempotency_key
        UNIQUE (requested_by_operator_id, idempotency_key),
    CONSTRAINT lo_letter_batch_tasks_action_check CHECK (
        action IN ('submit_review', 'approve', 'reject', 'publish', 'archive')
    ),
    CONSTRAINT lo_letter_batch_tasks_selection_mode_check CHECK (
        selection_mode IN ('explicit_ids', 'query_all')
    ),
    CONSTRAINT lo_letter_batch_tasks_selection_query_check CHECK (
        (selection_mode = 'query_all'
            AND selection_query IS NOT NULL
            AND jsonb_typeof(selection_query) = 'object')
        OR (selection_mode = 'explicit_ids' AND selection_query IS NULL)
    ),
    CONSTRAINT lo_letter_batch_tasks_selection_hash_check CHECK (
        selection_hash ~ '^[0-9a-f]{64}$'
    ),
    CONSTRAINT lo_letter_batch_tasks_counts_positive_check CHECK (
        expected_count > 0 AND target_count > 0
    ),
    CONSTRAINT lo_letter_batch_tasks_frozen_count_check CHECK (
        target_count = expected_count
    ),
    CONSTRAINT lo_letter_batch_tasks_reason_check CHECK (
        (action IN ('reject', 'archive') AND btrim(coalesce(reason, '')) <> '')
        OR (action NOT IN ('reject', 'archive') AND reason IS NULL)
    ),
    CONSTRAINT lo_letter_batch_tasks_status_check CHECK (
        status IN ('queued', 'running', 'completed', 'completed_with_issues', 'failed')
    ),
    CONSTRAINT lo_letter_batch_tasks_counters_nonnegative_check CHECK (
        processed_count >= 0
        AND succeeded_count >= 0
        AND failed_count >= 0
        AND skipped_count >= 0
    ),
    CONSTRAINT lo_letter_batch_tasks_counter_sum_check CHECK (
        processed_count = succeeded_count + failed_count + skipped_count
    ),
    CONSTRAINT lo_letter_batch_tasks_processed_target_check CHECK (
        processed_count <= target_count
    ),
    CONSTRAINT lo_letter_batch_tasks_terminal_count_check CHECK (
        status NOT IN ('completed', 'completed_with_issues')
        OR processed_count = target_count
    ),
    CONSTRAINT lo_letter_batch_tasks_lifecycle_time_check CHECK (
        (status = 'queued' AND started_at IS NULL AND completed_at IS NULL)
        OR (status = 'running' AND started_at IS NOT NULL AND completed_at IS NULL)
        OR (status IN ('completed', 'completed_with_issues', 'failed')
            AND started_at IS NOT NULL
            AND completed_at IS NOT NULL
            AND completed_at >= started_at)
    )
);

CREATE TABLE content.lo_letter_batch_task_items (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    task_id bigint NOT NULL,
    item_no integer NOT NULL,
    content_id uuid NOT NULL,
    revision_id uuid,
    status varchar(16) NOT NULL DEFAULT 'queued',
    error_code varchar(64),
    error_message text,
    retry_count integer NOT NULL DEFAULT 0,
    last_attempt_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT lo_letter_batch_task_items_task_fk
        FOREIGN KEY (task_id)
        REFERENCES content.lo_letter_batch_tasks(id)
        ON DELETE RESTRICT,
    CONSTRAINT lo_letter_batch_task_items_task_item_key UNIQUE (task_id, item_no),
    CONSTRAINT lo_letter_batch_task_items_task_content_key UNIQUE (task_id, content_id),
    CONSTRAINT lo_letter_batch_task_items_item_no_check CHECK (item_no > 0),
    CONSTRAINT lo_letter_batch_task_items_status_check CHECK (
        status IN ('queued', 'running', 'succeeded', 'failed', 'skipped')
    ),
    CONSTRAINT lo_letter_batch_task_items_retry_count_check CHECK (retry_count >= 0),
    CONSTRAINT lo_letter_batch_task_items_result_check CHECK (
        (status IN ('queued', 'running', 'succeeded')
            AND error_code IS NULL
            AND error_message IS NULL)
        OR (status IN ('failed', 'skipped') AND error_code IS NOT NULL)
    ),
    CONSTRAINT lo_letter_batch_task_items_lifecycle_time_check CHECK (
        (status = 'queued' AND last_attempt_at IS NULL AND completed_at IS NULL)
        OR (status = 'running' AND last_attempt_at IS NOT NULL AND completed_at IS NULL)
        OR (status IN ('succeeded', 'failed', 'skipped')
            AND last_attempt_at IS NOT NULL
            AND completed_at IS NOT NULL
            AND completed_at >= last_attempt_at)
    )
);

CREATE INDEX idx_lo_letter_batch_tasks_queue
    ON content.lo_letter_batch_tasks(status, created_at)
    WHERE status IN ('queued', 'running');

CREATE INDEX idx_lo_letter_batch_tasks_owned_history
    ON content.lo_letter_batch_tasks(requested_by_operator_id, created_at DESC, id DESC);

CREATE INDEX idx_lo_letter_batch_task_items_status
    ON content.lo_letter_batch_task_items(task_id, status, item_no);
