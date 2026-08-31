---
status: frozen
last_updated: 2026-08-31
---

# 契约与边界

本页定义 Commerce 与 Identity、Rewards、Chat、Social、Operations、Asset Infrastructure 和外部 Payment Provider 的稳定边界。

## Identity

Commerce 中的用户引用使用 Identity 的稳定 logical/public UUID。

```text
user_id UUID
NO cross-domain FK
NO Identity internal BIGINT
```

Commerce 不拥有登录身份、Session 或用户账号状态。

## Rewards

职责分工：

```text
Rewards
→ 决定为什么奖励、奖励多少、是否应该交付
→ Reward Grant / Reward Delivery

Commerce
→ 真正把 Coin 记入 Wallet / Ledger
```

Rewards 不得直接：

```text
UPDATE commerce.wallets
INSERT commerce.wallet_ledger
```

Commerce 接收稳定 Reward Delivery logical UUID 作为幂等/业务引用，并在 Wallet Transaction 内完成资产入账。

Ledger：

```text
business_type = reward_delivery
business_id   = Reward Delivery logical UUID
```

不建立跨领域物理 FK。

## Chat

GiftSend 交易事实属于 Commerce。

```text
Chat
→ 可以触发送礼意图
→ 可以展示已完成的 GiftSend 结果

Commerce
→ 校验 Gift、余额和交易输入
→ 扣 Coins
→ 写 Ledger
→ 创建 GiftSend
```

Chat 不复制完整 GiftSend 交易数据作为第二 canonical fact。

如果未来 Chat 需要引用送礼结果，应使用 `gift_send_id` logical UUID 或稳定查询/事件契约。

具体“礼物是否表现为 Message”必须由 Chat- Commerce 集成设计决定，当前不从 Commerce 自动推导。

## Social / Trust & Safety

如果某 Commerce 动作需要关系资格或平台限制判断，可以消费 Social / Trust & Safety Public Contract。

Commerce 不复制 Follow、Match、Block 或 Enforcement 当前状态作为自己的长期 canonical fact。

## Asset Infrastructure

商品图、礼物图等媒体引用使用：

```text
image_asset_id UUID
```

Commerce 不保存第二份 Object Storage Provider、Bucket、Object Key 等 canonical metadata。

## Operations

后台调整、退款管理、Catalog 管理等管理动作可以引用 Operations Operator logical UUID。

Operations 负责：

- Operator Resolution；
- RBAC；
- 后台成功操作 Audit。

Commerce 负责：

- 当前订单/钱包/退款/礼物状态是否允许该管理动作；
- canonical Commerce Mutation；
- 资金与资产不变量。

Operations 不直接 SQL 修改 `commerce.*`。

## Payment Provider

外部 Provider 的原始标识（如 Provider Payment ID）是外部系统标识，可使用适合 Provider 的字符串类型，不强制转换为项目 logical UUID。

Provider Adapter 负责：

```text
认证外部事件来源
解析 Provider 状态
去重重复 Event
映射为稳定 Payment / Refund 语义
隔离 Provider-specific payload
```

Provider Secret 不进入客户端或普通业务 Event。

## Outbox

需要发布的 Commerce Event 使用全系统共享：

```text
infrastructure.system_outbox_events
```

不创建 Commerce 私有 Outbox Table。

资产 Mutation 与其对应的可靠 Event Row 必须同事务提交。

## 跨领域标识

以下跨领域字段使用稳定 logical/public UUID：

```text
user_id
conversation_id
image_asset_id
operator_id
reward_delivery business_id
其他 owner-domain entity reference
```

禁止：

- 跨领域 physical FK；
- 引用其他 Domain internal BIGINT；
- 通过跨 Schema SQL 读取/修改对方 canonical state。

## 明确不建立

Commerce V1 不建立：

```text
commerce_rewards
Chat-owned canonical Gift Transaction
Social-owned canonical Gift Transaction
万能 Cross-domain Transaction Table
独立 Commerce Outbox
```

会员/Subscription/Entitlement 的业务边界仍属于 Commerce 方向，但 V1 数据落表延后，不能假设当前已有相应 persistence contract。

全局跨领域规则见 [领域依赖与协作](../../architecture/domains/dependencies.md)。
