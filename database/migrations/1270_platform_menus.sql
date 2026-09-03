-- Menu & routing configuration for the Admin back-office.
-- Approved by ADR-022 (Platform 7th capability). Source of truth for seed:
-- apps/admin/src/navigation/config.tsx (NAV_GROUPS / SECONDARY_NAV).
-- Frozen 0300_platform.sql is untouched; this is a new capability table set.

CREATE TABLE platform.menus (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    parent_id   bigint REFERENCES platform.menus(id) ON DELETE RESTRICT,
    label       varchar(120) NOT NULL,
    route_key   varchar(100),
    icon        varchar(64),
    sort_order  integer NOT NULL DEFAULT 0,
    status      varchar(16) NOT NULL DEFAULT 'active',
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT ck_menus_label_not_blank
        CHECK (btrim(label) <> ''),

    CONSTRAINT ck_menus_status
        CHECK (status IN ('active', 'disabled', 'removed')),

    -- 顶层分组可无 route_key;非分组(parent_id 非空)必须有 route_key(应用层强校验)。
    -- 此处仅约束 route_key 格式(若提供)。
    CONSTRAINT ck_menus_route_key_format
        CHECK (route_key IS NULL OR route_key ~ '^[a-z][a-z0-9_.]*$')
);

CREATE INDEX idx_menus_parent_order
    ON platform.menus (parent_id, sort_order);

CREATE TABLE platform.menu_permissions (
    menu_id         bigint      NOT NULL REFERENCES platform.menus(id) ON DELETE RESTRICT,
    permission_key  varchar(100) NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT pk_menu_permissions
        PRIMARY KEY (menu_id, permission_key),

    CONSTRAINT ck_menu_permissions_permission_key
        CHECK (permission_key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$')
);

-- =============================================================================
-- Seed: 首次上线预置当前硬编码导航(NAV_GROUPS + SECONDARY_NAV)的等价配置。
-- 迁移整体单事务执行;seed 失败即回滚整个迁移(不产生半 seed 状态)。
-- =============================================================================

-- 顶层分组 (parent_id NULL)
INSERT INTO platform.menus (id, parent_id, label, route_key, icon, sort_order, status) OVERRIDING SYSTEM VALUE VALUES
    (1,  NULL, '总览',       'overview',         'layout_dashboard', 0, 'active'),
    (2,  NULL, '学习与内容', NULL,               'book_open',        1, 'active'),
    (3,  NULL, '用户与社交', NULL,               'circle_user',      2, 'active'),
    (4,  NULL, '商业与财务', NULL,               'credit_card',      3, 'active'),
    (5,  NULL, '安全治理',   NULL,               'shield_check',     4, 'active'),
    (6,  NULL, '系统运维',   NULL,               'settings',         5, 'active'),
    (7,  NULL, '内容管理',   'content',          'book_open',        6, 'active');

-- 一级项 (parent_id = 分组)
INSERT INTO platform.menus (id, parent_id, label, route_key, icon, sort_order, status) OVERRIDING SYSTEM VALUE VALUES
    (10, 1, '总览看板', 'overview', 'layout_dashboard', 0, 'active'),
    (20, 2, '内容管理', 'content',  'book_open',        0, 'active'),
    (21, 2, '学习系统', 'learning', 'graduation_cap',   1, 'active'),
    (22, 2, '音频生产', 'audio',    'audio_lines',      2, 'active'),
    (30, 3, '身份认证', 'identity', 'circle_user',      0, 'active'),
    (31, 3, '社交关系', 'social',   'users',            1, 'active'),
    (32, 3, '实时聊天', 'chat',     'message_square',   2, 'active'),
    (40, 4, '交易商城', 'commerce', 'credit_card',      0, 'active'),
    (41, 4, '奖励中心', 'rewards',  'gift',             1, 'active'),
    (50, 5, '信任与风控', 'trust',  'shield_check',     0, 'active'),
    (60, 6, '运营权限', 'operations', 'settings',       0, 'active'),
    (61, 6, '平台控制台', 'platform', 'database',       1, 'active'),
    (70, 7, '字母管理', 'content.letters',    'book_open', 0, 'active'),
    (71, 7, '音节管理', 'content.syllables',  'book_open', 1, 'active'),
    (72, 7, '词汇管理', 'content.vocabulary', 'book_open', 2, 'active'),
    (73, 7, '句子与例句', 'content.sentences', 'book_open', 3, 'active');

-- 二级项 (parent_id = 一级项)
INSERT INTO platform.menus (id, parent_id, label, route_key, icon, sort_order, status) OVERRIDING SYSTEM VALUE VALUES
    (600, 60, '操作员管理',   'operations.operators',    'users',          0, 'active'),
    (601, 60, '角色与权限',   'operations.roles',        'shield_check',   1, 'active'),
    (602, 60, '操作审计日志', 'operations.audit_logs',   'file_text',      2, 'active'),
    (610, 61, '功能开关',     'platform.feature_flags',  'sliders_horizontal', 0, 'active'),
    (611, 61, '运行时配置',   'platform.runtime_configs', 'settings',      1, 'active'),
    (612, 61, '客户端版本',   'platform.app_versions',   'smartphone',     2, 'active'),
    (613, 61, '全服与定向公告', 'platform.announcements', 'message_square', 3, 'active'),
    (614, 61, '支持地区',     'platform.regions',        'database',       4, 'active'),
    (615, 61, '菜单管理',     'platform.menus',          'settings',       5, 'active');

-- 可见性权限 seed: operations/* 配对应 read, platform/* 配对应 read, 其余不配(对所有认证用户可见)
INSERT INTO platform.menu_permissions (menu_id, permission_key) VALUES
    (600, 'operations.operators.read'),
    (601, 'operations.roles.read'),
    (602, 'operations.audit_logs.read'),
    (610, 'platform.feature_flags.read'),
    (611, 'platform.runtime_configs.read'),
    (612, 'platform.app_versions.read'),
    (613, 'platform.announcements.read'),
    (614, 'platform.regions.read'),
    (615, 'platform.menus.read');

-- seed 使用显式 id(OVERRIDING SYSTEM VALUE)不推进 identity 序列;同步序列避免后续自动 id 冲突。
SELECT setval('platform.menus_id_seq', (SELECT max(id) FROM platform.menus));
