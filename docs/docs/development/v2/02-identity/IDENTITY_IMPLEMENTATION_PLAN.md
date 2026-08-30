---
status: audited
phase: 2
phase_name: Identity Domain
last_updated: 2026-08-30
depends_on: FOUNDATION_GATE = PASS
database_authority:
  - database/v2/migrations/0100_identity.sql
  - database/v2/migrations/1220_identity_auth_runtime.sql
exit_gate: IDENTITY_GATE
authority: docs/docs/development/v2/MASTER_DEVELOPMENT_PLAN.md
---

# ZH-LAO V2 — IDENTITY IMPLEMENTATION PLAN

> 目标路径：`docs/docs/development/v2/02-identity/IDENTITY_IMPLEMENTATION_PLAN.md`
>
> 本文是 `PHASE 2 — Identity Domain` 的完整实施分计划。
>
> 本 Phase 只负责把已经冻结的 Identity 产品、Domain 与 PostgreSQL 物理契约转化为可执行的应用实现顺序、认证流程、Repository、API 准备、测试、安全审计和 Exit Gate。
>
> **本计划不重新设计数据库，不修改冻结 migration，不进入其他 Domain，不在计划阶段编码。**

---

# 1. Phase 状态

前置阶段：

```text
PostgreSQL V2 Baseline = COMPLETE / PASS
Application Foundation = COMPLETE / PASS
```

当前阶段：

```text
PHASE 2 — Identity Domain = PLANNING
```

下一阶段不得提前开始。

只有：

```text
IDENTITY_GATE = PASS
```

才允许进入下一个正式 Phase。

---

# 2. 权威来源与冲突优先级

Identity 实施必须服从以下事实源。

## 2.1 全局开发规则

最高级开发流程来源：

```text
docs/docs/development/v2/MASTER_DEVELOPMENT_PLAN.md
```

继续遵守：

- Database Baseline 是物理数据契约；
- API 从 Use Case 推导，不从表生成 CRUD；
- 一次只推进一个正式 Phase；
- Canonical Owner 唯一；
- Repository 不越 Domain；
- 跨 Domain ID 永远使用 stable logical UUID；
- 跨 Domain 不建立 physical FK；
- canonical write + Outbox 必须同事务；
- 依赖 Phase 只有 Gate = PASS 后才能开始；
- 不自动进入下一 Phase。

## 2.2 Identity 物理数据库最高事实源

Identity 当前最终物理契约：

```text
database/v2/migrations/0100_identity.sql
database/v2/migrations/1220_identity_auth_runtime.sql
```

如果旧文档仍包含：

```text
designing
旧字段
旧状态
旧类型
旧流程词
```

而 frozen migration 已经给出最终物理字段：

> **实现必须适配 frozen migration，不允许修改 frozen migration 去适配旧文字。**

例如旧流程出现 `consumed_at`，但当前 `otp_challenges` 已冻结为：

```text
status
verified_at
```

则实现不能新增 `consumed_at` 以追随旧文档。

## 2.3 Identity 业务语义来源

业务边界和已冻结规则继续来源于：

```text
docs/docs/domains/identity/index.md
docs/docs/domains/identity/model.md
docs/docs/domains/identity/flows.md
docs/docs/domains/identity/database.md
```

## 2.4 Foundation

Identity 必须直接复用已经通过 Gate 的 Application Foundation。

不得重新建立：

- Fastify bootstrap；
- PostgreSQL Pool；
- Transaction Manager；
- DB Executor；
- UUID；
- Error Envelope；
- Logger；
- Request Context；
- Auth Hook 基础骨架；
- Outbox Writer/Publisher；
- Worker Host；
- Asset Repository；
- Integration Test DB；
- Migration Compatibility；
- Architecture Boundary Audit。

---

# 3. Identity 冻结表范围

Identity 最终 7 张表固定：

```text
identity.users
identity.auth_identities
identity.basic_profiles
identity.learning_profiles
identity.otp_challenges
identity.devices
identity.sessions
```

本 Phase 默认：

```text
TABLE ADDITION = FORBIDDEN
TABLE REMOVAL = FORBIDDEN
FROZEN MIGRATION EDIT = FORBIDDEN
```

如实施发现真实 `FROZEN CONTRACT BLOCKER`：

1. 停止对应实现；
2. 记录 blocker；
3. 证明不是 application 实现问题；
4. 形成正式设计变更；
5. 只允许新增 forward-only migration；
6. 不修改 `0100_identity.sql` / `1220_identity_auth_runtime.sql`；
7. 重新执行数据库审计；
8. 重新通过数据库 Gate 后再继续。

---

# 4. Identity Domain 边界

Identity 回答：

> “这个平台用户是谁、通过什么身份认证、当前账户和会话是否有效。”

Identity 拥有：

- User Root；
- phone / Facebook AuthIdentity；
- Basic Profile；
- Learning Profile；
- OTP Challenge；
- Device；
- Session；
- Account Status；
- AuthenticationProvider 正式实现；
- Access Token / Refresh Session runtime。

Identity 不拥有：

- Social Profile；
- 社交照片集；
- Follow / Match；
- 真人认证；
- Trust capability restriction；
- VIP；
- 钱包；
- 学习进度；
- 课程内容；
- Chat；
- 举报/审核；
- Operations RBAC。

禁止因“开发方便”把其他 Domain 逻辑塞进 Identity。

---

# 5. Frozen Physical Contract 的应用解释

## 5.1 `identity.users`

```text
id          BIGINT internal PK
public_id   UUID UNIQUE
status      active / disabled / closed
```

规则：

- `id` 只在 Identity 内部使用；
- `public_id` 是全系统稳定 User logical/public ID；
- API、AuthContext、Event、Outbox、其他 Domain 只允许使用 `public_id`；
- 不允许跨 Domain 暴露 `users.id`；
- `status` 只表示账户状态；
- Trust capability restriction 不进入 `users.status`。

## 5.2 `identity.auth_identities`

Provider 当前固定：

```text
phone
facebook
```

最终唯一性：

```text
UNIQUE(provider, provider_subject)
```

规则：

- 一个 User 可绑定多个 AuthIdentity；
- 一个 provider subject 只能属于一个 User；
- phone subject 使用 E.164；
- Facebook subject 必须由服务端验证 provider credential 后获得；
- 客户端传入的 Facebook user id 不能直接视为可信主体；
- 本 Phase 不新增 password / email / Google / Apple provider。

## 5.3 `identity.basic_profiles`

负责账户级普通基础资料：

- display_name
- gender
- birth_date
- country_code
- region_code
- avatar_media_id

`avatar_media_id UUID` 是对 `infrastructure.assets` 的 logical reference。

Identity 不复制：

- bucket；
- storage_key；
- checksum；
- mime；
- physical URL。

## 5.4 `identity.learning_profiles`

当前只允许：

```text
lo -> zh
zh -> lo
```

规则：

- 注册时创建；
- 当前不支持切换；
- UI locale、native language、learning language 是三个不同概念。

## 5.5 `identity.otp_challenges`

物理状态：

```text
pending
verified
expired
cancelled
locked
```

Purpose：

```text
login
bind_phone
change_phone
```

数据库只保存：

```text
code_hash
```

不保存 raw OTP。

旧文档中的 `consumed_at` 已被物理契约取代。

本 Phase 必须采用：

```text
verified + verified_at
```

作为成功消费后的终态。

**关键约束：OTP 校验必须与其消费动作绑定。**

对于 `login`：

```text
验证 OTP
+
创建/识别身份
+
建立 Session
+
mark verified
```

应在同一个 Identity transaction 中完成，避免“先 verify、后 login”导致已 verified Challenge 可重复消费。

`bind_phone` / `change_phone` 同理。

因此后续 `IDENTITY_API.md` 不得设计一个会产生可重复使用“已验证票据”的独立 verify 流程，除非另有一次性消费机制并通过安全审计。

## 5.6 `identity.devices`

```text
id               BIGINT internal
installation_id  UUID UNIQUE
platform         android / ios
push_token       nullable
revoked_at       nullable
```

规则：

- installation_id 是客户端安装 logical ID；
- installation_id 唯一；
- Device 属于一个 User；
- 不允许无声把同一 installation 转移给另一个 User；
- revoked device 不能作为有效登录设备；
- active push_token 受数据库唯一约束保护；
- push_token 不是认证凭证。

## 5.7 `identity.sessions`

```text
id                  BIGINT internal
user_id             BIGINT internal FK
device_id           nullable BIGINT internal FK
refresh_token_hash  UNIQUE
status              active / revoked / expired
expires_at
last_active_at
revoked_at
revocation_reason
```

规则：

- Session 是 Refresh Session canonical fact；
- raw Refresh Token 永不入库；
- Access Token 不作为数据库 canonical Session；
- revoke 后不能继续 refresh；
- Session BIGINT 不向其他 Domain 暴露。

---

# 6. 本 Phase 非目标

明确不实现：

- Platform Feature Flags；
- Operations RBAC；
- Content；
- Learning Progress；
- Audio；
- Social；
- Chat；
- Commerce；
- Rewards；
- Trust enforcement；
- 真人认证；
- Guest cloud sync；
- Guest Data Migration；
- `account_closures`；
- MFA / TOTP；
- Passkey；
- Password；
- Email login；
- Google login；
- Apple login；
- Redis Session Store；
- Redis Rate Limiter；
- Kafka / RabbitMQ；
- API Gateway；
- 完整 C/B 端 UI。

---

# 7. 编码前 Design Freeze

当前阶段先完成设计文档，不编码。

必须存在：

```text
docs/docs/development/v2/02-identity/
├── IDENTITY_IMPLEMENTATION_PLAN.md
├── IDENTITY_USE_CASES.md
└── IDENTITY_API.md
```

三份文件全部审核通过后：

```text
IDENTITY_DESIGN_GATE = PASS
IDENTITY_IMPLEMENTATION_READY = YES
```

才允许进入 IDN-01。

---

# 8. `IDENTITY_USE_CASES.md` 必须裁决的 Use Cases

最低需要冻结：

## Authentication

```text
RequestPhoneOtp
AuthenticateWithPhoneOtp
AuthenticateWithFacebook
RefreshSession
LogoutCurrentSession
LogoutAllSessions
```

注意：

> `AuthenticateWithPhoneOtp` 同时承担 OTP 验证与 login/register 消费，避免独立 VerifyOtp 后 replay。

## Current Identity

```text
GetCurrentIdentity
GetCurrentAccountStatus
```

## Basic Profile

```text
GetOwnBasicProfile
UpdateOwnBasicProfile
```

## Device / Session

至少审核：

```text
RegisterOrUpdateDevice
ListMyDevices
RevokeDevice
ListMySessions
RevokeSession
```

具体是否全部暴露 V1 API，由 Use Case 文档裁决。

## Auth Identity Credential Operations

数据库已有：

```text
bind_phone
change_phone
```

必须裁决：

```text
BindPhone
ChangePhone
```

是本 Phase实施，还是明确 `DEFERRED`。

不得处于“字段已存在但产品行为不明确”。

## Account Status

必须明确：

- 谁能把 active → disabled；
- 谁能把 active/disabled → closed；
- 用户是否有自助关闭账户能力；
- status change 是否撤销全部 Session；
- 是否发 Outbox Event；
- closed 是否可恢复。

## Learning Profile

当前：

```text
Create at registration
Read only
Change direction = NOT_SUPPORTED
```

## Password Checklist

当前 frozen model 无 password provider。

因此：

```text
Password Management = NOT_APPLICABLE
```

不得因通用模板出现 password 检查项就新增密码体系。

---

# 9. `IDENTITY_API.md` 设计规则

API 必须来自 Use Case，不从表生成 CRUD。

禁止直接以表为中心设计：

```text
POST /users
PUT /sessions/:id
DELETE /devices/:id
```

API 文档必须对每个 endpoint 明确：

- public / protected；
- request schema；
- response schema；
- auth requirement；
- error code；
- rate-limit semantics；
- logical UUID；
- idempotency；
- concurrency；
- token transport；
- sensitive-data policy；
- retry behavior。

本 Implementation Plan 不提前冻结具体 path。

---

# 10. Identity Module 目标结构

实施阶段创建：

```text
apps/backend/src/modules/identity/
├── domain/
│   ├── user/
│   ├── auth-identity/
│   ├── otp/
│   ├── device/
│   ├── session/
│   ├── profile/
│   └── events/
│
├── application/
│   ├── use-cases/
│   ├── ports/
│   ├── policies/
│   └── services/
│
├── infrastructure/
│   ├── repositories/
│   ├── authentication/
│   ├── otp/
│   ├── facebook/
│   └── tokens/
│
├── http/
│   ├── routes/
│   ├── schemas/
│   └── presenters/
│
└── public/
    ├── contracts/
    ├── events/
    └── types/
```

跨 Domain 只能使用 `identity/public/*` 暴露的稳定 contract。

---

# 11. Repository 规划

Identity Repository 只访问：

```text
identity.*
```

允许调用的 Foundation technical adapter：

```text
Outbox Writer
Asset Repository
```

最低数据能力：

```text
UserRepository
AuthIdentityRepository
BasicProfileRepository
LearningProfileRepository
OtpChallengeRepository
DeviceRepository
SessionRepository
```

可在实现中合理合并接口，但 ownership 必须清晰。

---

# 12. Repository 必备行为

## User

```text
findInternalByPublicId
findByInternalId
create
updateStatus
touchLastActive
lockByInternalId
```

## AuthIdentity

```text
findByProviderSubject
listByUser
create
touchLastLogin
```

数据库 UNIQUE 是并发最终保护。

## OTP

```text
createChallenge
lockRequestScope
findPending
lockPendingForConsumption
incrementAttempt
markVerified
markExpired
markCancelled
markLocked
countRecent
```

OTP 消费必须使用 row lock。

`lockRequestScope` 必须在 PostgreSQL transaction 内使用由 canonical `phone_number + purpose` 派生的 transaction-scoped advisory lock，序列化 resend/cooldown/pending replacement；它不是跨进程 memory lock，也不要求新增表或 migration。

## Device

```text
findByInstallationId
listByUser
registerOrUpdateOwnedInstallation
updateMetadata
touchLastSeen
revoke
```

## Session

```text
create
findByRefreshTokenHash
lockByRefreshTokenHash
listActiveByUser
listByDevice
rotateRefreshTokenHash
touchLastActive
revokeOne
revokeByDevice
revokeAllForUser
markExpired
```

同一个 refresh token 并发刷新只能一个成功。

---

# 13. Phone Number Contract

Identity 建立唯一手机号 canonicalizer。

内部格式：

```text
E.164
```

要求：

- OTP phone_number 与 phone AuthIdentity 共用同一 normalization；
- 不拆 country_code + local phone 入库；
- 非法号码在 application 层拒绝；
- 日志 mask；
- API 错误避免不必要的账号枚举。

---

# 14. OTP Security

建立：

```text
OtpGenerator
OtpHasher
OtpDeliveryProvider
```

规则：

- cryptographically secure OTP；
- raw OTP 仅短暂存在内存；
- DB 只存 hash/MAC；
- raw OTP 不进日志；
- raw OTP 不进 Outbox；
- production response 不返回 OTP；
- test fake provider 可捕获 OTP；
- 不使用容易离线暴力枚举的无密钥短码普通 hash 作为唯一保护。

---

# 15. OTP 生命周期与限流

状态机：

```text
pending
 ├─ verified
 ├─ expired
 ├─ cancelled
 └─ locked
```

`IDENTITY_USE_CASES.md` 必须冻结：

- TTL；
- max attempts；
- resend cooldown；
- 同 phone+purpose 是否只保留一个 pending；
- resend 是否取消旧 challenge；
- expired 的惰性标记；
- locked 后行为；
- anti-enumeration response；
- provider failure 后 Challenge 状态。

限流至少两层：

1. 利用 `otp_challenges(phone_number, purpose, created_at)` 做 durable phone/purpose 频率检查；
2. HTTP/IP 短窗口 limiter。

当前不因为限流引入 Redis。

如果应用未来多实例，需要共享 limiter：

> 作为后续独立基础设施演进，不属于本 Phase 默认范围。

---

# 16. Phone Authentication 核心事务

## 已有 phone identity

```text
BEGIN
lock pending OTP challenge
validate purpose/phone/expiry/attempts/hash
resolve phone AuthIdentity
resolve User
assert status = active
register/update owned Device
create Session
touch AuthIdentity last_login
mark OTP verified
COMMIT
```

## 新 phone identity / 注册

```text
BEGIN
lock pending OTP challenge
validate OTP
create User(public_id UUID)
create AuthIdentity(phone)
create LearningProfile
create BasicProfile? -> 由 Use Case Freeze 裁决
register Device if supplied
create Session
mark OTP verified
write UserRegistered Outbox
COMMIT
```

必须保证：

```text
User + AuthIdentity + LearningProfile + Session + OTP consumption + Outbox
```

在失败时整体 rollback。

---

# 17. Registration Concurrency

必须真实测试：

```text
两个请求同时用同一个 phone 首次注册
```

最终必须：

- 只存在一个 `(phone, provider_subject)`；
- 不留下 orphan User；
- 不留下 orphan LearningProfile；
- 不发重复 canonical UserRegistered；
- loser request 返回稳定业务冲突/已完成语义，而不是 raw PostgreSQL error。

---

# 18. Learning Direction

注册时必须是：

```text
lo -> zh
或
zh -> lo
```

Application 层先验证，DB CHECK 最终兜底。

本 Phase：

```text
ChangeLearningDirection = FORBIDDEN
```

---

# 19. Facebook Authentication

建立：

```text
FacebookIdentityVerifier
```

流程：

```text
client provider credential
↓
server verifies with Facebook
↓
stable provider_subject
↓
find (facebook, provider_subject)
↓
existing user -> status/device/session
new user -> registration completion
```

必须用 fake verifier 做常规测试。

禁止：

```text
client sends facebook_user_id
server trusts directly
```

首次 Facebook 用户的 learning direction 获取时机，必须在 Use Case/API Freeze 中明确。

---

# 20. Bind Phone / Change Phone

如 Design Gate 决定本 Phase 实现：

- 必须是 authenticated User；
- 使用 `bind_phone` / `change_phone` OTP purpose；
- 验证 OTP 与身份变更在同一 transaction；
- Challenge phone 必须与 request 中规范化 phone 完全相等；
- Bind/Change 先锁当前 User row，再读取该 User 的 phone AuthIdentity；由于 frozen schema 没有 `UNIQUE(user_id, provider)`，这一 application-level serialization 是“每 User 最多一个 phone identity”的必要保护；
- 不允许抢占其他 User 的 phone AuthIdentity；
- change_phone 的旧 phone AuthIdentity 去留规则必须明确；
- unique conflict 必须安全映射；
- 如产生跨域事实，Outbox 与 canonical write 同事务。

如 V1 deferred：

```text
状态必须明确写 DEFERRED
不创建半实现 route
```

---

# 21. Device 规则

游客阶段：

```text
local installation_id UUID
```

游客不创建 `identity.users`。

认证成功后：

```text
installation_id -> identity.devices
```

要求：

- 不允许同 installation_id 无声换 owner；
- revoked device 不允许继续建立有效 session，除非 Use Case 明确“重新认证恢复”的行为；
- push_token 只是 metadata；
- device_name/app_version 不是认证因子。

---

# 22. Device Revocation

撤销 Device 至少：

```text
BEGIN
set device.revoked_at
revoke active sessions bound to device
COMMIT
```

撤销当前设备后：

- Refresh 必须失败；
- Access Token 仍遵守短 TTL；
- 是否允许以后重新激活该 installation，由 Use Case Freeze 明确。

---

# 23. Session / Token 架构

采用：

```text
Short-lived Access Token
+
Opaque Refresh Token
+
Server-side revocable Session
```

## Access Token

建议 JWT。

最少 claim：

```text
sub = users.public_id
iat
exp
iss
aud
```

不得包含：

- users.id；
- sessions.id；
- devices.id；
- phone；
- refresh token；
- provider credential。

## Refresh Token

- cryptographically random opaque token；
- raw token 只返回客户端；
- DB 只保存 hash；
- log/error 不回显 raw token；
- 每次成功 Refresh 默认旋转。

## Refresh 并发

```text
SELECT session FOR UPDATE
↓
verify active/not expired
↓
rotate hash
↓
touch last_active
↓
COMMIT
```

第二个并发请求使用旧 refresh token 必须失败。

---

# 24. Session TTL 与 Access Token Revocation

`IDENTITY_USE_CASES.md` 必须冻结：

- Access Token TTL；
- Session TTL；
- Session 是否 sliding；
- Refresh 后是否延长 expires_at。

当前数据模型没有：

```text
access token blacklist
session public UUID
token family history
```

所以本 Phase 语义固定：

- revoke session 立即阻止 Refresh；
- 已签发 Access Token 最多存活到短 TTL；
- AuthenticationProvider 每次还必须检查 User status；
- disabled/closed User 即使 access token 未过期也拒绝。

不为了即时 access blacklist 新增 Redis/表。

---

# 25. Logout

## Current Session

通过 refresh credential 定位并 revoke 当前 Session。

不要求把 internal session id 放进 Access Token。

## Logout All

```text
BEGIN
revoke all active sessions for user
COMMIT
```

当前 Access Token 继续按短 TTL 语义，但后续所有 Refresh 失败。

---

# 26. AuthenticationProvider 正式实现

Foundation 已有 fail-closed auth skeleton。

Identity Phase 正式实现：

```text
Authorization: Bearer <access_token>
↓
verify signature
↓
verify iss/aud/exp
↓
read sub UUID
↓
resolve identity.users(public_id)
↓
assert status active
↓
AuthContext
```

AuthContext 的稳定主体必须是：

```text
users.public_id UUID
```

---

# 27. Account Status

只允许：

```text
active
disabled
closed
```

认证规则：

```text
active   -> allowed
disabled -> denied
closed   -> denied
```

状态变为 disabled/closed 时，若 Phase 2 提供该内部 Use Case：

```text
BEGIN
update user status
revoke all active sessions
write AccountStatusChanged Outbox
COMMIT
```

禁止加入：

```text
suspended
banned
chat_disabled
social_disabled
```

---

# 28. Basic Profile

Identity basic profile 不是 Social Profile。

最低能力由 Use Case Freeze 裁决，原则上包括：

```text
read own basic profile
update whitelisted fields
```

必须 whitelist 字段。

avatar：

```text
avatar_media_id UUID
```

只保存 logical asset id。

---

# 29. Public Identity Contract

后续 Domain 需要 Identity 稳定接口。

`identity/public/` 至少需要表达：

```text
UserPublicId
IdentityAccountStatus
GetIdentitySummaryByPublicId
IsIdentityActive
```

禁止后续 Domain：

- import Identity repository；
- 查询 `identity.*`；
- 使用 `users.id`。

---

# 30. Outbox Event 规划

使用 Foundation 唯一：

```text
infrastructure.system_outbox_events
```

不得创建 Identity 自己的 outbox 表。

Design Gate 最低审核事件：

```text
UserRegistered
AccountStatusChanged
```

Event contract 必须冻结：

- event_type；
- version；
- source_domain；
- aggregate_type；
- aggregate_id；
- payload。

aggregate_id：

```text
users.public_id UUID
```

禁止 payload 含：

- raw OTP；
- phone，除非明确必要；
- provider token；
- refresh token；
- internal BIGINT；
- full push token。

Session/Device/OTP 事件只有存在明确跨域消费者时才增加。

---

# 31. Identity Cross-Domain 规则

默认：

```text
Cross-domain business read  = NONE
Cross-domain business write = NONE
```

允许的 technical adapter：

```text
Foundation Outbox Writer
Foundation Asset Repository
```

禁止：

```text
IdentityRepository -> social.*
IdentityRepository -> learning.*
IdentityRepository -> trust.*
IdentityRepository -> commerce.*
```

---

# 32. Config

在 Foundation typed config 上增加 Identity 配置类别：

```text
AUTH_*
ACCESS_TOKEN_*
REFRESH_SESSION_*
OTP_*
FACEBOOK_*
```

必须：

- Zod startup validation；
- `.env.example` placeholder；
- secret redaction；
- test config；
- production secret 不进 repo。

---

# 33. Token Signing Secret / Key

要求：

- 只来自 env/secret provider；
- 不提交 repo；
- 不进日志；
- 启动时验证；
- test 使用独立固定 test key；
- issue/verify 封装在 Identity infrastructure。

当前单后端场景不建设复杂 KMS。

---

# 34. External Providers

## Facebook

- adapter 隔离；
- provider error 映射为稳定 AppError；
- provider body/token 不透传；
- unit/integration 默认 fake；
- provider smoke test 可独立执行。

## SMS/OTP

必须有：

```text
OtpDeliveryProvider port
Fake adapter
Production-capable adapter
```

Phone OTP 是核心认证路径，因此 `IDENTITY_GATE = PASS` 前不能只留下完全空的 production provider。

CI 不要求真实给用户发短信，但必须验证 adapter contract。

---

# 35. Logging / Privacy

可记录：

```text
request_id
use_case
user_public_id
provider
otp purpose
installation_id
result
error_code
duration
```

禁止记录：

```text
raw OTP
raw access token
raw refresh token
Facebook credential
Authorization header
full push token
secret
```

phone 默认 mask。

---

# 36. Error Inventory

最低需要统一：

```text
INVALID_CREDENTIAL
TOKEN_EXPIRED
SESSION_REVOKED
SESSION_EXPIRED
ACCOUNT_DISABLED
ACCOUNT_CLOSED
OTP_INVALID
OTP_EXPIRED
OTP_LOCKED
OTP_ALREADY_USED
OTP_RATE_LIMITED
IDENTITY_CONFLICT
DEVICE_REVOKED
DEVICE_OWNERSHIP_CONFLICT
PROVIDER_UNAVAILABLE
```

最终 public code 在 `IDENTITY_API.md` 冻结。

---

# 37. Security / Concurrency 必测项

## OTP

- brute force；
- max attempts；
- expired；
- replay；
- concurrent consumption；
- resend abuse。

## Registration

- same phone concurrent registration；
- UNIQUE conflict；
- transaction rollback no orphan。

## Session

- refresh replay；
- concurrent refresh；
- refresh vs revoke；
- logout-all vs refresh。

## Device

- installation ownership takeover；
- revoked device；
- push token uniqueness conflict。

## Token

- invalid signature；
- wrong issuer；
- wrong audience；
- expired；
- malformed；
- disabled/closed account。

## General

- SQL injection；
- sensitive logging；
- raw PostgreSQL error leakage；
- internal BIGINT leakage；
- account enumeration。

---

# 38. 测试层级

## Unit

覆盖：

- Phone normalization；
- OTP hash/policy；
- Token claims；
- Session policy；
- Device ownership；
- Account status；
- Error mapping；
- Event payload。

## Repository Integration

真实 PostgreSQL：

- users；
- auth_identities；
- basic_profiles；
- learning_profiles；
- otp_challenges；
- devices；
- sessions。

## Use Case Integration

真实 PostgreSQL + fake external provider：

- Request OTP；
- Phone authenticate/register；
- Existing phone login；
- Facebook login/register；
- Refresh；
- Logout；
- Device revoke；
- Account status。

## HTTP Integration

Fastify：

- public/protected；
- request schemas；
- AuthContext；
- error envelope；
- request_id；
- token transport。

## Race / Security

真实 PostgreSQL 并发。

---

# 39. Fresh Database Test 规则

每次核心 Integration Test：

```text
create unique PostgreSQL DB
↓
apply all frozen migrations
↓
run Identity tests
↓
drop DB
```

禁止：

- SQLite；
- mock DB 替代核心 persistence；
- 依赖人工已有数据库；
- 修改 frozen migration。

---

# 40. CI 扩展

Foundation CI 继续保留。

Identity CI 至少：

```text
typecheck
lint
architecture audit
build
unit tests
fresh PostgreSQL migrations
database audit
identity repository integration
identity use-case integration
identity HTTP integration
identity race/security tests
docs link check
VitePress build
```

Identity CI 不允许绕过 Foundation validation。

---

# 41. 正式实施顺序

---

## IDN-00 — Design Contract Freeze

完成：

```text
IDENTITY_IMPLEMENTATION_PLAN.md
IDENTITY_USE_CASES.md
IDENTITY_API.md
```

冻结：

- OTP TTL / attempts / resend；
- OTP 消费模型；
- phone login/register flow；
- Facebook flow；
- session/token TTL；
- refresh rotation；
- device behavior；
- account status；
- bind/change phone；
- event inventory；
- error inventory；
- API contract。

验收：

```text
IDENTITY_DESIGN_GATE = PASS
```

未通过不得编码。

---

## IDN-01 — Module Skeleton

创建 Identity 模块目录。

验收：

- architecture audit PASS；
- shared layer 不依赖 Identity；
- 未创建其他 Domain 实现。

---

## IDN-02 — Core Types

建立与 frozen DB 一致的：

```text
UserPublicId
AccountStatus
AuthProvider
PhoneNumber
LearningDirection
OtpPurpose
OtpStatus
DevicePlatform
SessionStatus
```

不得发明 DB 不存在的状态。

---

## IDN-03 — Repository Layer

完成 7 表 persistence。

验收：

- 真 PostgreSQL；
- parameterized SQL；
- DB constraint error normalization；
- 无 cross-schema business SQL；
- 无 Domain 自建 Pool。

---

## IDN-04 — OTP Technical Services

完成：

```text
OtpGenerator
OtpHasher
OtpDeliveryProvider
Fake provider
Production-capable provider
```

---

## IDN-05 — Request Phone OTP

完成：

```text
normalize
rate policy
challenge lifecycle
delivery
safe response
```

必须处理 delivery failure 与 resend 行为。

验收必须包括真实 PostgreSQL 并发 Request：使用 phone+purpose advisory lock 后，同一 scope 至多一个 pending；失败补偿只可取消自己创建且仍 pending 的 Challenge。

---

## IDN-06 — OTP Consumption Engine

实现 transaction-scoped：

```text
lock pending challenge
validate phone/purpose/status/expiry
verify code
increment/lock on failure
mark verified only on successful consuming transaction
```

不得做成可重复使用的独立 verified ticket。

---

## IDN-07 — Phone Authenticate / Register

组合：

```text
OTP consumption
AuthIdentity resolution
User create/read
LearningProfile
Device
Session
Outbox
```

并通过同手机号并发注册测试。

---

## IDN-08 — Token Services

完成：

- JWT issue/verify；
- opaque refresh generation；
- token hash；
- refresh rotation；
- TTL。

---

## IDN-09 — Session Lifecycle

实现：

- refresh；
- revoke；
- logout current；
- logout all；
- expiry；
- last_active。

---

## IDN-10 — Device Lifecycle

实现：

- register/update；
- list；
- revoke；
- revoke device sessions；
- ownership protection；
- push token metadata。

---

## IDN-11 — Facebook Authentication

实现 provider verifier、fake、production adapter、existing/new flow。

---

## IDN-12 — Credential Operations

按 Design Gate 结论：

```text
BindPhone
ChangePhone
```

实现或明确 deferred。

验收必须包括同一 User 并发 BindPhone（不同号码）测试，证明 User row lock 防止 frozen schema 未显式禁止的 multi-phone identity。

---

## IDN-13 — Basic Profile

实现冻结的 own-profile Use Cases。

不实现 Social Profile。

---

## IDN-14 — Identity State

实现：

- current identity；
- account status read；
- frozen internal status transitions；
- disable/close auth denial；
- session revocation；
- event。

---

## IDN-15 — AuthenticationProvider Wiring

把 Foundation auth skeleton 接入真实 Identity provider。

验收：

```text
valid token -> AuthContext
invalid -> denied
expired -> denied
disabled -> denied
closed -> denied
```

---

## IDN-16 — Outbox Events

实现仅已冻结事件。

测试 canonical write 与 event 同事务。

---

## IDN-17 — HTTP/API

只实现 `IDENTITY_API.md` frozen endpoints。

不得生成表 CRUD。

---

## IDN-18 — Domain E2E Integration

至少打通完整 phone 与 Facebook happy path。

---

## IDN-19 — Security / Race Tests

执行第 37 节全部重点场景。

---

## IDN-20 — Domain Audit

审计：

- 7 表；
- frozen migration diff = 0；
- cross-domain FK = 0；
- cross-domain BIGINT = 0；
- unauthorized schema SQL = 0；
- raw secret logging = 0；
- API 从 Use Case 推导；
- Outbox 原子性；
- deferred 清晰。

---

## IDN-21 — Report / Exit Gate

生成：

```text
docs/docs/development/v2/02-identity/IDENTITY_REPORT.md
```

完成后停止，不自动进入下一 Phase。

---

# 42. Core Happy Paths

## 42.1 Phone New User

```text
Request Phone OTP
→ receive code via provider
→ AuthenticateWithPhoneOtp
→ consume OTP
→ create User(public_id)
→ create phone AuthIdentity
→ create LearningProfile
→ register Device
→ create Session
→ write UserRegistered Outbox
→ issue Access Token + Refresh Token
```

必须：

```text
canonical registration transaction = atomic
```

## 42.2 Phone Existing User

```text
Request Phone OTP
→ AuthenticateWithPhoneOtp
→ resolve AuthIdentity
→ assert account active
→ update Device
→ create Session
→ issue tokens
```

不得创建第二个 User。

## 42.3 Refresh

```text
submit Refresh Token
→ hash
→ lock Session
→ validate active/expiry
→ rotate hash
→ update last_active
→ issue new tokens
```

旧 Refresh Token 立即失效。

## 42.4 Logout

```text
submit current refresh credential
→ revoke Session
→ future Refresh denied
```

## 42.5 Facebook

```text
provider credential
→ server verify
→ provider_subject
→ resolve/create Identity
→ learning direction if new
→ Device
→ Session
→ tokens
```

---

# 43. Core Failure Paths

必须测试：

```text
Wrong OTP
Expired OTP
Locked OTP
OTP replay
Concurrent OTP consumption
Duplicate registration
Disabled account
Closed account
Facebook verification failure
Facebook identity conflict
Revoked device
Device ownership conflict
Expired refresh
Revoked refresh
Refresh replay
Concurrent refresh
DB unique race
Outbox insert failure
Provider delivery failure
```

所有 canonical transaction 失败后不得留下半状态。

---

# 44. Transaction Boundaries

默认一个 Use Case 一个清晰 transaction。

必须单事务：

```text
Phone registration
Phone existing-user login consuming OTP
Bind phone
Change phone
Device revoke + session revoke
Account disable/close + all-session revoke
Refresh rotation
UserRegistered + Outbox
AccountStatusChanged + Outbox
```

外部网络调用原则：

> 不在持有长时间数据库 row lock 时调用外部 provider。

例如 SMS 发送流程需在 Use Case Freeze 中明确 challenge creation 与 delivery failure compensation，不允许持事务等待短信网络请求。

---

# 45. External Call / DB Transaction Rule

必须遵守：

```text
External provider call
≠
long DB transaction
```

Facebook：

```text
verify provider externally
↓
then open DB transaction
```

OTP request：

```text
create challenge
↓
commit
↓
send
↓
if send fails -> mark cancelled / failure policy
```

具体补偿策略在 Use Case Freeze 明确。

OTP consumption/login 不需要外部短信调用，因此可完整保持单 DB transaction。

---

# 46. Idempotency

Design Gate 必须逐 Use Case 标记：

```text
IDEMPOTENT
NON_IDEMPOTENT
IDEMPOTENT_BY_UNIQUE_CONSTRAINT
RETRY_SAFE
```

重点：

- Request OTP：受 cooldown/rate policy；
- Phone Authenticate：同 Challenge 只成功一次；
- Refresh：同旧 token 只成功一次；
- Device register/update：installation_id 可用于幂等；
- Revoke：重复 revoke 返回稳定结果，不制造新副作用。

---

# 47. Data Retention / Cleanup

当前 7 表没有新增 cleanup table。

Phase 2 需要定义后台清理策略，但不要求物理删除 canonical audit facts。

至少规划：

- pending OTP 到期惰性/批量 mark expired；
- active Session 到期 mark expired；
- 是否需要 periodic technical job；
- closed user 数据保留由后续 privacy/product policy 决定。

不得在本 Phase实现未冻结的 hard delete 用户体系。

---

# 48. Background Jobs

如确有需要，可复用 Foundation Worker Host 注册 technical job：

```text
expire OTP challenges
expire sessions
```

但优先采用：

- request-time expiry validation；
- DB index；
- 小规模 periodic cleanup。

不得新建单独 job infrastructure。

---

# 49. Migration / Database Expectations

正常 Identity Phase：

```text
new production migration count = 0
frozen migration diff = 0
```

实施不能要求 ORM 自动建表。

Fresh DB 仍由：

```text
database/v2
```

安装 schema。

---

# 50. File Change Scope

实施阶段主要允许：

```text
apps/backend/src/modules/identity/**
apps/backend/test/**
apps/backend/src/bootstrap/**        # wiring only
apps/backend/src/config/**           # Identity config only
apps/backend/package.json            # required dependencies/scripts
.github/workflows/**                 # CI extension
docs/docs/development/v2/02-identity/**
docs/docs/development/v2/DEVELOPMENT_PROGRESS.md
```

默认不改：

```text
database/v2/migrations/**
```

---

# 51. 明确禁止事项

1. 修改 frozen migrations；
2. 为实现方便新增 Identity 表；
3. 暴露 users.id；
4. 暴露 sessions.id；
5. 暴露 devices.id；
6. 保存 raw OTP；
7. 保存 raw Refresh Token；
8. log token/OTP；
9. 直接信任 Facebook user id；
10. push_token 作为 authentication credential；
11. 为 OTP 引入 Redis；
12. 将 Trust restriction 放入 users.status；
13. 将 Social Profile 放入 basic_profiles；
14. 允许 Learning Direction 切换；
15. 实现 password login；
16. 实现未冻结 provider；
17. 按表生成 CRUD；
18. Identity Repository 查询其他业务 schema；
19. Cross-Domain 使用 internal BIGINT；
20. 自动进入下一个 Phase。

---

# 52. Identity 测试矩阵

| 能力 | Unit | PostgreSQL Integration | HTTP | Race/Security |
|---|---:|---:|---:|---:|
| Phone normalization | ✅ | — | ✅ | ✅ |
| OTP request | ✅ | ✅ | ✅ | ✅ |
| OTP consumption | ✅ | ✅ | ✅ | ✅ |
| Phone registration | ✅ | ✅ | ✅ | ✅ |
| Existing phone login | ✅ | ✅ | ✅ | ✅ |
| Facebook auth | ✅ | ✅ | ✅ | ✅ |
| User repository | ✅ | ✅ | — | ✅ |
| AuthIdentity | ✅ | ✅ | — | ✅ |
| LearningProfile | ✅ | ✅ | ✅ | ✅ |
| BasicProfile | ✅ | ✅ | ✅ | ✅ |
| Device register | ✅ | ✅ | ✅ | ✅ |
| Device revoke | ✅ | ✅ | ✅ | ✅ |
| Session create | ✅ | ✅ | — | ✅ |
| Refresh rotation | ✅ | ✅ | ✅ | ✅ |
| Logout | ✅ | ✅ | ✅ | ✅ |
| Logout all | ✅ | ✅ | ✅ | ✅ |
| Account status | ✅ | ✅ | ✅ | ✅ |
| AuthenticationProvider | ✅ | ✅ | ✅ | ✅ |
| Outbox | ✅ | ✅ | — | ✅ |
| Frozen DB compatibility | — | ✅ | — | ✅ |

---

# 53. Identity Design Gate

编码前必须全部满足：

- [ ] `IDENTITY_IMPLEMENTATION_PLAN.md` 审核通过
- [ ] `IDENTITY_USE_CASES.md` 审核通过
- [ ] `IDENTITY_API.md` 审核通过
- [ ] 7 表物理契约与 Use Case 无冲突
- [ ] OTP verified/consumption 语义已冻结
- [ ] OTP TTL / attempts / resend 已冻结
- [ ] SMS provider 策略已冻结
- [ ] Facebook proof verification 策略已冻结
- [ ] Access Token TTL 已冻结
- [ ] Session TTL/rotation 已冻结
- [ ] Bind/Change Phone 已实现或明确 Deferred
- [ ] Account close/disable 行为已冻结
- [ ] Event inventory 已冻结
- [ ] Error inventory 已冻结
- [ ] API 不含表驱动 CRUD
- [ ] 无要求修改 frozen migration 的 blocker

通过后：

```text
IDENTITY_DESIGN_GATE = PASS
```

---

# 54. Identity Exit Gate

只有全部满足才能：

```text
IDENTITY_GATE = PASS
```

## Application

- [ ] Identity module 完成
- [ ] Typecheck PASS
- [ ] Lint PASS
- [ ] Build PASS
- [ ] Architecture Boundary Audit PASS

## Database

- [ ] Frozen migration diff = 0
- [ ] Fresh migrations PASS
- [ ] Repeated migrations = 0
- [ ] Database audit PASS
- [ ] Identity 7 表 contract PASS
- [ ] Cross-domain FK = 0
- [ ] Cross-domain BIGINT = 0

## Phone / OTP

- [ ] E.164 PASS
- [ ] Raw OTP storage = 0
- [ ] OTP brute-force protection PASS
- [ ] OTP expiry PASS
- [ ] OTP lock PASS
- [ ] OTP replay PASS
- [ ] Concurrent consumption PASS
- [ ] Request rate/cooldown PASS
- [ ] SMS adapter contract PASS

## Registration / AuthIdentity

- [ ] Phone new-user registration PASS
- [ ] Existing phone login PASS
- [ ] Same-phone concurrency PASS
- [ ] Orphan User = 0
- [ ] Facebook existing/new flow PASS
- [ ] Facebook spoofing test PASS

## Session / Token

- [ ] Raw Refresh Token storage = 0
- [ ] Access Token verify PASS
- [ ] wrong iss/aud denied
- [ ] expired token denied
- [ ] refresh rotation PASS
- [ ] refresh replay denied
- [ ] concurrent refresh PASS
- [ ] logout PASS
- [ ] logout-all PASS
- [ ] revoked session denied
- [ ] expired session denied

## Device

- [ ] installation ownership PASS
- [ ] device revoke PASS
- [ ] revoke device sessions PASS
- [ ] push token uniqueness behavior PASS

## Account Status

- [ ] active allowed
- [ ] disabled denied
- [ ] closed denied
- [ ] status transition session revocation PASS
- [ ] account status event PASS if frozen

## Outbox

- [ ] UserRegistered event atomicity PASS
- [ ] AccountStatusChanged atomicity PASS if implemented
- [ ] aggregate_id = users.public_id UUID
- [ ] event payload sensitive-data audit PASS

## HTTP

- [ ] Frozen API implemented exactly
- [ ] public/protected routes correct
- [ ] AuthContext uses public UUID
- [ ] unified error envelope
- [ ] request_id
- [ ] no internal BIGINT leakage
- [ ] no account enumeration leakage beyond frozen policy

## Tests

- [ ] Unit tests PASS
- [ ] Repository Integration PASS
- [ ] Use Case Integration PASS
- [ ] HTTP Integration PASS
- [ ] Race/Security PASS
- [ ] Fresh DB PASS
- [ ] CI PASS

## Documentation

- [ ] `IDENTITY_REPORT.md` generated
- [ ] `DEVELOPMENT_PROGRESS.md` updated
- [ ] TECH_DEBT documented
- [ ] DEFERRED documented
- [ ] OUT_OF_SCOPE_FINDING documented
- [ ] no unresolved blocker

---

# 55. Gate 失败条件

存在任一项即不得 PASS：

- OTP 可重复消费；
- raw OTP/Refresh Token 入库或日志泄漏；
- 同 phone 并发注册可产生多个用户事实；
- refresh replay 可成功；
- Session revoke 后仍可 refresh；
- disabled/closed 用户仍可认证；
- Device 可被另一个 User 无声抢占；
- Facebook identity 未服务端验证；
- Identity API 暴露 internal BIGINT；
- Repository 越 Schema；
- canonical write 与 Outbox 不原子；
- Frozen migration 被修改；
- 核心 Integration Test 使用 mock DB 替代 PostgreSQL；
- API 设计仍存在未决安全语义；
- 外部核心 provider 完全没有 production-capable adapter。

此时：

```text
IDENTITY_GATE = FAIL
```

或根据进度记录规则：

```text
PASS_WITH_BLOCKERS
```

但后续依赖 Phase 只有 `PASS` 才能开始。

---

# 56. Definition of Done

Identity Phase 完成意味着：

> 从 fresh PostgreSQL V2 数据库启动后，系统能够安全完成 phone OTP 新用户注册、已有用户登录、Facebook 身份认证、固定学习方向创建、Device 归属、服务端可撤销 Session、Access/Refresh Token、Refresh Rotation、Logout、账户状态校验、Foundation AuthenticationProvider 接管以及冻结的 Identity Outbox 事件；所有核心流程通过真实 PostgreSQL Integration、并发、安全和 HTTP 测试；全过程不修改 frozen migrations、不泄漏 internal BIGINT、不越 Domain 边界。

---

# 57. 实施后的报告要求

`IDENTITY_REPORT.md` 必须至少记录：

```text
Scope
Use Cases
API
Files Changed
Dependencies Added
DB Changes
Frozen Migration Diff
Repository Tests
Use Case Tests
HTTP Tests
Security Tests
Concurrency Tests
Phone OTP Evidence
Facebook Evidence
Session/Token Evidence
Device Evidence
Outbox Evidence
Architecture Audit
Known Limitations
TECH_DEBT
DEFERRED
OUT_OF_SCOPE_FINDING
IDENTITY_GATE
```

不得仅写“测试通过”而没有关键 Gate 证据。

---

# 58. Phase 完成后的动作

若：

```text
IDENTITY_GATE = PASS
```

则：

1. 更新 `DEVELOPMENT_PROGRESS.md`；
2. Identity 标记 `COMPLETE / PASS`；
3. 冻结 Identity Phase；
4. 停止；
5. 不自动实现下一个 Domain；
6. 依据 `MASTER_DEVELOPMENT_PLAN.md` 再制定下一 Phase 的实施分计划。

---

# 59. Design Audit 后状态

设计审计已完成：

```text
IDENTITY_IMPLEMENTATION_PLAN = COMPLETE
IDENTITY_DESIGN_GATE = PASS
IDENTITY_IMPLEMENTATION_STARTED = NO
```

本次工作在 Gate 处停止；不执行 `IDN-01`，直到收到单独的实施授权。

---

# 60. 总施工顺序

```text
FOUNDATION_GATE = PASS
        ↓
IDENTITY_IMPLEMENTATION_PLAN
        ↓
IDENTITY_USE_CASES
        ↓
IDENTITY_API
        ↓
IDENTITY DESIGN AUDIT
        ↓
IDENTITY_DESIGN_GATE = PASS
        ↓
IDN-01 Module Skeleton
        ↓
IDN-02 Core Types
        ↓
IDN-03 Repositories
        ↓
IDN-04 OTP Technical Services
        ↓
IDN-05 Request Phone OTP
        ↓
IDN-06 OTP Consumption Engine
        ↓
IDN-07 Phone Authenticate/Register
        ↓
IDN-08 Token Services
        ↓
IDN-09 Session Lifecycle
        ↓
IDN-10 Device Lifecycle
        ↓
IDN-11 Facebook Authentication
        ↓
IDN-12 Credential Operations
        ↓
IDN-13 Basic Profile
        ↓
IDN-14 Identity State
        ↓
IDN-15 AuthenticationProvider
        ↓
IDN-16 Outbox Events
        ↓
IDN-17 HTTP/API
        ↓
IDN-18 Domain E2E
        ↓
IDN-19 Security/Race
        ↓
IDN-20 Domain Audit
        ↓
IDN-21 Report
        ↓
IDENTITY_GATE
```

只有：

```text
IDENTITY_GATE = PASS
```

才允许进入下一正式 Phase。
