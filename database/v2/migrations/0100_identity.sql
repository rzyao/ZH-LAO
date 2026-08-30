-- Source: docs/docs/domains/identity/database.md, with ADR-018/D-152 precedence.
-- The three auxiliary tables whose physical contracts remain designing are
-- intentionally absent and recorded as specification blockers.

CREATE TABLE identity.users (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id uuid NOT NULL UNIQUE,
    status varchar(32) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'disabled', 'closed')),
    registered_at timestamptz NOT NULL DEFAULT now(),
    last_active_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE identity.auth_identities (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id bigint NOT NULL REFERENCES identity.users(id) ON DELETE RESTRICT,
    provider varchar(32) NOT NULL CHECK (provider IN ('phone', 'facebook')),
    provider_subject varchar(255) NOT NULL,
    verified_at timestamptz,
    last_login_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (provider, provider_subject)
);

CREATE INDEX idx_auth_identities_user_id ON identity.auth_identities(user_id);

CREATE TABLE identity.basic_profiles (
    user_id bigint PRIMARY KEY REFERENCES identity.users(id) ON DELETE RESTRICT,
    display_name varchar(64),
    gender varchar(16) CHECK (gender IS NULL OR gender IN ('male', 'female', 'other', 'unspecified')),
    birth_date date,
    country_code char(2),
    region_code varchar(32),
    avatar_media_id uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE identity.learning_profiles (
    user_id bigint PRIMARY KEY REFERENCES identity.users(id) ON DELETE RESTRICT,
    native_language varchar(8) NOT NULL,
    learning_language varchar(8) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT learning_profiles_language_pair_check CHECK (
        (native_language = 'lo' AND learning_language = 'zh') OR
        (native_language = 'zh' AND learning_language = 'lo')
    )
);
