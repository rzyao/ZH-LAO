---
status: audited
phase: 2
phase_name: Identity Domain
document: IDENTITY_USE_CASES
last_updated: 2026-09-02
depends_on:
  - FOUNDATION_GATE = PASS
  - IDENTITY_IMPLEMENTATION_PLAN.md
database_authority:
  - database/migrations/0100_identity.sql
  - database/migrations/1220_identity_auth_runtime.sql
next_artifact: IDENTITY_API.md
lifecycle: historical
---

# ZH-LAO  — IDENTITY USE CASES

> 目标路径：`docs/docs/development/02-identity/IDENTITY_USE_CASES.md`
>
> 本文冻结 PHASE 2 — Identity Domain 的业务用例、事务边界、安全语义、并发语义、幂等语义、事件和测试要求。
>
> 本文不设计具体 HTTP path，不进入编码，不重新设计数据库。
>
> 物理数据库事实以 frozen migration 为准；本文只定义 Application / Use Case 行为。

---

# 1. 文档结论

Identity 当前 Use Case 设计已形成可供 API 设计使用的完整行为契约：

```text
IDENTITY_USE_CASES_STATUS = AUDITED / READY_FOR_IMPLEMENTATION
```

当前没有需要修改 frozen migration 才能解决的 blocker。

下一步：

```text
IDENTITY_API.md
```

仍然不得进入编码。

---

# 2. 全局 Identity 原则

所有 Use Case 必须遵守：

1. User 对外稳定标识永远是 `identity.users.public_id UUID`。
2. `users.id`、`sessions.id`、`devices.id` 等 BIGINT 只在 Identity 内部使用。
3. Phone canonical form 固定为 E.164。
4. 当前 Auth Provider 仅：
   - `phone`
   - `facebook`
5. 当前学习方向仅：
   - `lo -> zh`
   - `zh -> lo`
6. 学习方向注册后当前版本不可修改。
7. Raw OTP 永不持久化、永不写日志、永不写 Outbox。
8. Raw Refresh Token 永不持久化、永不写日志。
9. OTP 验证必须与其业务消费动作绑定，不产生可重复使用 verified ticket。
10. Refresh Token 每次成功使用必须 rotation。
11. 账户状态只允许：
    - `active`
    - `disabled`
    - `closed`
12. `disabled` / `closed` 用户不能完成认证。
13. Device 的 `installation_id UUID` 是客户端安装标识，不是用户身份凭证。
14. Identity Repository 不访问其他业务 Schema。
15. Canonical write + Outbox 必须同事务。
16. 不引入 Redis、Kafka、RabbitMQ 解决本 Phase 问题。
17. 所有业务 API 必须从本文 Use Case 推导，禁止按数据库表生成 CRUD。

---

# 3. V1 Use Case 总表

| Use Case | 分类 | V1 状态 | Auth |
|---|---|---|---|
| RequestPhoneOtp | Public | REQUIRED | No |
| AuthenticateWithPhoneOtp | Public | REQUIRED | No |
| AuthenticateWithFacebook | Public | REQUIRED | No |
| RefreshSession | Public credential | REQUIRED | Refresh credential |
| LogoutCurrentSession | Auth/session | REQUIRED | Yes / refresh credential |
| LogoutAllSessions | Authenticated | REQUIRED | Yes |
| GetCurrentIdentity | Authenticated | REQUIRED | Yes |
| GetCurrentAccountStatus | Authenticated | REQUIRED | Yes |
| GetOwnBasicProfile | Authenticated | REQUIRED | Yes |
| UpdateOwnBasicProfile | Authenticated | REQUIRED | Yes |
| RegisterOrUpdateDevice | Internal sub-flow | REQUIRED | During auth / Yes |
| ListMyDevices | Authenticated | REQUIRED | Yes |
| RevokeDevice | Authenticated | REQUIRED | Yes |
| ListMySessions | Authenticated | REQUIRED | Yes |
| RevokeSession（仅当前 Session / Device 范围） | Authenticated | REQUIRED | Yes |
| BindPhone | Authenticated | REQUIRED | Yes |
| ChangePhone | Authenticated | REQUIRED | Yes |
| ReadLearningProfile | Authenticated | REQUIRED | Yes |
| ChangeLearningDirection | — | NOT_SUPPORTED | — |
| DisableAccount | Internal/Admin contract | DEFERRED | Internal |
| ReEnableDisabledAccount | Internal/Admin contract | DEFERRED | Internal |
| CloseOwnAccount | Authenticated | DEFERRED | Yes |
| RestoreClosedAccount | — | NOT_SUPPORTED | — |

说明：

- `BindPhone` / `ChangePhone` 之所以纳入 V1，是因为数据库已经冻结对应 OTP purpose，且 Facebook 用户需要形成可绑定手机号的完整 credential lifecycle。
- Account Status 的运行时认证语义在 V1 必须实现；主动变更账户状态的产品入口本 Phase 不强行开放，先保留内部 contract 设计并标记 Deferred。
- `closed` 当前视为终态，不设计恢复。

---

# 4. OTP 全局参数

V1 冻结如下：

```text
OTP_LENGTH = 6 digits
OTP_TTL = 5 minutes
OTP_MAX_ATTEMPTS = 5
OTP_RESEND_COOLDOWN = 60 seconds
OTP_PHONE_LIMIT = 5 requests / 30 minutes / phone / purpose
OTP_PHONE_DAILY_LIMIT = 10 requests / 24 hours / phone / purpose
OTP_IP_LIMIT = 20 requests / 30 minutes / IP
```

这些是业务策略默认值，实施时通过 typed config 暴露，不散落硬编码。

当前不使用 Redis。

IP limiter 在当前单体部署下允许进程内短窗口实现；phone/purpose 的 durable 限制必须基于 PostgreSQL `otp_challenges` 事实。

---

# 5. OTP Challenge 唯一活跃规则

对于同一个：

```text
phone_number + purpose
```

同一时间最多允许一个逻辑有效的 pending Challenge。

该规则不是数据库唯一约束；实施必须在创建/替换流程开始时，在同一 PostgreSQL transaction 内取得由规范化 `phone_number + purpose` 派生的 transaction-scoped advisory lock。该锁覆盖“读取近期 Challenge → cooldown/rate 判定 → 取消旧 pending → 创建新 Challenge”的完整临界区。不能仅依赖普通查询或 application-memory lock，否则并发 Request 可留下多个 pending Challenge。

Request 新 OTP 时：

1. 查询近期 Challenge；
2. 若仍处于 resend cooldown：
   - 不创建新 Challenge；
   - 返回统一 rate-limited 语义；
3. cooldown 已过：
   - 旧 pending Challenge 标记 `cancelled`；
   - 创建新的 pending Challenge；
4. 新 OTP 成功创建后再调用短信 Provider；
5. Provider 发送失败：
   - 以 Challenge 自己的 internal id 在短 transaction 中重新读取并锁定；只有它仍为 `pending` 时才标记 `cancelled`；
   - 返回 `PROVIDER_UNAVAILABLE`；
6. 不恢复旧 Challenge，也绝不取消较新的 Challenge。

这样保证“最新发送的 OTP 是唯一可使用 OTP”。

---

# 6. OTP 验证与消费原则

禁止设计：

```text
VerifyOtp
→ Challenge status = verified
→ 返回 reusable verification ticket
→ 以后再 Login / Bind / Change
```

V1 正式规则：

> OTP 只在实际业务 Use Case 中验证，并在同一事务内完成消费。

例如：

```text
AuthenticateWithPhoneOtp
BEGIN
  lock Challenge
  verify code
  resolve/create identity
  create Session
  mark Challenge verified
COMMIT
```

如果后续业务步骤失败：

```text
ROLLBACK
```

Challenge 仍保持未成功消费状态。

错误 OTP：

- attempt_count + 1；
- 达 max_attempts 后 status = locked；
- 该失败更新必须提交；
- 不因业务 transaction rollback 丢失失败次数。

因此实现时允许 OTP 失败计数使用一个明确的小事务，而成功消费事务与实际业务动作保持原子。

---

# 7. Anti-Enumeration 原则

以下 Public Use Case 不应泄漏手机号是否已注册：

- RequestPhoneOtp
- AuthenticateWithPhoneOtp 的非关键前置阶段

RequestPhoneOtp 成功响应语义统一：

> “如果请求可被处理，验证码已发送。”

但真正的：

- rate limited
- invalid phone format
- provider unavailable

可返回稳定通用错误。

不得返回：

```text
PHONE_NOT_REGISTERED
PHONE_ALREADY_REGISTERED
```

作为 Public OTP Request 的账号枚举信号。

---

# 8. UC-ID-001 — RequestPhoneOtp

## 目标

为 phone credential 相关动作创建一次性 Challenge 并发送 OTP。

## Actor

未认证用户或已认证用户。

## Authentication Requirement

根据 purpose：

```text
login        -> Public
bind_phone   -> Authenticated
change_phone -> Authenticated
```

## Input

```text
phone
purpose
```

Authenticated purpose 还隐式包含：

```text
current user public_id
```

## Canonical Normalization

`phone` → E.164。

## Preconditions

### login

无账户存在性要求。

### bind_phone

- 当前用户 authenticated；
- 当前用户尚未拥有 phone identity；
- 目标 phone 当前不能已属于另一 User。

### change_phone

- 当前用户 authenticated；
- 当前用户已有 phone identity；
- 新 phone 与当前 phone 不同；
- 新 phone 当前不能已属于另一 User。

## Main Flow

```text
validate auth requirement
normalize phone
validate purpose-specific preconditions
check phone/purpose durable rate limits
check IP rate limit
check resend cooldown
cancel previous pending if eligible
generate OTP
hash OTP
insert pending challenge
commit
send OTP via provider
if provider failure:
  mark challenge cancelled
return safe success
```

## Transaction Boundary

Challenge creation 为短事务。

短信 Provider 调用必须在 DB transaction 外执行。

Provider failure compensation 单独短事务标记 cancelled。

## Tables

```text
identity.otp_challenges
identity.auth_identities (bind/change precondition only)
```

## Concurrency

同 phone+purpose 并发 Request 必须通过 application locking/transaction ordering 与时间查询保证不会产生两个都可消费的逻辑 pending Challenge。

即使发生瞬时多行 pending：

> 后续消费只接受最新仍有效且未 cancelled 的 Challenge。

实现必须提供真实并发测试。

## External Provider

SMS/OTP Provider。

## Idempotency

不是严格幂等。

但 cooldown 内重复调用不能持续发送新 OTP。

## Success

不返回 OTP。

Test Fake Provider 可在测试环境捕获 OTP。

## Failures

- `INVALID_PHONE`
- `OTP_RATE_LIMITED`
- `IDENTITY_CONFLICT`
- `PROVIDER_UNAVAILABLE`
- `UNAUTHENTICATED`

## Security

- 不记录 raw OTP；
- phone 日志 mask；
- anti-enumeration；
- provider secret redaction。

## Outbox

无。

## Required Tests

- canonical E.164；
- cooldown；
- phone limit；
- IP limit；
- provider failure；
- old pending cancelled；
- bind/change auth requirement；
- no raw OTP log。

---

# 9. UC-ID-002 — AuthenticateWithPhoneOtp

## 目标

用 phone OTP 完成：

- 已有用户登录；
- 或首次 phone 用户注册。

OTP 验证和消费不拆开。

## Actor

Public user。

## Input

```text
phone
otp_code
learning_direction?   # 新用户必须
device?               # installation_id/platform/metadata
```

## Canonicalization

- phone → E.164；
- installation_id → UUID；
- learning direction → frozen enum pair。

## Preconditions

- 存在最新可消费 login Challenge；
- status = pending；
- 未 expired；
- 未 locked；
- attempts < max；
- OTP 正确。

## Existing User Main Flow

```text
BEGIN
lock latest valid login challenge
verify OTP
resolve (phone, E.164) AuthIdentity
resolve User
assert User.status = active
register/update owned Device
create Session
touch AuthIdentity last_login
mark Challenge verified + verified_at
COMMIT

issue Access Token + raw Refresh Token
```

## New User Main Flow

```text
BEGIN
lock latest valid login challenge
verify OTP
confirm no phone AuthIdentity
validate learning_direction
create User(public_id UUID)
create phone AuthIdentity
create LearningProfile
create BasicProfile(empty/default)
register Device if supplied
create Session
mark Challenge verified + verified_at
write UserRegistered Outbox
COMMIT

issue Access Token + raw Refresh Token
```

### BasicProfile 决策

V1 冻结：

> 新 User 同事务创建一条 `basic_profiles` 空/default row。

原因：

- User 创建后 Basic Profile 始终存在；
- 后续 `GetOwnBasicProfile` 不需要处理“有 User 但无 Profile”的额外状态；
- 不修改数据库结构。

## Transaction

新/旧两条路径都必须保持 Identity canonical write 原子。

Token 签发的 raw credential 在事务提交后返回。

## Tables

```text
identity.otp_challenges
identity.auth_identities
identity.users
identity.learning_profiles
identity.basic_profiles
identity.devices
identity.sessions
infrastructure.system_outbox_events (new user)
```

通过 Foundation Outbox Writer 写 Outbox。

## Row Locking

必须锁定 Challenge。

并发首次注册还必须依赖：

```text
UNIQUE(provider, provider_subject)
```

作为最终数据库竞争保护。

## Idempotency

同一个 Challenge：

```text
最多一个成功消费
```

重复请求必须返回 OTP 已使用/认证无效语义，不再次建立新 User。

## Account Status

- active → 登录允许
- disabled → `ACCOUNT_DISABLED`
- closed → `ACCOUNT_CLOSED`

## Learning Direction

已有用户：

- 忽略/禁止客户端重新提交 learning direction 来修改现值。

新用户：

- 必填；
- 只能 frozen 两种组合。

## Success Result

逻辑返回：

```text
user_public_id
account_status
access_token
access_token_expires_in
refresh_token
session_expires_at
is_new_user
```

具体 HTTP response 结构留给 API 文档。

## Outbox

新用户：

```text
UserRegistered
```

已有用户登录：

无。

## Security

- OTP one-time；
- no account enumeration；
- no internal BIGINT；
- raw refresh token 不落库；
- token 不进日志。

## Required Tests

- new user；
- existing user；
- wrong OTP；
- expired；
- locked；
- replay；
- concurrency；
- same phone registration race；
- disabled/closed；
- transaction rollback；
- Outbox atomicity；
- no orphan User。

---

# 10. UC-ID-003 — AuthenticateWithFacebook

## 目标

使用 Facebook credential 完成已有用户登录或新用户注册。

## Actor

Public。

## Input

```text
facebook_credential
learning_direction?   # new user required
device?
```

## Preconditions

客户端提供的 credential 必须由服务端向 Facebook 验证。

## External Call

Facebook verification 必须在数据库 transaction 外完成。

输出稳定：

```text
provider_subject
```

以及仅业务确实需要的 provider metadata。

## Existing User Flow

```text
verify Facebook credential externally
resolve provider_subject

BEGIN
find AuthIdentity(facebook, subject)
resolve User
assert active
register/update Device
create Session
touch last_login
COMMIT

issue tokens
```

## New User Flow

```text
verify externally
validate learning_direction

BEGIN
re-check no existing Facebook identity
create User
create Facebook AuthIdentity
create LearningProfile
create BasicProfile
register Device
create Session
write UserRegistered
COMMIT

issue tokens
```

## Phone Requirement

V1 冻结：

> Facebook 新用户不强制立即绑定手机号。

用户可后续使用 `BindPhone`。

不得自行把 phone 设为 Facebook 注册前置条件。

## Tables

```text
identity.users
identity.auth_identities
identity.learning_profiles
identity.basic_profiles
identity.devices
identity.sessions
```

加 Foundation Outbox。

## Concurrency

同 Facebook subject 并发首次登录最终只允许一个 AuthIdentity/User canonical result。

## Failures

- `INVALID_CREDENTIAL`
- `PROVIDER_UNAVAILABLE`
- `IDENTITY_CONFLICT`
- `ACCOUNT_DISABLED`
- `ACCOUNT_CLOSED`
- `INVALID_LEARNING_DIRECTION`

## Outbox

新用户：

```text
UserRegistered
```

已有用户：

无。

## Tests

- fake provider valid/invalid；
- provider unavailable；
- new/existing；
- concurrency；
- disabled/closed；
- direct spoofed subject rejected；
- Outbox atomicity。

---

# 11. UC-ID-004 — RefreshSession

## 目标

使用 opaque Refresh Token 安全续签 Access Token，并旋转 Refresh Token。

## Actor

持有 Refresh credential 的客户端。

## Auth Requirement

不要求有效 Access Token。

Refresh Token 本身是凭证。

## Input

```text
refresh_token
device installation context? (optional verification)
```

## Frozen TTL

```text
ACCESS_TOKEN_TTL = 15 minutes
SESSION_TTL = 30 days
SESSION_SLIDING = YES
SESSION_MAX_ABSOLUTE_AGE = not represented by frozen schema -> NOT_SUPPORTED in V1
```

由于当前 schema 没有 `created_absolute_expiry` 独立字段：

> V1 Session 使用 sliding 30-day expiry；每次成功 Refresh 将 `expires_at` 延长为 now + 30 days。

这符合现有 frozen table，不新增 token family 表。

## Main Flow

```text
hash refresh token

BEGIN
SELECT session FOR UPDATE by refresh_token_hash
verify status=active
verify expires_at > now
resolve User
assert user active
if device bound:
  assert device not revoked
generate next raw refresh token
hash next refresh token
replace refresh_token_hash
extend expires_at = now + 30 days
touch last_active_at
COMMIT

issue new Access Token
return new raw Refresh Token
```

## Concurrency

同一旧 Refresh Token 并发两个请求：

- 第一个持 row lock；
- rotation 后旧 hash 不再存在；
- 第二个失败。

## Replay

旧 Refresh Token 在 rotation 后不可再次使用。

当前 schema 无 token-family history，因此：

> V1 只能拒绝旧 token，不能识别“旧 token 被盗用后自动 revoke 整个 token family”。

不为此新增表。

## Failure

- `INVALID_CREDENTIAL`
- `SESSION_REVOKED`
- `SESSION_EXPIRED`
- `DEVICE_REVOKED`
- `ACCOUNT_DISABLED`
- `ACCOUNT_CLOSED`

## Outbox

无。

## Tests

- successful rotation；
- old token replay；
- concurrent refresh；
- expired；
- revoked；
- disabled/closed；
- device revoked；
- log redaction。

---

# 12. UC-ID-005 — LogoutCurrentSession

## 目标

撤销客户端当前 Refresh Session。

## Actor

当前客户端。

## Credential

优先使用 Refresh Token 定位 Session。

Access Token 可作为辅助身份，但不能依赖 internal session id claim。

## Main Flow

```text
hash refresh token

BEGIN
lock session
if active:
  set status=revoked
  set revoked_at
  set revocation_reason='user_logout'
COMMIT
```

## Idempotency

重复 logout：

```text
RETRY_SAFE
```

已经 revoked 的 Session 返回稳定成功语义，不暴露内部差异。

## Access Token

已经签发的 Access Token：

- 不进入 blacklist；
- 最多存活 15 分钟；
- Refresh 立即失效。

## Outbox

无。

---

# 13. UC-ID-006 — LogoutAllSessions

## 目标

当前用户撤销所有 Refresh Session。

## Actor

Authenticated User。

## Main Flow

```text
BEGIN
revoke all active sessions for user
revocation_reason='user_logout_all'
COMMIT
```

## Current Access Token

仍可能在 15 分钟内有效，但所有 Refresh 已失效。

## Idempotency

重复调用稳定成功。

## Outbox

无。

## Tests

- multiple sessions；
- all revoked；
- refresh after call denied；
- current access-token semantics。

---

# 14. UC-ID-007 — GetCurrentIdentity

## 目标

返回当前认证 User 的稳定账户级 Identity 摘要。

## Actor

Authenticated User。

## Read Model

从 Identity 自身读取：

```text
users.public_id
users.status
auth providers summary
learning profile
basic profile existence/summary
```

不返回：

- internal bigint；
- raw phone credential details beyond API policy；
- sessions internal ids；
- provider tokens。

## Transaction

普通 read，不需要 explicit transaction。

## Cross-Domain

无。

---

# 15. UC-ID-008 — GetCurrentAccountStatus

## 目标

返回：

```text
active / disabled / closed
```

## Actor

Authenticated User。

注意：

AuthenticationProvider 已经拒绝 disabled/closed Access Token 使用。

因此该 public authenticated Use Case 实际主要对 active 用户有意义。

内部调用 contract 可以读取任意状态，用于 Operations/未来系统集成。

## Cross-Domain Public Contract

Identity 可在 `public/` 暴露：

```text
IsIdentityActive(user_public_id)
GetIdentityAccountStatus(user_public_id)
```

其他 Domain 不得直接查表。

---

# 16. UC-ID-009 — GetOwnBasicProfile

## Actor

Authenticated User。

## Result

冻结字段对应的 own profile。

avatar 只返回 logical `asset_id` 或经 Foundation Asset contract 转换后的安全展示信息。

## Cross-Domain

不访问 Social。

---

# 17. UC-ID-010 — UpdateOwnBasicProfile

## Actor

Authenticated User。

## Allowed Fields

仅 whitelist：

```text
display_name
gender
birth_date
country_code
region_code
avatar_media_id
```

具体字段 nullability/constraint 服从 frozen migration。

## Forbidden

不能修改：

- user_id；
- users.status；
- learning direction；
- auth identities；
- timestamps；
- internal IDs。

## Avatar

如果提供 `avatar_media_id`：

- 必须是 UUID；
- 可通过 Foundation AssetRepository 检查资产存在/可用；
- Identity 仍只保存 logical UUID。

## Transaction

单 Identity transaction。

## Outbox

V1 无。

---

# 18. UC-ID-011 — ReadLearningProfile

## Actor

Authenticated User。

## Result

```text
native_language
learning_language
```

## Mutation

V1：

```text
ChangeLearningDirection = NOT_SUPPORTED
```

API 不提供更新学习方向 endpoint。

---

# 19. UC-ID-012 — RegisterOrUpdateDevice

## 定位

这是认证流程与登录后设备更新都会复用的内部 Application Use Case/Service。

## Input

```text
installation_id UUID
platform android/ios
device_name?
app_version?
push_token?
```

## Rules

如果 installation_id 不存在：

- 为当前 User 创建 Device。

如果属于当前 User 且未 revoked：

- 更新 metadata；
- touch last_seen。

如果属于另一个 User：

```text
DEVICE_OWNERSHIP_CONFLICT
```

不得自动转移 owner。

如果属于当前 User 但 revoked：

V1 冻结：

> 成功完成强认证后允许恢复该 installation。

恢复动作：

```text
revoked_at = NULL
update metadata
```

原因：

- installation_id 表示同一 App 安装；
- 用户本人重新完成 phone/Facebook 强认证后，允许恢复自己的已撤销 Device；
- 不能由仅持 Access Token 的普通 metadata update 自动恢复。

因此内部调用需要：

```text
authentication_strength = fresh_primary_auth | existing_session
```

只有 `fresh_primary_auth` 可恢复 revoked Device。

## Push Token

如果新 push token 已被其他 active Device 占用：

- 依 frozen DB 唯一约束；
- application 需要明确释放同 User 的旧关联或返回 conflict；
- 不允许跨 User 无声抢 token。

V1 规则：

> 同 User 可迁移 push_token；跨 User 冲突返回 `DEVICE_OWNERSHIP_CONFLICT`。

---

# 20. UC-ID-013 — ListMyDevices

## Actor

Authenticated User。

## Result

只返回 logical/safe fields：

- installation_id；
- platform；
- device_name；
- app_version；
- first_seen_at；
- last_seen_at；
- revoked state。

默认不返回完整 push_token。

不得返回 device BIGINT id。

---

# 21. UC-ID-014 — RevokeDevice

## Actor

Authenticated User。

## Input

```text
installation_id UUID
```

## Main Flow

```text
BEGIN
resolve device owned by current User
set revoked_at
revoke all active sessions bound to device
COMMIT
```

## Idempotency

重复 revoke → stable success。

## Current Device

如果撤销当前 device：

- 当前 Refresh Session 一并 revoke；
- Access Token 最多继续到 15 分钟 TTL。

## Outbox

V1 无。

---

# 22. UC-ID-015 — ListMySessions

## Actor

Authenticated User。

## Output

Session 不能暴露 internal BIGINT id。

当前 frozen Session 没有 public UUID，因此 V1 API 识别 Session 时采用：

```text
device installation_id + session metadata
```

如果存在无 Device Session：

> API 只提供列表展示，不允许用 internal session id 操作。

为保持数据库不变，V1 `RevokeSession` 的可寻址能力限定为：

- 按 Device 撤销；
- 或 Current Session；
- 或 All Sessions。

因此真正的“任意单 Session revoke by public session id”当前无法安全暴露。

结论：

```text
ListMySessions = REQUIRED
RevokeArbitrarySession = DEFERRED
RevokeDeviceSessions = REQUIRED via RevokeDevice
LogoutCurrentSession = REQUIRED
LogoutAllSessions = REQUIRED
```

这避免新增 `sessions.public_id`。

---

# 23. UC-ID-016 — RevokeSession

根据上一节，V1 将这个需求裁决为：

```text
REVOKE_CURRENT_SESSION -> REQUIRED
REVOKE_SESSIONS_BY_DEVICE -> REQUIRED
REVOKE_ARBITRARY_SESSION -> DEFERRED
```

原因不是产品不需要，而是 frozen schema 没有稳定跨 HTTP 暴露的 Session logical UUID。

禁止暴露 Session BIGINT 来凑 API。

未来如确实需要“从列表点击撤销某一无 Device Session”：

> 进入新的设计变更，而不是当前 Phase 修改 frozen migration。

---

# 24. UC-ID-017 — BindPhone

## V1

REQUIRED。

## Actor

已认证且当前没有 phone AuthIdentity 的 User。

## 两阶段交互

阶段一：

```text
RequestPhoneOtp(purpose=bind_phone)
```

阶段二：

```text
BindPhone(phone, otp_code)
```

OTP 验证不独立。

## Main Flow

```text
BEGIN
lock bind_phone Challenge
verify OTP
assert Challenge.phone_number = requested canonical E.164 phone
lock current User row
assert current user still has no phone identity
assert target phone unowned
create phone AuthIdentity
mark Challenge verified
COMMIT
```

## Concurrency

依赖 `(provider, provider_subject)` UNIQUE 最终保护。

## Idempotency

同 Challenge 只成功一次。

## Outbox

V1 无。

## Security

不能绑定已属于其他 User 的 phone。

---

# 25. UC-ID-018 — ChangePhone

## V1

REQUIRED。

## Actor

已认证且已有 phone AuthIdentity 的 User。

## Input

```text
new_phone
otp_code
```

OTP purpose：

```text
change_phone
```

## Old Phone Rule

V1 冻结：

> ChangePhone 是修改当前 phone AuthIdentity 的 provider_subject，不保留旧 phone identity。

原因：

- 当前模型中 phone 是 credential identity；
- 保留旧 phone 会使“改手机号”变成多手机号绑定；
- 当前没有多手机号产品设计。

## Main Flow

```text
BEGIN
lock change_phone Challenge
verify OTP
assert Challenge.phone_number = requested canonical E.164 new phone
lock current User row
lock current user's phone AuthIdentity
assert new phone unowned
update provider_subject to new E.164
mark Challenge verified
COMMIT
```

## Current Sessions

不强制 revoke 当前所有 Sessions。

因为用户已通过当前登录身份 + 新手机号 OTP 完成强认证。

## Outbox

V1 无。

## Failure

- no current phone identity；
- new phone already owned；
- OTP invalid/expired/locked；
- account not active。

---

# 26. Account Status 生命周期

Frozen states：

```text
active
disabled
closed
```

允许状态图：

```text
active   -> disabled
disabled -> active
active   -> closed
disabled -> closed
closed   -> (no transition in V1)
```

`closed` 为 V1 终态。

## Auth Semantics

```text
active   -> authentication allowed
disabled -> authentication denied
closed   -> authentication denied
```

## Session Rule

进入：

```text
disabled
closed
```

必须同事务 revoke 全部 active Sessions。

---

# 27. UC-ID-019 — DisableAccount

## V1 状态

```text
DEFERRED PRODUCT ENTRY
```

原因：

- Identity 必须具备 disabled 认证语义；
- 但谁执行 disable 属于 Operations/Trust 后续明确的管理流程；
- 当前不建立 Public 用户入口。

Identity 可以在 `public/internal` contract 预留业务能力设计，但 PHASE 2 不要求对外 route。

如果后续 Operations/Trust 调用：

```text
BEGIN
active -> disabled
revoke all sessions
write AccountStatusChanged
COMMIT
```

---

# 28. UC-ID-020 — ReEnableDisabledAccount

## V1

DEFERRED。

属于后续 Operations 管理流程。

允许状态：

```text
disabled -> active
```

事件：

```text
AccountStatusChanged
```

---

# 29. UC-ID-021 — CloseOwnAccount

## V1

DEFERRED。

原因：

真正“注销账户”通常还牵涉：

- 数据保留；
- 法务/隐私；
- Commerce 未结事项；
- Social/Chat 内容；
- Trust records；
- 冷静期/恢复策略。

这些跨域规则当前尚未进入相应 Phase。

因此 Identity 只冻结 `closed` 的运行时语义，不提前上线用户自助注销。

不得创建半成品 delete-account API。

---

# 30. Outbox Event Inventory

V1 Identity Outbox：

| Event | 状态 | Producer |
|---|---|---|
| `identity.user_registered.v1` | REQUIRED | new phone/facebook registration |
| `identity.account_status_changed.v1` | REQUIRED when status transition contract used | account status change |

不产生：

- OTP requested；
- OTP verified；
- session created；
- session refreshed；
- device updated；
- profile updated。

除非未来出现明确跨域 consumer。

---

# 31. `identity.user_registered.v1`

## Aggregate

```text
aggregate_type = user
aggregate_id = users.public_id UUID
```

## Payload

建议最小：

```text
user_id          # public UUID
auth_provider    # phone/facebook
native_language
learning_language
registered_at
```

禁止：

- phone number；
- OTP；
- provider token；
- refresh token；
- internal BIGINT；
- push token。

## Atomicity

与新 User canonical registration 同事务。

---

# 32. `identity.account_status_changed.v1`

## Aggregate

User public UUID。

## Payload

```text
user_id
old_status
new_status
occurred_at
```

禁止放 Trust-specific reason/capability。

Identity 可以保留自己的 revocation_reason，但跨域事件不泄漏不必要内部信息。

---

# 33. Transaction Matrix

| Use Case | Transaction | Row Lock | Outbox |
|---|---|---|---|
| RequestPhoneOtp | short create + optional compensation | optional pending coordination | No |
| AuthenticateWithPhoneOtp existing | Yes | OTP | No |
| AuthenticateWithPhoneOtp new | Yes | OTP + DB unique protection | UserRegistered |
| AuthenticateWithFacebook existing | Yes after provider verify | as needed | No |
| AuthenticateWithFacebook new | Yes after provider verify | DB unique protection | UserRegistered |
| RefreshSession | Yes | Session | No |
| LogoutCurrentSession | Yes | Session | No |
| LogoutAllSessions | Yes | sessions update | No |
| UpdateOwnBasicProfile | Yes | optional | No |
| RegisterOrUpdateDevice | Yes | device/unique protection | No |
| RevokeDevice | Yes | Device / sessions | No |
| BindPhone | Yes | OTP + identity | No |
| ChangePhone | Yes | OTP + identity | No |
| Disable/Close internal | Yes | User + sessions | AccountStatusChanged |

---

# 34. Concurrency Matrix

| Race | Required Result |
|---|---|
| Request OTP × Request OTP | cooldown + latest valid challenge semantics |
| Authenticate same OTP ×2 | one success maximum |
| Same phone first registration ×2 | one canonical User/AuthIdentity |
| Same Facebook subject ×2 | one canonical User/AuthIdentity |
| Refresh same token ×2 | one success maximum |
| Refresh vs Logout | serialization; revoked/rotated loser fails |
| Refresh vs LogoutAll | one committed order, no refresh from revoked state |
| Device registration same installation ×2 | one Device owner |
| Device ownership different users | no silent transfer |
| Bind same phone by two users | one success maximum |
| Change to already claimed phone | conflict |
| Account disable vs refresh | once disabled commits, future auth/refresh denied |

`Request OTP × Request OTP` 必须使用真实 PostgreSQL 并发测试验证 advisory-lock 临界区：最终至多一条 `pending`，且 provider failure compensation 不会取消较新的 Challenge。`BindPhone` 必须验证两个不同 phone 的并发 bind 同一 User 时，User row lock 令其中一个在重读后返回 `PHONE_ALREADY_BOUND`，从而不形成 multi-phone identity。

---

# 35. Idempotency Matrix

| Use Case | Semantics |
|---|---|
| RequestPhoneOtp | rate-controlled, not idempotent |
| Phone Authenticate | one-time Challenge consumption |
| Facebook Authenticate existing | retry may create new Session; client should avoid duplicate submission |
| Refresh | one-time old token |
| LogoutCurrent | idempotent/retry-safe |
| LogoutAll | idempotent/retry-safe |
| Get* | idempotent |
| UpdateBasicProfile | last-write semantics |
| Device metadata update | idempotent by installation_id |
| RevokeDevice | idempotent |
| BindPhone | one-time OTP consumption |
| ChangePhone | one-time OTP consumption |
| Account status set-to-current | idempotent |

---

# 36. Rate Limit Matrix

| Action | Durable Limit | Short-window/IP |
|---|---|---|
| Request login OTP | 5/30m, 10/24h per phone/purpose | 20/30m/IP |
| Request bind OTP | same | same |
| Request change OTP | same | same |
| OTP attempts | max 5/challenge | request-level anti-abuse |
| Facebook auth | provider + application request limiter | IP limiter |
| Refresh | no DB count limit by default | abuse limiter |
| Login HTTP | OTP/provider already limits | IP limiter |

具体 HTTP status/header 由 API 文档设计。

---

# 37. Error Inventory

API 文档必须从以下 Identity semantic errors 映射：

```text
INVALID_PHONE
INVALID_LEARNING_DIRECTION
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
PHONE_ALREADY_BOUND
PHONE_NOT_BOUND
DEVICE_REVOKED
DEVICE_OWNERSHIP_CONFLICT
PROVIDER_UNAVAILABLE
UNAUTHENTICATED
FORBIDDEN
VALIDATION_ERROR
```

不直接把 PostgreSQL constraint 名称暴露给客户端。

---

# 38. AuthenticationProvider 行为

Identity 正式实现 Foundation AuthenticationProvider：

```text
Bearer Access Token
↓
verify signature
↓
verify iss/aud/exp
↓
sub UUID
↓
find User by public_id
↓
status == active
↓
AuthContext
```

## AuthContext

至少：

```text
user_public_id UUID
```

可以包含安全需要的账户状态。

禁止：

```text
internal user BIGINT
raw token
phone
provider credential
```

作为跨模块默认上下文数据。

---

# 39. Access / Refresh Token Frozen Policy

V1：

```text
Access Token format = JWT
Access Token TTL = 15 minutes
Refresh Token format = opaque cryptographically random
Session TTL = 30 days sliding
Refresh Rotation = ALWAYS
Refresh raw storage = NEVER
```

JWT 至少验证：

```text
signature
alg allowlist
issuer
audience
exp
sub UUID
```

禁止接受 `alg=none` 或由 token 自己选择危险 algorithm。

---

# 40. Session Device Binding

如果认证请求提供 Device：

```text
session.device_id = resolved Device internal id
```

如果客户端无法提供 installation 信息：

允许：

```text
session.device_id = NULL
```

但：

- 移动客户端正常登录应提供 installation_id；
- ListMySessions 对无 Device Session 只显示通用 session entry；
- arbitrary revoke 仍 deferred。

---

# 41. Basic Profile 规则

新用户创建空/default profile。

允许用户后续补充：

- display name；
- gender；
- birth date；
- country；
- region；
- avatar。

V1 不把这些字段作为身份认证前置，除非 `IDENTITY_API.md` 对新用户 onboarding response 明确提出。

---

# 42. Learning Profile 规则

新 User 必须立即有一条 LearningProfile。

这是注册事务的 required canonical fact。

没有 LearningProfile 的 User 应被视为数据不完整，不通过正常新注册路径产生。

---

# 43. Phone Credential 生命周期

```text
No phone
  ↓ BindPhone
phone A
  ↓ ChangePhone
phone B
```

V1 不支持：

```text
phone A + phone B simultaneously
```

Facebook identity 可以与 phone identity 共存。

因此 User 可拥有：

```text
facebook
phone
```

两个 Provider Identity。

---

# 44. Facebook Credential 生命周期

V1 实现：

- login/register with Facebook。

V1 不实现：

- unlink Facebook；
- change Facebook identity；
- multiple Facebook identities。

如果用户同时拥有 phone + Facebook，二者都可以解析到同一个 User。

“如何把一个已有 phone User 和首次 Facebook credential 合并”需要绑定流程支持，但当前数据库/产品没有专门的 `BindFacebook` OTP/credential flow。

因此 V1 冻结：

```text
BindFacebookToExistingUser = DEFERRED
```

Facebook Authenticate 的 new subject 默认创建新 User，除非该 subject 已绑定。

不得通过手机号猜测自动合并账户。

---

# 45. Account Merge

V1：

```text
AccountMerge = NOT_SUPPORTED
```

禁止：

- 自动按手机号/姓名合并；
- 自动把 Facebook 新 subject 合到另一个 User；
- 修改数据库实现 merge。

未来如需要单独设计 Domain Use Case。

---

# 46. Guest 行为

游客：

- 不创建 `identity.users`；
- 不创建 cloud Identity；
- local installation_id 可先存在客户端；
- 真正 phone/Facebook authentication 后才创建/绑定 Device。

Guest Data Migration 不属于本 Phase。

---

# 47. Logging / Privacy

允许日志字段：

```text
request_id
use_case
user_public_id
provider
otp purpose
masked phone
installation_id
result
error_code
duration
```

禁止：

```text
OTP
Authorization header
Access Token
Refresh Token
Facebook credential
full push token
secret
code_hash
refresh_token_hash
```

Hash 也不应作为普通日志字段。

---

# 48. Security Requirements

Identity Gate 前必须验证：

1. OTP brute force 防护；
2. OTP replay 防护；
3. OTP concurrent consumption；
4. resend abuse；
5. phone normalization；
6. account enumeration 控制；
7. Facebook credential 服务端验证；
8. provider_subject spoofing 拒绝；
9. JWT signature/issuer/audience/expiry；
10. refresh rotation；
11. refresh replay；
12. concurrent refresh；
13. logout/session revoke；
14. disabled/closed user denial；
15. installation ownership；
16. push token conflict；
17. SQL injection；
18. DB unique race；
19. sensitive logging；
20. internal BIGINT leakage；
21. Outbox sensitive payload；
22. external provider failure compensation。

---

# 49. Test Matrix

| Scenario | Unit | PG Integration | HTTP | Race/Security |
|---|---:|---:|---:|---:|
| Request OTP happy | ✅ | ✅ | ✅ | ✅ |
| OTP cooldown | ✅ | ✅ | ✅ | ✅ |
| Wrong OTP | ✅ | ✅ | ✅ | ✅ |
| Max attempts | ✅ | ✅ | ✅ | ✅ |
| Expired OTP | ✅ | ✅ | ✅ | ✅ |
| Replay OTP | ✅ | ✅ | ✅ | ✅ |
| Phone new register | ✅ | ✅ | ✅ | ✅ |
| Phone existing login | ✅ | ✅ | ✅ | ✅ |
| Same-phone race | — | ✅ | — | ✅ |
| Facebook new/existing | ✅ | ✅ | ✅ | ✅ |
| Facebook spoof | ✅ | — | ✅ | ✅ |
| Refresh rotation | ✅ | ✅ | ✅ | ✅ |
| Refresh replay | ✅ | ✅ | ✅ | ✅ |
| Concurrent refresh | — | ✅ | — | ✅ |
| Logout | ✅ | ✅ | ✅ | ✅ |
| Logout all | ✅ | ✅ | ✅ | ✅ |
| Device restore after strong auth | ✅ | ✅ | ✅ | ✅ |
| Device ownership conflict | ✅ | ✅ | ✅ | ✅ |
| BindPhone | ✅ | ✅ | ✅ | ✅ |
| ChangePhone | ✅ | ✅ | ✅ | ✅ |
| Profile update whitelist | ✅ | ✅ | ✅ | ✅ |
| disabled/closed auth | ✅ | ✅ | ✅ | ✅ |
| UserRegistered Outbox | ✅ | ✅ | — | ✅ |

---

# 50. Deferred Items

明确 Deferred：

```text
RevokeArbitrarySessionByPublicSessionId
CloseOwnAccount
DisableAccount public/admin endpoint
ReEnableDisabledAccount endpoint
BindFacebookToExistingUser
UnlinkFacebook
AccountMerge
ChangeLearningDirection
GuestDataMigration
AccessTokenBlacklist
RefreshTokenFamilyReplayDetection
Multi-phone identities
Password auth
Email auth
Google auth
Apple auth
MFA
Passkey
```

Deferred 不代表遗忘，而是当前 frozen V1 无必要/无足够模型支持。

---

# 51. NOT_SUPPORTED Items

当前明确不支持：

```text
RestoreClosedAccount
ChangeLearningDirection
Password Login
Multiple active phone identities
Automatic account merge
Trust capability encoded in Identity status
```

---

# 52. Open Decisions

本 Use Case 文档完成后：

```text
OPEN_DECISION = 0 blocking
```

以下仍属于 API 表达层决定，而不是 Use Case blocker：

- endpoint path；
- exact HTTP status；
- request/response JSON naming；
- cookie vs body transport of refresh credential；
- rate-limit response headers；
- pagination shape for devices/sessions。

这些在 `IDENTITY_API.md` 冻结。

---

# 53. API 设计输入

`IDENTITY_API.md` 必须以本文为唯一 Use Case 输入，至少为以下 REQUIRED public/application Use Case 设计契约：

```text
RequestPhoneOtp
AuthenticateWithPhoneOtp
AuthenticateWithFacebook
RefreshSession
LogoutCurrentSession
LogoutAllSessions
GetCurrentIdentity
GetCurrentAccountStatus
GetOwnBasicProfile
UpdateOwnBasicProfile
ReadLearningProfile
ListMyDevices
RevokeDevice
ListMySessions
BindPhone
ChangePhone
```

以及必要的内部 service wiring。

不得给 Deferred / NOT_SUPPORTED 项偷偷设计 production endpoint。

---

# 54. Design Audit Checklist

进入 API 设计前检查：

- [x] Frozen 7 表未重新设计
- [x] Phone/Facebook provider 边界明确
- [x] OTP TTL/attempt/resend 明确
- [x] OTP one-time consumption 明确
- [x] Provider send failure 明确
- [x] Phone new/existing flow 明确
- [x] Facebook new/existing flow 明确
- [x] Learning direction 明确
- [x] Access Token TTL 明确
- [x] Session TTL/sliding 明确
- [x] Refresh Rotation 明确
- [x] Device ownership 明确
- [x] Revoked device recovery 明确
- [x] BindPhone 明确
- [x] ChangePhone 明确
- [x] Session list/revoke schema limitation明确
- [x] Account Status 生命周期明确
- [x] UserRegistered Event 明确
- [x] AccountStatusChanged Event 明确
- [x] Transaction Matrix 明确
- [x] Concurrency Matrix 明确
- [x] Idempotency Matrix 明确
- [x] Rate Limit Matrix 明确
- [x] Error Inventory 明确
- [x] Deferred Items 明确
- [x] Blocking Open Decision = 0

---

# 55. 最终状态

```text
IDENTITY_USE_CASES_STATUS = AUDITED / READY_FOR_IMPLEMENTATION
IDENTITY_IMPLEMENTATION_STARTED = NO
IDENTITY_API_STATUS = AUDITED / READY_FOR_IMPLEMENTATION
IDENTITY_DESIGN_GATE = PASS
IDENTITY_GATE = NOT_STARTED
```

设计审计已通过。本次工作到此停止；不开始 Identity 实施，直到收到单独授权。

只有：

```text
IDENTITY_DESIGN_GATE = PASS
```

才允许开始 Identity 编码。
