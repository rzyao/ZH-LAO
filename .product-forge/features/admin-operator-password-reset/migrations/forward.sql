-- ADR-031 / admin-operator-password-reset
-- PostgreSQL 11+ adds a constant DEFAULT without rewriting existing table rows.
-- Apply once through the repository migration runner, after all migrations through 1350.
ALTER TABLE identity.admin_credentials
    ADD COLUMN password_change_required boolean NOT NULL DEFAULT false;
