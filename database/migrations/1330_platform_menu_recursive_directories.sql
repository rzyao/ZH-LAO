-- 将历史分组桥接节点归一为统一的递归目录树。
-- platform.menus 的邻接表结构本身支持任意层级，本迁移只调整初始菜单数据。

-- 「总览看板」直接位于根目录，不再保留仅用于展示分组的「总览」节点。
UPDATE platform.menus
SET parent_id = NULL,
    sort_order = 0,
    updated_at = now()
WHERE id = 10
  AND status <> 'removed';

UPDATE platform.menus
SET status = 'disabled',
    updated_at = now()
WHERE id = 1
  AND status <> 'removed';

-- 中文与老挝语目录直接归入「内容管理」，移除重复的根级内容桥接节点。
UPDATE platform.menus
SET parent_id = 20,
    updated_at = now()
WHERE parent_id = 7
  AND status <> 'removed';

UPDATE platform.menus
SET status = 'disabled',
    updated_at = now()
WHERE id = 7
  AND status <> 'removed';
