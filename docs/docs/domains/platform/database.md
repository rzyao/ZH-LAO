---
status: frozen
last_updated: 2026-08-30
revision: "2026-08-30 设计 Platform Domain 会话定稿：6 张表字段级定稿 + 全域审计最终修正版"
schema: platform
source_share_url: https://chatgpt.com/share/6a9351eb-de4c-83e9-80fe-18dba4fd6eda
---

# Platform 数据库总览

Platform Domain 的业务表最终固定为 **6 张**，不增加、不替换：

1. `platform.feature_flags`
2. `platform.feature_flag_overrides`
3. `platform.runtime_configs`
4. `platform.app_versions`
5. `platform.announcements`
6. `platform.regions`

以下能力虽然与平台运行有关，但**不计入这 6 张业务表**：`system_outbox_events`、Media / Asset Infrastructure、技术审计日志、消息投递基础设施、存储基础设施（见[平台域与基础设施边界](#platform-domain-与-platform-infrastructure-边界)）。

本页以会话的「全域审计最终修正版」为权威基线；若与早期逐表定稿表述存在差异，以修正版为准。

## 与全局 PostgreSQL 规范的关系

- 内部主键统一 `BIGINT GENERATED ALWAYS AS IDENTITY`（全局规范允许各域自定，Platform 选择 BIGINT）。
- 状态一律 `VARCHAR(16) + CHECK`，不使用 PostgreSQL ENUM。
- 时间一律 `TIMESTAMPTZ`，默认 `created_at` / `updated_at`；`updated_at` 自动刷新沿用全项目统一机制，不为 Platform 单独发明 trigger。
- 域内建真实 FK（`ON DELETE RESTRICT`）；**其他业务 Domain 不建立指向 `platform.*` 的跨域 FK**（含 `platform.regions`，见第 6 节）。
- `public_id` 仅用于对外暴露的实体：Platform 内只有 `announcements.public_id UUID`。
- 删除策略按表分类（见[统一删除策略](#统一删除策略)），不机械添加 `deleted_at`。
- 不机械添加 `created_by` / `updated_by` / `metadata` / `extra` / `remark`：后台操作者信息由 Operations 域承担（PL-13）。

## 1. `platform.feature_flags`

### 职责

定义 Feature Flag 本身、默认启用状态以及生命周期：

> 这个功能开关是什么？默认是什么？这个 Flag 当前是否还参与求值？

不保存地区、客户端、用户、时间、灰度百分比或其他匹配条件——“在某种条件下……”一律属于 `feature_flag_overrides`。

### 最终字段（8 个）

| 字段 | 类型 | NULL | 默认值 | 说明 |
| --- | --- | ---: | --- | --- |
| `id` | `BIGINT GENERATED ALWAYS AS IDENTITY` | NO | — | 内部主键 |
| `key` | `VARCHAR(100)` | NO | — | 程序使用的稳定唯一标识 |
| `name` | `VARCHAR(120)` | NO | — | 后台可读名称 |
| `description` | `TEXT` | YES | — | Flag 用途说明 |
| `default_enabled` | `BOOLEAN` | NO | `FALSE` | 未命中 override 时的默认值（fallback） |
| `status` | `VARCHAR(16)` | NO | `'active'` | Flag 生命周期 / 总开关状态 |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | 创建时间 |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | 最后更新时间 |

明确不增加：`public_id`、`deleted_at`、`created_by`、`updated_by`、`region_id`、`client_platform`、`user_id`、`starts_at`、`ends_at`、`rollout_percentage`、`conditions`、`rules`、`config`、`metadata`。

### `key` 规则

`lower_snake_case`，`^[a-z][a-z0-9_]{0,99}$`：小写字母开头，只含 `a-z / 0-9 / _`，不允许空格、`-`、大小写混用、中文。**Flag 一旦进入代码使用，`key` 不允许修改**（视为 API identifier）；`name` / `description` 可修改。`retired` 后 key 永久保留，不得删除记录释放 key 复用（新功能用 `xxx_v2` 或新 key）。

### Status 与求值语义

固定三态：`active` / `inactive` / `retired`。不增加 `draft` / `enabled` / `disabled` / `deleted` / `archived` / `expired`。

- `active`：正常参与求值（先看 override，再看 `default_enabled`）。
- `inactive`：临时总关闭（**master kill switch**）——无论 `default_enabled` 与 override 是什么，求值结果强制 `false`；紧急事故时只需 `status = inactive` 即可整体关闭，不必逐项清理 override。可恢复：`inactive → active`。
- `retired`：永久退出产品，求值强制 `false`，**不允许重新启用**（`retired → active/inactive` 禁止，由 Platform Domain Service 强约束，数据库 CHECK 无法可靠约束转移历史）。

状态与 `default_enabled` 一致性（全域审计修正）：本表没有额外 `enabled` 字段，`inactive` / `retired` 时 `default_enabled` 必须为 `FALSE`：

```sql
CHECK (status = 'active' OR default_enabled = FALSE)
```

即使历史 override 仍有 `enabled = true`，只要 Flag 为 `inactive` / `retired`，最终结果仍必须为 `false`。

不使用 `is_enabled + default_enabled` 双布尔——语义不明；`status + default_enabled` 组合明确：

| status | default_enabled | 结果 |
| --- | ---: | --- |
| `active` | `true` | 默认 true，可被 override |
| `active` | `false` | 默认 false，可被 override |
| `inactive` | 任意（须为 false） | 强制 false |
| `retired` | 任意（须为 false） | 强制 false |

### Feature Flag 求值规则（冻结）

```text
feature_flag.status != active  → false

feature_flag.status = active
        ↓
region + client_platform override
        ↓ 未命中
region override
        ↓ 未命中
client_platform override
        ↓ 未命中
feature_flags.default_enabled
```

优先级：① `feature_flags.status`；② `feature_flag_overrides`（region+client > region > client）；③ `feature_flags.default_enabled`。此模型不再改变。

### 约束

- **FK**：无。本表是 Feature Flag 聚合根；关系方向为 `feature_flag_overrides.feature_flag_id → feature_flags.id`，不反向。
- **UNIQUE**：只有 `UNIQUE (key)`。`name` 不 UNIQUE（后台显示名可重复，如 `social_discovery` 与 `social_discovery_v2` 同名）。
- **CHECK**：`key` 格式、`btrim(name) <> ''`、`status` 枚举、状态一致性（见上）。不对 `description` 做长度约束。
- **INDEX**：只有 PK 与 UNIQUE(key)。不建 `status` / `default_enabled` / `name` / 时间索引——Flag 表规模小（几十到几百条），低基数字段建索引属过度设计。
- **不允许 JSONB**（`conditions` / `config` / `rules` / `targets` 一律禁止）：Feature Flag 定义必须保持完全关系化，否则 Platform 会退化成无类型、无 FK、无约束的规则引擎。

### 删除策略

状态化退役实体。正式进入使用后的 Flag **不得物理 DELETE**；永久下线 = `status = retired` + `default_enabled = false`。正常业务流程不通过 DELETE 删除。

### DDL

```sql
CREATE TABLE platform.feature_flags (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    key VARCHAR(100) NOT NULL,
    name VARCHAR(120) NOT NULL,
    description TEXT,

    default_enabled BOOLEAN NOT NULL DEFAULT FALSE,

    status VARCHAR(16) NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_feature_flags_key
        UNIQUE (key),

    CONSTRAINT ck_feature_flags_key_format
        CHECK (key ~ '^[a-z][a-z0-9_]{0,99}$'),

    CONSTRAINT ck_feature_flags_name_not_blank
        CHECK (btrim(name) <> ''),

    CONSTRAINT ck_feature_flags_status
        CHECK (status IN ('active', 'inactive', 'retired')),

    CONSTRAINT ck_feature_flags_status_default_enabled
        CHECK (status = 'active' OR default_enabled = FALSE)
);
```

## 2. `platform.feature_flag_overrides`

### 职责

表达 Feature Flag **当前有效**的范围覆盖关系：某个 Feature Flag 在特定地区 / 客户端范围内，是否覆盖默认值。

V1 只支持三种 scope：`region`、`client_platform`、`region + client_platform`。明确不支持：Global Override、User Override、User Segment、Percentage rollout、App Version expression、JSON conditions、时间规则（`starts_at` / `ends_at`）。全局默认行为永远来自 `feature_flags.default_enabled`——**V1 禁止 Global Override**，否则会出现两个全局真相并产生优先级歧义；需要改默认值直接更新 `default_enabled`，需要无条件紧急关闭用 `status = inactive`。

### 最终字段（7 个）

| 字段 | 类型 | NULL | 说明 |
| --- | --- | ---: | --- |
| `id` | `BIGINT GENERATED ALWAYS AS IDENTITY` | NO | PK |
| `feature_flag_id` | `BIGINT` | NO | Feature Flag |
| `region_id` | `BIGINT` | YES | 地区范围 |
| `client_platform` | `VARCHAR(16)` | YES | 客户端范围 |
| `enabled` | `BOOLEAN` | NO | 覆盖后的结果 |
| `created_at` | `TIMESTAMPTZ` | NO | 创建时间 |
| `updated_at` | `TIMESTAMPTZ` | NO | 更新时间 |

**没有 `status` / `deleted_at`**：Override 不是业务实体，行存在即规则有效，不需要就 DELETE（Operations 保留操作审计）。`inactive` Flag 可保留 Override 以便未来重新启用；`retired` Flag 的 Override 可清理，且不允许为 `retired` Flag 新建 Override。

### 约束

- **FK（域内，真实建立）**：`feature_flag_id → platform.feature_flags(id)`、`region_id → platform.regions(id)`，均 `ON DELETE RESTRICT`（两表均不物理删除）。
- **Scope CHECK**：禁止 Global Override：`CHECK (region_id IS NOT NULL OR client_platform IS NOT NULL)`。
- **Client Platform CHECK**：V1 仅 `android` / `ios`（`client_platform IS NULL OR client_platform IN ('android','ios')`）。不为 web / desktop / mini_program 提前加值；未来真有新客户端再统一 migration 三处 CHECK（overrides / app_versions / announcements）。
- **Partial UNIQUE ×3**：普通 `UNIQUE(feature_flag_id, region_id, client_platform)` 因 PostgreSQL 对 NULL 的处理不能满足唯一性语义，固定使用三个 partial unique index：

```sql
CREATE UNIQUE INDEX uq_feature_flag_overrides_region
ON platform.feature_flag_overrides (feature_flag_id, region_id)
WHERE region_id IS NOT NULL AND client_platform IS NULL;

CREATE UNIQUE INDEX uq_feature_flag_overrides_client
ON platform.feature_flag_overrides (feature_flag_id, client_platform)
WHERE region_id IS NULL AND client_platform IS NOT NULL;

CREATE UNIQUE INDEX uq_feature_flag_overrides_region_client
ON platform.feature_flag_overrides (feature_flag_id, region_id, client_platform)
WHERE region_id IS NOT NULL AND client_platform IS NOT NULL;
```

- **辅助 INDEX**：`feature_flag_id` 已是三个 partial unique index 首列，不再重复；仅为 region 反查加：

```sql
CREATE INDEX idx_feature_flag_overrides_region_id
ON platform.feature_flag_overrides (region_id)
WHERE region_id IS NOT NULL;
```

### Override 冲突优先级（冻结）

同时命中多条时：① `region + client_platform`（最具体）→ ② `region`（承担产品开放范围）→ ③ `client_platform`（通用兼容性覆盖）→ ④ `feature_flags.default_enabled`。前提始终是 `feature_flags.status = active`，否则直接 `false`。

### 删除策略

Current State Relation：取消某项 Override 时 `DELETE` 是正确行为，不加 `status` / `deleted_at` / `retired_at`；谁删除了 Override 由 Operations 审计记录，本表不保存历史版本。

### DDL

```sql
CREATE TABLE platform.feature_flag_overrides (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    feature_flag_id BIGINT NOT NULL,
    region_id BIGINT,
    client_platform VARCHAR(16),

    enabled BOOLEAN NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_feature_flag_overrides_flag
        FOREIGN KEY (feature_flag_id)
        REFERENCES platform.feature_flags(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_feature_flag_overrides_region
        FOREIGN KEY (region_id)
        REFERENCES platform.regions(id)
        ON DELETE RESTRICT,

    CONSTRAINT ck_feature_flag_overrides_scope
        CHECK (region_id IS NOT NULL OR client_platform IS NOT NULL),

    CONSTRAINT ck_feature_flag_overrides_client_platform
        CHECK (client_platform IS NULL
               OR client_platform IN ('android', 'ios'))
);
```

## 3. `platform.runtime_configs`

### 职责与最终裁决

> 保存真正属于整个产品运行层、不能明确归属某个业务 Domain 的动态参数。

可以放：`default_locale`、`support_email`、`maintenance_notice_url` 等。不能放：`gift_price`、`reward_amount`、`daily_match_limit`、`report_threshold`、`message_limit`、`refund_days`——这些都有明确领域 owner，必须回各自 Domain（PL-02）。**宁愿少用 `runtime_configs`，也不要为了“可配置”而把业务规则迁到 Platform。**

**V1 能力边界正式冻结：只负责 Current State Config。** 当前数据库没有 configuration version / revision number / immutable version record / publication record / release pointer / rollback target / version parent / config snapshot，因此文档不得宣称支持完整配置版本历史、发布版本、任意历史版本查询、rollback、version restore。Operations Audit 能记录“某配置从 A 改成 B”，但那只是操作审计，不等于配置版本模型，也不能保证可靠 rollback；未来真需要版本化必须单独设计正式版本模型。

### 最终字段（8 个）

| 字段 | 类型 | NULL | 默认值 | 说明 |
| --- | --- | ---: | --- | --- |
| `id` | `BIGINT GENERATED ALWAYS AS IDENTITY` | NO | — | PK |
| `key` | `VARCHAR(100)` | NO | — | 稳定配置 key |
| `value_type` | `VARCHAR(16)` | NO | — | 数据类型 |
| `value` | `JSONB` | NO | — | 配置值 |
| `description` | `TEXT` | YES | — | 用途说明 |
| `status` | `VARCHAR(16)` | NO | `'active'` | 生命周期 |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | 创建 |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | 更新 |

### 为什么允许 JSONB 以及类型一致性

这里是全局原则中少数真正适合 JSONB 的“动态结构数据”，但 `JSONB ≠ 任意 metadata`，必须由 `value_type` 限制实际类型：`string` / `integer` / `number` / `boolean` / `json`，其中 `json` 只允许 object / array（不允许拿 `json` 包装任意 scalar）。

### Status

固定 `active` / `retired`，**不设 `inactive`**：Runtime Config 没有 Feature Flag 那样“关闭后返回 false”的语义；配置“暂时不生效”通常意味着应改值、应用 Feature Flag 控制、或本就属于其他 Domain。`retired` = 该 key 永久停止使用，key 不复用，不物理删除。

### 敏感数据禁止

永远不能存：password、access token、API secret、private key、JWT signing secret、database credential、payment credential。**Platform Config 不是 Secret Manager。**

### 约束

- **FK**：无。
- **UNIQUE**：`UNIQUE (key)`；key 进入正式使用后不可修改、不可复用。
- **CHECK**：key 格式（同 feature_flags）；`value_type` 枚举；`status IN ('active','retired')`；JSONB 类型一致性：

```sql
CHECK (
       (value_type = 'string'  AND jsonb_typeof(value) = 'string')
    OR (value_type = 'integer' AND jsonb_typeof(value) = 'number'
        AND (value #>> '{}') ~ '^-?[0-9]+$')
    OR (value_type = 'number'  AND jsonb_typeof(value) = 'number')
    OR (value_type = 'boolean' AND jsonb_typeof(value) = 'boolean')
    OR (value_type = 'json'    AND jsonb_typeof(value) IN ('object', 'array'))
)
```

- **INDEX**：只有 PK 与 UNIQUE(key)。不建 `status` / `value_type` / GIN(`value`)——如果开始需要在 JSON 里大量搜索业务数据，基本说明这张表被滥用了。

### 删除策略

状态化退役：已正式使用的 Config 不通过 DELETE 释放 key；永久取消 `status = retired`，最后一个配置值可继续保留以理解该配置最终状态。

### DDL

```sql
CREATE TABLE platform.runtime_configs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    key VARCHAR(100) NOT NULL,
    value_type VARCHAR(16) NOT NULL,
    value JSONB NOT NULL,

    description TEXT,

    status VARCHAR(16) NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_runtime_configs_key
        UNIQUE (key),

    CONSTRAINT ck_runtime_configs_key_format
        CHECK (key ~ '^[a-z][a-z0-9_]{0,99}$'),

    CONSTRAINT ck_runtime_configs_value_type
        CHECK (value_type IN ('string', 'integer', 'number', 'boolean', 'json')),

    CONSTRAINT ck_runtime_configs_status
        CHECK (status IN ('active', 'retired')),

    CONSTRAINT ck_runtime_configs_value_matches_type
        CHECK (
               (value_type = 'string'  AND jsonb_typeof(value) = 'string')
            OR (value_type = 'integer' AND jsonb_typeof(value) = 'number'
                AND (value #>> '{}') ~ '^-?[0-9]+$')
            OR (value_type = 'number'  AND jsonb_typeof(value) = 'number')
            OR (value_type = 'boolean' AND jsonb_typeof(value) = 'boolean')
            OR (value_type = 'json'    AND jsonb_typeof(value) IN ('object', 'array'))
        )
);
```

## 4. `platform.app_versions`

### 职责

回答：当前客户端 build 是什么生命周期状态，以及用户是否需要升级。不负责 APK / IPA 文件、CDN、发布流水线、应用商店部署（属部署/基础设施，不应数据库业务化）。

### 最终字段（10 个）

| 字段 | 类型 | NULL | 默认值 | 说明 |
| --- | --- | ---: | --- | --- |
| `id` | `BIGINT GENERATED ALWAYS AS IDENTITY` | NO | — | PK |
| `client_platform` | `VARCHAR(16)` | NO | — | `android` / `ios` |
| `version` | `VARCHAR(32)` | NO | — | 用户可见的营销版本 |
| `build_number` | `BIGINT` | NO | — | 客户端内部 build |
| `status` | `VARCHAR(16)` | NO | `'draft'` | 生命周期 |
| `update_policy` | `VARCHAR(16)` | NO | `'none'` | 升级策略 |
| `release_notes` | `TEXT` | YES | — | 版本说明 |
| `released_at` | `TIMESTAMPTZ` | YES | — | 正式发布时间 |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | 创建 |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | 更新 |

不使用 `is_supported` / `is_update_required` 两个易产生矛盾的布尔值，改用 `status` + `update_policy`。

### Status × Update Policy

- `status`：`draft`（未发布）/ `active`（正常受支持）/ `deprecated`（可用但进入淘汰）/ `blocked`（不允许继续使用）。
- `update_policy`：`none` / `optional` / `required`。

合法组合（CHECK 强制，杜绝 `blocked + none`、`draft + required`、`deprecated + none` 等矛盾数据）：

| status | update_policy | 客户端语义 |
| --- | --- | --- |
| `draft` | `none` | 未发布 |
| `active` | `none` / `optional` | 正常运行；可提示已有新版 |
| `deprecated` | `optional` | 仍允许进入，强烈建议升级 |
| `blocked` | `required` | 禁止继续，必须升级 |

状态转移由应用层保证：`draft → active → deprecated → blocked`，允许 `active → blocked` 紧急封锁；V1 视 `blocked` 为终态（`blocked → active` 需显式设计“解除封锁”业务动作）。

### 约束

- **FK**：无。
- **UNIQUE**：`UNIQUE (client_platform, build_number)`。不用 `(client_platform, version)`——同一营销版本可有多个构建（2.3.0 / build 23001 与 23002）。
- **CHECK**：`client_platform IN ('android','ios')`；`btrim(version) <> ''`（不强制 SemVer，`1.2` / `1.2.3-beta` / `2026.08` 等发布策略都可能合理）；`build_number > 0`；status 与 update_policy 枚举及合法组合；`released_at` 与状态一致（`draft → released_at IS NULL`；其他状态 `released_at IS NOT NULL`）。
- **INDEX**：PK 与 UNIQUE(client_platform, build_number)。版本表很小，不加 status / time 索引。

### 删除策略

从未发布、从未进入客户端判断逻辑的误建 `draft` 允许 DELETE；只要曾进入 `active` / `deprecated` / `blocked` 即属发布历史，**保留记录不物理删除**（Released App Version = historical record）。

### DDL

```sql
CREATE TABLE platform.app_versions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    client_platform VARCHAR(16) NOT NULL,

    version VARCHAR(32) NOT NULL,
    build_number BIGINT NOT NULL,

    status VARCHAR(16) NOT NULL DEFAULT 'draft',
    update_policy VARCHAR(16) NOT NULL DEFAULT 'none',

    release_notes TEXT,
    released_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_app_versions_platform_build
        UNIQUE (client_platform, build_number),

    CONSTRAINT ck_app_versions_client_platform
        CHECK (client_platform IN ('android', 'ios')),

    CONSTRAINT ck_app_versions_version_not_blank
        CHECK (btrim(version) <> ''),

    CONSTRAINT ck_app_versions_build_number
        CHECK (build_number > 0),

    CONSTRAINT ck_app_versions_status
        CHECK (status IN ('draft', 'active', 'deprecated', 'blocked')),

    CONSTRAINT ck_app_versions_update_policy
        CHECK (update_policy IN ('none', 'optional', 'required')),

    CONSTRAINT ck_app_versions_status_policy
        CHECK (
               (status = 'draft' AND update_policy = 'none')
            OR (status = 'active' AND update_policy IN ('none', 'optional'))
            OR (status = 'deprecated' AND update_policy = 'optional')
            OR (status = 'blocked' AND update_policy = 'required')
        ),

    CONSTRAINT ck_app_versions_released_at
        CHECK (
               (status = 'draft' AND released_at IS NULL)
            OR (status <> 'draft' AND released_at IS NOT NULL)
        )
);
```

## 5. `platform.announcements`

### 职责

保存平台级公告及其当前展示生命周期：系统维护、功能上线、服务异常通知、平台政策更新、地区服务通知等。支持范围：Global / Region / Client Platform / Region + Client Platform（两个 scope 字段均 NULL = 全平台公告，与 Feature Flag 不同，这里合法）。

不承担：Push Delivery、Chat System Message、Marketing Campaign、User Inbox、运营私信、用户已读状态。

### 最终字段（11 个）

| 字段 | 类型 | NULL | 默认值 | 说明 |
| --- | --- | ---: | --- | --- |
| `id` | `BIGINT GENERATED ALWAYS AS IDENTITY` | NO | — | 内部 PK |
| `public_id` | `UUID` | NO | `gen_random_uuid()` | 对外 ID |
| `title` | `VARCHAR(200)` | NO | — | 标题 |
| `content` | `TEXT` | NO | — | 正文 |
| `region_id` | `BIGINT` | YES | — | 地区范围 |
| `client_platform` | `VARCHAR(16)` | YES | — | 客户端范围 |
| `status` | `VARCHAR(16)` | NO | `'draft'` | 生命周期 |
| `starts_at` | `TIMESTAMPTZ` | YES | — | 开始展示 |
| `ends_at` | `TIMESTAMPTZ` | YES | — | 结束展示 |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | 创建 |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | 更新 |

### Status

`draft`（未发布）/ `published`（已发布）/ `retired`（人工终止或历史归档）。**不增加 `scheduled` / `expired`**：`published + starts_at > now()` 天然是 Scheduled，`ends_at <= now()` 天然是 Expired——状态机不重复存储可计算的事实。

当前可展示规则：

```text
status = 'published'
AND starts_at <= now()
AND (ends_at IS NULL OR ends_at > now())
```

提前下线用 `status = retired` 或 `ends_at`。

### 约束

- **FK**：`region_id → platform.regions(id)`，`ON DELETE RESTRICT`（域内真实 FK）。
- **UNIQUE**：`UNIQUE (public_id)`；标题不唯一（同名公告合理）。
- **CHECK**：`btrim(title) <> ''`；`btrim(content) <> ''`；`client_platform IS NULL OR IN ('android','ios')`；status 枚举；时间窗口 `ends_at IS NULL OR (starts_at IS NOT NULL AND ends_at > starts_at)`；`published` 必须有 `starts_at`（`status <> 'published' OR starts_at IS NOT NULL`）。
- **INDEX**：公告是 Platform 中唯一值得单独建读取索引的表：

```sql
CREATE INDEX idx_announcements_published_starts_at
ON platform.announcements (starts_at DESC)
WHERE status = 'published';

CREATE INDEX idx_announcements_region_id
ON platform.announcements (region_id)
WHERE region_id IS NOT NULL;
```

第一阶段规模不大，不再为 `client_platform` / `ends_at` 分别堆索引。

### 删除策略

从未发布的草稿允许 DELETE；只要曾经发布，原则上**不得物理删除**（Published Announcement 属历史记录），停止展示用 `ends_at` 或 `status = retired`。

### DDL

```sql
CREATE TABLE platform.announcements (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    public_id UUID NOT NULL DEFAULT gen_random_uuid(),

    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,

    region_id BIGINT,
    client_platform VARCHAR(16),

    status VARCHAR(16) NOT NULL DEFAULT 'draft',

    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_announcements_public_id
        UNIQUE (public_id),

    CONSTRAINT fk_announcements_region
        FOREIGN KEY (region_id)
        REFERENCES platform.regions(id)
        ON DELETE RESTRICT,

    CONSTRAINT ck_announcements_title_not_blank
        CHECK (btrim(title) <> ''),

    CONSTRAINT ck_announcements_content_not_blank
        CHECK (btrim(content) <> ''),

    CONSTRAINT ck_announcements_client_platform
        CHECK (client_platform IS NULL
               OR client_platform IN ('android', 'ios')),

    CONSTRAINT ck_announcements_status
        CHECK (status IN ('draft', 'published', 'retired')),

    CONSTRAINT ck_announcements_time_window
        CHECK (
            ends_at IS NULL
            OR (starts_at IS NOT NULL AND ends_at > starts_at)
        ),

    CONSTRAINT ck_announcements_published_start
        CHECK (status <> 'published' OR starts_at IS NOT NULL)
);

CREATE INDEX idx_announcements_published_starts_at
ON platform.announcements (starts_at DESC)
WHERE status = 'published';

CREATE INDEX idx_announcements_region_id
ON platform.announcements (region_id)
WHERE region_id IS NOT NULL;
```

## 6. `platform.regions`

### 职责

定义 Platform 自己的**产品运营区域 / 市场**（第一阶段 `CN`、`LA`）。它不是世界国家数据库、行政区划库、用户地址库、IP 地理定位库或通用跨域 Geography Domain；第一阶段不扩展 countries / provinces / cities / districts / streets。

### 最终字段（8 个）

| 字段 | 类型 | NULL | 默认值 | 说明 |
| --- | --- | ---: | --- | --- |
| `id` | `BIGINT GENERATED ALWAYS AS IDENTITY` | NO | — | PK |
| `code` | `VARCHAR(8)` | NO | — | 稳定地区代码 |
| `name` | `VARCHAR(100)` | NO | — | 内部可读名称 |
| `default_locale` | `VARCHAR(16)` | NO | — | 默认语言环境（如 `zh-CN` / `lo-LA`） |
| `timezone` | `VARCHAR(64)` | NO | — | 默认 IANA timezone（如 `Asia/Shanghai` / `Asia/Vientiane`） |
| `status` | `VARCHAR(16)` | NO | `'active'` | 生命周期 |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | 创建 |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | 更新 |

`code` 大写、稳定、不复用；允许产品自定义地区代码（不强制 `CHAR(2)`），格式 `^[A-Z][A-Z0-9_]{1,7}$`（`CN` / `LA` / `HK` / `SEA` 均可），不滥用为行政区域。`default_locale` 只是“没有更明确用户语言设置时的平台默认值”，不是用户语言偏好（用户自己的 locale 归 Identity/Profile）。`timezone` 只约束非空，IANA 合法性由应用层验证，数据库不维护 IANA 枚举。`name` 是否存多语言文本待 Localization 设计（`designing`）。

### Status

`active`（正常支持）/ `inactive`（暂停新功能或服务，保留历史引用）/ `retired`（永久退出，终态）。

### 约束

- **FK**：本表自身无 FK；Platform 域内 `feature_flag_overrides.region_id` 与 `announcements.region_id` 建真实 FK 指向本表。
- **跨域边界（全域审计冻结）**：其他业务 Domain **不因 `country` / `region` 字段建立数据库 FK 到 `platform.regions`**。跨域如需 Region 语义，只使用稳定逻辑标识——V1 直接存 `region_code`（如 `'LA'`，即 `platform.regions.code`）；未来引入稳定 Region UUID 后跨域可存 UUID 逻辑引用，但仍不强制数据库 FK。
- **UNIQUE**：`UNIQUE (code)`；`name` 不 UNIQUE（真正 identity 是 code）。
- **CHECK**：code 格式；`btrim(name) <> ''`；`btrim(default_locale) <> ''`；`btrim(timezone) <> ''`；status 枚举。
- **INDEX**：PK 与 UNIQUE(code)。Regions 表永远很小，不建 status / locale / timezone 索引。

### 删除策略

状态化退役：已正式使用的 Region 不物理 DELETE；临时停止 `status = inactive`，永久退出 `status = retired`；`code` 不复用。

### DDL

```sql
CREATE TABLE platform.regions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    code VARCHAR(8) NOT NULL,
    name VARCHAR(100) NOT NULL,

    default_locale VARCHAR(16) NOT NULL,
    timezone VARCHAR(64) NOT NULL,

    status VARCHAR(16) NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_regions_code
        UNIQUE (code),

    CONSTRAINT ck_regions_code_format
        CHECK (code ~ '^[A-Z][A-Z0-9_]{1,7}$'),

    CONSTRAINT ck_regions_name_not_blank
        CHECK (btrim(name) <> ''),

    CONSTRAINT ck_regions_default_locale_not_blank
        CHECK (btrim(default_locale) <> ''),

    CONSTRAINT ck_regions_timezone_not_blank
        CHECK (btrim(timezone) <> ''),

    CONSTRAINT ck_regions_status
        CHECK (status IN ('active', 'inactive', 'retired'))
);
```

## FK 总图

```text
platform.regions
      ↑
      ├──────── feature_flag_overrides.region_id
      └──────── announcements.region_id

platform.feature_flags
      ↑
      └──────── feature_flag_overrides.feature_flag_id
```

`runtime_configs`、`app_versions`、`regions` 不依赖任何其他表。Platform 六表不建立任何指向其他业务 Domain 的 FK（业务域引用 Platform 语义一律走逻辑标识）。

## 状态枚举汇总

| 表 | 字段 | 枚举 |
| --- | --- | --- |
| `feature_flags` | `status` | `active` / `inactive` / `retired` |
| `feature_flag_overrides` | — | 无 status |
| `runtime_configs` | `status` | `active` / `retired` |
| `app_versions` | `status` | `draft` / `active` / `deprecated` / `blocked` |
| `app_versions` | `update_policy` | `none` / `optional` / `required` |
| `announcements` | `status` | `draft` / `published` / `retired` |
| `regions` | `status` | `active` / `inactive` / `retired` |

Client Platform 全域统一：`android` / `ios`（涉及 `feature_flag_overrides`、`app_versions`、`announcements` 三处 CHECK；未来新增客户端统一 migration，不提前猜测）。

## 六表约束总表

| 表 | FK | UNIQUE | 主要 CHECK | 额外 INDEX |
| --- | --- | --- | --- | --- |
| `feature_flags` | 无 | `key` | key 格式 / name 非空 / status 枚举 / status 与 default_enabled 一致 | 无 |
| `feature_flag_overrides` | flag、region（RESTRICT） | Partial UNIQUE ×3 | scope 非全局 / client_platform 枚举 | `region_id` partial |
| `runtime_configs` | 无 | `key` | key 格式 / value_type / status / JSONB 类型一致 | 无 |
| `app_versions` | 无 | `(client_platform, build_number)` | platform / version / build / status / policy / 组合 / released_at | 无 |
| `announcements` | region（RESTRICT） | `public_id` | title / content / platform / status / 时间窗口 / published 须有 starts_at | published starts_at partial、region_id partial |
| `regions` | 无 | `code` | code 格式 / name / locale / timezone 非空 / status 枚举 | 无 |

**共 6 张表，52 个字段。**

## 统一删除策略

| 分类 | 表 | 策略 |
| --- | --- | --- |
| 状态化退役 | `feature_flags`、`runtime_configs`、`regions` | 正式使用后不物理 DELETE，分别用自身 `status` 退役；key / code 不复用 |
| 当前关系数据 | `feature_flag_overrides` | Current State Relation，取消即 `DELETE`，无软删除和历史状态 |
| 保留发布历史 | `app_versions`、`announcements` | 未发布 Draft 可删；一旦发布/生效原则上不物理删除，用生命周期状态和下线时间控制当前使用状态 |
| Infrastructure / Audit | outbox event、审计类 | append-oriented + retention / archive / compliance policy，不使用业务 `retired` 生命周期 |

## Platform Domain 与 Platform Infrastructure 边界

必须明确区分：

- **Platform Domain** 负责“产品当前应该如何运行”——即六张业务表，表达业务 / 产品运行状态。
- **Platform Infrastructure** 负责“软件系统如何可靠地执行、存储、发布和传递这些业务状态”——Transactional Outbox、Media / Asset 存储抽象、event publishing、技术重试、基础设施生命周期、存储元数据、技术 retention 等。

Infrastructure 不因为服务于整个产品就自动成为 Platform Domain 的业务表：`Platform Domain ≠ Platform Infrastructure`。

### `system_outbox_events`

- 归属：**Platform Infrastructure / Shared Technical Infrastructure**，明确不计入 Platform Domain 六张业务表（Platform 仍是严格 6 表，不是 7 张）。
- **统一 Outbox 原则**：整个 PostgreSQL 系统共用一套 Transactional Outbox，不设计 `social_outbox_events` / `chat_outbox_events` / `commerce_outbox_events` / `rewards_outbox_events` 等每域一套。各 Domain 在自己的业务事务中「业务状态变更 + 写入 `system_outbox_events`」保持同一数据库事务，由统一 Outbox Publisher 读取 → 发布 → 标记已处理 → retry / retention。
- Event 自身携带来源识别信息（会话示例字段：`event_id`、`source_domain`、`event_type`、`aggregate_type`、`aggregate_id`、`payload`、`occurred_at`、`published_at` 及 retry / delivery metadata）；`source_domain` 区分 `social` / `chat` / `commerce` / `rewards` / `trust_safety` / `operations` / `platform` 等，但不因此拆表。物理字段定稿为 `designing`。
- 数据治理：技术事件数据，写入后 append-oriented，不得把历史事件当普通业务配置随意 UPDATE / DELETE；已发布数据按统一 retention policy 定期归档或清理，不使用 `retired` 生命周期。

### Media / Asset Infrastructure

- 归属：共享技术基础设施能力，**不是新的 Platform 业务子域，不增加第七张业务表**；它是 Social / Chat / Commerce / Learning 等域所用 `asset_id` 的最终 authoritative technical owner。
- 负责 Asset 的技术事实：`asset_id UUID`（业务域使用的稳定逻辑标识）；storage provider（S3 / Cloudflare R2 / OSS / 本地兼容对象存储，属基础设施实现）；storage location（`bucket`、`object_key`，必要时 storage region）；content metadata（`mime_type`、`size_bytes`、`checksum`、`width`、`height`、`duration` 等按媒体类型保存）；Asset 自身生命周期（如 uploading / available / deleted / purged，具体状态枚举在 Media Infrastructure 落地时单独定稿，`designing`）。
- 业务 Domain 只保存 `asset_id UUID`（社交资料照片、聊天图片消息、礼物图片、学习音频等），不重复保存 `storage_provider` / `bucket` / `object_key` / `storage_url` / 内部存储路径 / `checksum` / object metadata——否则更换 S3→R2、迁移 bucket、调整 CDN 时会迫使所有业务域同时改数据。
- Media Infrastructure 不拥有业务语义：Social Photo 排序、头像主图、消息发送状态、礼物商品语义、审核决定（“这张图是否通过安全审核”归 Trust & Safety，“是否用户头像”归 Social，“属于哪条消息”归 Chat）。不能因为所有业务都用文件就把业务关系迁入 Media Infrastructure。

## 最终架构冻结

```text
Platform Domain
│
├── platform.feature_flags
├── platform.feature_flag_overrides
├── platform.runtime_configs
├── platform.app_versions
├── platform.announcements
└── platform.regions

Platform / Shared Infrastructure（不计入六表）
│
├── system_outbox_events
│
└── Media / Asset Infrastructure
        └── asset_id UUID
```

## 最终不可违反规则

1. **PLATFORM-01** Platform Domain 永远保持当前六张业务表，除非未来有新的正式领域设计决策。
2. **PLATFORM-02** `feature_flags.key` 唯一、稳定、不复用；能明确找到业务 owner 的配置不得进入 `runtime_configs`（Business Rule ≠ Platform Config）。
3. **PLATFORM-03** `inactive` / `retired` Feature Flag 的 `default_enabled` 必须为 `false`，最终 effective result 必须为 `false`。
4. **PLATFORM-04** Feature Flag 已使用后不物理删除；`retired` 为终态。
5. **PLATFORM-05** Feature Flag Override 是 Current State，可以 DELETE。
6. **PLATFORM-06** Override 的 Flag / Region 属 Platform Domain 内部引用，继续使用真实 FK + `ON DELETE RESTRICT`。
7. **PLATFORM-07** `runtime_configs` V1 只有 Current State Config；不得宣称支持 versioning / publish versions / rollback，直到数据库存在真正的版本模型。
8. **PLATFORM-08** Runtime Config 进入正式使用后通过 `retired` 退役，key 不复用；不存密码、Token、Secret、Private Key。
9. **PLATFORM-09** App Version 一旦正式发布，保留发布历史，不物理删除；只描述客户端兼容与升级策略，不负责发布包和部署系统。
10. **PLATFORM-10** Announcement 一旦正式发布，原则上保留历史，通过 `retired` / `ends_at` 控制展示；只是平台广播内容，不拥有用户消息、Push、营销 Campaign、已读状态。
11. **PLATFORM-11** `platform.regions` 是 Platform 自己的产品运营区域定义，不是全系统 Geography Domain，不建 GIS / 行政区划。
12. **PLATFORM-12** 其他 Domain 不因 country / region 属性建立数据库 FK 到 `platform.regions`；跨域只使用稳定 logical code / UUID（V1 可直接使用 `region_code`）。
13. **PLATFORM-13** 后台 Operator 信息（`created_by` / `updated_by` / `published_by` / `disabled_by`）不写进 Platform；“谁进行了操作”由 Operations Domain 负责。
14. **PLATFORM-14** `system_outbox_events` 是统一共享技术基础设施，只有一套，不按 Domain 分表，不计入 Platform 六张业务表。
15. **PLATFORM-15** Media / Asset 是共享技术基础设施，是所有 `asset_id` 的 authoritative technical owner。
16. **PLATFORM-16** Social / Chat / Commerce / Learning 等 Domain 只保存 `asset_id UUID`，不得重复保存底层 storage provider / bucket / object key。
17. **PLATFORM-17** Feature Flag 不得代替领域状态机（产品能力是否开放 ≠ 某业务实体当前状态）；删除策略分类：状态化退役（flag/config/region）、当前关系可 DELETE（override）、保留历史（app version/published announcement）、append-oriented + retention（infrastructure event/audit）。

## `designing` 项（待后续定稿）

- Media / Asset Infrastructure 的物理表、字段与生命周期状态枚举（落地时单独定稿）。
- `system_outbox_events` 的物理字段、索引与 retention 参数（会话仅给出示例字段）。
- `regions.name` 是否数据库存多语言文本（结合 Localization 设计）。
- TTS 路由配置（如 `tts.zh.default_provider` 等）：按 PLATFORM-02 属 Learning 自有运营参数，不进入 `platform.runtime_configs`；具体落表随 Learning 运营参数设计。
