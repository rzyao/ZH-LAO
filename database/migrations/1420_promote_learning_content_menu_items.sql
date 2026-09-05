-- The former “学习与内容” grouping directory is no longer part of the Admin IA.
-- Preserve menu identities and descendants while promoting its three direct children.

UPDATE platform.menus
SET sort_order = sort_order + 2,
    updated_at = now()
WHERE parent_id IS NULL
  AND sort_order >= 2
  AND id NOT IN (20, 21, 22)
  AND status <> 'removed';

UPDATE platform.menus
SET parent_id = NULL,
    sort_order = CASE id WHEN 20 THEN 1 WHEN 21 THEN 2 WHEN 22 THEN 3 END,
    updated_at = now()
WHERE id IN (20, 21, 22)
  AND status <> 'removed';

UPDATE platform.menus
SET status = 'disabled',
    updated_at = now()
WHERE id = 2
  AND status <> 'removed';
