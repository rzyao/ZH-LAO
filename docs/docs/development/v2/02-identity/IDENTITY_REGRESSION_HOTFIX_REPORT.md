# Identity Regression Hotfix Report

> Phase：Identity Regression Hotfix / Re-Audit
> 日期：2026-08-31
> 仓库：https://github.com/rzyao/ZH-LAO

```text
IDENTITY_IMPLEMENTATION = COMPLETE
IDENTITY_GATE           = PASS
IDENTITY_DOMAIN         = FROZEN
```

---

## 1. Trigger

IDN-01 ~ IDN-21 已实现并曾标记 `IDENTITY_IMPLEMENTATION = COMPLETE`、`IDENTITY_GATE = PASS`、`IDENTITY_DOMAIN = FROZEN`。最新全量 GitHub 回归审查发现：

```text
BLOCKER = 0
HIGH    = 1
MEDIUM  = 2
LOW     = 2
```

本轮不是重新开发 Identity，也不是重新设计数据库，而是执行 Identity Regression Hotfix：修复已确认问题 → 补齐回归测试 → 全量审计 → 更新报告 → 重新冻结。

## 2. Findings

```text
HIGH-01  Account status concurrent stale-read
MEDIUM-01  CI incomplete whole-repository regression coverage
MEDIUM-02  Identity public contract construction boundary
LOW-01     Mobile plan/code status drift
LOW-02     Development progress metadata drift
```

## 3. Fixes

### HIGH-01 — Account status concurrent stale-read（FIXED）

**根因**：[identity-state.ts](file:///c:/project/ZH-LAO/apps/backend/src/modules/identity/application/use-cases/identity-state.ts) 的 `changeStatus()` 先用 `findByPublicId`（普通 SELECT，无锁）读取 `current`，再 `lockByInternalId`，随后仍使用锁前的 `current.status` 做状态机裁决。并发 `active->closed` 与 `active->disabled` 时，后获得锁的事务可能基于 stale `active` 执行 `closed->disabled`，破坏 `closed = terminal`。

**修复**：
- [identity-repositories.ts](file:///c:/project/ZH-LAO/apps/backend/src/modules/identity/application/ports/identity-repositories.ts) 新增 `UserRepository.lockByPublicId(id)`。
- [repositories.ts](file:///c:/project/ZH-LAO/apps/backend/src/modules/identity/infrastructure/repositories.ts) 实现：

```sql
SELECT ... FROM identity.users WHERE public_id = $1 FOR UPDATE
```

- `changeStatus()` 改用 `lockByPublicId`，状态读取与 row lock 构成同一个 PostgreSQL serialization point；状态机裁决基于锁后最新行。冻结状态机保持不变（`active↔disabled`、`active|disabled->closed`、`closed` terminal）。

### MEDIUM-01 — CI 全仓回归覆盖不完整（FIXED）

**根因**：[foundation.yml](file:///c:/project/ZH-LAO/.github/workflows/foundation.yml) 仅覆盖 Backend + PostgreSQL，未覆盖 Admin / Docs / Mobile。

**修复**：CI 重构为 4 个 job：
- `backend`（mandatory）：install → `verify`（typecheck/lint/architecture/unit）→ `build` → `test:integration`（真实 PostgreSQL）→ `database/v2 test`（validation lifecycle）→ `database/v2 validate`（fresh migration / second no-op / audit / smoke）。
- `admin`（mandatory）：install → `verify`（typecheck/lint/unit+build）→ `playwright install` → `e2e`（Playwright smoke）。
- `docs`（mandatory）：install → `docs:build`（VitePress `ignoreDeadLinks: false`，broken internal link 会阻断 CI）。
- `mobile`（**非 mandatory，`continue-on-error`**）：install → `verify`。原因：Mobile Foundation 当前 `IN_PROGRESS`，`MOBILE_FOUNDATION_GATE` 未声明 `PASS`，故作为独立验证、明确不阻塞，且**不**代表 `MOBILE_FOUNDATION_GATE = PASS`（YAML 内注释说明）。

无 `--passWithNoTests`、无 `|| true`；唯一 `continue-on-error` 为已说明原因的 mobile job。

### MEDIUM-02 — Identity public contract construction boundary（FIXED）

**根因**：原 `IdentityPublicQuery` 类的构造签名直接依赖 `IdentityRepositories` / `DatabaseExecutor`，即 public 类的 construction contract 知道 Identity internal infrastructure/application 类型；下游 Domain 若 `new IdentityPublicQuery(createIdentityRepositories, executor)` 会耦合内部实现。

**修复**：
- [public/query.ts](file:///c:/project/ZH-LAO/apps/backend/src/modules/identity/public/query.ts) 只保留纯净契约：`IdentityPublicQueries` 接口（`getIdentityAccountStatus` / `isIdentityActive` / `getIdentitySummary`）+ `IdentityPublicSummary` 类型，不再引用任何内部类型。
- [identity-public-query.ts](file:///c:/project/ZH-LAO/apps/backend/src/modules/identity/application/services/identity-public-query.ts)（application 内部）承载 `IdentityPublicQueryImpl` 与 `createIdentityPublicQuery` factory，composition 在 Identity 内部完成。
- [public/index.ts](file:///c:/project/ZH-LAO/apps/backend/src/modules/identity/public/index.ts) 只导出原语 + `IdentityPublicQueries` + `IdentityPublicSummary`，不导出 impl / repository / executor。
- 新增静态 contract-leak 审计测试 + 更新既有 public export 断言。

### LOW-01 — Mobile plan/code status drift（FIXED）

**根因**：[MOBILE_FOUNDATION_PLAN.md](file:///c:/project/ZH-LAO/docs/docs/development/v2/MOBILE_FOUNDATION_PLAN.md) 仍标记 `PLANNING`，但 `apps/mobile` 已存在大量 Foundation 实现代码。

**修复**：按实际开发状态改为 `IN_PROGRESS`，并附修正说明（无 `MOBILE_FOUNDATION_REPORT.md`、无 Gate 证据，禁止标 `COMPLETE / PASS`）。本轮**不是** Mobile Foundation Final Audit。

### LOW-02 — Development progress metadata drift（FIXED）

**根因**：[DEVELOPMENT_PROGRESS.md](file:///c:/project/ZH-LAO/docs/docs/development/v2/DEVELOPMENT_PROGRESS.md) frontmatter `last_updated: 2026-08-30`，正文已含 2026-08-31 内容。

**修复**：`last_updated` → `2026-08-31`；Identity 行更新为本轮 hotfix 后的证据（34 unit + 88 integration / Race 19 / Regression Hotfix 报告链接）；更新历史追加本轮记录。

## 4. Account State Concurrency Proof

新增 4 个 Race 测试（[identity-race.test.ts](file:///c:/project/ZH-LAO/apps/backend/test/integration/identity-race.test.ts)），全部基于真实 PostgreSQL、无窄毫秒时序断言，验证数据库最终状态 / 事务顺序 / 事件数量 / 事件 previous_status：

```text
Race A  active -> closed  VS  active -> disabled
        → 若 closed 提交成功，最终状态绝不被后续 stale 事务改回 disabled；最终恒为 closed。
Race B  disabled -> closed VS disabled -> active
        → closed 一旦成为最新已提交状态，closed->active 不得发生；最终恒为 closed。
Race C  并发两个 active -> disabled
        → 恰好 1 个真实状态变更产生 1 条 account_status_changed（previous=active）。
Race D  AccountStatusChanged.previous_status 必须来自锁后实际 previous state
        → 外部事务持锁将 active 置 disabled 提交后，changeStatus(closed) 事件 previous=disabled（拒绝 stale active）。
Race E  保留并重新验证 disable vs refresh（disabled 后无可用 refresh session）。
Race F  保留并重新验证 close vs login（closed 后 authentication denied、active sessions = 0）。
```

```text
closed terminal invariant = PASS
Account Status Race       = PASS
```

实际运行：`identity-race.test.ts` 19/19 PASS（15 既有 + 4 新增）；`identity-state.test.ts` PASS。

## 5. Public Contract

最终 public exports（`identity/public/index.ts`）：

```text
identityAccountStatusSchema / parseIdentityAccountStatus / IdentityAccountStatus
isUserPublicId / parseUserPublicId / UserPublicId
IdentityPublicQueries（接口） / IdentityPublicSummary（类型）
```

证明：

```text
internal BIGINT exposure = 0（UserInternalId / SessionInternalId / DeviceInternalId 等未导出）
repository exposure       = 0（IdentityRepositories / UserRepository 未导出）
DB executor exposure      = 0（DatabaseExecutor / TransactionManager 未导出）
hash exposure             = 0（RefreshTokenHash / OtpCodeHash 未导出）
impl exposure             = 0（IdentityPublicQueryImpl 未从 public 导出）
```

下游 Domain 只能依赖 `identity/public` 并拿到 `IdentityPublicQueries`；`identity/application`、`identity/infrastructure`、repository 直连仍被架构审计禁止。静态 contract-leak 测试覆盖（identity-public-query.test.ts、identity-core-types.test.ts）。

## 6. HTTP Contract

```text
Frozen endpoints = 16（/api/v1/identity：phone-otp、auth/phone、auth/facebook、sessions/refresh、sessions/logout、sessions/logout-all、me、me/status、me/profile(GET/PATCH)、me/learning-profile、me/devices(GET/DELETE)、me/sessions、me/phone/bind、me/phone/change）
Unexpected endpoints = 0
```

本轮未新增任何端点；未引入 account disable/close HTTP、arbitrary session revoke、Facebook bind/unlink、password/email/Google/Apple/MFA/passkey、guest sync。HTTP SQL = 0、HTTP Repository access = 0（架构审计强制）；unknown field / mass assignment 拒绝；token 响应 `Cache-Control: no-store` + `Pragma: no-cache`。HTTP integration 17/17 PASS。

## 7. Security

```text
raw OTP persistence      = 0（仅 HMAC code_hash）
raw refresh persistence  = 0（仅 refresh_token_hash）
secret logging           = 0（无 console.log/error；日志脱敏测试 PASS）
internal BIGINT HTTP exposure = 0
sensitive Outbox payload  = 0（仅 user_public_id / provider / direction / status）
Facebook credential persistence/log = 0
full push token log / output = 0
```

全模块扫描：`TODO/FIXME/HACK/@ts-ignore/@ts-expect-error/console.*/as any` 命中 = 0（仅 1 处已文档化的 `TECH_DEBT` 注释，指向生产 SMS adapter 生产集成债）。Provider 安全：`FakeOtpDeliveryProvider` / `FakeFacebookCredentialVerifier` = tests only；未配置生产 provider → fail closed 503 `PROVIDER_UNAVAILABLE`；Console OTP = development 显式配置 only。JWT/OTP/IDOR/mass-assignment/账号枚举缓解 = PASS。

## 8. Database

```text
Frozen migration changes = 0（0100_identity.sql / 1220_identity_auth_runtime.sql 未改动）
Fresh migrations         = 17
Second migration run     = 0
Database audit           = PASS
Cross-domain physical FK = 0
Logical UUID violations  = 0
timestamp without timezone violations = 0
```

`V2_DATABASE_BASELINE_REPORT.md` 由 validate 重新生成：仅 generated-at 时间与 validation database 名变化；migration SHA-256 与 schema semantics 不变。

> 本地环境备注：本机 `zh_lao` dev 数据库装有 `postgis`（本地环境残留，非仓库内容），故本机直接 `pnpm --dir database/v2 validate`（命中 .env 的 DATABASE_URL）会命中 `forbidden extension: postgis`；以 fresh template0 validation database（清空 DATABASE_URL）验证为 PASS。CI 使用全新 postgres:18 容器，无 postgis，不受影响。

## 9. Tests

```text
Backend:
  typecheck   = PASS
  lint        = PASS（0 error）
  architecture= PASS
  build       = PASS
  unit        = 34/34（14 文件）
  integration = 88/88（14 文件）
      HTTP=17  E2E=13  Security=11  Race=19（15 既有+4 新增）  Provider=4  回归=24
Database:
  validation lifecycle = 3/3 PASS
  fresh 17 / second 0 / smoke / audit = PASS
Admin:
  verify（typecheck/lint/unit+build）= PASS（57 tests）
  Playwright smoke = 6/6 PASS
Docs:
  VitePress build = PASS（ignoreDeadLinks: false）
Mobile:
  typecheck = FAIL（前置 IN_PROGRESS 遗留测试文件 reuseMigration.test.tsx，见 OUT_OF_SCOPE）
```

## 10. CI

```text
backend（mandatory） = install + verify + build + test:integration + database test + database validate
admin（mandatory）   = install + verify + playwright install + e2e
docs（mandatory）    = install + docs:build
mobile（non-blocking）= install + verify（IN_PROGRESS，非 formal Gate；YAML 内已说明原因）
```

无 `--passWithNoTests`、无 `|| true`；唯一 `continue-on-error` 为 mobile job（非 mandatory，已注释说明）。

## 11. Remaining Findings

```text
BLOCKER = 0
HIGH    = 0
MEDIUM  = 0
LOW     = 0
```

OUT_OF_SCOPE_FINDING（非 Identity 范围，不阻塞，记录如下）：

```text
MOB-OOS-01  apps/mobile/__tests__/reuseMigration.test.tsx 为未提交的 Mobile Foundation 工作产物，
            Mobile typecheck 失败。owner = Mobile Foundation（其自身实施计划与 Gate）。
            removal condition = Mobile Foundation 完成该测试文件后。
            target phase = Mobile Foundation。
            本轮不越界修改（非 Identity 范围）。
```

TECH_DEBT（已文档化，非阻塞）：生产 SMS/OTP adapter、真实 Meta/Facebook verifier = Production Integration Debt。

## 12. Final Gate

全部满足：

```text
BLOCKER = 0；HIGH = 0
Account status concurrency invariant = PASS
closed terminal = PASS
Identity public boundary = PASS
HTTP frozen contract = PASS
Security audit = PASS
Race suite = PASS
Provider production safety = PASS
Outbox atomicity = PASS
Frozen migration diff = 0
Fresh DB validation = PASS
Backend regression = PASS
Admin regression = PASS
Docs build = PASS
CI configuration = PASS
```

因此恢复：

```text
IDENTITY_IMPLEMENTATION = COMPLETE
IDENTITY_GATE           = PASS
IDENTITY_DOMAIN         = FROZEN
```

停止于 Identity Regression Hotfix / Re-Audit，等待人工确认，不进入下一 Phase。
