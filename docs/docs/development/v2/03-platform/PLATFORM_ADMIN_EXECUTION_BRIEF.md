---
status: ready
phase: 3A
phase_name: Platform Admin Integration
artifact: execution_brief
entry_gate: PLATFORM_GATE = PASS
last_updated: 2026-08-31
---

# ZH-LAO V2 — Platform Admin Execution Brief

> 本文件是 Platform Admin 集成执行会话的入口文档。执行 AI 必须先使用 GitHub 连接器读取远程 `main` 的真实代码、API 和 Gate 状态，再开始工作。
>
> Platform 后端产品语义、Use Cases、Config Contract、HTTP Contract 已冻结；Admin 不得重新定义 Platform 业务规则。

## 1. Mission

在已完成的 Admin Foundation 上实现 Platform 管理后台：

```text
Repository Audit
→ Read Platform Frozen Contracts
→ Read Current Operations Status
→ Platform Admin IA
→ API / Query / Mutation Layer
→ Feature Flags
→ Runtime Configs
→ App Versions
→ Announcements
→ Regions
→ RBAC Integration when available
→ Tests / E2E / Audit
→ PLATFORM_ADMIN_GATE
→ STOP
```

本任务不重做 Platform Backend，也不负责 Operations Backend。

## 2. Mandatory GitHub Entry Audit

连接：

```text
repository = rzyao/ZH-LAO
branch = main
```

至少读取：

```text
latest HEAD
DEVELOPMENT_PROGRESS.md
ADMIN_FOUNDATION_PLAN.md
ADMIN_FOUNDATION_REPORT.md
03-platform/PLATFORM_API.md
03-platform/PLATFORM_USE_CASES.md
03-platform/PLATFORM_CONFIG_CONTRACTS.md
03-platform/PLATFORM_IMPLEMENTATION_REPORT.md
04-operations/OPERATIONS_API.md
04-operations/OPERATIONS_RBAC_CONTRACTS.md
04-operations/OPERATIONS_IMPLEMENTATION_REPORT.md if present
apps/admin current source
apps/backend current admin/platform routes
current CI workflows
```

确认：

```text
ADMIN_FOUNDATION_GATE = PASS
PLATFORM_GATE = PASS
PLATFORM_DOMAIN = FROZEN
```

同时判定：

```text
OPERATIONS_GATE = ?
Platform management HTTP available = YES / NO
Operations auth/RBAC available = YES / NO
```

以执行时 `main` 为准，不要依赖本文写入时的仓库状态。

## 3. Two-Stage Gate

Platform Admin 可以与 Operations Implementation 并行，但正式授权集成必须等待真实 Operations 能力。

### Stage A — UI / Contract

入口：

```text
Platform = FROZEN
Admin Foundation = PASS
```

允许完成：

```text
Platform Admin routes/pages
API contract types
query/mutation hooks
forms
tables
filters
loading/empty/error states
confirmation flows
unit/component tests
API contract tests
```

所有请求按 frozen `/api/v1/admin/platform/*` contract 编写。

如果 management backend 尚未可用：

```text
Live management E2E = WAITING_FOR_OPERATIONS
PLATFORM_ADMIN_GATE = NOT_READY
```

不得通过临时绕过正式授权边界的方式伪造最终 PASS。

### Stage B — Full Integration

只有执行时满足：

```text
OPERATIONS_GATE = PASS
Operations operator authorization = available
Platform management HTTP = available
```

才能完成：

```text
real operator auth context integration
permission-aware navigation
permission-aware page/action guards
401/403 behavior
real management API E2E
operator audit verification
PLATFORM_ADMIN_GATE = PASS
```

如果 Operations 尚未 PASS，完成 Stage A 后 STOP，并明确记录依赖。

## 4. Frontend Authority

复用现有 Admin Foundation：

```text
React
TypeScript
Vite
TanStack Router
TanStack Query
TanStack Table
React Hook Form
Zod
Tailwind
shadcn/ui / Base UI
ApiClient
AuthProvider / AuthGuard / PermissionGuard / can()
DataTable
Form / Feedback / AppShell
```

不得另建第二套 router、query client、API wrapper、auth/permission framework、form framework 或 design system。

组件禁止直接 `fetch()`；统一使用 Admin `apiClient`。

## 5. Frozen Platform Management Contract

权威：

```text
docs/docs/development/v2/03-platform/PLATFORM_API.md
```

覆盖：

```text
Feature Flags + Overrides
Runtime Configs
App Versions
Announcements
Regions
```

不要根据数据库表自行生成 CRUD。

如果 UI 需要的能力 frozen API 不提供：

```text
BACKEND_CONTRACT_GAP
```

记录后停止该功能路径，不猜 endpoint。

## 6. Information Architecture

复用现有 `System → Platform` 导航入口，替换 Platform placeholder。

建议模块路由：

```text
/platform
/platform/feature-flags
/platform/runtime-configs
/platform/app-versions
/platform/announcements
/platform/regions
```

实际实现遵循当前 TanStack Router conventions。

Platform landing page 不得展示没有真实数据源的 KPI。

## 7. Permission Requirements

执行时从当前 Platform/Operations canonical docs 重新读取 exact keys。

当前设计要求包括：

```text
platform.feature_flags.read
platform.feature_flags.write
platform.runtime_configs.read
platform.runtime_configs.write
platform.app_versions.read
platform.app_versions.write
platform.announcements.read
platform.announcements.write
platform.regions.read
platform.regions.write
```

Frontend guard 只负责 UX；Backend authorization 仍是安全边界。

规则：

```text
no read => no page access
read only => read-only UI
write => mutation UI allowed, backend still enforces exact permission
```

不得自行增加 wildcard 或隐式 bypass。

## 8. Feature Flags

支持 frozen lifecycle：

```text
list / detail
create
update mutable fields
active <-> inactive
retire explicit command
override set/remove
```

UX 必须体现：

```text
key immutable
retired terminal
default state 与 override 分开展示
override scope only region_code/client_platform
global override unsupported
important lifecycle actions require confirmation
```

不要增加 user targeting、percentage rollout、A/B bucket 等 schema/API 未支持能力。

## 9. Runtime Configs

必须遵守 frozen typed registry contract：

```text
registered keys only
value_type validation
existing value_type immutable
expected_updated_at conflict protection
retired terminal
visibility contract respected
```

`409 PLATFORM_CONFLICT` 必须有明确 stale-data UX：提示、重新获取、重新确认；不得静默覆盖。

不要把页面做成任意 key / 任意 JSON 的通用配置编辑器。

## 10. App Versions

版本策略按 numeric `build_number`，不要用字符串版本比较替代 backend semantics。

支持 frozen actions：

```text
list/filter platform
create draft
edit mutable fields
publish
change policy/status
delete only contract-allowed draft/never-released row
```

展示至少包括：

```text
client platform
version label
build number
status
update policy
release state/time
release notes
```

不得发明 region rollout、release channel、store URL management、scheduled publish。

## 11. Announcements

支持：

```text
list/detail
create draft
edit allowed fields
publish
retire
delete draft only
```

字段只能来自 frozen API：

```text
title
content
region_code
client_platform
starts_at
ends_at
```

不要新增 locale/language/priority/push/email/SMS/chat broadcast 语义。

时间统一复用 Admin ISO/timezone contracts。

## 12. Regions

支持：

```text
list/detail
create
update mutable fields
active <-> inactive
retire
```

展示：

```text
code
name
default_locale
timezone
status
```

`code` immutable；retired terminal；不提供已使用 Region 的物理删除。

不要把 Identity profile/location 业务搬入 Platform Admin。

## 13. Frontend Domain Boundary

按当前 Admin 风格建立清晰 Platform feature boundary，例如：

```text
apps/admin/src/features/platform/
  api/
  queries/
  components/
  pages/
  schemas/
  types/
```

实际目录按现有 conventions 调整，不重构整个 Admin。

要求：

```text
single apiClient
TanStack Query server state
explicit mutation invalidation
typed request/response
Zod on input boundaries
Foundation ApiError mapping
no internal BIGINT
```

Stable identifiers：

```text
feature flag = key
runtime config = key
app version = client_platform + build_number
announcement = public UUID
region = code
```

## 14. UX States

每个主页面至少覆盖：

```text
loading
empty
error + retry
forbidden
not found where relevant
conflict where relevant
mutation pending
success feedback
failure feedback
```

写操作必须避免重复提交。

## 15. Testing

### Unit / Component

至少：

```text
API/schema mapping
permission guards
list rendering
empty/error/loading
form validation
retired/read-only states
conflict handling
confirm lifecycle actions
query invalidation
```

### Router / Page

```text
Platform placeholder replaced
routes render
breadcrumbs
read-only mode
unauthorized mode
```

### Live E2E

仅 Stage B backend 可用时 mandatory：

```text
operator auth context
representative Feature Flag management flow
Runtime Config update/conflict flow
representative App Version management flow
representative Announcement flow
representative Region flow
permission denied flow
operator audit evidence
```

测试数据必须隔离，不污染真实 canonical 数据。

Stage A 不得宣称 Live E2E 已 PASS。

## 16. Security / Scope Audit

确认：

```text
direct fetch outside apiClient = 0
internal BIGINT exposure = 0
sensitive config leakage = 0
permission string mismatch = 0
unprotected write integration introduced = 0
generic arbitrary config editor = 0
```

不要修改 Platform frozen migration。

## 17. Regression

运行当前适用：

```text
Admin typecheck
Admin lint
Admin unit/component
Admin build
Admin Playwright
Platform backend regression
Operations regression if Stage B
Docs build
CI validation
```

以当前 scripts/CI 为准。

## 18. Documentation / Gate

最终新增：

```text
docs/docs/development/v2/03-platform/PLATFORM_ADMIN_IMPLEMENTATION_REPORT.md
```

更新 `DEVELOPMENT_PROGRESS.md`。

Platform Backend Gate 与 Admin Gate 分开记录：

```text
PLATFORM_GATE = PASS               # existing backend gate
PLATFORM_ADMIN_UI = COMPLETE/PARTIAL
PLATFORM_ADMIN_GATE = PASS/WAITING_FOR_OPERATIONS/FAIL
```

只有 Stage B 全集成通过才可 `PLATFORM_ADMIN_GATE = PASS`。

## 19. Out of Scope

本任务不要：

```text
implement Operations backend
redesign Platform backend
modify Platform database
start Content Domain
implement other Admin domains
replace Admin Foundation
```

完成当前可执行 Gate 后 STOP。

## 20. Final Response

```text
PLATFORM ADMIN RESULT

Repository HEAD = ...
Admin Foundation = PASS/FAIL
Platform Backend = PASS/FAIL/FROZEN
Operations Gate = PASS/NOT_READY

Stage A UI/Contract = PASS/FAIL
Stage B RBAC/Live Integration = PASS/WAITING/FAIL

Feature Flags = PASS/FAIL
Runtime Configs = PASS/FAIL
App Versions = PASS/FAIL
Announcements = PASS/FAIL
Regions = PASS/FAIL

Permission Guards = PASS/FAIL/WAITING
Live Management API = PASS/FAIL/WAITING
Operator Audit Verification = PASS/FAIL/WAITING

Admin typecheck =
Admin lint =
Admin unit/component =
Admin build =
Admin Playwright =

Platform Regression = PASS/FAIL
Operations Regression = PASS/FAIL/WAITING
Docs = PASS/FAIL

BLOCKER = ?
HIGH = ?
MEDIUM = ?
LOW = ?

PLATFORM_ADMIN_IMPLEMENTATION = COMPLETE/PARTIAL/BLOCKED
PLATFORM_ADMIN_GATE = PASS/WAITING_FOR_OPERATIONS/FAIL
```

列出修改文件、页面、测试、报告路径和 remaining dependency。

**STOP。**
