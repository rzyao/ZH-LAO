-- V2 blocker resolution: Media/Asset Infrastructure.
-- This is infrastructure, not a business Domain. Business schemas keep only
-- asset_id UUID logical references and never reference this table physically.

CREATE SCHEMA infrastructure;

COMMENT ON SCHEMA infrastructure IS
    'Shared technical infrastructure: canonical physical asset facts and transactional outbox.';

CREATE TABLE infrastructure.assets (
    id uuid PRIMARY KEY,
    storage_provider varchar(32) NOT NULL,
    storage_bucket varchar(255) NOT NULL,
    storage_key varchar(1024) NOT NULL,
    mime_type varchar(255) NOT NULL,
    size_bytes bigint NOT NULL CHECK (size_bytes >= 0),
    checksum_algorithm varchar(32),
    checksum varchar(256),
    status varchar(16) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'ready', 'deleted', 'failed')),
    original_filename varchar(512),
    file_extension varchar(32),
    width integer CHECK (width IS NULL OR width > 0),
    height integer CHECK (height IS NULL OR height > 0),
    duration_ms bigint CHECK (duration_ms IS NULL OR duration_ms >= 0),
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(metadata) = 'object'),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    UNIQUE (storage_provider, storage_bucket, storage_key),
    CONSTRAINT assets_deleted_state_check CHECK (
        (status = 'deleted' AND deleted_at IS NOT NULL) OR
        (status <> 'deleted' AND deleted_at IS NULL)
    )
);

CREATE INDEX idx_assets_status_created
    ON infrastructure.assets(status, created_at DESC);
CREATE INDEX idx_assets_checksum
    ON infrastructure.assets(checksum_algorithm, checksum)
    WHERE checksum IS NOT NULL;
