# Quickstart: 前后端统一请求格式与业务状态码 (005-unified-api-contract)

**Feature Branch**: `005-unified-api-contract` | **Date**: 2026-09-03 | **Spec**: [spec.md](./spec.md)

> ✅ 本功能已获 **ADR-023**（frozen）+ **D-156**（frozen）批准；实施前置（api-standard.md
> 修订、business-status-codes.md 词汇表、契约快照回写）已完成。本指南提供可运行的
> 端到端验证场景。详细数据模型见 [data-model.md](./data-model.md)，接口契约见
> [contracts/response-envelope.md](./contracts/response-envelope.md) 与
> [contracts/frontend-error-model.md](./contracts/frontend-error-model.md)。

## 前置条件

- 后端 `apps/backend`、Admin `apps/admin`、Mobile `apps/mobile` 可本地启动。
- 数据库已迁移（本功能**无新迁移**）。
- 无新权限点（本功能不新增 RBAC key）。

## 实施要点（非代码）

1. 后端成功信封：`http/response-envelope.ts`（onSend 包裹 `{ code:"OK", data, request_id }`）。
2. 后端错误信封：`error-handler.ts` 输出 `{ code, error, request_id }`，HTTP 200。
3. 业务状态码：`errors/business-codes.ts` 导出枚举 + TS 类型；Content 内联码改 AppError。
4. Admin / Mobile：以 `code` 判定成败，错误映射表以业务码为键。
5. 同步切版：后端 + 两客户端同一发版窗口上线。

## 验证场景

### 场景 1: 成功响应统一信封 (FR-001/FR-002)

**运行**: 后端启动后，调用任一成功接口。

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:PORT/api/v1/admin/platform/feature-flags
```

**预期**: HTTP **200**，响应体为
`{ "code": "OK", "data": { "items": [...] }, "request_id": "..." }`。
`data` 内载荷与改造前一致（`items` 数组）。

---

### 场景 2: 无返回体操作 → code OK + data null (FR-003)

**运行**: 调用原 204 操作（如删除 feature-flag override）。

**预期**: HTTP 200 + `{ "code": "OK", "data": null, "request_id": "..." }`，前端不报错。

---

### 场景 3: 错误响应统一信封 + HTTP 200 (FR-004/FR-005)

**运行**: 未带 token 调用受保护接口。

**预期**: HTTP **200** + `{ "code": "UNAUTHENTICATED", "error": { "message": "..." }, "request_id": "..." }`。
`request_id` 存在（认证前失败也携带）。

---

### 场景 4: 校验失败 → VALIDATION_ERROR (FR-009)

**运行**: 传非法参数（如 feature-flag key 含大写）。

**预期**: HTTP 200 + `code: "VALIDATION_ERROR"`，`error.details` 为字段级错误数组。

---

### 场景 5: 乐观锁冲突 → STALE_VERSION_CONFLICT (FR-008)

**运行**: 用过期 `expected_updated_at` 提交 PATCH。

**预期**: HTTP 200 + `code: "STALE_VERSION_CONFLICT"`，`error.details` 含当前/请求版本。

---

### 场景 6: 频控 → RATE_LIMITED / LOGIN_RATE_LIMITED (FR-010)

**运行**: 连续多次登录失败。

**预期**: HTTP 200 + `code: "LOGIN_RATE_LIMITED"`，`error.details.retry_after_seconds` 存在。

---

### 场景 7: Admin 前端以 code 判定 (FR-013/FR-015)

**运行**: 触发一次 401（登录失效）。

**预期**: 前端收到 `code: "UNAUTHENTICATED"` → 清除会话、跳转登录；`requestId` 从信封
顶层 `request_id` 取到。不再依赖 HTTP 401 判定。

---

### 场景 8: Mobile 前端以 code 判定 (FR-014)

**运行**: Mobile 触发一次 403（权限不足）。

**预期**: Mobile 收到 `code: "FORBIDDEN"` → 展示无权限提示，不触发登录失效。与 Admin
一致的信封解析。

---

### 场景 9: Content 内联错误码统一 (FR-012)

**运行**: 触发 Content 域 `UNICODE_CONFLICT`（唯一键冲突）。

**预期**: 不再返回 `{ error: 'UNICODE_CONFLICT', message }`，而是统一信封
`{ code: "UNICODE_CONFLICT", error: { message }, request_id }`。

---

### 场景 10: 健康检查豁免 (FR-017)

**运行**: `curl http://localhost:PORT/health/live`。

**预期**: `{ "status": "ok" }`（不套信封）；`/health/ready` 故障时保持 503（摘流语义）。

---

### 场景 11: 同步切版发布检查 (FR-020/Assumptions)

**运行**: 上线后检查版本。

**预期**: 后端 + Admin + Mobile 同一发版窗口；无旧客户端依赖 HTTP 状态码残留
（版本检查/灰度观察）。

---

## 测试命令汇总

| 验证 | 命令/操作 | 预期 |
| --- | --- | --- |
| 成功信封 | `GET /platform/feature-flags` | HTTP 200 + code OK + data |
| 无返回体 | 原 204 操作 | code OK + data null |
| 未认证 | 无 token 访问 | HTTP 200 + code UNAUTHENTICATED + request_id |
| 校验失败 | 非法参数 | code VALIDATION_ERROR + details |
| 乐观锁 | 过期 expected_updated_at | code STALE_VERSION_CONFLICT |
| 频控 | 多次失败 | code LOGIN_RATE_LIMITED + retry_after_seconds |
| Admin 判定 | 401 场景 | code 判定 + requestId 对齐 |
| Mobile 判定 | 403 场景 | code 判定 |
| Content 内联 | UNICODE_CONFLICT | 统一信封 |
| 健康检查 | /health/live | status ok 不套信封 |
| 切版 | 上线检查 | 三端同步 |

## 风险提示

- 本功能为跨端契约改造，**同步切版**是硬性要求；新旧配对会导致故障。
- 全量错误码迁移回归面广；契约测试必须逐码断言。
- `/health/*` 必须豁免，否则负载均衡摘流失效。
