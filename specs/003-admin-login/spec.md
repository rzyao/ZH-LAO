# Feature Specification: 后台管理员登录 (Admin Login)

**Feature Branch**: `003-admin-login`

**Created**: 2026-09-03

**Status**: Draft

**Input**: User description: "为admin后台开发登录功能"

## 背景与现状 (Backstory & Current State)

> 本文档是 **后台管理员登录 (Admin Login)** 功能的规格。前端 `apps/admin` 已存在登录
> 脚手架（`AuthContext`、`AuthGuard`、`LoginPage`、`session-store`、`token-store`、
> `auth/api.ts`），后端 `apps/backend` 已存在管理员认证 Use Case
> （`AdminAuthenticationService`、`POST /api/v1/admin/auth/login`、`ensureDefaultAdmin`
> 引导）。本规格据此冻结该能力的完整行为契约，并对缺失能力（如前端会话刷新、
> 密码变更、登录审计、安全加固）进行补齐定义。本文档遵循 ZH-LAO Constitution
> Principles I–XI，特别是契约引用现实（VI）、决策预算（VII）与证据现实（IX）。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 管理员账号密码登录 (Priority: P1)

作为一名后台管理员（运营人员），我希望使用账号与密码登录 Admin 后台，以便进入管理平台执行运营操作。

**Why this priority**: 没有后台登录，任何运营、内容、平台管理能力都无法被授权访问。这是 Admin 后台的最小可用闭环，也是全部运营能力的前置依赖。

**Independent Test**: 管理员在登录页输入正确的账号密码后，系统验证凭据、签发会话令牌、加载操作员身份与权限池，并跳转到后台首页。

**Acceptance Scenarios**:

1. **Given** 一个已存在的 `active` 状态操作员及其对应的 `admin_credentials` 记录，**When** 该操作员在登录页提交正确的用户名与密码，**Then** 系统验证通过，创建一条 `active` 会话，返回短期访问令牌与可轮换刷新令牌，操作员进入已登录的主界面。
2. **Given** 操作员输入的密码与存储的哈希不匹配，**When** 提交登录，**Then** 系统返回统一的 `INVALID_CREDENTIAL` 失败（HTTP 401），不泄露账号是否存在，也不创建会话。
3. **Given** 一个 `disabled` 或 `closed` 状态的用户，**When** 提交正确的账号密码尝试登录，**Then** 系统拒绝登录（HTTP 403，`ACCOUNT_DISABLED` / `ACCOUNT_CLOSED`），不签发任何令牌。
4. **Given** 已登录的操作员访问受保护的页面，**When** 携带有效的访问令牌，**Then** 后端能够解析令牌解析出操作员身份与权限并放行请求；操作员看到的页面内容由 `operations.*` / `platform.*` 权限集决定。

---

### User Story 2 - 会话无感刷新与令牌轮换 (Priority: P2)

作为一名已登录的后台管理员，我希望在短期访问令牌过期后，系统能自动续签会话，而无需重新输入账号密码，同时保证旧刷新令牌一旦被轮换即失效。

**Why this priority**: 后台长期操作需要平滑的会话维持；强制轮换 + 单次使用刷新令牌是防止会话重放攻击的关键安全边界。

**Independent Test**: 携带有效的刷新令牌请求续签，系统返回新的访问令牌与全新的刷新令牌，并使旧刷新令牌立即失效。

**Acceptance Scenarios**:

1. **Given** 一条 `active` 且未过期的管理员会话及其刷新令牌，**When** 请求刷新会话，**Then** 系统返回新的访问令牌与全新的刷新令牌，延长会话到期时间（滑动 30 天），并使旧刷新令牌立即失效。
2. **Given** 一条已被轮换失效的旧刷新令牌，**When** 再次用于刷新，**Then** 系统拒绝该请求并返回凭据无效错误，阻止重放。
3. **Given** 管理员的账户状态为 `disabled` 或 `closed`，**When** 尝试使用刷新令牌续签，**Then** 系统拒绝刷新并返回对应的账户状态受限错误。

---

### User Story 3 - 首次默认管理员引导 (Priority: P2)

作为系统部署者，我希望平台首次启动时自动创建默认超级管理员账号，以便能够首次登录后台并进行后续的运营人员管理。

**Why this priority**: 后台运营人员由 Operations 域创建，但第一个超级管理员需要一个受控的引导途径，否则无人能进入系统完成初始化。

**Independent Test**: 在没有任何 `operations.operators` 记录的数据库中启动服务，系统自动创建默认管理员身份（`identity.admin_credentials`）并引导为超级管理员，随后可正常登录。

**Acceptance Scenarios**:

1. **Given** 数据库中不存在任何 `operations.operators` 记录，**When** 服务启动执行管理员引导，**Then** 系统创建默认 `admin_credentials` 身份并完成超级管理员 `operations.operator` 引导；同一引导可安全重复执行且幂等。
2. **Given** 数据库中已存在至少一个 `operations.operators` 记录，**When** 服务启动执行管理员引导，**Then** 系统不再创建新的默认管理员（引导空转，不产生副作用）。
3. **Given** 默认管理员账号已被显式创建，**When** 服务再次启动，**Then** 引导逻辑识别已有凭据并跳过创建，保持幂等。

---

### User Story 4 - 修改管理员密码 (Priority: P3)

作为已登录的后台管理员，我希望能够修改自己的后台登录密码，以便在怀疑凭据泄露或定期轮换时更换密码。

**Why this priority**: 凭据生命周期管理是后台安全治理的基础能力；长期使用固定密码存在被泄露或爆破风险。

**Independent Test**: 已认证的管理员提交当前密码与新密码，系统校验当前密码正确性后更新密码哈希并强制相关会话重签或使旧会话失效。

**Acceptance Scenarios**:

1. **Given** 一条活跃的管理员会话且操作员持有当前密码，**When** 提交当前密码与新密码，**Then** 系统校验当前密码正确后，更新 `admin_credentials.password_hash` 为新密码的哈希，并记录审计事件。
2. **Given** 管理员提交的当前密码不正确，**When** 尝试修改密码，**Then** 系统拒绝并返回凭据无效错误，不更新任何数据。
3. **Given** 新密码与当前密码相同或不符合安全强度要求，**When** 提交修改，**Then** 系统拒绝变更并返回明确的校验错误。

---

### User Story 5 - 管理员退出登录 (Priority: P3)

作为一名已登录的后台管理员，我希望能够主动退出后台会话，以便在离开工位、共享电脑或怀疑账号被盗时立即结束当前会话。

**Why this priority**: 会话的主动终止是后台安全与合规（最小暴露窗口）的必要能力。

**Independent Test**: 已认证的管理员点击退出，系统撤销当前会话的刷新令牌，后续使用该刷新令牌的请求均被拒绝。

**Acceptance Scenarios**:

1. **Given** 一条活跃的管理员会话，**When** 操作员点击退出并携带当前刷新令牌，**Then** 系统将会话置为 `revoked` 并记录撤销原因，刷新令牌立即失效。
2. **Given** 管理员已退出后再次携带旧刷新令牌访问，**When** 发起请求，**Then** 系统拒绝并返回凭据无效错误。

---

### Edge Cases

- **并发登录同一账号**: 同一管理员账号同时发起多个登录请求时，系统必须为每次成功登录创建独立的会话，允许并行会话存在，互不干扰（每会话独立刷新令牌）。
- **登录请求重放（Replay）**: 已被消费或撤销的刷新令牌被再次提交时，系统必须拒绝，杜绝克隆会话。
- **密码哈希不可逆**: 任何日志、事件、数据库列与响应体中均不得出现明文密码或可逆哈希。
- **默认管理员泄露**: 默认管理员（`admin / 123456`）仅用于首次引导；一旦存在运营人员记录，系统不应再创建默认管理员。默认凭据的强制变更与废弃策略在安全需求中定义。
- **前端 401 处理**: 当访问令牌失效且刷新失败时，前端必须清除本地会话并重定向到登录页，避免停留在半登录状态。
- **403 实时恢复**: 当因权限变更收到 `403 FORBIDDEN` 时，前端应静默刷新 `/api/v1/admin/operations/me` 更新权限池（RBAC 前端安全交互规范）。

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统 MUST 为后台登录提供独立的账号密码凭据通道（`identity.admin_credentials`），与移动端手机 OTP 登录相互隔离，不得混用。
- **FR-002**: 系统 MUST 在登录时将用户名标准化为小写且去除首尾空白，并对空白用户名或密码进行拒绝。
- **FR-003**: 系统 MUST 使用加盐慢哈希算法（scrypt，每密码独立随机盐）保存后台密码哈希，禁止明文或可逆存储。
- **FR-004**: 系统 MUST 对不存在的用户名与密码错误返回一致的 `INVALID_CREDENTIAL`（HTTP 401），不得泄露账号是否存在（防枚举）。
- **FR-005**: 系统 MUST 在登录与刷新路径上校验用户账户状态：仅 `active` 用户可登录与续签；`disabled` 返回 `ACCOUNT_DISABLED`（403），`closed` 返回 `ACCOUNT_CLOSED`（403）。
- **FR-006**: 系统 MUST 为每次成功登录创建一条 `active` 会话，签发 15 分钟有效的短期访问令牌（无状态，含用户公开 UUID）与 30 天滑动窗口的可撤销刷新令牌。
- **FR-007**: 系统 MUST 在每次刷新会话时强制轮换刷新令牌：签发新令牌并使旧令牌立即失效，同时将会话到期时间向后顺延 30 天。
- **FR-008**: 系统 MUST 仅持久化刷新令牌与密码的安全单向哈希值，禁止在数据库、日志、事件或 Outbox 中明文记录 Raw 刷新令牌与 Raw 密码。
- **FR-009**: 系统 MUST 在数据库不存在任何 `operations.operators` 记录时，引导创建默认管理员身份并完成超级管理员运营映射；该引导必须幂等且可安全重复执行。
- **FR-010**: 系统 MUST 在数据库已存在至少一个 `operations.operators` 记录时，停止创建新的默认管理员（引导空转，无副作用）。
- **FR-011**: 系统 MUST 支持已认证管理员修改自身后台密码：校验当前密码正确性与新密码强度，更新密码哈希并记录审计。
- **FR-012**: 系统 MUST 支持已认证管理员退出当前会话：将对应会话置为 `revoked`，使该会话刷新令牌立即失效，并记录撤销原因与时间。
- **FR-013**: 系统 MUST 在后端所有受保护的 Admin HTTP 端点执行 `requireAuthentication`（解析 Bearer Access Token → AuthContext），未认证请求返回 `UNAUTHENTICATED`（401）。
- **FR-014**: 系统 MUST 在解析出操作员身份后，按 Operations RBAC 授权算法（active Operator → active Roles → Permission UNION → exact key）执行权限判定，未授权返回 `OPERATOR_ACCESS_DENIED`（403）。
- **FR-015**: 系统 MUST 为后台登录成功、刷新轮换、退出、密码变更等安全敏感操作的**成功动作**写入操作审计记录（`operations.operator_audit_logs`），记录操作员、动作、目标与请求上下文；认证失败、授权拒绝等失败事件**不写入审计**，进入安全/应用日志（遵循 `domains/operations/audit.md` 成功语义），且审计 `details` 不得包含密码、令牌等敏感字段。
- **FR-016**: 系统 MUST 支持前端从 `POST /api/v1/admin/operations/me` 加载当前操作员身份、角色与权限池，用于渲染与前端权限守卫。
- **FR-017**: 系统 MUST 在管理员登录失败场景提供合理的重试限流（登录尝试频率控制），防暴力破解，且不破坏正常管理员使用体验。

---

### Key Entities

- **AdminCredential**: 后台登录凭据，唯一关联 `User`（`user_id` UNIQUE），包含用户名（唯一、不可空白）与 scrypt 密码哈希；密码仅存单向哈希，永不返回明文。
- **User**: 平台核心身份主体（复用 Identity 域 `users`），后台管理员通过 `admin_credentials` 关联到该用户，账户状态 `active` / `disabled` / `closed`。
- **Operator**: Operations 域的操作员，通过 `auth_subject_id`（用户公开 UUID）与认证主体映射；状态 `active` / `disabled`；角色与权限由 Operations RBAC 管理。
- **Session**: 服务端可撤销会话实例（复用 Identity 域 `sessions`），维护刷新令牌单向哈希、会话到期时间（默认 30 天滑动）、状态与撤销原因。
- **AuditLog**: 后台操作审计记录，记录操作员、动作键、目标对象、请求 ID、来源 IP 与详情。

---

## State Machines *(required for lifecycle/async/money/permission/publish/irreversible semantics)*

### State Machine: AdminSession

- **States**: `active`, `revoked`, `expired`
- **Initial**: `active`
- **Terminal**: `revoked`, `expired`
- **Owning FR**: FR-006, FR-007, FR-012
- **Transitions**:

| From | To | Guard | Event |
| --- | --- | --- | --- |
| `active` | `active` | 提交正确的旧刷新令牌且会话未过期未撤销且账户状态正常 | 成功执行刷新与轮换（更新令牌哈希并延长 30 天） |
| `active` | `revoked` | 管理员主动退出当前会话 OR 账户被停用/关闭 | 触发 Logout 或账户状态变更 |
| `active` | `expired` | 当前时间超过会话 `expires_at` 且未在有效期内续签 | 会话自然过期 |

---

### State Machine: UserAccountStatus

- **States**: `active`, `disabled`, `closed`
- **Initial**: `active`
- **Terminal**: `closed`
- **Owning FR**: FR-005
- **Transitions**:

| From | To | Guard | Event |
| --- | --- | --- | --- |
| `active` | `disabled` | 合规或风控操作（Operations 管理动作） | 运营禁用账号 |
| `active` | `closed` | 合规或终态操作 | 运营关闭账号 |
| `disabled` | `active` | 合规重新启用且重新确认身份主体可用 | 运营启用账号 |

---

## Contract References *(required when the spec depends on existing code/schema/API/contract)*

### Contract: Admin Credentials Frozen Schema
- **Path**: `database/migrations/1260_admin_credentials.sql`
- **Kind**: migration
- **Symbol**: `identity.admin_credentials`（`user_id` UNIQUE、`username` UNIQUE、`password_hash`）
- **Notes**: 物理数据库事实。后台密码以 scrypt 哈希存储，用户名不可空白且唯一；`user_id` 唯一关联 Identity `users`。

### Contract: Identity Frozen Auth Runtime Schema
- **Path**: `database/migrations/1220_identity_auth_runtime.sql`
- **Kind**: migration
- **Symbol**: `identity.sessions`（刷新令牌哈希、过期时间、撤销状态）
- **Notes**: 管理员会话复用 Identity 会话表，刷新令牌仅存单向哈希、唯一约束、撤销状态与原因非空约束。

### Contract: Identity Admin Authentication Use Case
- **Path**: `apps/backend/src/modules/identity/application/use-cases/admin-authentication.ts`
- **Kind**: markdown（源码现实）
- **Symbol**: `AdminAuthenticationService.login`、`hashAdminPassword`、`verifyAdminPassword`、`ensureDefaultAdmin`
- **Notes**: 冻结后台登录事务边界（凭据校验、账户状态、会话创建、最后活跃更新）、scrypt 哈希格式 `scrypt$salt$derived`、以及默认管理员幂等引导。现有代码即工程现实。

### Contract: Identity HTTP Admin Login Route
- **Path**: `apps/backend/src/modules/identity/http/routes.ts`
- **Kind**: markdown（源码现实）
- **Symbol**: `POST /api/v1/admin/auth/login`（`username`、`password` 请求体；`user_id`、`access_token`、`token_type`、`expires_in`、`refresh_token`、`session_expires_at` 响应）
- **Notes**: 冻结后台登录 HTTP 契约；非 `adminAuth` 注入时该路由不存在（可选能力装配）。现有代码即工程现实。

### Contract: Operations RBAC Frozen Model
- **Path**: `docs/docs/developer/reference/domains/operations/rbac.md`
- **Kind**: markdown
- **Symbol**: Operator 生命周期、Role、Permission Grammar、`super_admin`、Last-admin 不变量、Authorization Algorithm
- **Notes**: 冻结后台授权模型：`self registration = NO`、`status = active | disabled`、Permission `<domain>.<resource>.<action>` 三段式、前端 UI 安全交互规范（含 403 实时恢复）。本规格引用而非复制该模型。

### Contract: Operations HTTP Routes
- **Path**: `apps/backend/src/modules/operations/http/routes.ts`
- **Kind**: markdown（源码现实）
- **Symbol**: `GET /api/v1/admin/operations/me`、`GET /api/v1/admin/operations/operators`、`GET /api/v1/admin/operations/roles`、`GET /api/v1/admin/operations/audit-logs`
- **Notes**: 冻结后台受保护端点清单与 `requireAuthentication` + `requirePermission` 的强制执行模式；`/me` 返回操作员身份、角色与权限池。

### Contract: Operations Permission Catalog
- **Path**: `apps/backend/src/modules/operations/public/permissions.ts`
- **Kind**: markdown（源码现实）
- **Symbol**: `OPERATOR_PERMISSION_CATALOG`（`operations.*` 与 `platform.*` 全量权限键）
- **Notes**: 冻结权限目录事实源：Permission 由代码静态定义，数据库不能创建代码不存在的 Permission；`super_admin` 必须显式拥有完整目录。

### Contract: Admin Frontend Auth Scaffold
- **Path**: `apps/admin/src/auth/*`（`AuthContext.tsx`、`guards/AuthGuard.tsx`、`api.ts`、`session-store.ts`、`token-store.ts`、`types.ts`、`permissions.ts`）
- **Kind**: markdown（源码现实）
- **Symbol**: `AuthProvider.login`、`AuthGuard`、`readAdminSession`/`writeAdminSession`/`clearAdminSession`、`loginAdmin`/`getCurrentOperator`/`logoutAdmin`
- **Notes**: 冻结前端认证脚手架现状：本地会话持久化、`/api/v1/admin/auth/login` 登录、`/api/v1/admin/operations/me` 身份加载、`setUnauthorizedHandler` 401 处理。本规格将补齐其缺失的刷新、密码变更与审计能力。

### Contract: Admin Login Page
- **Path**: `apps/admin/src/pages/login.tsx`
- **Kind**: markdown（源码现实）
- **Symbol**: `LoginPage`（账号/密码表单、默认超管提示 `admin / 123456`、登录后跳转）
- **Notes**: 冻结登录页现状。`admin / 123456` 为默认引导凭据提示，仅适用于首次引导；安全加固需求要求强制变更与提示策略。

---

## Traceability

| Requirement | Use Case | Contract | Acceptance Scenario | State Machine |
| --- | --- | --- | --- | --- |
| FR-001 | US-001 | 1260_admin_credentials.sql | US-001 AS-01 | — |
| FR-002 | US-001 | admin-authentication.ts, routes.ts | US-001 AS-01 | — |
| FR-003 | US-001 | 1260_admin_credentials.sql, admin-authentication.ts | US-001 AS-01 | — |
| FR-004 | US-001 | admin-authentication.ts, routes.ts | US-001 AS-02 | — |
| FR-005 | US-001, US-002 | admin-authentication.ts, 0100_identity.sql | US-001 AS-03, US-002 AS-03 | UserAccountStatus |
| FR-006 | US-001 | admin-authentication.ts, routes.ts, 1220_identity_auth_runtime.sql | US-001 AS-01 | AdminSession |
| FR-007 | US-002 | IDENTITY_USE_CASES.md (RefreshSession), admin-authentication.ts | US-002 AS-01, AS-02 | AdminSession |
| FR-008 | US-001, US-002 | 1260_admin_credentials.sql, 1220_identity_auth_runtime.sql | US-001 AS-01 | — |
| FR-009 | US-003 | admin-authentication.ts (ensureDefaultAdmin) | US-003 AS-01, AS-03 | — |
| FR-010 | US-003 | admin-authentication.ts (ensureDefaultAdmin) | US-003 AS-02 | — |
| FR-011 | US-004 | operations/audit.md | US-004 AS-01, AS-02, AS-03 | — |
| FR-012 | US-005 | IDENTITY_USE_CASES.md (Logout), admin-authentication.ts | US-005 AS-01, AS-02 | AdminSession |
| FR-013 | US-001, US-002 | routes.ts (requireAuthentication), OPERATIONS_API.md | US-001 AS-04 | — |
| FR-014 | US-001, US-002 | rbac.md, operations/routes.ts | US-001 AS-04 | — |
| FR-015 | US-001, US-005 | operations/audit.md, operations/routes.ts | US-001 AS-01, US-005 AS-01 | — |
| FR-016 | US-001 | operations/routes.ts (`/me`), auth/api.ts | US-001 AS-04 | — |
| FR-017 | US-001 | admin-authentication.ts, routes.ts | US-001 AS-02 | — |

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 正常网络环境下，管理员从提交账号密码到进入后台首页的完整登录流程耗时中位数低于 3 秒。
- **SC-002**: 后台登录错误提示防枚举达到 100% 一致性：对不存在的用户名与错误密码，响应结构与状态码完全一致，无法据此推断账号存在性。
- **SC-003**: 会话安全轮换达到 100% 覆盖：所有通过刷新令牌获取新访问令牌的请求必须实现单次使用强制轮换，旧刷新令牌重放拦截率达到 100%。
- **SC-004**: 默认管理员引导幂等性达到 100%：在已有运营人员记录或已存在默认凭据的情况下重复启动，不产生重复账号或副作用。
- **SC-005**: 敏感凭据零泄漏：数据库持久化列、日志系统与事件总线中 Raw 密码与 Raw 刷新令牌泄漏率为 0%。
- **SC-006**: 审计覆盖率达到 100%：后台安全敏感操作的全部成功动作（登录成功、刷新轮换、退出、密码变更）均产生可追溯的审计记录；失败事件按 `audit.md` 成功语义进入安全日志，不伪造成功 Audit。
- **SC-007**: 权限强制一致率 100%：前端权限守卫与后端 RBAC 授权结果一致；前端收到 `403 FORBIDDEN` 时能实时刷新 `/me` 权限池，界面状态不滞后。

---

## Assumptions

- **访问令牌机制**: 假定后台复用 Identity 域的短期无状态 Access Token（15 分钟）与 30 天滑动可撤销 Refresh Token 语义，与移动端会话模型一致。
- **刷新令牌客户端存储**: 假定 Admin 前端运行于浏览器环境，具备安全的本地存储能力用于保管刷新令牌；会话持久化到 `localStorage`（现状如此，非安全增强目标）。
- **默认凭据安全**: 假定 `admin / 123456` 仅用于首次引导；正式使用前应变更密码或由安全策略强制轮换。默认凭据提示存在于登录页现状，属于引导期体验。
- **登录频控**: 假定后台登录频控目标为防暴力破解，同时不显著影响正常管理员使用；阈值冻结于 `contracts/http-api.md` §6（同一 username 连续失败 ≥5 次、同一 IP ≥20 次，冷却窗口默认 5 分钟），本规格约束行为与目标并引用阈值。
- **Operations 映射**: 假定后台授权模型完全遵从 Operations RBAC（`active Operator` → active Roles → Permission UNION），本规格不重新定义 RBAC。
- **范围边界**: 本功能聚焦后台登录、会话、引导、密码变更与退出；多因素认证（MFA）、IP 白名单、企业 SSO 不在 v1 范围。
