-- Source: docs/docs/domains/platform/database.md
-- V2 blocker resolution: one shared transactional outbox for all Domains.

CREATE TABLE infrastructure.system_outbox_events (
    id uuid PRIMARY KEY,
    event_id uuid NOT NULL UNIQUE,
    source_domain varchar(32) NOT NULL,
    event_type varchar(128) NOT NULL,
    aggregate_type varchar(64) NOT NULL,
    aggregate_id uuid NOT NULL,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(payload) = 'object'),
    headers jsonb NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(headers) = 'object'),
    occurred_at timestamptz NOT NULL,
    available_at timestamptz NOT NULL DEFAULT now(),
    published_at timestamptz,
    attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    last_error text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_outbox_unpublished
    ON infrastructure.system_outbox_events(available_at, created_at)
    WHERE published_at IS NULL;
CREATE INDEX idx_outbox_event_id
    ON infrastructure.system_outbox_events(event_id);
CREATE INDEX idx_outbox_source_aggregate
    ON infrastructure.system_outbox_events(source_domain, aggregate_type, aggregate_id, created_at DESC);
