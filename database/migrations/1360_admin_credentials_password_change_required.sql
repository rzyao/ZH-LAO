-- ADR-031: one-time temporary credentials require a password change on first login.
-- PostgreSQL 11+ handles this constant default without a table rewrite.
ALTER TABLE identity.admin_credentials
    ADD COLUMN password_change_required boolean NOT NULL DEFAULT false;
