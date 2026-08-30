-- Source: docs/docs/domains/audio/database.md

CREATE TABLE audio.audio_slots (
    id uuid PRIMARY KEY,
    source_domain varchar NOT NULL CHECK (source_domain = 'content'),
    content_entity_type varchar NOT NULL,
    content_entity_id uuid NOT NULL,
    language_code varchar NOT NULL,
    audio_role varchar NOT NULL,
    required_content_revision_id uuid NOT NULL,
    required_audio_input_hash varchar NOT NULL,
    status varchar(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'offline')),
    official_asset_version_id uuid,
    UNIQUE (source_domain, content_entity_type, content_entity_id, language_code, audio_role)
);
CREATE INDEX idx_audio_slots_entity ON audio.audio_slots(content_entity_type, content_entity_id);
CREATE INDEX idx_audio_slots_status ON audio.audio_slots(status);

CREATE TABLE audio.audio_tasks (
    id uuid PRIMARY KEY,
    slot_id uuid NOT NULL REFERENCES audio.audio_slots(id) ON DELETE RESTRICT,
    predecessor_task_id uuid REFERENCES audio.audio_tasks(id) ON DELETE RESTRICT,
    production_method varchar(32) NOT NULL CHECK (production_method IN ('tts', 'human_recording')),
    status varchar(32) NOT NULL CHECK (status IN (
        'pending_assignment', 'assigned', 'producing', 'pending_review',
        'production_failed', 'approved', 'rejected', 'published', 'canceled'
    )),
    content_revision_id uuid NOT NULL,
    text_snapshot text NOT NULL,
    pronunciation_snapshot jsonb,
    audio_input_hash varchar NOT NULL,
    tts_preset_key varchar,
    assignee_operator_id uuid,
    created_by_operator_id uuid NOT NULL,
    client_idempotency_key varchar NOT NULL UNIQUE,
    lock_version integer NOT NULL DEFAULT 0 CHECK (lock_version >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    started_at timestamptz,
    completed_at timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT audio_tasks_preset_check CHECK (
        (production_method = 'tts' AND tts_preset_key IS NOT NULL) OR
        (production_method = 'human_recording' AND tts_preset_key IS NULL)
    ),
    CHECK (pronunciation_snapshot IS NULL OR jsonb_typeof(pronunciation_snapshot) IN ('object', 'string'))
);
CREATE UNIQUE INDEX uq_audio_tasks_slot_active ON audio.audio_tasks(slot_id)
    WHERE status IN ('pending_assignment', 'assigned', 'producing', 'pending_review', 'production_failed', 'approved');
CREATE INDEX idx_audio_tasks_assignee_status ON audio.audio_tasks(assignee_operator_id, status)
    WHERE assignee_operator_id IS NOT NULL;

CREATE TABLE audio.audio_generation_attempts (
    id uuid PRIMARY KEY,
    task_id uuid NOT NULL REFERENCES audio.audio_tasks(id) ON DELETE RESTRICT,
    attempt_no integer NOT NULL CHECK (attempt_no > 0),
    request_id varchar NOT NULL UNIQUE,
    external_job_id varchar,
    status varchar(32) NOT NULL CHECK (status IN (
        'queued', 'submitting', 'processing', 'retry_wait',
        'succeeded', 'failed', 'dead_letter', 'canceled'
    )),
    transport_retry_count integer NOT NULL DEFAULT 0 CHECK (transport_retry_count >= 0),
    next_retry_at timestamptz,
    lease_until timestamptz,
    failure_code varchar,
    failure_message text,
    created_at timestamptz NOT NULL DEFAULT now(),
    submitted_at timestamptz,
    completed_at timestamptz,
    UNIQUE (task_id, attempt_no)
);
CREATE UNIQUE INDEX uq_audio_attempts_external_job
    ON audio.audio_generation_attempts(external_job_id) WHERE external_job_id IS NOT NULL;
CREATE INDEX idx_audio_attempts_queue
    ON audio.audio_generation_attempts(status, next_retry_at, lease_until);

CREATE TABLE audio.audio_asset_versions (
    id uuid PRIMARY KEY,
    slot_id uuid NOT NULL REFERENCES audio.audio_slots(id) ON DELETE RESTRICT,
    task_id uuid NOT NULL UNIQUE REFERENCES audio.audio_tasks(id) ON DELETE RESTRICT,
    version integer NOT NULL CHECK (version > 0),
    generation_attempt_id uuid UNIQUE REFERENCES audio.audio_generation_attempts(id) ON DELETE RESTRICT,
    producer_operator_id uuid,
    content_revision_id uuid NOT NULL,
    audio_input_hash varchar NOT NULL,
    asset_id uuid NOT NULL UNIQUE,
    duration_ms bigint NOT NULL CHECK (duration_ms > 0),
    sample_rate_hz integer CHECK (sample_rate_hz IS NULL OR sample_rate_hz > 0),
    channels smallint CHECK (channels IS NULL OR channels > 0),
    review_status varchar(32) NOT NULL DEFAULT 'pending_review'
        CHECK (review_status IN ('pending_review', 'approved', 'rejected')),
    first_published_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (slot_id, version),
    UNIQUE (slot_id, id),
    CONSTRAINT audio_asset_versions_source_check CHECK (
        (generation_attempt_id IS NOT NULL AND producer_operator_id IS NULL) OR
        (generation_attempt_id IS NULL AND producer_operator_id IS NOT NULL)
    )
);

ALTER TABLE audio.audio_slots
    ADD CONSTRAINT audio_slots_official_asset_fk
    FOREIGN KEY (id, official_asset_version_id)
    REFERENCES audio.audio_asset_versions(slot_id, id) ON DELETE RESTRICT;

CREATE TABLE audio.audio_reviews (
    id uuid PRIMARY KEY,
    asset_version_id uuid NOT NULL REFERENCES audio.audio_asset_versions(id) ON DELETE RESTRICT,
    reviewer_operator_id uuid NOT NULL,
    decision varchar(32) NOT NULL CHECK (decision IN ('approved', 'rejected', 'approval_revoked')),
    reject_reason varchar(32) CHECK (reject_reason IS NULL OR reject_reason IN (
        'pronunciation_error', 'speed_too_fast', 'speed_too_slow', 'noise',
        'clipping', 'truncated', 'text_mismatch', 'other'
    )),
    remark text,
    request_id varchar NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT audio_reviews_decision_reason_check CHECK (
        (decision = 'rejected' AND reject_reason IS NOT NULL) OR
        (decision <> 'rejected' AND reject_reason IS NULL)
    ),
    CONSTRAINT audio_reviews_revoke_remark_check CHECK (
        decision <> 'approval_revoked' OR remark IS NOT NULL
    )
);
CREATE INDEX idx_audio_reviews_asset_time ON audio.audio_reviews(asset_version_id, created_at);

CREATE TABLE audio.audio_task_events (
    id uuid PRIMARY KEY,
    task_id uuid NOT NULL REFERENCES audio.audio_tasks(id) ON DELETE RESTRICT,
    event_type varchar(32) NOT NULL CHECK (event_type IN (
        'task_created', 'assigned', 'production_started', 'production_retry',
        'production_failed', 'asset_created', 'review_approved', 'review_rejected',
        'review_revoked', 'successor_created', 'published', 'canceled'
    )),
    actor_type varchar(32) NOT NULL CHECK (actor_type IN ('operator', 'system', 'tts')),
    actor_id uuid,
    from_status varchar,
    to_status varchar,
    request_id varchar NOT NULL UNIQUE,
    payload jsonb CHECK (payload IS NULL OR jsonb_typeof(payload) = 'object'),
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT audio_task_events_actor_check CHECK (
        actor_type <> 'operator' OR actor_id IS NOT NULL
    )
);
CREATE INDEX idx_audio_task_events_task_time ON audio.audio_task_events(task_id, created_at);
CREATE INDEX idx_audio_task_events_type_time ON audio.audio_task_events(event_type, created_at);

CREATE TABLE audio.audio_task_batches (
    id uuid PRIMARY KEY,
    production_method varchar(32) NOT NULL CHECK (production_method IN ('tts', 'human_recording')),
    tts_preset_key varchar,
    client_idempotency_key varchar NOT NULL UNIQUE,
    request_hash varchar NOT NULL,
    status varchar(32) NOT NULL CHECK (status IN ('creating', 'completed', 'failed', 'canceled')),
    requested_count integer NOT NULL CHECK (requested_count >= 0),
    created_count integer NOT NULL DEFAULT 0 CHECK (created_count >= 0),
    skipped_count integer NOT NULL DEFAULT 0 CHECK (skipped_count >= 0),
    failed_count integer NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
    created_by_operator_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    CONSTRAINT audio_task_batches_preset_check CHECK (
        production_method = 'tts' OR tts_preset_key IS NULL
    )
);

CREATE TABLE audio.audio_task_batch_items (
    id uuid PRIMARY KEY,
    batch_id uuid NOT NULL REFERENCES audio.audio_task_batches(id) ON DELETE RESTRICT,
    item_no integer NOT NULL CHECK (item_no > 0),
    slot_id uuid REFERENCES audio.audio_slots(id) ON DELETE RESTRICT,
    task_id uuid REFERENCES audio.audio_tasks(id) ON DELETE RESTRICT,
    result_status varchar(32) NOT NULL CHECK (result_status IN ('created', 'skipped', 'failed')),
    result_code varchar,
    result_message text,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (batch_id, item_no),
    CONSTRAINT audio_batch_items_created_check CHECK (
        result_status <> 'created' OR (slot_id IS NOT NULL AND task_id IS NOT NULL)
    )
);
CREATE UNIQUE INDEX uq_audio_batch_items_slot
    ON audio.audio_task_batch_items(batch_id, slot_id) WHERE slot_id IS NOT NULL;

CREATE TABLE audio.audio_default_presets (
    id uuid PRIMARY KEY,
    source_domain varchar NOT NULL,
    content_entity_type varchar NOT NULL,
    language_code varchar NOT NULL,
    audio_role varchar NOT NULL,
    default_tts_preset_key varchar NOT NULL,
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (source_domain, content_entity_type, language_code, audio_role)
);
