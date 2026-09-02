-- Source: docs/docs/domains/identity/database.md
-- V2 blocker resolution: Identity OTP, revocable refresh sessions, and devices.
-- Raw OTPs and raw tokens are never stored; only a hash is persisted.

CREATE TABLE identity.otp_challenges (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id bigint REFERENCES identity.users(id) ON DELETE RESTRICT,
    phone_number varchar(32) NOT NULL,
    purpose varchar(32) NOT NULL CHECK (purpose IN ('login', 'bind_phone', 'change_phone')),
    code_hash varchar(255) NOT NULL,
    status varchar(16) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'verified', 'expired', 'cancelled', 'locked')),
    attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    max_attempts smallint NOT NULL DEFAULT 5 CHECK (max_attempts > 0),
    expires_at timestamptz NOT NULL,
    verified_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT otp_challenges_status_time_check CHECK (
        (status = 'verified' AND verified_at IS NOT NULL) OR
        (status <> 'verified' AND verified_at IS NULL)
    ),
    CONSTRAINT otp_challenges_attempt_limit_check CHECK (attempt_count <= max_attempts)
);
CREATE INDEX idx_otp_challenges_destination_purpose
    ON identity.otp_challenges(phone_number, purpose, created_at DESC);
CREATE INDEX idx_otp_challenges_expiry
    ON identity.otp_challenges(expires_at)
    WHERE status = 'pending';
CREATE INDEX idx_otp_challenges_status_created
    ON identity.otp_challenges(status, created_at DESC);

CREATE TABLE identity.devices (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id bigint NOT NULL REFERENCES identity.users(id) ON DELETE RESTRICT,
    installation_id uuid NOT NULL UNIQUE,
    platform varchar(16) NOT NULL CHECK (platform IN ('android', 'ios')),
    device_name varchar(128),
    app_version varchar(32),
    push_token text,
    first_seen_at timestamptz NOT NULL DEFAULT now(),
    last_seen_at timestamptz,
    revoked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_devices_user ON identity.devices(user_id, last_seen_at DESC);
CREATE UNIQUE INDEX uq_devices_push_token
    ON identity.devices(push_token) WHERE push_token IS NOT NULL AND revoked_at IS NULL;

CREATE TABLE identity.sessions (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id bigint NOT NULL REFERENCES identity.users(id) ON DELETE RESTRICT,
    device_id bigint REFERENCES identity.devices(id) ON DELETE RESTRICT,
    refresh_token_hash varchar(255) NOT NULL UNIQUE,
    status varchar(16) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'revoked', 'expired')),
    expires_at timestamptz NOT NULL,
    last_active_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    revoked_at timestamptz,
    revocation_reason varchar(64),
    CONSTRAINT sessions_status_revocation_check CHECK (
        (status = 'revoked' AND revoked_at IS NOT NULL AND revocation_reason IS NOT NULL)
        OR (status <> 'revoked' AND revoked_at IS NULL AND revocation_reason IS NULL)
    )
);
CREATE INDEX idx_sessions_user_status ON identity.sessions(user_id, status, created_at DESC);
CREATE INDEX idx_sessions_device ON identity.sessions(device_id, created_at DESC) WHERE device_id IS NOT NULL;
CREATE INDEX idx_sessions_expiry ON identity.sessions(expires_at) WHERE status = 'active';
