# Research: 后台菜单与路由配置管理 (004-menu-routing-management)

> 本文保留立项时的研究快照。实施后的节点分组与三层假设已由 ADR-024、ADR-026 和 CR-004 修订，现行契约以 `spec.md`、`data-model.md` 与 contracts 为准。

**Phase 0 输出** | 2026-09-03 | 基于代码/文档/冻结迁移现状与已确认的产品决策(生效模式、多权限 OR、seed 预置)

## 研究基线(已验证现状锚点)

- **后端 Platform 模块层**: `application/use-cases/*.ts → application/ports/platform-repositories.ts → infrastructure/repositories.ts → http/management-routes.ts`。管理路由统一 `/api/v1/admin/platform/*`,每端点 = `requireAuthentication + authorizer.requirePermission(authContext, key) + audit.recordSuccessfulAction(...)`。
- **权限 catalog**: `apps/backend/src/modules/operations/public/permissions.ts` 的 `OPERATOR_PERMISSION_CATALOG` 为 flat 精确三段式数组;`operations/__tests__/permissions.test.ts` 冻结「恰好 26 个 key」——新增 2 个菜单 key 后须同步改为 28。`super_admin` 在 bootstrap 时注入完整 catalog,新权限自动获得,无需额外 seed。
- **前端**: `navigation/config.tsx` 硬编码 `NAV_GROUPS`(分组→一级)与 `SECONDARY_NAV`(prefix→二级);`router.tsx` 手写路由树;`sidebar.tsx` 消费二者 + `isActive()` 前缀匹配;`breadcrumb.tsx` 用 `findNavItemByHref`+`NAV_GROUPS` 推导面包屑;`AuthContext.can()` 支持通配符,Platform 页面用 `useExactPermission`(不含通配符)做写权限门。
- **冻结迁移**: `database/migrations/0300_platform.sql` 6 表;最新 `1260_admin_credentials.sql` → 新迁移编号 `1270`。迁移由 `database/scripts/migrate.mjs` 全量执行(整文件单事务);`required-migrations.generated.ts` 由 `apps/backend/scripts/generate-migration-manifest.mjs` 从迁移目录哈希生成——**新增迁移后必须重新生成 manifest,否则 `hasCompatibleBaseline` 校验失败**。
- **Platform 数据设计约定**: BIGINT identity PK、`VARCHAR + CHECK` 状态、`TIMESTAMPTZ`、域内 FK `ON DELETE RESTRICT`、不建 JSONB/metadata/created_by、`public_id UUID` 仅对外实体、低基数不建索引、状态化退役不物理删除。

---

## 决策点 1: 数据模型 — `platform.menus` + `platform.menu_permissions`

### 1.1 树层级表达

- **Decision**: 自引用 `parent_id BIGINT NULL`(adjacency list),不建 depth 列、不建 materialized path。
- **Rationale**: 树规模 <500 条,一次 `SELECT * ORDER BY parent_id, sort_order` 全量拉出组树足够;层级最多 3 层由应用层 use-case 按祖先链校验(DB CHECK 无法可靠约束任意深度);域内 FK 符合 Platform 约定;菜单不对外暴露故不加 `public_id`。
- **Alternatives**: materialized path(数据量小,过度设计,违背无 JSONB/非结构化精神);depth 冗余列(可由 parent_id 推导,有漂移风险);closure table(3 层固定树过度工程)。

### 1.2 排序表达

- **Decision**: `sort_order INTEGER NOT NULL`,同层内排序,不做跨父级全局唯一约束。
- **Rationale**: 同级排序最常见;直接映射现有 `items` 数组序。`UNIQUE(parent_id, sort_order)` 迫每次移动级联重排 + NULL 部分唯一索引兜底,收益 < 代价。排序冲突在应用层/前端解决:前端重新生成连续 `0..n-1` 下标整体提交。不加 gap(连续下标 + 整体重排最直白)。
- **Alternatives**: `UNIQUE(parent_id, sort_order)` + 部分唯一索引(维护成本高、并发冲突多);float 中点插入(不透明易漂移)。

### 1.3 状态字段

- **Decision**: `status VARCHAR(16) NOT NULL DEFAULT 'active'` + `CHECK (status IN ('active','disabled','removed'))`。DB 只约束枚举;转移合法性由 use-case 保证。
- **Rationale**: 复用 Platform「varchar + CHECK」约定;`removed` 是 spec 状态机终态,不能用 feature_flags 的 `retired`(那是「永久不可再启用」语义,菜单删除应允许重建同 key 新项)。
- **Alternatives**: `draft`(被 clarify 否决——创建/编辑即生效);`deleted_at` 软删(Platform 明确不机械加 deleted_at,removed 已是删除语义)。

### 1.4 可见性权限建模(核心决策)

- **Decision**: 子表 `platform.menu_permissions`,`PK (menu_id, permission_key)`,`permission_key VARCHAR(100)` + `CHECK` 三段式格式。
- **Rationale**(对照项目先例):
  1. **对照 `operations.role_permissions`**(`database/migrations/0200_operations.sql`): 同为 `PK (role_id, permission_key)` + 同款 CHECK 格式——「权限作为关系化多值」的权威先例,菜单可见性(多权限 OR)与之同构,照抄最一致。
  2. **对照 feature_flags「不允许 JSONB」**: 逗号分隔权限列是「把列表塞进字符串」反模式,无法 FK/CHECK 校验,查询要 LIKE;违反「核心业务字段结构化」全局 JSONB 边界。
  3. **权限由代码 Registry 定义**: OR 语义(任一命中)在渲染时用前端 `can()` 做;空集合=对所有认证用户可见。写入时校验 key 存在于 `OPERATOR_PERMISSION_CATALOG` 即可,无需 FK 到权限表。
- **Alternatives**: 逗号分隔列(反模式);单列单权限(违反 FR-007 多权限 OR);JSONB 数组(违反 JSONB 禁令);「菜单↔role」关系(spec 明确为权限 key 级而非角色级,且角色在 Operations 域、跨域不能建 FK)。

### 1.5 乐观并发

- **Decision**: 不用独立 version 列,复用 runtime_configs / app_versions 的 `expected_updated_at` 模式:DTO 带 `updated_at`,`update`/`remove` 请求体带 `expected_updated_at`,不匹配 → 409 `PLATFORM_CONFLICT`。
- **Rationale**: FR-011 防并发覆盖在项目已有两次先例(`runtime-config-use-cases.ts`、`app-version-use-cases.ts`),前端 `isConflictError`/`mutationErrorMessage` 已处理 409 冲突文案。独立 version 列引入「两套版本事实」,收益不值当(低频小数据量)。排序 API(整体提交)天然整层重写,防覆盖通过带目标父项 `expected_updated_at` 实现。
- **Alternatives**: `version BIGINT` + `WHERE version = $n` CAS(项目无先例,与 updated_at 并存造成双真相)。

### 1.6 稳定 `key`(FR-015)

- **Decision**: 不新增独立菜单项 `key` 列;稳定标识 = 路由目标 `route_key` + 内部 PK `id`。
- **Rationale**: FR-015 逐字读是「对菜单项的**路由目标**采用稳定标识」——约束的是目标而非菜单项自身命名。给菜单项加 `key`(不可变+UNIQUE+不复用)会复制 feature_flags.key 的整套治理,但菜单项身份是「树里位置+显示名」,无程序 API 引用价值,过度设计。
- **Alternatives**: 为菜单项加 key 列(若 ADR 坚持可加,但 spec 未要求「菜单项被代码引用」)。

### 1.7 路由目标白名单

- **Decision**: 存 `route_key VARCHAR(100) NOT NULL`(稳定路由标识),由前端路由注册派生;后端不做路由解析、不存路径字符串。分组(parent_id IS NULL)route_key 可空(纯分组无跳转);非分组 route_key NOT NULL(应用层校验「parent_id 非空则 route_key 非空」)。
- **Rationale**: FR-015 要求稳定标识;存 key 才能「目标重命名时菜单不失效」。白名单由前端 `route-registry.ts` 派生(单一事实源)。
- **Alternatives**: 直接存路径字符串(违反 FR-015,路径一变全菜单失效);服务端维护路径→key 映射(复制前端路由事实,双源漂移);后端存白名单枚举表(Admin 后台专属,白名单来源就是前端路由)。

### 1.8 图标标识

- **Decision**: `icon VARCHAR(64) NULL`,存 lucide-react 图标名的 `lower_snake_case` key(如 `layout_dashboard`),前端 `ICON_REGISTRY[key] ?? FallbackIcon` 容错。
- **Rationale**: spec Assumption 用现有图标库;前端存字符串标识+registry 映射,与后端解耦(后端不 import lucide)。
- **Alternatives**: 直接存 PascalCase 组件名(重命名失效);无 fallback 的 key(未知 key 崩溃)。

### 1.9 最终字段集

`platform.menus`:
| 字段 | 类型 | NULL | 说明 |
| --- | --- | --- | --- |
| `id` | `bigint generated always as identity` | NO | 内部 PK |
| `parent_id` | `bigint` | YES | 自引用;NULL=顶层分组;域内 FK → menus(id) ON DELETE RESTRICT |
| `label` | `varchar(120)` | NO | 显示名,`btrim(label) <> ''` |
| `route_key` | `varchar(100)` | 分组可空 | 稳定路由目标标识;非分组 NOT NULL(应用层校验) |
| `icon` | `varchar(64)` | YES | lucide 图标 key |
| `sort_order` | `integer` | NO | 同层排序,默认 0 |
| `status` | `varchar(16)` | NO | `('active','disabled','removed')` |
| `created_at` / `updated_at` | `timestamptz` | NO | 默认 `now()` |

`platform.menu_permissions`:
| 字段 | 类型 | NULL | 说明 |
| --- | --- | --- | --- |
| `menu_id` | `bigint` | NO | 域内 FK → menus(id) ON DELETE RESTRICT |
| `permission_key` | `varchar(100)` | NO | 三段式权限 key,CHECK 格式 |
| `created_at` | `timestamptz` | NO | 默认 now() |
| PK | `(menu_id, permission_key)` | | 防重复 |

---

## 决策点 2: 前端架构 — 配置驱动渲染

### 2.1 侧边栏数据获取

- **Decision**: Sidebar 用 React Query `useMenusQuery()` fetch 菜单配置,按权限池在前端过滤;不做「初始数据注入」。
- **Rationale**: FR-014「下一次导航渲染生效、无需重新发布前端」只有运行时 fetch 能满足;React Query `staleTime:0` 刷新即取最新;menu mutations 后 `invalidateQueries` 即时生效。渲染流程: fetch → 失败回退内置 NAV(FR-009)→ 成功映射为 NavGroup/NavItem → `can()` 过滤(OR:任一 permission_key 命中保留;空列表保留)。
- **Alternatives**: 初始数据注入(并入 /operations/me 或 session,缓存策略复杂,FR-014 难满足);每次裸 fetch(项目全用 React Query)。

### 2.2 路由白名单来源

- **Decision**: 新增 `apps/admin/src/navigation/route-registry.ts(x)`,从 `router.tsx` 路由声明导出 `ADMIN_ROUTE_TARGETS`(key+href+domain+label 的常量)与 `WHITELIST` 集合;`router.tsx` 用它生成路由(单一事实源),菜单管理页「目标路由」下拉框消费同源白名单。key 即白名单,下拉框只能选择,天然无法输入白名单外路径。
- **Rationale**: 消除「前端常量、路由表、文档」三处漂移;route_key 是 FR-015 的稳定标识。
- **Alternatives**: 手写独立白名单常量(与路由表漂移)。

### 2.3 菜单管理页面位置

- **Decision**: 路由 `/platform/menus`,页面文件 `apps/admin/src/features/platform/pages/menus.tsx`(与 feature-flags/regions 等并列);Platform 二级导航加「菜单管理」入口(seed 作为系统运维分组下菜单项,fallback 最小导航硬编码保留该入口)。
- **Rationale**: 菜单能力并入 Platform 域;现有 Platform 子页面全在 `/platform/<resource>` 且页面在 `features/platform/pages/`。`/system/*` 目前只 dev 专用,放菜单管理会「管理功能」与「开发功能」混用。
- **Alternatives**: `/system/menus`(与 dev design-system 混用,不采用)。

### 2.4 加载失败回退 + 最小导航(FR-009 / FR-012)

- **Decision**: 保留 `NAV_GROUPS`/`SECONDARY_NAV` 作为内置 fallback;Sidebar 在 fetch 失败(网络/500/解析错误)或空树时渲染 fallback 树。空树时渲染最小导航(总览 `/` + 退出登录 + 「菜单管理」入口,若有 `platform.menus.read`)。内部 `useNavConfig()` hook:`query.data ? normalizeToNav(menus) : FALLBACK_NAV`;`findNavItemByHref`/`allNavItems` 改造为基于当前配置/fallback 的统一读取,`breadcrumb.tsx` 复用同一来源。
- **Rationale**: 避免「没有配置 → 进不去管理页 → 永远无法重建」死锁(鸡生蛋)。
- **Alternatives**: 空配置不渲染任何菜单(操作员被困,违反 FR-012)。

### 2.5 Sidebar 激活态迁移

- **Decision**: 保留 `isActive(pathname, href)` 前缀匹配(与配置来源无关),只替换数据来源:`NAV_GROUPS` → 配置化 NavGroup[],`SECONDARY_NAV` prefix → 配置树分组语义。`NavItem` 接口扩展 `routeKey`/`permissions?: string[]`/`iconKey`。SidebarItem 激活态、折叠、二级展开逻辑不动。
- **Rationale**: 最小 diff,避免重写激活态算法。
- **Alternatives**: 重写激活态算法(无必要,配置化后语义仍成立)。

---

## 决策点 3: 后端 API 设计

### 3.1 树形列表返回

- **Decision**: 返回嵌套树 `{ groups: [...] }`(后端递归组树),DTO 对齐现有 Platform(snake_case + ISO 时间)。
- **Rationale**: 树 <500 条,后端一次组树返回,前端零组装;与「树形管理页」UI 直接对应;层级固定 3 层,DTO 稳定。
- **Alternatives**: 平铺 + parent_id(前端再组树;响应同时被管理页与 Sidebar 消费,嵌套一次到位)。

### 3.2 排序 API

- **Decision**: 整体保存单层顺序 `PUT /api/v1/admin/platform/menus/:parent_id/order`,body = 该层全量有序 id 数组;请求带目标父项 `expected_updated_at`,不匹配 409。
- **Rationale**: 对应前端「拖拽后保存整层」交互;单条 move 语义模糊;整体提交天然连续下标规避排序冲突;audit 可记录整层前后顺序(US-004-AS2)。
- **Alternatives**: 单条 move(跨层复杂、审计碎片化);服务端差值插位(不可预测)。

### 3.3 端点集与白名单校验

| Method | Path | 权限 | 审计 action_key |
| --- | --- | --- | --- |
| GET | `/api/v1/admin/platform/menus` | `.read` | — |
| POST | `/api/v1/admin/platform/menus` | `.write` | `platform.menus.write` |
| PATCH | `/api/v1/admin/platform/menus/:id` | `.write` | `platform.menus.write` |
| POST | `/api/v1/admin/platform/menus/:id/remove` | `.write` | `platform.menus.write` |
| PUT | `/api/v1/admin/platform/menus/:parent_id/order` | `.write` | `platform.menus.write` |
| GET | `/api/v1/admin/platform/route-targets` | `.read` | — |

- **删除语义**: `removed` 终态且级联(物理 DELETE 被「状态化退役」禁止);POST remove 而非 DELETE,对齐 feature_flags 的 `POST /:key/retire`。
- **白名单校验**: 前端下拉框(第一道)+ 后端镜像一份 `MENU_ROUTE_TARGET_KEYS` 常量校验(第二道,防绕过 UI 直连 API)。后端只校验 key 存在性,不复制 href。
- **audit**: `{ domain:'platform', type:'menu', id: String(menuId) }`,details 含 `command`(create/update/remove/reorder)与关键变更;action_key 统一 `platform.menus.write`(对齐 feature_flags 单一 write action_key 先例)。

---

## 决策点 4: 迁移与 seed

### 4.1 新迁移文件

- **Decision**: 新建 `database/migrations/1270_platform_menus.sql`,内含 `CREATE TABLE platform.menus` + `CREATE TABLE platform.menu_permissions`。
- **必须同步**: ① 运行 `apps/backend/scripts/generate-migration-manifest.mjs` 重新生成 `required-migrations.generated.ts`(否则 `hasCompatibleBaseline` 失败);② 更新 `docs/docs/developer/reference/domains/platform/database.md`(冻结文档标注「6 表 → 本变更请求新增 menus」作为 ADR 修订落点)。
- **Rationale**: `0300_platform.sql` 冻结不可改;迁移文件名正则 `^\d{4}_[a-z0-9_]+\.sql$` 编号递增即可。
- **Alternatives**: 修改 0300(冻结,禁止)。

### 4.2 seed 预置

- **Decision**: 迁移文件内直接带 seed SQL(1270 内 `INSERT INTO platform.menus` + `menu_permissions`),把 `NAV_GROUPS`/`SECONDARY_NAV` 等价配置一次性写入;不另做应用层 seed。
- **Rationale**: 迁移是全量幂等机制(按 SHA 记录已应用跳过),seed 随 DDL 同文件同事务,天然「首次上线预置」且不重复执行;FR-012 是一次性迁移数据非运行时配置;迁移内 INSERT 纯 SQL 无业务依赖。
- **seed 内容**: `SECONDARY_NAV` 的 `/platform`、`/operations`、`/content` prefix 组 → 顶层分组,items → 一级项;`NAV_GROUPS` 分组 → 顶层分组,domain 一级项。可见性:`operations/*` 配 `operations.*.read`、`platform/*` 配 `platform.*.read`,其余 domain 项不配权限(对齐当前「无权限过滤」现状)。
- **幂等性**: 迁移整体 `BEGIN...COMMIT`,seed 失败回滚整个迁移。
- **Alternatives**: 应用层 seed(需「空表判断」幂等逻辑,发布时点不确定);独立 seed 迁移文件(多文件、SHA 链更长,DDL+seed 同文件更内聚)。

---

## 风险与待 ADR 裁决点

1. **冻结边界打破是前提**: 3 项冻结(Platform 6 表、Admin 信息架构、Operations 权限 catalog)必须在 `/speckit-plan` 前由 ADR/D-xxx 批准(spec checklist 已标注 STOP 门)。
2. **权限数量断言更新**: `permissions.test.ts` 冻结 26 个 key,加 2 个菜单 key 后须同步改(28)。
3. **`super_admin` 自动获得新权限**: bootstrap 塞完整 catalog,新增菜单权限后 super_admin 免配置即有菜单管理权,符合预期但需在变更记录写明。
4. **菜单管理页入口鸡生蛋**: 侧边栏配置驱动后,「菜单管理」入口应在 seed 配置存在(系统运维分组下),且 fallback 最小导航硬编码保留该入口,防配置清空后无法进入管理页(FR-012)。
5. **`route_key`/`icon` 校验强度**: 后端只校验 route_key 存在性与 icon 格式,不做 icon 白名单(前端 fallback 兜底);若 ADR 要求 icon 白名单化,需加 `ICON_REGISTRY` 导出集合。
