---
status: frozen
last_updated: 2026-08-31
schema: commerce
---

# 商业（Commerce）

商业领域负责**真钱交易与虚拟资产的 canonical facts**：卖什么、用户是否完成支付、虚拟币如何到账、如何消费、如何纠错，以及退款后如何回收已发放资产。

V1 的核心闭环是：

```text
真钱购买 Coin Pack
↓
Order / Payment
↓
Wallet + Coins
↓
使用 Coins 赠送 Gift
↓
Wallet - Coins + GiftSend
↓
必要时 Refund / RefundRecovery
```

## 领域职责

| 负责 | 不负责 |
| --- | --- |
| Product / ProductPrice / CoinPack | 奖励规则与奖励资格判断 |
| Order / OrderItem / Fulfillment | Chat 消息业务事实 |
| Payment / PaymentEvent | Social 关系事实 |
| Wallet / Ledger | Creator Economy / 提现 / 结算（V1） |
| Adjustment / Reversal | 支付渠道自身内部实现 |
| Gift / GiftSend | Reward Grant / Delivery 生命周期 |
| Refund / RefundRecovery | 会员/Subscription/Entitlement 落表（V1 deferred） |

## 内部模块

```text
Commerce
├─ Catalog
├─ Ordering
├─ Payment / Refund
├─ Wallet / Ledger
└─ Gifting
```

V1 固定 16 张业务表，字段、约束和索引见 [数据设计](database.md)。

`infrastructure.system_outbox_events` 是共享基础设施，不计入 Commerce 业务表。

## 核心原则

1. **真钱与 Coins 是两种不同价值单位。** 真钱使用 `amount_minor + currency`，Coins 使用整数数量，不使用 `currency='COIN'`。
2. **Wallet Balance 不是唯一账务事实。** `wallets.balance` 是高效读取快照，真正的资产变化事实是 append-only Ledger。
3. **所有资产变化走统一 Wallet Service。** 不允许 Payment/Gift/Reward 各自直接 `UPDATE wallet`。
4. **历史使用 Snapshot。** 商品、价格、礼物改名或改价不能回写历史 OrderItem / GiftSend。
5. **Adjustment 与 Reversal 不同。** Adjustment 是主动纠正凭证；Reversal 是针对某一笔既有 Ledger 的反向冲正。
6. **GiftSend 是全系统礼物消费/转移的唯一 canonical fact。** Chat / Social 不复制第二份交易事实。
7. **Refund 与 RefundRecovery 分离。** 前者表达真钱退款，后者表达已发虚拟资产回收。
8. **跨领域只使用稳定 logical/public UUID。** 不引用其他领域 internal BIGINT，不建跨域物理 FK。
9. **交易历史不做普通物理删除。** Ledger / Adjustment / Reversal 更严格，只追加事实。
10. **不建万能交易表。** Order、Payment、GiftSend、Refund、Ledger 分别表达不同事实。

## V1 范围

V1 重点完成：

```text
Coin Pack Catalog
Order
Payment
Wallet / Ledger
Gift
GiftSend
Refund
RefundRecovery
```

以下能力明确延后，当前不建表：

```text
Subscription / Membership persistence
Entitlement persistence
Promotion / Coupon
Gift inventory / dynamic gift pricing
Creator earnings
Withdrawal / Settlement
Multi-asset wallet
Frozen / locked balance
通用 transactions 万能表
```

## 文档地图

- [购买、支付与退款](purchase-and-payment.md)：Catalog、Order、Payment、Fulfillment、Refund。
- [钱包与账本](wallet.md)：Balance、Ledger、Adjustment、Reversal、RefundRecovery。
- [礼物](gifting.md)：Gift 定义、GiftSend、扣币和交易快照。
- [工作流与状态机](lifecycle.md)：状态集合、事务边界、并发与幂等规则。
- [契约与边界](contracts.md)：Identity、Rewards、Chat、Asset、Operations 等跨领域协作。
- [数据设计](database.md)：16 张表的完整物理模型。
