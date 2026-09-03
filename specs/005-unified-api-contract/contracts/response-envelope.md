# Contract: 统一响应信封 (Unified Response Envelope)

**Feature Branch**: `005-unified-api-contract` | **Date**: 2026-09-03

> **目标契约（ADR-023 已批准）**：所有业务 API 响应 HTTP 一律 **200**，成败由响应体
> 顶层 `code` 权威表达。权威文档：[api-standard.md](/docs/docs/developer/reference/architecture/applications/api-standard.md) §4、
> [business-status-codes.md](/docs/docs/developer/reference/architecture/applications/business-status-codes.md)。
> 落点：`apps/backend/src/errors/error-handler.ts`（错误）+ `http/response-envelope.ts`
> （成功，onSend 包裹）。

## 信封外形

```text
{ "code": <BusinessStatusCode>, "data"?: <payload>, "error"?: <ErrorBody>, "request_id": <string> }
```

## 成功响应

### 单实体
```json
{
  "code": "OK",
  "data": {
    "feature_flag": {
      "key": "audio_tts_enabled",
      "name": "Audio TTS",
      "status": "active"
    }
  },
  "request_id": "req-9f3a8b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c"
}
```

### 列表
```json
{
  "code": "OK",
  "data": {
    "items": [
      { "operator_id": "0191753c-7c00-7000-8000-000000000001", "username": "auditor_bob" }
    ],
    "pagination": { "page": 1, "page_size": 20, "total": 128, "total_pages": 7 }
  },
  "request_id": "req-9f3a8b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c"
}
```

### 无返回体操作（原 204）
```json
{
  "code": "OK",
  "data": null,
  "request_id": "req-9f3a8b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c"
}
```

## 错误响应（HTTP 一律 200）

### 校验失败
```json
{
  "code": "VALIDATION_ERROR",
  "error": {
    "message": "Request validation failed",
    "details": [
      { "field": "username", "issue": "unique_violation", "message": "Username already in use" }
    ]
  },
  "request_id": "req-9f3a8b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c"
}
```

### 未认证（认证前失败也携带 request_id）
```json
{
  "code": "UNAUTHENTICATED",
  "error": { "message": "Authentication required" },
  "request_id": "req-9f3a8b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c"
}
```

### 乐观锁冲突
```json
{
  "code": "STALE_VERSION_CONFLICT",
  "error": {
    "message": "The configuration has been modified by another operator.",
    "details": { "current_version": 4, "provided_version": 3 }
  },
  "request_id": "req-11223344"
}
```

### 频控
```json
{
  "code": "LOGIN_RATE_LIMITED",
  "error": { "message": "Too many login attempts", "details": { "retry_after_seconds": 60 } },
  "request_id": "req-9f3a8b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c"
}
```

## 不变量

1. `code === "OK"` ⇔ 成功：`error` 不存在，`data` 存在（可为 `null`）。
2. `code !== "OK"` ⇔ 失败：`error` 存在，`data` 不存在。
3. `request_id` **始终存在**（含认证前失败）。
4. HTTP 状态码一律 **200**（`/health/*` 豁免）。
5. `data` 内载荷结构与现状接口一致（不改变资源字段语义）。

## 豁免

- `/health/live`、`/health/ready`：L7 探针，保持 `status: 'ok'` / 503，不套信封。
- 传输层非 200（网关 502/429 等）：不在本契约范围内，前端保留兜底映射。

## 落点

| 端 | 文件 | 变更 |
| --- | --- | --- |
| 后端错误 | `apps/backend/src/errors/error-handler.ts` | 输出 `{ code, error, request_id }`，HTTP 200 |
| 后端成功 | `apps/backend/src/http/response-envelope.ts`（新增） | onSend 包裹 `{ code:"OK", data, request_id }`，HTTP 200，`/health/*` 豁免 |
| Admin | `apps/admin/src/api/client/http-client.ts` | 解析信封，`code` 判定 |
| Mobile | `apps/mobile/src/api/client/httpClient.ts` | 解析信封，`code` 判定 |
| 文档 | `api-standard.md` / `business-status-codes.md` | 已前置回写 |
