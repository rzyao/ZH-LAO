# Contract: 前端错误模型 (Frontend Error Model — Business-Code Keyed)

**Feature Branch**: `005-unified-api-contract` | **Date**: 2026-09-03

> **目标契约（ADR-023 已批准）**：前端以响应体顶层 `code`（业务状态码）判定成败，
> 错误映射表以业务码为键（而非 HTTP 状态码）。`request_id` 字段名三端统一。
> 权威词汇表：[business-status-codes.md](/docs/docs/developer/reference/architecture/applications/business-status-codes.md)。
> 落点：`apps/admin/src/api/errors/`、`apps/mobile/src/api/errors/`。

## Admin ApiError

```ts
export type ApiErrorKind =
  | 'network' | 'unauthorized' | 'forbidden' | 'not_found'
  | 'validation' | 'conflict' | 'rate_limit' | 'server' | 'unknown'

export interface ApiError {
  kind: ApiErrorKind
  code: string          // 后端业务码（UPPER_SNAKE_CASE），如 'UNAUTHENTICATED'
  message: string       // 用户可读文案
  details?: unknown     // 结构化错误数据
  requestId: string | null  // 信封顶层 request_id
  retryable: boolean
}
```

## 业务码 → kind 映射字典（FR-015）

| 业务码 | kind | 说明 |
| --- | --- | --- |
| `UNAUTHENTICATED` | `unauthorized` | 触发登录失效处理 |
| `FORBIDDEN` | `forbidden` | 无权限提示，不触发登录失效 |
| `NOT_FOUND` | `not_found` | 资源不存在 |
| `VALIDATION_ERROR` | `validation` | 字段级错误定位表单 |
| `STALE_VERSION_CONFLICT` / `CONFLICT` / `PLATFORM_CONFLICT` / `DEVICE_OWNERSHIP_CONFLICT` | `conflict` | 冲突提示 |
| `RATE_LIMITED` / `LOGIN_RATE_LIMITED` / `OTP_RATE_LIMITED` | `rate_limit` | 重试倒计时 |
| `INTERNAL_ERROR` | `server` | 通用错误 + request_id 上报 |
| 其他（`INVALID_CREDENTIAL`、`ACCOUNT_DISABLED` 等） | `unknown`（保留 code） | 前端可用 code 精确分支 |

## 解析规则（Admin & Mobile 一致）

1. HTTP 200 + body 为信封：
   - `code === "OK"` → 成功，解包 `data`。
   - `code !== "OK"` → 按映射字典构造 `ApiError`；`requestId = body.request_id`。
2. 传输层非 200（网关 502/429 等）→ 保留现有兜底映射（`mapNetworkError` / 按状态）。
3. `request_id` 恒从信封顶层取（消除 `requestId` vs `request_id` 漂移，FR-016）。
4. 未认证（`code: UNAUTHENTICATED`）→ 触发会话刷新/登出（US-003-AS1）。

## Mobile 对齐

Mobile `mapHttpError` / `mapHttpFailure` 目前按 HTTP 状态 switch；改为：若 `status===200`
且 body 为信封，按 `code` 映射；否则保留状态兜底。`extractRequestId` / `extractServerMessage`
可简化为读顶层 `request_id` / `error.message`（信封统一后）。

## 落点

| 端 | 文件 | 变更 |
| --- | --- | --- |
| Admin | `apps/admin/src/api/errors/index.ts` | `mapHttpError` 改为 `mapBusinessCode` 字典 |
| Admin | `apps/admin/src/api/errors/api-error.ts` | `ApiError` 以 `code` 为主键；`ApiErrorBody` 对齐 `request_id` |
| Admin | `apps/admin/src/api/contracts/error.ts` | `ApiErrorBody` 字段与后端对齐 |
| Mobile | `apps/mobile/src/api/errors/mapHttpError.ts` | 业务码 switch + 状态兜底 |
| Mobile | `apps/mobile/src/api/client/httpClient.ts` | 信封解析 + `code` 判定 |
