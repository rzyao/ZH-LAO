-- Generated mechanically from the frozen documentation named below.
-- Source: docs/docs/domains/operations/database.md
-- Do not edit an applied migration; add a new migration instead.
CREATE TABLE operations.operators (
    id              uuid         NOT NULL,
    auth_subject_id uuid         NOT NULL,
    display_name    varchar(100) NOT NULL,
    status          varchar(20)  NOT NULL DEFAULT 'active',
    created_at      timestamptz  NOT NULL DEFAULT now(),
    updated_at      timestamptz  NOT NULL DEFAULT now(),

    CONSTRAINT pk_operators
        PRIMARY KEY (id),

    CONSTRAINT uq_operators_auth_subject_id
        UNIQUE (auth_subject_id),

    CONSTRAINT ck_operators_display_name_not_blank
        CHECK (btrim(display_name) <> ''),

    CONSTRAINT ck_operators_status
        CHECK (status IN ('active', 'disabled'))
);

CREATE TABLE operations.roles (
    id          uuid         NOT NULL,
    code        varchar(50)  NOT NULL,
    name        varchar(100) NOT NULL,
    description varchar(500),
    status      varchar(20)  NOT NULL DEFAULT 'active',
    created_at  timestamptz  NOT NULL DEFAULT now(),
    updated_at  timestamptz  NOT NULL DEFAULT now(),

    CONSTRAINT pk_roles
        PRIMARY KEY (id),

    CONSTRAINT uq_roles_code
        UNIQUE (code),

    CONSTRAINT ck_roles_code
        CHECK (code ~ '^[a-z][a-z0-9_]*$'),

    CONSTRAINT ck_roles_name_not_blank
        CHECK (btrim(name) <> ''),

    CONSTRAINT ck_roles_description_not_blank
        CHECK (description IS NULL OR btrim(description) <> ''),

    CONSTRAINT ck_roles_status
        CHECK (status IN ('active', 'disabled'))
);

CREATE TABLE operations.operator_roles (
    operator_id uuid NOT NULL,
    role_id     uuid NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT pk_operator_roles
        PRIMARY KEY (operator_id, role_id),

    CONSTRAINT fk_operator_roles_operator
        FOREIGN KEY (operator_id)
        REFERENCES operations.operators(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_operator_roles_role
        FOREIGN KEY (role_id)
        REFERENCES operations.roles(id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_operator_roles_role
    ON operations.operator_roles (role_id, operator_id);

CREATE TABLE operations.role_permissions (
    role_id        uuid         NOT NULL,
    permission_key varchar(100) NOT NULL,
    created_at     timestamptz  NOT NULL DEFAULT now(),

    CONSTRAINT pk_role_permissions
        PRIMARY KEY (role_id, permission_key),

    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_id)
        REFERENCES operations.roles(id)
        ON DELETE RESTRICT,

    CONSTRAINT ck_role_permissions_permission_key
        CHECK (permission_key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$')
);

CREATE TABLE operations.operator_audit_logs (
    id            uuid         NOT NULL,
    operator_id   uuid         NOT NULL,
    action_key    varchar(100) NOT NULL,

    target_domain varchar(50),
    target_type   varchar(50),
    target_id     uuid,

    request_id    varchar(64),
    ip_address    inet,

    details       jsonb        NOT NULL DEFAULT '{}'::jsonb,

    created_at    timestamptz  NOT NULL DEFAULT now(),

    CONSTRAINT pk_operator_audit_logs
        PRIMARY KEY (id),

    CONSTRAINT fk_operator_audit_logs_operator
        FOREIGN KEY (operator_id)
        REFERENCES operations.operators(id)
        ON DELETE RESTRICT,

    CONSTRAINT ck_operator_audit_logs_action_key
        CHECK (action_key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$'),

    CONSTRAINT ck_operator_audit_logs_target_domain
        CHECK (target_domain IS NULL OR target_domain ~ '^[a-z][a-z0-9_]*$'),

    CONSTRAINT ck_operator_audit_logs_target_type
        CHECK (target_type IS NULL OR target_type ~ '^[a-z][a-z0-9_]*$'),

    CONSTRAINT ck_operator_audit_logs_target_reference
        CHECK (
            (
                target_domain IS NULL
                AND target_type IS NULL
                AND target_id IS NULL
            )
            OR
            (
                target_domain IS NOT NULL
                AND target_type IS NOT NULL
            )
        ),

    CONSTRAINT ck_operator_audit_logs_request_id_not_blank
        CHECK (request_id IS NULL OR btrim(request_id) <> ''),

    CONSTRAINT ck_operator_audit_logs_details_object
        CHECK (jsonb_typeof(details) = 'object')
);

CREATE INDEX idx_operator_audit_logs_created_at
    ON operations.operator_audit_logs (created_at DESC);

CREATE INDEX idx_operator_audit_logs_operator_created_at
    ON operations.operator_audit_logs (operator_id, created_at DESC);

CREATE INDEX idx_operator_audit_logs_target
    ON operations.operator_audit_logs (
        target_domain,
        target_type,
        target_id,
        created_at DESC
    )
    WHERE target_domain IS NOT NULL;

CREATE INDEX idx_operator_audit_logs_request_id
    ON operations.operator_audit_logs (request_id)
    WHERE request_id IS NOT NULL;
