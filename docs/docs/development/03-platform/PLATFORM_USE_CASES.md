---
status: audited
phase: 3
phase_name: Platform Domain
document: PLATFORM_USE_CASES
last_updated: 2026-08-31
depends_on:
  - FOUNDATION_GATE = PASS
  - IDENTITY_GATE = PASS
database_authority:
  - database/v2/migrations/0300_platform.sql
  - docs/docs/domains/platform/database.md
next_artifact: PLATFORM_CONFIG_CONTRACTS.md
---

# ZH-LAO V2 — PLATFORM USE CASES

> 目标路径：`docs/docs/development/03-platform/PLATFORM_USE_CASES.md`
>
> 本文冻结 PHASE 3 — Platform Domain 的产品行为、Use Case、状态机、并发语义、跨域边界与测试要求。
>
> API 必须从本文推导，禁止按 6 张表生成 CRUD。
>
> 本文不实现代码，不修改已冻结的 `0300_platform.sql`。

---

# 1. 文档结论

Platform 的产品定位固定为：

> **Product Runtime Control Plane（产品运行控制面）**。

它回答：

- 某个产品功能当前是否开放；
- 某个客户端 build 是否仍可使用、是否应升级；
- 当前有哪些真正跨业务域的运行参数；
- 当前应展示哪些平台公告；
- 平台当前支持哪些运营 Region。

它不拥有其他业务 Domain 的业务状态，也不是万能配置中心、通知系统、权限系统或地理信息系统。

```text
PLATFORM_USE_CASES_STATUS = AUDITED / READY_FOR_API_DESIGN
```

---

# 2. Frozen Table Scope

Platform 仍严格只有 6 张表：

```text
platform.feature_flags
platform.feature_flag_overrides
platform.runtime_configs
platform.app_versions
platform.announcements
platform.regions
```

```text
TABLE ADDITION = FORBIDDEN
TABLE REMOVAL = FORBIDDEN
FROZEN MIGRATION EDIT = FORBIDDEN
```

如果需要修正已冻结物理契约，只允许 forward-only migration；不得改写 `0300_platform.sql`。

---

# 3. Use Case 总表

## 3.1 REQUIRED — Runtime / Consumer

| # | Use Case | V1 | 调用者 |
|---:|---|---|---|
| 1 | `EvaluateFeatureFlag` | REQUIRED | Backend Domain / Platform HTTP |
| 2 | `ResolveFeatureFlags` | REQUIRED | Mobile / Backend batch consumer |
| 3 | `GetRuntimeConfig` | REQUIRED | Backend Domain |
| 4 | `ResolveRuntimeConfigs` | REQUIRED | Backend batch consumer |
| 5 | `CheckAppVersion` | REQUIRED | Mobile |
| 6 | `GetActiveAnnouncements` | REQUIRED | Mobile / runtime shell |
| 7 | `GetRegion` | REQUIRED | Backend / Mobile |
| 8 | `ListActiveRegions` | REQUIRED | Mobile / Backend |

## 3.2 REQUIRED — Management Query

这些 Use Case 属于 Platform application 层，但 Management HTTP 暴露要等 Operations operator auth / RBAC 集成。

| # | Use Case | V1 |
|---:|---|---|
| 9 | `ListFeatureFlagsForManagement` | REQUIRED |
| 10 | `ListRuntimeConfigsForManagement` | REQUIRED |
| 11 | `ListAppVersionsForManagement` | REQUIRED |
| 12 | `ListAnnouncementsForManagement` | REQUIRED |
| 13 | `ListRegionsForManagement` | REQUIRED |

## 3.3 REQUIRED — Management Command

| # | Use Case | V1 |
|---:|---|---|
| 14 | `CreateFeatureFlag` | REQUIRED |
| 15 | `UpdateFeatureFlag` | REQUIRED |
| 16 | `RetireFeatureFlag` | REQUIRED |
| 17 | `SetFeatureFlagOverride` | REQUIRED |
| 18 | `RemoveFeatureFlagOverride` | REQUIRED |
| 19 | `SetRuntimeConfig` | REQUIRED |
| 20 | `RetireRuntimeConfig` | REQUIRED |
| 21 | `CreateAppVersionDraft` | REQUIRED |
| 22 | `UpdateAppVersionDraft` | REQUIRED |
| 23 | `PublishAppVersion` | REQUIRED |
| 24 | `SetAppVersionPolicy` | REQUIRED |
| 25 | `DeleteAppVersionDraft` | REQUIRED |
| 26 | `CreateAnnouncementDraft` | REQUIRED |
| 27 | `UpdateAnnouncement` | REQUIRED |
| 28 | `PublishAnnouncement` | REQUIRED |
| 29 | `RetireAnnouncement` | REQUIRED |
| 30 | `DeleteAnnouncementDraft` | REQUIRED |
| 31 | `CreateRegion` | REQUIRED |
| 32 | `UpdateRegion` | REQUIRED |
| 33 | `RetireRegion` | REQUIRED |

## 3.4 DEFERRED

| Use Case | 原因 |
|---|---|
| `ResolveClientRuntimeConfigs` | V1 不开放 generic runtime-config HTTP；若以后确有客户端配置需求，必须先冻结 client-public key registry |
| `UnblockAppVersion` | V1 `blocked` 视为终态；解除封锁需要单独产品动作与审计语义 |

## 3.5 NOT SUPPORTED

| Capability / Use Case | 原因 |
|---|---|
| Global Feature Flag Override | 全局行为只有 `default_enabled`；避免两个全局真相 |
| User / Segment Feature Flag Override | Frozen DB 无 user/segment scope |
| Percentage Rollout | Frozen DB 无 percentage/rule 字段 |
| Time-scoped / Version-expression Flag Override | Frozen DB 无对应条件字段 |
| Runtime Config History | V1 只有 current state |
| Runtime Config Rollback / Restore Version | 无版本模型 |
| App Version Region / Channel Policy | Frozen DB 无 region/channel 字段 |
| Localized / Priority Announcement | Frozen DB 无 locale/language/priority 字段 |
| Announcement Delivery / Read Receipt | Platform Announcement 不是 Notification / Inbox |

最终计数：

```text
Required      = 33
Deferred      = 2
Not Supported = 9
```

---

# 4. Feature Flag Product Semantics

## 4.1 输入上下文

`EvaluateFeatureFlag` 接收：

```text
key                required
region_code        optional
client_platform    optional: android | ios
```

不接受：

```text
user_id
segment_id
percentage
app_version
arbitrary conditions
```

`region_code` 是 Platform Region 的 stable logical code。求值时 Platform 内部可以把 code 解析为 `regions.id`；内部 BIGINT 不得出 Platform 边界。

## 4.2 冻结求值算法

```text
1. flag 不存在
   → enabled = false
   → reason = flag_not_found

2. flag.status = inactive
   → enabled = false
   → reason = flag_inactive

3. flag.status = retired
   → enabled = false
   → reason = flag_retired

4. flag.status = active
   → 尝试 region + client override
   → 未命中则 region override
   → 未命中则 client override
   → 未命中则 default_enabled
```

固定优先级：

```text
status master switch
>
region + client_platform
>
region
>
client_platform
>
default_enabled
```

`inactive` / `retired` 永远不能被 Override 重新启用。

## 4.3 Region 状态与 Flag 求值相互独立

Region 的 `active / inactive / retired` 是“平台是否支持该 Region”的事实；Feature Flag 是“某功能在某 scope 下是否开启”的事实。

因此：

- 已存在的 Region code 即使当前 inactive / retired，仍可以用于匹配历史/current override；
- `EvaluateFeatureFlag` 不自动把 inactive Region 的所有 Flag 改成 false；
- 业务若要求“只有 active Region 才能运行”，必须同时调用 Region contract；
- 不允许把 Region availability 隐式塞进 Feature Flag 算法。

这避免两个产品控制维度互相污染。

## 4.4 Unknown Region

若传入格式合法但数据库不存在的 `region_code`：

- 不命中 region / region+client override；
- 仍可命中 client override；
- 最后 fallback 到 `default_enabled`；
- 不因为未知 Region 让整个 Flag API 失败。

格式非法则属于 request validation error。

## 4.5 Remove Override

`RemoveFeatureFlagOverride` 的语义就是删除当前 scope 行：

```text
DELETE override
→ 下一次求值自动 fallback 到下一优先级
```

不生成 inactive override、不保留第二份历史状态。

## 4.6 Flag Lifecycle

```text
active <-> inactive
active/inactive -> retired
retired -> terminal
```

规则：

- `key` 创建后即视为稳定 identifier，不允许修改；
- `inactive` 时 `default_enabled` 必须为 false；进入 inactive 的 command 必须在同一事务同步将 default 设为 false；
- `retired` 时 `default_enabled` 必须为 false；
- retired 后不能恢复；
- retired Flag 不允许新增/更新 Override；已有 Override 可保留或由明确清理动作删除，但不会影响求值；
- inactive Flag 可保留或预置 Override，以便未来重新 active。

## 4.7 Feature Flag 不是权限

客户端收到 `enabled=true` 只表示产品 UI/能力开放，不是 authorization。

任何真实权限、账户状态、Trust restriction、Commerce entitlement 等仍由 owner Domain 在服务端强制验证。

---

# 5. Runtime Config Product Semantics

Runtime Config 的具体 typed contract 见 `PLATFORM_CONFIG_CONTRACTS.md`。Use Case 层冻结以下行为：

## 5.1 `GetRuntimeConfig`

只允许读取经过 Platform runtime-config registry 注册的 key。

```text
registered + active + valid value
→ return typed current value

registered + row missing/retired
→ use per-key explicit fallback（如果 registry 定义）
→ 否则 CONFIG_UNAVAILABLE

unregistered key
→ CONFIG_KEY_UNREGISTERED
```

禁止 silent coercion。

## 5.2 `ResolveRuntimeConfigs`

Batch reader：

- 一次读取多个已注册 key；
- 必须避免 N+1；
- 每个 key 独立执行类型/schema/fallback 规则；
- 不支持 arbitrary DB key dump。

## 5.3 `SetRuntimeConfig`

- 只能写 registry 中已注册的 Platform-owned key；
- `key` 不可修改；
- `value_type` 创建后不可变，更改类型必须创建新 key；
- value 必须同时通过 DB 类型规则与 application schema；
- retired key 不可复活；
- 不允许写 secrets；
- 不允许把某业务 Domain 的业务规则放入 Platform。

## 5.4 `RetireRuntimeConfig`

```text
active -> retired
retired -> terminal
```

key 永不复用，无 history / rollback 语义。

---

# 6. App Version Product Semantics

## 6.1 判断依据

客户端必须提交：

```text
client_platform = android | ios
current_version
build_number
```

真正参与大小比较的是：

```text
build_number
```

`version` 只是用户可见版本字符串，不执行 SemVer 解析，也不用于排序。

## 6.2 Released Build

V1 约束：每个正式分发到生产用户的 build 必须先在 `platform.app_versions` 中有对应记录，并且不是 `draft`。

Runtime 只把：

```text
status != draft
AND released_at <= now()
```

视为已发布记录。

Management V1 不支持未来 `released_at` 的 App Version 定时发布；`PublishAppVersion` 使用当前时间发布。

## 6.3 Exact Build 是最终事实

当前 build 的 exact row 决定当前客户端生命周期：

| status | update_policy | supported | 语义 |
|---|---|---:|---|
| active | none | true | 正常支持 |
| active | optional | true | 正常支持，可提示新版 |
| deprecated | optional | true | 仍允许使用，建议升级 |
| blocked | required | false | 禁止继续，必须升级 |
| draft | none | false | 未发布 build，不属于生产可用版本 |

## 6.4 Latest Version

```text
latest = 当前时间已发布的 active rows 中 build_number 最大者
```

如果没有 active released build，Platform 无法给客户端提供安全升级目标：

```text
APP_VERSION_POLICY_UNAVAILABLE
```

不得凭空构造 store target。

## 6.5 Minimum Supported Version

```text
minimum_supported = 当前时间已发布、status in (active, deprecated) 的 rows 中 build_number 最小者
```

它是 informational summary，不是唯一判断依据。

因为 schema 表达的是 per-build policy，可能存在 build gap；客户端最终是否 supported 永远使用 exact-build decision。

## 6.6 Decision

`CheckAppVersion` 必须返回足够让 Mobile 直接判断的结果：

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

规则：

- `update_available = latest_build_number > current build_number`；
- `update_required = exact current row 为 blocked/required`；
- active/optional 与 deprecated/optional 只有在存在更高 active build 时才是合法管理状态；
- blocked/required 必须存在更高 active build，否则拒绝该 management command，防止把用户锁死在无升级目标状态；
- unknown build / draft build：`known_build=false/true`，但 `supported=false`；若有 active target 则返回 `update_required=true` 与 target；若没有 active target 则返回 policy unavailable；
- exact row 的 `version` 与客户端提交的 `current_version` 不一致时返回 `APP_VERSION_MISMATCH`，不静默接受。

## 6.7 不支持的维度

V1 不支持：

```text
region
release channel
store_url in DB
custom update message in DB
SemVer ordering
```

应用商店 URL 属 Mobile build/configuration，不由当前 `app_versions` 表承载；可展示说明只使用目标 build 的 `release_notes`。

---

# 7. Announcement Product Semantics

## 7.1 Scope

Frozen DB 支持：

```text
Global                   region_id NULL, client_platform NULL
Region                   region_id set, client_platform NULL
Client Platform          region_id NULL, client_platform set
Region + Client          both set
```

## 7.2 Active Predicate

```text
status = published
AND starts_at <= now()
AND (ends_at IS NULL OR ends_at > now())
```

`published + starts_at > now()` 自然表示 scheduled display；不新增 scheduled 状态。

## 7.3 Runtime Matching

调用者可提供：

```text
region_code optional
client_platform optional
```

返回所有 active 且 scope 匹配的公告。

若 region code 合法但未知，只返回不依赖该 Region 的 Global / Client 公告。

Region inactive / retired 不自动屏蔽 Region 公告，因为“该地区服务暂停”的公告本身可能仍需要展示。

## 7.4 Sorting

Frozen DB 无 priority 字段，因此 V1 不存在“高优先级公告”语义。

固定排序：

```text
starts_at DESC
created_at DESC
public_id ASC   // deterministic tie-breaker
```

## 7.5 Language / Locale

Frozen DB 没有 locale/language 字段。

因此 V1：

```text
Announcement locale filtering = NOT SUPPORTED
```

同一公告只有一份 `title/content`。不得在 API 层伪造 locale 维度，也不得把 JSON translation 偷塞进 `content`。

## 7.6 Lifecycle

```text
draft -> published -> retired
```

规则：

- draft 可删除；
- published / retired 不物理删除；
- published 后 `region`、`client_platform`、首次 `starts_at` 视为冻结；scope 错误应 retire 并新建公告；
- published 状态允许修正文案 `title/content` 与调整 `ends_at`；
- retired 终态，不恢复；
- Platform 不保存 push delivery、read receipt、user inbox。

---

# 8. Region Product Semantics

## 8.1 Identity

Region 的 stable identity 是：

```text
platform.regions.code
```

V1 不对外暴露内部 `regions.id BIGINT`。

`code` 创建后不可修改、不可复用。

## 8.2 Fields

Runtime contract 只使用 DB 已有字段：

```text
code
name
default_locale
timezone
status
```

没有 country FK、country relation、administrative hierarchy。

## 8.3 Validation

Application 层：

- `code`：Frozen regex；
- `default_locale`：验证为受支持的 BCP 47 language tag；
- `timezone`：验证为 IANA timezone；
- `name`：非空；当前不是 localized name。

## 8.4 Lifecycle

```text
active <-> inactive
active/inactive -> retired
retired -> terminal
```

- inactive = 暂停作为当前支持 Region；
- retired = 永久退出；
- historical logical references 保留；
- 新建 Flag Override / Announcement 不允许指向 retired Region；inactive Region 仍允许预配置 Override，也允许发布服务状态公告。

## 8.5 与 Identity `basic_profiles.region_code` 的边界

Identity 的 `region_code` 是用户 profile fact；Platform `regions` 是 canonical product reference/control data。

V1 冻结：

- 不建立跨 Domain FK；
- 不要求 Identity profile write 对 Platform 做强同步依赖；
- 客户端 region selection 应优先来自 `ListActiveRegions`；
- 已存的 Identity `region_code` 即使后来 Region inactive/retired，仍是合法历史 profile value；
- 需要“当前 Region 必须受支持”的业务能力，应在消费时调用 `PlatformRegionReader` 判断；
- Platform 不修改 Identity profile。

因此 Region semantic validation 是 logical/runtime validation，不是 physical relational validation。

---

# 9. Management Ownership

Operations 与 Platform 边界固定：

```text
Operations
= operator identity / RBAC / audit actor

Platform
= canonical runtime state
```

所以：

- Admin mutation 最终调用 Platform application use case；
- Platform repository 只写 `platform.*`；
- Operations 不复制 Feature Flag / Config / Version / Announcement / Region state；
- Platform 不实现第二套 operator auth；
- Phase 3 只冻结未来 management permission requirement；Management HTTP 注册可在 Operations Integration 后完成。

---

# 10. Concurrency & Consistency

## 10.1 Feature Flag Definition

状态/默认值变更使用 row lock 或 compare-and-set，确保：

```text
inactive/retired => default_enabled=false
retired terminal
```

并发 metadata update 可使用 `updated_at` 作为 optimistic precondition；冲突返回稳定 domain error，不暴露 PostgreSQL 错误。

## 10.2 Override Set / Remove

必须依赖三类 scope 的数据库唯一性保证。

`SetFeatureFlagOverride` 使用 scope-normalized upsert；`RemoveFeatureFlagOverride` 按同一 normalized scope 删除。

并发 set/set 不能产生两条同 scope 当前事实；并发 set/remove 允许“最后提交的有效 command 决定最终 current state”。

当前 `0300_platform.sql` 缺少 frozen documentation 中的三个 partial UNIQUE，实施前必须用 forward-only corrective migration 补齐；不得修改 `0300_platform.sql`。

## 10.3 Runtime Config

- existing row update：row lock / optimistic `updated_at` precondition；
- first create race：`UNIQUE(key)` 决定唯一赢家；
- retired terminal；
- stale management write 返回 conflict，不做 silent last-write-wins。

## 10.4 App Version

所有同一 `client_platform` 的 publish/policy command 必须序列化，建议使用 transaction-scoped advisory lock keyed by platform。

原因：`optional/deprecated/blocked` 都依赖“存在更高 active build”的跨行 invariant。

## 10.5 Announcement

按 `public_id` 解析内部 row 后加 row lock；publish/update/retire 并发串行化。Retired command 为幂等终态。

## 10.6 Region

按 `code` row lock；retired terminal。Region status 变更不级联修改 Flag Override / Announcement，也不跨域修改 Identity。

---

# 11. Outbox Decision

V1 当前没有真实异步 consumer、cache invalidation bus 或跨 Domain state propagation 需求。

因此：

```text
Platform Outbox events = NONE REQUIRED IN V1
```

不冻结：

```text
FeatureFlagChanged
RuntimeConfigChanged
AppVersionPolicyChanged
AnnouncementPublished
RegionChanged
```

为 V1 强制事件。

未来出现真实 consumer 后，再单独冻结 event name/version/payload；届时 canonical write + Outbox 必须同事务。

---

# 12. Cache Decision

V1：

```text
Redis = NO
In-process runtime cache = NO
PostgreSQL direct read = YES
Batch resolution = YES
```

原因：

- 六表规模小；
- 单体阶段读压力可控；
- Feature Flag / Runtime Config 属控制面，直接读可避免 stale state 与 invalidation 复杂度；
- `ResolveFeatureFlags` / `ResolveRuntimeConfigs` 必须批量查询，避免 N+1。

只有真实 profiling 证明 PostgreSQL read 成为热点后，才允许增加 bounded in-process TTL cache；届时必须明确 TTL、staleness budget 和 invalidation，不自动引入 Redis。

---

# 13. Required Test Matrix

至少覆盖：

## Feature Flag

- active default true/false；
- inactive/retired 强制 false；
- region+client > region > client > default；
- unknown region fallback；
- missing flag fail-closed；
- override delete fallback；
- same-scope concurrent set ×2；
- set vs remove race；
- retired flag 禁止新增 override。

## Runtime Config

- 每种 value_type；
- JSON object/array；
- registry schema invalid；
- missing with fallback / without fallback；
- retired read；
- unregistered key；
- stale concurrent update；
- secret/business-domain key rejection。

## App Version

- active none；
- active optional；
- deprecated optional；
- blocked required；
- latest/minimum derivation；
- unknown/draft build；
- version/build mismatch；
- no active target；
- concurrent publish/policy update；
- blocked without higher active target must fail。

## Announcement

- global/region/client/combined scope；
- future starts_at；
- expired ends_at；
- retired exclusion；
- deterministic sorting；
- unknown region returns global/client only；
- no locale/priority behavior；
- concurrent publish/retire。

## Region

- active list；
- get inactive/retired；
- code immutability；
- BCP47 / IANA validation；
- retired terminal；
- no cascade to Identity/other domains。

---

# 14. Exit Criteria for Use Case Design

```text
Table-driven CRUD smell = 0
Ambiguous Flag precedence = 0
Unsupported scope = 0
Config ownership ambiguity = 0
App-version comparison ambiguity = 0
Announcement locale/priority ambiguity = 0
Region ownership ambiguity = 0
Cross-domain SQL requirement = 0
Internal BIGINT exposure = 0
Premature event/cache requirement = 0
```

本文到此停止，不进入 Platform Implementation。
