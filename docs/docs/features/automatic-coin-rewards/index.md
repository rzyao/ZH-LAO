---
feature_id: automatic-coin-rewards
title: 自动 Coin 奖励
portfolio_status: active
domain:
- rewards
- commerce
- learning
- social
- identity
mobile_pages: []
admin_pages: []
delivery_evidence:
- docs/docs/domains/rewards/index.md
- docs/docs/domains/rewards/database.md
- docs/docs/domains/rewards/application-and-events.md
- docs/docs/adr/ADR-017-rewards-boundary-and-event-driven-grant.md
---

# 自动 Coin 奖励

## 功能概览

Portfolio Status：`active`。

本 Feature 覆盖可信业务事件进入 Rewards 后，按奖励计划 / 规则自动形成 Coin 奖励决策，并可靠交付给 Commerce 入账的主链。Rewards 负责“是否奖励、奖励多少、如何可靠交付”；最终 Coin 资产记账仍由 Commerce 负责。

当前 canonical V1 以五张 Rewards 表为主体：

- `rewards.reward_programs`：奖励计划 / 活动生命周期；
- `rewards.reward_rules`：事件匹配、条件、限额、奖励金额与规则版本；
- `rewards.reward_events`：来自可信 Source Domain 的业务事实；
- `rewards.reward_grants`：Rewards 已成立的正式奖励决策 / 权益事实；
- `rewards.reward_deliveries`：把 Grant 可靠、幂等交付给目标 Domain 的投递事实。

必须保持边界：**Reward Grant ≠ 最终资产到账事实**。`reward_grants.status=GRANTED` 只表示 Rewards 已确认奖励权益；即使 Grant 已成立，Delivery 仍可能处于 `PENDING` / `PROCESSING` / `RETRY_WAIT`。只有 Delivery 成功并取得 Commerce 返回的资产交易引用后，才可表达为资产已完成交付；Wallet / Ledger / balance 的最终资产事实属于 Commerce，不属于 Rewards。
