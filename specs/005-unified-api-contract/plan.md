# Implementation Plan: 前后端统一请求格式与业务状态码 (Unified API Contract & Business Status Codes)

**Branch**: `005-unified-api-contract` | **Date**: 2026-09-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-unified-api-contract/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

将全系统跨端（后端 + Admin + Mobile）的请求/响应格式统一为：
**HTTP 一律 200 + 顶层 `code` 信封 + 业务状态码权威**。核心：
- **后端**：成功响应在 `onSend` hook 集中包裹 `{ code:"OK", data, request_id }`；错误响应在
  `error-handler` 输出 `{ code, error{message,details?}, request_id }`；全部现有 `AppError.code`
  （50 + Content 内联 3）归一 `UPPER_SNAKE_CASE` 并登记 `business-codes.ts`；Content 内联错误改走
  `AppError`。
- **前端**：Admin / Mobile 以响应体 `code` 判定成败，错误映射表以业务码为键；`request_id`
  字段名三端统一。
- **请求侧**：请求体 `snake_case` + 请求头约定收敛（双向统一）。
- **切版**：同步切版——后端 + 两客户端同一发版窗口。

已确认的产品/架构决策：① HTTP 一律 200；② 顶层 `code` + `data`/`error` 信封；③ 同步切版；
④ 全量错误码迁移；⑤ `request_id` 始终携带；⑥ 含请求侧收敛。

> ✅ 本功能修订的 `api-standard.md` 响应契约已由 **ADR-023**
> (`docs/docs/developer/reference/adr/ADR-023-unified-api-contract.md`, `frozen`)
> + **D-156** (`docs/docs/developer/reference/governance/design-register.md`, `frozen`)
> 于 2026-09-03 正式批准；实施前置（api-standard 修订、business-status-codes 词汇表、
> 契约快照回写）已完成，可进入实施。

## Technical Context

**Language/Version**: TypeScript（后端 Fastify + Node.js；Admin React 19；Mobile React Native / Expo）/ Node LTS

**Primary Dependencies**: `fastify`（后端路由 + onSend hook）、`zod`（校验）、`@tanstack/react-query`（Admin 数据获取）、axios（Mobile httpClient）

**Storage**: PostgreSQL（**无新迁移**；本功能为线缆契约改造，不触碰数据库）

**Testing**: Vitest（单测/契约测试）、现有后端 route/use-case 测试、Admin `api/*.test.ts`、Mobile 现有错误映射测试

**Target Platform**: Linux server（后端）+ 现代浏览器 Web（Admin）+ Android/iOS（Mobile）

**Project Type**: web-service + web-app + mobile-app（monorepo: `apps/backend` + `apps/admin` + `apps/mobile`）

**Performance Goals**: 信封包裹为常量级开销（JSON 序列化一次），对现有响应延迟无实质影响

**Constraints**: 不可修改冻结迁移（本功能无迁移）；不可改变业务实体/状态机/权限/审计语义（ADR-023 决策 12）；同步切版（三端同发版）；`/health/*` 豁免

**Scale/Scope**: 跨端全部业务 API（约 80 后端端点 + Admin + Mobile）；全量 53 个业务错误码迁移

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Check | Status |
|---|-----------|-------|--------|
| I | Source of Truth Priority | spec 引用真实冻结工件（ADR-023、api-standard、business-status-codes、代码锚点），未捏造契约 | ✅ PASS |
| II | Existing Code Is Engineering Reality, Not Product Authority | 现有响应格式作为「被迁移的现状」参考，不反向推导产品需求 | ✅ PASS |
| IV | Verifiability | 每条 FR 对应 Given/When/Then 验收场景 | ✅ PASS |
| V | State Machines | 信封演进 + 前端会话处理状态机已在 spec 声明 | ✅ PASS |
| VI | Contract Reference Reality | 现状契约（error-handler、http-client、mapHttpError）指向真实文件；目标契约由 ADR-023 批准 | ✅ PASS |
| VII | Decision Budget | 不修改数据库契约/迁移；修改的是 **API 响应契约**（LOCKED），已由 ADR-023 明确批准 | ✅ PASS(ADR-023 已批准) |
| VIII | Conflict Must STOP | **SPEC_CONFLICT** 已解决：修订 `api-standard.md` 响应契约 + `AppError`/`ApiError` 形态，已由 ADR-023 + D-156 正式批准（2026-09-03） | ✅ PASS(已批准) |
| X | Grounding Gate | Authority Snapshot 记录基准 commit 与引用工件 | ✅ PASS |

**Gate 裁决**（ADR-023 批准后复验）：
- **SPEC_CONFLICT（Principle VIII）**：已由设计裁决 **ADR-023**（`frozen`）+ **D-156**
  （`frozen`）于 2026-09-03 正式批准。GATE **通过**，plan 可正常进入 `/speckit-tasks`。
- **Phase 1 设计复验**：数据模型与契约未引入新违反——线缆契约严格遵循 ADR-023（VI）、
  不触碰数据库冻结边界（VII）、状态机遵循 V、`request_id`/`code` 字段名三端统一。✅
- 其余 Gate 全部 PASS。

## Locked Decisions *(per Constitution Principle VII)*

> LOCKED 决策来自权威文档/ADR/冻结迁移，实施 MUST NOT 修改。本功能**修订但不越权**：
> API 响应契约已被 ADR-023 批准修订；数据库/业务/权限 LOCKED 决策不触碰。

| Decision | Source | Why LOCKED | 本功能处置 |
| --- | --- | --- | --- |
| API 响应契约（信封 + 状态码语义） | `api-standard.md`（active，已由 ADR-023 修订） | Public Contract | **已由 ADR-023 批准修订**为「HTTP 一律 200 + 顶层 code 信封」 |
| 错误语义（`AppError.code` / `ApiError` 形态） | `errors/app-error.ts`、`api/errors/` | 跨端契约 | **ADR-023 批准修订**形态；业务码语义不变，仅归一命名 + 统一信封 |
| 数据库 schema / 迁移 | `database/migrations/*.sql` | 物理 DB 真相 | **不触碰**；本功能无迁移 |
| 业务实体 / 状态机 / 权限 / 审计语义 | 各域权威文档 | 业务不变量 | **不改变**（ADR-023 决策 12） |
| 幂等语义 / 请求头约定 | `api-standard.md` §5 | 请求侧契约 | **遵循**；请求侧收敛不改幂等语义 |
| `/health/*` 探针语义 | `http/health-routes.ts` | L7 摘流 | **豁免**统一信封，保持 status/503 |

## Authority Snapshot

- **Base Commit**: `fab22fa`（main, 2026-09-03）
- **Scope Type / ID**: `feature:005-unified-api-contract`（跨端：backend + admin + mobile + 契约文档）
- **Referenced Authority Docs**:
  - `docs/docs/developer/reference/adr/ADR-023-unified-api-contract.md`（frozen，本功能权威裁决）
  - `docs/docs/developer/reference/governance/design-register.md`（D-156，frozen）
  - `docs/docs/developer/reference/architecture/applications/api-standard.md`（已修订，HTTP 200 + 顶层 code 信封）
  - `docs/docs/developer/reference/architecture/applications/business-status-codes.md`（frozen 词汇表）
  - `docs/docs/developer/reference/contracts/identity/IDENTITY_API.md` 等（已加 ADR-023 修订说明）
  - `specs/005-unified-api-contract/spec.md`（本 feature spec）
- **Existing Code / Schema / API / Contracts checked**（pre-plan scan；deltas only）:
  - 后端错误集中点：`apps/backend/src/errors/error-handler.ts`（输出 `{ error:{code,message,request_id} }`）
  - 后端成功包裹点：`apps/backend/src/http/request-context.ts`（已有 onSend hook 设 x-request-id）
  - 后端错误类型：`apps/backend/src/errors/app-error.ts`（`code/httpStatus/expose/details`）
  - 后端域路由：`modules/{identity,operations,platform}/http/routes.ts` + `management-routes.ts` +
    `modules/content/http/{admin,public}-routes.ts`（ad-hoc 成功载荷；Content 内联 `{error,message}`）
  - 后端挂载：`apps/backend/src/main.ts`（registerHttp 序列）
  - Admin 客户端：`apps/admin/src/api/client/http-client.ts`（按 HTTP 状态映射错误）
  - Admin 错误映射：`apps/admin/src/api/errors/{index,api-error}.ts` + `api/contracts/error.ts`
  - Mobile 客户端：`apps/mobile/src/api/client/httpClient.ts`（`status >= 400` 走 normalize）
  - Mobile 错误映射：`apps/mobile/src/api/errors/mapHttpError.ts`（按 status switch）
  - 已盘点 50 + 3 个业务错误码（research 基线）

## Project Structure

### Documentation (this feature)

```text
specs/005-unified-api-contract/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   ├── response-envelope.md  # 统一响应信封 JSON 契约
│   └── frontend-error-model.md # 前端错误模型（业务码为键）
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
# Monorepo: apps/backend (Fastify) + apps/admin (React) + apps/mobile (Expo)

apps/backend/src/
├── errors/
│   ├── app-error.ts               # 改造: code 类型约束为 BusinessStatusCode
│   ├── business-codes.ts          # 新增: BUSINESS_STATUS_CODES 枚举 + BusinessStatusCode 类型
│   ├── error-handler.ts           # 改造: 输出 { code, error{message,details?}, request_id }, HTTP 200
│   └── __tests__/
│       └── response-envelope.test.ts  # 新增: 契约测试(信封形状 + 业务码 + HTTP 200)
├── http/
│   ├── response-envelope.ts       # 新增: onSend hook 包裹成功 { code:"OK", data, request_id }, /health/* 豁免
│   └── request-context.ts         # 改造: 安装 response-envelope(或由 build-app 组装)
├── bootstrap/
│   └── build-app.ts               # 改造: installResponseEnvelope(app)
├── auth/
│   └── auth-hook.ts               # 改造: UNAUTHENTICATED 错误(request_id 由 error-handler 顶层补)
└── modules/
    ├── content/http/admin-routes.ts   # 改造: 内联 { error, message } → 抛 AppError(UNICODE_CONFLICT/ACTIVE_WORK_CONFLICT/ILLEGAL_STATE_TRANSITION)
    ├── content/http/public-routes.ts  # 改造: 同上(INTERNAL_ERROR 等)
    ├── identity/http/routes.ts        # 改造: AppError code 引用 business-codes
    ├── operations/http/routes.ts      # 改造: 同上
    └── platform/http/management-routes.ts # 改造: 同上

apps/admin/src/api/
├── client/http-client.ts          # 改造: 解析信封 + code 判定 + request_id 对齐
├── errors/
│   ├── api-error.ts               # 改造: ApiError 以 code 为主键; kind 字典
│   └── index.ts                   # 改造: mapHttpError → mapBusinessCode 字典
└── contracts/error.ts             # 改造: ApiErrorBody 对齐 { code, error, request_id }

apps/mobile/src/api/
├── client/httpClient.ts           # 改造: 解析信封 + code 判定
└── errors/mapHttpError.ts         # 改造: 业务码 switch + 状态兜底

docs/docs/developer/reference/       # (已前置完成, 实施期保持一致)
└── architecture/applications/
    ├── api-standard.md              # 已修订
    └── business-status-codes.md     # 已落盘
```

**Structure Decision**: 采用现有 monorepo 分层。信封集中点选 **onSend hook**
（`http/response-envelope.ts` 新增，由 `build-app.ts` 安装），与现有 `request-context.ts`
onSend 先例一致；错误信封在 `error-handler.ts` 集中。前端错误映射收敛到
`api/errors/`（字典化）。无新迁移、无新模块、无新权限。

## Complexity Tracking

> Constitution Check 的 SPEC_CONFLICT GATE 已由 ADR-023 + D-156 批准。
> 以下 justify 为什么需要修订 API 契约与为何选择集中包裹。

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 修订 `api-standard.md` 响应契约（HTTP 一律 200 + 顶层 code 信封） | FR-001「HTTP 一律 200 + 业务状态码权威」直接改变 Public Contract | 保留标准 HTTP 状态码仅叠加业务码 → 未满足「用业务状态码代替请求状态码」核心诉求（ADR-023 备选表） |
| 改变 `AppError`/`ApiError` 错误形态（`code` 顶层 + `request_id` 顶层） | FR-016 消除字段漂移；FR-013 code 权威 | 保留嵌套 `{error:{...}}` → 前端解析复杂、字段漂移不解决 |
| 全量 53 错误码归一 + Content 内联改 AppError | FR-012 一次性全量迁移，不留双轨 | 仅新接口统一 → 长期双轨违背「统一」初衷（用户确认全量） |
| onSend 集中包裹成功信封 | 约 80 端点统一信封，避免逐路由漏改 | 逐路由手动包裹 → 改动面巨大、易漏、难测（research 决策点 1） |
| 同步切版（无版本头双响） | 端与后端同团队同节奏，避免双路径维护 | 版本头双响 → 双路径长期维护成本高（用户确认同步） |
