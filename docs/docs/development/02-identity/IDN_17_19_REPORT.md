---
status: complete
last_updated: 2026-09-02
lifecycle: historical
---

# ZH-LAO  — IDN-17 至 IDN-19 批次报告

```text
IDN-17 = COMPLETE
IDN-18 = COMPLETE
IDN-19 = COMPLETE

IDN-20 = NOT_STARTED
```

- IDN-17：将已冻结 Use Cases 正式暴露为 HTTP API，补齐组合根与运行装配，完成 HTTP 层集成测试。
- IDN-18：基于真实 PostgreSQL 的完整链路 Domain E2E。
- IDN-19：安全加固与并发竞态加固，含一次真实竞态修复（Close vs Login）与两处既有 flaky 稳定化。

---

## 一、IDN-17 — HTTP/API

### 已实现端点（全部 16 个，frozen inventory 全齐）

Public：

```text
POST /api/v1/identity/phone-otp               → RequestPhoneOtp
POST /api/v1/identity/auth/phone              → AuthenticateWithPhoneOtp
POST /api/v1/identity/auth/facebook           → AuthenticateWithFacebook
POST /api/v1/identity/sessions/refresh        → RefreshSession
POST /api/v1/identity/sessions/logout         → LogoutCurrentSession
```

Protected（Bearer → AuthenticationProvider → AuthContext → Use Case）：

```text
POST /api/v1/identity/sessions/logout-all     → LogoutAllSessions
GET  /api/v1/identity/me                      → GetCurrentIdentity（安全摘要）
GET  /api/v1/identity/me/status               → GetCurrentAccountStatus
GET  /api/v1/identity/me/profile              → GetOwnBasicProfile
PATCH /api/v1/identity/me/profile             → UpdateOwnBasicProfile（whitelist + absent!=null）
GET  /api/v1/identity/me/learning-profile     → ReadLearningProfile（只读）
GET  /api/v1/identity/me/devices              → ListMyDevices
DELETE /api/v1/identity/me/devices/{installation_id} → RevokeDevice
GET  /api/v1/identity/me/sessions             → ListMySessions（带 device 摘要）
POST /api/v1/identity/me/phone/bind           → BindPhone（服务端固定 purpose=bind_phone）
POST /api/v1/identity/me/phone/change         → ChangePhone（服务端固定 purpose=change_phone）
```

### Gate 证据

```text
All frozen routes implemented           = YES（16/16）
HTTP SQL                                = 0（architecture audit PASS）
HTTP Repository access                  = 0
Unknown field rejection                 = PASS（全部请求体 zod .strict()）
Mass assignment protection              = PASS（status/user_id/provider_subject/created_at 注入均 400）
AuthenticationProvider reused           = YES（requireAuthentication + IdentityAuthenticationProvider）
Public UUID only                        = YES
Internal BIGINT HTTP exposure           = 0（响应扫描断言无数值内部 id）
Token no-store headers                  = PASS（/auth/phone、/auth/facebook、/sessions/refresh）
HTTP integration tests                  = PASS（17/17，覆盖全部路由、Auth 矩阵、注入、安全头）
Frozen migration changes                = 0
```

### 本批次新增/调整的文件（IDN-17 相关）

- 新增 [routes.ts](https://github.com/rzyao/ZH-LAO/blob/main/apps/backend/src/modules/identity/http/routes.ts)：全部端点、schema 校验、响应 DTO、错误归一（SESSION_REVOKED/SESSION_EXPIRED → INVALID_CREDENTIAL presenter 映射）。
- 新增 [composition.ts](https://github.com/rzyao/ZH-LAO/blob/main/apps/backend/src/modules/identity/http/composition.ts)：Identity HTTP 组合根，启动 fail-fast（JWT/OTP secret 缺失或过短即拒绝）。
- [main.ts](https://github.com/rzyao/ZH-LAO/blob/main/apps/backend/src/main.ts)：接入组合根并注册路由。
- [identity-state.ts](https://github.com/rzyao/ZH-LAO/blob/main/apps/backend/src/modules/identity/application/use-cases/identity-state.ts)：新增 `getIdentitySummary` 读模型（GetCurrentIdentity）。
- 新增 [device-registration.ts](https://github.com/rzyao/ZH-LAO/blob/main/apps/backend/src/modules/identity/application/services/device-registration.ts)：phone/facebook 认证共用的 fresh-auth 设备注册（保持冻结语义）。
- [authenticate-with-facebook.ts](https://github.com/rzyao/ZH-LAO/blob/main/apps/backend/src/modules/identity/application/use-cases/authenticate-with-facebook.ts)：按 API 契约补 optional device；已有用户路径加行锁（见 IDN-19）。
- [session-device-lifecycle.ts](https://github.com/rzyao/ZH-LAO/blob/main/apps/backend/src/modules/identity/application/use-cases/session-device-lifecycle.ts)：Session 列表携带设备摘要。
- 仓库层 [repositories.ts](https://github.com/rzyao/ZH-LAO/blob/main/apps/backend/src/modules/identity/infrastructure/repositories.ts) / ports：新增 `AuthIdentity.listByUserId`（GET /me 的 auth_providers）。
- [otp-services.ts](https://github.com/rzyao/ZH-LAO/blob/main/apps/backend/src/modules/identity/application/services/otp-services.ts)：新增 `ConsoleOtpDeliveryProvider`（TECH_DEBT：真实 SMS 适配器待生产集成；绝不落 OTP）。
- 测试支撑 [identity-app.ts](https://github.com/rzyao/ZH-LAO/blob/main/apps/backend/test/support/identity-app.ts)、[identity-http.test.ts](https://github.com/rzyao/ZH-LAO/blob/main/apps/backend/test/integration/identity-http.test.ts)。

---

## 二、IDN-18 — Domain E2E（真实 PostgreSQL）

```text
Real PostgreSQL      = YES（PostgreSQL 18.6，docker postgis/postgis:18，WSL 内 5433 端口映射）
Fresh Database       = YES（每个场景独立测试库 + 真实 17 个 migration）
Mock DB for core E2E = 0（仅允许 FakeOtpDeliveryProvider / FakeFacebookCredentialVerifier 外部边界）
Composition root     = 实际 buildApp + identityModule.registerHttp
```

结果（13/13 PASS）：`test/integration/identity-e2e.test.ts`

```text
Phone New Registration      = PASS（User=1, Phone AuthIdentity=1, BasicProfile=1, LearningProfile=1,
                              Device=1, Session=1, UserRegistered=1；raw OTP persisted=0；raw Refresh persisted=0）
Existing Phone Login        = PASS（同 canonical User、新 Session、UserRegistered 不重复）
Facebook Registration/Login = PASS（共享同一 User、无重复事件）
Refresh Rotation            = PASS（replay 拒绝、sliding TTL 延长、DB 只留最新 hash）
Logout Current / All        = PASS（幂等 204；logout-all 后全部拒绝）
Device Lifecycle            = PASS（revoke 联动 Session；普通 update 不可恢复；fresh OTP 登录可恢复同用户设备）
Profile                     = PASS（absent 保留、null 清空、birth_date 无时区漂移、avatar UUID 保留）
Learning Profile            = PASS（lo→zh 只读；PATCH/认证方向冲突均拒绝）
BindPhone                   = PASS（Facebook-first 用户绑定手机，不新建 User）
ChangePhone                 = PASS（同一 AuthIdentity 更新；旧号码不再解析；Session 不被强制撤销）
Account State               = PASS（active→disabled 全量 revoke + 事件；登录 403；再 active 旧 Session 保持 revoked；closed terminal）
Outbox Atomicity            = PASS（注册/状态变更 outbox 写失败→整事务回滚，无部分 canonical 事实）
```

---

## 三、IDN-19 — Security / Race

### 安全（11/11 PASS）：`test/integration/identity-security.test.ts`

```text
OTP 六位+前导零 / Math.random=0（实现为 crypto.randomInt）   = PASS
raw OTP 持久化 / 日志                                          = 0
keyed HMAC 校验（非普通 SHA256 直 hash）                       = PASS（断言 hash ≠ sha256(raw)）
OTP 限流：阈值 / 阈值+1 / 窗口过期 / purpose 隔离 / phone 隔离 / IP 限流 = PASS
OTP 枚举防护：已注册与未注册手机同一响应体                      = PASS
JWT：alg=none / 错误签名 / 错误 issuer / 错误 audience / 过期 / 篡改 payload / 非法 UUID sub = 全部 401 PASS
Refresh：opaque、高熵（base64url ≥60 字符）、非 JWT、hash≠raw   = PASS
Secret fail-fast（组合根 + production 配置）                   = PASS
日志脱敏（OTP / Access / Refresh / hash / FB credential / phone / 密钥） = PASS
IDOR（跨用户 device/profile/session 操作安全 404，不泄漏存在性）= PASS
Mass Assignment / status / internal id / provider_subject 注入 = PASS
Facebook：credential 不落库不回显；provider 故障安全 503        = PASS
Credential：cross-purpose / cross-phone / 手机抢占 全部拒绝      = PASS
```

### 竞态（15/15 PASS）：`test/integration/identity-race.test.ts`

```text
OTP request race（并发请求 → 恰好 1 个 pending）      = PASS
OTP consume race（同一 code → 恰好 1 个成功）          = PASS
OTP attempt race（attempt_count 无丢失，达上限锁定）   = PASS
Phone registration race（User/AuthIdentity/Profile/Event = 1，Orphan = 0） = PASS
Facebook registration race（canonical User = 1）       = PASS
BindPhone race（phone identity ≤ 1）                   = PASS
ChangePhone race（phone identity = 1）                 = PASS
Refresh race（同一旧 refresh → successor 恰好 1）      = PASS
Logout vs Refresh（自洽串行语义）                      = PASS
LogoutAll vs Refresh（最终无 active session）          = PASS
Device Revoke vs Refresh（废弃会话不可用）             = PASS
Push token race（partial unique 保持唯一持有者）       = PASS
Disable vs Refresh（最终无可用 session）               = PASS
Close vs Login（closed 用户最终无 active session）     = PASS（本轮修复目标）
Outbox duplicate（并发首次注册 → 事件恰好 1）          = PASS
```

### 本轮发现并修复

1. **Close vs Login 竞态（新增行锁修复）**：原认证对已有用户仅普通读取，`close` 事务提交后可残留并发登录创建的 active session。修复：phone / facebook 认证的已有用户路径改为 `lockByInternalId`（用户行 `FOR UPDATE`），与 `close/disable` 的用户行锁完全串行。`test/integration/identity-race.test.ts > close vs login`、`disable vs refresh` 均以此验证。
2. **既有 flaky：`identity-repositories.test.ts` 的 40ms 锁时序探测**（history 中 "advisory-lock timing assertion transient timeout" 同类）：改为确定性断言 —— "后获取者在先持有者释放后完成"，不再依赖固定毫秒探测。
3. **并行负载下 5s 超时**：新增 [vitest.config.ts](https://github.com/rzyao/ZH-LAO/blob/main/apps/backend/vitest.config.ts) 将全局 `testTimeout` 提升至 20s（覆盖创建数据库 + 17 个 migration 的冷启动成本），`hookTimeout` 120s。未引入"无限调大"，仍能在秒级暴露挂起。

### 锁顺序审计（实际代码路径）

```text
OTP 请求       : pg_advisory_xact_lock(phone,purpose) → otp_challenges 行锁(latest) → cancel/create
OTP 消费       : otp_challenges 行锁(latest pending) → users 行锁(FOR UPDATE，phone/fb 登录) → sessions insert
Bind/Change Phone: users 行锁(FOR UPDATE) → otp_challenges 行锁 → auth_identities（并发人锁顺序一致）
RefreshSession : sessions 行锁 → users 读（status 检查）→ devices 读
LogoutCurrent  : sessions 行锁(lockByRefreshTokenHash) → revoke
LogoutAll      : sessions UPDATE（行锁由 UPDATE 隐式），无 users 锁
RevokeDevice   : devices 行锁(revoke) → sessions UPDATE（同事务）
Account State  : users 行锁(FOR UPDATE) → sessions UPDATE（同事务）
```

无环（所有路径都先锁业务主体行/咨询锁，再锁从属行；未发现 lock order inversion 或死锁。并发 E2E 全部通过为佐证）。`Foundation TransactionManager reused = YES；Repository-owned transactions = 0；Identity-owned DB Pool = 0`。

### Flaky / Race 稳定性

```text
窄时序断言（毫秒级"必须 xx ms 内"）   = 0（已移除/改为确定性）
时间窗口測试使用的最小间隔             = 1000ms（配合 4000ms 等待覆盖 WSL docker 时钟偏移，非性能断言）
barrier/final-invariant 使用           = 是（userReady/sessionReady/otpReady barrier；最终 DB 不变式断言）
race 测试重复轮次                      = 关键竞态为单轮并发 + 多次全量重跑（security/race/e2e 均 ≥3 次全套通过）
intermittent failure                   = 未再出现
```

---

## 四、Security 汇总

```text
Raw OTP persisted                   = 0
Raw Refresh Token persisted          = 0
Facebook credential persisted        = 0
OTP / Access / Refresh / hash / credential / full push token logged = 0
Internal BIGINT HTTP exposure        = 0
Account Enumeration                  = mitigated（同响应）
IDOR                                 = PASS
Mass Assignment                      = PASS
JWT Security                         = PASS
Secret Fail-Fast                     = PASS
```

## 五、Database

```text
Frozen migration changes = 0
Frozen migration diff    = 0（database validate 二次运行 executed=0）
Cross-domain SQL         = 0
Fresh migrations         = 17
Second migration run     = 0
Database audit           = PASS（含 smoke：非法状态/跨域 FK/部分唯一/单活跃任务 全部拒绝）
Baseline report          = 已刷新（database/reports/_DATABASE_BASELINE_REPORT.md）
```

## 六、REQUIRED Use Cases（全部 IMPLEMENTED + TESTED）

```text
RequestPhoneOtp            ✅    AuthenticateWithPhoneOtp       ✅
AuthenticateWithFacebook   ✅    RefreshSession                 ✅
LogoutCurrentSession       ✅    LogoutAllSessions              ✅
GetCurrentIdentity         ✅    GetCurrentAccountStatus        ✅
GetOwnBasicProfile         ✅    UpdateOwnBasicProfile          ✅
RegisterOrUpdateDevice     ✅    ListMyDevices                  ✅
RevokeDevice               ✅    ListMySessions                 ✅
BindPhone                  ✅    ChangePhone                    ✅
ReadLearningProfile        ✅    RevokeCurrentSession           ✅（LogoutCurrentSession）
RevokeSessionsByDevice     ✅    （RevokeDevice 同事务联动）
```

## 七、NOT_SUPPORTED / DEFERRED（未提前实现）

```text
ChangeLearningDirection                 = NOT_SUPPORTED
RestoreClosedAccount                    = NOT_SUPPORTED
Password Login                          = NOT_SUPPORTED
Multiple active phone identities        = NOT_SUPPORTED
Automatic Account Merge                 = NOT_SUPPORTED
RevokeArbitrarySessionByPublicSessionId = DEFERRED（frozen schema 无 Session public UUID，未暴露 BIGINT 临时 API）
BindFacebookToExistingUser / Unlink     = DEFERRED
GuestDataMigration / AccessTokenBlacklist / RefreshTokenFamily / MFA / Passkey / Google / Apple = DEFERRED
```

## 八、Validation 实测数量

```text
Typecheck              = PASS
Lint / Architecture    = PASS（HTTP SQL=0 由架构检查强制）
Build                  = PASS
Unit tests             = 31 / 31（13 文件）
Integration tests      = 80 / 80（13 文件）
  ├─ HTTP   IDN-17     = 17
  ├─ E2E    IDN-18     = 13
  ├─ Security IDN-19   = 11
  ├─ Race   IDN-19     = 15
  └─ 既有回归           = 24（IDN-01~16、Foundation）
Database validation    = PASS（17/0、audit、smoke）
Docs build             = PASS
Foundation Regression  = PASS
```

## 九、Blockers

```text
Blockers = 0
```

## 十、最终状态

```text
IDENTITY_DESIGN_GATE  = PASS
IDENTITY_IMPLEMENTATION = IN_PROGRESS

IDN-01  = COMPLETE      IDN-10  = COMPLETE
IDN-02  = COMPLETE      IDN-11  = COMPLETE
IDN-03  = COMPLETE      IDN-12  = COMPLETE
IDN-04  = COMPLETE      IDN-13  = COMPLETE
IDN-05  = COMPLETE      IDN-14  = COMPLETE
IDN-06  = COMPLETE      IDN-15  = COMPLETE
IDN-07  = COMPLETE      IDN-16  = COMPLETE
IDN-08  = COMPLETE      IDN-17  = COMPLETE
IDN-09  = COMPLETE      IDN-18  = COMPLETE
                        IDN-19  = COMPLETE

IDN-20 = NOT_STARTED
```

Identity 仍不标记整体 `COMPLETE`，最终收口与 Gate 属于 IDN-20 / IDN-21。本批次按要求停止，不进入 IDN-20。