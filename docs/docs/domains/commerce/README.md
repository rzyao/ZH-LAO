---
status: baseline
last_updated: 2026-08-30
---

# Commerce 域

Commerce 负责商品、会员、权益、订单、支付、退款、礼物和虚拟资产。

## 子域与实体

- Product：Product、Price。
- Membership：MembershipPlan、Subscription。
- Entitlement：EntitlementDefinition、UserEntitlement。
- Order：Order、OrderItem。
- Payment：Payment、PaymentTransaction。
- Refund：Refund。
- Gift：Gift、GiftTransaction。
- Wallet：Wallet、WalletTransaction。

## 业务基线

- Subscription、Payment、Entitlement 和 Reward 必须分离，不能使用 `is_vip`。
- 业务能力检查具体 Entitlement，不关心它来自购买、奖励或促销。
- 支付渠道通过 Commerce 边界隔离，可适配 Google Play、老挝支付或其他 Provider。
- 礼物可从聊天、主页和动态触发；商品、购买、赠送、接收和资产变化都由 Commerce 拥有。
- 金额使用 `amount_minor + currency`。
- Learning 的付费 AI 能力通过具体 Entitlement 授权，例如 `learning.translation.daily` 和 `learning.tts.premium_voice`；Learning 不检查 `user.vip`。

## 延期事项

支付渠道选择和礼物接收者能否兑换/获得收益均为 `deferred`。

## 数据库状态

实体和边界为 `baseline`；所有表、字段、账本规则、订单状态机、支付幂等和退款规则为 `designing`。
