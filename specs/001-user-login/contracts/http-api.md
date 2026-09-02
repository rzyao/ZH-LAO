# Interface Contract: 用户登录与会话 HTTP API

**Feature Branch**: `001-user-login` | **Date**: 2026-09-02 | **Authority**: `docs/docs/developer/reference/contracts/identity/IDENTITY_API.md`

所有端点均挂载在统一前缀 `/api/v1/identity` 下，请求与响应采用 `application/json`，键命名采用 `snake_case`，时间字段采用 ISO 8601 UTC 字符串格式。

---

## 1. 申请手机号验证码 (`POST /api/v1/identity/phone-otp`)

- **Auth**:
  - `purpose = "login"`: 公开访问（Public，无须 Token）。
  - `purpose IN ("bind_phone", "change_phone")`: 需要有效 Bearer Access Token。
- **Headers**:
  - `Content-Type: application/json`
  - `x-request-id`: (可选) 追踪请求 ID
- **Request Body**:
  ```json
  {
    "phone": "+8562012345678",
    "purpose": "login"
  }
  ```
- **Validation**:
  - `phone`: 必须能被规范解析为 E.164。
  - `purpose`: 枚举值之一 `["login", "bind_phone", "change_phone"]`。
- **Success Response (200 OK)**:
  ```json
  {
    "status": "accepted",
    "retry_after_seconds": 60
  }
  ```
  *(注：防账号枚举设计，无论该手机号是否已在平台注册，均返回此统一响应)*
- **Errors**:
  - `400 VALIDATION_ERROR` / `INVALID_PHONE`: 号码格式不符合 E.164 或字段缺失。
  - `401 UNAUTHENTICATED`: 访问需要登录保护的用途时缺少有效凭证。
  - `429 OTP_RATE_LIMITED`: 触发重发冷却时间（60秒内）或达到频控上限（30分钟5次/24小时10次/IP限制）。
  - `503 PROVIDER_UNAVAILABLE`: 短信通道故障发送失败。

---

## 2. 手机验证码认证登录/注册 (`POST /api/v1/identity/auth/phone`)

- **Auth**: 公开访问（Public）。
- **Request Body**:
  ```json
  {
    "phone": "+8562012345678",
    "otp_code": "123456",
    "learning_direction": {
      "native_language": "lo",
      "learning_language": "zh"
    },
    "device": {
      "installation_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "platform": "android",
      "device_name": "Xiaomi 13",
      "app_version": "1.0.0",
      "push_token": "fcm-push-token-sample"
    }
  }
  ```
- **Validation Rules**:
  - `phone`: E.164 格式字符串。
  - `otp_code`: 严格 6 位纯数字字符串。
  - `learning_direction`: 新用户必填，老用户可选；只能为 `{"native_language": "lo", "learning_language": "zh"}` 或 `{"native_language": "zh", "learning_language": "lo"}`。若老用户传入且与现有档案冲突，返回 409。
  - `device`: 可选；如果提供，`installation_id` 必须为合法 UUID，`platform` 必须为 `"android"` 或 `"ios"`。
- **Success Response (200 OK)**:
  - Headers: `Cache-Control: no-store`, `Pragma: no-cache`
  ```json
  {
    "user_id": "4b6b6ec0-9099-4c22-b5e8-323bdf114620",
    "account_status": "active",
    "is_new_user": false,
    "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
    "token_type": "Bearer",
    "expires_in": 900,
    "refresh_token": "rt_01h9a4k4...",
    "session_expires_at": "2026-10-02T14:30:00.000Z"
  }
  ```
- **Errors**:
  - `400 VALIDATION_ERROR`: 请求体不满足结构约束。
  - `401 OTP_INVALID`: 验证码错误。
  - `401 OTP_EXPIRED`: 验证码已过期（超过5分钟）。
  - `401 OTP_LOCKED`: 累计错误达到 5 次，挑战已锁定。
  - `401 OTP_ALREADY_USED`: 该挑战已被消费。
  - `403 ACCOUNT_DISABLED`: 账号已被封禁/禁用。
  - `403 ACCOUNT_CLOSED`: 账号已关闭销毁。
  - `409 LEARNING_DIRECTION_IMMUTABLE`: 老用户尝试更改已绑定的学习方向。

---

## 3. 第三方 Facebook 认证登录/注册 (`POST /api/v1/identity/auth/facebook`)

- **Auth**: 公开访问（Public）。
- **Request Body**:
  ```json
  {
    "credential": "fb_oauth_token_or_access_token_string",
    "learning_direction": {
      "native_language": "zh",
      "learning_language": "lo"
    },
    "device": {
      "installation_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "platform": "ios"
    }
  }
  ```
- **Success Response (200 OK)**: 响应体与手机号登录完全一致（包含 `user_id`, `access_token`, `refresh_token` 等）。
- **Errors**:
  - `401 INVALID_CREDENTIAL`: Facebook 凭据验证失败。
  - `403 ACCOUNT_DISABLED` / `ACCOUNT_CLOSED`: 账户状态异常。
  - `503 PROVIDER_UNAVAILABLE`: Facebook 校验服务暂时不可用。

---

## 4. 刷新会话与凭证轮换 (`POST /api/v1/identity/sessions/refresh`)

- **Auth**: Public，凭 Refresh Token 本身认证。
- **Request Body**:
  ```json
  {
    "refresh_token": "rt_01h9a4k4..."
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
    "token_type": "Bearer",
    "expires_in": 900,
    "refresh_token": "rt_new_token_77a...",
    "session_expires_at": "2026-10-02T15:00:00.000Z"
  }
  ```
  *(注：旧 Refresh Token 立即废弃，返回全新轮换生成的 Refresh Token，会话到期时间顺延 30 天)*
- **Errors**:
  - `401 INVALID_CREDENTIAL`: Token 无效、已过期、已轮换作废或会话已被撤销。
  - `403 ACCOUNT_DISABLED` / `ACCOUNT_CLOSED`: 账户被停用。

---

## 5. 当前会话主动退出 (`POST /api/v1/identity/sessions/logout`)

- **Auth**: 凭 Refresh Token 撤销。
- **Request Body**:
  ```json
  {
    "refresh_token": "rt_new_token_77a..."
  }
  ```
- **Success Response (204 No Content)**: 空响应体。
- **Idempotency**: 无论该会话此前是否已撤销，均返回 204，保持幂等与安全。

---

## 6. 全端设备会话登出 (`POST /api/v1/identity/sessions/logout-all`)

- **Auth**: 需持有有效 Bearer Access Token。
- **Request Body**: 无需 Body。
- **Success Response (204 No Content)**: 空响应体。
- **Side Effect**: 将当前用户的所有 `active` 会话在数据库事务中批量置为 `revoked`。
