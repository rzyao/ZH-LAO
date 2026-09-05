-- ADR-032: durable, Content-owned idempotency receipts for Course/Lesson
-- revision lifecycle commands. All rows are created and completed inside the
-- same local transaction as the lifecycle mutation and Operations audit.

CREATE TABLE content.curriculum_command_receipts (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    operator_id uuid NOT NULL,
    aggregate_type varchar(16) NOT NULL CHECK (aggregate_type IN ('course', 'lesson')),
    aggregate_id uuid NOT NULL,
    command varchar(32) NOT NULL CHECK (command IN (
        'course.submit', 'course.review', 'course.publish',
        'lesson.submit', 'lesson.review', 'lesson.publish'
    )),
    idempotency_key varchar(128) NOT NULL CHECK (length(btrim(idempotency_key)) > 0),
    request_fingerprint varchar(64) NOT NULL CHECK (request_fingerprint ~ '^[0-9a-f]{64}$'),
    response_payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(response_payload) = 'object'),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT curriculum_command_receipts_idempotency_unique
        UNIQUE (operator_id, aggregate_type, aggregate_id, command, idempotency_key)
);

CREATE INDEX idx_curriculum_command_receipts_aggregate
    ON content.curriculum_command_receipts (aggregate_type, aggregate_id, created_at DESC);
