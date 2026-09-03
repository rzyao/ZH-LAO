---

description: "Task list for 后台菜单与路由配置管理 (Menu & Routing Management)"

---

# Tasks: 后台菜单与路由配置管理 (Menu & Routing Management)

**Input**: Design documents from `/specs/004-menu-routing-management/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: 本功能涉及数据模型、状态机、RBAC 与前端渲染,采用测试驱动(后端契约/集成测试 + 前端组件测试),与 spec 的 Given/When/Then 验收场景对应。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

> ✅ 架构变更已批准(ADR-022 + D-155,2026-09-03),SPEC_CONFLICT GATE 已通过。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- 后端: `apps/backend/src/modules/...`、迁移: `database/migrations/`
- 前端: `apps/admin/src/...`
- 权威文档: `docs/docs/developer/reference/...`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 项目基础结构,沿用现有 monorepo 分层,无需新建脚手架

- [X] T001 创建迁移目录文件占位 `database/migrations/1270_platform_menus.sql`(空文件,DDL 在 T002)
- [X] T002 [P] 后端 Platform 模块新增 `menu.ts` 领域类型(空占位)在 `apps/backend/src/modules/platform/domain/menu.ts`
- [X] T003 [P] 前端导航目录新增 `route-registry.ts` 空占位在 `apps/admin/src/navigation/route-registry.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 所有用户故事依赖的基础——菜单数据模型、迁移与 seed、权限 catalog、路由白名单源。此阶段未完成前任何用户故事都无法开始。

**🔴 CRITICAL**: 本阶段含冻结边界打破落地(ADR-022 已批准),新增迁移后必须重新生成 manifest。

### Foundational Tasks

- [X] T004 创建 `platform.menus` 与 `platform.menu_permissions` 表 DDL + 迁移内 seed(预置 `NAV_GROUPS`/`SECONDARY_NAV` 等价配置)在 `database/migrations/1270_platform_menus.sql`,字段与约束严格遵循 [data-model.md](./data-model.md)(BIGINT identity PK、parent_id 自引用 FK RESTRICT、status varchar+CHECK、menu_permissions PK(menu_id,permission_key)、三段式 CHECK;seed 见 research 4.2)
- [X] T005 重新生成迁移 manifest `apps/backend/scripts/generate-migration-manifest.mjs` → 更新 `apps/backend/src/database/required-migrations.generated.ts`(含 1270;否则 `hasCompatibleBaseline` 校验失败)
- [X] T006 [P] 扩展权限 catalog 新增 `platform.menus.read` / `platform.menus.write` 在 `apps/backend/src/modules/operations/public/permissions.ts`
- [X] T007 同步更新权限数量断言 26 → 28 在 `apps/backend/src/modules/operations/__tests__/permissions.test.ts`
- [X] T008 [P] 扩展后端 `ids.ts` 新增 `MenuInternalId`(bigint brand)在 `apps/backend/src/modules/platform/domain/ids.ts`
- [X] T009 [P] 定义 `MenuItem` / `MenuPermission` 领域类型(状态 active/disabled/removed、route_key、parent_id、permissions)在 `apps/backend/src/modules/platform/domain/menu.ts`
- [X] T010 定义 `MenuRepository` port 接口(create/update/remove/reorder/listTree/findById/findByRouteKey)在 `apps/backend/src/modules/platform/application/ports/platform-repositories.ts`
- [X] T011 定义后端白名单校验常量 `MENU_ROUTE_TARGET_KEYS`(镜像前端 route-key,仅 key 字符串)在 `apps/backend/src/modules/platform/domain/menu.ts` 或 `menu-use-cases.ts`
- [X] T012 [P] 创建前端导航类型 `NavNode` / `RouteTarget` 在 `apps/admin/src/navigation/types.ts`
- [X] T013 创建前端路由注册表 `ADMIN_ROUTE_TARGETS`(从现有 `router.tsx` 路由声明派生 key+href+label;含 11 domain、operations/platform 子页、overview、change-password 等)在 `apps/admin/src/navigation/route-registry.ts`
- [X] T014 改造 `router.tsx` 消费 `ADMIN_ROUTE_TARGETS` 生成路径(单一事实源,消除硬编码路径)在 `apps/admin/src/app/router/router.tsx`
- [X] T015 更新权威文档: `docs/docs/developer/reference/domains/platform/database.md` 将「6 张业务表」标注为「6 张 + 菜单配置能力(ADR-022)」

**Checkpoint**: 数据模型/迁移/权限/白名单源就绪,可开始用户故事实现。

---

## Phase 3: User Story 1 - 运营人员在线管理菜单结构 (Priority: P1) 🎯 MVP

**Goal**: 运营人员在后台 UI 创建/编辑/删除/排序菜单项(树形),保存即生效,侧边栏反映新结构。

**Independent Test**: 具有 `platform.menus.write` 权限的运营人员在菜单管理页创建一级菜单与子菜单、调整顺序、删除后,后端菜单树与侧边栏立即反映新结构(quickstart 场景 2/3/7/9)。

> 本故事依赖 Foundational 的领域类型、Repository port、迁移与权限。US1 需要先完成后端 use-case(US2/3/4 的可视化权限与白名单校验字段也在其后),但 US1 的 CRUD + 状态机 + 排序可独立交付与测试。

### Tests for User Story 1

- [X] T016 [P] [US1] 契约测试: 菜单树 GET 返回嵌套结构、无 removed 项在 `apps/backend/src/modules/platform/__tests__/menu-http.test.ts`
- [X] T017 [P] [US1] 集成测试: 创建菜单项(分组/一级/子项)+ 层级超深拒绝在 `apps/backend/src/modules/platform/__tests__/menu-use-cases.test.ts`
- [X] T018 [P] [US1] 集成测试: 状态机转移(active→disabled→active→removed)+ 删除级联子项在 `apps/backend/src/modules/platform/__tests__/menu-use-cases.test.ts`
- [X] T019 [P] [US1] 集成测试: 排序整体提交 + 并发 expected_updated_at 409 在 `apps/backend/src/modules/platform/__tests__/menu-use-cases.test.ts`

### Implementation for User Story 1

- [X] T020 [US1] 实现 `PostgresMenuRepository`(create/update/remove/reorder/listTree;树组装递归)在 `apps/backend/src/modules/platform/infrastructure/repositories.ts`
- [X] T021 [US1] 实现 `MenuUseCases`(createMenu/updateMenu/removeMenu/reorderMenu;深度校验、状态机 guard、级联、白名单校验、expected_updated_at 乐观并发)在 `apps/backend/src/modules/platform/application/use-cases/menu-use-cases.ts`
- [X] T022 [US1] 扩展 `PlatformManagementService` 暴露菜单方法在 `apps/backend/src/modules/platform/application/services/platform-management-service.ts`
- [X] T023 [US1] 注册菜单管理 API 端点(GET 树 / POST 创建 / PATCH 编辑 / POST remove / PUT order),复用 `requireAuthentication + authorizer.requirePermission('platform.menus.*') + audit.recordSuccessfulAction` 在 `apps/backend/src/modules/platform/http/management-routes.ts`
- [X] T024 [US1] 装配菜单 use-cases 与 DTO 在 `apps/backend/src/modules/platform/http/composition.ts`

**Checkpoint**: US1 后端完成——运营人员可通过 API 管理菜单树(CRUD + 排序 + 状态机),测试通过。

---

## Phase 4: User Story 2 - 按权限/角色控制菜单可见性 (Priority: P1)

**Goal**: 菜单项按权限 OR 语义控制可见性;不同权限池操作员看到不同菜单集合;服务端始终独立授权。

**Independent Test**: 同一菜单配置下,不同权限池操作员登录后侧边栏显示不同菜单集合;手动输入无权限 URL → 403(quickstart 场景 5)。

> US2 依赖 US1 的菜单树 API(菜单项含 `permissions` 数组)与 Foundational 的权限 catalog / 前端 `can()`。

### Tests for User Story 2

- [X] T025 [P] [US2] 前端组件测试: 权限过滤(多权限 OR、空列表保留)在 `apps/admin/src/navigation/use-nav-config.test.ts`
- [X] T026 [P] [US2] 集成测试: 写入菜单时权限 key 不在 catalog 被拒绝在 `apps/backend/src/modules/platform/__tests__/menu-use-cases.test.ts`

### Implementation for User Story 2

- [X] T027 [US2] 在 `MenuUseCases` 创建/编辑时校验 `permissions[]` 每个 key ∈ `OPERATOR_PERMISSION_CATALOG` 在 `apps/backend/src/modules/platform/application/use-cases/menu-use-cases.ts`
- [X] T028 [US2] 实现前端 `useNavConfig()` hook: fetch 菜单配置 + `can()` 权限过滤(OR;空列表保留)在 `apps/admin/src/navigation/use-nav-config.ts`
- [X] T029 [US2] 菜单管理页可见性权限多选 UI(从可用权限集合选择,写入 `permissions[]`)在 `apps/admin/src/features/platform/pages/menus.tsx`

**Checkpoint**: 菜单可见性按权限 OR 过滤生效;服务端独立授权(403)。

---

## Phase 5: User Story 3 - 路由目标安全白名单映射 (Priority: P2)

**Goal**: 菜单项目标路由受白名单约束(前端下拉 + 后端镜像校验);存稳定 `route_key` 而非路径。

**Independent Test**: 菜单管理页「目标路由」下拉只枚举 `ADMIN_ROUTE_TARGETS`;直接调 API 传白名单外 route_key → 400(quickstart 场景 3/11)。

> US3 依赖 Foundational 的 `route-registry.ts`(前端白名单源)与 `MENU_ROUTE_TARGET_KEYS`(后端镜像)。

### Tests for User Story 3

- [X] T030 [P] [US3] 前端组件测试: 下拉框只枚举 `ADMIN_ROUTE_TARGETS` 在 `apps/admin/src/features/platform/pages/menus.test.tsx`
- [X] T031 [P] [US3] 集成测试: 后端拒绝白名单外 route_key 在 `apps/backend/src/modules/platform/__tests__/menu-use-cases.test.ts`

### Implementation for User Story 3

- [X] T032 [US3] 菜单管理页「目标路由」下拉框消费 `ADMIN_ROUTE_TARGETS`(第一道校验)在 `apps/admin/src/features/platform/pages/menus.tsx`
- [X] T033 [US3] 后端 `MenuUseCases` 校验 route_key ∈ `MENU_ROUTE_TARGET_KEYS`(第二道,防绕过 UI)在 `apps/backend/src/modules/platform/application/use-cases/menu-use-cases.ts`
- [X] T034 [US3] 新增 `GET /api/v1/admin/platform/route-targets` 端点返回白名单(供下拉框)在 `apps/backend/src/modules/platform/http/management-routes.ts`

**Checkpoint**: 菜单目标路由只能在白名单内,前后端双重校验。

---

## Phase 6: User Story 4 - 菜单变更审计追溯 (Priority: P2)

**Goal**: 每次菜单结构变更(创建/编辑/删除/排序)写入不可变审计日志,可追溯操作人/目标/时间。

**Independent Test**: 运营人员修改菜单后,审计日志能查到该动作(操作人、目标、动作、时间)(quickstart 场景 3/9;US-004-AS1/2)。

> US4 依赖 US1 的写端点(在 route 层挂 audit),复用 Foundational 的 `OperationsAuditRecorder`。

### Implementation for User Story 4

- [X] T035 [US4] 在菜单写端点(create/update/remove/reorder)挂 `audit.recordSuccessfulAction`,target `{ domain:'platform', type:'menu', id }`、action_key `platform.menus.write`、details 含 command 与关键变更在 `apps/backend/src/modules/platform/http/management-routes.ts`
- [X] T036 [US4] 集成测试: 批量排序审计记录整层前后顺序(US-004-AS2)在 `apps/backend/src/modules/platform/__tests__/menu-http.test.ts`

**Checkpoint**: 菜单变更全部写审计,批量排序可追溯前后顺序。

---

## Phase 7: User Story 5 - 前端配置驱动渲染 (Priority: P3)

**Goal**: Sidebar 菜单根据配置实时渲染;配置变更后无需发版;失败回退安全默认导航;空树最小导航。

**Independent Test**: 已登录操作员刷新后台,侧边栏按最新配置渲染;停后端 → 回退 `NAV_GROUPS` 不白屏;清空配置 → 最小导航(quickstart 场景 1/10)。

> US5 依赖 US1-3 的后端 API(菜单树 + 权限 + 白名单)与 US2 的 `useNavConfig()`。

### Tests for User Story 5

- [X] T037 [P] [US5] 前端组件测试: Sidebar 消费配置渲染 + 失败回退 `NAV_GROUPS` 在 `apps/admin/src/components/navigation/sidebar.test.tsx`
- [X] T038 [P] [US5] 前端组件测试: 空树最小导航(总览/退出/菜单管理入口)在 `apps/admin/src/components/navigation/sidebar.test.tsx`

### Implementation for User Story 5

- [X] T039 [US5] 改造 `Sidebar` 消费 `useNavConfig()`(替换对 `NAV_GROUPS`/`SECONDARY_NAV` 直接引用,保留 `isActive` 前缀匹配)在 `apps/admin/src/components/navigation/sidebar.tsx`
- [X] T040 [US5] 改造 `breadcrumb.tsx` 复用 `useNavConfig()` 数据源在 `apps/admin/src/components/navigation/breadcrumb.tsx`
- [X] T041 [US5] 改造 `findNavItemByHref` / `allNavItems` 为基于当前 nav / fallback 的统一读取在 `apps/admin/src/navigation/config.tsx`
- [X] T042 [US5] 实现菜单管理页 `/platform/menus`(树形展示、创建/编辑/删除/拖拽重排、权限多选、目标路由下拉、409 冲突提示)在 `apps/admin/src/features/platform/pages/menus.tsx`
- [X] T043 [US5] 实现菜单管理 API 调用层 React Query hooks(`useMenusQuery`/`useCreateMenu`/`useUpdateMenu`/`useRemoveMenu`/`useReorderMenus`/`useRouteTargetsQuery`,query key `['platform-admin','menus']`,mutations 后 invalidate)在 `apps/admin/src/features/platform/api/menus-api.ts`
- [X] T044 [US5] 在 `router.tsx` 注册 `/platform/menus` 路由 + Platform 二级导航/seed 加入「菜单管理」入口在 `apps/admin/src/app/router/router.tsx` 与 `route-registry.ts`
- [X] T045 [US5] 更新权威文档 `docs/docs/developer/reference/admin/navigation.md`(配置驱动导航)与 `admin/pages.md`(登记 `/platform/menus` 页面)

**Checkpoint**: Sidebar 配置驱动渲染完成,失败回退与最小导航生效,菜单管理页可用。

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 跨用户故事收尾

- [X] T046 [P] 端到端 smoke 更新: 在 `apps/admin/e2e/smoke.spec.ts` 加菜单管理页冒烟(创建菜单 → 侧边栏出现)
- [X] T047 [P] 执行 quickstart.md 全部验证场景确认通过
- [X] T048 检查 `docs/docs/developer/reference/domains/platform/database.md` 与 `admin/navigation.md`/`pages.md` 双向关系一致
- [X] T049 清理: 确认 `NAV_GROUPS`/`SECONDARY_NAV` 仅作为 fallback,无产品路径仍硬编码引用(除 fallback 与 seed)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖,立即开始
- **Foundational (Phase 2)**: 依赖 Setup;**BLOCKS 全部用户故事**(迁移、权限、领域类型、白名单源)
- **User Stories (Phase 3-7)**: 依赖 Foundational 完成
  - **US1 (Phase 3)**: 后端菜单 CRUD + 状态机 + 排序(最早可独立交付)
  - **US2 (Phase 4)**: 依赖 US1 后端(菜单树含 permissions)+ 前端 `can()`
  - **US3 (Phase 5)**: 依赖 Foundational(白名单源);可与 US2 并行(不同文件)
  - **US4 (Phase 6)**: 依赖 US1 写端点(route 层挂 audit);可与 US2/US3 并行
  - **US5 (Phase 7)**: 依赖 US1-3 后端 API + US2 `useNavConfig()`;前端聚合
- **Polish (Phase 8)**: 依赖全部用户故事

### User Story Dependencies

- **US1 (P1)**: 依赖 Foundational;无其他 story 依赖 → **MVP 核心**
- **US2 (P1)**: 依赖 US1 后端(可见性在 US1 的 permissions 字段上)
- **US3 (P2)**: 依赖 Foundational(白名单源);独立
- **US4 (P2)**: 依赖 US1 写端点;独立
- **US5 (P3)**: 依赖 US1-3 后端 + US2 hook;聚合

### Within Each User Story

- 测试先行(TDD),写后确保 FAIL 再实现
- 领域类型 → Repository → UseCase → Service → 路由
- Story 独立完成后再进入下一优先级

### Parallel Opportunities

- Phase 1 三个 [P] 任务并行
- Phase 2 中 T006/T008/T009/T012 [P] 并行
- US3(T030-T034)与 US4(T035-T036)可与 US2 并行(不同文件)
- US2 与 US3 内部 [P] 任务并行
- US5 内部 [P] 测试并行

---

## Parallel Example: User Story 1

```bash
# Launch all US1 tests together (contract + integration):
Task: "契约测试: 菜单树 GET 嵌套结构"
Task: "集成测试: 创建 + 层级超深拒绝"
Task: "集成测试: 状态机转移 + 级联"
Task: "集成测试: 排序 + 409 并发"

# Implementation sequence (依赖链):
Task: "PostgresMenuRepository"
Task: "MenuUseCases"   (依赖 Repository)
Task: "PlatformManagementService"   (依赖 UseCases)
Task: "management-routes 端点"   (依赖 Service)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup(3 个占位)
2. Phase 2: Foundational(T004-T015:迁移+seed、manifest、权限、领域类型、Repository port、白名单源、route-registry)
3. Phase 3: US1(T016-T024:后端菜单 CRUD + 状态机 + 排序 + API)
4. **STOP and VALIDATE**: 通过 quickstart 场景 2/3/7/9 验证 US1 独立可用
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → 基础就绪
2. US1 → 菜单树管理(MVP) → 独立验证
3. US2 + US3 + US4 → 可见性、白名单、审计(可并行)
4. US5 → 前端配置驱动渲染 + 菜单管理页(聚合)
5. Polish → 文档、smoke、双向关系

### Parallel Team Strategy

- 单人/顺序: Setup → Foundational → US1 → US2 → US3 → US4 → US5 → Polish
- 多开发者:
  - 共同完成 Phase 1-2
  - Dev A: US1 → US4(后端主线)
  - Dev B: US3(白名单,前端下拉 + 后端镜像)
  - Dev C: US2 前端过滤(依赖 US1 后端权限字段)
  - US5 最后聚合

---

## Notes

- **迁移必须重新生成 manifest**(T005): 新增 `1270_platform_menus.sql` 后运行
  `apps/backend/scripts/generate-migration-manifest.mjs`,否则 `hasCompatibleBaseline` 失败。
- **冻结文件不改**: `0300_platform.sql` 不改;新表全在 `1270_platform_menus.sql`。
- **权限数量断言**: `permissions.test.ts` 26→28(T007);`super_admin` 自动获得菜单权限(符合预期)。
- **状态机**: 菜单项 `active/disabled/removed`,初始即 active(无 draft),removed 终态级联、永不物理删除。
- **乐观并发**: 编辑/删除/排序带 `expected_updated_at`,不匹配 → 409 `PLATFORM_CONFLICT`。
- **白名单双校验**: 前端下拉(第一道)+ 后端 `MENU_ROUTE_TARGET_KEYS`(第二道)。
- **鸡生蛋**: 菜单管理页入口在 seed 配置预置 + fallback 最小导航硬编码保留(FR-012),防配置清空后无法进入管理页。
- **`isActive` 前缀匹配保留**: 只替换 Sidebar 数据来源,不重写激活态算法。
- 每个任务完成后按逻辑分组提交。
- 每个 checkpoint 停止验证 story 独立可用。

---

## Phase 9: Convergence

**Purpose**: `/speckit-converge`(2026-09-03)识别出的 spec/plan 意图与当前代码之间的差距;完成这些任务后再次收敛将报告更少或零剩余项。

- [X] T050 在 seed 迁移中为「菜单管理」页新增入口:在 `database/migrations/1270_platform_menus.sql` 的系统运维/平台控制台分组(`platform.menus` 表中 parent 为平台控制台一级项)下新增菜单项,`route_key='platform.menus'`、`label='菜单管理'`、`icon='settings'`、可见性权限 `platform.menus.read`,使配置驱动模式下运营人员可直接进入菜单管理页 per US-005/FR-012 (partial)
- [X] T051 为菜单管理页每个分组/一级项提供组内排序 UI(上移/下移或拖拽),提交对应 `PUT /api/v1/admin/platform/menus/:parent_id/order` 调用,替代当前仅「保存顶层顺序」的单一排序按钮 per FR-006/US-001-AS3 (partial)
- [X] T052 为顶层菜单重排(`parent_id=0`)提供并发保护:在 `apps/backend/src/modules/platform/application/use-cases/menu-use-cases.ts` 的 `reorder` 当 `parentId === null` 时增加乐观并发校验(如校验根层代表 `updated_at` 或整体版本),不匹配返回 409,满足 SC-005「0 次静默相互覆盖」 per FR-011/SC-005 (partial)
