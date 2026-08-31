---
status: complete
phase: 3
phase_name: Platform Domain
document: PLATFORM_DESIGN_AUDIT
audited_at: 2026-08-31
design_gate: PASS
implementation_started: false
---

# ZH-LAO  — Platform Design Audit

## 1. Audit Scope

本审计只核对 PHASE 3 — Platform Domain 的实施前设计：

```text
Database
↕
Use Cases
↕
Config / Runtime Contracts
↕
HTTP/API
↕
Public Contract
↕
Cross-Domain Boundary
```

未实现 Platform application service、repository、HTTP route、Admin/Mobile 代码，也未修改 frozen migration。

---

# 2. Sources Reviewed

权威事实源：

```text
database/migrations/0300_platform.sql
docs/docs/domains/platform/database.md
docs/docs/domains/platform/index.md
docs/docs/development/MASTER_DEVELOPMENT_PLAN.md
docs/docs/development/02-identity/*
apps/backend/src/modules/identity/public/*
```

本次新冻结文档：

```text
PLATFORM_IMPLEMENTATION_PLAN.md
PLATFORM_USE_CASES.md
PLATFORM_CONFIG_CONTRACTS.md
PLATFORM_API.md
```

冲突优先级：

```text
frozen migration / forward migration
→ frozen global architecture
→ latest frozen Platform domain documentation
→ Phase 3 design artifacts
```

---

# 3. Frozen Table Audit

PASS。

Platform 仍严格为 6 张业务表：

```text
platform.feature_flags
platform.feature_flag_overrides
platform.runtime_configs
platform.app_versions
platform.announcements
platform.regions
```

没有新增第 7 张表，没有 Config History / Notification / Geography / Platform Audit 表。

```text
Frozen tables = 6
Table addition = 0
Table removal = 0
Frozen migration edit = 0
```

---

# 4. Database ↔ Frozen Documentation Audit

## 4.1 Feature Flags

PASS。

`0300_platform.sql` 与 frozen documentation 一致：

- `key UNIQUE`；
- key/name CHECK；
- `default_enabled`；
- `active / inactive / retired`；
- inactive/retired 时 default 必须 false；
- 正式使用后不物理删除。

求值 contract 没有发明数据库不存在的字段。

## 4.2 Feature Flag Overrides

发现并已裁决一个物理契约漂移：

```text
Frozen documentation requires:
- partial UNIQUE region
- partial UNIQUE client
- partial UNIQUE region+client
- region reverse index

Current 0300_platform.sql contains:
- FK/CHECK
- but not those four indexes
```

这会导致并发写入时数据库不能保证“每个 normalized scope 只有一条 current fact”。

裁决：

```text
DO NOT EDIT 0300_platform.sql
PLT-01 MUST add forward-only corrective migration before Override implementation
```

具体 4 个 index 已在 `PLATFORM_IMPLEMENTATION_PLAN.md` 冻结。

该问题不是新的产品未决项，也不需要重做表结构；修复路径确定、无分支。

分类：

```text
HIGH-01 — Frozen Override uniqueness missing from physical baseline
Status = RESOLVED BY REQUIRED FORWARD-MIGRATION PLAN
Remaining HIGH = 0
```

## 4.3 Runtime Config

PASS。

Frozen DB 只有 current-state：

```text
key
value_type
value JSONB
description
status active/retired
```

设计没有宣称 versioning / history / rollback / publish revision。

## 4.4 App Versions

PASS。

设计只使用 frozen 字段：

```text
client_platform
version
build_number
status
update_policy
release_notes
released_at
```

没有 region/channel/store URL 字段幻想。

## 4.5 Announcements

PASS。

设计只使用 frozen scope/time/status：

```text
region
client_platform
status
starts_at
ends_at
```

明确冻结：

```text
locale/language filtering = NOT SUPPORTED
priority = NOT SUPPORTED
push/read receipt = NOT PLATFORM
```

## 4.6 Regions

PASS。

Region 仍是 Platform 产品运营区域，不是 Identity profile owner，不是 Geography Domain。

---

# 5. Product Semantics Audit

PASS。

Platform 的 5 类产品能力已从行为而非表 CRUD 推导：

```text
Feature Runtime Control
Runtime Config
App Version Policy
Announcements
Regions
```

Management CRUD-like commands 仅作为后台维护 use cases，与 runtime product use cases 分开。

```text
Table-driven CRUD smell = 0
```

---

# 6. Feature Flag Contract Audit

PASS。

冻结优先级：

```text
status
>
region + client
>
region
>
client
>
default_enabled
```

明确：

- inactive = temporary master kill switch；
- retired = permanent terminal kill switch；
- Override 不能重新启用 inactive/retired；
- Remove Override = DELETE current state + fallback；
- missing flag = fail-closed false；
- unknown Region 不命中 region scope，但可继续 client/default fallback；
- Region status 不隐式改变 Feature Flag result；
- V1 无 global/user/segment/percentage/time/version-expression override。

```text
Ambiguous feature evaluation = 0
Unsupported scope = 0
```

---

# 7. Runtime Config Contract Audit

PASS。

关键治理冻结：

```text
DB = current value store
Code registry = typed usage/schema contract
```

每个 config 必须定义：

```text
key
value_type
owner=platform
visibility
schema
fallback(optional)
description
```

Default visibility：

```text
server_only
```

V1 不开放 generic runtime config HTTP。

Missing/retired：

```text
explicit fallback if defined
otherwise CONFIG_UNAVAILABLE
```

Unregistered key：

```text
CONFIG_KEY_UNREGISTERED
```

明确禁止：

- arbitrary key + arbitrary JSON；
- silent type coercion；
- secret storage；
- Learning/Commerce/Rewards/Trust/Chat/Social 等业务规则进入 Platform。

```text
Ambiguous config semantics = 0
万能配置垃圾桶风险 = controlled
```

---

# 8. App Version Contract Audit

PASS。

版本比较唯一顺序：

```text
numeric build_number
```

`version` 是 display/identity string，不执行 SemVer 排序。

Current exact row 决定当前 build lifecycle；latest/minimum 为派生 summary。

冻结客户端结果：

```text
known_build
supported
update_available
update_required
current_status
update_policy
latest_version
latest_build_number
minimum_supported_version
minimum_supported_build_number
latest_release_notes
reason
```

关键 invariant：

```text
optional/deprecated/blocked management state
must have higher active released upgrade target
```

避免出现“要求用户升级但没有可升级版本”。

未支持：

```text
region
channel
store_url in DB
SemVer ordering
```

```text
Ambiguous app-version policy = 0
```

---

# 9. Announcement Contract Audit

PASS。

Active predicate：

```text
published
AND starts_at <= now
AND (ends_at IS NULL OR ends_at > now)
```

Scopes：

```text
global
region
client
region+client
```

Sorting：

```text
starts_at DESC
created_at DESC
public_id ASC
```

Frozen DB 无 locale/priority，所以 contract 明确不支持。

Announcement 不承担：

```text
Push
Email
SMS
Chat System Message
User Inbox
Read Receipt
Marketing Campaign
```

```text
Announcement/Notification ownership overlap = 0
```

---

# 10. Region Contract Audit

PASS。

Stable identity：

```text
platform.regions.code
```

Internal `regions.id BIGINT` 不出 Platform。

Identity `basic_profiles.region_code`：

```text
user profile fact / logical value
```

Platform regions：

```text
canonical product reference/control data
```

冻结 logical validation：

- 不建跨 Domain FK；
- Identity profile write 不要求同步强依赖 Platform；
- client selection 使用 active Region list；
- historical profile value 可保留；
- 需要当前 availability 时 consumer 调 `PlatformRegionReader`；
- Platform 不修改 Identity。

```text
Identity/Platform region ownership overlap = 0
```

---

# 11. Use Case Audit

PASS。

最终：

```text
Required      = 33
Deferred      = 2
Not Supported = 9
```

Runtime 与 Management 分层清晰。

Required runtime：

```text
EvaluateFeatureFlag
ResolveFeatureFlags
GetRuntimeConfig
ResolveRuntimeConfigs
CheckAppVersion
GetActiveAnnouncements
GetRegion
ListActiveRegions
```

Management query/command 只管理 Platform canonical state，不让 Operations 拥有第二份状态。

Deferred：

```text
ResolveClientRuntimeConfigs
UnblockAppVersion
```

No unresolved use case semantics。

---

# 12. Public Contract Audit

PASS。

Required stable Backend public contracts：

```text
PlatformFeatureEvaluator
PlatformRuntimeConfigReader
PlatformRegionReader
```

App Version/Announcement 主要面向 HTTP；没有真实 Backend consumer 时不强行暴露 public service。

禁止 export：

```text
repositories
DatabaseExecutor
TransactionManager
DB rows
SQL
internal BIGINT
HTTP DTO
admin commands
```

这与 Identity `modules/identity/public` 的 owner-read boundary 风格一致。

```text
Internal PK exposure = 0
Cross-domain internal repository dependency = 0
```

---

# 13. HTTP/API Audit

PASS。

Runtime HTTP：

```text
POST /api/v1/platform/features/resolve
POST /api/v1/platform/app-version/check
GET  /api/v1/platform/announcements
GET  /api/v1/platform/regions
GET  /api/v1/platform/regions/:code
```

V1 不开放 generic Runtime Config HTTP。

Runtime read 可 Public，因为启动/登录前客户端需要且无用户隐私/secret。

Management prefix requirement：

```text
/api/v1/admin/platform
```

但：

```text
Operations operator auth/RBAC not yet integrated
=> no unsecured management route
=> application use cases can exist
=> HTTP registration may remain integration-gated
```

```text
Platform-owned operator auth = 0
```

---

# 14. Operations / Platform Ownership Audit

PASS。

```text
Operations = operator / RBAC / audit actor
Platform = resulting canonical runtime state
```

Platform state 只写 `platform.*`。

未来 permission requirements 已冻结为：

```text
platform.feature_flags.read/write
platform.runtime_configs.read/write
platform.app_versions.read/write
platform.announcements.read/write
platform.regions.read/write
```

这些 permission 由 Operations 强制，不在 Platform 复制权限系统。

```text
Operations/Platform ownership overlap = 0
```

---

# 15. Outbox Audit

PASS。

逐项检查：

```text
FeatureFlagChanged
RuntimeConfigChanged
AppVersionPolicyChanged
AnnouncementPublished
RegionChanged
```

V1 当前没有已冻结真实 async consumer/cache invalidation/integration requirement。

因此：

```text
Platform Outbox events = NONE REQUIRED IN V1
```

不是忘记事件，而是刻意避免 premature event design。

未来一旦有真实 consumer，再冻结 event name/version/payload，并使用现有 shared system outbox。

```text
Premature event design = 0
```

---

# 16. Cache Audit

PASS。

V1：

```text
PostgreSQL direct read = YES
Batch resolution = YES
In-process cache = NO
Redis = NO
```

理由：

- 数据量小；
- modular monolith；
- control-plane stale state 风险高于当前性能收益；
- batch 查询已能避免 N+1。

未来只有 profiling 证明必要时再增加 bounded TTL cache。

```text
Premature Redis/cache = 0
```

---

# 17. Concurrency Audit

PASS，带一个 implementation prerequisite。

冻结序列化点：

```text
Feature Flag lifecycle      -> row lock / optimistic precondition
Override scope              -> partial UNIQUE + normalized upsert
Runtime Config              -> row lock / updated_at precondition
App Version per platform    -> transaction-scoped advisory lock
Announcement                -> row lock by public_id-resolved row
Region                      -> row lock by code
```

App Version advisory lock 是必要的，因为它需要跨行验证“higher active target” invariant，而 frozen schema 没有 version column 可做单行 optimistic lock。

Override race 必须先完成 PLT-01 corrective migration。

```text
Unspecified concurrent-write semantics = 0
```

---

# 18. Client Contract Audit

PASS at design level。

MASTER 19A 要求：Feature Flags 属 Mobile  必须重建的数据/业务接入层。

Phase 3 冻结：

```text
Feature Flag client = REWRITE
App Version bootstrap = REWRITE
Region integration = REFACTOR/REWRITE according to actual Mobile page
Announcement integration = REFACTOR/REWRITE according to actual Mobile page
Admin Platform management = Greenfield after Operations auth integration
```

本设计会话不执行客户端代码。

---

# 19. Security Audit

PASS。

- runtime API 不返回 secrets；
- generic config dump 不存在；
- public Flag 不充当 authorization；
- management write 不允许无保护生产注册；
- internal BIGINT 不出边界；
- DB/SQL errors 映射稳定 application errors；
- no cross-domain writes；
- no Platform operator auth duplication。

---

# 20. Audit Findings

## HIGH-01 — Override Partial Uniqueness Physical Drift

**Finding**

Frozen Platform database documentation 与 `0300_platform.sql` 在 partial unique indexes 上不一致。

**Risk**

同 Feature Flag + 同 normalized scope 可并发产生重复 current override，导致 evaluator 多行歧义。

**Resolution**

`PLT-01 Physical Contract Correction` 已冻结为实施第一前置：新增 forward-only corrective migration，补 3 partial UNIQUE + 1 region index；禁止编辑 `0300_platform.sql`。

**Status**

```text
RESOLVED IN DESIGN / IMPLEMENTATION PREREQUISITE FROZEN
```

不再是 unresolved HIGH。

## MEDIUM-01 — Frozen DB Cannot Represent Announcement Locale/Priority

**Finding**

产品讨论需要明确语言/排序，但 frozen DB 没有 locale/language/priority。

**Resolution**

V1 明确 NOT SUPPORTED；固定 deterministic time ordering，不伪造字段。

**Status**

```text
RESOLVED
```

## MEDIUM-02 — Runtime Config Could Become Arbitrary JSON Store

**Finding**

`JSONB + key` 若直接暴露会形成万能配置中心。

**Resolution**

代码侧 typed registry + per-key schema + owner/visibility/fallback；V1 无 generic client config endpoint。

**Status**

```text
RESOLVED
```

## LOW-01 — Region Status Could Be Accidentally Coupled to Flag Evaluation

**Finding**

如果 evaluator 自动把 inactive Region 的所有 Flag 设 false，会把两个 control dimension 混合。

**Resolution**

Region availability 与 Flag evaluation 正交；需要两者时 consumer 显式组合。

**Status**

```text
RESOLVED
```

---

# 21. Remaining Audit Counts

设计修订后剩余未解决问题：

```text
BLOCKER = 0
HIGH    = 0
MEDIUM  = 0
LOW     = 0
```

Historical/resolved findings 不计入 remaining count。

---

# 22. Unresolved Product Decisions

```text
Unresolved product decisions = 0
```

明确已裁决：

- Flag precedence；
- supported scopes；
- missing/unknown Region behavior；
- Config registry/read/missing/public boundary；
- App Version build comparison/latest/minimum/force behavior；
- Announcement scope/window/sort/language non-support；
- Region ownership/logical validation；
- Public module boundary；
- Runtime/Admin HTTP boundary；
- Operations integration；
- Outbox；
- cache；
- concurrency。

---

# 23. Final Design Gate

Gate condition：

```text
BLOCKER = 0
HIGH = 0
Unresolved product decisions = 0
```

Result：

```text
Frozen migration edited = NO
New Platform table required = NO
Unresolved product decisions = 0
Remaining BLOCKER = 0
Remaining HIGH = 0
PLATFORM_DESIGN_GATE = PASS
PLATFORM_IMPLEMENTATION_STARTED = NO
```

重要：

`PLATFORM_DESIGN_GATE = PASS` 不表示可以跳过 PLT-01。

另一个执行开发会话开始后，第一项物理任务必须是：

```text
PLT-01 forward-only Platform Override index correction
```

完成并通过 fresh PostgreSQL checks 后，才进入 Platform Override write implementation。

本 Phase 设计会话到此停止。
