-- Run after forward.sql against the target database. Each DO block raises on failure.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'identity'
          AND table_name = 'admin_credentials'
          AND column_name = 'password_change_required'
          AND data_type = 'boolean'
          AND is_nullable = 'NO'
          AND column_default = 'false'
    ) THEN
        RAISE EXCEPTION 'identity.admin_credentials.password_change_required is missing or has the wrong contract';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM identity.admin_credentials
        WHERE password_change_required IS DISTINCT FROM false
    ) THEN
        RAISE EXCEPTION 'pre-existing credentials were not initialized to false';
    END IF;
END $$;

SELECT COUNT(*) AS admin_credentials_total,
       COUNT(*) FILTER (WHERE password_change_required = false) AS initialized_false,
       COUNT(*) FILTER (WHERE password_change_required = true) AS requires_change
FROM identity.admin_credentials;
