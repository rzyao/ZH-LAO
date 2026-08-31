---
status: frozen
last_updated: 2026-08-31
schema: rewards
---

# Rewards 域

Rewards Domain 负责**奖励决策与发放编排**：为什么奖励、奖励谁、奖励多少、是否满足规则、是否超过限制，以及已经成立的奖励如何可靠交给资产所属领域执行。

真正的资金和虚拟资产入账由 Commerce 负责。

## 一句话边界

```text
Source Domain 决定「业务事实是否发生」
Rewards 决定「这个事实是否值得奖励」
Commerce 决定「资产如何安全入账」
```

Rewards 可以形成“应该给某用户 100 Coins”的正式 Grant，但不能直接修改 Commerce Wallet 或 Ledger。

## 核心链路

```text
可信 Source Domain Event
        ↓
Reward Event
        ↓
按 occurred_at 匹配 Program / Rule
        ↓
校验条件与奖励上限
        ↓
Reward Grant
        ↓
Reward Delivery
        ↓
Commerce Asset Credit
        ↓
Wallet / Ledger
```

Grant 与 Delivery 是两种不同事实：

- **Grant**：奖励决定已经成立；
- **Delivery**：把已成立的奖励可靠、幂等地交付给目标领域。

## 核心模型

Rewards V1 固定 5 张业务表：

| 模型 | 表 | 职责 |
| --- | --- | --- |
| Reward Program | `rewards.reward_programs` | 奖励计划 / 活动容器与生命周期 |
| Reward Rule | `rewards.reward_rules` | 事件匹配、条件、限制、奖励额与规则版本 |
| Reward Event | `rewards.reward_events` | 接收可信源领域已经确认发生的业务事实 |
| Reward Grant | `rewards.reward_grants` | Rewards 已正式作出的奖励决定 |
| Reward Delivery | `rewards.reward_deliveries` | 将 Grant 幂等交给 Commerce 等目标领域执行 |

字段、约束与索引见[数据设计](database.md)。

## 领域边界

Rewards 明确不负责：

- Wallet、余额与 Ledger；
- Adjustment、Reversal、Refund；
- Gift 商品、订单、购买与礼物资产消耗；
- 反向读取 Learning / Social / Chat / Identity 的内部表来重新验证事件；
- 自建 Rewards 专属 Outbox；可靠事件统一使用 `system_outbox_events`；
- Points、Badge、Level、Task、Claim 等当前未进入 V1 的激励模型。

跨 Domain 的用户、事件来源和交付目标只保存稳定 logical/public UUID，不建立 physical FK。

## 状态机摘要

| 对象 | 状态 |
| --- | --- |
| Program | `DRAFT / ACTIVE / PAUSED / ENDED / ARCHIVED` |
| Rule | `DRAFT / ACTIVE / PAUSED / RETIRED` |
| Event | `RECEIVED / PROCESSING / PROCESSED / IGNORED / FAILED` |
| Grant | `GRANTED / VOIDED` |
| Delivery | `PENDING / PROCESSING / RETRY_WAIT / SUCCEEDED / FAILED / CANCELLED` |

V1 奖励资产固定为：

```text
Reward Type     = COIN
Delivery Type   = ASSET_CREDIT
Delivery Target = COMMERCE
```

完整迁移条件、重试和失败语义见[应用服务与事件](application-and-events.md)。

## 核心不变量

1. **源领域是业务事实的 owner。** Rewards 消费已经确认发生的可信事件，不重新查询源领域内部数据验证事实。
2. **Rewards 只决定奖励，不直接记账。** Wallet / Balance / Ledger 永远由 Commerce 管理。
3. **所有 Grant 必须有事件来源。** V1 不支持脱离 Reward Event 的 Manual Grant。
4. **奖励金额恒为正数。** 资产扣回只能进入 Commerce Adjustment / Reversal。
5. **一个 Grant 只代表一种奖励资产。** V1 仅 `COIN`。
6. **一个 Grant V1 只对应一个 Delivery。** Grant 的业务成立与 Delivery 的执行结果不能混成一个状态。
7. **Event、Grant、Delivery 分层幂等。** 重复事件、Worker 重启和 Commerce 超时不能产生重复奖励。
8. **奖励周期一律基于 `event.occurred_at`。** 接收时间、处理时间和发放时间都不能改变事件所属业务周期。
9. **Rule 使用版本化语义。** 已生效的核心规则不原地篡改；迟到事件仍按其发生时有效的规则版本判断。
10. **Grant 与 Delivery 在同一 Rewards 本地事务创建。** Commerce 调用只能发生在该事务提交之后。
11. **跨域不使用大事务。** Rewards 不能在自己的事务里直接更新 Commerce 内部表。
12. **Delivery 重试复用同一 `idempotency_key`。** 超时表示结果未知，不代表可以再创建一笔奖励。
13. **已成功到账的奖励不能通过 Grant VOID 假装未发生。** 后续纠错进入 Commerce 的正式资产纠错流程。
14. **多次奖励上限必须并发安全。** 不能用不受保护的 `COUNT → INSERT` 产生并发超发。

## 时间与规则版本语义

Reward 判定的唯一业务时间轴是：

```text
event.occurred_at
```

因此：

- 晚到事件不能因为消息延迟而失去本应获得的奖励；
- Rule 不能只按“当前 ACTIVE 版本”匹配；
- `RETIRED` 的历史版本仍可以处理其有效窗口内发生的迟到事件；
- `PAUSED` 不反向取消暂停前已经发生的合法业务事实。

## 发放失败与纠错

```text
Delivery 尚未成功
→ 可以在规则允许时取消 / VOID

Delivery 结果未知
→ 使用原 idempotency_key 重试确认

Delivery 已 SUCCEEDED
→ Rewards 不直接扣回
→ 进入 Commerce Adjustment / Reversal
```

“作废奖励决定”和“扣回已经到账的资产”是两个不同业务动作。

## 当前明确不包含

V1 不建立：

```text
reward_wallets
reward_balances
reward_ledgers
reward_transactions
reward_points
reward_user_counters
reward_claims
reward_tasks
reward_user_tasks
reward_badges
reward_levels
```

未来出现新的激励形态时，应先重新判断其事实所有权，而不是把所有“奖励相关”能力自动塞进 Rewards。

## 文档地图

- [应用服务与事件](application-and-events.md)：事件接收、Rule 匹配、事务、并发、幂等、Delivery Worker、Commerce Port 与 Admin API。
- [数据设计](database.md)：5 张表、状态、约束、索引、时间与幂等字段。
- [ADR-016](../../adr/ADR-016-commerce-money-and-append-only-ledger.md)：Commerce 对资金与虚拟资产事实的所有权。
- [ADR-017](../../adr/ADR-017-rewards-boundary-and-event-driven-grant.md)：Rewards 的事件驱动奖励决策边界。
