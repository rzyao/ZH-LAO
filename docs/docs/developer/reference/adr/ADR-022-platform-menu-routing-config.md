---
status: frozen
last_updated: 2026-09-03
---

# ADR-022：Platform 扩展后台菜单与路由配置能力（打破 6 表冻结边界）

**状态：** `已接受`

**日期：** `2026-09-03`

**批准：** 2026-09-03（主架构会话确认，登记 D-155）

**相关：** [ADR-019 Operations 为后台控制平面](ADR-019-operations-backoffice-control-plane.md)、[ADR-021 Content + Learning 拆分](ADR-021-content-and-learning-domain-split.md)、[Platform 域](/developer/reference/domains/platform/index.md)、[Platform 数据库](/developer/reference/domains/platform/database.md)、[Operations RBAC](/developer/reference/domains/operations/rbac.md)、[Admin 导航结构](/developer/reference/admin/navigation.md)、[Admin 页面清单](/developer/reference/admin/pages.md)、[Spec Kit 004 spec](/specs/004-menu-routing-management/spec.md)、[设计台账 D-155](/developer/reference/governance/design-register.md)

## 背景

Admin 后台当前侧边栏导航与路由是**硬编码**的：信息架构定义于 `apps/admin/src/navigation/config.tsx` 的 `NAV_GROUPS` / `SECONDARY_NAV` 常量（冻结于 `ADMIN_FOUNDATION_PLAN §8`），路由由 `router.tsx` 手写注册。由此产生三个问题：

1. **每次新增/调整后台页面都需要开发人员改代码、走发布流程**，运营人员无法自助维护导航。
2. **菜单显隐与顺序无法按角色/权限运行时调整**。
3. **导航结构分散于前端常量、路由表、文档三处，易漂移**。

需求（`/speckit.specify` → `004-menu-routing-management`）要求：将菜单与路由升级为**运营人员在后台 UI 在线管理的可配置结构**，路由目标受安全白名单约束。用户已确认三项产品决策：**① 创建/编辑即生效（无 draft）；② 可见性权限多权限 OR；③ 首次上线 seed 预置当前导航等价配置**。

约束来自已确定的设计基线：

- **Platform 域冻结为 6 张业务表**（`feature_flags` / `feature_flag_overrides` / `runtime_configs` / `app_versions` / `announcements` / `regions`），D-118「业务表固定 6 张，不增加、不替换」`frozen`。
- **权限由应用代码 Permission Registry 定义**（无 `permissions` 表），key 三段式 `<domain>.<resource>.<action>`，D-106 `frozen`。
- **Admin 信息架构冻结**于 `ADMIN_FOUNDATION_PLAN §8`，导航硬编码。
- **Platform 数据设计约定**：BIGINT identity PK、`varchar + CHECK` 状态、`TIMESTAMPTZ`、域内 FK `ON DELETE RESTRICT`、不建 JSONB/metadata/created_by、`public_id UUID` 仅对外实体、状态化退役不物理删除。

本功能将打破其中三项冻结基线（Platform 6 表、Admin 信息架构、Operations 权限 catalog），按 Constitution Principle VIII（`SPEC_CONFLICT` 必须 STOP）以变更请求呈现，需本 ADR 批准后实施。

## 决策

1. **菜单/路由配置能力并入 Platform 域**，作为 Product Runtime Control Plane 的横向能力（第 7 类能力），**不新增独立 Domain / Schema**。理由：菜单配置是所有后台运营人员共享的跨业务运行控制事实，与 Platform「与具体业务领域无关的横向产品运行控制能力」定位一致；独立成域需扩展 `DomainName` 联合类型与 schema，改动更重，收益不匹配。

2. **新增 2 张业务表**（`database/migrations/1270_platform_menus.sql`，`0300_platform.sql` 冻结文件不改）：
   - `platform.menus` — 菜单项树（自引用 `parent_id` adjacency list，`NULL`=顶层分组；层级最大 3 层由应用层 use-case 校验）。字段：`id bigint identity`、`parent_id bigint NULL`（域内 FK `ON DELETE RESTRICT`）、`label varchar(120)`、`route_key varchar(100)`（分组可空、非分组 NOT NULL，应用层校验）、`icon varchar(64)`（lucide key）、`sort_order integer`、`status varchar(16)` `CHECK (status IN ('active','disabled','removed'))`、`created_at / updated_at timestamptz`。
   - `platform.menu_permissions` — 可见性权限多值表，`PK (menu_id, permission_key)`，`permission_key` 三段式 `CHECK` 格式。**同构于 `operations.role_permissions` 权威先例**（权限作为关系化多值），不建 JSONB、不建逗号分隔列、不做「菜单↔role」跨域 FK。

3. **状态机**：菜单项 `active / disabled / removed`，**初始即 `active`（无 draft，创建/编辑即生效）**，`removed` 为终态（审计保留，永不物理 DELETE，删除含子项时级联置 `removed`）。

4. **可见性权限语义（多权限 OR）**：一个菜单项可有 0..N 条 `menu_permissions`；渲染时任一 `permission_key` 命中操作员权限池即可见；空集合 = 对所有已认证操作员可见。权限 key 必须存在于 `OPERATOR_PERMISSION_CATALOG`（写入时服务端校验），不建 FK 到权限表（权限由代码 Registry 定义）。菜单可见性过滤仅为界面层，服务端 RBAC 始终独立授权。

5. **权限 catalog 新增 2 个 key**：`platform.menus.read` / `platform.menus.write`，加入 `OPERATOR_PERMISSION_CATALOG`。`super_admin` 在 bootstrap 时注入完整 catalog，自动获得（无需额外 seed）。同步更新 `permissions.test.ts` 数量断言 26 → 28。

6. **路由目标白名单**：菜单项存稳定 `route_key`（FR-015，而非可变路径字符串）；白名单集合由前端 `apps/admin/src/navigation/route-registry.ts` 的 `ADMIN_ROUTE_TARGETS` 派生（单一事实源，消除「前端常量、路由表、文档」三处漂移）；后端镜像一份 `MENU_ROUTE_TARGET_KEYS` 常量校验（仅 key 存在性，不复制 href）。前端「目标路由」下拉框只枚举白名单（第一道），后端服务端校验（第二道，防绕过 UI 直连 API）。

7. **乐观并发**：复用 Platform 既有 `expected_updated_at` 模式（runtime_configs / app_versions 先例），编辑/删除/排序请求带 `expected_updated_at`，不匹配 → 409 `PLATFORM_CONFLICT`。不引入独立 `version` 列（避免「两套版本事实」）。

8. **菜单管理 API**：`/api/v1/admin/platform/menus*` 六端点（GET 树 / POST 创建 / PATCH 编辑 / POST remove / PUT order / GET route-targets），全部复用 `requireAuthentication + authorizer.requirePermission + audit.recordSuccessfulAction` 链路，审计 action_key 统一 `platform.menus.write`，audit target `{ domain:'platform', type:'menu', id }`。

9. **首次上线 seed**：`1270_platform_menus.sql` 内直接带 seed SQL，将 `NAV_GROUPS` / `SECONDARY_NAV` 等价配置一次性写入（迁移全量幂等机制，随 DDL 同事务）。可见性 seed：`operations/*` 项配 `operations.*.read`、`platform/*` 项配 `platform.*.read`，其余 domain 项不配权限（对齐当前「无权限过滤」现状）。

10. **前端配置驱动渲染**：Sidebar 用 React Query `useMenusQuery()` fetch 菜单配置 + `can()` 权限过滤（OR）；fetch 失败/空树回退内置 `NAV_GROUPS`/`SECONDARY_NAV`（FR-009 不白屏）；空树渲染最小导航（总览 + 退出 + 菜单管理入口，FR-012 防死锁）。`isActive` 前缀匹配与侧边栏激活态逻辑保留不动，只替换数据来源。菜单管理页位于 `/platform/menus`（`features/platform/pages/menus.tsx`）。

11. **影响范围**：仅 Admin 后台；不涉及 C 端 App 导航。信息架构语义（按业务工作流组织、非按后端边界）保持不变，仅渲染来源从硬编码改为配置。

## 备选方案与取舍

| 方案 | 优点 | 缺点 | 结论 |
| --- | --- | --- | --- |
| 并入 Platform 域（本 ADR） | 复用现有 Platform 模块分层、权限 catalog、审计链路与数据设计约定；改动集中于现有模块 | 打破 Platform 冻结 6 表边界（需本 ADR 修订 D-118）；需重新生成迁移 manifest | 采用 |
| 新增独立 `menu` 域 + Schema | 菜单配置独立成域，边界清晰 | 需扩展 `DomainName` 联合类型 + 新 Schema + 新权限域；对「后台菜单」这种横向运行控制能力而言改动过重 | 不采用 |
| 配置驱动重构（无新表） | 不打破冻结边界；前端单一事实源 | 无法满足「完全动态（后台可编辑）」——运营人员不能在线改菜单，不解决核心问题 | 不采用 |
| 后端维护白名单枚举表 / 路径映射表 | 服务端可独立校验 | 复制前端路由事实，制造双源漂移（正是 spec 想消除的）；菜单配置是 Admin 后台专属 | 不采用 |
| 可见性建模为「菜单 ↔ role」关系 | 按角色控制直观 | spec 与 clarify 明确为**权限 key 级**而非角色级；角色在 Operations 域，跨域不能建 FK | 不采用 |
| 逗号分隔权限列 / JSONB 权限数组 | 实现简单 | 违反 feature_flags「不允许 JSONB」与「权限由代码 Registry 定义」；无法 CHECK/FK 校验 | 不采用 |
| `version` 列乐观锁 | CAS 语义更强 | 项目无先例，与 `updated_at` 并存造成双真相；菜单为低频小数据量，`expected_updated_at` 已足够 | 不采用 |
| 菜单项独立 `key` 列 | 菜单项自身稳定标识 | FR-015 约束的是**路由目标**（`route_key`），非菜单项命名；菜单项身份是「树里位置 + 显示名」，复制 feature_flags.key 治理属过度设计 | 不采用 |

## 后果

### 正面影响

- 运营人员可在后台 UI 在线维护菜单结构，无需发版；配置变更对下一次导航渲染生效（FR-014）。
- 菜单显隐按权限 OR 语义控制，与 RBAC 一致；可见性隐藏不替代服务端授权。
- 路由目标受白名单约束（前端下拉 + 后端镜像校验），杜绝开放重定向 / 越权入口。
- 菜单变更写入不可变审计日志，可追溯。
- 复用 Platform 全部分层与约定，改动内聚、模式一致。

### 代价与风险

- **打破三项冻结基线**：Platform 6 表（D-118）、Admin 信息架构（ADMIN_FOUNDATION_PLAN §8）、Operations 权限 catalog（D-106 数量断言）。需本 ADR 批准 + 设计台账 D-155 登记。
- Platform 冻结文档 `database.md` 需同步修订「6 张业务表不增加」表述为「6 张 + 菜单配置能力（ADR-022）」。
- 新增迁移后必须重新生成 `required-migrations.generated.ts`（否则 `hasCompatibleBaseline` 校验失败）。
- `permissions.test.ts` 数量断言需 26 → 28；`super_admin` 自动获得菜单权限（符合预期）。
- 「菜单管理」页面自身入口存在鸡生蛋问题：侧边栏配置驱动后，需在 seed 配置中预置该入口 + fallback 最小导航硬编码保留，防止配置清空后无法进入管理页（FR-012）。
- `icon` 仅格式校验，不做白名单（前端 `ICON_REGISTRY` fallback 兜底）；若未来要求 icon 白名单化，需导出 `ICON_REGISTRY` 集合。

## 后续行动

- [ ] 批准本 ADR（`拟议 → 已接受 → frozen`），并在设计台账追加 **D-155** 登记。
- [ ] 更新 `domains/platform/database.md`：6 表 → 6 表 + 菜单配置能力（ADR-022）。
- [ ] 更新 `admin/navigation.md` / `admin/pages.md`：记录配置驱动导航与 `/platform/menus` 页面。
- [ ] 在 `adr/index.md` 登记 ADR-022。
- [ ] 更新 spec.md / plan.md 顶部「架构变更请求」标注为「已批准（ADR-022）」。
- [ ] 实施时：新建 `1270_platform_menus.sql`（DDL + seed）、重新生成迁移 manifest、扩展权限 catalog 与 `permissions.test.ts`。
