-- Content management is a navigation directory, not a standalone route.
-- Keep its descendants unchanged and preserve the existing menu identity.
UPDATE platform.menus
SET route_key = NULL, updated_at = now()
WHERE route_key = 'content';
