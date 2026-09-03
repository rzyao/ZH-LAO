---
status: audited
phase: 2
phase_name: Identity Domain
document: IDENTITY_API
last_updated: 2026-09-03
depends_on:
  - FOUNDATION_GATE = PASS
  - IDENTITY_IMPLEMENTATION_PLAN.md
  - IDENTITY_USE_CASES.md
database_authority:
  - database/migrations/0100_identity.sql
  - database/migrations/1220_identity_auth_runtime.sql
next_step: Identity Design Audit
lifecycle: historical
derived_from: domains/identity/database.md
---

> 迁移说明：本文是迁移时保留的契约/证据快照，不是当前调度权限。当前产品状态请看 [ZH-LAO 产品开发全景](/developer/)，执行规格请看 `.specify/` 与 `specs/`，真实完成请以代码、测试与 CI 为准。
>
> **契约修订 (ADR-023, 2026-09-03)**：所有业务响应 HTTP 一律 **200**，成败由响应体顶层 `code`（业务状态码）权威表达；原 HTTP 状态码（200/204/400/401/403/404/409/429/500/503）仅作日志/监控参考语义。无返回体操作（原 204）→ `{ "code": "OK", "data": null, "request_id": "..." }`。统一信封与词汇表见 [api-standard.md](/developer/reference/architecture/applications/api-standard.md) 与 [business-status-codes.md](/developer/reference/architecture/applications/business-status-codes.md)。已按此修订 §7 HTTP Status Mapping 与错误包体示例。

# ZH-LAO  — IDENTITY API

⚠️ **派生文档（DERIVED）** — 规范归属（canonical owner）：`domains/identity/database.md`。本文件为实现轨（implementation-track）文档，**不是产品/领域事实权威**（Constitution 原则 II）。产品/领域事实以规范归属文档为准，请勿在此重复或自行修改事实。

> 目标路径：`docs/docs/developer/reference/contracts/identity/IDENTITY_API`
>
> 本文冻结 PHASE 2 — Identity Domain 的 HTTP API Contract。
>
> API 必须由 `IDENTITY_USE_CASES.md` 推导，不从数据库表生成 CRUD。
>
> 本文不进入编码、不修改数据库、不修改 frozen migration。

---

# 1. 文档结论

当前 Identity API Contract 已具备进入最终设计审计的条件：

```text
IDENTITY_API_STATUS = AUDITED / READY_FOR_IMPLEMENTATION
IDENTITY_IMPLEMENTATION_STARTED = NO
```

下一步：

```text
Identity Design Audit
→ IDENTITY_DESIGN_GATE
```

只有：

```text
IDENTITY_DESIGN_GATE = PASS
```

才允许开始 Identity 编码。

---

# 2. API 总原则

Identity API 必须遵守：

1. Base prefix：

```text
/api/v1/identity
```

2. JSON 请求/响应统一使用：

```text
snake_case
```

3. 所有时间使用 ISO 8601 UTC 字符串。
4. 所有跨 Domain / Public User ID 使用 UUID。
5. 不暴露：
   - users.id
   - sessions.id
   - devices.id
6. 不直接暴露数据库结构。
7. 不允许通用 CRUD。
8. 所有 protected endpoint 使用 Foundation AuthenticationProvider。
9. Access Token 通过：

```http
Authorization: Bearer <access_token>
```

10. Refresh Token 不放 URL、不放 query、不放日志。
11. V1 Refresh Token 通过 JSON body 传输。
12. 所有响应包含 Foundation `request_id` 语义。
13. 错误统一使用 Foundation Error Envelope。
14. Public authentication endpoints 必须避免账号枚举。
15. Rate limit 不依赖 Redis。
16. 所有 destructive/session revocation 操作必须 retry-safe。
17. API 不自动进入其他 Domain 行为。

---

# 3. API Versioning

V1 prefix：

```text
/api/v1/identity
```

Identity event version 与 HTTP API version 独立：

```text
identity.user_registered.v1
identity.account_status_changed.v1
```

未来 HTTP v2 不意味着 Event 自动升 v2。

---

# 4. Content Type

请求：

```http
Content-Type: application/json
```

响应：

```http
Content-Type: application/json
```

除健康检查外，Identity API 不使用 form-urlencoded。

---

# 5. Success Envelope

Identity API 不额外制造复杂通用 envelope。

成功响应直接返回资源/结果对象，例如：

```json
{
  "user_id": "uuid",
  "access_token": "...",
  "expires_in": 900
}
```

如果项目 Foundation 已冻结统一 success envelope，则实现必须服从 Foundation；否则本 Phase 不新增一层 `data` 包装。

---

# 6. Error Envelope

继续使用 Foundation 已冻结的错误结构（ADR-023 统一信封，HTTP 一律 200）。

语义示例：

```json
{
  "code": "OTP_INVALID",
  "error": {
    "message": "The verification code is invalid."
  },
  "request_id": "..."
}
```

规则：

- `code` 是稳定 machine-readable business status code（UPPER_SNAKE_CASE，见 [business-status-codes.md](/developer/reference/architecture/applications/business-status-codes.md)）；
- `error.message` 是安全、可面向用户的通用描述；
- `request_id` 顶层携带；
- 不包含 stack；
- 不包含 SQL；
- 不包含 provider response body；
- 不包含 OTP/token/hash；
- 不包含 internal BIGINT。

---

# 7. HTTP Status Mapping

> **ADR-023 (2026-09-03)**: 所有业务响应 HTTP 一律 **200**，成败由响应体顶层
> `code`（业务状态码）权威表达。原 HTTP 状态码仅作日志/监控参考语义。
> 完整词汇表见 [business-status-codes.md](/developer/reference/architecture/applications/business-status-codes.md)。

默认映射（HTTP 一律 200）：

| 语义 | 业务码 `code` | HTTP 参考 |
|---|---:|---:|
| 成功读取/更新 | `OK` | 200 |
| 创建类业务完成 | `OK` | 200 |
| 无响应体撤销类 | `OK` + `data: null` | 200（原 204） |
| Validation | `VALIDATION_ERROR` | 400 |
| Unauthenticated / invalid credential | `UNAUTHENTICATED` / `INVALID_CREDENTIAL` | 401 |
| Authenticated but forbidden | `FORBIDDEN` | 403 |
| Resource logically unavailable | `NOT_FOUND` | 404 |
| Conflict / ownership / duplicate | `CONFLICT` / `STALE_VERSION_CONFLICT` / `DEVICE_OWNERSHIP_CONFLICT` | 409 |
| Rate limited | `RATE_LIMITED` / `LOGIN_RATE_LIMITED` / `OTP_RATE_LIMITED` | 429 |
| Provider temporarily unavailable | `PROVIDER_UNAVAILABLE` | 503 |
| Unexpected server error | `INTERNAL_ERROR` | 500 |

Identity authentication API 不使用 `404 phone not found` 暴露账号存在性（对应业务码不返回 `NOT_FOUND`，而返回 `INVALID_CREDENTIAL`）。

---

# 8. Public Endpoint Inventory

```text
POST /api/v1/identity/phone-otp
POST /api/v1/identity/auth/phone
POST /api/v1/identity/auth/facebook
POST /api/v1/identity/sessions/refresh
POST /api/v1/identity/sessions/logout
```

---

# 9. Protected Endpoint Inventory

```text
POST   /api/v1/identity/sessions/logout-all
GET    /api/v1/identity/me
GET    /api/v1/identity/me/status
GET    /api/v1/identity/me/profile
PATCH  /api/v1/identity/me/profile
GET    /api/v1/identity/me/learning-profile
GET    /api/v1/identity/me/devices
DELETE /api/v1/identity/me/devices/{installation_id}
GET    /api/v1/identity/me/sessions
POST   /api/v1/identity/me/phone/bind
POST   /api/v1/identity/me/phone/change
```

注意：

```text
POST /phone/bind
POST /phone/change
```

消费此前通过 `POST /phone-otp` 创建的：

```text
bind_phone
change_phone
```

Challenge。

---

# 10. Deferred / Forbidden Endpoint Inventory

本 Phase 不设计 production endpoint：

```text
DELETE /me
POST /me/close
POST /me/disable
POST /me/enable
PATCH /me/learning-profile
DELETE /me/sessions/{internal_id}
DELETE /me/sessions/{session_id}
POST /me/facebook/bind
DELETE /me/facebook
POST /accounts/merge
POST /auth/password
POST /auth/google
POST /auth/apple
```

---

# 11. `POST /phone-otp`

对应：

```text
RequestPhoneOtp
```

## Auth

按 purpose：

- `login`：Public
- `bind_phone`：Bearer required
- `change_phone`：Bearer required

如果带 protected purpose 但无有效 Access Token：

```text
401 UNAUTHENTICATED
```

## Request

```json
{
  "phone": "+85620...",
  "purpose": "login"
}
```

purpose enum：

```text
login
bind_phone
change_phone
```

## Validation

- phone 必须可 normalization 成 E.164；
- purpose 必须合法；
- protected purpose 必须 authenticated；
- phone 长度/格式必须经过统一 PhoneNumber parser。

## Success

HTTP 200：

```json
{
  "status": "accepted",
  "retry_after_seconds": 60
}
```

不返回：

- challenge id
- OTP
- phone registered state
- user id

## Anti-Enumeration

无论 phone 当前是否已有 User：

`login` 成功请求使用同一 success shape。

## Errors

```text
INVALID_PHONE            400
UNAUTHENTICATED          401
FORBIDDEN                403
IDENTITY_CONFLICT        409
OTP_RATE_LIMITED         429
PROVIDER_UNAVAILABLE     503
```

bind/change 的 conflict 可以返回 409，因为用户已经 authenticated，不属于 public account enumeration。

## Rate Limit

采用 Use Case 冻结值：

```text
5 / 30m / phone / purpose
10 / 24h / phone / purpose
20 / 30m / IP
60s resend cooldown
```

服务端以 canonical `phone + purpose` 的 PostgreSQL transaction-scoped advisory lock 序列化 resend replacement；该实现细节确保并发请求不会生成多个有效 pending Challenge。IP 限制按部署边界执行，且不得依赖客户端提交的可伪造 IP 字段。

## Logging

仅记录：

- masked phone
- purpose
- request_id
- result

---

# 12. `POST /auth/phone`

对应：

```text
AuthenticateWithPhoneOtp
```

同时完成：

- OTP verify
- OTP consume
- login or registration
- Device
- Session
- token issue

## Auth

Public。

## Request

```json
{
  "phone": "+85620...",
  "otp_code": "123456",
  "learning_direction": {
    "native_language": "lo",
    "learning_language": "zh"
  },
  "device": {
    "installation_id": "uuid",
    "platform": "android",
    "device_name": "optional",
    "app_version": "optional",
    "push_token": "optional"
  }
}
```

## Existing User Rules

`learning_direction`：

- 可省略；
- 如果传入，不允许借此修改现有方向；
- 实现可忽略或要求其与现值一致；
- API Freeze 选择：**如果已有用户传入且与现值冲突，返回 409 `LEARNING_DIRECTION_IMMUTABLE`。**

## New User Rules

`learning_direction` 必填。

只允许：

```text
lo -> zh
zh -> lo
```

## Device

移动客户端正常应提供。

为兼容测试/特殊客户端：

```text
device = optional
```

如果提供，必须完整满足：

- installation_id UUID
- platform android/ios

## Success

HTTP 200：

```json
{
  "user_id": "uuid",
  "account_status": "active",
  "is_new_user": true,
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_token": "...",
  "session_expires_at": "2026-09-29T14:00:00Z"
}
```

## Errors

```text
INVALID_PHONE                    400
INVALID_LEARNING_DIRECTION       400
OTP_INVALID                      401
OTP_EXPIRED                      401
OTP_LOCKED                       401
OTP_ALREADY_USED                 401
ACCOUNT_DISABLED                 403
ACCOUNT_CLOSED                   403
IDENTITY_CONFLICT                409
LEARNING_DIRECTION_IMMUTABLE     409
DEVICE_OWNERSHIP_CONFLICT        409
```

## Security

- `otp_code` 不写日志；
- access/refresh 不写日志；
- 失败不返回“是否新用户”。

## Retry

同 Challenge 只允许一个成功。

客户端收到网络超时后重试可能得到 `OTP_ALREADY_USED`。

因此客户端不能假设 `OTP_ALREADY_USED` 表示业务一定失败；后续可通过重新 Request OTP 或本地已持有 tokens 的状态处理。

---

# 13. `POST /auth/facebook`

对应：

```text
AuthenticateWithFacebook
```

## Auth

Public。

## Request

```json
{
  "credential": "...",
  "learning_direction": {
    "native_language": "zh",
    "learning_language": "lo"
  },
  "device": {
    "installation_id": "uuid",
    "platform": "ios",
    "device_name": "optional",
    "app_version": "optional",
    "push_token": "optional"
  }
}
```

## Credential

API 不冻结 Facebook credential 的 provider-specific内部字段名称。

V1 对客户端只暴露一个 opaque：

```text
credential
```

Infrastructure adapter 负责解释/验证。

## New User

learning_direction 必填。

## Existing User

与 phone auth 相同：

- 不允许通过登录改学习方向；
- 冲突时 `LEARNING_DIRECTION_IMMUTABLE`。

## Success

与 phone auth 相同：

```json
{
  "user_id": "uuid",
  "account_status": "active",
  "is_new_user": false,
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_token": "...",
  "session_expires_at": "..."
}
```

## Errors

```text
INVALID_CREDENTIAL               401
ACCOUNT_DISABLED                 403
ACCOUNT_CLOSED                   403
INVALID_LEARNING_DIRECTION       400
LEARNING_DIRECTION_IMMUTABLE     409
DEVICE_OWNERSHIP_CONFLICT        409
IDENTITY_CONFLICT                409
PROVIDER_UNAVAILABLE             503
```

## Security

客户端不可传：

```text
facebook_user_id
provider_subject
```

作为可信身份字段。

---

# 14. `POST /sessions/refresh`

对应：

```text
RefreshSession
```

## Auth

不要求 Access Token。

Refresh Token 本身是 credential。

## Request

```json
{
  "refresh_token": "opaque-secret"
}
```

## Success

HTTP 200：

```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_token": "new-opaque-secret",
  "session_expires_at": "..."
}
```

成功后：

> 旧 Refresh Token 立即失效。

## Errors

Public response 统一尽量减少 session state 泄漏。

外部 API 建议映射：

```text
INVALID_CREDENTIAL 401
ACCOUNT_DISABLED   403
ACCOUNT_CLOSED     403
DEVICE_REVOKED     403
```

内部 domain error：

- SESSION_REVOKED
- SESSION_EXPIRED

可在 presenter 层统一映射为：

```text
INVALID_CREDENTIAL
```

避免攻击者探测 Session 精确状态。

## Concurrency

同旧 refresh token 最多一个 200。

## Logging

绝不记录 request body 中的 token。

---

# 15. `POST /sessions/logout`

对应：

```text
LogoutCurrentSession
```

## Auth

Refresh credential。

为了允许 Access Token 已过期后客户端仍主动清理 Session：

> 不要求有效 Access Token。

## Request

```json
{
  "refresh_token": "opaque-secret"
}
```

## Success

HTTP 204。

重复调用仍返回 204。

## Errors

Malformed request：

```text
400
```

不存在/已 revoke token：

> 仍返回 204，保持 retry-safe 并减少 credential probing。

## Logging

不得记录 refresh token。

---

# 16. `POST /sessions/logout-all`

对应：

```text
LogoutAllSessions
```

## Auth

Bearer Access Token required。

## Request

无 body。

## Success

HTTP 204。

## Semantics

当前 User 所有 active Refresh Sessions 被 revoke。

当前 Access Token 最多继续到 15 分钟 TTL。

---

# 17. `GET /me`

对应：

```text
GetCurrentIdentity
```

## Auth

Bearer required。

## Response

HTTP 200：

```json
{
  "user_id": "uuid",
  "status": "active",
  "auth_providers": [
    "phone",
    "facebook"
  ],
  "learning_profile": {
    "native_language": "lo",
    "learning_language": "zh"
  },
  "profile": {
    "display_name": null,
    "gender": null,
    "birth_date": null,
    "country_code": null,
    "region_code": null,
    "avatar_media_id": null
  }
}
```

## Privacy

不默认返回完整手机号。

如果未来 UI 需要 masked credential summary：

可追加：

```json
{
  "phone": {
    "bound": true,
    "masked": "+85620****1234"
  }
}
```

但不能返回 provider_subject 原始敏感值作为通用 identity summary。

---

# 18. `GET /me/status`

对应：

```text
GetCurrentAccountStatus
```

## Auth

Bearer required。

## Response

```json
{
  "status": "active"
}
```

由于 disabled/closed token 在 AuthenticationProvider 阶段已被拒绝：

public endpoint 正常只会返回 `active`。

保留此 endpoint 的意义：

- C 端显式读取账户状态契约；
- API 行为稳定；
- internal public contract 仍可读取其他状态。

---

# 19. `GET /me/profile`

对应：

```text
GetOwnBasicProfile
```

## Auth

Bearer required。

## Response

```json
{
  "display_name": null,
  "gender": null,
  "birth_date": null,
  "country_code": null,
  "region_code": null,
  "avatar_media_id": null
}
```

字段合法值/nullability 服从 frozen DB。

---

# 20. `PATCH /me/profile`

对应：

```text
UpdateOwnBasicProfile
```

## Auth

Bearer required。

## Request

只允许 whitelist：

```json
{
  "display_name": "optional",
  "gender": "optional",
  "birth_date": "optional",
  "country_code": "optional",
  "region_code": "optional",
  "avatar_media_id": "uuid-or-null"
}
```

## PATCH Semantics

- omitted = 不修改；
- explicit null = 清空（仅数据库允许 nullable 的字段）；
- 空 object → 400 validation。

## Forbidden Fields

如果客户端发送：

```text
user_id
status
native_language
learning_language
created_at
updated_at
```

必须 schema validation 拒绝。

## Avatar

若非 null：

- UUID；
- Asset contract 检查存在/可用；
- Identity 保存 logical UUID。

## Success

HTTP 200 返回更新后的 profile。

---

# 21. `GET /me/learning-profile`

对应：

```text
ReadLearningProfile
```

## Auth

Bearer required。

## Response

```json
{
  "native_language": "lo",
  "learning_language": "zh"
}
```

不存在 PATCH/PUT endpoint。

---

# 22. `GET /me/devices`

对应：

```text
ListMyDevices
```

## Auth

Bearer required。

## Query

V1 不分页。

理由：

单 User Device 数量天然小。

如未来数据量证明需要分页，再升级 API，不提前复杂化。

## Response

```json
{
  "items": [
    {
      "installation_id": "uuid",
      "platform": "android",
      "device_name": "Pixel",
      "app_version": "1.2.3",
      "first_seen_at": "...",
      "last_seen_at": "...",
      "revoked": false
    }
  ]
}
```

不返回：

- internal id
- full push_token

---

# 23. `DELETE /me/devices/{installation_id}`

对应：

```text
RevokeDevice
```

## Auth

Bearer required。

## Path Param

```text
installation_id = UUID
```

## Success

HTTP 204。

重复 revoke：

```text
204
```

## Ownership

不存在或不属于当前 User：

推荐统一：

```text
404
```

避免暴露其他 User 的 installation ownership。

## Semantics

同时 revoke 该 Device 下 active Sessions。

---

# 24. `GET /me/sessions`

对应：

```text
ListMySessions
```

## Auth

Bearer required。

## Response

当前 frozen schema 没有 Session public UUID。

因此返回：

```json
{
  "items": [
    {
      "device": {
        "installation_id": "uuid",
        "platform": "android",
        "device_name": "Pixel"
      },
      "status": "active",
      "last_active_at": "...",
      "expires_at": "..."
    },
    {
      "device": null,
      "status": "active",
      "last_active_at": "...",
      "expires_at": "..."
    }
  ]
}
```

## Important

不返回：

```text
session_id
```

也不返回 BIGINT。

列表只用于可视化当前登录状态。

每个 item 可额外返回 `created_at`（RFC 3339 UTC）用于显示和区分同一 Device 的多个 Session；它不是 session public ID，不能作为任何操作参数。

V1 不支持对无 Device Session 的任意单独 revoke。

---

# 25. Session Revocation API 决策

V1 不提供：

```text
DELETE /me/sessions/{session_id}
```

因为当前 frozen schema 无稳定 Session public UUID。

V1 支持：

```text
POST   /sessions/logout
POST   /sessions/logout-all
DELETE /me/devices/{installation_id}
```

三种撤销能力已经覆盖：

- 当前 session；
- 全部 sessions；
- 指定 device 下 sessions。

禁止用 internal BIGINT 暴露一个“临时 session API”。

---

# 26. `POST /me/phone/bind`

对应：

```text
BindPhone
```

## Auth

Bearer required。

## 前置

客户端先调用：

```text
POST /phone-otp
purpose=bind_phone
```

## Request

```json
{
  "phone": "+85620...",
  "otp_code": "123456"
}
```

## Success

HTTP 200：

```json
{
  "phone_bound": true
}
```

可选返回 masked phone：

```json
{
  "phone_bound": true,
  "masked_phone": "+85620****1234"
}
```

## Errors

```text
INVALID_PHONE        400
OTP_INVALID          401
OTP_EXPIRED          401
OTP_LOCKED           401
OTP_ALREADY_USED     401
PHONE_ALREADY_BOUND  409
IDENTITY_CONFLICT    409
ACCOUNT_DISABLED     403
ACCOUNT_CLOSED       403
```

## Security

不能返回“目标手机号属于哪个用户”。

请求中的 phone 必须与被消费 `bind_phone` Challenge 的 canonical phone 完全一致；服务端在消费 Challenge 前锁定当前 User，以保证同一 User 的并发 bind 不能建立多条 phone AuthIdentity。

---

# 27. `POST /me/phone/change`

对应：

```text
ChangePhone
```

## Auth

Bearer required。

## 前置

客户端：

```text
POST /phone-otp
purpose=change_phone
```

## Request

```json
{
  "new_phone": "+86138...",
  "otp_code": "123456"
}
```

## Success

HTTP 200：

```json
{
  "phone_changed": true
}
```

## Errors

```text
INVALID_PHONE        400
OTP_INVALID          401
OTP_EXPIRED          401
OTP_LOCKED           401
OTP_ALREADY_USED     401
PHONE_NOT_BOUND      409
IDENTITY_CONFLICT    409
ACCOUNT_DISABLED     403
ACCOUNT_CLOSED       403
```

## Semantics

更新当前 User 唯一 phone AuthIdentity。

不保留旧 phone identity。

`new_phone` 必须与被消费 `change_phone` Challenge 的 canonical phone 完全一致；服务端锁定当前 User 和当前 phone AuthIdentity，并将 `(provider, provider_subject)` unique conflict 映射为 `IDENTITY_CONFLICT`。

---

# 28. Authentication Header

Protected endpoint：

```http
Authorization: Bearer <access_token>
```

规则：

- Header 缺失 → 401
- 非 Bearer → 401
- malformed → 401
- invalid signature → 401
- expired → 401
- wrong issuer/audience → 401
- user not active → 403

外部 API 统一 error code：

```text
UNAUTHENTICATED
TOKEN_EXPIRED
ACCOUNT_DISABLED
ACCOUNT_CLOSED
```

可保留 `TOKEN_EXPIRED` 帮助客户端主动 refresh。

---

# 29. Refresh Token Transport

V1 冻结：

```text
JSON request/response body
```

不使用 Cookie。

原因：

- 当前 App 主要是 native/mobile client；
- 避免在 Phase 2 同时引入浏览器 CSRF/cookie policy 复杂度；
- 后续 Web 客户端如需要 HttpOnly Cookie，可另行定义 transport adapter，不改变 Session domain model。

安全要求：

- HTTPS only in production；
- body redaction；
- proxy/access log 不记录 body；
- token 不进 URL；
- token 不进 query；
- token 不进 analytics。

---

# 30. Token Response Cache Policy

所有包含 access/refresh token 的响应必须发送适当：

```http
Cache-Control: no-store
Pragma: no-cache
```

至少适用于：

```text
/auth/phone
/auth/facebook
/sessions/refresh
```

---

# 31. Request IDs

所有 Identity 请求继承 Foundation：

```text
x-request-id
```

响应错误必须包含 request_id。

成功响应可通过 response header 暴露 request id；不要求每个 success body 重复字段。

---

# 32. Validation

使用 Zod/Fastify schema。

要求：

- unknown fields 默认拒绝或 strip 的策略必须全 Identity 统一；
- V1 冻结：**请求 body 对未知字段采用 reject**；
- 防止客户端误传 internal 字段后被悄悄忽略。

字符串：

- trim 仅用于适合字段；
- OTP 不 trim 任意内部字符后容错；
- phone 由 PhoneNumber parser normalization；
- UUID 严格验证。

---

# 33. Pagination

V1：

```text
Devices = no pagination
Sessions = no pagination
```

理由：

正常用户数量很小。

禁止为“以后可能多”提前引入 cursor contract。

---

# 34. Date / Time Format

所有 API 时间：

```text
RFC 3339 / ISO 8601 UTC
```

示例：

```text
2026-08-30T14:20:00.000Z
```

birth_date：

```text
YYYY-MM-DD
```

不带 timezone。

---

# 35. Country / Region

`country_code`：

- API 按 frozen DB contract；
- 如文档未额外冻结，使用标准 uppercase country code；
- 不在 API 层扩展新的国家表依赖。

`region_code`：

- opaque domain string；
- 不在 Identity Phase 接入 Geographic service。

---

# 36. Gender

可接受值必须与 frozen DB CHECK/contract 完全一致。

API 不发明新 enum。

如果 migration 允许 null：

- null = 未设置。

---

# 37. Avatar Media ID

字段：

```text
avatar_media_id UUID | null
```

API 永远不接收：

```text
bucket
storage_key
provider
physical_url
```

上传流程不属于本 Identity API。

Identity 只接收已存在 Asset logical UUID。

---

# 38. Device Request Object

统一 schema：

```json
{
  "installation_id": "uuid",
  "platform": "android",
  "device_name": "optional",
  "app_version": "optional",
  "push_token": "optional"
}
```

platform：

```text
android
ios
```

V1 不加入：

```text
web
windows
macos
```

除非 frozen DB 已允许。

---

# 39. Installation ID Contract

`installation_id`：

- 客户端首次安装生成 UUID；
- 重启 App 不变化；
- logout 不变化；
- reinstall 可产生新 UUID；
- 不是 authentication credential；
- 不作为跨 User 自动匹配依据。

如果 installation_id 已归属于另一个 User：

```text
409 DEVICE_OWNERSHIP_CONFLICT
```

---

# 40. Push Token API Policy

push_token：

- 只在 Device request 中更新；
- List Device 不返回完整 token；
- logging redaction；
- 不作为 login credential；
- 同 User token 可迁移；
- 跨 User 冲突不能无声抢占。

V1 不提供独立：

```text
PUT /push-token
```

避免重复 Device API。

---

# 41. Learning Direction API Contract

对象：

```json
{
  "native_language": "lo",
  "learning_language": "zh"
}
```

只接受：

```text
lo + zh
zh + lo
```

拒绝：

```text
lo + lo
zh + zh
其他 language
```

错误：

```text
INVALID_LEARNING_DIRECTION
```

已有 User 试图借认证请求更改：

```text
409 LEARNING_DIRECTION_IMMUTABLE
```

---

# 42. Auth Provider Exposure

`GET /me` 可以返回：

```json
{
  "auth_providers": ["facebook", "phone"]
}
```

这只是当前用户自己的信息。

不提供：

```text
GET /users/{id}/auth-identities
```

---

# 43. Phone Masking

如果 API 需要展示已绑定 phone：

使用 masked form。

例如：

```text
+85620****1234
```

具体 mask algorithm 实现统一。

不得在通用 `/me` 默认返回 full phone。

---

# 44. Rate Limit Response

HTTP：

```text
429
```

Body（ADR-023 统一信封，HTTP 200）：

```json
{
  "code": "OTP_RATE_LIMITED",
  "error": {
    "message": "Too many verification requests. Try again later."
  },
  "request_id": "..."
}
```

可返回：

```http
Retry-After: 60
```

但不得返回：

- 最近请求总数；
- 数据库 Challenge 数；
- 风控细节。

---

# 45. OTP Invalid Response

对于：

- wrong code；
- expired；
- locked；
- already used；

内部可保留细分 error。

客户端是否看到全部细分：

V1 冻结：

```text
OTP_INVALID       -> 401
OTP_EXPIRED       -> 401
OTP_LOCKED        -> 401
OTP_ALREADY_USED  -> 401
```

原因：

客户端需要做明确 UX，例如提示重新获取 OTP。

这些状态不泄漏其他账号身份。

---

# 46. Provider Error

Facebook/SMS 外部服务失败：

```text
503 PROVIDER_UNAVAILABLE
```

响应不能包含：

- Facebook error body；
- provider error id；
- provider secret；
- SMS vendor request。

详细信息仅安全日志。

---

# 47. Account Status Errors

认证/refresh 时：

```text
ACCOUNT_DISABLED -> 403
ACCOUNT_CLOSED   -> 403
```

不能把 Trust ban/restriction 映射成 Identity status。

---

# 48. Conflict Mapping

数据库 UNIQUE 竞争统一映射到 Domain error。

示例：

```text
auth_identities(provider, provider_subject)
→ IDENTITY_CONFLICT
```

设备 ownership：

```text
DEVICE_OWNERSHIP_CONFLICT
```

不得返回：

```text
duplicate key value violates unique constraint ...
```

---

# 49. HTTP Idempotency Semantics

V1 不引入全局 `Idempotency-Key` 基础设施。

各 endpoint 按自身事实保证：

| Endpoint | Retry 语义 |
|---|---|
| POST /phone-otp | rate-controlled |
| POST /auth/phone | OTP one-time |
| POST /auth/facebook | retry may create extra session |
| POST /sessions/refresh | old refresh one-time |
| POST /sessions/logout | idempotent |
| POST /sessions/logout-all | idempotent |
| PATCH /me/profile | repeat-safe for same body |
| DELETE /me/devices/{installation_id} | idempotent |
| POST /me/phone/bind | OTP one-time |
| POST /me/phone/change | OTP one-time |

未来 Commerce 等需要强 Idempotency-Key 时单独实现，不扩展到当前 Identity 全域。

---

# 50. CORS / CSRF

Identity API 当前主要面向 native client。

V1 Refresh Token 在 body，不使用 cookie，因此：

```text
CSRF token = NOT_REQUIRED for current auth model
```

但 CORS 继续使用 Foundation/server deployment policy。

未来若启用 HttpOnly Cookie refresh：

> 必须重新审计 CSRF。

---

# 51. Password / Credential API

明确不存在：

```text
/password
/forgot-password
/reset-password
```

当前：

```text
Password Management = NOT_APPLICABLE
```

不要为兼容“常见 auth API”自行加入。

---

# 52. Account Closure API

V1 不提供用户自助 close route。

`closed` 状态的 runtime 认证规则照常实现。

原因：

账户关闭牵涉后续跨 Domain 数据政策。

---

# 53. Account Disable API

V1 不提供 Public/Operations HTTP route。

Identity Domain 可以有内部 Application contract，供未来 Operations/Trust Phase 接入。

当前 `IDENTITY_API.md` 只冻结 C 端/Identity HTTP API。

---

# 54. Internal Public Contract

非 HTTP。

后续其他 Domain 只能 import：

```text
modules/identity/public/*
```

最低需要：

```text
type UserPublicId = UUID

GetIdentitySummaryByPublicId
GetIdentityAccountStatus
IsIdentityActive
```

内部 contract 输入：

```text
user_public_id UUID
```

输出不得泄漏 internal BIGINT。

---

# 55. Internal Account Status Contract

为未来 Operations/Trust 预留 Application Contract：

```text
SetIdentityAccountStatus
```

但：

- PHASE 2 不创建跨 Domain caller；
- 不创建 Operations route；
- 不创建 Trust integration；
- status transition implementation是否提前完成按 Implementation Plan IDN-14 执行。

---

# 56. Outbox Contract

HTTP 不直接返回 Outbox ID。

用户注册成功：

```text
registration canonical transaction
+
identity.user_registered.v1
```

成功 response 只代表 Identity transaction 已 commit。

Outbox 异步 delivery 不阻塞 HTTP 成功。

---

# 57. UserRegistered Event Contract

```json
{
  "event_type": "identity.user_registered.v1",
  "aggregate_type": "user",
  "aggregate_id": "user-public-uuid",
  "payload": {
    "user_id": "user-public-uuid",
    "auth_provider": "phone",
    "native_language": "lo",
    "learning_language": "zh",
    "registered_at": "..."
  }
}
```

不包含 phone/provider credential。

---

# 58. AccountStatusChanged Event Contract

```json
{
  "event_type": "identity.account_status_changed.v1",
  "aggregate_type": "user",
  "aggregate_id": "user-public-uuid",
  "payload": {
    "user_id": "user-public-uuid",
    "old_status": "active",
    "new_status": "disabled",
    "occurred_at": "..."
  }
}
```

---

# 59. API Error Inventory

最终 V1 Identity API code：

```text
VALIDATION_ERROR
UNAUTHENTICATED
FORBIDDEN

INVALID_PHONE
INVALID_LEARNING_DIRECTION
LEARNING_DIRECTION_IMMUTABLE

INVALID_CREDENTIAL
TOKEN_EXPIRED

ACCOUNT_DISABLED
ACCOUNT_CLOSED

OTP_INVALID
OTP_EXPIRED
OTP_LOCKED
OTP_ALREADY_USED
OTP_RATE_LIMITED

IDENTITY_CONFLICT
PHONE_ALREADY_BOUND
PHONE_NOT_BOUND

DEVICE_REVOKED
DEVICE_OWNERSHIP_CONFLICT

PROVIDER_UNAVAILABLE
```

不强制 public 暴露：

```text
SESSION_REVOKED
SESSION_EXPIRED
```

refresh presenter 可统一成 `INVALID_CREDENTIAL`。

---

# 60. Endpoint → Use Case Matrix

| Endpoint | Use Case |
|---|---|
| POST /phone-otp | RequestPhoneOtp |
| POST /auth/phone | AuthenticateWithPhoneOtp |
| POST /auth/facebook | AuthenticateWithFacebook |
| POST /sessions/refresh | RefreshSession |
| POST /sessions/logout | LogoutCurrentSession |
| POST /sessions/logout-all | LogoutAllSessions |
| GET /me | GetCurrentIdentity |
| GET /me/status | GetCurrentAccountStatus |
| GET /me/profile | GetOwnBasicProfile |
| PATCH /me/profile | UpdateOwnBasicProfile |
| GET /me/learning-profile | ReadLearningProfile |
| GET /me/devices | ListMyDevices |
| DELETE /me/devices/{installation_id} | RevokeDevice |
| GET /me/sessions | ListMySessions |
| POST /me/phone/bind | BindPhone |
| POST /me/phone/change | ChangePhone |

---

# 61. Endpoint Auth Matrix

| Endpoint | Public | Access Token | Refresh Credential |
|---|---:|---:|---:|
| POST /phone-otp login | ✅ | — | — |
| POST /phone-otp bind/change | — | ✅ | — |
| POST /auth/phone | ✅ | — | — |
| POST /auth/facebook | ✅ | — | — |
| POST /sessions/refresh | ✅ | — | ✅ |
| POST /sessions/logout | ✅ | — | ✅ |
| POST /sessions/logout-all | — | ✅ | — |
| GET /me | — | ✅ | — |
| GET /me/status | — | ✅ | — |
| GET /me/profile | — | ✅ | — |
| PATCH /me/profile | — | ✅ | — |
| GET /me/learning-profile | — | ✅ | — |
| GET /me/devices | — | ✅ | — |
| DELETE /me/devices/{installation_id} | — | ✅ | — |
| GET /me/sessions | — | ✅ | — |
| POST /me/phone/bind | — | ✅ | — |
| POST /me/phone/change | — | ✅ | — |

---

# 62. Sensitive Input Matrix

| Field | Persist Raw | Log | Response Echo |
|---|---:|---:|---:|
| OTP | No | No | No |
| Access Token | No canonical DB | No | Only issue response |
| Refresh Token | No | No | Only issue/rotation response |
| Refresh Hash | Yes | No | No |
| Facebook Credential | No | No | No |
| Phone | Yes where canonical | Masked only | Only masked if needed |
| Push Token | Yes device metadata | No/full redaction | No |
| Authorization Header | No | No | No |

---

# 63. API Security Headers

Token-producing endpoints：

```text
Cache-Control: no-store
Pragma: no-cache
```

Production：

```text
HTTPS required
```

如果 reverse proxy 检测不到 TLS，deployment 层负责，不在 Domain 自建 TLS。

---

# 64. Schema Limits

API schema 必须为字符串设置合理 max length，防止滥用。

至少：

- OTP code：固定 6 digits；
- phone：合理国际号码输入长度；
- device_name：有限长度；
- app_version：有限长度；
- push_token：有限长度；
- display_name：服从 DB constraint；
- country_code / region_code：服从 DB constraint；
- Facebook credential：设置安全但足够的 upper bound。

具体 numeric max 必须与 frozen DB 和 provider contract 对齐，不能比 DB 更宽到导致 raw DB error。

---

# 65. Request Body Unknown Fields

V1：

```text
unknown field = VALIDATION_ERROR
```

示例：

客户端向 profile 发送：

```json
{
  "status": "active"
}
```

必须 400，而不是静默忽略。

---

# 66. API Concurrency Expectations

API Contract 对客户端明确语义：

## OTP

同一 OTP 两个并发请求：

```text
最多一个成功
```

## Refresh

同一 Refresh Token：

```text
最多一个成功
```

## Bind / Change Phone

同一 phone race：

```text
最多一个 ownership commit
```

## Device

同 installation id 不得跨用户无声转移。

---

# 67. Client Recovery Guidance

API 需要支持客户端可预测恢复：

- OTP expired → 重新 Request OTP；
- OTP locked → 重新 Request OTP（仍受 rate limit）；
- TOKEN_EXPIRED → 尝试 Refresh；
- Refresh invalid → 重新登录；
- ACCOUNT_DISABLED/CLOSED → 停止自动重试；
- PROVIDER_UNAVAILABLE → 可指数退避重试；
- OTP_RATE_LIMITED → 遵守 Retry-After；
- DEVICE_OWNERSHIP_CONFLICT → 不自动循环重试。

---

# 68. No Hidden Auto-Registration API

不存在单独：

```text
POST /users/register
```

Phone/Facebook authentication Use Case 在首次身份时完成注册。

这是有意设计，不是缺失。

---

# 69. No Table CRUD

明确禁止生成：

```text
GET /users
GET /auth-identities
GET /otp-challenges
POST /devices
POST /sessions
PATCH /users/{id}
```

除非对应 Use Case 明确需要。

当前不需要。

---

# 70. API Integration Test Checklist

必须至少覆盖：

## Phone OTP

- [ ] request login OTP 200
- [ ] bind/change without auth 401
- [ ] invalid phone 400
- [ ] rate limit 429
- [ ] provider unavailable 503
- [ ] response no OTP

## Phone Auth

- [ ] new user 200
- [ ] existing user 200
- [ ] missing learning direction for new user 400
- [ ] invalid direction 400
- [ ] immutable direction conflict 409
- [ ] wrong OTP 401
- [ ] expired OTP 401
- [ ] locked OTP 401
- [ ] replay 401
- [ ] internal BIGINT absent
- [ ] token response no-store

## Facebook

- [ ] new/existing
- [ ] invalid credential 401
- [ ] provider unavailable 503
- [ ] spoofed subject cannot bypass verifier

## Refresh

- [ ] success
- [ ] rotation
- [ ] old token fails
- [ ] concurrency one success
- [ ] disabled/closed denied
- [ ] revoked device denied

## Logout

- [ ] current 204
- [ ] duplicate 204
- [ ] logout-all 204

## Me/Profile

- [ ] auth required
- [ ] safe response
- [ ] unknown field 400
- [ ] forbidden field 400
- [ ] avatar UUID validation

## Devices

- [ ] list no bigint
- [ ] revoke 204
- [ ] repeat 204
- [ ] foreign installation 404
- [ ] sessions revoked

## Sessions

- [ ] list no session bigint/public fake id
- [ ] no arbitrary revoke endpoint

## Phone Bind/Change

- [ ] auth required
- [ ] purpose-specific OTP
- [ ] replay denied
- [ ] conflict safe

---

# 71. Contract Test Requirements

除了 route Integration Test，需要建立稳定 contract assertions：

- JSON key names；
- required/optional fields；
- enums；
- token_type；
- error codes；
- no internal IDs；
- no sensitive fields；
- HTTP status；
- Cache-Control；
- authentication requirements。

防止后续 Domain 开发时无意破坏 Identity API。

---

# 72. OpenAPI

Identity route 实施后应从 Fastify schema 生成/汇总 OpenAPI。

原则：

```text
IDENTITY_API.md = human design authority
Fastify schemas = executable contract
OpenAPI = generated/exposed representation
```

不得反过来让自动生成 OpenAPI 决定业务行为。

---

# 73. Documentation Sync

实现阶段发现 API Contract 与 frozen DB 无法同时实现：

不能现场自行改。

必须：

```text
stop
→ document blocker
→ design review
```

若只是 implementation detail：

可调整代码，不改 API semantic contract。

---

# 74. Identity Design Audit 输入

最终设计审计必须同时审：

```text
IDENTITY_IMPLEMENTATION_PLAN.md
IDENTITY_USE_CASES.md
IDENTITY_API.md
0100_identity.sql
1220_identity_auth_runtime.sql
Foundation contracts
Global architecture rules
```

至少检查：

- API 与 Use Case 一一对应；
- 无数据库 CRUD 泄漏；
- 无 internal BIGINT；
- OTP consumption 原子；
- Refresh rotation；
- Session 无伪 public id；
- Learning direction immutable；
- phone bind/change；
- Facebook verify；
- Account Status；
- Outbox；
- Deferred 边界；
- Security；
- Testability。

---

# 75. Design Gate 条件

以下全部满足才可：

```text
IDENTITY_DESIGN_GATE = PASS
```

- [ ] Implementation Plan complete
- [ ] Use Cases ready
- [ ] API ready
- [ ] endpoint inventory 完整
- [ ] auth matrix 完整
- [ ] request/response contract 完整
- [ ] error inventory 完整
- [ ] OTP behavior 无歧义
- [ ] refresh transport 已冻结
- [ ] token TTL 已冻结
- [ ] session revocation 语义无歧义
- [ ] Session API 不暴露 BIGINT
- [ ] Device ownership 语义无歧义
- [ ] Bind/Change Phone 无歧义
- [ ] Facebook provider proof 无歧义
- [ ] Account Status 无越域
- [ ] Outbox payload 无敏感字段
- [ ] Deferred endpoint 未误入 V1
- [ ] Frozen migration change requirement = 0
- [ ] Blocking Open Decision = 0

---

# 76. 当前最终状态

```text
PostgreSQL  Baseline = COMPLETE / PASS
Application Foundation = COMPLETE / PASS

IDENTITY_IMPLEMENTATION_PLAN = COMPLETE
IDENTITY_USE_CASES_STATUS = AUDITED / READY_FOR_IMPLEMENTATION
IDENTITY_API_STATUS = AUDITED / READY_FOR_IMPLEMENTATION

IDENTITY_IMPLEMENTATION_STARTED = NO
IDENTITY_DESIGN_GATE = PASS
IDENTITY_GATE = NOT_STARTED
```

---

# 77. Design Audit 后状态

```text
IDENTITY_DESIGN_GATE = PASS
IDENTITY_IMPLEMENTATION_STARTED = NO
```

本次工作到此停止；不创建 route、不修改 migration、不进入 Platform，也不执行 `IDN-01`。

下一步：

```text
执行 Identity Design Audit
```

审计：

```text
Implementation Plan
+
Use Cases
+
API
+
Frozen DB
+
Foundation
+
Global Architecture
```

只有审计结论：

```text
IDENTITY_DESIGN_GATE = PASS
```

才允许执行：

```text
IDN-01 — Identity Module Skeleton
```
