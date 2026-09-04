# Feature Specification: 后台菜单与路由配置管理 (Menu & Routing Management)

**Feature Branch**: `004-menu-routing-management`

**Created**: 2026-09-03

**Status**: Approved (Architecture Change Approved)

**Input**: User description: "设计菜单与路由管理"

> ✅ **架构变更已批准(Approved)**
>
> 本功能打破的三项冻结架构基线已由设计裁决正式批准:
>
> - **ADR-022** `docs/docs/developer/reference/adr/ADR-022-platform-menu-routing-config.md`(状态 `frozen`)
> - **D-155** `docs/docs/developer/reference/governance/design-register.md`(状态 `frozen`)
>
> 批准打破的三项冻结基线:
>
> 1. **Platform 域冻结 6 表边界** — `database/migrations/0300_platform.sql` 与
>    `docs/.../platform/database.md` 明确「6 张业务表,不增加、不替换」。
>    ADR-022 批准为 Platform 新增菜单/路由配置能力(第 7 个能力)。
> 2. **Admin 信息架构冻结** — `config.tsx` 注释声明信息架构冻结于
>    `ADMIN_FOUNDATION_PLAN §8`,导航为硬编码常量(`NAV_GROUPS` /
>    `SECONDARY_NAV`)与手写路由(`router.tsx`)。
>    ADR-022 批准将其改造为配置驱动、运行时渲染。
> 3. **Operations 权限 Catalog 冻结** — `apps/backend/src/modules/operations/public/permissions.ts`
>    的 `OPERATOR_PERMISSION_CATALOG` 不含菜单权限。
>    ADR-022 批准新增 `platform.menus.read` / `platform.menus.write`。

## 背景与现状 (Backstory & Current State)

当前 Admin 后台的导航(侧边栏菜单)与路由是**硬编码**的:

- 侧边栏信息架构定义于 `apps/admin/src/navigation/config.tsx` 的 `NAV_GROUPS`
  与 `SECONDARY_NAV` 常量,信息架构冻结于 `ADMIN_FOUNDATION_PLAN §8`;
- 路由由 `apps/admin/src/app/router/router.tsx` 手写注册(11 个 Domain 路由、
  Operations/Platform 子路由、占位路由、登录/未授权路由、通配 404);
- 权威文档 `docs/.../admin/navigation.md` 与 `admin/pages.md` 记录当前页面结构,
  并规定「新增后台页面必须登记页面清单与 Feature Page 双向关系」。

**问题**:
1. 每次新增/调整后台页面都需要开发人员改代码、走发布流程;
2. 菜单的显隐与顺序无法由运营人员按角色/权限运行时调整;
3. 导航结构分散于前端常量、路由表、文档三处,易漂移。

**目标**:在保留现有「按业务工作流组织、而非按后端边界组织」的信息架构原则
前提下,将菜单与路由从硬编码升级为**由运营人员在后台 UI 在线管理的可配置
结构**,菜单项按权限/角色控制可见性,路由映射到已注册的安全目标。

## Clarifications

### Session 2026-09-03

- Q: 新建或编辑后的菜单项是立即对全部运营人员生效,还是需要运营人员显式执行一个发布动作? → A: 创建/编辑即生效 — 保存后立即对全员生效,无发布步骤;状态机去掉 `draft`,新建即 `active`
- Q: 一个菜单项的"可见性权限要求"是否支持配置多个权限,以及这些权限之间是什么关系? → A: 支持多权限、任一匹配(OR)— 拥有其中任意一个权限即可见
- Q: 功能首次上线时,现有导航(当前硬编码在代码中的菜单)应如何初始化到新配置中? → A: 首次上线预置当前导航等价配置 — 用 seed 将现有 `NAV_GROUPS`/`SECONDARY_NAV` 迁移为新配置,升级无感知

### Session 2026-09-04 — CR-001

<!-- CR-001: drag reorder and reparent -->

- Q: 菜单是否继续区分分组并限制三层？→ A: 不区分。所有节点使用同一种模型，可自由递归嵌套；移动不得形成环。<!-- CR-004 -->

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 运营人员在线管理菜单结构 (Priority: P1)

作为一名有菜单管理权限的后台运营人员,我希望在后台界面中创建、编辑、
删除菜单项,并调整菜单的层级与顺序,以便无需开发人员改代码即可维护后台导航。

**Why this priority**: 这是「菜单与路由管理」的核心价值——把导航维护从
代码发布流程中解放出来。没有它,该功能不成立。

**Independent Test**: 具有 `platform.menus.*` 权限的运营人员在「菜单管理」页面
创建一级菜单与子菜单、调整顺序、保存后,后台侧边栏立即反映新结构。

**Acceptance Scenarios**:

1. **Given** 运营人员已登录并拥有菜单管理权限,**When** 打开「菜单管理」页面,
   **Then** 系统以递归目录树展示当前全部菜单节点（层级、顺序、可见性状态）。
2. **Given** 运营人员创建一个一级菜单项并指定其目标路由,
   **When** 保存,**Then** 系统持久化该菜单项,并可在菜单树中立即看到;侧边栏
   按配置渲染该菜单项。
3. **Given** 运营人员拖拽菜单项到同级新位置或另一个有效父项(含顶层),**When** 保存,
   **Then** 系统原子更新父子关系与两个受影响层级的顺序,并按新树渲染侧边栏。
4. **Given** 运营人员尝试把节点拖入自身、后代或已移除父项,
   **When** 提交移动,**Then** 系统拒绝操作且不改变现有树。
4. **Given** 运营人员删除一个菜单项,**When** 确认删除,**Then** 该菜单项从树与
   侧边栏中消失;若其下存在子菜单,系统要求先处理子项或整体删除。

---

### User Story 2 - 按权限/角色控制菜单可见性 (Priority: P1)

作为一名后台运营人员,我希望菜单项的可见性受权限控制,以便不同角色看到
不同的导航入口,避免越权操作入口暴露给无权限人员。

**Why this priority**: 菜单可见性与 RBAC 授权一致是后台安全基线
(Operations RBAC: 无 deny、权限由 active Role 并集决定)。可见性隐藏不能替代
服务端授权,但能避免无权限入口的界面暴露。

**Independent Test**: 同一菜单配置下,不同权限池的操作员登录后看到不同的
侧边栏菜单集合。

**Acceptance Scenarios**:

1. **Given** 一个菜单项配置了所需权限(如 `platform.feature_flags.read`),
   **When** 操作员的权限池不包含该权限,**Then** 该菜单项在侧边栏中不可见。
2. **Given** 同一菜单项,**When** 操作员权限池包含该权限,
   **Then** 该菜单项在侧边栏中可见且可点击。
3. **Given** 菜单项未配置任何权限要求,**When** 任意已认证操作员访问,
   **Then** 该菜单项对登录用户可见。
4. **Given** 操作员直接手动输入一个无权限菜单对应的 URL,
   **When** 尝试访问,**Then** 服务端仍拒绝(HTTP 403),证明菜单可见性仅为
   界面隐藏,授权始终在服务端执行。

---

### User Story 3 - 路由目标安全白名单映射 (Priority: P2)

作为一名后台运营人员,我希望每个菜单项指向的目标路由必须是系统已注册、
已授权可用的安全目标,以便不能通过菜单配置把用户导向任意外部地址或未授权页面。

**Why this priority**: 菜单是「完全动态(后台可编辑)」能力,但若菜单可指向
任意 URL,将形成开放重定向 / 越权入口。路由目标必须受白名单约束。

**Independent Test**: 运营人员在菜单项中填写一个不在白名单内的路径,
系统拒绝保存并给出明确错误;填写白名单内路径则保存成功。

**Acceptance Scenarios**:

1. **Given** 运营人员为一个菜单项设置目标,**When** 目标在白名单内
   (已注册后台路由或受支持的页面路由),**Then** 保存成功。
2. **Given** 运营人员为一个菜单项设置目标,**When** 目标是白名单外的任意路径
   或外部 URL,**Then** 系统拒绝保存(HTTP 400),并提示仅支持已注册页面。
3. **Given** 一个菜单项指向的目标路由被系统停用/移除,**When** 菜单被渲染,
   **Then** 该菜单项显示为不可用或自动隐藏,且不会产生指向失效路由的导航。

---

### User Story 4 - 菜单变更审计追溯 (Priority: P2)

作为一名后台审计人员,我希望每一次菜单结构变更(创建、编辑、删除、排序、
显隐)都被记录,以便追溯谁在何时改了什么。

**Why this priority**: Operations 域要求后台成功管理动作写入
`operator_audit_logs`(append-only)。菜单配置直接影响所有运营人员的可见界面,
其变更必须具备可追溯性。

**Independent Test**: 运营人员修改菜单后,审计人员能在审计日志中查到该动作
(操作人、目标、动作、时间)。

**Acceptance Scenarios**:

1. **Given** 运营人员创建/编辑/删除/排序菜单项,**When** 动作成功,
   **Then** 系统向 `operator_audit_logs` 追加一条不可变审计记录,
   含操作人、目标菜单、动作类型与时间。
2. **Given** 一次菜单批量排序操作,**When** 保存,**Then** 系统记录该批量操作的
   审计轨迹,可追踪到操作人与变更前后顺序。

---

### User Story 5 - 前端配置驱动渲染 (Priority: P3)

作为一名后台前端用户,我希望侧边栏菜单与路由根据配置实时渲染,以便无需
等待发版即可看到生效的导航结构。

**Why this priority**: 这是「菜单管理」价值在前端的落地——导航从常量改为
配置消费,信息架构可运行时调整。

**Independent Test**: 已登录操作员刷新后台页面,侧边栏按最新配置渲染;
配置变更后无需重新发布前端。

**Acceptance Scenarios**:

1. **Given** 后台菜单配置已变更,**When** 操作员刷新已登录的后台页面,
   **Then** 侧边栏按最新配置渲染,无需前端重新发布。
2. **Given** 操作员无菜单权限,**When** 刷新,**Then** 菜单管理入口不显示,
   但菜单配置结果(可见菜单项)正常渲染。

### Edge Cases

- 当菜单配置被清空(没有任何菜单项)时,后台应显示一个可恢复的空状态,
  并保留总览/退出等最小导航,避免操作员「被困」。
- 当菜单配置损坏或解析失败时,系统应回退到内置安全默认导航,而不是白屏。
- 并发编辑:两位运营人员同时修改菜单结构时,系统需防止相互覆盖
  (乐观锁 / 版本校验)。
- 权限回收:菜单项的可见性权限被回收后,已登录操作员的下一次导航渲染立即隐藏。
- 排序冲突:两个菜单项被设置为同一顺序值,系统需给出确定性排序(如按
  次级键稳定排序)。
- 删除父菜单含子菜单:系统拒绝静默删除,要求显式处理子项。
- 菜单项指向的路由被停用:渲染时隐藏或标记,不产生死链。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统 MUST 允许拥有 `platform.menus.*` 权限的运营人员在后台以
  递归目录树查看全部菜单节点（层级、顺序、可见性状态、目标）。
- **FR-002**: 系统 MUST 允许运营人员创建一级菜单项,指定显示名称、目标路由、
  图标标识、排序值与可见性权限要求列表(可为空,多权限 OR)。
- **FR-003**: 系统 MUST 使用统一的递归菜单节点模型，不区分分组或固定层级。未移除节点可位于
  根目录或任意现有节点下，可同时拥有白名单 `route_key` 与子项；无 `route_key` 的节点为目录。
  系统不得设置业务深度上限，但 MUST 防止形成环。<!-- CR-004 -->
- **FR-004**: 系统 MUST 允许运营人员编辑菜单项的显示名称、目标路由、图标、
  排序值、可见性权限要求列表(多权限 OR)与启用状态。
- **FR-005**: 系统 MUST 允许运营人员删除菜单项;删除含子菜单的父项时,
  系统 MUST 要求显式确认并处理子项(级联删除或拒绝删除)。
- **FR-006**: 系统 MUST 允许运营人员通过拖拽调整同级排序，或原子移动到另一有效父项
  （包括顶层），并持久化源层和目标层的连续顺序。<!-- CR-001 -->
- **FR-007**: 系统 MUST 为每个菜单项维护一组可见性权限要求(可为空);菜单项
  可配置**多个权限**,操作员**拥有其中任意一个权限**即可见(OR 语义);当操作员
  权限池不满足任一要求时,该菜单项 MUST 不在侧边栏渲染。未配置任何权限要求时
  对所有已认证操作员可见。
- **FR-008**: 系统 MUST 确保菜单项目标路由落在「已注册后台页面」白名单内;
  白名单外目标或外部 URL MUST 被拒绝保存。
- **FR-009**: 系统 MUST 在渲染侧边栏时应用菜单配置;配置加载失败时 MUST
  回退到内置安全默认导航,绝不白屏。
- **FR-010**: 系统 MUST 将每次成功的菜单结构变更写入不可变操作审计日志
  (append-only),含操作人、目标、动作与时间。
- **FR-011**: 系统 MUST 防止并发菜单编辑相互覆盖。移动操作必须校验节点、源层与目标层
  快照；陈旧提交 MUST 返回既有乐观并发冲突语义。<!-- CR-001 -->
- **FR-012**: 系统 MUST 在「无任何菜单项」时渲染可恢复的最小导航
  (总览、退出等),不使操作员被困。首次上线时系统 MUST 预置当前硬编码导航
  (`NAV_GROUPS` / `SECONDARY_NAV`)的等价配置作为初始菜单,避免空配置成为正常状态。
- **FR-013**: 系统 MUST 按操作员权限池对菜单渲染结果做最终过滤
  (服务端仍独立授权,菜单过滤仅为界面层)。
- **FR-014**: 系统 MUST 使菜单配置变更对所有已登录操作员的**下一次导航渲染**
  生效,无需前端重新发布。
- **FR-015**: 系统 MUST 对菜单项的路由目标采用稳定标识(如路由 key / 页面
  key),而非可变路径字符串作为契约,以便目标重命名时菜单不失效。
- **FR-016**: 系统 MUST 为菜单管理能力提供与现有 Platform 管理一致的
  后端管理接口(列表/创建/编辑/删除/排序/移动/可见性),并复用现有认证与授权链路。<!-- CR-001 -->
- **FR-017**: 菜单管理页 MUST 明确展示拖拽把手、可放置位置、层级和保存结果；页面样式
  必须沿用现有 Admin 设计令牌，且不可仅依赖颜色传递交互状态。<!-- CR-001 -->
- **FR-018**: 侧边栏每一层含子项的目录 MUST 默认收起；即使当前路由属于其后代也不得自动展开，
  操作员点击目录后才切换展开状态。<!-- CR-004 -->
- **FR-019**: 「总览看板」MUST 是根目录中的直接入口，不得依赖专门的总览分组。<!-- CR-004 -->
- **FR-020**: 侧边栏 MUST 递归渲染统一节点样式，目录名与页面名使用相同的正常导航字号；
  带路由且含子项的节点点击菜单项目时 MUST 同时跳转并切换展开状态，箭头 MUST 只切换展开
  状态且不跳转。可导航目录 MUST 暴露 `aria-expanded`；菜单名称与箭头 MUST 共享同一视觉行，
  激活背景、左侧高亮边和悬停反馈 MUST 覆盖整行。<!-- CR-005 -->

### Key Entities

- **菜单项 (Menu Item)**: 一条可导航入口或容器,含显示名称、层级位置(父级)、
  排序值、目标路由(白名单标识)、图标标识、**可见性权限要求列表(多权限 OR)**、
  启用状态、版本。通过 `parent_id` 组织为自由嵌套的递归目录树。
- **路由目标白名单 (Route Target Whitelist)**: 系统已注册且允许被菜单引用的
  安全页面目标集合;由前端路由定义派生,是「可配置结构 + 安全目标」之间的桥。
- **菜单配置版本**: 菜单结构的并发控制与回滚依据(由 ADR-022 批准、`expected_updated_at` 并发模式定稿)。

## State Machines

### State Machine: 菜单项 (Menu Item)

> 生效模式(2026-09-03 澄清):**创建/编辑即生效**——保存后立即对全员渲染,
> 无草稿/发布环节。新建菜单项初始即 `active`。

- **States**: `active`(参与渲染)→ `disabled`(不参与渲染,保留配置)→
  `removed`(已删除,审计保留)
- **Initial**: `active`
- **Terminal**: `removed`
- **Owning FR**: FR-004, FR-005
- **Transitions**:

| From | To | Guard | Event |
| --- | --- | --- | --- |
| active | disabled | 写入权限 | 停用 |
| disabled | active | 写入权限;目标路由仍有效 | 重新启用 |
| active/disabled | removed | 写入权限;无未处理子项或显式级联 | 删除 |
| active | active | 写入权限;版本匹配(乐观并发) | 编辑/重排序 |

---

## Contract References

> 本功能的架构变更已由 **ADR-022**(`docs/docs/developer/reference/adr/ADR-022-platform-menu-routing-config.md`,`frozen`)批准。
> 以下为「现状契约」与「目标契约」两类引用。
> **现状契约**为仓库中已存在的真实文件(Constitution VI 要求仅引用真实工件);
> **目标契约**为 ADR-022 批准新增/修改的契约,权威性以 ADR-022 与实施落点为准。

### 现状契约 (Existing — reference only)

- **Contract: Platform 冻结数据模型**
  - **Path**: `database/migrations/0300_platform.sql`
  - **Kind**: migration
  - **Symbol**: `platform.feature_flags` / `platform.regions` / `platform.feature_flag_overrides` / `platform.runtime_configs` / `platform.app_versions` / `platform.announcements`
  - **Notes**: Platform 冻结为 6 张业务表。ADR-022 已批准为 Platform 新增菜单配置能力(第 7 个能力)。

- **Contract: Operations RBAC 授权模型**
  - **Path**: `docs/docs/developer/reference/domains/operations/rbac.md`
  - **Kind**: markdown
  - **Symbol**: `operations.role_permissions` / permission grammar `<domain>.<resource>.<action>`
  - **Notes**: 权限由应用代码 Permission Registry 定义;菜单可见性必须与 RBAC 一致(无 deny、active Role 并集)。

- **Contract: 操作员权限 Catalog**
  - **Path**: `apps/backend/src/modules/operations/public/permissions.ts`
  - **Kind**: http/ts
  - **Symbol**: `OPERATOR_PERMISSION_CATALOG`
  - **Notes**: 当前 catalog 无菜单权限。ADR-022 已批准新增 `platform.menus.read` / `platform.menus.write`。

- **Contract: 前端权限类型**
  - **Path**: `apps/admin/src/auth/permissions.ts`
  - **Kind**: ts
  - **Symbol**: `DomainName` / `PermissionAction` / `can()`
  - **Notes**: `DomainName` 含 `platform`;`PermissionAction` 当前含 `read` / `create` / `update` / `delete` / `manage` 等,可覆盖菜单权限。

- **Contract: Admin 导航信息架构 (硬编码现状)**
  - **Path**: `apps/admin/src/navigation/config.tsx`
  - **Kind**: ts
  - **Symbol**: `NAV_GROUPS` / `SECONDARY_NAV` / `NavItem` / `NavGroup`
  - **Notes**: 信息架构冻结于 `ADMIN_FOUNDATION_PLAN §8`。ADR-022 已批准将其改造为配置驱动渲染。

- **Contract: Admin 路由注册 (硬编码现状)**
  - **Path**: `apps/admin/src/app/router/router.tsx`
  - **Kind**: ts
  - **Symbol**: `routeTree` / 各 domain 路由
  - **Notes**: 手写路由注册。ADR-022 已批准以白名单形式派生「路由目标白名单」。

- **Contract: Admin 权威文档**
  - **Path**: `docs/docs/developer/reference/admin/navigation.md` / `docs/docs/developer/reference/admin/pages.md`
  - **Kind**: markdown
  - **Symbol**: 导航结构 / 页面清单
  - **Notes**: 变更后需同步更新,保持「页面职责、权限、API、审计」登记与双向关系。

- **Contract: Platform 管理接口模式 (参考)**
  - **Path**: `apps/backend/src/modules/platform/http/management-routes.ts`
  - **Kind**: http
  - **Symbol**: `/api/v1/admin/platform/*` 路由族
  - **Notes**: 菜单管理接口应复用此认证/授权/审计模式(requireAuthentication + authorizer.requirePermission + audit.recordSuccessfulAction)。

### 目标契约 (Approved by ADR-022)

- **Contract: `platform.menus` 数据模型 (目标)**
  - **Path**: `database/migrations/1270_platform_menus.sql`(待实施时新增)
  - **Kind**: migration
  - **Symbol**: `platform.menus`(菜单项树表)+ `platform.menu_permissions`
  - **Notes**: 字段与约束由 ADR-022 批准定稿(详见 [data-model.md](./data-model.md));
    须遵循 Platform 数据设计约定(BIGINT identity PK、`varchar + CHECK` 状态、
    `TIMESTAMPTZ`、域内 FK、不建 JSONB / metadata / created_by)。

- **Contract: 菜单管理 API (目标)**
  - **Path**: `apps/backend/src/modules/platform/http/management-routes.ts`(扩展)
  - **Kind**: http
  - **Symbol**: `/api/v1/admin/platform/menus*`
  - **Notes**: 列表(树)、创建、编辑、删除、排序、可见性;权限
    `platform.menus.read` / `platform.menus.write`。

---

## Traceability

| Requirement | Use Case | Contract | Acceptance Scenario | State Machine |
| --- | --- | --- | --- | --- |
| FR-001 | US-001 | 现状: Platform 管理接口模式;目标: menus API | US-001-AS1 | — |
| FR-002 | US-001 | 目标: `platform.menus` / menus API | US-001-AS2 | SM: 创建即 active |
| FR-003 | US-001 | 目标: `platform.menus` | US-001-AS1 | SM: 创建即 active |
| FR-004 | US-001 | 目标: menus API | US-001-AS2 | SM: 编辑 |
| FR-005 | US-001 | 目标: menus API | US-001-AS4 | SM: → removed |
| FR-006 | US-001 | 目标: menus API | US-001-AS3 | SM: 重排序 |
| FR-007 | US-002 | 现状: RBAC / permissions.ts;目标: menus 可见性字段 | US-002-AS1/2 | SM: active/disabled |
| FR-008 | US-003 | 现状: router.tsx 派生白名单 | US-003-AS1/2 | SM: 创建/启用 guard(白名单) |
| FR-009 | US-005 | 现状: config.tsx | US-005-AS1 | — |
| FR-010 | US-004 | 现状: Operations audit (operator_audit_logs) | US-004-AS1/2 | — |
| FR-011 | — | 目标: `platform.menus` 版本字段 | US-001-AS3 | SM: 编辑 guard |
| FR-012 | — | 现状: AppShell | 边界 | — |
| FR-013 | US-002 | 现状: permissions.ts `can()` | US-002-AS1/2/3 | — |
| FR-014 | US-005 | 目标: menus API | US-005-AS1 | — |
| FR-015 | US-003 | 目标: menus 路由目标标识 | US-003-AS1/2/3 | — |
| FR-016 | US-001 | 现状: Platform 管理接口模式 | US-001-AS1 | — |

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 具有菜单管理权限的运营人员可以在 3 分钟以内完成一次
  「新增一级菜单 + 配置可见性 + 保存」操作。
- **SC-002**: 菜单配置变更后,已登录操作员在 1 次页面刷新(30 秒内)即可看到
  生效的侧边栏结构,无需前端重新发布。
- **SC-003**: 100% 的菜单目标路由落在系统白名单内;保存时白名单外目标被拒绝
  (0 个非法目标进入配置)。
- **SC-004**: 100% 的菜单结构成功变更写入不可变审计日志,可追溯到操作人与时间。
- **SC-005**: 在并发编辑场景下,0 次静默相互覆盖;冲突操作被显式拒绝并提示。
- **SC-006**: 菜单配置加载失败或损坏时,100% 的会话回退到安全默认导航,无白屏。
- **SC-007**: 无任何权限的已登录操作员看到的最小可用导航仍可完成
  「回到总览 / 退出登录」,无操作员被锁死。

## Assumptions

- **归属**: 菜单/路由配置能力并入 **Platform 域**(用户已确认),已由 **ADR-022**
  批准修订冻结的 6 表边界;权限 key 采用 `platform.menus.read` / `platform.menus.write`。
- **动态程度**: **完全动态(后台可编辑)**(用户已确认)——运营人员在后台 UI
  在线增删改菜单结构,路由目标受白名单约束。
- **变更推进方式**: 本 spec 曾作为**架构变更请求**记录,已由设计裁决
  **ADR-022 + D-155** 批准(2026-09-03),可正常进入 `/speckit-plan` / `/speckit-tasks`。
- **可见性 ≠ 授权**: 菜单可见性过滤仅为界面层;服务端 RBAC 始终独立执行授权
  (与 Operations RBAC 一致)。
- **路由白名单**: 由前端已注册路由派生;ADR-022 已批准白名单表达形式为
  `route_key`(前端 `ADMIN_ROUTE_TARGETS` 派生 + 后端镜像校验)。
- **图标**: 采用现有图标库(如 lucide-react 标识)作为可配置标识,不引入
  新图标系统。
- **层级深度**：菜单采用统一递归节点，不设业务深度上限；节点位置不决定是否可导航，带路由
  节点也可拥有子项（CR-004 / ADR-026）。
- **首次上线初始化**: 首次上线以 seed 迁移将现有硬编码导航
  (`NAV_GROUPS` / `SECONDARY_NAV`) 预置为等价的新配置,运营人员升级无感知;
  seed 保持与当前信息架构一致(用户已确认)。
- **影响范围**: 仅 Admin 后台;不涉及 C 端 App 导航。
- **权限细化**: 若 ADR 认为需要,可将菜单管理拆分为 `read` / `write` 两级
  (管理界面读 / 变更写),与现有 Platform `*.read` / `*.write` 模式一致。
