---
status: frozen
last_updated: 2026-08-31
---

# 工作流与状态机

本页集中定义 Commerce V1 的状态集合、关键事务、并发和幂等不变量。

## 状态集合

| 对象 | 状态 |
| --- | --- |
| Order | `pending_payment / paid / cancelled / expired / refunded` |
| Payment | `pending / processing / succeeded / failed / cancelled / partially_refunded / refunded` |
| Order Fulfillment | `pending / processing / succeeded / failed / cancelled` |
| Refund | `pending / processing / succeeded / failed / cancelled` |
| Refund Recovery | `pending / processing / succeeded / failed` |
| GiftSend | `succeeded / reversed` |

Wallet Adjustment / Reversal 是本地成功事实，不维护进行中状态。

## 购买主流程

```text
Coin Pack
↓
Order pending_payment
↓
Payment pending / processing
↓
Provider verified success
↓
Payment succeeded
↓
Order paid
↓
Fulfillment
↓
Wallet Credit + Ledger
↓
Fulfillment succeeded
```

Payment Success 与 Fulfillment Success 是两个不同事实。

## 退款主流程

```text
Succeeded Payment
↓
Refund pending / processing
↓
外部真钱退款
↓
Refund succeeded
↓
RefundRecovery
↓
Wallet Debit + Ledger
↓
Recovery succeeded / failed
```

Refund 成功而 Recovery 失败是允许存在的真实异常状态。

## 送礼主流程

```text
Gift available
↓
验证业务资格
↓
Lock Wallet
↓
余额足够
↓
GiftSend + Ledger Debit + Balance Update
↓
COMMIT
↓
GiftSend succeeded
```

失败请求不留下伪成功 GiftSend。

## 必须同事务的操作

以下事实必须原子提交：

- Wallet Ledger Entry + Wallet Balance Update；
- Coin Pack Fulfillment + Wallet Credit + Ledger；
- GiftSend + Wallet Debit + Ledger；
- Wallet Adjustment + Ledger + Balance；
- Wallet Reversal + Ledger + Balance；
- RefundRecovery + Wallet Debit + Ledger；
- 需要可靠发布时的业务事实 + Outbox Row。

不能用多个独立数据库提交拼成“最终看起来一致”的资金流程。

## Application Service 保证的跨表规则

以下规则不通过跨实体 Trigger 隐式实现，由 Application Service 在事务中裁决：

- Product Type 与 CoinPack 类型一致；
- 同一 Product / Channel / Currency 的有效价格满足业务唯一性；
- Order Subtotal 等于 OrderItem Subtotal 汇总；
- OrderItem Price 属于同一 Product；
- Payment Amount/Currency 与 Order 匹配；
- Payment Success 来自可信 Provider 验证；
- 只有 Paid Order 才能 Fulfill；
- Ledger User 与 Wallet User 一致；
- Reversal Amount 是原 Ledger 的严格反数；
- 不能 Reversal 一个 Reversal；
- 一笔原 Ledger 最多一次 V1 Reversal；
- 累计 Refund 不超过 Payment；
- RefundRecovery 只能基于成功 Refund；
- Gift Cost 由服务端读取；
- Wallet Mutation 不信任客户端提交的余额或最终价格。

数据库通过 FK、UNIQUE、CHECK、Row Lock 等守护结构与并发基础不变量。

## 并发

资金路径必须考虑至少这些 Race：

```text
两个并发 GiftSend 花同一份余额
同一 Payment Provider Event 重放
同一 Fulfillment 重放
同一 Reward Delivery 重放
同一 Refund 重放
同一 RefundRecovery 重放
同一 Ledger 并发 Reversal
Adjustment / Gift / Recovery 并发修改同一 Wallet
```

需要基于锁后的当前状态做决策，而不是先读 Balance 再在稍后事务里盲写。

## 幂等

外部 Provider Event、Payment、Fulfillment、Reward Delivery、Refund/Recovery 等所有可能重复到达的路径必须有稳定幂等来源。

重复请求的结果应是：

```text
返回/识别既有 canonical fact
或稳定拒绝冲突
```

不能重复产生资产变化。

## Ledger 不变量

```text
Ledger append-only
Balance 与 Ledger Mutation 同事务
每个业务资产变化有稳定 business_type + business_id
跨领域 business_id 使用 logical UUID
```

## 交易 Snapshot

OrderItem 与 GiftSend 等历史交易事实必须保存足够 Snapshot，使历史不依赖当前 Catalog 配置。

```text
历史事实
≠
当前商品/礼物配置的动态 Join 结果
```

## 测试要求

至少覆盖：

- 合法/非法状态转换；
- Provider Duplicate Event；
- Payment Success 但 Fulfillment Failure；
- Refund Success 但 Recovery Failure；
- 并发 Debit；
- 余额不足；
- Duplicate Fulfillment；
- Duplicate Reward Delivery；
- Double Reversal；
- 累计 Refund 上限；
- Gift Price 客户端篡改无效；
- 事务任一步失败时不产生半完成 Wallet/Gift/Order 状态。
