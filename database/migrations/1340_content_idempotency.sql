-- Content revision workflow transport idempotency.
-- Forward-only: 0400, 1240 and 1290 remain frozen.

CREATE TABLE content.idempotency_records (
    operator_id uuid NOT NULL,
    idempotency_key varchar(128) NOT NULL,
    request_hash char(64) NOT NULL,
    response_payload jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (operator_id, idempotency_key)
);

COMMENT ON TABLE content.idempotency_records IS
  'Content command replay records; same operator/key/hash returns the recorded result, different hash is rejected.';
