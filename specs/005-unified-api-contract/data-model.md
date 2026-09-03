# Data Model: 前后端统一请求格式与业务状态码 (005-unified-api-contract)

**Feature Branch**: `005-unified-api-contract` | **Date**: 2026-09-03 | **Spec**: [spec.md](./spec.md)

> ⚠️ 本功能为**跨端契约改造**，**不涉及数据库表变更**（无新迁移、无 Schema 变更）。
> 本数据模型描述的是**线缆契约（wire contract）数据形态**：统一响应信封、业务状态码
> 词汇表映射、前端错误对象模型。依据 [ADR-023](/docs/docs/developer/reference/adr/ADR-023-unified-api-contract.md)
> （frozen）与 [business-status-codes.md](/docs/docs/developer/reference/architecture/applications/business-status-codes.md)
> （frozen）。
>
> 遵守 Constitution VI（契约引用现实）：信封字段与状态码词汇均引用已落盘的权威文件。

---

## 实体关系图 (Entity Relationship)

```text
┌────────────────────────────────────────────────────────────────┐
│                  Unified Response Envelope                      │
│────────────────────────────────────────────────────────────────│
│ code         : BusinessStatusCode   (成败权威, UPPER_SNAKE)      │
│ data?        : unknown              (成功载荷; 无返回体 = null)   │
│ error?       : ErrorBody            (失败详情; 成功时不存在)      │
│ request_id   : string               (追踪 ID, 始终存在)           │
└───────────────────────────┬────────────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
   ┌──────────▼──────────┐     ┌──────────▼──────────┐
   │   ErrorBody          │     │ BusinessStatusCode   │
   │──────────────────────│     │──────────────────────│
   │ message : string     │     │ code : UPPER_SNAKE   │
   │ details?: unknown    │     │ http_ref : number    │
   │                      │     │ frontend_kind : Kind │
   └──────────────────────┘     └──────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                Frontend ApiError (Admin & Mobile)               │
│────────────────────────────────────────────────────────────────│
│ kind        : ApiErrorKind    (network/unauthorized/forbidden/…)│
│ code        : BusinessStatusCode                               │
│ message     : string                                           │
│ details?    : unknown                                          │
│ requestId?  : string                                           │
│ retryable   : boolean                                          │
└────────────────────────────────────────────────────────────────┘
```

---

## 实体详情与字段级契约

### 1. 统一响应信封 (Unified Response Envelope)

- **Authority**: `docs/docs/developer/reference/architecture/applications/api-standard.md` §4（已修订）
- **契约**: `{ code, data?, error?, request_id }`
- **Fields**:

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `code` | `string`（`UPPER_SNAKE_CASE`） | 是 | 业务状态码，**成败判断唯一权威**。成功恒为 `OK`，失败为对应业务码 |
| `data` | `unknown` | 成功时是 | 成功载荷；无返回体操作为 `null` |
| `error` | `ErrorBody` | 失败时是 | 失败详情；成功时不存在 |
| `request_id` | `string` | 是 | 追踪 ID，**始终存在（含认证前失败）** |

- **不变量（Invariants）**:
  - 成功: `code === "OK"` ⇒ `error` 不存在、`data` 存在（可为 `null`）。
  - 失败: `code !== "OK"` ⇒ `error` 存在、`data` 不存在。
  - `request_id` 永远存在（FR-004/FR-004a）。
  - HTTP 状态码一律 200（ADR-023）；`AppError.httpStatus` 仅参考语义。

### 2. ErrorBody（失败详情对象）

- **Authority**: `api-standard.md` §4.2（已修订）
- **Fields**:

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `message` | `string` | 是 | 可展示的安全文案（不含 SQL/堆栈/内部路径） |
| `details` | `unknown` | 否 | 结构化错误数据：字段级错误数组、冲突元数据、重试秒数等 |

- **结构性约束**:
  - `VALIDATION_ERROR`: `details` 为字段级错误数组 `[{ field, issue, message }]`。
  - `STALE_VERSION_CONFLICT`: `details` 含 `{ current_version, provided_version }` 元数据。
  - `RATE_LIMITED` / `LOGIN_RATE_LIMITED` / `OTP_RATE_LIMITED`: `details` 含
    `{ retry_after_seconds }`。

### 3. 业务状态码词汇表 (Business Status Code Vocabulary)

- **Authority**: `docs/docs/developer/reference/architecture/applications/business-status-codes.md`（frozen）
- **属性**（每码）: `code`（`UPPER_SNAKE_CASE`）、`含义`、`http_ref`（日志/监控参考）、
  `前端处理动作`（frontend_kind）。
- **分组**（全部 50 + 3 码）:
  - 通用成功: `OK`
  - 通用失败: `UNAUTHENTICATED` `FORBIDDEN` `NOT_FOUND` `VALIDATION_ERROR`
    `STALE_VERSION_CONFLICT` `CONFLICT` `RATE_LIMITED` `LOGIN_RATE_LIMITED`
    `INTERNAL_ERROR` `INVALID_ARGUMENT` `INVALID_DATA` `INVALID_REQUEST`
    `PROVIDER_UNAVAILABLE`
  - Identity: `INVALID_CREDENTIAL` `ACCOUNT_DISABLED` `ACCOUNT_CLOSED`
    `SESSION_EXPIRED` `SESSION_REVOKED` `TOKEN_EXPIRED` `DEVICE_NOT_FOUND`
    `DEVICE_REVOKED` `DEVICE_OWNERSHIP_CONFLICT` `PHONE_ALREADY_BOUND`
    `PHONE_NOT_BOUND` `INVALID_PHONE` `IDENTITY_CONFLICT`
    `IDENTITY_EMPTY_PROFILE_UPDATE` `IDENTITY_REFERENTIAL_CONFLICT`
    `IDENTITY_REPOSITORY_FAILURE` `LEARNING_DIRECTION_IMMUTABLE`
  - OTP: `OTP_ALREADY_USED` `OTP_EXPIRED` `OTP_LOCKED` `OTP_INVALID`
    `OTP_RATE_LIMITED` `OTP_SECRET_INVALID` `BOOTSTRAP_ALREADY_COMPLETED`
  - Platform: `PLATFORM_INVALID_ARGUMENT` `PLATFORM_NOT_FOUND` `PLATFORM_CONFLICT`
    `FEATURE_FLAG_INVALID_SCOPE` `FEATURE_FLAG_RETIRED` `RUNTIME_CONFIG_INVALID_VALUE`
    `RUNTIME_CONFIG_KEY_UNREGISTERED` `RUNTIME_CONFIG_RETIRED`
    `RUNTIME_CONFIG_UNAVAILABLE` `APP_VERSION_MISMATCH`
    `APP_VERSION_INVALID_TRANSITION` `APP_VERSION_POLICY_UNAVAILABLE`
    `ANNOUNCEMENT_INVALID_TRANSITION` `REGION_INVALID` `REGION_RETIRED`
  - Operations: `OPERATOR_AUDIT_PERSISTENCE_FAILED` `AUTHENTICATION_UNAVAILABLE`
  - Content（内联 → 统一为 AppError 后入词汇表）: `UNICODE_CONFLICT`
    `ACTIVE_WORK_CONFLICT` `ILLEGAL_STATE_TRANSITION`

- **约束**:
  - 单一权威登记；新增码必须先登记后使用（FR-012）。
  - 前端以业务码为键映射 `ApiErrorKind`（FR-015）。

### 4. 前端错误对象 (Frontend ApiError)

- **Authority**: `apps/admin/src/api/errors/api-error.ts`（改造目标）、
  `apps/mobile/src/api/errors/errors.ts`（改造目标）
- **Fields**:

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `kind` | `ApiErrorKind` | `network/unauthorized/forbidden/not_found/validation/conflict/rate_limit/server/unknown` |
| `code` | `BusinessStatusCode` | 后端业务码（从信封 `code` 提取） |
| `message` | `string` | 用户可读文案 |
| `details` | `unknown` | 结构化错误数据 |
| `requestId` | `string \| null` | 信封顶层 `request_id`（对齐后端字段名） |
| `retryable` | `boolean` | 是否可自动重试 |

- **映射规则（FR-015）**: `code` → `kind` 字典：
  - `UNAUTHENTICATED` → `unauthorized`
  - `FORBIDDEN` → `forbidden`
  - `NOT_FOUND` → `not_found`
  - `VALIDATION_ERROR` → `validation`
  - `STALE_VERSION_CONFLICT` / `CONFLICT` / `PLATFORM_CONFLICT` / `DEVICE_OWNERSHIP_CONFLICT` →
    `conflict`
  - `RATE_LIMITED` / `LOGIN_RATE_LIMITED` / `OTP_RATE_LIMITED` → `rate_limit`
  - `INTERNAL_ERROR` → `server`
  - 其他业务码（如 `INVALID_CREDENTIAL`、`ACCOUNT_DISABLED`）→ `unknown` 但保留 `code`
    （前端可用 `code` 精确分支，`kind` 为兜底）
  - `requestId` 恒从信封顶层 `request_id` 取（消除 `requestId` 漂移，FR-016）

---

## 状态转移 (State Machine)

> 本功能无数据库生命周期实体；以下为**信封演进**与**前端会话处理**状态机
> （源自 spec，指导测试与兼容性边界）。

### 信封演进 (Envelope Evolution)

- **States**: `documented`(api-standard 声明)→ `implemented`(代码统一)→
  `live`(客户端全部切换)→ `legacy_removed`(兼容期结束)
- **Initial**: `implemented`（ADR-023 已批准、文档已回写）
- **Terminal**: `legacy_removed`
- **Transitions**:

| From | To | Guard | Event |
| --- | --- | --- | --- |
| documented | implemented | ADR-023 已批准 | 后端统一信封 + 前端解析收敛（本 feature） |
| implemented | live | Admin/Mobile 客户端全部按 `code` 判定 | 同步切版上线 |
| live | legacy_removed | 无存量旧客户端依赖 HTTP 状态码 | 兼容期结束摘除 |

### 前端会话处理 (Client Session Handling under Business Codes)

- **States**: `authenticated` → `handling_expired` → `refreshing` → `retrying` → `signed_out`
- **Initial**: `authenticated`
- **Terminal**: `signed_out`
- **Transitions**（以 `code: UNAUTHENTICATED` 为触发）:

| From | To | Guard | Event |
| --- | --- | --- | --- |
| authenticated | handling_expired | 收到 `code: UNAUTHENTICATED` 且可刷新 | 业务码触发刷新流程 |
| handling_expired | refreshing | 刷新令牌存在 | 发起刷新 |
| refreshing | retrying | 刷新成功 | 重放原请求一次 |
| refreshing | signed_out | 刷新失败或不可用 | 清除会话 |
| retrying | authenticated | 重放成功 | 继续业务 |
| retrying | signed_out | 重放仍 `UNAUTHENTICATED` | 清除会话 |

---

## 索引与约束总结

| 对象 | 约束 |
| --- | --- |
| 统一信封 | 成功 `code=OK`+`data`；失败 `code≠OK`+`error`；`request_id` 恒存在；HTTP 200 |
| ErrorBody | `message` 必填可展示；`details` 结构化（校验数组/冲突元数据/重试秒数） |
| 业务状态码 | `UPPER_SNAKE_CASE`；单一登记；新增先登记 |
| 前端 ApiError | 以业务码为键映射 kind；`requestId` 从顶层 `request_id` 取 |

> 无新表、无迁移、无索引。本数据模型为线缆契约，落点在代码类型 + 权威文档，
> 不触碰任何数据库冻结边界。
