# ZH-LAO V2 — Identity 实施最终报告

```text
IDENTITY_DESIGN_GATE    = PASS
IDENTITY_IMPLEMENTATION = COMPLETE
IDENTITY_GATE           = PASS
IDENTITY_DOMAIN         = FROZEN
```

## Status

```text
IDN-01 ~ IDN-21 = COMPLETE
```

本报告为 Identity Phase 最终总报告，汇总 IDN-01 ~ IDN-21 的最终事实，不重复各批次历史细节（详见各分报告）。

## Database

```text
Identity 冻结 7 表：identity.users / auth_identities / basic_profiles / learning_profiles / otp_challenges / devices / sessions
冻结 migration：0100_identity.sql、1220_identity_auth_runtime.sql（自冻结起零改动）
Frozen migration changes = 0；Frozen migration diff = 0
Fresh migrations = 17；Second migration run = 0；Database audit = PASS
public UUID 策略：跨 Domain / API 一律 stable logical UUID；Identity 内部 PK 可 BIGINT，绝不外泄
Cross-domain physical FK = 0；Cross-domain SQL = 0
```

## Authentication

```text
Phone（E.164 canonical，OTP）与 Facebook（opaque credential → server-derived provider_subject）
OTP：6 位 crypto-random、TTL 5min、MaxAttempts 5、cooldown 60s、5/30min + 10/24h（phone+purpose）、20/30min（IP）
OTP 校验：keyed HMAC；raw OTP 不落库/不落日志/不进 Outbox/不进 HTTP
OTP 消费与身份解析/创建、Session 创建、markVerified 同事务（无 reusable verified ticket）
不支持 Password / Email / Google / Apple / MFA / Passkey（未实现）
```

## Session

```text
Access Token = JWT（TTL 15min；仅 sub/iat/exp/iss/aud）
Refresh Token = opaque cryptographically random；Rotation = ALWAYS；Session TTL = 30 日 sliding
Raw refresh：DB / logs / events = 0
同一旧 refresh 并发 → 成功恰好 1
会话撤销：logout（幂等）/ logout-all / device revoke / account disable/close，语义冻结
```

## Device

```text
公开标识 = installation_id UUID（非 internal BIGINT）
同 installation：同用户更新 / 跨用户 DEVICE_OWNERSHIP_CONFLICT
revoked device：普通更新不可恢复；fresh primary auth 可恢复（同用户）
device revoke + bound sessions revoke 同事务
full push token：API / logs = 0；partial unique 不变式保持
```

## Profile

```text
BasicProfile 可更新 whitelist：display_name / gender / birth_date / country_code / region_code / avatar_media_id
birth_date = date-only；avatar_media_id = UUID logical asset reference（不跨域查询 asset）
LearningProfile 只读；ChangeLearningDirection = NOT_SUPPORTED
```

## Account State

```text
状态：active / disabled / closed（closed 为 terminal）
active↔disabled、active|disabled→closed；进入 disabled/closed 与全量 session revoke + account_status_changed 同事务
Re-enable 不恢复旧 Session
```

## Outbox

```text
唯一 Shared Infrastructure：infrastructure.system_outbox_events
事件：identity.user_registered.v1（Phone/Facebook 新注册各 1 条；已有登录 0 条）
      identity.account_status_changed.v1（真实状态转换各 1 条）
Payload 不含 phone / OTP / token / hash / credential / push token / internal BIGINT
```

## HTTP

16 端点冻结清单（/api/v1/identity）：phone-otp、auth/phone、auth/facebook、sessions/refresh、sessions/logout、sessions/logout-all、me、me/status、me/profile（GET/PATCH）、me/learning-profile、me/devices（GET/DELETE）、me/sessions、me/phone/bind、me/phone/change。

```text
HTTP SQL = 0；HTTP Repository access = 0（自动化检查强制）
unknown field / mass assignment / IDOR / provider_subject / internal id 注入全部拒绝
Token 响应 Cache-Control: no-store + Pragma: no-cache
错误统一 Foundation AppError + envelope；不暴露 PG constraint / stack / JWT raw / upstream raw
```

## Security

```text
Raw OTP persisted = 0；Raw Refresh persisted = 0；Facebook credential persisted = 0
Sensitive logs = 0；Internal BIGINT exposure = 0
JWT / OTP / IDOR / Mass Assignment / 账号枚举缓解 = PASS
Secret Fail-Fast（JWT/OTP 密钥缺失或过短启动拒绝）= PASS
```

## Concurrency

```text
OTP request/consume/attempt race、Phone/Facebook 注册 race、Bind/Change race、
Refresh / Logout vs Refresh / LogoutAll vs Refresh、Device Revoke vs Refresh、
Push token race、Disable vs Refresh、Close vs Login、Outbox duplicate = 全部 PASS（真实 PostgreSQL）
窄毫秒时序断言 = 0（barrier / final-invariant / observable DB state）
Close vs Login 修复（登录路径 user FOR UPDATE 行锁）保持
```

## Provider runtime

```text
FakeFacebookCredentialVerifier / FakeOtpDeliveryProvider = tests only（显式测试注入）
normal runtime 未配置真实 provider → Unavailable provider → 503 PROVIDER_UNAVAILABLE（无静默 fake-success）
Console OTP provider = development-only（显式 IDENTITY_OTP_PROVIDER=console，production 校验拒绝）
真实 SMS / Facebook adapter = Production Integration Debt（documented，不阻塞冻结）
```

## REQUIRED Use Cases（全部 IMPLEMENTED + TESTED）

```text
RequestPhoneOtp / AuthenticateWithPhoneOtp / AuthenticateWithFacebook /
RefreshSession / LogoutCurrentSession / LogoutAllSessions /
GetCurrentIdentity / GetCurrentAccountStatus /
GetOwnBasicProfile / UpdateOwnBasicProfile / ReadLearningProfile /
RegisterOrUpdateDevice / ListMyDevices / RevokeDevice / ListMySessions /
BindPhone / ChangePhone / RevokeCurrentSession / RevokeSessionsByDevice /
Identity Account Status Transition / AuthenticationProvider / Identity Outbox
```

## NOT_SUPPORTED / DEFERRED

```text
ChangeLearningDirection / RestoreClosedAccount / Password Login / Multiple active phone identities /
Automatic Account Merge / RevokeArbitrarySessionByPublicSessionId / BindFacebookToExistingUser /
UnlinkFacebook / GuestDataMigration / AccessTokenBlacklist / RefreshTokenFamilyReplayDetection /
MFA / Passkey / Google / Apple / Email = 均未提前实现
```

## Public Contract（冻结）

```text
identity/public 导出：UserPublicId / IdentityAccountStatus 原语 + IdentityPublicQuery
  isIdentityActive / getIdentityAccountStatus / getIdentitySummary
禁止导出 repositories / DB records / internal BIGINT / hash / token services / transaction manager
跨 Domain 仅可依赖 identity/public；其他 Identity 内部一律 forbidden（自动化检查）
```

## Validation（最终全量）

```text
Typecheck / Lint / Architecture Audit / Build = PASS
Unit = 32/32；Integration = 84/84
  HTTP 17 · E2E 13 · Security 11 · Race 15 · Provider(IDN-20) 4 · 既有回归 24
Database Validation = PASS（fresh 17 / second 0 / audit / smoke）
Docs Build = PASS
Foundation Regression = PASS
```

## IDENTITY_DOMAIN = FROZEN

冻结含义：

```text
后续 Domain 可依赖 identity/public 与冻结 HTTP/API
未经正式变更流程不得改变：Identity table ownership、public ID contract、auth provider semantics、
session semantics、event contract、HTTP contract
```

## 报告索引

```text
IDN_01_REPORT.md / IDN_02_REPORT.md / IDN_03_REPORT.md / IDN_04_08_REPORT.md /
IDN_09_10_REPORT.md / IDN_11_16_REPORT.md / IDN_17_19_REPORT.md / IDN_20_FINAL_AUDIT.md /
IDENTITY_DESIGN_AUDIT.md（设计 Gate）/ IDENTITY_IMPLEMENTATION_REPORT.md（本报告，收口）
```

```text
IDENTITY GATE = PASS
IDENTITY DOMAIN = FROZEN
Blockers = 0
HIGH open = 0
```