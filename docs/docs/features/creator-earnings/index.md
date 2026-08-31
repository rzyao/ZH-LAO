---
feature_id: creator-earnings
title: 礼物收益、提现与结算
portfolio_status: deferred
domain:
  - commerce
  - social
status:
  design: todo
  backend: todo
  admin: na
  mobile: todo
  integration: todo
  acceptance: todo
mobile_pages: []
admin_pages: []
---

# 礼物收益、提现与结算

## 功能概览

- Portfolio Status：`deferred`。
- `portfolio_status` 只表达 Portfolio / 生命周期决策，不替代六个交付 Lane 的状态。
- 当前证据只支持将该 Feature 保留在 Future / Deferred；不据此设计 Creator payout、可提现余额、提现审核或 Settlement architecture。

## 现有证据

- [Commerce canonical](../../domains/commerce/index.md)：领域职责明确不负责 Creator Economy / 提现 / 结算（V1），V1 范围同时明确延后 `Creator earnings` 与 `Withdrawal / Settlement`，且当前不建表。
- [Feature Page Index](../../development/workflow/FEATURE_PAGE_INDEX.json)：记录 canonical title、`portfolio_status: deferred` 与当前六 Lane 状态。
- [Domain Lifecycle Matrix](../../development/DOMAIN_LIFECYCLE_MATRIX.md)：作为派生视图展示当前 Feature 与 Lane 状态，不作为新增设计事实来源。

## 设计

状态：`todo`

保持 `todo`。现有 evidence 不支持把该 Feature 判为已完成设计；本次整理不创建收益归集、Creator payout、提现或结算架构，也不制造 Design Gate。

## Backend

状态：`todo`

保持 `todo`。`GiftSend` 是礼物消费事实，并不等于礼物收益、创作者应收、可提现余额或结算 Backend 已存在。

## Admin

状态：`na`

当前 Feature Page Index 标记为 `na`。本次整理不推断未来提现审核、结算运营或打款后台的产品范围。

## Mobile

状态：`todo`

保持 `todo`。不把 Gift Send 或 Wallet 能力解释为已有收益查看、提现申请或结算体验。

## 集成

状态：`todo`

保持 `todo`。当前没有可据此提升 Lane 状态的已冻结 Creator earnings / payout / withdrawal / settlement 跨域契约。

## 验收

状态：`todo`

保持 `todo`。在后续设计与实现事实形成前，不制造 Acceptance Scope 或 Gate。

## NEEDS_DECISION

- 礼物收益 / Creator earnings 是否以及何时进入后续版本范围。
- 礼物消费事实如何在未来映射为收益归属，以及 Creator payout 的 Domain ownership。
- 提现、审核、打款、结算及相关账务架构的 canonical contract。

以上均保持未决；本任务不作设计裁决。
