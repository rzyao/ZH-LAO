---
feature_id: reward-operations
title: 奖励计划 / 规则 / 发放监控后台
portfolio_status: active
domain:
- rewards
- commerce
- operations
mobile_pages: []
admin_pages: []
delivery_evidence:
- docs/docs/domains/rewards/index.md
- docs/docs/domains/rewards/application-and-events.md
- docs/docs/domains/rewards/database.md
- docs/docs/adr/ADR-017-rewards-boundary-and-event-driven-grant.md
---

# 奖励计划 / 规则 / 发放监控后台

## 功能概览

Portfolio Status：`active`。

本 Feature 是 Rewards 的运营控制面，围绕奖励计划、规则、事件、Grant 与 Delivery 的查询、生命周期管理和异常处置提供后台能力。它负责管理 Rewards 决策与投递，不负责直接修改用户 Coin 余额、Wallet Ledger、充值、退款或其它 Commerce 资产事实。

后台必须沿用 canonical 五表：`reward_programs`、`reward_rules`、`reward_events`、`reward_grants`、`reward_deliveries`。其中 `reward_grants` 表示奖励权益 / 决策已成立，**不是最终资产到账事实**；Delivery 成功后可以关联 Commerce 返回的资产交易引用，但 Rewards Admin 不因此取得修改 Commerce Wallet / Ledger 的职责。
