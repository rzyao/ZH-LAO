---
status: complete
phase: 1A
phase_name: Admin Foundation
completed_at: 2026-08-31
gate: PASS
---

# ZH-LAO V2 — Admin Foundation Implementation Report

## 1. Final Status

`ADMIN_FOUNDATION = COMPLETE`
`ADMIN_FOUNDATION_GATE = PASS`

ZH-LAO V2 Admin 已完成 Greenfield Foundation：工程骨架、Design System、AppShell、Router、Query、API Client、DataTable、Form、Feedback、Auth/Permission Skeleton、全局契约与测试基础设施全部就绪。后续 Identity、Content、Learning、Audio、Social、Chat、Commerce、Rewards、Trust、Operations、Platform 可直接在统一 Foundation 上开发，无需再次搭建基础设施。

## 2. Task Matrix

| Task | Status | Result |
| --- | --- | --- |
| ADM-F01 Project Skeleton | PASS | apps/admin（React 19 / TS / Vite 8），dev boot / typecheck / build PASS |
| ADM-F02 Styling Foundation | PASS | Tailwind v4 + shadcn/ui 组件 + Base UI primitives + design tokens；Button/Input/Badge/Dialog 渲染 PASS |
| ADM-F03 Theme | PASS | Light/Dark/System，localStorage 持久化，系统跟随；theme tests PASS |
| ADM-F04 Router | PASS | TanStack Router（code-based），Overview + 11 Domain placeholders + 404 + login/unauthorized，页面 Lazy Loading；router tests PASS |
| ADM-F05 Query Foundation | PASS | 唯一 QueryClient，queries/mutations 默认策略集中配置 |
| ADM-F06 API Client | PASS | 统一 ApiClient（baseURL/JSON/timeout/abort/auth/requestId/error mapping/network）；10 client tests PASS |
| ADM-F07 AppShell | PASS | Sidebar / Header / Breadcrumb / Main Content，active route，sidebar collapse，desktop 布局 |
| ADM-F08 Navigation | PASS | 11 Domain 信息架构（无 Community 独立域；Chat/Audio Production/Trust & Safety 命名正确） |
| ADM-F09 Page Patterns | PASS | PageHeader + List/Detail/Edit/Workbench Layout |
| ADM-F10 DataTable | PASS | DataTable + Toolbar/ColumnHeader/Pagination/ViewOptions/RowActions + FilterBar；排序/选择/列显隐/分页/loading/empty/error；tests PASS |
| ADM-F11 Form Foundation | PASS | React Hook Form + Zod，FormField/Item/Label/Control/Description/Message + FormSection + useFormStatus；tests PASS |
| ADM-F12 Feedback Components | PASS | Loading/Skeleton/Empty/Error/Toast/ConfirmDialog/Sheet/ErrorBoundary；tests PASS |
| ADM-F13 Auth/Permission Skeleton | PASS | AuthProvider/AuthGuard/PermissionGuard/can() + token-store + login/unauthorized placeholder；tests PASS |
| ADM-F14 Global Contracts | PASS | UUID / Time / Pagination（cursor + offset）/ Error 冻结；tests PASS |
| ADM-F15 Testing Foundation | PASS | Vitest + Testing Library：57 tests（14 files）PASS；Playwright smoke 6/6 PASS |
| ADM-F16 Design System Demo | PASS | /system/design-system 展示全部基础组件；Overview 页仅平台信息（无假 KPI） |
| ADM-F17 Documentation | PASS | apps/admin/README.md；本报告；DEVELOPMENT_PROGRESS 更新 |
| ADM-F18 Final Audit | PASS | typecheck / lint / unit+component / build / e2e 全部重跑 PASS；架构/范围/依赖/安全/可访问性审计通过 |
| ADMIN_FOUNDATION_GATE | PASS | Build / Architecture / Scope / UI / Navigation / Testing 全部 PASS |

## 3. Technology（实际安装版本）

```text
React 19.2.8 / react-dom 19.2.8
Vite 8.2.2 / @vitejs/plugin-react 6.1.1
TypeScript 5.9.3
TanStack Router 1.170.32（code-based）
TanStack Query 5.102.8
TanStack Table 8.21.3
@base-ui/react 1.7.0（Base UI primitives）
Tailwind CSS 4.3.3 / @tailwindcss/vite 4.3.3
shadcn/ui（组件模式 + components.json，基于 Base UI）
React Hook Form 7.87.0 / Zod 4.5.4 / @hookform/resolvers 5.9.1
lucide-react 1.37.0
class-variance-authority 0.7.1 / clsx 2.1.1 / tailwind-merge 3.6.0
Vitest 4.1.11 / @testing-library/react 16.3.3 / jest-dom 6.10.0 / user-event 14.6.6 / jsdom 30.0.1
@playwright/test 1.62.1
ESLint 9.39.5 / typescript-eslint 8.68.0
包管理器 pnpm 10.20.0；Node >=22.12
```

技术路线符合冻结栈；未引入 Next.js / Ant Design / Material UI / Redux。

## 4. Directory Structure（主要）

```text
apps/admin/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── config/            env 解析
│   │   ├── providers/         AppProviders（Theme/Query/Auth/Toast）
│   │   └── router/            TanStack Router 路由树 + 测试
│   ├── api/
│   │   ├── client/            ApiClient / request-id / timeout-error
│   │   ├── contracts/         error / uuid / time / pagination
│   │   ├── errors/            ApiError 层级 + 映射
│   │   └── query/             唯一 QueryClient
│   ├── auth/
│   │   ├── context/           AuthProvider
│   │   ├── guards/            AuthGuard / PermissionGuard
│   │   ├── permissions.ts / token-store.ts / types.ts
│   ├── components/
│   │   ├── ui/                button/badge/input/label/textarea/checkbox/switch/
│   │   │                      select/dialog/alert-dialog/sheet/dropdown-menu/
│   │   │                      table/separator/skeleton/slot
│   │   ├── common/            page-header / status-badge / card
│   │   ├── data-table/        data-table + toolbar/column-header/pagination/
│   │   │                      view-options/row-actions + filter-bar
│   │   ├── feedback/          loading / empty-state / error-state / toast /
│   │   │                      confirm-dialog / error-boundary
│   │   ├── form/              form / form-section / useFormStatus
│   │   ├── layout/            list / detail / edit / workbench
│   │   └── navigation/        app-shell / sidebar / header / breadcrumb / theme-switch
│   ├── design-system/
│   │   ├── tokens/index.css   Tailwind v4 tokens（light/dark）
│   │   └── theme/             ThemeProvider / use-theme / theme-utils
│   ├── lib/                   cn / logger / search-validator
│   ├── navigation/config.tsx  11 Domain 导航信息架构
│   ├── pages/                 overview / domain-placeholder / login /
│   │                          unauthorized / not-found / system/design-system
│   └── test/setup.ts
├── e2e/smoke.spec.ts
├── public/favicon.svg
├── components.json / eslint.config.js / vite.config.ts / vitest.config.ts /
│   playwright.config.ts / tsconfig*.json / index.html / .env.example / README.md
```

## 5. Foundation Components

```text
AppShell / Sidebar（collapsible）/ Header / Breadcrumb / PageHeader
DataTable / DataTableToolbar / DataTableColumnHeader / DataTablePagination /
  DataTableViewOptions / DataTableRowActions / FilterBar
Form / FormField / FormItem / FormLabel / FormControl / FormDescription /
  FormMessage / FormSection / useFormStatus
StatusBadge（success/warning/danger/info/muted）
PageLoading / TableLoading / InlineLoading / Skeleton
EmptyState / ErrorState（retry + requestId + safe message）
Toast / ConfirmDialog / Sheet（Base UI Drawer）/ Dialog / AlertDialog
ErrorBoundary（全局 + 路由级）
AuthProvider / AuthGuard / PermissionGuard / can()
Card
```

## 6. Global Contracts（最终实现）

- **API Client**：单例 `apiClient`（`src/api/client`）。统一 baseURL、JSON、timeout（默认 15s）、外部 AbortSignal、Authorization hook（token-store）、`X-Request-Id`、HTTP 错误映射、网络失败归一化。组件禁止直接 `fetch()`。
- **Error**：统一 envelope `{ code, message, details?, requestId? }`。归一化为 `ApiError`：`NetworkError / UnauthorizedError / ForbiddenError / NotFoundError / ValidationError / ConflictError / RateLimitError / ServerError / UnknownError`。
- **UUID**：public/logical ID 一律 `string UUID`（branded `Uuid`）；Admin 不感知 internal BIGINT。
- **Time**：ISO 8601 + timezone；统一 `formatDate / formatDateTime / formatRelativeTime / toIso`。
- **Pagination**：`CursorResponse/CursorParams` 与 `PageResponse/PageParams` 两套独立契约，组件后端无关。
- **Theme**：Light / Dark / System，localStorage 持久化 + 系统跟随 + 首帧无闪烁（main.tsx 预应用）。

## 7. Navigation（11 Domain）

```text
Overview
Learning Content:  Content / Learning / Audio Production
Users & Community:  Identity / Social / Chat
Business:           Commerce / Rewards
Safety:             Trust & Safety
System:             Operations / Platform
Development:        Design System（/system/design-system，可关闭）
```

11 个 Domain 全部有入口与 Coming-Soon placeholder；无 Community 独立域；Chat 使用 Chat、Audio 使用 Audio Production、Trust 使用 Trust & Safety。

## 8. Tests（真实结果）

- **TypeScript**：`pnpm typecheck` → PASS（tsconfig.app.json）
- **Lint**：`pnpm lint` → PASS（0 errors；28 warnings 均为 react-refresh/only-export-components，shadcn 风格多导出组件文件的标准提示）
- **Unit / Component（Vitest + Testing Library）**：`pnpm test` → **57 passed（14 files）**
  - StatusBadge 3 · EmptyState 2 · ErrorState 5 · Form 3 · PermissionGuard 3 · permissions 5 · DataTable 5 · Theme 4 · Router 4 · API Client 10 · error mapping 4 · UUID 2 · Time 5 · Pagination 2
- **Build**：`pnpm build` → PASS（Vite 8 / Rolldown；页面级 code-split；Overview 与 Design System 独立 chunk）
- **Playwright E2E**：`pnpm e2e` → **6 passed**
  - Admin opens / AppShell / Sidebar / Overview / 11 Domain 导航 / 导航到 Domain placeholder / Design System 页 / 404 / Theme switch（light↔dark）

## 9. Scope Audit

```text
Business Domain APIs implemented:   0
Business Domain pages implemented:  0
Fake CRUD pages:                    0
Direct database access:             0
Frontend internal BIGINT contract:  0
Random direct fetch usage:          0
Multiple QueryClient:               0
Multiple API wrapper:               0
Common business service:            0
Domain business logic in AppShell:  0
```

确认方法：源码专项检索 + 目录审计（仅中性示例数据出现于 Design System 演示页，不含 User/Course/Order/Moderation 等假业务）。

## 10. Changed Files

主要新增：

- `apps/admin/**`（全新应用，见 §4 目录结构）
- `apps/admin/package.json / pnpm-lock.yaml`（独立 pnpm 包，遵循仓库现有 app 独立包规范）
- `apps/admin/.env.example`、`.gitignore`、`components.json`、`eslint.config.js`、`vite.config.ts`、`vitest.config.ts`、`playwright.config.ts`、`tsconfig*.json`、`index.html`
- `apps/admin/e2e/smoke.spec.ts`
- `docs/docs/development/v2/ADMIN_FOUNDATION_REPORT.md`（本报告）
- `docs/docs/development/v2/DEVELOPMENT_PROGRESS.md`（更新）

未修改 PostgreSQL V2 / Backend 业务模块。

## 11. Known Limitations

均为 Foundation 合理延后内容（非 blocker）：

```text
真实 Operator Login / Session          → 待 Identity / Operations Phase
真实 Permission Fetch（RBAC 数据）     → 待 Operations Phase
真实 Domain API                        → 待各 Domain Phase
DataTable 服务端分页/排序/筛选契约      → 当前为客户端模式，Domain Phase 叠加后端契约
Toast 为自研轻量实现（无第三方 toast 库）→ 记录于 README
Workbench 仅提供基础 Layout            → Audio / Trust Workbench 待各自 Phase
Sidebar 折叠状态未持久化               → 可后续按需增强
```

## 12. Blockers

```text
None
```

无 `BLOCKED_BY_SPEC_CONFLICT`。

## 13. Gate Result

`ADMIN_FOUNDATION_GATE = PASS`

```text
Build:  TypeScript PASS · Lint PASS · Unit/Component PASS（57）· Build PASS · Playwright PASS（6）
Architecture: React/Vite · Tailwind · shadcn/ui · Base UI · Router · Query · API Client ·
              AppShell · Navigation · Design Tokens · Theme · Page Patterns · DataTable ·
              Form · Loading/Empty/Error · Dialog/Sheet · Auth Skeleton · Permission Skeleton ·
              UUID/Time/Pagination/Error Contract · Testing Infrastructure — 全部 PASS
Scope: Business Domain implementation = 0 · Business API guessing = 0 · Fake CRUD = 0
UI: Rhea-inspired Compact（中性色、紧凑间距、弱装饰、强层级、桌面优先）
Navigation: 11 Domain 全部正确入口/placeholder
```

**下一阶段未自动开始。** 后续 Domain（如 Identity Admin）等待新的明确任务与对应 Contract 冻结。
