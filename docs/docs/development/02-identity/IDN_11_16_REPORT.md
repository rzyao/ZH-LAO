---
status: complete
last_updated: 2026-09-02
lifecycle: historical
---

# ZH-LAO  — IDN-11 至 IDN-16 报告

```text
IDN-11 = COMPLETE
IDN-12 = COMPLETE
IDN-13 = COMPLETE
IDN-14 = COMPLETE
IDN-15 = COMPLETE
IDN-16 = COMPLETE
IDN-17 = NOT_STARTED（本报告发布时点）
```

- IDN-11：`AuthenticateWithFacebook` —— 客户端 opaque credential 经 FakeFacebookCredentialVerifier 校验后获得服务端派生 `provider_subject`；首次身份创建 User + facebook AuthIdentity + BasicProfile + LearningProfile + Session 并写 `identity.user_registered.v1` 事件；已有身份登录不重复注册。
- IDN-12：`PhoneCredentialOperations`（bind_phone / change_phone）—— OTP purpose 隔离、用户行锁 + 单手机号 AuthIdentity 不变式、并发 bind 串行化。
- IDN-13：`ProfileOperations` —— whitelist 更新、absent != null、birth_date date-only、avatar 仅 UUID logical reference，不跨域查询 asset。
- IDN-14：`IdentityState` 账户状态机（active/disabled/closed）与状态转换 + 全量会话撤销 + `account_status_changed.v1` 同事务。
- IDN-15：`IdentityAuthenticationProvider` —— Bearer → JWT verify → public UUID → active 用户校验 → AuthContext；disabled/closed 与无效凭据一律拒绝。
- IDN-16：Identity 事件契约通过 Foundation `infrastructure.system_outbox_events` 落盘，payload 不含 phone/OTP/token/hash/credential/internal BIGINT。

```text
Evidence
FakeFacebookCredentialVerifier / UnavailableFacebookCredentialVerifier    = 已实现（facebook-verifier.ts）
AuthenticateWithFacebook                                                   = implemented + integration test（facebook-authentication.test.ts）
One-phone-per-user / purpose-isolated OTP                                   = implemented + integration tests（phone-credential-operations.test.ts）
Profile whitelist / absent-null 语义                                        = implemented + integration test（profile-operations.test.ts）
Account state machine + atomic revocation + event                           = implemented + integration test（identity-state.test.ts）
AuthenticationProvider fail-closed                                          = implemented + unit test（identity-authentication-provider.test.ts）
Outbox event payload 安全化                                                 = implemented + integration test（identity-events.test.ts）
Fake providers = tests only；生产装配策略在本报告之后由 IDN-17~19 / IDN-20 裁决
Frozen migration changes = 0
Cross-domain SQL = 0
HTTP 路由 / 生产 Provider 装配                                  = 0（IDN-17 / IDN-20 后续覆盖）
```