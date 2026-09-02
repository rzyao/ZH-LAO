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
source_migration: complete
last_updated: '2026-09-02'
last_verified_at: '2026-09-02'
delivery_evidence:
- docs/docs/developer/reference/domains/rewards/index.md
- docs/docs/developer/reference/domains/rewards/database.md
- docs/docs/developer/reference/domains/rewards/application-and-events.md
- docs/docs/developer/reference/adr/ADR-017-rewards-boundary-and-event-driven-grant.md
---

# 自动 Coin 奖励

> 本页记录当前可追溯的产品范围与交付证据；组合状态不等于实现完成。

## 用户价值与功能说明

本能力定义为 **自动 Coin 奖励**（`automatic-coin-rewards`）。本页保留该能力的现有描述；如果现有资料没有明确用户价值，本页不自行补造。

## 使用者或受益者

当前资料没有足够证据来确认具体使用者。本页暂记为：**未明确**。已声明的参与页面：Mobile `未明确`；Admin `未明确`。

## 范围与边界

- 声明的 Domain：`rewards`, `commerce`, `learning`, `social`, `identity`
- 声明的 owns contracts：现有资料未明确
- 声明的 dependencies：现有资料未明确
- 详细包含/不包含边界以现有功能资料、Domain authority 和产品文档为准。

## 参与系统

| 系统 | 来源声明 | 本页判断 |
| --- | --- | --- |
| Product | `portfolio_status: active` | 产品组合状态，不等于实现完成 |
| Database | 当前资料未声明物理证据 | `not evidenced` |
| Backend | 当前资料未声明独立实现证据 | `not evidenced` |
| Admin | 未明确 | `not evidenced` |
| Mobile | 未明确 | `not evidenced` |
| Integration | 当前资料未声明独立集成证据 | `not evidenced` |
| Acceptance | 当前资料未声明 Feature Gate 证据 | `not evidenced` |

## 分层交付状态

| 层 | 状态 | 解释 |
| --- | --- | --- |
| 产品 | `active` | 页面声明的 portfolio 状态；`active` 不表示 implemented |
| 数据库 | `not evidenced` | 本页没有从 Feature Page 推断数据库完成 |
| Backend | `not evidenced` | 需要代码、测试、Gate 或 Report 的明确证据 |
| Admin | `not evidenced` | 需要真实页面、契约和验证证据 |
| Mobile | `not evidenced` | 需要真实页面、契约和验证证据 |
| Integration | `not evidenced` | 需要跨层真实集成证据 |
| Acceptance | `not evidenced` | 需要 Feature Gate / E2E / 验收证据 |

## 证据

已记录的 `delivery_evidence` 如下；路径已尽量转为可点击的当前文档路由，裸 Stage/Decision ID 仍保留为标识：

- [docs/docs/developer/reference/domains/rewards/index.md](/developer/reference/domains/rewards/)
- [docs/docs/developer/reference/domains/rewards/database.md](/developer/reference/domains/rewards/database)
- [docs/docs/developer/reference/domains/rewards/application-and-events.md](/developer/reference/domains/rewards/application-and-events)
- [docs/docs/developer/reference/adr/ADR-017-rewards-boundary-and-event-driven-grant.md](/developer/reference/adr/ADR-017-rewards-boundary-and-event-driven-grant)

## 限制、阻塞与下一步

已记录的 `delivery_notes`：

- 当前资料没有声明 delivery_notes。

- 本页默认不把 `active`、Spec、任务清单或页面存在推断为已实现。
- 下一步：由对应 Stage / Feature Gate 补充明确的分层证据，再更新本页生成输入或手工核验页。

## 功能规则与背景

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
