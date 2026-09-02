-- Source: docs/docs/domains/trust/database.md
-- V2 blocker resolution: Trust evidence uses an Asset logical UUID for files.
-- storage_key and all other physical storage facts remain owned by
-- infrastructure.assets.

CREATE TABLE trust.moderation_evidence (
    id uuid PRIMARY KEY,
    case_id uuid NOT NULL REFERENCES trust.moderation_cases(id) ON DELETE RESTRICT,
    appeal_id uuid REFERENCES trust.appeals(id) ON DELETE RESTRICT,
    evidence_type varchar(32) NOT NULL CHECK (evidence_type IN (
        'text_snapshot', 'media_snapshot', 'object_reference', 'metadata_snapshot'
    )),
    source_type varchar(24) NOT NULL CHECK (source_type IN (
        'system', 'domain_snapshot', 'reporter', 'appellant', 'moderator'
    )),
    content_text text,
    asset_id uuid,
    reference_domain varchar(32),
    reference_type varchar(32),
    reference_id uuid,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(metadata) = 'object'),
    content_sha256 varchar(64)
        CHECK (content_sha256 IS NULL OR content_sha256 ~ '^[0-9a-f]{64}$'),
    captured_at timestamptz NOT NULL,
    submitted_by_user_id uuid,
    added_by_operator_id uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT moderation_evidence_actor_check CHECK (
        (source_type IN ('reporter', 'appellant')
            AND submitted_by_user_id IS NOT NULL AND added_by_operator_id IS NULL)
        OR (source_type = 'moderator'
            AND submitted_by_user_id IS NULL AND added_by_operator_id IS NOT NULL)
        OR (source_type IN ('system', 'domain_snapshot')
            AND submitted_by_user_id IS NULL AND added_by_operator_id IS NULL)
    ),
    CONSTRAINT moderation_evidence_reference_domain_check CHECK (
        reference_domain IS NULL OR reference_domain IN ('identity', 'social', 'chat', 'commerce')
    ),
    CONSTRAINT moderation_evidence_reference_type_check CHECK (
        reference_type IS NULL OR reference_type IN (
            'user', 'social_profile', 'social_post', 'social_post_image',
            'chat_message', 'conversation'
        )
    ),
    CONSTRAINT moderation_evidence_reference_pair_check CHECK (
        (reference_domain IS NULL AND reference_type IS NULL AND reference_id IS NULL)
        OR (reference_domain IS NOT NULL AND reference_type IS NOT NULL AND reference_id IS NOT NULL)
    ),
    CONSTRAINT moderation_evidence_payload_check CHECK (
        (evidence_type = 'text_snapshot'
            AND content_text IS NOT NULL AND asset_id IS NULL
            AND reference_id IS NULL AND content_sha256 IS NOT NULL)
        OR (evidence_type = 'media_snapshot'
            AND content_text IS NULL AND asset_id IS NOT NULL
            AND reference_id IS NULL AND content_sha256 IS NOT NULL)
        OR (evidence_type = 'object_reference'
            AND content_text IS NULL AND asset_id IS NULL
            AND reference_domain IS NOT NULL AND reference_type IS NOT NULL AND reference_id IS NOT NULL)
        OR (evidence_type = 'metadata_snapshot'
            AND content_text IS NULL AND asset_id IS NULL
            AND reference_id IS NULL AND metadata <> '{}'::jsonb)
    )
);

CREATE INDEX idx_moderation_evidence_case
    ON trust.moderation_evidence(case_id, captured_at);
CREATE INDEX idx_moderation_evidence_appeal
    ON trust.moderation_evidence(appeal_id, captured_at)
    WHERE appeal_id IS NOT NULL;
CREATE INDEX idx_moderation_evidence_asset
    ON trust.moderation_evidence(asset_id, captured_at)
    WHERE asset_id IS NOT NULL;
CREATE INDEX idx_moderation_evidence_reference
    ON trust.moderation_evidence(reference_domain, reference_type, reference_id)
    WHERE reference_id IS NOT NULL;
