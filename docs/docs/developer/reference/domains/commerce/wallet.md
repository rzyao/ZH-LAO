---
status: frozen
last_updated: 2026-08-31
---

# 钱包与账本

Wallet 是用户当前 Coin Balance 的高效读取入口，Ledger 是资产变化历史的 canonical fact。

## 单资产钱包

V1 一个用户一个 Coin Wallet：

```text
user_id
balance
```

当前不支持：

```text
多资产
available / locked / bonus / paid 分桶
余额冻结
提现余额
```

出现第二种资产或预授权/竞拍/提现需求时再升级模型。

## Balance 与 Ledger

```text
Wallet.balance
= 当前余额快照

WalletLedger
= 为什么余额变成现在这样的 append-only 事实
```

正常业务不得只改 `wallets.balance` 而不产生对应 Ledger Entry。

## 统一资产变化入口

所有 Coin 变化必须经过统一 Wallet Service：

```text
credit
debit
reverse
applyEntry
```

典型事务：

```text
BEGIN
1. Lock Wallet
2. Validate business preconditions
3. Validate sufficient balance when debit
4. INSERT Ledger
5. UPDATE Wallet balance
6. INSERT related same-transaction business fact if required
7. INSERT Outbox if required
COMMIT
```

Payment、Gift、Rewards、RefundRecovery 等路径都不能各自直接 `UPDATE wallet`。

## Ledger

Ledger 正常业务只追加：

```text
INSERT
NO UPDATE
NO DELETE
```

当前稳定 `business_type`：

```text
order_fulfillment
reward_delivery
gift_send
wallet_adjustment
wallet_reversal
refund_recovery
```

`business_id` 指向对应业务事实的稳定逻辑 UUID；跨领域时不建物理 FK。

Ledger 的 User 必须与其 Wallet 的 User 一致。

## Adjustment

Adjustment 用于**没有自然业务来源**的主动账务纠正，例如：

```text
客服补偿 +60
误发回收 -900
```

它是独立成功凭证，可正可负。

管理员不能绕开 Adjustment 直接修改 Wallet Balance。

## Reversal

Reversal 是针对某一笔既有 Ledger Entry 的反向冲正。

规则：

- Amount 必须等于原 Ledger Amount 的相反数；
- 一笔原 Ledger 最多被 Reversal 一次；
- 不能 Reversal 一个 Reversal；
- V1 不支持部分 Reversal；
- Reversal 自己产生新的 Ledger Entry；
- 原 Ledger 永远保留。

因此纠错结果类似：

```text
原 Ledger       -100
Reversal Ledger +100
```

而不是把原记录修改成 0。

## Adjustment 与 Reversal

```text
Adjustment
→ 主动建立一笔没有自然业务来源的纠正事实

Reversal
→ 对已有 Ledger 做严格反向冲正
```

两者不能混用。

## RefundRecovery

RefundRecovery 负责外部真钱退款成功后的虚拟资产回收。

状态：

```text
pending
processing
succeeded
failed
```

只有对应 Refund 已成功后才允许执行 Recovery。

Recovery 通过 Wallet Service 产生 Debit / Ledger，不直接修改 Balance。

如果用户当前余额不足以安全回收，系统应保留 Recovery Failure 事实，不通过让 Wallet 变成非法负数来假装成功。

## 余额不变量

V1 Wallet 不允许因为正常 Gift、RefundRecovery、Adjustment/Reversal 等受控业务路径违反定义的余额不变量。

任何 Debit 必须在事务锁定后的当前余额上裁决，不能依赖事务外 stale read。

## 并发

至少需要防止：

- 两个并发 GiftSend 同时花掉同一份余额；
- Fulfillment 重放重复 Credit；
- Reward Delivery 重放重复 Credit；
- RefundRecovery 重放重复 Debit；
- 同一 Ledger 被并发 Reversal 两次；
- Adjustment / Reversal 与其他 Wallet Mutation 静默覆盖 Balance。

机制由 Transaction、Row Lock、Unique Constraint 和业务幂等键共同保证。

详细状态与事务要求见 [工作流与状态机](lifecycle.md)。
