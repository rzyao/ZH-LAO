# Implementation Plan: 后台管理员登录 (Admin Login)

**Branch**: `003-admin-login` | **Date**: 2026-09-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-admin-login/spec.md`

## Summary

实现并补齐 **Admin 后台管理员登录** 能力的完整闭环：账号密码登录、会话刷新与令牌轮换、首次默认管理员引导、修改密码、退出登录，以及后台操作审计与登录防爆破频控。

技术方案直接复用并扩展项目已审计的 Identity 与 Operations 领域架构：
- **后端**: Node.js 22 + TypeScript + Fastify + PostgreSQL。复用 `AdminAuthenticationService`（scrypt 密码哈希、`identity.admin_credentials`）、`SessionLifecycle`（30 天滑动会话 + Refresh Token 强制轮换）、`OperationsService`（RBAC 授权 + 操作审计）。新增：登录失败频控、密码变更端点（复用审计）、登录成功审计写入。
- **前端**: React 19 + TypeScript + Vite + TanStack Query + TanStack Router。复用 `AuthContext` / `AuthGuard` / `LoginPage` / `session-store` / `apiClient`。新增：访问令牌自动刷新（401 → refresh → 重放）、改密页面与流程、登录页安全增强。

---

## Technical Context

**Language/Version**: TypeScript 5.8+, Node.js 22+ (Backend), React 19 (Admin Frontend).

**Primary Dependencies**: Fastify 5.x, PostgreSQL driver (`pg`), Zod 4.x, TanStack Query 5, TanStack Router (Admin), scrypt (Node `crypto`), Vitest.

**Storage**: PostgreSQL 16+（核心物理表：`identity.users`, `identity.admin_credentials`, `identity.sessions`, `operations.operators`, `operations.operator_audit_logs`）。

**Testing**: Vitest + Node test runner (Backend), Vitest + React Testing Library (Admin).

**Target Platform**: Node.js Linux Container (Backend), 浏览器 (Admin SPA).

**Project Type**: Monorepo with Web/Service & Application (`apps/backend`, `apps/admin`).

**Performance Goals**: 后台登录请求响应 p95 < 200ms；令牌刷新 p95 < 200ms；登录失败频控拦截率 100%（超过阈值后拒绝）；敏感凭据零明文落库（100% Hash 存储）。

**Constraints**:
- 不引入 Redis 或外部队列，登录频控依托 PostgreSQL 事务机制与内存令牌桶（单进程内）。
- 复用现有 Identity 会话与令牌语义（15 分钟 Access Token + 30 天滑动 Refresh Token + 强制轮换），不新增会话表。
- 后台审计遵循 `audit.md` 成功语义：只有成功动作写入 `operations.operator_audit_logs`；失败（含登录失败）进入安全/应用日志，不伪造成功 Audit。
- 密码与刷新令牌严禁明文入库、入日志、入事件。

**Scale/Scope**: 支持多管理员并行会话、登录防爆破频控、后台安全审计。默认凭据 `admin / 123456` 仅用于首次引导。

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 宪法原则 (Principle) | 检查项与规则 | 状态 | 实施/规划依据 |
|---|---|:---:|---|
| **I. 权威优先级** | Spec/Plan 绝不覆盖物理迁移与领域事实 | `PASS` | 严格依循 `1260_admin_credentials.sql`、`1220_identity_auth_runtime.sql`、`0200_operations.sql` 与 `domains/operations/` |
| **II. 现有代码非需求权威** | 不从现有代码反推需求，冲突必报 | `PASS` | 以 `spec.md` 为需求来源，代码作为工程现实参考；已上报并处置 FR-011/FR-015 的补齐决策 |
| **III. 需求 ID 稳定性** | 保持 `FR-001` ~ `FR-017` 原生稳定 ID | `PASS` | 计划所有任务与追踪严格映射原始需求 ID |
| **IV. 可验证性** | 具备明确 Given/When/Then 与测试输入 | `PASS` | 验收用例与 quickstart 验证场景全覆盖 |
| **V. 状态机强制** | 涉及生命周期的实体必须有明确状态机 | `PASS` | `AdminSession`（3状态）与 `UserAccountStatus`（3状态）合法跃迁全约束 |
| **VI. 真实契约映射** | 契约只引用真实存在的文件与符号，不臆造 | `PASS` | 映射真实端点与物理迁移列；新增端点（改密）在契约中明确标注为新增 |
| **VII. 决策预算 (LOCKED)** | LOCKED 决策严禁修改，私有拆解受控 | `PASS` | 锁定表列、API 路径与事务边界；仅新增私有端点（`admin/auth/change-password`）且不触碰既有锁定契约 |
| **VIII. 冲突即停止 (STOP)** | 发现冲突立即上报，严禁自行平替 | `PASS` | FR-011/FR-015 缺失实现已上报并经用户确认按规格补齐；其余无冲突 |
| **IX. 证据现实** | 交付以端到端和测试映射结果为证据 | `PASS` | 输出 quickstart.md 明确自动化与手动验证脚本 |
| **X. Grounding Gate** | 锚定当前 main 分支基线提交 | `PASS` | 锚定 Base Commit `e604277fa90d871cb2a2a199df103ee7a7b904f3` |
| **XI. 单一事实所有权** | Identity 拥有认证事实，Operations 拥有授权与审计事实，禁止跨域直写 | `PASS` | 登录与会话在 Identity 域；授权与审计在 Operations 域；密码变更经 Identity 域用例实现 |

---

## Locked Decisions *(per Constitution Principle VII)*

| Decision | Source | Why LOCKED |
|---|---|---|
| 后台登录端点 `POST /api/v1/admin/auth/login`（`username`/`password`） | `apps/backend/src/modules/identity/http/routes.ts` | 已冻结的公共契约，禁止私自改动路径与请求/响应结构 |
| `identity.admin_credentials` 表结构与 scrypt 哈希格式 `scrypt$salt$derived` | `database/migrations/1260_admin_credentials.sql`, `admin-authentication.ts` | 物理数据库事实与既有哈希格式，禁止改动列或哈希算法 |
| `identity.sessions` 会话表 + 15 分钟 Access Token + 30 天滑动 Refresh Token + 强制轮换 | `1220_identity_auth_runtime.sql`, `domains/identity/flows.md` | 平台统一会话语义，后台复用，禁止新增会话表或改 TTL |
| Refresh Token / 密码仅存单向 Hash，禁止明文 | `1220_identity_auth_runtime.sql`, `1260_admin_credentials.sql` | 凭据防泄露黄金法则，严禁明文入库、入日志、入事件 |
| `POST /api/v1/identity/sessions/refresh` 与 `/logout`（后台复用 Identity 会话生命周期） | `apps/backend/src/modules/identity/http/routes.ts` | 已冻结端点；刷新强制轮换，退出置 `revoked` |
| Operations RBAC 授权算法（active Operator → active Roles → Permission UNION） | `domains/operations/rbac.md` | 冻结授权模型，禁止自定义 bypass 或通配符 |
| 审计表 `operations.operator_audit_logs` + 成功语义（失败不伪造 Audit） | `database/migrations/0200_operations.sql`, `domains/operations/audit.md` | 冻结审计契约；`details` 禁含敏感字段（密码/令牌） |
| `ensureDefaultAdmin` 幂等引导（仅当无 Operators 时创建） | `admin-authentication.ts` | 冻结引导语义，防止重复创建默认管理员 |
| 统一 API 前缀 `/api/v1` | `docs/docs/developer/reference/contracts/` | 全平台契约一致性 |

---

## Authority Snapshot

- **Base Commit**: `e604277fa90d871cb2a2a199df103ee7a7b904f3`
- **Scope Type / ID**: `feature:admin-login` / `domain:identity` + `domain:operations`
- **Referenced Authority Docs**:
  - `docs/docs/developer/reference/domains/operations/rbac.md`
  - `docs/docs/developer/reference/domains/operations/audit.md`
  - `docs/docs/developer/reference/domains/identity/flows.md`
  - `docs/docs/developer/reference/contracts/identity/IDENTITY_USE_CASES.md` & `IDENTITY_API.md`
  - `database/migrations/0100_identity.sql`
  - `database/migrations/1220_identity_auth_runtime.sql`
  - `database/migrations/1260_admin_credentials.sql`
  - `database/migrations/0200_operations.sql`
- **Existing Code / Schema / API / Contracts Checked**:
  - `apps/backend/src/modules/identity/`: 确认 `AdminAuthenticationService.login`、`ensureDefaultAdmin`、`AccessTokenService`（15m JWT）、`RefreshTokenService`（SHA-256 hash）、`SessionLifecycle.refreshSession/logoutCurrent`、`POST /api/v1/admin/auth/login` 均已存在。
  - `apps/backend/src/modules/operations/`: 确认 `OperationsService`（`getCurrentOperator`、`requirePermission`、`localAudit`/`recordSuccessfulAction`）、`GET /api/v1/admin/operations/me`、`OPERATOR_PERMISSION_CATALOG` 均已存在。
  - `apps/admin/src/auth/`: 确认 `AuthContext.login/signOut`、`AuthGuard`、`session-store`、`token-store`、`api.ts`（`loginAdmin`/`getCurrentOperator`/`logoutAdmin`）、`apiClient`（`setUnauthorizedHandler`/`onUnauthorized`）均已存在。
  - **缺口（本计划补齐）**：
    - 登录失败频控（无 throttle 于 `/admin/auth/login`）。
    - 登录成功审计写入（当前登录路径不写 `operator_audit_logs`；`operations` 域仅记录已授权动作）。
    - 管理员修改密码（无端点、无前端页面/流程）。
    - 前端访问令牌自动刷新（当前 `setUnauthorizedHandler` 仅清会话并登出，不做 refresh 重放）。
    - 登录页安全增强与默认凭据提示治理。

---

## Project Structure

### Documentation (this feature)

```text
specs/003-admin-login/
├── spec.md              # 业务需求规格说明书
├── plan.md              # 架构实现计划书 (本文件)
├── research.md          # Phase 0 技术决策与研究记录
├── data-model.md        # Phase 1 字段级数据模型与状态机规范
├── quickstart.md        # Phase 1 端到端验证与测试指引
├── contracts/           # Phase 1 契约定义
│   ├── http-api.md      # 后端 Admin 认证/会话 HTTP API 规范（含新增改密端点）
│   └── frontend-session.md # 前端会话自动刷新与存储契约
├── checklists/
│   └── requirements.md  # 规格质量核对清单
└── tasks.md             # Phase 2 实施任务分解 (由 /speckit-tasks 生成)
```

### Source Code Layout

```text
apps/backend/src/
├── modules/identity/
│   ├── domain/                 # 领域对象与值对象 (account, session, admin)
│   ├── application/
│   │   ├── ports/              # 仓储与适配器端口
│   │   ├── services/           # token-services, otp-services
│   │   └── use-cases/
│   │       ├── admin-authentication.ts   # 已有：login / ensureDefaultAdmin (scrypt)
│   │       └── admin-credential-ops.ts   # 新增：changeAdminPassword + 登录频控逻辑
│   ├── infrastructure/         # 数据库查询实现与事务编排
│   └── http/routes.ts          # Fastify 路由；新增 change-password 路由挂载
└── modules/operations/         # 授权与审计（复用，不新增）

apps/admin/src/
├── auth/
│   ├── context/AuthContext.tsx # 已有：登录/登出；新增 refresh 会话恢复
│   ├── api.ts                  # 已有：loginAdmin/getCurrentOperator/logoutAdmin；新增 changeAdminPassword
│   ├── refresh-session.ts      # 新增：访问令牌自动刷新（401 → refresh → 重放）
│   └── session-store.ts        # 已有：localStorage 会话持久化
├── pages/
│   ├── login.tsx               # 已有登录页；安全增强
│   └── change-password.tsx     # 新增改密页
└── app/router/router.tsx       # 新增改密路由挂载
```

**Structure Decision**: 采用现有 monorepo 模块化单体结构（`apps/backend` + `apps/admin`）。所有新增代码遵循既有分层（Identity 域负责认证事实、Operations 域负责授权与审计事实）。不新增应用或进程。

---

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

无未决宪法违规；FR-011/FR-015 的补齐决策已经用户确认并按规格正向规划，不构成违规。

---

## 阶段规划 (Phases)

### Phase 0: Outline & Research
- 完成技术选型决策，消除所有不确定性，产出 `research.md`。

### Phase 1: Design & Contracts
- 提取数据模型、状态机与约束，产出 `data-model.md`。
- 定义服务端 HTTP 契约与前端会话契约，产出 `contracts/http-api.md` 与 `contracts/frontend-session.md`。
- 编制端到端测试与集成验证指南，产出 `quickstart.md`。

### Phase 2: Tasks & Implementation (待执行)
- 由后续 `/speckit.tasks` 生成依赖有序的任务清单 `tasks.md`。
- 进入 `/speckit.implement` 编码与测试落地。
