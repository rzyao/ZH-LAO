---
status: audited
phase: 3
phase_name: Platform Domain
document: PLATFORM_CONFIG_CONTRACTS
last_updated: 2026-09-02
depends_on:
  - PLATFORM_USE_CASES.md
database_authority:
  - database/migrations/0300_platform.sql
  - docs/docs/domains/platform/database.md
next_artifact: PLATFORM_API.md
lifecycle: historical
---

# ZH-LAO  — PLATFORM CONFIG CONTRACTS

> 目标路径：`docs/docs/development/03-platform/PLATFORM_CONFIG_CONTRACTS.md`
>
> 本文冻结 Platform V1 的 Feature Flag、Runtime Config、App Version、Announcement、Region 运行时契约，以及 `modules/platform/public` 的稳定业务边界。
>
> 不进入实现，不添加第 7 张表，不修改 frozen migration。

---

# 1. Contract Status

```text
Feature Flag Contract = FROZEN
Runtime Config Contract = FROZEN
App Version Contract = FROZEN
Announcement Contract = FROZEN
Region Contract = FROZEN
Public Contract = FROZEN
```

---

# 2. Shared Runtime Context

Platform V1 runtime context 只使用数据库真实支持的维度：

```ts
export type PlatformClientPlatform = 'android' | 'ios';

export type PlatformRuntimeContext = Readonly<{
  regionCode?: string;
  clientPlatform?: PlatformClientPlatform;
}>;
```

明确不包含：

```text
user_id
segment
percentage bucket
release channel
arbitrary attributes
```

Region code 在 Platform 边界外是稳定 logical value；`regions.id BIGINT` 永不暴露。

---

# 3. Feature Flag Evaluation Contract

## 3.1 Public Input

```ts
export type EvaluatePlatformFeatureInput = Readonly<{
  key: string;
  context?: PlatformRuntimeContext;
}>;
```

## 3.2 Result

```ts
export type PlatformFeatureDecisionReason =
  | 'flag_not_found'
  | 'flag_inactive'
  | 'flag_retired'
  | 'region_client_override'
  | 'region_override'
  | 'client_override'
  | 'default_enabled';

export type PlatformFeatureDecision = Readonly<{
  key: string;
  enabled: boolean;
  reason: PlatformFeatureDecisionReason;
}>;
```

不要把内部：

```text
feature_flags.id
override.id
region_id
created_at
updated_at
```

暴露给 consumer。

## 3.3 Algorithm

```text
flag missing       -> false / flag_not_found
flag inactive      -> false / flag_inactive
flag retired       -> false / flag_retired
flag active        -> region+client
                   -> region
                   -> client
                   -> default_enabled
```

`inactive` / `retired` 是 master result，Override 不能重新打开。

## 3.4 Fail-safe Rule

Backend authorization/security 不得依赖 Feature Flag 作为唯一防线；但 Feature Flag 本身查询失败时，consumer 不应自行猜 `true`。

Public evaluator 的 infrastructure failure 应抛稳定 Platform error；只有“flag 不存在”按合同 fail-closed 返回 false。

## 3.5 Batch

```ts
export interface PlatformFeatureEvaluator {
  evaluateFeature(input: EvaluatePlatformFeatureInput): Promise<PlatformFeatureDecision>;

  resolveFeatures(input: Readonly<{
    keys: readonly string[];
    context?: PlatformRuntimeContext;
  }>): Promise<readonly PlatformFeatureDecision[]>;
}
```

结果顺序与输入 key 顺序一致；重复 key 可在应用层去重查询后恢复顺序。

---

# 4. Runtime Config Governance Contract

## 4.1 Core Rule

`platform.runtime_configs` 不是“DB 里有什么 key 就让任何调用者读什么 key”。

V1 必须建立**代码侧 registry**，每一个可用 key 都要有明确 owner、type、schema、visibility、fallback 和说明。

数据库是 current value store；代码 registry 是 usage/schema contract。

## 4.2 Key Naming

数据库 regex 继续是：

```text
^[a-z][a-z0-9_]{0,99}$
```

V1 naming 进一步约定：

```text
<capability>_<meaning>
```

例如：

```text
default_locale
support_email
maintenance_notice_url
```

不引入点号命名，因为 frozen DB regex 不支持 `.`。

key 创建后稳定、不改名、不复用。

## 4.3 Registry Shape

设计语义：

```ts
export type PlatformRuntimeConfigValueType =
  | 'string'
  | 'integer'
  | 'number'
  | 'boolean'
  | 'json';

export type PlatformRuntimeConfigVisibility =
  | 'server_only'
  | 'client_public';

export type PlatformRuntimeConfigDefinition<T> = Readonly<{
  key: string;
  valueType: PlatformRuntimeConfigValueType;
  visibility: PlatformRuntimeConfigVisibility;
  owner: 'platform';
  description: string;
  validate: (value: unknown) => T;
  fallback?: T;
}>;
```

这只是 contract shape；实现时可以用 Zod 构建 typed registry。

## 4.4 V1 Public/Server Boundary

默认：

```text
visibility = server_only
```

任何 key 若要通过 HTTP 暴露给 Mobile，必须在 registry 显式标记 `client_public` 并经过安全审计。

V1 不提供：

```text
GET all runtime configs
GET arbitrary config by caller-supplied key
```

客户端不应看到 server-only config inventory。

## 4.5 Value Type

数据库允许：

```text
string
integer
number
boolean
json(object/array only)
```

Application contract 要求：

1. DB `value_type` 必须等于 registry `valueType`；
2. DB JSONB primitive/container 类型必须通过 frozen CHECK；
3. 解析后的 value 还必须通过该 key 自己的 schema；
4. 禁止 string -> number、number -> boolean 等 silent coercion；
5. `json` 不表示“任意 JSON”，仍必须有 per-key schema。

## 4.6 Missing / Retired Semantics

对于 registered key：

```text
active row + valid value
→ current typed value

missing row OR retired row
→ 如果 registry 有 fallback，返回 fallback
→ 否则 CONFIG_UNAVAILABLE
```

对于未注册 key：

```text
CONFIG_KEY_UNREGISTERED
```

Retired key 不被视为“最后值仍然有效”。保留 value 只是历史可读事实，不代表 runtime 可继续消费。

## 4.7 Update Semantics

`SetRuntimeConfig`：

- 新 key：必须先存在 code registry 定义；
- existing key：只允许 value/description 的受控更新；
- `key` immutable；
- `value_type` immutable；
- `retired` terminal；
- stale management write 需要 conflict 检测；
- 不支持版本发布、rollback、effective_at。

## 4.8 Ownership Filter

可放入 Platform Runtime Config 的判定：

```text
A. 是产品横向运行参数
AND
B. 无明确业务 Domain owner
AND
C. 不是 secret
AND
D. 不需要复杂独立状态机/历史版本
```

任何一项不满足，就不放 Platform。

明确禁止示例：

```text
Learning algorithm / review rules
Commerce prices / refund policy / exchange rate
Rewards amount/rules
Trust thresholds / enforcement policy
Chat message limits/business rules
Social matching/business rules
TTS provider routing owned by Learning/Audio
```

## 4.9 Caching Expectation

V1 reader 直接 PostgreSQL；不保证跨请求 cache。

Consumer 不应依赖“写后缓存同步”之类未实现语义。

---

# 5. Runtime Config Reader Public Contract

推荐稳定边界：

```ts
export interface PlatformRuntimeConfigReader {
  getRuntimeConfig<T>(definition: PlatformRuntimeConfigDefinition<T>): Promise<T>;

  resolveRuntimeConfigs<TDefinitions extends readonly PlatformRuntimeConfigDefinition<unknown>[]>(
    definitions: TDefinitions,
  ): Promise<Readonly<Record<string, unknown>>>;
}
```

跨 Domain consumer 应依赖 **typed definition / stable reader**，而不是直接传任意字符串去查 DB。

禁止 public contract 暴露：

```text
RuntimeConfigRow
JSONB raw DB record
DatabaseExecutor
repository
internal BIGINT
SQL
```

---

# 6. App Version Contract

## 6.1 Client Request

```ts
export type CheckPlatformAppVersionInput = Readonly<{
  clientPlatform: 'android' | 'ios';
  currentVersion: string;
  buildNumber: number;
}>;
```

`buildNumber` 必须为正整数。

## 6.2 Version Comparison

冻结：

```text
ordering = build_number numeric ordering
version string = identity/display only
SemVer comparison = NOT USED
```

如果 exact DB row 的 `version` 与 request `currentVersion` 不一致，返回 `APP_VERSION_MISMATCH`。

## 6.3 Runtime Result

```ts
export type PlatformAppVersionDecisionReason =
  | 'current'
  | 'newer_version_available'
  | 'deprecated'
  | 'blocked'
  | 'unknown_build'
  | 'draft_build';

export type PlatformAppVersionDecision = Readonly<{
  clientPlatform: 'android' | 'ios';
  currentVersion: string;
  currentBuildNumber: number;
  knownBuild: boolean;
  supported: boolean;
  updateAvailable: boolean;
  updateRequired: boolean;
  currentStatus?: 'active' | 'deprecated' | 'blocked';
  updatePolicy?: 'none' | 'optional' | 'required';
  latestVersion: string;
  latestBuildNumber: number;
  minimumSupportedVersion?: string;
  minimumSupportedBuildNumber?: number;
  latestReleaseNotes?: string;
  reason: PlatformAppVersionDecisionReason;
}>;
```

`latestVersion/latestBuildNumber` 必须来自最高 active released build。

## 6.4 Supported / Required Rules

```text
active      -> supported=true
              update_required=false

deprecated  -> supported=true
              update_required=false

blocked     -> supported=false
              update_required=true

unknown     -> supported=false
              update_required=true if valid active target exists

draft       -> supported=false
              update_required=true if valid active target exists
```

`optional` 是提示策略，不会直接变成 `updateRequired=true`。

## 6.5 Update Available

```text
updateAvailable = latest_build_number > current_build_number
```

如果客户端 build_number 比 Platform 当前 latest 更大：

- exact row known 且 released：按 exact row 语义；
- exact row unknown：unknown build，不因为数字更大就自动 trust/support。

## 6.6 Minimum Supported

只作为 summary：

```text
min build among released active/deprecated rows
```

由于 per-build 状态可能不连续，不能用：

```text
build >= min => supported
```

来替代 exact build lookup。

## 6.7 Management Invariants

以下命令必须验证存在**更高 build_number 的 active released target**：

```text
active -> optional
active -> deprecated
active/deprecated -> blocked
```

否则拒绝，防止产生“要求用户升级但没有可升级目标”的不可恢复客户端状态。

`blocked` V1 terminal。

## 6.8 DB 不支持的字段

HTTP / public contract 不伪造：

```text
region
channel
store_url
custom update_message
minimum version stored column
latest version stored column
```

latest/minimum 均由 rows 派生；store URL 由客户端自己的 deployment/build config 管理。

---

# 7. Announcement Contract

## 7.1 Runtime Query

```ts
export type GetPlatformAnnouncementsInput = Readonly<{
  regionCode?: string;
  clientPlatform?: 'android' | 'ios';
}>;
```

## 7.2 Public DTO

```ts
export type PlatformAnnouncement = Readonly<{
  announcementId: string; // announcements.public_id UUID
  title: string;
  content: string;
  startsAt: string;
  endsAt?: string;
}>;
```

不暴露：

```text
announcements.id
region_id
status internal management metadata
created_at / updated_at unless future product use requires
```

Scope 仅用于过滤，不必回显内部 FK。

## 7.3 Visibility Predicate

```text
published
AND starts_at <= now
AND (ends_at null OR ends_at > now)
AND scope matches request
```

## 7.4 Scope Match

对给定 request context：

- Global 总是匹配；
- Region 仅在 region code 对应时匹配；
- Client 仅在 platform 对应时匹配；
- Region+Client 两者都对应时匹配。

请求不提供 region 时，不返回 region-scoped；不提供 client 时，不返回 client-scoped。

## 7.5 Sort

```text
starts_at DESC
created_at DESC
public_id ASC
```

无 priority。

## 7.6 Language

```text
locale/language field = NOT SUPPORTED BY FROZEN DB
locale filtering = NOT SUPPORTED IN V1
```

`title/content` 就是当前公告 canonical content。

如果未来需要多语言，必须先正式设计，不允许在 V1 API 假装已有 locale contract。

## 7.7 Announcement vs Notification

Platform Announcement 只提供可查询广播内容。

明确不承担：

```text
push
email
SMS
chat system message
per-user delivery
read/unread
inbox
campaign
```

---

# 8. Region Contract

## 8.1 Public DTO

```ts
export type PlatformRegionStatus = 'active' | 'inactive' | 'retired';

export type PlatformRegion = Readonly<{
  code: string;
  name: string;
  defaultLocale: string;
  timezone: string;
  status: PlatformRegionStatus;
}>;
```

## 8.2 Stable Identity

```text
stable identity = code
internal identity = BIGINT id (Platform only)
```

code immutable, non-reusable。

## 8.3 `GetRegion`

按 code 返回任何 lifecycle 状态的 Region；不存在返回 null。

这样 owner/consumer 可以区分：

```text
unknown
inactive
retired
```

而不是把所有非 active 都折叠为 not found。

## 8.4 `ListActiveRegions`

只返回 `status=active`，固定按：

```text
code ASC
```

Region 表很小，不要求额外排序字段。

## 8.5 Logical Validation for Identity

Identity `basic_profiles.region_code` 不建 FK，不在 Platform 内写入。

消费规则：

```text
Profile 保存历史 logical value
Current product availability 在使用时验证 Platform Region status
```

客户端新增/修改 Region 选择时，应使用 Platform active region list 限制候选值；但这不是数据库 FK 语义。

---

# 9. Public Module Contract

最终建议目录：

```text
apps/backend/src/modules/platform/public/
├── feature-evaluator.ts
├── runtime-config-reader.ts
├── region-reader.ts
├── app-version-reader.ts      // 仅内部确有 backend consumer 时
└── index.ts
```

稳定 public contract 至少冻结：

```ts
PlatformFeatureEvaluator
PlatformRuntimeConfigReader
PlatformRegionReader
```

其中：

```ts
export interface PlatformRegionReader {
  getRegion(code: string): Promise<PlatformRegion | null>;
  listActiveRegions(): Promise<readonly PlatformRegion[]>;
  isRegionActive(code: string): Promise<boolean>;
}
```

App Version / Announcement 主要面向 HTTP client，不要求其他 Backend Domain 依赖它们；如果没有真实内部 consumer，V1 不为了“完整”强行暴露 public service。

## 9.1 Public Boundary 禁止项

`modules/platform/public` 永远不能 export：

```text
repositories
repository factories
DatabaseExecutor
TransactionManager
pg Pool/Client
DB row types
internal BIGINT IDs
SQL
HTTP request/response types
admin commands
```

public contract 是业务语义，不是内部实现逃生通道。

---

# 10. Error Contract

Platform 稳定错误建议至少：

```text
PLATFORM_INVALID_ARGUMENT
PLATFORM_CONFLICT
PLATFORM_NOT_FOUND
FEATURE_FLAG_RETIRED
FEATURE_FLAG_INVALID_SCOPE
RUNTIME_CONFIG_KEY_UNREGISTERED
RUNTIME_CONFIG_UNAVAILABLE
RUNTIME_CONFIG_INVALID_VALUE
RUNTIME_CONFIG_RETIRED
APP_VERSION_MISMATCH
APP_VERSION_POLICY_UNAVAILABLE
APP_VERSION_INVALID_TRANSITION
ANNOUNCEMENT_INVALID_TRANSITION
REGION_INVALID
REGION_RETIRED
```

HTTP 层继续使用 Foundation Error Envelope；public module 可使用稳定 application/domain error，而非泄漏 PostgreSQL code。

---

# 11. Contract Audit Checklist

```text
Arbitrary config key access = 0
Raw JSON without schema = 0
Client server-only config exposure = 0
SemVer ambiguity = 0
Store URL invented from DB = 0
Announcement locale invention = 0
Announcement priority invention = 0
User Feature Flag scope invention = 0
Internal BIGINT exposure = 0
Repository exposure = 0
Cross-domain physical FK = 0
```

本文到此停止，不进入实现。
