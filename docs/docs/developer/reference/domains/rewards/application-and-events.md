---
status: frozen
last_updated: 2026-08-30
source: 设计奖励域
---

# Rewards 应用服务与事件

本页定稿 Rewards 的状态机流程、事务与幂等、时间规则、`Commerce` 合同以及 Admin/API/Service 边界。数据库字段规格见 [数据库](database.md)，边界与铁律见 [索引页](index.md)。

## 1. 标准奖励流程

以“完成每日学习目标奖励 10 Coin”为例：

```text
Learning Domain
   │ 产生业务事实（源域决定事实是否发生）
   ▼
LEARNING_DAILY_GOAL_COMPLETED（可信领域事件）
   ▼
Rewards 接收事件（RewardEventConsumer：Receive → Validate → Persist → ACK）
   ▼
reward_events（RECEIVED）
   │ 异步 RewardEventProcessor：
   │ ① 校验事件合法   ② 查找 ACTIVE reward_rules
   │ ③ 检查 rule 条件  ④ 检查用户奖励次数限制
   ▼
reward_grants（GRANTED）＋ reward_deliveries（PENDING）   ← 同一 Rewards 本地事务
   ▼
Delivery Worker（提交之后再执行）
   │ 幂等检查 → Commerce 创建资产交易 → 写 Ledger → 更新余额
   ▼
Commerce 返回 transaction reference → Delivery SUCCEEDED
```

**禁止设计成跨 Domain 大事务**：即使 PostgreSQL 技术上允许，也禁止在一个事务里 `INSERT rewards.reward_grants` + `UPDATE commerce.wallets` + `INSERT commerce.ledger_entries`，因为那等于 Rewards 控制 Commerce 的内部事务。

## 2. Event 接收与消费

- `reward_events` 不是 C 端公开 API，禁止 `POST /api/rewards/events`（客户端可伪造奖励事件）。
- 入口只能来自**可信内部 Domain**：`internal` / `RewardEventConsumer`（消息消费）。
- `RewardEventConsumer.consume(DomainEvent)` 只做：验证 Event Envelope → `INSERT reward_events` → 触发/排队 `RewardEventProcessor`。Consumer 应尽可能薄，不执行 30 条 Rule、不立即调用 Commerce 再 ACK。
- 第一层幂等：`UNIQUE(source_domain, source_event_id)`。重复投递视为 `duplicate = success/no-op`，不能因重复事件导致队列一直重试。
- Event 的**业务事实部分**（source_domain / source_event_id / event_type / subject_user_id / occurred_at / payload）写入后不可修改；可变的只有处理状态与错误字段。

## 3. Rule 匹配流程（固定顺序）

```text
event_type → 查 reward_rules.trigger_event_type
  → 过滤 Program：ACTIVE？starts_at ≤ occurred_at？ends_at > occurred_at？
  → 过滤 Rule：ACTIVE？effective_from ≤ occurred_at？effective_to > occurred_at？
  → evaluate condition_config（只针对 Event envelope + payload）
  → evaluate limit_config（只查 rewards.reward_grants）
  → 判断优先级与捕 catch 规则 → Grant
```

先便宜判断后复杂判断。Event 被 Worker 领取使用 `FOR UPDATE SKIP LOCKED` 防并发消费。

## 4. 时间规则（最容易埋 Bug 的地方）

- **业务周期一律使用 `event.occurred_at`**（用户发生行为的业务时间），绝不用 `created_at` 或 `granted_at`。例：8 月 30 日 23:59 完成任务、8 月 31 日 00:01 进入 Rewards，仍属于 8 月 30 日。
- **每日/每周/每月周期的业务日期**：默认使用**产品业务时区**，应用层统一转换后计算 `business_date`，不能直接 `DATE(granted_at)`；「按用户所在时区奖励」第一版不引入（`deferred`）。
- **晚到 Event**：Program/Rule 时间范围用 `event.occurred_at` 判断；行为确实发生在活动期内就应奖励，消息延迟不能让用户失去奖励。
- **Rule Selection**：不能只 `WHERE status='ACTIVE'`；要按 `trigger_event_type + event.occurred_at + effective_from + effective_to` 选版本。8 月 30 日 23:59 的事件即使 8 月 31 日被处理，也匹配当时有效的 v1（10 Coin），而不是当前 ACTIVE 的 v2（20 Coin）。
- **RETIRED 规则**仍可匹配其历史有效窗口内的迟到事件（RETIRED ≠ 不能再产生历史判定，只表示不再用于新的业务时间点）。
- **PAUSED 语义**：只阻止“发生于暂停之后”的新事件；暂停前已发生的迟到事件仍按历史规则处理（仍以 `occurred_at` 为唯一业务时间轴）。紧急彻底停发不应混进 Program lifecycle，需另设 `Reward processing emergency switch`（V1 暂不实现）。

## 5. 幂等与并发（三层防护）

| 层 | 手段 | 解决什么 |
| --- | --- | --- |
| Event 幂等 | `UNIQUE(source_domain, source_event_id)` | 源域重发 / 消息重复 |
| Grant 幂等 | `UNIQUE(dedupe_key)` + `UNIQUE(rule_id, event_id, user_id)` | Worker 重启、事务重试、事件重处理 |
| Delivery 幂等 | `UNIQUE(idempotency_key)`，Key 恒为 `reward:{grant_no}` | 调用 Commerce 超时后的重试 |

- **并发上限**：`SELECT COUNT → INSERT` 不并发安全。`max_grants = 1` 由 dedupe_key UNIQUE 兜底；`max_grants > 1`（如每周 3 次）在 COUNT 前获取 `(rule_id, user_id, period_key)` 的 `pg_advisory_xact_lock`。**不建 Counter 表**。
- `dedupe_key` 由 limit 类型决定（每 Event / 每 Source / lifetime / day / week / month），生成规则见 [数据库](database.md)「Reward Limit 最终设计」。
- 整体一致性 = **Local ACID Transaction + Outbox/Reliable Event + Idempotent Consumer + Retry**，不是 Distributed Transaction。

## 6. 事务边界（Rewards 本地事务）

同一个 Rewards 本地事务（全部表都属于 rewards schema，合法）：领取 reward_event → 匹配 Program/Rule → 检查 condition → 获取 limit lock → 检查 limit → `INSERT reward_grant` → `INSERT reward_delivery` → 更新 Event → `PROCESSED` → `COMMIT`。

- **Grant 与 Delivery 必须同事务创建**：禁止先 CREATE Grant 提交后再异步创建 Delivery（进程崩溃会导致奖励永远发不出去）。
- **该事务内绝不调用 Commerce**（HTTP 调用导致分布式事务问题）。
- 规则：

```text
一次 Rewards 本地事务可以同时修改：reward_events、reward_grants、reward_deliveries
但绝不直接修改 learning.* / social.* / chat.* / commerce.*
```

- **Outbox（审计确认）**：Rewards **不建独立 outbox 表**（不建 `rewards.outbox_events` / `reward_outbox` / `reward_event_outbox`）。若 Rewards 需发布 `REWARD_GRANTED / REWARD_DELIVERED`，统一写入项目级基础设施 **`system_outbox_events`**（系统级可靠消息基础设施，不计入 5 张核心业务表），并与其本地事务同 COMMIT；Outbox 中保存的 aggregate / subject / event logical reference 用 `uuid`，不通过 FK 耦合 Reward 业务表。源域（如 Learning）发布事件给 Rewards 也走同一统一基础设施。

## 7. Delivery Worker

- 独立 Worker 查询：`status IN ('PENDING','RETRY_WAIT') AND (next_retry_at IS NULL OR next_retry_at <= now())`，用 `FOR UPDATE SKIP LOCKED` 批量领取，多 Worker 并发安全。
- 领取后 `PROCESSING` + `processing_started_at = now()`；完成任务租约：`PROCESSING AND processing_started_at < now() - timeout` 视为失效，重新进入 RETRY_WAIT 或再次领取（防机器宕机卡死）。
- 重试策略（应用层，不硬编码进数据库）示例：1 min → 5 min → 15 min → 1 hour → 6 hours（指数退避）；超过最大尝试次数 → `FAILED` 入人工排障。
- 可重试错误（→ RETRY_WAIT）：`TIMEOUT / CONNECTION_ERROR / SERVICE_UNAVAILABLE / DATABASE_BUSY / RATE_LIMITED`。
- 不可重试错误（→ FAILED）：`INVALID_REWARD_TYPE / INVALID_USER / INVALID_AMOUNT / INVALID_REQUEST`。
- **超时语义**：`timeout` 只代表“Rewards 不知道结果”，不代表“Commerce 没发钱”；必须用**相同 `idempotency_key`** 重试确认，绝不新建 Key，也绝不直接标记 FAILED 后重新发一笔。
- 后台文案用「重试发放」，不用「重新发放」（避免运营理解成再发一份）；**后台绝不生成新的 idempotency key**。

## 8. FAILED 之后怎么办

- 技术问题修复后：`FAILED → RETRY_WAIT`，继续用原 `idempotency_key`。
- Grant 本身错误且**尚未到账**：`Grant → VOIDED` + `Delivery → CANCELLED`（同一 Rewards 本地事务）。
- Grant 错误但**已到账**：禁止 VOID 当资产不存在，只能走 Commerce `Adjustment / Reversal`。

## 9. Grant VOID 规则（最终）

```text
较安全的驳回：Delivery = PENDING 且 attempt_count = 0 → Grant VOIDED + Delivery CANCELLED（原子）
Delivery = PROCESSING      → 禁止 VOID（结果未知）
Delivery = SUCCEEDED       → 绝对禁止 VOID 收回资产 → Commerce Adjustment / Reversal
```

- `POST /developer/reference/admin/rewards/grants/{grantNo}/void` 仅允许先检查 Grant/Delivery；若 Delivery 已 SUCCEEDED 返回业务错误 `REWARD_ALREADY_DELIVERED`。
- **“作废 Reward” 与 “扣回用户资产” 是两个业务决定**：Rewards 不应在同一按钮内自动调用 Commerce Reversal。

## 10. Commerce 集成合同（Port）

Rewards → Commerce 只发业务合同：

```text
beneficiary_user_id : 123（UUID logical reference）
asset_type          : COIN
amount              : 10
source_domain       : REWARDS
source_reference_id : {grant_no}（UUID）
idempotency_key     : reward:{grant_no}
reason_code         : DAILY_LEARNING
```

内容里**没有** `wallet_id / ledger_id / balance_before / balance_after / SQL table`——那些是 Commerce 自己决定。Commerce 成功后只需要返回 `target_reference_id`（自己的 transaction reference）。

- 定义端口：`RewardAssetDeliveryPort.creditRewardAsset(userId, rewardType, amount, grantNo, idempotencyKey, reasonCode)`；Infrastructure 用 `CommerceRewardAssetAdapter` 调用 Commerce 的公开应用接口。
- Commerce 最小接口：`creditAsset(beneficiaryUserId, assetType, amount, sourceDomain, sourceReferenceId, idempotencyKey, reason)`，内部负责验证资产类型 → 查找/创建资产账户 → 写 Ledger → 更新余额 → 返回 reference。
- **即使同进程模块化单体**：Rewards → Commerce 也必须走 `Commerce Application Port`，禁止 Rewards 直接使用 `CommerceRepository` / 表。
- Rewards Domain/Application 层不得出现 `Wallet / LedgerEntry / CommerceOrder / Balance / AccountTransaction` 等 Commerce 内部概念；只认识 `RewardDeliveryRequest` 与 `RewardDeliveryResult(SUCCESS | RETRYABLE_FAILURE | PERMANENT_FAILURE, targetReferenceId, errorCode)`。

## 11. Admin API 边界（V1）

Program：

```text
POST   /developer/reference/admin/rewards/programs
GET    /developer/reference/admin/rewards/programs
GET    /developer/reference/admin/rewards/programs/{id}
PATCH  /developer/reference/admin/rewards/programs/{id}
POST   /developer/reference/admin/rewards/programs/{id}/activate
POST   /developer/reference/admin/rewards/programs/{id}/pause
POST   /developer/reference/admin/rewards/programs/{id}/resume
POST   /developer/reference/admin/rewards/programs/{id}/end
POST   /developer/reference/admin/rewards/programs/{id}/archive
```

状态迁移通过明确的业务命令，禁止 `PUT /programs/{id}/status` 让前端随意传 status。

Rule：

```text
POST   /developer/reference/admin/rewards/programs/{programId}/rules
GET    /developer/reference/admin/rewards/programs/{programId}/rules
GET    /developer/reference/admin/rewards/rules/{ruleId}
PATCH  /developer/reference/admin/rewards/rules/{ruleId}
POST   /developer/reference/admin/rewards/rules/{ruleId}/activate
POST   /developer/reference/admin/rewards/rules/{ruleId}/pause
POST   /developer/reference/admin/rewards/rules/{ruleId}/resume
POST   /developer/reference/admin/rewards/rules/{ruleId}/retire
POST   /developer/reference/admin/rewards/rules/{ruleId}/versions   -- 基于当前 Rule 创建下一版本
```

- Rule 已投入使用后修改 `reward_amount` 等核心字段应提示「该规则已投入使用，请创建新版本」。
- 可编辑性：DRAFT 可改全部；ACTIVE/PAUSED 只允许改 `name` 等展示字段；RETIRED 完全不可变。

Event（高级排障页）：

```text
GET /developer/reference/admin/rewards/events   ?source_domain=&event_type=&subject_user_id=&processing_status=&occurred_from=&occurred_to=&source_event_id=
GET /developer/reference/admin/rewards/events/{id}
POST /developer/reference/admin/rewards/events/{id}/retry     -- FAILED → RECEIVED，由正常 Worker 再处理
```

- Event 重试不能删除原 Grant；`dedupe_key UNIQUE` 保证重新执行安全（Rewards 流程天然 at-least-once）。

Grant / Delivery：

```text
GET /developer/reference/admin/rewards/grants ?user_id=&program_id=&rule_id=&reward_type=&decision_status=&delivery_status=&from=&to=
GET /developer/reference/admin/rewards/grants/{grantNo}           -- 对外用 grant_no，不用内部 bigint id
POST /developer/reference/admin/rewards/grants/{grantNo}/void

GET  /developer/reference/admin/rewards/deliveries ?status=&...
GET  /developer/reference/admin/rewards/deliveries/{id}
POST /developer/reference/admin/rewards/deliveries/{id}/retry     -- FAILED / 过期 PROCESSING → RETRY_WAIT，复用原 idempotency_key
POST /developer/reference/admin/rewards/deliveries/{id}/cancel    -- 仅 Grant=VOIDED 且 Delivery IN (PENDING, RETRY_WAIT)
```

- **禁止**：`POST /developer/reference/admin/rewards/grants` 直接给用户发 Coin、`POST /api/rewards/events`、`POST /api/me/rewards/{id}/claim`。
- **Rewards 后台明确禁止功能**：修改用户 Coin 余额、加/扣 Coin、改/删 Ledger、退款、充值、礼物退款、订单冲正——这些属于 Commerce Admin；Rewards 页面最多提供查看 `target_reference_id` 跳转交易详情。
- 第一版后台 4 个模块：奖励计划、奖励规则、奖励记录、发放异常（Event 作为高级排障页）。

## 12. C 端 API（V1）

- `GET /api/me/rewards`：展示奖励记录（name / amount / reward_type / reason / granted_at / delivery status）。
- 展示语义：`SUCCEEDED` → “+10 Coin 已到账”；`PENDING/RETRY_WAIT` → “+10 Coin 发放中”；`FAILED` → “奖励处理中”，不暴露底层错误。
- 用户**不可见** `reward_events`（内部技术/事实处理数据）。
- 不提供用户“领取”动作（`reward_claims` 不建）：当前是自动判定 → 自动 Grant → 自动 Delivery。未来若要手动领取，届时重新设计 Claim 生命周期。

## 13. 代码结构与 Service 边界

```text
rewards/
├── application/  program/ rule/ event/ grant/ delivery/          -- 用例编排
├── domain/       program/ rule/ grant/ delivery/ policy/          -- 纯领域，禁止依赖 HTTP/Repository 实现/Commerce SDK
├── infrastructure/ persistence/ messaging/ commerce/              -- Commerce 走 Adapter/Port
└── interfaces/   admin/ internal/ consumer/
```

核心 Domain Policy：`RewardConditionEvaluator`（只判 condition_config）、`RewardLimitPolicy`（每日一次/每周三次/lifetime once）、`RewardDedupePolicy`、`RewardRuleSelectionPolicy`。

Application Service（收敛，不逐方法建类）：`RewardProgramApplicationService`、`RewardRuleApplicationService`、`RewardEventIngestionService`、`RewardEventProcessingService`、`RewardGrantQueryService`、`RewardGrantApplicationService`、`RewardDeliveryProcessingService`、`RewardDeliveryAdminService`。

Aggregate 边界：Program / Rule / Grant(+Delivery 业务层紧耦合但仍是两表) / Event（独立处理记录）各自独立；数据库 FK 保留（DDD 的 Aggregate 边界 ≠ 数据库不能有 FK）。

Repository：`Reward*Repository` 只能访问 `rewards.*`；**禁止 SQL JOIN 其他域表**，需要用户信息走 `IdentityQueryPort` 等查询接口。后台复杂查询可用 `RewardAdminQueryService`，第一版仍只查 `rewards.*`。

错误码：`REWARD_PROGRAM_NOT_FOUND / REWARD_PROGRAM_INVALID_STATE / REWARD_RULE_NOT_FOUND / REWARD_RULE_INVALID_STATE / REWARD_RULE_IMMUTABLE / REWARD_RULE_VERSION_CONFLICT / REWARD_EVENT_NOT_FOUND / REWARD_EVENT_ALREADY_PROCESSED / REWARD_GRANT_NOT_FOUND / REWARD_GRANT_ALREADY_VOIDED / REWARD_ALREADY_DELIVERED / REWARD_DELIVERY_NOT_FOUND / REWARD_DELIVERY_NOT_RETRYABLE / REWARD_CONFIGURATION_INVALID`。不把 PostgreSQL 原生 `duplicate key …` 错误暴露到 API。

后台权限（建议语义先行）：`REWARDS_VIEW`、`REWARDS_PROGRAM_MANAGE`、`REWARDS_RULE_MANAGE`、`REWARDS_GRANT_VOID`、`REWARDS_DELIVERY_RETRY`；`VOID/RETRY` 属高风险，不让普通管理员默认拥有。

日志上下文至少含：`reward_event_id / source_event_id / reward_grant_no / delivery_id / user_id / rule_id / program_id`；用于“用户没收到奖励”从 user_id → Grant → Delivery → Commerce Reference 完整追踪。

Metrics（概念预留，未实现）：`reward_events_received_total`、`reward_events_failed_total`、`reward_grants_created_total`、`reward_deliveries_pending`、`reward_deliveries_retrying`、`reward_deliveries_failed_total`、`reward_delivery_latency`；重点报警：FAILED delivery 持续增加、Delivery 卡 PROCESSING、RECEIVED Event 堆积。