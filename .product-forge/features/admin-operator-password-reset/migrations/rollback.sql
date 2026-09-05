-- WARNING: rollback is destructive — any forced-password-change state recorded
-- after the forward migration is lost. Do not use this rollback while application
-- code still reads or writes identity.admin_credentials.password_change_required.
ALTER TABLE identity.admin_credentials
    DROP COLUMN password_change_required;
