# Interface Contract: 后台管理员认证/会话 HTTP API

**Feature Branch**: `003-admin-login` | **Date**: 2026-09-03 | **Authority**: `apps/backend/src/modules/identity/http/routes.ts`、`apps/backend/src/modules/operations/http/routes.ts`、`docs/docs/developer/reference/contracts/`

所有端点挂载在统一前缀 `/api/v1` 下，请求与响应采用 `application/json`，键命名采用 `snake_case`，时间字段采用 ISO 8601 UTC 字符串格式。错误响应统一为 `{ "error": { "code", "message", "details"? } }`。

> **已存在（LOCKED，仅引用不改动）**: 登录、刷新、退出、`/me` 端点。**新增（本规格定义）**: `POST /api/v1/admin/auth/change-password`。

---

## 1. 管理员登录 (`POST /api/v1/admin/auth/login`) — 已存在

- **Auth**: 公开访问（Public）。
- **Request Body**:
  ```json
  { "username": "admin", "password": "..." }
  ```
- **Validation**: `username` trim 后 1..100；`password` 1..200。
- **Success Response (200 OK)**:
  ```json
  {
    "user_id": "uuid",
    "access_token": "JWT",
    "token_type": "Bearer",
    "expires_in": 900,
    "refresh_token": "opaque",
    "session_expires_at": "ISO8601"
  }
  ```
- **Errors**:
  - `401 INVALID_CREDENTIAL`: 用户名不存在或密码错误（防枚举，统一响应）。
  - `403 ACCOUNT_DISABLED` / `ACCOUNT_CLOSED`: 账户状态受限。
  - `429 LOGIN_RATE_LIMITED`: 触发登录失败频控（新增，见 §6）。
- **登录成功审计**: 写 `operator_audit_logs`，`action_key = 'identity.admin.login'`（目标 operator，含 request context，details 无敏感字段）。登录失败不写 Audit，进入安全日志。

---

## 2. 获取当前操作员 (`GET /api/v1/admin/operations/me`) — 已存在

- **Auth**: Bearer Access Token（`requireAuthentication`）。
- **Success Response (200 OK)**:
  ```json
  {
    "operator": {
      "operator_id": "uuid",
      "display_name": "string",
      "status": "active",
      "roles": [ { "role_id": "uuid", "code": "string", "name": "string" } ],
      "permissions": ["operations.operators.read", "..."]
    }
  }
  ```
- **Errors**: `401 UNAUTHENTICATED`；`403 OPERATOR_ACCESS_DENIED`（无 operator 映射）/ `403 OPERATOR_DISABLED`。

---

## 3. 会话刷新与令牌轮换 (`POST /api/v1/identity/sessions/refresh`) — 已存在

- **Auth**: 公开（凭 refresh token 认证）。
- **Request Body**:
  ```json
  { "refresh_token": "opaque" }
  ```
- **Success Response (200 OK)**: 新的 `access_token`、`refresh_token`（旧 token 立即失效）、`session_expires_at`（滑动 30 天）。
- **Errors**:
  - `401 INVALID_CREDENTIAL`: token 无效。
  - `401 SESSION_REVOKED` / `SESSION_EXPIRED`: 会话被撤销/过期。
  - `403 ACCOUNT_DISABLED` / `ACCOUNT_CLOSED`: 账户状态受限。
- **强制轮换**: 每次刷新签发新 refresh token 并使旧 token 失效（FR-007）。
- **刷新成功审计**: 管理员/操作员会话刷新成功写 `operator_audit_logs`，`action_key = 'identity.admin.refresh'`（新审计值，代码定义，无迁移）；失败进安全日志，不写 Audit。

---

## 4. 退出当前会话 (`POST /api/v1/identity/sessions/logout`) — 已存在

- **Auth**: 公开（凭 refresh token 认证）。
- **Request Body**:
  ```json
  { "refresh_token": "opaque" }
  ```
- **Success Response**: `204 No Content`。
- **效果**: 将会话置为 `revoked`，`revocation_reason = 'logout'`，刷新令牌立即失效（FR-012）。
- **退出审计**: 写 `operator_audit_logs`，`action_key = 'identity.admin.logout'`。

---

## 5. 修改管理员密码 (`POST /api/v1/admin/auth/change-password`) — 新增

- **Auth**: Bearer Access Token（`requireAuthentication`）。
- **Request Body**:
  ```json
  { "current_password": "string", "new_password": "string" }
  ```
- **Validation**:
  - `current_password`: 1..200。
  - `new_password`: 8..128，至少含一个字母与一个数字；不得与 `current_password` 相同。
- **Success Response (200 OK)**:
  ```json
  { "status": "changed", "session_revoked": true }
  ```
- **Effects**:
  - 校验当前密码正确性；失败返回 `401 INVALID_CREDENTIAL`。
  - 更新 `identity.admin_credentials.password_hash`（scrypt 新 salt）。
  - 将当前用户所有活跃会话置为 `revoked`（`revocation_reason = 'password_changed'`），强制重新登录。
  - 写 `operator_audit_logs`，`action_key = 'identity.admin_password.change'`（details 不含任何密码字段）。
- **Errors**:
  - `400 VALIDATION_ERROR`: 新密码强度不足或与当前相同。
  - `401 INVALID_CREDENTIAL`: 当前密码错误。
  - `401 UNAUTHENTICATED`: 缺少有效访问令牌。

---

## 6. 登录失败频控（新增，行为约束）

- 连续失败 `>= 5` 次（同一 `username`）或 `>= 20` 次（同一 IP）→ HTTP `429 LOGIN_RATE_LIMITED`，冷却窗口默认 5 分钟。
- 成功登录清零对应失败计数。
- 频控状态在单进程内存令牌桶（当前单容器部署）；水平扩展时升级为 DB/网关计数（deferred，不阻塞 v1）。
- 频控触发进安全日志（含 `request_id`、IP、原因码），不写 Audit。

---

## 错误码速查

| 场景 | HTTP | Code |
| --- | --- | --- |
| 凭据无效（防枚举） | 401 | `INVALID_CREDENTIAL` |
| 账户禁用/关闭 | 403 | `ACCOUNT_DISABLED` / `ACCOUNT_CLOSED` |
| 未认证 | 401 | `UNAUTHENTICATED` |
| 无 operator 映射 / 操作员禁用 | 403 | `OPERATOR_ACCESS_DENIED` / `OPERATOR_DISABLED` |
| 会话被撤销/过期 | 401 | `SESSION_REVOKED` / `SESSION_EXPIRED` |
| 令牌过期 | 401 | `TOKEN_EXPIRED` |
| 登录频控 | 429 | `LOGIN_RATE_LIMITED` |
| 校验失败 | 400 | `VALIDATION_ERROR` / `INVALID_ARGUMENT` |
