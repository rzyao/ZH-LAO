---
status: frozen
last_updated: 2026-08-30
schema: rewards
source: 设计奖励域
---

# Rewards 数据库 · 5 张表定稿

Rewards Schema V1 定稿为 **5 张核心业务表**。会话要求以本版为建表、仓储与实现基准；本轮讨论中出现过的早期版本与最终版冲突时，**一律以本版为准**。

```text
rewards.reward_programs
rewards.reward_rules
rewards.reward_events
rewards.reward_grants
rewards.reward_deliveries
```

完整链路：

```text
Source Domain
     │ trusted domain event（无跨域 FK，仅逻辑引用）
     ▼
reward_events → reward_rules → reward_programs
                reward_grants
                reward_deliveries
                Commerce（logical contract，无跨域 FK）
```

## 与全局 SQL 规范的关系

| 全局规范 | 本域执行情况 |
| --- | --- |
| 主键 `bigint generated always as identity` | 5 张表全部一致；`grant_no` 是 uuid 的**跨域稳定业务 ID**，不是主键 |
| 表名复数 | 5 张表均复数 |
| 时间 `timestamptz` | 一致 |
| 状态 `varchar + CHECK` | 一致，不使用 PostgreSQL ENUM |
| JSONB 只存动态配置 | `condition_config` / `limit_config` / `payload` 属真正动态数据 |
| 保留 FK | 域内 FK 保留（program_id/rule_id/event_id/grant_id） |
| **跨 Schema FK** | **本域不建任何跨域 FK**：`subject_user_id`、`user_id` 不指向 `identity.*`，`source_reference_id` 不指向 `learning/social/chat.*`，`target_reference_id` 不指向 `commerce.*`——一律为逻辑业务引用。这与 Commerce 会话「跨域不建 FK」的倾向一致，但全局跨域 FK 政策仍随台账 D-077/D-078 由主会话裁决，本域不因该裁决改动 | 
| `public_id` 策略 | 本域不叫 `public_id`，跨域稳定 ID 是 `grant_no uuid`；Commerce 记录 `source_domain=REWARDS` + `source_reference_id=grant_no` |
| Outbox | 不属本 5 张核心业务表；若 Rewards 未来发布 `REWARD_GRANTED/REWARD_DELIVERED`，可使用 `rewards.outbox_events`（基础设施表），项目级统一方式待所有域设计结束一并确定 |

## 1. `rewards.reward_programs`

奖励计划 / 活动容器。决定**计划生命周期**与**总体有效时间**，不直接决定单次奖励金额（金额在 reward_rules）。

| 字段 | 类型 | Null | 说明 |
| --- | --- | ---: | --- |
| `id` | `bigint generated always as identity` | NO | PK |
| `program_key` | `varchar(64)` | NO | 永久稳定业务 Key（如 `NEW_USER`、`DAILY_LEARNING`、`INVITE_USER`），名称可改名但 Key 不可改 |
| `name` | `varchar(120)` | NO | 名称 |
| `description` | `text` | YES | 描述 |
| `status` | `varchar(16)` | NO | 生命周期状态，默认 `DRAFT` |
| `starts_at` | `timestamptz` | YES | 开始时间 |
| `ends_at` | `timestamptz` | YES | 结束时间 |
| `created_at` | `timestamptz` | NO | 默认 `now()` |
| `updated_at` | `timestamptz` | NO | 默认 `now()` |

FK：无（Rewards 内顶层容器）。
UNIQUE：`UNIQUE(program_key)`。
CHECK：`status IN ('DRAFT','ACTIVE','PAUSED','ENDED','ARCHIVED')`；`ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at`。
INDEX：`CREATE INDEX idx_reward_programs_status ON rewards.reward_programs(status);`（配置表数据量小，不建大量时间索引）。

状态迁移与语义：

```text
DRAFT
  ▼
ACTIVE ◄───► PAUSED
  │            │
  └─────┬──────┘
        ▼
      ENDED
        ▼
    ARCHIVED
```

- `DRAFT`：未启用，可修改、可删除。
- `ACTIVE`：参与奖励判定；同时须满足 `starts_at <= now() AND ends_at > now()`（字段非空时）。
- `PAUSED`：临时停止产生新奖励；已产生 Grant 不受影响。
- `ENDED`：活动结束，不能回到 ACTIVE；**晚到 Event 若 `occurred_at` 落于历史有效窗口内，仍可按历史规则处理**。
- `ARCHIVED`：管理只读归档，不改变历史事实。

## 2. `rewards.reward_rules`

Rewards 最重要的配置表：什么 Event、在什么条件/限制下、奖励多少。支持版本化。

| 字段 | 类型 | Null | 说明 |
| --- | --- | ---: | --- |
| `id` | `bigint generated always as identity` | NO | PK |
| `program_id` | `bigint` | NO | FK → reward_programs.id |
| `rule_key` | `varchar(64)` | NO | 稳定逻辑规则 Key（如 `DAILY_FIRST_COMPLETION`） |
| `version` | `integer` | NO | 规则版本，默认 1，`> 0` |
| `name` | `varchar(120)` | NO | 名称 |
| `status` | `varchar(16)` | NO | 默认 `DRAFT` |
| `trigger_event_type` | `varchar(64)` | NO | 触发事件类型（对应 reward_events.event_type） |
| `reward_type` | `varchar(32)` | NO | 奖励资产类型，默认 `COIN` |
| `reward_amount` | `bigint` | NO | 奖励数量，`> 0` |
| `condition_config` | `jsonb` | NO | 事件条件，默认 `{}`（只针对 Event envelope + payload，禁止跨域查询条件） |
| `limit_config` | `jsonb` | NO | 次数/周期限制，默认 `{}`（如 `{"period":"DAY","max_grants":1}`） |
| `priority` | `integer` | NO | 判定顺序，默认 100，`>= 0` |
| `effective_from` | `timestamptz` | YES | 版本业务生效时间 |
| `effective_to` | `timestamptz` | YES | 版本业务失效时间 |
| `created_at` | `timestamptz` | NO | 默认 `now()` |
| `updated_at` | `timestamptz` | NO | 默认 `now()` |

FK：`FOREIGN KEY (program_id) REFERENCES rewards.reward_programs(id) ON DELETE RESTRICT`（域内强 FK 合法）。
UNIQUE：

```sql
UNIQUE (program_id, rule_key, version)
-- 同一逻辑规则同时最多一个当前版本（DRAFT 不参与）：
CREATE UNIQUE INDEX uq_reward_rules_current
ON rewards.reward_rules(program_id, rule_key)
WHERE status IN ('ACTIVE', 'PAUSED');
```

CHECK：

```sql
CHECK (status IN ('DRAFT','ACTIVE','PAUSED','RETIRED'))
CHECK (reward_type IN ('COIN'))                       -- V1 仅 COIN
CHECK (version > 0)
CHECK (reward_amount > 0)
CHECK (priority >= 0)
CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to > effective_from)
CHECK (status = 'DRAFT' OR effective_from IS NOT NULL)   -- 非 Draft 必须有业务开始时间
CHECK (status <> 'RETIRED' OR effective_to IS NOT NULL)  -- 退休版本形成闭合历史窗口
```

INDEX：

```sql
CREATE INDEX idx_reward_rules_program_status ON rewards.reward_rules(program_id, status);
CREATE INDEX idx_reward_rules_trigger ON rewards.reward_rules(trigger_event_type);
CREATE INDEX idx_reward_rules_trigger_window
ON rewards.reward_rules(trigger_event_type, effective_from, effective_to);
```

状态机：

```text
DRAFT
  ▼
ACTIVE ◄───► PAUSED
  │            │
  └─────┬──────┘
        ▼
     RETIRED（终态）
```

不建 `reward_counters` / `reward_user_counters`：限制统计直接查 reward_grants，性能问题出现后再建 projection/cache。

**Rule 版本规则（最终版）**
- Rule 一旦 ACTIVE，以下字段业务不可变：`trigger_event_type`、`reward_type`、`reward_amount`、`condition_config`、`limit_config`、`effective_from`；修改只能创建新 Version。
- 新版本生效时在同一 Rewards 本地事务中：旧版本 → `RETIRED` 且旧 `effective_to = 新 effective_from`；新版本 → `ACTIVE`。
- 同一 `(program_id, rule_key)` 不同版本的有效时间区间不允许重叠（V1 由 Application Service 在事务内保证，不引入 PostgreSQL GiST/EXCLUDE）。
- 已产生 Grant 的 Rule 历史版本不物理删除，Grant → Rule Version 永远可追溯。

## 3. `rewards.reward_events`

Rewards 的**入站边界表**：记录其他 Domain 已确认发生的、Rewards 可信任的业务事实。Rewards 不重新查询源域验证事实。

| 字段 | 类型 | Null | 说明 |
| --- | --- | ---: | --- |
| `id` | `bigint generated always as identity` | NO | PK |
| `source_domain` | `varchar(32)` | NO | 来源领域（如 `LEARNING`、`SOCIAL`、`IDENTITY`、`CHAT`、`COMMERCE`），仅为来源声明 |
| `source_event_id` | `varchar(128)` | NO | 源事件唯一 ID（第一层幂等） |
| `event_type` | `varchar(64)` | NO | 事件类型（如 `LEARNING_DAILY_GOAL_COMPLETED`、`PROFILE_COMPLETED`、`INVITE_SUCCEEDED`） |
| `event_version` | `integer` | NO | Event Schema 版本，`> 0` |
| `subject_user_id` | `bigint` | NO | 奖励判定主体的逻辑用户 ID（**无 FK → identity.***） |
| `source_reference_type` | `varchar(64)` | YES | 源业务对象类型（审计用，无 FK） |
| `source_reference_id` | `varchar(128)` | YES | 源业务对象 ID（审计用，无 FK） |
| `occurred_at` | `timestamptz` | NO | 业务实际发生时间（**奖励周期唯一时间轴**） |
| `payload` | `jsonb` | NO | 判定所需最小事件数据 |
| `processing_status` | `varchar(16)` | NO | 处理状态 |
| `attempt_count` | `integer` | NO | 处理尝试次数，`>= 0` |
| `processing_started_at` | `timestamptz` | YES | 本轮处理开始时间（Worker 崩溃恢复） |
| `next_retry_at` | `timestamptz` | YES | 延迟 / 重试时间 |
| `processed_at` | `timestamptz` | YES | 终态完成时间 |
| `last_error_code` | `varchar(64)` | YES | 最近错误码 |
| `last_error_message` | `text` | YES | 最近错误 |
| `created_at` | `timestamptz` | NO | Rewards 接收时间 |
| `updated_at` | `timestamptz` | NO | 状态更新时间 |

> 本轮最终修正：相比早期版本新增 `attempt_count` 与 `next_retry_at`，因 Program/Rule PAUSED 与暂时性技术错误需要**延迟事件**而不是忙循环或错误进入终态。

FK：**无任何跨域 FK**（`subject_user_id`、`source_reference_id` 一律只存逻辑 ID）。
UNIQUE：`UNIQUE (source_domain, source_event_id)`（第一层幂等）。
CHECK：

```sql
CHECK (event_version > 0)
CHECK (attempt_count >= 0)
CHECK (processing_status IN ('RECEIVED','PROCESSING','PROCESSED','IGNORED','FAILED'))
CHECK (
  (source_reference_type IS NULL AND source_reference_id IS NULL)
  OR (source_reference_type IS NOT NULL AND source_reference_id IS NOT NULL)
)                                                       -- 来源对象必须成对出现
CHECK (processing_status <> 'PROCESSING' OR processing_started_at IS NOT NULL)
CHECK (processing_status NOT IN ('PROCESSED','IGNORED') OR processed_at IS NOT NULL)
```

INDEX：

```sql
CREATE INDEX idx_reward_events_processing_queue
ON rewards.reward_events(next_retry_at, created_at)
WHERE processing_status = 'RECEIVED';                     -- 核心消费队列

CREATE INDEX idx_reward_events_stale_processing
ON rewards.reward_events(processing_started_at)
WHERE processing_status = 'PROCESSING';                   -- 崩溃恢复

CREATE INDEX idx_reward_events_type_occurred
ON rewards.reward_events(event_type, occurred_at DESC);   -- 按事件排查

CREATE INDEX idx_reward_events_user_occurred
ON rewards.reward_events(subject_user_id, occurred_at DESC);  -- 按用户

CREATE INDEX idx_reward_events_source_reference
ON rewards.reward_events(source_reference_type, source_reference_id)
WHERE source_reference_id IS NOT NULL;                    -- 来源对象反查
```

状态机：

```text
RECEIVED
   │
   ▼
PROCESSING
   ├────────► PROCESSED   （判定完成，0 Grants 也可 PROCESSED）
   ├────────► IGNORED     （没有任何 Rule 关心该 event_type）
   ├────────► RECEIVED    （temporary retry / PAUSED 延迟）
   └────────► FAILED      （Rewards 自身异常；业务不满足条件≠FAILED）

管理员：FAILED → RECEIVED（重试）
崩溃恢复：stale PROCESSING → RECEIVED
```

**不可变原则**：`source_domain`、`source_event_id`、`event_type`、`subject_user_id`、`occurred_at`、`payload` 写入后原则上不可修改；可变的只有 `processing_status`、`processing_started_at`、`next_retry_at`、`processed_at`、`attempt_count`、错误字段、`updated_at`。

**payload 铁律**：只保存做奖励判定必须的最小数据（如 `{"completed_count":5,"goal_count":5}`），禁止复制整份资料/整条动态/完整订单，避免形成其他域数据副本。

## 4. `rewards.reward_grants`

Rewards 的**核心业务事实表**：一条记录 = 一个正式奖励决定（“已决定给用户 100 Coin”）。它不是 Wallet Ledger，不代表资产已到账。

| 字段 | 类型 | Null | 说明 |
| --- | --- | ---: | --- |
| `id` | `bigint generated always as identity` | NO | PK（内部关联；跨域不依赖它） |
| `grant_no` | `uuid` | NO | 跨域稳定业务 ID（Commerce 记录 `source_reference_id = grant_no`） |
| `program_id` | `bigint` | NO | FK → reward_programs.id |
| `rule_id` | `bigint` | NO | FK → reward_rules.id（指向产生该 Grant 的 Rule Version） |
| `event_id` | `bigint` | **NO** | FK → reward_events.id（最终定稿为 NOT NULL：V1 不开放无来源 Manual Grant） |
| `user_id` | `bigint` | NO | 获奖用户逻辑 ID（**无 FK → identity.***） |
| `reward_type` | `varchar(32)` | NO | 奖励类型（V1 `COIN`） |
| `reward_amount` | `bigint` | NO | 奖励数量，`> 0` |
| `reason_code` | `varchar(64)` | NO | 奖励原因快照（如 `DAILY_CHECK_IN`） |
| `dedupe_key` | `varchar(200)` | NO | Grant 业务幂等键（第二层幂等） |
| `decision_status` | `varchar(16)` | NO | `GRANTED` / `VOIDED` |
| `granted_at` | `timestamptz` | NO | Grant 决定产生时间 |
| `voided_at` | `timestamptz` | YES | 作废时间 |
| `void_reason` | `text` | YES | 作废理由 |
| `created_at` | `timestamptz` | NO | 创建时间 |
| `updated_at` | `timestamptz` | NO | 更新时间 |

**为什么 Grant 要保存 program/rule/amount 快照**：Grant 是历史业务事实，查询“用户当时被决定奖励多少”直接读 Grant，而不是按当前 Rule 重算。

FK：

```sql
FOREIGN KEY (program_id) REFERENCES rewards.reward_programs(id) ON DELETE RESTRICT
FOREIGN KEY (rule_id)   REFERENCES rewards.reward_rules(id)   ON DELETE RESTRICT
FOREIGN KEY (event_id)  REFERENCES rewards.reward_events(id)  ON DELETE RESTRICT
-- user_id：无跨域 FK
```

UNIQUE：

```sql
UNIQUE (grant_no)
UNIQUE (dedupe_key)
UNIQUE (rule_id, event_id, user_id)   -- 同一 Rule 对同一 Event 和同一用户最多一个 Grant
```

CHECK：

```sql
CHECK (reward_type IN ('COIN'))
CHECK (reward_amount > 0)
CHECK (decision_status IN ('GRANTED','VOIDED'))
CHECK (decision_status <> 'VOIDED' OR (voided_at IS NOT NULL AND void_reason IS NOT NULL))
CHECK (decision_status = 'VOIDED' OR (voided_at IS NULL AND void_reason IS NULL))
```

INDEX：

```sql
CREATE INDEX idx_reward_grants_user_time    ON rewards.reward_grants(user_id, granted_at DESC);
CREATE INDEX idx_reward_grants_program_time ON rewards.reward_grants(program_id, granted_at DESC);
CREATE INDEX idx_reward_grants_rule_user_status
ON rewards.reward_grants(rule_id, user_id, decision_status);   -- Rule 限制查询
CREATE INDEX idx_reward_grants_event ON rewards.reward_grants(event_id);
```

状态机：`GRANTED → VOIDED`；没有 `PENDING/SUCCEEDED/FAILED`（那些属于 Delivery）。

**VOIDED 严格约束**：一旦 `reward_deliveries` 已 `SUCCEEDED`，Grant 不能通过 VOIDED 收回资产（不能“假装钱不存在”），必须走 Commerce Adjustment / Reversal 形成真实资产记录。运营奖励（如春节发 100 Coin）属于 Reward；系统 Bug 少 100 Coin 属于 Commerce Adjustment。

## 5. `rewards.reward_deliveries`

把已成立的 Grant **幂等地**交给真正管理资产的 Domain（V1：Commerce，COIN 入账）。

| 字段 | 类型 | Null | 说明 |
| --- | --- | ---: | --- |
| `id` | `bigint generated always as identity` | NO | PK |
| `grant_id` | `bigint` | NO | FK → reward_grants.id（V1 `UNIQUE`，1 Grant = 1 Delivery） |
| `target_domain` | `varchar(32)` | NO | 目标域，V1 仅 `COMMERCE` |
| `delivery_type` | `varchar(32)` | NO | 发放动作，V1 仅 `ASSET_CREDIT` |
| `idempotency_key` | `varchar(128)` | NO | 下游幂等键（`reward:{grant_no}`），所有重试永远不变 |
| `status` | `varchar(16)` | NO | 发放状态 |
| `attempt_count` | `integer` | NO | 调用目标域次数，`>= 0` |
| `processing_started_at` | `timestamptz` | YES | 本轮 PROCESSING 开始时间（Worker 租约/崩溃恢复） |
| `next_retry_at` | `timestamptz` | YES | 下次重试时间 |
| `target_reference_id` | `varchar(128)` | YES | 下游返回的业务引用（Commerce 的 transaction reference，仅追踪/审计用） |
| `last_error_code` | `varchar(64)` | YES | 最近错误码 |
| `last_error_message` | `text` | YES | 最近错误 |
| `delivered_at` | `timestamptz` | YES | 实际成功时间 |
| `created_at` | `timestamptz` | NO | 默认 `now()` |
| `updated_at` | `timestamptz` | NO | 默认 `now()` |

FK：`FOREIGN KEY (grant_id) REFERENCES rewards.reward_grants(id) ON DELETE RESTRICT`；`target_reference_id` **无 FK → commerce.***（仅逻辑业务引用）。
UNIQUE：

```sql
UNIQUE (grant_id)            -- V1：1 Grant = 1 逻辑 Delivery
UNIQUE (idempotency_key)     -- 推荐 key：reward:{grant_no}

CREATE UNIQUE INDEX uq_reward_deliveries_target_reference
ON rewards.reward_deliveries(target_domain, target_reference_id)
WHERE target_reference_id IS NOT NULL;
```

CHECK：

```sql
CHECK (target_domain IN ('COMMERCE'))
CHECK (delivery_type IN ('ASSET_CREDIT'))
CHECK (status IN ('PENDING','PROCESSING','RETRY_WAIT','SUCCEEDED','FAILED','CANCELLED'))
CHECK (attempt_count >= 0)
CHECK (status <> 'PROCESSING' OR processing_started_at IS NOT NULL)
CHECK (status <> 'RETRY_WAIT' OR next_retry_at IS NOT NULL)
CHECK (status <> 'SUCCEEDED' OR (delivered_at IS NOT NULL AND target_reference_id IS NOT NULL))
CHECK (status = 'SUCCEEDED' OR delivered_at IS NULL)   -- 非成功状态不得伪造到账
```

INDEX：

```sql
CREATE INDEX idx_reward_deliveries_retry_queue
ON rewards.reward_deliveries(next_retry_at, created_at)
WHERE status IN ('PENDING','RETRY_WAIT');              -- Worker 队列（PENDING 的 next_retry_at 可为 NULL，视为立即可执行）

CREATE INDEX idx_reward_deliveries_stale_processing
ON rewards.reward_deliveries(processing_started_at)
WHERE status = 'PROCESSING';                           -- 崩溃恢复

CREATE INDEX idx_reward_deliveries_status_created
ON rewards.reward_deliveries(status, created_at);      -- 异常后台

CREATE INDEX idx_reward_deliveries_target_status
ON rewards.reward_deliveries(target_domain, status);
```

状态机：

```text
PENDING
   ▼
PROCESSING
   ├───────────► SUCCEEDED（终态）
   ├───────────► RETRY_WAIT
   │                 ▼
   │            PROCESSING
   │                 ├── SUCCEEDED
   │                 └── FAILED
   └───────────► FAILED

取消（仅 Grant 合法 VOIDED 且尚未真正发放时）：
PENDING ───► CANCELLED（终态）
RETRY_WAIT ─► CANCELLED（终态）

管理员：FAILED → RETRY_WAIT（继续用原 idempotency_key）
崩溃恢复：stale PROCESSING（processing_started_at 超时）→ 重新领取 / RETRY_WAIT
```

**状态语义**：
- `RETRY_WAIT`：技术性临时失败（网络错误、Commerce 不可用、超时、短暂锁冲突），自动重试。
- `FAILED`：确定无法自动处理（非法 reward_type、协议错误、超过最大重试次数、不可恢复业务错误），人工处理。
- `SUCCEEDED` / `CANCELLED`：终态，不可再变。
- 不建 `reward_delivery_attempts`（V1 只保总次数与最近错误；以后若要求每次请求/响应可追踪再增加）。

## 所有枚举汇总（V1）

| 枚举 | 值 |
| --- | --- |
| Program status | `DRAFT, ACTIVE, PAUSED, ENDED, ARCHIVED` |
| Rule status | `DRAFT, ACTIVE, PAUSED, RETIRED` |
| Event processing_status | `RECEIVED, PROCESSING, PROCESSED, IGNORED, FAILED` |
| Grant decision_status | `GRANTED, VOIDED` |
| Delivery status | `PENDING, PROCESSING, RETRY_WAIT, SUCCEEDED, FAILED, CANCELLED` |
| reward_type | `COIN` |
| delivery_type | `ASSET_CREDIT` |
| target_domain | `COMMERCE` |

`source_domain` 与 `event_type` 是跨域事件合同扩展点，不做数据库固定 ENUM。

## 删除规则

- `reward_events`、`reward_grants`、`reward_deliveries` 永不因普通业务操作 DELETE。
- `reward_programs` / `reward_rules`：`DRAFT` 且从未投入使用可物理删除；一旦生效 Program → `ENDED`/`ARCHIVED`、Rule → `RETIRED`，禁止 DELETE。
- 所有历史 FK `ON DELETE RESTRICT`。

## Reward Limit 最终设计（数据库相关）

- 不建 `reward_counters` / `reward_user_counters`。
- 限制来源：`reward_rules.limit_config` + `reward_grants` + `reward_events.occurred_at`。
- V1 周期语义固定为：`EVENT`、`SOURCE_OBJECT`、`DAY`、`WEEK`、`MONTH`、`LIFETIME`。
- 并发限制：`dedupe_key UNIQUE` 处理“每 Event/每周期一次”；`max_grants > 1` 时在 `COUNT → INSERT` 前获取 `(rule_id, user_id, period_key)` 的事务级 `pg_advisory_xact_lock`。

`dedupe_key` 生成规则（由 limit 类型决定）：

```text
每 Event 一次      rule:{rule_id}:user:{user_id}:event:{event_id}
每 Source 一次     rule:{rule_id}:user:{user_id}:source:{source_reference_id}
Lifetime 一次      rule:{rule_id}:user:{user_id}:lifetime
每日一次           rule:{rule_id}:user:{user_id}:day:{business_date}
每周一次           rule:{rule_id}:user:{user_id}:week:{business_week}
每月一次           rule:{rule_id}:user:{user_id}:month:{yyyy-mm}
```

`max_grants > 1` 时 dedupe_key 继续包含 `event_id`（不同合法 Event 可产生不同 Grant），周期总量上限由 advisory lock + count 保证。