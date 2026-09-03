# Data Model: 后台菜单与路由配置管理 (004-menu-routing-management)

**Feature Branch**: `004-menu-routing-management` | **Date**: 2026-09-03 | **Spec**: [spec.md](./spec.md)

> ⚠️ 本数据模型为**架构变更请求**的目标契约,新增 `platform.menus` 与
> `platform.menu_permissions` 两张表,打破 Platform 冻结 6 表边界。
> 表结构在 ADR / D-xxx 批准前不具备权威性;批准后落入新迁移
> `database/migrations/1270_platform_menus.sql`(0300 冻结文件不改)。

本数据模型严格遵守 Constitution Principles I & VI(引用真实冻结工件、契约指向
现实)。新表完全遵循 Platform 数据设计约定(BIGINT identity PK、`varchar + CHECK`
状态、`TIMESTAMPTZ`、域内 FK `ON DELETE RESTRICT`、无 JSONB/metadata/created_by、
状态化退役不物理删除)。

---

## 实体关系图 (Entity Relationship Diagram)

```text
┌──────────────────────────────────────────────────────────────┐
│                        platform.menus                         │
│──────────────────────────────────────────────────────────────│
│ id            bigint identity  (PK)                            │
│ parent_id     bigint NULL      (自引用 FK → menus.id, RESTRICT) │
│ label         varchar(120) NOT NULL (btrim <> '')              │
│ route_key     varchar(100) NULL  (分组可空;非分组 NOT NULL)     │
│ icon          varchar(64)  NULL  (lucide key)                  │
│ sort_order    integer NOT NULL DEFAULT 0                       │
│ status        varchar(16) NOT NULL DEFAULT 'active'            │
│              CHECK (status IN ('active','disabled','removed')) │
│ created_at    timestamptz NOT NULL DEFAULT now()               │
│ updated_at    timestamptz NOT NULL DEFAULT now()               │
└───────────────────────────────┬────────────────────────────────┘
                                │ 1:N  (自引用: 分组 → 一级项 → 子项)
                                │
┌───────────────────────────────┴────────────────────────────────┐
│                   platform.menu_permissions                     │
│────────────────────────────────────────────────────────────────│
│ menu_id         bigint NOT NULL  (FK → menus.id, RESTRICT)      │
│ permission_key  varchar(100) NOT NULL                           │
│                 CHECK (^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$)│
│ created_at      timestamptz NOT NULL DEFAULT now()              │
│ PK (menu_id, permission_key)                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 实体详情与字段级契约

### 1. MenuItem (`platform.menus`)

- **Authority(目标)**: `database/migrations/1270_platform_menus.sql`(待 ADR 批准)
- **对照现状**: 现有硬编码导航 `NAV_GROUPS`(分组→一级)与 `SECONDARY_NAV`(prefix→二级)
  将迁移为等价配置(seed)。信息架构语义不变。
- **Fields**:

| 字段 | 类型 | NULL | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| `id` | `bigint generated always as identity` | NO | — | 内部 PK,不对外暴露 |
| `parent_id` | `bigint` | YES | — | 自引用父项;NULL=顶层分组。域内 FK → `menus(id)` `ON DELETE RESTRICT` |
| `label` | `varchar(120)` | NO | — | 显示名称;`CHECK (btrim(label) <> '')` |
| `route_key` | `varchar(100)` | 分组可空 | — | 稳定路由目标标识(FR-015);非分组 NOT NULL(应用层校验「parent_id 非空则 route_key 非空」) |
| `icon` | `varchar(64)` | YES | — | lucide-react 图标 key(如 `layout_dashboard`),前端 registry 映射 |
| `sort_order` | `integer` | NO | `0` | 同层排序键;次级键 `id` 保证确定性(无跨父级唯一约束) |
| `status` | `varchar(16)` | NO | `'active'` | `CHECK (status IN ('active','disabled','removed'))`;状态转移合法性由 use-case 保证 |
| `created_at` | `timestamptz` | NO | `now()` | 创建时间 |
| `updated_at` | `timestamptz` | NO | `now()` | 最后更新时间;乐观并发 `expected_updated_at` 依据 |

- **Lifecycle & Constraints**:
  - 层级: 顶层分组(`parent_id IS NULL`)→ 一级项 → 子项,最大 3 层;深度由应用层
    use-case 沿祖先链校验,DB 不约束任意深度。
  - 删除 = `status = 'removed'`(终态,永不物理 DELETE);删除含子项的父项时级联
    置子项为 `removed`。
  - `removed` 语义与 feature_flags `retired` 不同:菜单删除后允许重建同 route_key 新项。
  - 并发: 编辑/删除/排序请求带 `expected_updated_at`,不匹配 → 409 `PLATFORM_CONFLICT`
    (对齐 runtime_configs / app_versions 先例)。
  - 排序: 同层连续 `0..n-1` 下标,整体提交;数据库不依赖唯一性。

### 2. MenuPermission (`platform.menu_permissions`)

- **Authority(目标)**: `database/migrations/1270_platform_menus.sql`(待 ADR 批准)
- **对照现状**: 同构于 `operations.role_permissions`(PK(role_id, permission_key) +
  三段式 CHECK)——项目「权限作为关系化多值」的权威先例。
- **Fields**:

| 字段 | 类型 | NULL | 说明 |
| --- | --- | --- | --- |
| `menu_id` | `bigint` | NO | 域内 FK → `menus(id)` `ON DELETE RESTRICT` |
| `permission_key` | `varchar(100)` | NO | 三段式权限 key `<domain>.<resource>.<action>`;CHECK 格式 |
| `created_at` | `timestamptz` | NO | 默认 now() |
| PK | `(menu_id, permission_key)` | | 一个菜单项不能重复拥有同一权限 |

- **语义 (FR-007 多权限 OR)**:
  - 一个菜单项可有 0..N 条 `menu_permissions` 行。
  - 渲染时 OR: 任一 `permission_key` 命中操作员权限池即可见;空集合 = 对所有已认证
    操作员可见。
  - 权限 key 必须存在于 `OPERATOR_PERMISSION_CATALOG`(写入时服务端校验);无 FK 到
    权限表(权限由代码 Registry 定义,非 DB 实体)。

---

## 状态转移 (State Machine)

### 菜单项 (MenuItem)

- **States**: `active`(参与渲染)→ `disabled`(不渲染,保留配置)→ `removed`(终态,审计保留)
- **Initial**: `active`(创建/编辑即生效,无 draft)
- **Terminal**: `removed`
- **Transitions**:

| From | To | Guard | Event |
| --- | --- | --- | --- |
| active | disabled | `platform.menus.write` | 停用 |
| disabled | active | `platform.menus.write`;route_key 仍有效 | 重新启用 |
| active/disabled | removed | `platform.menus.write`;无未处理子项或显式级联 | 删除 |
| active | active | `platform.menus.write`;`updated_at` 匹配 | 编辑/重排序 |

---

## 索引与约束总结

| 对象 | 类型 | 说明 |
| --- | --- | --- |
| `menus.id` | PK | 内部主键 |
| `menus(parent_id)` | FK + INDEX | 域内自引用,`ON DELETE RESTRICT` |
| `menus.label` | CHECK | `btrim(label) <> ''` |
| `menus.status` | CHECK | `IN ('active','disabled','removed')` |
| `menu_permissions PK (menu_id, permission_key)` | PK | 防重复权限 |
| `menu_permissions.permission_key` | CHECK | 三段式格式 |
| `menu_permissions(permission_key)` | INDEX | 低基数可不建,但为未来「哪些菜单需要权限 X」查询保留(可选) |
| `menus.sort_order` | 无唯一约束 | 排序冲突由应用层连续下标整体提交解决 |

> 不建: `public_id`(菜单不对外)、`version` 列(用 `updated_at` 并发)、
> JSONB/metadata/created_by(Platform 约定)、`deleted_at`(removed 即删除语义)。
