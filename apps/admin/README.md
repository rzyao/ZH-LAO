# ZH-LAO Admin

ZH-LAO V2 后台管理平台（B 端）。

Phase：**PHASE 1A — Admin Foundation** · 状态：**COMPLETE** · Gate：**PASS**

## Tech Stack

| 领域 | 技术 |
| --- | --- |
| 框架 | React 19 + TypeScript + Vite 8 |
| 路由 | TanStack Router（code-based，页面级 Lazy Loading，URL Search 状态） |
| 服务端状态 | TanStack Query |
| 表格 | TanStack Table v8 |
| 样式 | Tailwind CSS v4 + shadcn/ui 组件模式 + Base UI（headless primitives） |
| 表单 | React Hook Form + Zod |
| 图标 | Lucide |
| 测试 | Vitest + Testing Library（单测/组件）+ Playwright（E2E smoke） |

本阶段冻结：不得引入 Next.js / Ant Design / Material UI / Redux 等替代方案。

## Commands

```bash
pnpm install          # 安装依赖
pnpm dev              # 开发服务器（端口 5174）
pnpm typecheck        # TypeScript 检查
pnpm lint             # ESLint
pnpm test             # 单元 / 组件测试（Vitest）
pnpm build            # 生产构建（先 typecheck）
pnpm preview          # 预览生产构建
pnpm e2e              # Playwright E2E（自动启动 dev server）
pnpm verify           # typecheck + lint + test + build
```

## Directory

```
apps/admin/
├── src/
│   ├── app/                 # App 装配：providers / router / App
│   │   ├── config/          # 环境配置解析（env）
│   │   ├── providers/       # AppProviders（Theme/Query/Auth/Toast）
│   │   └── router/          # TanStack Router 路由树（code-based）
│   ├── api/
│   │   ├── client/          # 统一 HTTP Client（timeout/abort/auth/requestId）
│   │   ├── contracts/       # Error / UUID / Time / Pagination 全局契约
│   │   ├── errors/          # ApiError 层级与映射
│   │   └── query/           # QueryClient（唯一初始化）
│   ├── auth/                # Auth/Permission Skeleton（Operator 占位）
│   ├── components/
│   │   ├── ui/              # shadcn 风格基础组件（Base UI）
│   │   ├── common/          # 跨域可复用技术组件（PageHeader/StatusBadge/Card）
│   │   ├── data-table/      # DataTable 基础（排序/选择/列显隐/分页/空/错/载）
│   │   ├── feedback/        # Loading/Empty/Error/Toast/ConfirmDialog/ErrorBoundary
│   │   ├── form/            # Form Foundation（RHF + Zod）
│   │   ├── layout/          # List/Detail/Edit/Workbench 页面模式
│   │   └── navigation/      # AppShell / Sidebar / Header / Breadcrumb
│   ├── design-system/       # tokens（CSS）与 ThemeProvider
│   ├── lib/                 # cn / logger / search-validator
│   ├── navigation/          # 11 Domain 导航信息架构
│   ├── pages/               # Overview / 占位页 / 404 / Login / Design System
│   └── test/                # Vitest setup
├── e2e/                     # Playwright smoke
└── public/
```

## Architecture

```text
Admin SPA
  ↓ HTTP（统一 ApiClient，baseUrl=env.apiBaseUrl）
V2 Backend
  ↓
Application Service → Domain → PostgreSQL V2
```

- 组件**禁止直接 `fetch()`**，禁止自行拼接 `Authorization`，禁止自建 HTTP wrapper。
- **唯一** QueryClient（`src/api/query`）集中初始化。
- 跨 Domain 引用全部使用 **UUID string**（Admin 不感知 internal BIGINT）。
- 时间统一 ISO 8601（带时区），展示走 `formatDate / formatDateTime / formatRelativeTime`。
- 分页支持 **Cursor** 与 **Offset/Page** 两种契约，组件不混用。

## State Ownership

- 服务端数据 / 缓存 / 失效 → TanStack Query。
- URL 列表状态（page/cursor/status/q/sort）→ TanStack Router Search Params。
- 短暂 UI 交互状态 → React local state（本阶段未引入全局 UI store）。

## API Client

统一 `ApiClient`（`src/api/client`）：base URL、JSON 序列化/解析、timeout、外部 AbortSignal、Authorization hook、`X-Request-Id`、HTTP 错误映射、网络失败归一化。

错误契约（统一）：

```text
{ code, message, details?, requestId? }
```

前端归一化为 `ApiError`，至少区分：`NetworkError / UnauthorizedError / ForbiddenError / NotFoundError / ValidationError / ConflictError / RateLimitError / ServerError / UnknownError`。

## Testing

- **Vitest + Testing Library**：`pnpm test`
  - 覆盖：StatusBadge / EmptyState / ErrorState / Form / PermissionGuard / DataTable / Theme / Router / API Client（200/401/403/404/422/429/500/network/timeout）/ 全局契约。
- **Playwright**：`pnpm e2e`
  - smoke：Admin 打开、AppShell/Sidebar/Overview 可见、11 Domain 导航、404、主题切换。

## Design System

内部组件展示页：`/system/design-system`（可由 `VITE_ENABLE_DESIGN_SYSTEM=false` 关闭）。

包含：Typography / Button / Input / Select / Checkbox / Switch / Badge / StatusBadge / DataTable / Form / Dialog / Sheet / Toast / Loading / Skeleton / Empty / Error / PermissionGuard 示例。

## Environment

复制 `.env.example` 为 `.env.local`：

```text
VITE_API_BASE_URL=            # 后端 API base（默认 /api，dev 由 Vite proxy 转发）
VITE_APP_ENV=development      # development | test | production
VITE_ENABLE_DESIGN_SYSTEM=true
```

> 前端环境变量均为公开信息，禁止写入任何服务器秘密。

## UI 风格

**Rhea-inspired Compact Admin**：简洁、现代、专业、高信息密度、弱装饰、强层级、桌面优先、工作流优先。中性基础色 + 有限语义色；Light/Dark/System 主题自 Foundation 起由 token 支持。
