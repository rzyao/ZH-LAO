---
status: designing
last_updated: 2026-08-30
schema: commerce
---

# Commerce 数据库待设计项

预期表达 Product、Price、MembershipPlan、Subscription、EntitlementDefinition、UserEntitlement、Order、OrderItem、Payment、PaymentTransaction、Refund、Gift、GiftTransaction、Wallet 和 WalletTransaction。

必须保证金额非浮点、支付与权益分离、账本可审计、GiftMessage 只持有交易引用。UserEntitlement 应能表示 Learning Translation/TTS 等具体能力，而非抽象 VIP 标记。表结构、状态机、Provider 原始响应 JSONB、幂等键和账务约束尚未决定。
