---
status: frozen
last_updated: 2026-08-31
---

# 购买、支付与退款

本页定义 Commerce V1 中从商品目录到订单、支付、履约和退款的真钱交易链路。

## Catalog

V1 的真钱可购买商品主要是 Coin Pack。

```text
Product
↓
ProductPrice
↓
CoinPack
```

Product 与 Gift 分离：

- Product 表达可用真钱购买的商品；
- Gift 表达用 Coins 消费的虚拟礼物；
- Gift 不依赖 Product 作为其交易价格事实。

价格变更只影响未来交易。历史订单必须保存当时的商品/价格快照。

## Order

典型购买流程：

```text
选择 Coin Pack
↓
创建 Order
↓
创建 OrderItem Snapshot
↓
等待 Payment
```

OrderItem 必须保存下单时需要长期审计的商品、数量、金额等快照。

Catalog 后续修改名称或价格不能回算历史 OrderItem。

### Order 状态

```text
pending_payment
paid
cancelled
expired
refunded
```

`paid` 只表示支付层面成功，不等价于虚拟资产已经履约完成。

## Payment

Payment 只表达真钱支付事实。

### 状态

```text
pending
processing
succeeded
failed
cancelled
partially_refunded
refunded
```

支付成功必须基于服务端可信 Provider 结果，不能相信客户端自报“支付成功”。

Provider 原始事件通过 PaymentEvent 保留必要事实并用于幂等、追踪和异常处理。

## Fulfillment

Order Fulfillment 表达支付成功后将所购虚拟资产真正交付给用户。

状态：

```text
pending
processing
succeeded
failed
cancelled
```

只有已经支付成功且满足业务规则的 Order 才能进入 Fulfillment。

Coin Pack Fulfillment 最终通过统一 Wallet Service 产生：

```text
Wallet Credit
+
Ledger Entry
```

Fulfillment 本身不能绕过 Wallet Service 直接改余额。

## 真钱金额

真钱统一使用：

```text
amount_minor bigint
currency varchar(3)
```

金额不使用 float。

Coins 不作为 Currency 塞入这套模型。

## Refund

Refund 只回答：

> 对外部支付的钱是否已经成功退回？

状态：

```text
pending
processing
succeeded
failed
cancelled
```

V1 产品规则：Coin Pack 只支持全额退款；数据库模型允许未来演进，但 Service 必须保证累计退款金额不超过原 Payment。

## Refund 与资产回收分离

支付退款成功后，不代表已经把此前发放的 Coins 成功收回。

因此：

```text
Refund
= 真钱退款事实

RefundRecovery
= 虚拟资产回收事实
```

允许出现：

```text
Payment = refunded
RefundRecovery = failed
```

这表达真实异常，不应通过修改 Payment 状态掩盖。

资产回收规则见 [钱包与账本](wallet.md)。

## 历史与删除

Order、Payment、PaymentEvent、Fulfillment、Refund 等交易事实不做普通物理删除。

需要纠错时增加新的事实或状态变化，不通过删除历史记录让交易“像没发生过”。

## Provider 边界

具体支付渠道属于外部集成，当前业务模型不绑定某一家 Provider。

Provider Adapter 负责把外部结果转成稳定 Commerce Payment / Refund 语义。

客户端不得接触 Provider Secret，也不得直接决定服务端 canonical Payment Status。
