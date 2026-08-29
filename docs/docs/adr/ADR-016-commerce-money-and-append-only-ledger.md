---
status: frozen
date: 2026-08-30
---

# ADR-016：Commerce 独占资金事实，采用虚拟币钱包与只追加账本

## 背景

Commerce Domain 第一阶段设计（会话 `6a933931…`）需要确定：产品以「中国用户购买社交效率与虚拟礼物」为主要商业化方向，送礼、充值、退款涉及真钱与虚拟币两套资产。此前各域文档只给了实体名与「金额用 `amount_minor`」的原则，尚未确定 Commerce 的模型骨架，也未确定它与 Social / Chat / Reward 的资金职责边界。同时存在把「钱」散落到 Chat（送礼即时扣款）或用一张万能 `transactions` 表统一所有交易的诱惑。

## 决策

1. **Commerce 独占「钱与虚拟资产」的全部事实。** Social、Chat 不得自行处理资金。Chat 点击送礼只触发展示；余额校验、扣币、记账、生成赠礼记录、退款回收一律由 Commerce 完成。账务真相永远在 Commerce，Chat 的礼物消息只是展示事实。
2. **采用虚拟币钱包模型。** 真钱充值先兑换为 Coins 入账钱包，礼物等消费用 Coins 支付，而非「一次送礼即时扣一次真钱」。
3. **钱包余额是快照，账本是真相。** `commerce_wallets.balance` 只是为高性能读取保存的当前值；`commerce_wallet_ledger` 是不可变事实流水，遵循 append-only：正常业务只 `INSERT`，不 `UPDATE`、不 `DELETE`，纠错靠追加 Reversal。
4. **所有资产变化经统一入口。** 一律通过 `WalletService` 的单事务 `applyEntry/credit/debit/reverse`，禁止各业务 Service 直接 `UPDATE wallet`，禁止管理员直接改余额。
5. **Adjustment 与 Reversal 分离。** Adjustment 是无自然业务来源的人工/系统纠正凭证；Reversal 是针对某一笔既有 Ledger 的反向冲正，二者语义与审计链不同。
6. **历史用 Snapshot 固化。** `OrderItem`、`GiftSend` 保存当时的价格/名称/类型，历史交易不依赖可变的 Catalog 当前配置。
7. **Reward 是独立域，不落入 Commerce 表。** Reward 决定「是否奖励、奖励多少、由什么规则触发」，最终资产写入 Commerce 钱包，Ledger 以 `business_type = reward_grant` 逻辑引用 Reward 域发放记录；Commerce 不实现奖励规则。
8. **拒绝万能交易表。** 不建 `commerce_transactions` / `commerce_wallet_transactions`，Order、Payment、GiftSend、Refund 各为独立业务事实。
9. **V1 冻结 16 张业务表**（Catalog 4 / Ordering 3 / Payment 2 / Wallet 4 / Gifting 1 / Refund 2），会员、Subscription、Entitlement、促销、优惠券、提现、结算、多资产/冻结余额、Creator Earnings 等**明确延后**，不预留表。
10. **物理表示待统一裁决。** 会话以 `uuid` 主键、跨域不建 FK 给出 DDL，并假设「全项目一直采用 UUID」；这与全局 PostgreSQL 规范第 3 条（`bigint identity`，D-007）及 Chat 在 ADR-015 的「主键回归 identity」裁决冲突。本 ADR 只冻结上述**领域与账务模型**，主键类型与跨域 FK 策略**不在此决定**，交由主架构会话统一裁决（见未决事项）。

## 原因

- 资金与虚拟资产一旦散落到多个域，余额来源不可审计、极易出错；集中到 Commerce + 只追加账本能保证完整审计链与幂等。
- 虚拟币钱包把「法币支付」与「资产消费」解耦，符合产品「先充值、再用 Coins 送礼/互动」的形态，也便于未来复用同一钱包承载会员、Boost、道具。
- Snapshot 与 append-only 避免「改配置污染历史」「改流水破坏审计」两类典型账务事故。
- 明确拒绝万能表与提前建会员/钱包分桶，防止过度设计；把尚未冻结的物理约定隔离出来，避免单域会话擅自推翻跨域已定的全局规范。

## 影响

- Commerce V1 的 16 表业务/逻辑设计冻结，可进入实现；但 DDL 中的 UUID 主键与「跨域不建 FK」在裁决前不得直接落成 migration，也不得据此改动其他四个已用 `bigint identity` 的域或全局规范。
- 送礼闭环依赖 Outbox（`GiftSent`）可靠通知 Chat；Chat 侧展示集成仍 `deferred`（D-014 / D-054）。
- Entitlement 中心继续作为能力判定模型（ADR-005），其落表延后到后续 Commerce 修订。

## 事实源

- [Commerce 域](../domains/commerce/index.md)
- [Commerce 数据库 · Schema V1](../domains/commerce/database.md)「与全局 SQL 规范的关系」
- [PostgreSQL 总规范](../architecture/database.md)
- [ADR-005 Entitlement 统一权益](ADR-005-entitlement-centered-authorization.md)、[ADR-015 Chat SQL 规范裁决](ADR-015-chat-naming-and-sql-adjudication.md)
- [设计台账](../governance/design-register.md)、[未决事项](../governance/open-questions.md)
