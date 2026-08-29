---
status: frozen
last_updated: 2026-08-30
source: 设计奖励域
---

# Rewards 域

> 平台激励与奖励决策领域：负责“为什么奖励、奖励谁、奖励多少、是否满足条件、是否超过限制、是否可以发放”；**真正的资产入账由 Commerce 执行**。

## 一句话边界

```text
Source Domain 决定「事实是否发生」
Rewards 决定「这个事实是否值得奖励」
Commerce 决定「资产如何安全入账」
```

Rewards 只产生“应该给用户 100 Coins”这样的决定，绝不执行 `UPDATE commerce.wallets SET balance = balance + 100`。

## 核心链路

```text
发生了什么？
    ↓
这个行为是否符合奖励条件？
    ↓
应该奖励谁？奖励什么？奖励多少？
    ↓
是否超过次数 / 周期 / 总量限制？
    ↓
产生 Reward Grant（奖励决定成立）
    ↓
Reward Delivery（幂等交给目标域执行）
    ↓
Commerce 入账 → Wallet / Ledger
```

完整关系：

```text
reward_programs
      │ 1:N
      ▼
reward_rules
      │               reward_events
      └───────┬──────────────┘
              ▼
       reward_grants
              │ 1:1
              ▼
     reward_deliveries
              │ logical contract only（无跨域 FK）
              ▼
        Commerce Domain
              ▼
     Wallet / Ledger
```

## 职责与子域

| 子域 | 核心实体 | 表 | 职责 |
| --- | --- | --- | --- |
| 奖励配置 | RewardProgram | `rewards.reward_programs` | 奖励计划 / 活动容器与生命周期 |
| 奖励配置 | RewardRule | `rewards.reward_rules` | 触发事件、条件、限制与奖励额（按版本管理） |
| 事件接收 | RewardEvent | `rewards.reward_events` | 接收其他域已确认发生的可信业务事实（入站边界表） |
| 奖励决定 | RewardGrant | `rewards.reward_grants` | Rewards 已正式作出的奖励决定（核心事实表） |
| 发放编排 | RewardDelivery | `rewards.reward_deliveries` | 把 Grant 幂等地交给 Commerce 等目标域执行 |

## 明确不负责

- 不维护 Wallet / 余额 / Ledger：`balance_before`、`balance_after`、`ledger_debit/credit` 全属 Commerce。
- 不负责 Adjustment（人工/系统纠错）、Reversal（逆向冲正）、Refund（退款）。
- 不负责 Gift：礼物商品、订单、购买、资产消耗仍属 Commerce。
- 不反向查询 Learning / Social / Chat / Identity 的表来重新验证已发生的事件。
- V1 不建：`reward_wallets`、`reward_balances`、`reward_ledgers`、`reward_transactions`、`reward_orders`、`reward_products`、`reward_points`、`reward_user_counters`、`reward_claims`、`reward_tasks`、`reward_user_tasks`、`reward_badges`、`reward_levels`。未来确有需求时再判断是扩展 Rewards 还是新建 Domain。

## 状态汇总（V1）

| 对象 | 状态值 |
| --- | --- |
| Program | `DRAFT` / `ACTIVE` / `PAUSED` / `ENDED` / `ARCHIVED` |
| Rule | `DRAFT` / `ACTIVE` / `PAUSED` / `RETIRED`（终态） |
| Event | `RECEIVED` / `PROCESSING` / `PROCESSED` / `IGNORED` / `FAILED` |
| Grant | `GRANTED` / `VOIDED` |
| Delivery | `PENDING` / `PROCESSING` / `RETRY_WAIT` / `SUCCEEDED` / `FAILED` / `CANCELLED` |
| Reward Type | `COIN`（V1 唯一） |
| Delivery Type | `ASSET_CREDIT`（V1 唯一） |
| Delivery Target | `COMMERCE`（V1 唯一） |

`source_domain` 与 `event_type` 不做数据库 ENUM：它们是跨 Domain 事件合同的扩展点。

## 关键状态机语义

- Grant 只有 `GRANTED → VOIDED`，没有 `PENDING/SUCCEEDED/FAILED`——那些属于 Delivery。
- Delivery：`PENDING → PROCESSING → (SUCCEEDED | RETRY_WAIT → PROCESSING | FAILED)`；`PENDING/RETRY_WAIT → CANCELLED`（仅在 Grant 合法 VOIDED 时可取消）。`SUCCEEDED`、`CANCELLED` 为终态。
- Program / Rule 的 `PAUSED` 只阻止“发生于暂停之后”的新事件产生 Grant；不反向取消已成立 Grant，已产生 Grant 的 Delivery 继续发放。
- 所有奖励周期与 Rule 匹配都依据 `event.occurred_at`（业务实际发生时间），绝不用 `created_at` / `granted_at`；晚到事件按发生时有效的 Rule 版本处理，`RETIRED` 的历史版本仍可匹配其有效窗口内的迟到事件。

完整的判定顺序、事务边界、幂等与重试、Admin/API 边界见 [应用服务与事件](application-and-events.md)；表与字段规格见 [数据库](database.md)。

## 20 条不可违反规则

1. **源 Domain 决定事实是否发生。**
2. **Rewards 决定事实是否值得奖励。**
3. **Commerce 决定资产如何真正入账。**
4. Rewards 不直接修改任何 Wallet / Balance / Ledger。
5. Rewards 不创建 Refund / Adjustment / Reversal。
6. Rewards 不重新查询源 Domain 验证已经发生的 Event。
7. 所有 Grant 第一阶段必须来源于一个 Reward Event（`reward_grants.event_id NOT NULL`）。
8. Reward 永远为正数（`reward_amount > 0`），不存在负 Reward；扣回资产只能走 Commerce Adjustment / Reversal。
9. 一个 Grant 只代表一种 Reward Asset（V1 为 COIN）。
10. 一个 Grant 第一阶段只对应一个 Delivery（`UNIQUE(grant_id)`）。
11. Event 以 `UNIQUE(source_domain, source_event_id)` 幂等。
12. Grant 以 `dedupe_key` + 数据库 UNIQUE 幂等。
13. 多次上限通过 PostgreSQL 事务级 advisory lock 保证并发安全，不建 Counter 表。
14. 所有奖励周期都使用 `event.occurred_at`。
15. Rule 生效后核心配置不可原地修改，只能新建 Version。
16. 晚到 Event 必须匹配其发生时有效的 Rule Version（不能只查 `WHERE status='ACTIVE'`）。
17. Grant 和 Delivery 必须在同一个 Rewards 本地事务创建。
18. 调用 Commerce 必须发生在 Rewards 事务提交之后（Delivery Worker 异步执行）。
19. 所有 Delivery Retry 必须复用原 `idempotency_key`（`reward:{grant_no}`），绝不生成新 Key。
20. 已经 `SUCCEEDED` 的奖励资产纠错只能进入 Commerce，而不能伪造为 Reward VOID。

## 已验证/已定稿内容

- 表结构、字段、可空性、默认值、FK/UNIQUE/CHECK/INDEX：见 [数据库](database.md)（5 张表 `frozen`）。
- 状态机、判定流程、时间规则、幂等与并发、事务边界、Commerce 合同、Admin API 与 Service 边界：见 [应用服务与事件](application-and-events.md)。
- Rewards 与 Commerce 的边界沿 [ADR-016](../../adr/ADR-016-commerce-money-and-append-only-ledger.md)；本域的三层职责与事件驱动发放决策见 [ADR-017](../../adr/ADR-017-rewards-boundary-and-event-driven-grant.md)。