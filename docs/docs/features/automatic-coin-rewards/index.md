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
status:
  design: done
  backend: todo
  admin: na
  mobile: todo
  integration: todo
  acceptance: todo
evidence:
  design:
    - docs/docs/domains/rewards/index.md
    - docs/docs/domains/rewards/database.md
    - docs/docs/domains/rewards/application-and-events.md
    - docs/docs/adr/ADR-017-rewards-boundary-and-event-driven-grant.md
mobile_pages: []
admin_pages: []
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

## 设计

状态：done

- **Scope**：定义可信事件摄取、按 `occurred_at` 匹配 Program / Rule、条件与限额判定、Grant 决策、Delivery 编排，以及与 Commerce 资产入账之间的跨域边界；V1 仅支持 `COIN` + `ASSET_CREDIT` → `COMMERCE`。
- **Stage / Artifact**：当前有效设计工件为 `docs/docs/domains/rewards/` 下冻结后的 canonical Rewards 文档，以及 `ADR-017-rewards-boundary-and-event-driven-grant.md`。Feature Page 不复制领域状态机和字段级契约。
- **Gate / Evidence**：canonical 已明确五表模型、Grant / Delivery 分离、事件驱动与幂等边界；`ADR-017` 固化“Rewards 决策与投递、Commerce 资产记账”的职责分界。仓库当前未发现独立的 `REWARDS_DESIGN_GATE` 文件，因此不虚构额外 Gate。
- **Next Action**：Backend 开工时直接落实现有 canonical，不新增 Rewards Wallet / Ledger，不把 `GRANTED` 解释为“Coin 已到账”。

## Backend

状态：todo

- **Scope**：实现可信 Source Domain Event 消费、`reward_events` 幂等落库、Rule 匹配与限额判定、Grant + Delivery 同事务创建、Delivery Worker、重试 / 取消，以及调用 Commerce Asset Credit Port。
- **Stage / Artifact**：仓库已有 `database/migrations/1000_rewards.sql`，已落盘 `reward_programs`、`reward_rules`、`reward_events`、`reward_grants`、`reward_deliveries` 五表和 V1 约束；但当前未发现 Rewards Backend Stage、Rewards 应用模块、API / Consumer / Worker 或对应测试工件。
- **Gate / Evidence**：现有 migration 证明数据库基线已存在，但数据库表存在不等于 Backend Lane 已完成，也不证明 Source Event → Grant → Delivery → Commerce 的运行链路已实现。
- **Next Action**：创建真实 Rewards Backend Stage，按 canonical 实现事件消费、规则执行、Grant / Delivery 原子写入、幂等 Delivery Worker 与测试，再以 Backend Gate 证明行为契约。

## Admin

状态：na

- **Scope**：自动奖励本身不设置独立 Admin 交付面；奖励计划 / 规则配置、事件 / Grant / Delivery 查询与异常处理统一归入 `reward-operations` Feature。
- **Stage / Artifact**：本 Feature 的 `admin_pages` 为空，当前没有应由 `automatic-coin-rewards` 单独承载的 Admin Page。
- **Gate / Evidence**：不适用。Rewards design 完成不能推导出 Admin 已完成；该能力的 Admin 状态以 `reward-operations` 为准。
- **Next Action**：无独立 Admin 动作；后续运营能力只在 `reward-operations` 中推进并回填真实页面 / Stage / Gate。

## Mobile

状态：todo

- **Scope**：面向用户展示与自动 Coin 奖励相关的可见结果 / 记录时，只消费公开 Rewards / Commerce 契约，不在客户端自行判定奖励或资产到账。
- **Stage / Artifact**：canonical 描述了 C 端奖励记录读取方向，但当前 `mobile_pages` 为空，未发现对应 Mobile Stage 或页面工件。
- **Gate / Evidence**：暂无 Mobile 实现与验收证据。
- **Next Action**：在 Backend 契约稳定后再定义 / 实现真实 Mobile 页面；展示文案必须区分“已获得奖励权益 / 投递中”与“已到账”。

## 集成

状态：todo

- **Scope**：打通可信 Source Domain Event → Rewards Event / Rule → Reward Grant → Reward Delivery → Commerce Asset Credit 的端到端跨域链路。
- **Stage / Artifact**：canonical 已定义跨域输入、Delivery 幂等与 Commerce Port 边界；当前未发现对应 Integration Stage 或运行实现。
- **Gate / Evidence**：五表 migration 不能证明跨域调用已工作；尤其不能以 `reward_grants` 记录代替 Commerce Ledger / Wallet 的最终资产事实。
- **Next Action**：Backend 完成后，用真实 Source Event 与 Commerce 幂等资产入账实现集成测试，覆盖 Delivery 重试同一 idempotency key、未知结果重试和成功后交易引用回写。

## 验收

状态：todo

- **Scope**：验证符合条件的可信事件只产生一次有效奖励决策，并最终通过 Delivery 可靠交付至 Commerce；失败 / 重试期间不会提前宣称资产到账。
- **Stage / Artifact**：当前无该 Feature 的 Acceptance Stage / E2E 报告。
- **Gate / Evidence**：暂无端到端 Gate 证据。
- **Next Action**：在 Backend 与 Integration 完成后执行 E2E：覆盖事件幂等、规则时点 / 限额、Grant + Delivery 原子性、Delivery 重试，以及 Commerce 返回资产交易引用后才确认最终交付。
