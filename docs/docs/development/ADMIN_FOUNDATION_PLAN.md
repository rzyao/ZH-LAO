---
status: superseded
last_updated: 2026-09-02
lifecycle: historical
---

# ZH-LAO  — Admin Foundation Plan

**文件名：`ADMIN_FOUNDATION_PLAN.md`**  
**Phase：PHASE 1A — Admin Foundation**  
**状态：PLANNING**  
**上级计划：`MASTER_DEVELOPMENT_PLAN.md`**

---

# 1. 目标

本阶段用于建立 ZH-LAO  Admin 的统一前端基础设施。

目标是：

> 在不实现任何具体 Domain 业务功能的前提下，完成 Admin 工程骨架、Design System、AppShell、Router、Server State、API Client、通用表格、表单、错误处理、权限骨架和测试基础设施。

本阶段完成后，后续 Identity、Content、Audio、Commerce、Trust 等 Domain 可以直接在统一 Admin Foundation 上开发。

---

# 2. 当前前提

当前已经完成：

```text
PostgreSQL  Baseline        PASS
Application Foundation       PASS
Backend Foundation           PASS
```

Admin 尚未正式建立。

Master Development Plan 已冻结：

```text
Admin    → 全新实现
Mobile   → 暂不纳入本阶段
```

Admin 技术和设计体系已经确定。

---

# 3. 技术栈

固定采用：

```text
React 19
TypeScript
Vite 8

TanStack Router
TanStack Query
TanStack Table

shadcn/ui
Base UI
Tailwind CSS v4

React Hook Form
Zod

Lucide

Vitest
Testing Library
Playwright
```

未经 Master Plan Revision 不得更换核心技术栈。

---

# 4. UI 风格

正式采用：

# Rhea-inspired Compact Admin

关键词：

```text
Clean
Compact
Professional
Data-dense
Low-decoration
Strong hierarchy
Desktop-first
Workflow-first
```

中文：

> 简洁、现代、专业、高信息密度、弱装饰、强层级、桌面优先、工作流优先。

---

# 5. Scope

本阶段允许完成：

```text
Admin Project Skeleton
TypeScript / Vite
Tailwind
shadcn/ui
Base UI
Theme
Design Tokens
Router
TanStack Query
API Client Foundation
AppShell
Sidebar
Header
Breadcrumb
PageHeader
DataTable Foundation
FilterBar
Pagination
Form Foundation
StatusBadge
Dialog / Sheet
Loading State
Empty State
Error State
Error Boundary
Toast
PermissionGuard Skeleton
Auth Context Skeleton
UUID Contract
Time Contract
Pagination Contract
Testing Foundation
Playwright Smoke
Build / Lint / Typecheck
```

---

# 6. Non-Scope

本阶段禁止实现具体业务功能。

禁止：

```text
Identity User Management
OTP Management
Session Management

Content CRUD
Course Management
Dictionary Management

Learning Progress Management

Audio Production Workbench

Social Management
Chat Management

Commerce Orders
Wallet Management

Rewards Management

Moderation Cases

Operator Management

Feature Flag Management
```

允许创建导航入口。

不允许创建真实业务页面。

---

# 7. 推荐目录

建议建立：

```text
apps/admin/
├── src/
│   ├── app/
│   │   ├── providers/
│   │   ├── router/
│   │   ├── layout/
│   │   └── config/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── common/
│   │   ├── data-table/
│   │   ├── form/
│   │   ├── feedback/
│   │   └── navigation/
│   │
│   ├── api/
│   │   ├── client/
│   │   ├── errors/
│   │   ├── query/
│   │   └── contracts/
│   │
│   ├── auth/
│   │   ├── context/
│   │   ├── guards/
│   │   └── types/
│   │
│   ├── design-system/
│   │   ├── tokens/
│   │   └── theme/
│   │
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   │   ├── overview/
│   │   └── system/
│   ├── test/
│   ├── main.tsx
│   └── routes.ts
│
├── e2e/
├── public/
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

实际目录可以根据 monorepo 规范微调。

但职责边界必须保留。

---

# 8. Admin 导航架构

Sidebar 使用最终 Domain 信息架构。

建议：

```text
Overview

Learning Content
├── Content
├── Learning
└── Audio Production

Users & Community
├── Identity
├── Social
└── Chat

Business
├── Commerce
└── Rewards

Safety
└── Trust & Safety

System
├── Operations
└── Platform
```

本阶段这些入口：

只能使用：

```text
Disabled
Coming Soon
Placeholder
```

不得实现真实业务。

---

# 9. 页面基础布局

统一 AppShell：

```text
┌─────────────────────────────────────────────────┐
│ Sidebar │ Header / Breadcrumb / Global Actions  │
│         ├───────────────────────────────────────│
│         │ Page Header                           │
│         ├───────────────────────────────────────│
│         │ Toolbar / Filters / Tabs              │
│         ├───────────────────────────────────────│
│         │                                       │
│         │ Main Content                          │
│         │                                       │
└─────────────────────────────────────────────────┘
```

必须支持：

```text
Sidebar expand/collapse
Active route
Breadcrumb
Page title
Primary actions
Content scroll
Desktop responsive behavior
```

---

# 10. 页面 Pattern

Foundation 阶段必须建立以下 Pattern。

## 10.1 List Page

```text
PageHeader
Search
FilterBar
Table
Pagination
```

---

## 10.2 Detail Page

```text
Breadcrumb
PageHeader
Status
Actions
Tabs
Detail Sections
```

---

## 10.3 Edit Page

```text
PageHeader
Form Sections
Validation
Sticky Actions
Save / Cancel
```

---

## 10.4 Workbench Layout

为以后：

```text
Audio
Trust
Operations
```

等复杂工作流提供基础三栏/双栏布局。

只建立 Layout Component。

不得实现具体 Workbench。

---

# 11. Theme / Design Token

必须集中定义：

```text
background
surface
foreground
muted
border
primary
secondary
destructive
success
warning
info
radius
spacing
font
shadow
```

禁止业务页面自行定义大量随机颜色。

---

# 12. 状态颜色

统一：

```text
green   success / active / published
yellow  warning / pending
red     failed / blocked / destructive
blue    processing / info
gray    inactive / archived
```

封装统一：

```text
<StatusBadge />
```

---

# 13. Dark Mode

Foundation 建立：

```text
Light
Dark
System
```

Theme capability。

但：

> Light Mode 作为本阶段主要视觉验收标准。

Dark Mode 只需保证：

```text
无明显不可读
基础组件正常
```

不要求逐页面精调。

---

# 14. Router Foundation

使用：

```text
TanStack Router
```

必须建立：

```text
Root Route
App Layout
Not Found
Error Route
Overview
Placeholder Domain Routes
```

---

# 15. URL State Rule

列表重要状态必须可以通过 URL 保存，例如：

```text
?page=
?cursor=
?status=
?q=
?sort=
```

Foundation 需要提供 search param 示例和约定。

但不实现真实 Domain filter。

---

# 16. TanStack Query Foundation

建立统一：

```text
QueryClient
QueryClientProvider
Default stale strategy
Default retry strategy
Error handling
Mutation handling
Invalidation helper
```

不得在组件中到处直接初始化 QueryClient。

---

# 17. API Client

必须建立统一  API Client。

至少统一处理：

```text
base URL
JSON
authorization header hook
request id
timeout
abort signal
HTTP error mapping
network error
response parsing
```

---

# 18. API Client 禁止事项

不得：

```text
每个 Domain 自己 new fetch wrapper
组件直接 fetch()
页面直接拼 Authorization header
页面自己 parse server error
```

---

# 19. API Error Contract

Foundation 冻结统一错误结构。

建议：

```text
code
message
details
requestId
```

前端统一转换成：

```text
ApiError
```

---

# 20. Error 类型

至少区分：

```text
NetworkError
UnauthorizedError
ForbiddenError
NotFoundError
ValidationError
ConflictError
RateLimitError
ServerError
UnknownError
```

具体 Domain Error Code 后续由 Domain 自己定义。

---

# 21. UUID Contract

前端所有 public/logical ID：

统一表示为：

```text
string
```

但语义上必须是 UUID。

客户端不得感知：

```text
internal BIGINT
database PK
```

必要时可使用 branded type。

例如：

```text
UserId
ContentId
OperatorId
AssetId
```

但 Foundation 不提前定义所有 Domain ID。

---

# 22. Time Contract

API 时间统一：

```text
ISO 8601
timezone included
```

UI 显示统一走 time formatter。

禁止：

```text
new Date(...).toLocaleString()
```

散落在业务组件。

建立：

```text
formatDate
formatDateTime
formatRelativeTime
```

基础工具。

---

# 23. Pagination Contract

Foundation 必须明确两种支持模式：

```text
Cursor Pagination
Offset/Page Pagination
```

默认优先：

```text
cursor
```

用于：

```text
Chat
Feed
Audit
Ledger
Large lists
```

普通管理列表可根据 API 使用 offset/page。

统一 Pagination Component 不直接假设具体后端形式。

---

# 24. DataTable Foundation

建立通用：

```text
<DataTable />
```

基于 TanStack Table。

必须至少支持：

```text
columns
sorting
loading
empty
error
row actions
selection
column visibility
pagination integration
```

---

# 25. DataTable 第二层组件

建议同时建立：

```text
DataTableToolbar
DataTablePagination
DataTableColumnHeader
DataTableViewOptions
DataTableRowActions
```

但保持最小。

不要一开始造超级 DataGrid Framework。

---

# 26. FilterBar

建立统一：

```text
<FilterBar />
```

用于：

```text
Search
Select Filter
Date Filter
Status Filter
Reset
```

不内置 Domain 业务。

---

# 27. Form Foundation

使用：

```text
React Hook Form
+
Zod
```

建立：

```text
FormField
FormItem
FormLabel
FormDescription
FormMessage
FormSection
```

---

# 28. Form Validation

客户端 Validation：

用于：

```text
UX
basic validation
immediate feedback
```

服务器仍是最终业务规则权威。

不得依赖前端 Validation 代替 Backend Validation。

---

# 29. Form Save Pattern

统一处理：

```text
idle
dirty
submitting
success
error
```

防止重复提交。

后续业务 Form 统一复用。

---

# 30. Loading State

建立：

```text
PageLoading
TableLoading
InlineLoading
ButtonLoading
Skeleton
```

不要每个页面自己定义 Loading。

---

# 31. Empty State

统一：

```text
EmptyState
```

支持：

```text
title
description
icon
primary action
secondary action
```

---

# 32. Error State

统一：

```text
ErrorState
```

至少支持：

```text
retry
request ID
generic message
```

不得直接把 Backend stack trace 显示给用户。

---

# 33. Error Boundary

建立全局和页面级：

```text
ErrorBoundary
```

避免一个页面错误导致整个 Admin 白屏。

---

# 34. Toast / Notification

建立统一 notification system。

用于：

```text
Save success
Mutation success
Recoverable error
Warning
```

不要用 Toast 展示所有服务器错误。

复杂错误使用页面/表单错误状态。

---

# 35. Dialog / Sheet

Foundation 建立：

```text
ConfirmDialog
AlertDialog
Drawer / Sheet
```

供以后：

```text
Delete
Archive
Review
Quick edit
Inspector
```

使用。

---

# 36. PermissionGuard

建立：

```text
<PermissionGuard />
```

以及基础：

```text
can(permission)
```

接口。

但本阶段不实现真实 RBAC 数据。

---

# 37. Auth Foundation

只建立：

```text
AuthProvider
AuthState
CurrentOperator placeholder
AuthGuard
Login route placeholder
Unauthorized route
```

真正：

```text
Operator Login
Session
Permission Fetch
```

由 Identity / Operations Phase 完成。

---

# 38. 权限命名规则

客户端遵循 Operations 已冻结的：

```text
<domain>.<resource>.<action>
```

例如未来：

```text
content.course.read
content.course.update
audio.task.review
trust.case.decide
```

本阶段只建立类型与解析能力。

---

# 39. Logging

Admin Foundation 可以建立前端轻量 logger。

至少区分：

```text
development
production
```

禁止记录：

```text
password
OTP
token
Authorization header
secret
payment credential
```

---

# 40. Request ID

API Client 应支持：

```text
request ID
```

服务器返回 request/trace ID 时：

错误界面应能够显示。

便于以后排障。

---

# 41. Health / Backend Availability

Admin 可以提供基础 Backend Availability 状态。

例如启动或必要时调用：

```text
health
readiness
```

但不要持续高频 polling。

---

# 42. Environment

建立：

```text
.env.example
```

至少支持：

```text
API Base URL
App Environment
Optional Feature Toggles
```

禁止把 Secret 写入 Admin frontend environment。

前端环境变量全部视为公开信息。

---

# 43. Config

应用 Config 应集中解析。

例如：

```text
src/app/config/
```

应用启动时验证。

错误配置应尽早失败。

---

# 44. Testing Foundation

必须建立：

```text
Vitest
Testing Library
Playwright
```

---

# 45. Unit / Component Tests

Foundation 至少测试：

```text
StatusBadge
ErrorState
EmptyState
Form validation
PermissionGuard
DataTable basic rendering
Theme
```

不追求大量测试数量。

重点建立正确模式。

---

# 46. Router Tests

至少测试：

```text
App root
404
placeholder Domain route
route error
```

---

# 47. API Client Tests

至少测试：

```text
success
401
403
404
422
429
500
network failure
timeout
```

---

# 48. Playwright Smoke Test

至少建立：

```text
Admin opens
AppShell visible
Sidebar visible
Overview visible
Navigation works
404 works
Theme switch works
```

---

# 49. Build Validation

必须存在统一命令，例如：

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm e2e
```

实际 package manager 根据项目确定。

---

# 50. Foundation Demo Page

允许建立一个：

```text
/system/design-system
```

或者 development-only：

```text
/dev/components
```

页面。

用于验证：

```text
Button
Input
Form
Table
Dialog
Badge
Toast
Loading
Empty
Error
```

但 Production 是否保留由后续决定。

---

# 51. Overview Page

本阶段可以创建非常简单的 Admin Overview Shell。

只能显示：

```text
ZH-LAO Admin
Environment
Backend health
Placeholder navigation
```

不要创建假的业务 KPI。

---

# 52. Domain Placeholder

Domain 页面只允许：

```text
Identity
Coming Soon
```

类似 Placeholder。

禁止：

```text
mock user table
mock order table
fake moderation cases
```

以免后续错误地把假 Contract 当真实实现。

---

# 53. Accessibility

Foundation 通用组件至少满足：

```text
Keyboard navigation
Visible focus
Proper labels
Dialog focus trap
Form error association
Semantic button
ARIA where required
```

---

# 54. Responsive

Admin：

```text
Desktop-first
```

重点验证：

```text
1440px
1280px
1024px
```

普通页面应在更小宽度可基本使用。

复杂 Workbench 不要求 Mobile Admin 支持。

---

# 55. Performance 基础

Foundation 阶段避免：

```text
巨大初始 bundle
所有 Domain eager import
所有图标一次打包
```

Router 应支持合理 route lazy loading。

但本阶段不做过度微优化。

---

# 56. Security 基础

至少确保：

```text
不持久化敏感 token 到不安全位置
不在日志输出 token
不使用 dangerouslySetInnerHTML 展示不可信内容
外部 URL 使用安全打开方式
错误信息不泄漏 backend stack
```

具体认证安全在 Identity / Operations 阶段继续完善。

---

# 57. Dependency Rule

Foundation 引入新依赖必须满足：

```text
有明确用途
主流维护
不是已有库可以解决的问题
```

禁止为了一个小功能增加重型框架。

---

# 58. Common Component Rule

只有满足以下条件才进入：

```text
components/common
```

至少：

```text
两个以上 Domain 可合理复用
无 Domain business semantics
```

否则留在未来具体 Domain 内。

---

# 59. 不建立 Common Business Layer

禁止出现：

```text
common/business
common/domain
common/service
```

然后把多个 Domain 业务逻辑塞进去。

Common 只保存技术基础能力。

---

# 60. File Change Scope

本阶段主要允许修改：

```text
apps/admin/**
root workspace config
shared lint config
shared TypeScript config
shared package manager config
CI config
docs/development/**
```

如需调整 Backend：

只能是 Admin Foundation 必须的通用接口。

不得修改具体 Domain 功能。

---

# 61. Admin Foundation Tasks

正式拆成以下任务。

---

## ADM-F01 — Project Skeleton

建立：

```text
apps/admin
React
TypeScript
Vite
basic scripts
```

验收：

```text
dev boots
build PASS
typecheck PASS
```

---

## ADM-F02 — Styling Foundation

建立：

```text
Tailwind CSS v4
shadcn/ui
Base UI
global CSS
tokens
```

验收：

```text
base components render
style tokens work
```

---

## ADM-F03 — Theme

建立：

```text
Light
Dark
System
ThemeProvider
Theme switch
```

验收：

```text
theme persists
no obvious broken components
```

---

## ADM-F04 — Router

建立：

```text
TanStack Router
App route
Overview
Domain placeholders
404
Route Error
```

验收：

```text
navigation PASS
URL state PASS
```

---

## ADM-F05 — Query Foundation

建立：

```text
QueryClient
Query Provider
query defaults
mutation defaults
```

---

## ADM-F06 — API Client

建立：

```text
HTTP Client
Timeout
Abort
Error Mapping
Request ID
Auth hook
```

验收：

```text
client tests PASS
```

---

## ADM-F07 — AppShell

实现：

```text
Sidebar
Header
Breadcrumb
Content Area
```

验收：

```text
desktop layout PASS
route active state PASS
```

---

## ADM-F08 — Navigation

建立 Domain Sidebar 分组。

验收：

```text
all 11 Domains represented
no fake business pages
```

---

## ADM-F09 — Page Patterns

实现：

```text
PageHeader
ListPageLayout
DetailPageLayout
EditPageLayout
WorkbenchLayout
```

---

## ADM-F10 — DataTable

建立：

```text
DataTable
Toolbar
Column Header
Pagination
Row Actions
```

验收：

```text
sorting demo
loading
empty
selection
pagination
```

全部通过。

---

## ADM-F11 — Form Foundation

建立：

```text
React Hook Form
Zod
Form components
FormSection
Submit state
```

---

## ADM-F12 — Feedback Components

建立：

```text
Loading
Skeleton
Empty
Error
Toast
ConfirmDialog
ErrorBoundary
```

---

## ADM-F13 — Auth / Permission Skeleton

建立：

```text
AuthProvider
AuthGuard
PermissionGuard
can()
```

不接真实 Identity/Operations。

---

## ADM-F14 — Contracts

冻结 Admin 全局：

```text
UUID
Time
Pagination
API Error
```

contract。

---

## ADM-F15 — Testing

建立：

```text
Vitest
Testing Library
Playwright
```

并完成 Foundation Smoke Tests。

---

## ADM-F16 — Design System Demo

建立内部 Component Showcase。

验证所有 Foundation Components。

---

## ADM-F17 — Documentation

更新：

```text
Admin README
Architecture notes
Foundation report
Development progress
```

---

## ADM-F18 — Final Audit

执行：

```text
typecheck
lint
unit tests
component tests
build
e2e
```

并进行范围审计。

---

# 62. Admin Foundation Audit

必须确认：

```text
Business Domain APIs implemented = 0
Business Domain pages implemented = 0
Mock canonical business data pages = 0
Direct database access = 0
Direct fetch in business pages = 0
```

---

# 63. Exit Gate

只有全部满足才允许：

```text
ADMIN_FOUNDATION = PASS
```

---

## Build

```text
TypeScript        PASS
Lint              PASS
Unit Tests        PASS
Build             PASS
Playwright Smoke  PASS
```

---

## Architecture

```text
React/Vite foundation          PASS
Router                         PASS
Query Client                   PASS
API Client                     PASS
AppShell                       PASS
Design Tokens                  PASS
Theme                          PASS
DataTable                      PASS
Form Foundation                PASS
Error Handling                 PASS
Auth Skeleton                  PASS
Permission Skeleton            PASS
Testing Infrastructure         PASS
```

---

## Scope

```text
Domain business implementation = 0
Domain API guessing             = 0
Fake CRUD implementation        = 0
```

---

# 64. Exit Gate 状态

最终只能：

```text
PASS
PASS_WITH_BLOCKERS
FAIL
```

只有：

```text
PASS
```

才允许认为 Admin Foundation 完成。

---

# 65. 完成报告

完成后生成：

```text
ADMIN_FOUNDATION_REPORT.md
```

必须包含：

```text
Status
Tasks completed
Architecture
Dependencies
Directory structure
Components created
Testing
Build result
Known limitations
Deferred Domain work
Changed files
Exit Gate
```

---

# 66. 下一阶段关系

Admin Foundation 完成后：

不得自动开始创建 11 个 Domain 页面。

后续客户端仍跟随 Domain Phase。

例如 Identity：

```text
Identity Use Cases
↓
Identity API
↓
Identity Backend
↓
Identity Backend Tests
↓
Identity Admin
↓
Identity E2E
↓
IDENTITY_GATE
```

---

# 67. Admin Domain 页面创建条件

具体 Domain Admin 只有同时满足：

```text
Use Case frozen
API contract frozen
Backend endpoint functional
Backend integration tests PASS
```

之后才允许实现。

---

# 68. Foundation 的长期职责

Admin Foundation 负责：

```text
Application Shell
Technical UI Infrastructure
Design System
Global Contracts
Common Technical Components
Testing Infrastructure
```

不负责：

```text
Business Rules
Domain State Machine
Domain Permission Semantics
Domain API Contract
Domain Workflow
```

---

# 69. Forbidden Changes

本阶段禁止：

1. 修改 PostgreSQL  Domain 设计。
2. 修改 Domain 顺序。
3. 提前实现具体 Admin Domain。
4. 用数据库表自动生成 CRUD 页面。
5. 建立新的全局业务 Store。
6. 创建巨型 Common Business Service。
7. 将 Domain 业务逻辑放入 AppShell/Common Components。
8. 为未来未知需求建立复杂抽象。
9. 使用 Mock 业务页面伪装 Domain 已开发。
10. 自动进入下一 Phase。

---

# 70. 最终定义

`ADMIN FOUNDATION` 完成的含义不是：

> Admin 已经具备业务功能。

而是：

> **ZH-LAO  已经拥有一套稳定、统一、可测试、可扩展的 Admin Application Platform，后续所有 Domain 后台页面都可以在不重新搭建技术基础的情况下直接进行正式开发。**

---

# 71. 当前执行顺序

正式执行顺序：

```text
ADM-F01
↓
ADM-F02
↓
ADM-F03
↓
ADM-F04
↓
ADM-F05
↓
ADM-F06
↓
ADM-F07
↓
ADM-F08
↓
ADM-F09
↓
ADM-F10
↓
ADM-F11
↓
ADM-F12
↓
ADM-F13
↓
ADM-F14
↓
ADM-F15
↓
ADM-F16
↓
ADM-F17
↓
ADM-F18
↓
ADMIN_FOUNDATION_GATE
```

任何任务如果发现问题：

只处理 Foundation 范围。

不得越界进入 Identity、Content、Audio 或其他 Domain。

---

# 72. 一句话执行原则

> **先把 Admin 做成一套稳定的平台，再往平台里开发业务；Foundation 只建立能力，不提前猜任何 Domain。**