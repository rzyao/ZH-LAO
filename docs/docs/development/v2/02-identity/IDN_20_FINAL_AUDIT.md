# ZH-LAO V2 — IDN-20 Domain Final Audit

```text
IDN-20 = COMPLETE
IDN-21 = NOT_STARTED（本报告发布时点）
```

本阶段不新增产品功能；目标是对 Identity Domain 做收口前最终审计，修复所有 Gate 前必须修复的问题，并给出 Gate 结论。

---

## Findings 汇总

```text
BLOCKER = 0
HIGH    = 1（HIGH-01，已修复）
MEDIUM  = 1（MEDIUM-01，已修复）
LOW     = 1（LOW-01，已修复）
```

### HIGH-01 — Production runtime provider wiring（已修复）

**问题**：`createIdentityHttpDependencies` 在未显式传入 facebookVerifier 时默认 `FakeFacebookCredentialVerifier(new Map())`；`main.ts` 未显式装配生产 verifier。正式运行会静默使用 Fake，违反「Fake = tests only」并导致 `/auth/facebook` 实际不可用。

**修复**：

- [composition.ts](file:///c:/project/ZH-LAO/apps/backend/src/modules/identity/http/composition.ts)：移除 Fake 默认，未装配时默认 `UnavailableFacebookCredentialVerifier`（服务正常启动，端点失败安全 503）。
- [main.ts](file:///c:/project/ZH-LAO/apps/backend/src/main.ts)：显式装配 `UnavailableFacebookCredentialVerifier`（TECH_DEBT：真实 Meta/Facebook adapter 属后续生产集成）。
- OTP 投递裁决：新增配置 `IDENTITY_OTP_PROVIDER`（`unavailable` 默认 / `console` 仅 development 显式启用，production 禁用）；normal runtime 未接真实 SMS 时使用 `UnavailableOtpDeliveryProvider`，`/phone-otp` 返回 503，且不会创建残留 pending challenge（挑战在投递失败时补偿标记 cancelled）。
- 新增测试 [identity-provider.test.ts](file:///c:/project/ZH-LAO/apps/backend/test/integration/identity-provider.test.ts)（4 用例）：无 FB provider → 503 PROVIDER_UNAVAILABLE（非 INVALID_CREDENTIAL）；无 SMS provider → 503 且无 pending 挑战；显式 Fake 注入（tests）正常工作；production + console → 配置校验 fail-fast。

**Gate 结论**：

```text
FakeFacebookCredentialVerifier production default = 0
FakeOtpDeliveryProvider production default       = 0
Facebook unconfigured behavior                   = 503 PROVIDER_UNAVAILABLE
OTP unconfigured behavior                        = 503 PROVIDER_UNAVAILABLE
Console OTP development-only                     = YES（显式配置 + 非 production）
```

### MEDIUM-01 — Public contract 冻结项不完整（已修复）

**问题**：`identity/public` 仅有类型与 parse 原语，缺少设计要求的 `IsIdentityActive` / `GetIdentityAccountStatus` / `GetIdentitySummaryByPublicId` 应用层契约。

**修复**：新增 [public/query.ts](file:///c:/project/ZH-LAO/apps/backend/src/modules/identity/public/query.ts) —— `IdentityPublicQuery`（`isIdentityActive` / `getIdentityAccountStatus` / `getIdentitySummary`），纯读、仅日志 public UUID、不导出 DB record / internal BIGINT / hash / token。新增 unit 测试 [identity-public-query.test.ts](file:///c:/project/ZH-LAO/apps/backend/test/unit/identity-public-query.test.ts)，并同步既有 public 导出清单断言。

### LOW-01 — 报告链接缺失（已修复）

**问题**：`DEVELOPMENT_PROGRESS.md` 的 Identity 报告清单缺 `IDN_11_16_REPORT.md`。

**修复**：新建 [IDN_11_16_REPORT.md](file:///c:/project/ZH-LAO/docs/docs/development/v2/02-identity/IDN_11_16_REPORT.md) 并补入进度表链接；报告链（IDN-01/02/03/04_08/09_10/11_16/17_19）全部存在且无断链。

---

## Final Audit 各维度结论

### Scope / Frozen contracts

```text
执行范围       = IDN-20（Final Audit）+ 必要修复；无产品新功能
冻结契约       = IDENTITY_API.md / IDENTITY_USE_CASES.md / 0100_identity.sql / 1220_identity_auth_runtime.sql
不得触碰       = frozen migrations、Domain 边界、ID 策略、HTTP 契约、事件契约
```

### Database audit

```text
Identity 冻结 7 表            = users / auth_identities / basic_profiles / learning_profiles / otp_challenges / devices / sessions
TABLE ADDITION / REMOVAL      = 0 / 0
Frozen migration changes      = 0
Frozen migration diff         = 0（validate 二次运行 executed=0）
Fresh migrations              = 17；Second migration run = 0
Database audit                = PASS（extension/constraint/PK/UUID/timestamp/cross-domain FK 全检）
Cross-domain physical FK      = 0
public UUID policy            = 跨边界一律 UUID；Identity 内部 PK 可 BIGINT
```

### Architecture audit

```text
Identity Repository SQL ownership = identity.*（其余 10 域 SQL = 0）
Foundation TransactionManager reused = YES
Identity-owned DB Pool              = 0
Repository-owned transactions       = 0
Other Domain → identity/public      = allowed（自动检查强制）
Other Domain → identity/internal    = forbidden（自动检查强制）
architecture audit                 = PASS
```

### API / Use Case audit

```text
All REQUIRED Use Cases = IMPLEMENTED + TESTED（16 个端点 ⇄ 20 个 Use Case 全覆盖）
HTTP SQL = 0；HTTP Repository access = 0
16 个冻结端点全部存在；无 CRUD 泄漏；无 Deferred 端点误入
```

### Security audit

```text
Raw OTP persisted / logged / outbox / HTTP = 0
Raw Refresh persisted / logged / events     = 0
Facebook credential persisted / logged      = 0
Internal BIGINT exposure（HTTP/Outbox/AuthContext/logs/errors）= 0
JWT（签名/alg 白名单/iss/aud/exp/sub UUID 拒绝）  = PASS
OTP keyed HMAC（非裸 hash）                  = PASS
IDOR / Mass assignment / provider_subject 注入 = PASS
日志脱敏（含 JWT/OTP 密钥不落盘）              = PASS
```

### Concurrency / Transaction audit

```text
OTP request/consume/attempt race            = PASS
Phone/Facebook registration race            = PASS
BindPhone/ChangePhone race                  = PASS
Refresh / Logout vs Refresh / LogoutAll vs Refresh = PASS
Device Revoke vs Refresh / Push token race  = PASS
Disable vs Refresh / Close vs Login         = PASS（登录路径 user FOR UPDATE 行锁保持）
Outbox duplicate                            = PASS
窄毫秒时序断言                               = 0（barrier/final-invariant/确定性断言）
```

实际锁顺序（代码级）：OTP 请求＝`pg_advisory_xact_lock(phone,purpose)` → otp_challenges 行锁；OTP 消费＝otp_challenges 行锁 → users 行锁 → sessions insert；Bind/Change＝users 行锁 → otp_challenges 行锁；Refresh＝sessions 行锁 → users/devices 读；Disable/Close＝users 行锁 → sessions UPDATE；RevokeDevice＝devices 行锁 → sessions UPDATE。无环、无死锁（并发测试佐证）。

### Provider runtime audit

```text
Fake providers = tests only（测试支撑显式注入）
normal runtime 未接真实 provider → 显式 Unavailable → 503
无静默 fake-success；无 fake provider 生产默认
Production Integration Debt（真实 SMS/Facebook adapter）= documented，不阻塞冻结
```

### Sensitive-data audit

`identity-events.ts` Outbox payload 仅 user_public_id / provider / direction / status；AuthContext 仅 subjectId/sessionId（UUID 语义）；日志仅允许 masked phone / public id / provider / purpose / request_id / result / error_code / duration。

### Deferred-scope audit

```text
ChangeLearningDirection / RestoreClosedAccount / Password / Multiple phone identities / Account Merge
BindFacebookToExistingUser / Unlink / GuestDataMigration / AccessTokenBlacklist / RefreshTokenFamily / MFA / Passkey / Email / Google / Apple
= 全部 NOT_SUPPORTED / DEFERRED，无提前实现
```

### Documentation audit

```text
报告链完整性 = 通过（IDN_01/02/03/04_08/09_10/11_16/17_19 全部存在）
本批次新增：IDN_11_16_REPORT.md、IDN_20_FINAL_AUDIT.md
DEVELOPMENT_PROGRESS.md 已同步（本轮修复后，Identity 状态在 IDN-21 更新为 COMPLETE）
```

### Test evidence（IDN-20 修复后全量）

```text
Typecheck / Lint / Architecture Audit / Build = PASS
Unit            = 32/32（14 文件，含新增 identity-public-query 1）
Integration     = 84/84（14 文件）
  HTTP     = 17    E2E = 13    Security = 11    Race = 15    Provider(IDN-20) = 4    既有回归 = 24（Foundation + IDN-01~16）
Database validation = PASS（fresh 17 / second 0 / audit PASS / smoke 全拒绝）
Docs build         = PASS
```

---

## Remaining Debt（documented，非阻塞）

```text
真实 SMS / OTP 投递 provider 集成            → Production Integration Debt（当前默认 503，安全）
真实 Meta/Facebook verification adapter      → Production Integration Debt（当前默认 503，安全）
Console OTP provider                          → development-only，显式 IDENTITY_OTP_PROVIDER=console 启用
```

## Gate Recommendation

```text
Frozen migrations unchanged      = PASS
Database audit                   = PASS
REQUIRED Use Cases implemented   = PASS
Frozen HTTP routes implemented   = PASS
Security / Concurrency / Transaction audit = PASS
Internal BIGINT exposure         = 0
Cross-domain SQL                 = 0
Sensitive persistence/log leak   = 0
Fake provider production default = 0；Fake explicit test-only = PASS
Provider-unconfigured behavior explicit = PASS
BLOCKER open = 0；HIGH open = 0
Full regression                  = PASS

IDN-20 GATE = PASS
```

---

## Post-IDN-20 Regression Hotfix（2026-08-31）

本报告为 IDN-20 发布时点的审计结论，保持原历史不变。

IDN-20 之后，最新全量 GitHub 回归审查发现新的 `HIGH-01（Account status 并发 stale-read）+ MEDIUM-01 + MEDIUM-02 + LOW-01 + LOW-02`，已通过 [Identity Regression Hotfix](IDENTITY_REGRESSION_HOTFIX_REPORT.md) 修复并 Re-Audit：

```text
原 IDN-20 audit（HIGH-01 provider wiring 已修复）
→ 后续全量回归发现 HIGH-01（changeStatus 锁前 stale-read 破坏 closed terminal）
→ Regression Hotfix：
    · UserRepository.lockByPublicId + changeStatus 裁决基于锁后状态
    · 新增 Account Status Race A-D（真实 PostgreSQL，closed terminal = PASS）
    · IdentityPublicQueries 公共接口硬化（public barrel 零 internal 暴露）
    · CI 全仓回归补全（backend/admin/docs + mobile IN_PROGRESS 非阻塞）
    · Mobile/进度文档漂移修正
→ Re-Audit：BLOCKER=0、HIGH=0、MEDIUM=0、LOW=0
→ IDENTITY_IMPLEMENTATION = COMPLETE / IDENTITY_GATE = PASS / IDENTITY_DOMAIN = FROZEN（恢复）
```

不删除本报告原有结论；两者共同构成 Identity 真实历史。