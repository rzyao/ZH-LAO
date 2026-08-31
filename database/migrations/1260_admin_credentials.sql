-- Admin credential records for the back-office login flow.
-- Passwords are stored as scrypt hashes; raw passwords are never persisted.
CREATE TABLE identity.admin_credentials (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id       bigint NOT NULL UNIQUE REFERENCES identity.users(id) ON DELETE RESTRICT,
    username      varchar(100) NOT NULL UNIQUE,
    password_hash varchar(255) NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_admin_credentials_username_not_blank CHECK (btrim(username) <> ''),
    CONSTRAINT ck_admin_credentials_password_hash_not_blank CHECK (btrim(password_hash) <> '')
);
