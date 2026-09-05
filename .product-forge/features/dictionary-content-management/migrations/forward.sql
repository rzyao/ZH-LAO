-- Implemented as database/migrations/1340_content_idempotency.sql.
-- Forward-only; frozen migrations 0400, 1240 and 1290 are unchanged.
CREATE TABLE content.idempotency_records (
    operator_id uuid NOT NULL,
    idempotency_key varchar(128) NOT NULL,
    request_hash char(64) NOT NULL,
    response_payload jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (operator_id, idempotency_key)
);
