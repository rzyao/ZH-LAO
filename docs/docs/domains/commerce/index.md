---
status: frozen
last_updated: 2026-08-30
source: 设计 Commerce Domain
source_conversation_id: 6a933931-27f8-83ea-9df3-b054d2bca5fe
source_share_url: https://chatgpt.com/share/6a933931-27f8-83ea-9df3-b054d2bca5fe
---

# Commerce 域

Commerce 负责「钱与虚拟资产」的全部事实：卖什么、用户是否付了钱、商品权益是否发放、用户现在有多少 Coins 以及为什么、Coins 如何被消费/纠错/因退款回收。

> 关键边界：**不让 Social 域或 Chat 域自己处理钱。** 聊天界面点击「送礼物」，Chat 只负责触发展示；检查余额、扣币、记账、生成赠礼记录全部由 Commerce 完成。账务事实永远以 Commerce 为准，Chat 里的礼物消息只是展示事实。

## V1 范围（本会话冻结）

Commerce 第一阶段不是传统电商，而是支撑这条闭环：

```text
用户充值 / 购买虚拟币（Coins）
→ 使用 Coins 购买并赠送礼物
→ 全程可审计、可退款/补偿、账务不出错
```

第一阶段采用**虚拟币钱包模型**，不做「送一朵玫瑰就即时扣一次真钱」的设计：

```text
支付 ¥6 → 购买 60 Coins → Wallet +60
用户送玫瑰 → Wallet −10 → 产生 GiftSend
```

以后新增会员、Boost、超级喜欢、解锁功能、活动道具等仍可复用同一套 Commerce 结构，但**不在 V1 建表**（见「延期事项」）。

## 内部模块

```text
Commerce Domain
├── Catalog    ：Product、ProductPrice、CoinPack、Gift
├── Ordering   ：Order、OrderItem、OrderFulfillment
├── Payment    ：Payment、PaymentEvent、Refund、RefundRecovery
├── Wallet     ：Wallet、WalletLedger、WalletAdjustment、WalletReversal
└── Gifting    ：GiftSend
```

对应 16 张业务表（表级、字段级设计见 [Commerce 数据库](database.md)）：

| 模块 | 表 |
| --- | --- |
| Catalog | `commerce_products`、`commerce_product_prices`、`commerce_coin_packs`、`commerce_gifts` |
| Ordering | `commerce_orders`、`commerce_order_items`、`commerce_order_fulfillments` |
| Payment | `commerce_payments`、`commerce_payment_events` |
| Wallet | `commerce_wallets`、`commerce_wallet_ledger`、`commerce_wallet_adjustments`、`commerce_wallet_reversals` |
| Gifting | `commerce_gift_sends` |
| Refund | `commerce_refunds`、`commerce_refund_recoveries` |

`system_outbox_events` 属**系统基础设施**，不归属 Commerce，不计入这 16 张。

## 核心业务规则（冻结）

- **商品与礼物分离。** `commerce_products` 只表示「可用真钱购买的商品」（V1 实际只有 Coin Pack）；`commerce_gifts` 是独立模型，表示「用 Coins 消费的对象」，礼物**不再**通过 `commerce_gifts.product_id` 依赖商品表。此前设想的 `products 1:0..1 gifts` 关系已按此收敛。
- **钱包不是单字段余额。** `commerce_wallets.balance` 只是为高性能读取保存的当前快照，真正的资金事实是 `commerce_wallet_ledger`。
- **账本只追加。** Ledger 正常业务只 `INSERT`，不 `UPDATE`、不 `DELETE`。改错通过追加 Reversal 冲正，保留 −100/+100 两个事实以便完整审计。
- **所有资产变化统一入口。** 不出现 `GiftService`/`RewardService`/`PaymentService` 各自 `UPDATE wallet`；一律经 `WalletService`（`credit/debit/reverse` 或 `applyEntry`）在单事务内锁钱包、校验余额、写 Ledger、更新余额。`Ledger.user_id` 必须与 `Wallet.user_id` 一致。
- **历史靠 Snapshot，不靠当前配置。** `OrderItem` 与 `GiftSend` 必须保存下单/送礼当时的价格、名称、类型等快照；Catalog 改名改价不得回算历史记录。
- **Adjustment vs Reversal 语义不同。** `Adjustment` 是没有自然业务来源时的人工/系统主动账务纠正凭证（可正可负，如客服补偿 +60、误发回收 −900）；`Reversal` 是针对**某一笔已存在 Ledger** 的反向冲正，金额必须是原流水的相反数，不能冲正一个 Reversal，一笔原流水最多冲正一次，V1 不支持部分冲正。二者都只保存成功事实（本地事务，无 status）。绝不允许管理员直接 `UPDATE commerce_wallets`。
- **Ledger `business_type` 收口为六个完整业务名**（不使用 `purchase`/`reward` 等模糊名）：`order_fulfillment`、`reward_grant`、`gift_send`、`wallet_adjustment`、`wallet_reversal`、`refund_recovery`。
- **Reward 是独立域，Commerce 不建 `commerce_rewards`。** Reward 域决定「为什么奖励、奖励多少、是否满足条件」，最终资产发放写入 Commerce Wallet/Ledger（`business_type = reward_grant`，`business_id` 指向 Reward 域的发放记录）；Commerce 只负责把这笔奖励资产安全记账，不拥有奖励规则。
- **GiftSend 只有成功/冲正。** 余额不足、礼物下架、关系不允许等直接事务失败、不落库；只有真实成功赠礼才 INSERT，状态 `succeeded`，正式冲正后 `reversed`。送礼事务必须一次提交：`GiftSend + Wallet debit + Ledger + Outbox GiftSent`。
- **Refund 与 RefundRecovery 绝不合并。** Refund 回答「外部真钱退款是否成功」，RefundRecovery 回答「已发给用户的虚拟资产是否回收成功」。系统允许真实异常状态并存（如 `Payment refunded` 但 `RefundRecovery failed`），这不是不一致。V1 产品规则：Coin Pack 只支持全额退款（表结构允许未来部分退款），Service 保证累计退款 ≤ 原 Payment。
- **两套金额严格分开。** 真钱用 `amount_minor bigint + currency varchar(3)`；Coins 用 `bigint`（`coin_amount`/`coin_cost`/`amount`），**不使用 `currency='COIN'`**——Coin 不是法币，不塞进同一 monetary amount 模型。
- **V1 单资产钱包。** 一个用户一个 Coin Wallet、一个 `balance`；不做多资产、不做 `available/locked/bonus/paid` 分桶、不做余额冻结（GiftSend 直接事务扣款）。出现第二种资产或提现/竞拍/预授权需求时再升级。
- **不建万能交易表。** 拒绝 `commerce_transactions`、`commerce_wallet_transactions` 这类统一所有交易的中转表；Order、Payment、GiftSend、Refund 各是不同业务事实，分领域建模更可靠。
- **交易类表不做普通物理删除**；Ledger/Adjustment/Reversal 更严格，正常业务不可 UPDATE、不可 DELETE。
- **交易表适度冗余 `user_id`**（客服、运营、账单、审计大量 `WHERE user_id = ?`），且交易事实应能自证归属；冗余字段由应用服务写入，不信任客户端。

## 状态机（冻结，均以 `varchar + CHECK` 表达）

- `commerce_orders.status`：`pending_payment / paid / cancelled / expired / refunded`（不含 `completed/fulfilled`，履约由 Fulfillment 表达；`paid` 只代表支付层面成功）。
- `commerce_payments.status`：`pending / processing / succeeded / failed / cancelled / partially_refunded / refunded`（只表达钱，不含 `fulfilled/coins_granted`）。
- `commerce_order_fulfillments.status`：`pending / processing / succeeded / failed / cancelled`。
- `commerce_refunds.status`：`pending / processing / succeeded / failed / cancelled`。
- `commerce_refund_recoveries.status`：`pending / processing / succeeded / failed`。
- `commerce_gift_sends.status`：`succeeded / reversed`。
- Adjustment / Reversal 无 status（本地事务，只存成功事实）。

## 必须同事务 / 由应用层保证的跨表规则（冻结）

这些规则不用 Trigger 强塞进数据库，正式由 Application Service 保证：Product 类型匹配 CoinPack、同一 Product+Channel+Currency 同时只允许一个有效价、`Order.subtotal = Σ OrderItem.subtotal`、OrderItem 的 Price 属于同一 Product、Payment 金额/币种匹配 Order、成功支付须经服务端 Provider 验证、只有已付 Order 才能 Fulfillment、Wallet 操作使用行锁/原子保护、Ledger 与 Wallet 的 user 一致、Adjustment/Reversal/GiftSend/Fulfillment/Recovery 与 Ledger+Wallet 同事务、Reversal 金额相反且不冲正 Reversal、累计 Refund ≤ Payment、Recovery 仅在 Refund 成功后执行、Wallet 永不因退款/冲正/调整变负、GiftSend 价格由服务端读取。完整清单见 [Commerce 数据库](database.md)。

## V1 明确不建（deferred）

以下能力等真实业务需求出现再设计，V1 不建、不预留表：

```text
commerce_subscriptions   commerce_promotions   commerce_coupons
commerce_gift_prices     commerce_gift_inventory
commerce_creator_earnings commerce_withdrawals commerce_settlements
commerce_wallet_debt / _asset_accounts / _frozen_balances
commerce_transactions（万能表）  commerce_wallet_transactions（万能表）
commerce_reward*（Reward 属独立域）
```

**会员 / Subscription / Entitlement 表在 V1 收缩范围之外**：业务模型仍需要 Entitlement 中心（见 [ADR-005](../../adr/ADR-005-entitlement-centered-authorization.md)），但其数据库落表延后到后续 Commerce 修订；V1 先把「充值—钱包—礼物—支付—退款」闭环冻结。

## 其他延期事项（deferred）

- 支付渠道选择与中老两侧具体接入（Apple/Google/微信/支付宝等）为 `deferred`；Provider 通过 Payment/PaymentEvent 边界隔离。
- 礼物接收者能否获得积分、兑换或收益为 `deferred`，**不得预设为 Creator Economy**。
- Chat 侧如何展示送礼结果（GiftSent 消费、是否落 Chat 消息）为 `deferred`，见 D-014/D-054 与 [Chat 域](../chat/index.md)。

## 与全局数据库规范的关系（重要，见 ADR-016 / 未决事项）

Commerce V1 的 DDL 由会话以 **UUID 主键 + 跨域不建 FK** 的形式给出，并假设「整个项目一直采用 UUID」。这与本项目的既有冻结基线**冲突**：全局 PostgreSQL 规范第 3 条要求 `bigint generated always as identity` 主键（D-007），且 Chat 已在 ADR-015 / D-055 明确「主键回归 identity」、Identity/Learning/Social/Chat 四域实际都用 `bigint identity`。因此：

- 上述**业务模型、模块、16 表清单、语义、状态机、业务规则均 `frozen`**；
- **物理表示（主键类型、跨域是否建 FK、`business_id` 类型）标记为 `designing`，提交主架构会话统一裁决**，本文档与 [Commerce 数据库](database.md) 不擅自把它改成 UUID 也不擅自改回 bigint。详见 [未决事项](../../governance/open-questions.md) 与 [ADR-016](../../adr/ADR-016-commerce-money-and-append-only-ledger.md)。
