---
status: frozen
last_updated: 2026-08-31
---

# 礼物

Gift 是用 Coins 消费的虚拟礼物定义；GiftSend 是一次成功礼物消费/转移的 canonical business fact。

## Gift 与 Product 分离

```text
Product
= 用真钱购买的商品

Gift
= 用 Coins 消费的礼物
```

V1 不通过 `gift.product_id` 把 Gift 强行建模为真钱商品。

Gift 的当前 Coin Price 由服务端业务配置读取，客户端不能提交一个可被信任的最终扣币价格。

## GiftSend

`commerce_gift_sends` 是全系统礼物消费/转移的唯一 authoritative fact。

它至少表达：

```text
sender
receiver
gift
quantity
coin_cost
交易时 Snapshot
关联上下文 logical IDs
成功/冲正状态
```

Chat / Social 不复制 sender、receiver、gift、quantity、coin cost 等可独立演化的交易事实。

## GiftSend 状态

```text
succeeded
reversed
```

余额不足、Gift 不可用、业务关系不允许等失败请求不创建“failed GiftSend”作为正常交易事实；请求事务直接失败。

## 送礼事务

成功送礼必须原子提交：

```text
BEGIN
1. Validate Gift current availability
2. Resolve authoritative Coin cost
3. Validate sender / receiver / relationship requirements
4. Lock sender Wallet
5. Validate sufficient balance
6. INSERT GiftSend
7. INSERT Wallet Ledger debit
8. UPDATE Wallet balance
9. INSERT GiftSent Outbox event（如冻结契约要求）
COMMIT
```

不能出现：

```text
GiftSend succeeded 但余额未扣
余额已扣但 GiftSend 不存在
```

## Snapshot

Gift 后续改名、换图、改价不能改变历史 GiftSend 的审计含义。

因此 GiftSend 保存交易时需要长期解释的 Snapshot。

历史 Snapshot 是交易事实，不是当前 Catalog 的复制缓存。

## GiftSend Reversal

正式冲正后 GiftSend 可以进入：

```text
reversed
```

资产纠错仍通过 Wallet Reversal / Ledger 体系表达，不通过直接修改或删除原 GiftSend、原 Ledger。

## 与 Chat 的边界

```text
Chat UI 触发“送礼”
↓
Commerce 执行 GiftSend + Wallet Mutation
↓
Commerce 返回 / 发布成功事实
↓
Chat 可展示送礼结果
```

Chat 不负责：

- 检查 Commerce Wallet Balance；
- 扣 Coins；
- 计算 authoritative Gift Price；
- 创建第二份 GiftSend；
- 回滚 Commerce Ledger。

Chat 是否把送礼结果表现为某种消息/系统展示属于 Chat- Commerce 集成契约，不能改变 GiftSend 的事实所有权。

## 与 Social 的边界

如果送礼要求当前存在某种关系资格，Commerce 可以消费 Social 的公开事实做前置判断，但不能复制 Follow / Match 状态进 Commerce 作为第二事实源。

## 当前不做

V1 不建立：

```text
Gift Inventory
Gift Dynamic Price History 独立模型
Creator Earnings
Receiver Withdrawal
Settlement
Gift Marketplace
```

礼物接收者未来是否获得积分、收益或可提现资产属于独立后续产品设计，不能从 GiftSend 自动推导。
