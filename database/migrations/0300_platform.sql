-- Generated mechanically from the frozen documentation named below.
-- Source: docs/docs/domains/platform/database.md
-- Do not edit an applied migration; add a new migration instead.
CREATE TABLE platform.feature_flags (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    key VARCHAR(100) NOT NULL,
    name VARCHAR(120) NOT NULL,
    description TEXT,

    default_enabled BOOLEAN NOT NULL DEFAULT FALSE,

    status VARCHAR(16) NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_feature_flags_key
        UNIQUE (key),

    CONSTRAINT ck_feature_flags_key_format
        CHECK (key ~ '^[a-z][a-z0-9_]{0,99}$'),

    CONSTRAINT ck_feature_flags_name_not_blank
        CHECK (btrim(name) <> ''),

    CONSTRAINT ck_feature_flags_status
        CHECK (status IN ('active', 'inactive', 'retired')),

    CONSTRAINT ck_feature_flags_status_default_enabled
        CHECK (status = 'active' OR default_enabled = FALSE)
);

CREATE TABLE platform.regions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    code VARCHAR(8) NOT NULL,
    name VARCHAR(100) NOT NULL,

    default_locale VARCHAR(16) NOT NULL,
    timezone VARCHAR(64) NOT NULL,

    status VARCHAR(16) NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_regions_code
        UNIQUE (code),

    CONSTRAINT ck_regions_code_format
        CHECK (code ~ '^[A-Z][A-Z0-9_]{1,7}$'),

    CONSTRAINT ck_regions_name_not_blank
        CHECK (btrim(name) <> ''),

    CONSTRAINT ck_regions_default_locale_not_blank
        CHECK (btrim(default_locale) <> ''),

    CONSTRAINT ck_regions_timezone_not_blank
        CHECK (btrim(timezone) <> ''),

    CONSTRAINT ck_regions_status
        CHECK (status IN ('active', 'inactive', 'retired'))
);

CREATE TABLE platform.feature_flag_overrides (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    feature_flag_id BIGINT NOT NULL,
    region_id BIGINT,
    client_platform VARCHAR(16),

    enabled BOOLEAN NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_feature_flag_overrides_flag
        FOREIGN KEY (feature_flag_id)
        REFERENCES platform.feature_flags(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_feature_flag_overrides_region
        FOREIGN KEY (region_id)
        REFERENCES platform.regions(id)
        ON DELETE RESTRICT,

    CONSTRAINT ck_feature_flag_overrides_scope
        CHECK (region_id IS NOT NULL OR client_platform IS NOT NULL),

    CONSTRAINT ck_feature_flag_overrides_client_platform
        CHECK (client_platform IS NULL
               OR client_platform IN ('android', 'ios'))
);

CREATE TABLE platform.runtime_configs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    key VARCHAR(100) NOT NULL,
    value_type VARCHAR(16) NOT NULL,
    value JSONB NOT NULL,

    description TEXT,

    status VARCHAR(16) NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_runtime_configs_key
        UNIQUE (key),

    CONSTRAINT ck_runtime_configs_key_format
        CHECK (key ~ '^[a-z][a-z0-9_]{0,99}$'),

    CONSTRAINT ck_runtime_configs_value_type
        CHECK (value_type IN ('string', 'integer', 'number', 'boolean', 'json')),

    CONSTRAINT ck_runtime_configs_status
        CHECK (status IN ('active', 'retired')),

    CONSTRAINT ck_runtime_configs_value_matches_type
        CHECK (
               (value_type = 'string'  AND jsonb_typeof(value) = 'string')
            OR (value_type = 'integer' AND jsonb_typeof(value) = 'number'
                AND (value #>> '{}') ~ '^-?[0-9]+$')
            OR (value_type = 'number'  AND jsonb_typeof(value) = 'number')
            OR (value_type = 'boolean' AND jsonb_typeof(value) = 'boolean')
            OR (value_type = 'json'    AND jsonb_typeof(value) IN ('object', 'array'))
        )
);

CREATE TABLE platform.app_versions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    client_platform VARCHAR(16) NOT NULL,

    version VARCHAR(32) NOT NULL,
    build_number BIGINT NOT NULL,

    status VARCHAR(16) NOT NULL DEFAULT 'draft',
    update_policy VARCHAR(16) NOT NULL DEFAULT 'none',

    release_notes TEXT,
    released_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_app_versions_platform_build
        UNIQUE (client_platform, build_number),

    CONSTRAINT ck_app_versions_client_platform
        CHECK (client_platform IN ('android', 'ios')),

    CONSTRAINT ck_app_versions_version_not_blank
        CHECK (btrim(version) <> ''),

    CONSTRAINT ck_app_versions_build_number
        CHECK (build_number > 0),

    CONSTRAINT ck_app_versions_status
        CHECK (status IN ('draft', 'active', 'deprecated', 'blocked')),

    CONSTRAINT ck_app_versions_update_policy
        CHECK (update_policy IN ('none', 'optional', 'required')),

    CONSTRAINT ck_app_versions_status_policy
        CHECK (
               (status = 'draft' AND update_policy = 'none')
            OR (status = 'active' AND update_policy IN ('none', 'optional'))
            OR (status = 'deprecated' AND update_policy = 'optional')
            OR (status = 'blocked' AND update_policy = 'required')
        ),

    CONSTRAINT ck_app_versions_released_at
        CHECK (
               (status = 'draft' AND released_at IS NULL)
            OR (status <> 'draft' AND released_at IS NOT NULL)
        )
);

CREATE TABLE platform.announcements (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    public_id UUID NOT NULL DEFAULT gen_random_uuid(),

    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,

    region_id BIGINT,
    client_platform VARCHAR(16),

    status VARCHAR(16) NOT NULL DEFAULT 'draft',

    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_announcements_public_id
        UNIQUE (public_id),

    CONSTRAINT fk_announcements_region
        FOREIGN KEY (region_id)
        REFERENCES platform.regions(id)
        ON DELETE RESTRICT,

    CONSTRAINT ck_announcements_title_not_blank
        CHECK (btrim(title) <> ''),

    CONSTRAINT ck_announcements_content_not_blank
        CHECK (btrim(content) <> ''),

    CONSTRAINT ck_announcements_client_platform
        CHECK (client_platform IS NULL
               OR client_platform IN ('android', 'ios')),

    CONSTRAINT ck_announcements_status
        CHECK (status IN ('draft', 'published', 'retired')),

    CONSTRAINT ck_announcements_time_window
        CHECK (
            ends_at IS NULL
            OR (starts_at IS NOT NULL AND ends_at > starts_at)
        ),

    CONSTRAINT ck_announcements_published_start
        CHECK (status <> 'published' OR starts_at IS NOT NULL)
);

CREATE INDEX idx_announcements_published_starts_at
ON platform.announcements (starts_at DESC)
WHERE status = 'published';

CREATE INDEX idx_announcements_region_id
ON platform.announcements (region_id)
WHERE region_id IS NOT NULL;
