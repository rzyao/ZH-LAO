-- Content letter management routes require exact Operations RBAC permissions.
-- Existing super administrators receive the newly introduced permissions.
INSERT INTO operations.role_permissions (role_id, permission_key)
SELECT id, permission_key
FROM operations.roles
CROSS JOIN (
    VALUES
        ('content.letters.write'),
        ('content.letters.review'),
        ('content.letters.publish')
) AS permissions(permission_key)
WHERE code = 'super_admin'
ON CONFLICT (role_id, permission_key) DO NOTHING;
