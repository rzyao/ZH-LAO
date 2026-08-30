-- Source: docs/docs/domains/rewards/database.md

CREATE TABLE rewards.reward_programs (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    program_key varchar(64) NOT NULL UNIQUE,
    name varchar(120) NOT NULL,
    description text,
    status varchar(16) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'ENDED', 'ARCHIVED')),
    starts_at timestamptz,
    ends_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);
CREATE INDEX idx_reward_programs_status ON rewards.reward_programs(status);

CREATE TABLE rewards.reward_rules (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    program_id bigint NOT NULL REFERENCES rewards.reward_programs(id) ON DELETE RESTRICT,
    rule_key varchar(64) NOT NULL,
    version integer NOT NULL DEFAULT 1 CHECK (version > 0),
    name varchar(120) NOT NULL,
    status varchar(16) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'RETIRED')),
    trigger_event_type varchar(64) NOT NULL,
    reward_type varchar(32) NOT NULL DEFAULT 'COIN' CHECK (reward_type = 'COIN'),
    reward_amount bigint NOT NULL CHECK (reward_amount > 0),
    condition_config jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(condition_config) = 'object'),
    limit_config jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(limit_config) = 'object'),
    priority integer NOT NULL DEFAULT 100 CHECK (priority >= 0),
    effective_from timestamptz,
    effective_to timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (program_id, rule_key, version),
    CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to > effective_from),
    CHECK (status = 'DRAFT' OR effective_from IS NOT NULL),
    CHECK (status <> 'RETIRED' OR effective_to IS NOT NULL)
);
CREATE UNIQUE INDEX uq_reward_rules_current
    ON rewards.reward_rules(program_id, rule_key) WHERE status IN ('ACTIVE', 'PAUSED');
CREATE INDEX idx_reward_rules_program_status ON rewards.reward_rules(program_id, status);
CREATE INDEX idx_reward_rules_trigger ON rewards.reward_rules(trigger_event_type);
CREATE INDEX idx_reward_rules_trigger_window
    ON rewards.reward_rules(trigger_event_type, effective_from, effective_to);

CREATE TABLE rewards.reward_events (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source_domain varchar(32) NOT NULL,
    source_event_id uuid NOT NULL,
    event_type varchar(64) NOT NULL,
    event_version integer NOT NULL CHECK (event_version > 0),
    subject_user_id uuid NOT NULL,
    source_reference_type varchar(64),
    source_reference_id uuid,
    occurred_at timestamptz NOT NULL,
    payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
    processing_status varchar(16) NOT NULL DEFAULT 'RECEIVED'
        CHECK (processing_status IN ('RECEIVED', 'PROCESSING', 'PROCESSED', 'IGNORED', 'FAILED')),
    attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    processing_started_at timestamptz,
    next_retry_at timestamptz,
    processed_at timestamptz,
    last_error_code varchar(64),
    last_error_message text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (source_domain, source_event_id),
    CHECK (
        (source_reference_type IS NULL AND source_reference_id IS NULL) OR
        (source_reference_type IS NOT NULL AND source_reference_id IS NOT NULL)
    ),
    CHECK (processing_status <> 'PROCESSING' OR processing_started_at IS NOT NULL),
    CHECK (processing_status NOT IN ('PROCESSED', 'IGNORED') OR processed_at IS NOT NULL)
);
CREATE INDEX idx_reward_events_processing_queue ON rewards.reward_events(next_retry_at, created_at)
    WHERE processing_status = 'RECEIVED';
CREATE INDEX idx_reward_events_stale_processing ON rewards.reward_events(processing_started_at)
    WHERE processing_status = 'PROCESSING';
CREATE INDEX idx_reward_events_type_occurred ON rewards.reward_events(event_type, occurred_at DESC);
CREATE INDEX idx_reward_events_user_occurred ON rewards.reward_events(subject_user_id, occurred_at DESC);
CREATE INDEX idx_reward_events_source_reference
    ON rewards.reward_events(source_reference_type, source_reference_id) WHERE source_reference_id IS NOT NULL;

CREATE TABLE rewards.reward_grants (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    grant_no uuid NOT NULL UNIQUE,
    program_id bigint NOT NULL REFERENCES rewards.reward_programs(id) ON DELETE RESTRICT,
    rule_id bigint NOT NULL REFERENCES rewards.reward_rules(id) ON DELETE RESTRICT,
    event_id bigint NOT NULL REFERENCES rewards.reward_events(id) ON DELETE RESTRICT,
    user_id uuid NOT NULL,
    reward_type varchar(32) NOT NULL CHECK (reward_type = 'COIN'),
    reward_amount bigint NOT NULL CHECK (reward_amount > 0),
    reason_code varchar(64) NOT NULL,
    dedupe_key varchar(200) NOT NULL UNIQUE,
    decision_status varchar(16) NOT NULL CHECK (decision_status IN ('GRANTED', 'VOIDED')),
    granted_at timestamptz NOT NULL,
    voided_at timestamptz,
    void_reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (rule_id, event_id, user_id),
    CHECK (
        (decision_status = 'VOIDED' AND voided_at IS NOT NULL AND void_reason IS NOT NULL) OR
        (decision_status = 'GRANTED' AND voided_at IS NULL AND void_reason IS NULL)
    )
);
CREATE INDEX idx_reward_grants_user_time ON rewards.reward_grants(user_id, granted_at DESC);
CREATE INDEX idx_reward_grants_program_time ON rewards.reward_grants(program_id, granted_at DESC);
CREATE INDEX idx_reward_grants_rule_user_status ON rewards.reward_grants(rule_id, user_id, decision_status);
CREATE INDEX idx_reward_grants_event ON rewards.reward_grants(event_id);

CREATE TABLE rewards.reward_deliveries (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    grant_id bigint NOT NULL UNIQUE REFERENCES rewards.reward_grants(id) ON DELETE RESTRICT,
    target_domain varchar(32) NOT NULL CHECK (target_domain = 'COMMERCE'),
    delivery_type varchar(32) NOT NULL CHECK (delivery_type = 'ASSET_CREDIT'),
    idempotency_key varchar(128) NOT NULL UNIQUE,
    status varchar(16) NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'RETRY_WAIT', 'SUCCEEDED', 'FAILED', 'CANCELLED')),
    attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    processing_started_at timestamptz,
    next_retry_at timestamptz,
    target_reference_id uuid,
    last_error_code varchar(64),
    last_error_message text,
    delivered_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (status <> 'PROCESSING' OR processing_started_at IS NOT NULL),
    CHECK (status <> 'RETRY_WAIT' OR next_retry_at IS NOT NULL),
    CHECK (status <> 'SUCCEEDED' OR (delivered_at IS NOT NULL AND target_reference_id IS NOT NULL)),
    CHECK (status = 'SUCCEEDED' OR delivered_at IS NULL)
);
CREATE UNIQUE INDEX uq_reward_deliveries_target_reference
    ON rewards.reward_deliveries(target_domain, target_reference_id) WHERE target_reference_id IS NOT NULL;
CREATE INDEX idx_reward_deliveries_retry_queue ON rewards.reward_deliveries(next_retry_at, created_at)
    WHERE status IN ('PENDING', 'RETRY_WAIT');
CREATE INDEX idx_reward_deliveries_stale_processing ON rewards.reward_deliveries(processing_started_at)
    WHERE status = 'PROCESSING';
CREATE INDEX idx_reward_deliveries_status_created ON rewards.reward_deliveries(status, created_at);
CREATE INDEX idx_reward_deliveries_target_status ON rewards.reward_deliveries(target_domain, status);
