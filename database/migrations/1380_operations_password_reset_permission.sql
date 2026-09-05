-- ADR-031: existing super_admin roles must retain the complete Operations catalog
-- when the operator password-reset permission is introduced.
INSERT INTO operations.role_permissions (role_id, permission_key)
SELECT id, 'operations.operators.reset_password'
FROM operations.roles
WHERE code = 'super_admin'
ON CONFLICT (role_id, permission_key) DO NOTHING;
