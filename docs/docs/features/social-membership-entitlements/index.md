---
feature_id: social-membership-entitlements
title: 社交会员与高级权益
portfolio_status: deferred
domain:
  - commerce
  - social
  - platform
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

# 社交会员与高级权益

## 功能概览

- Portfolio Status：`deferred`。
- `portfolio_status` 只表达 Portfolio / 生命周期决策，不替代六个交付 Lane 的状态。
- 当前证据只支持将该 Feature 保留在 Future / Deferred；不据此扩展 Subscription schema、计费、续费或 Entitlement 持久化设计。

## 现有证据

- [Commerce canonical](../../domains/commerce/index.md)：V1 范围明确延后 `Subscription / Membership persistence` 与 `Entitlement persistence`，且当前不建表。
- `FEATURE_PAGE_INDEX.json`：记录 canonical title、`portfolio_status: deferred` 与当前六 Lane 状态。
- [Domain Lifecycle Matrix](../../development/DOMAIN_LIFECYCLE_MATRIX.md)：作为派生视图展示当前 Feature 与 Lane 状态，不作为新增设计事实来源。

## 设计

状态：`todo`

保持 `todo`。现有 evidence 不支持把该 Feature 判为已完成设计；本次整理不创建 Subscription / Entitlement schema、产品规则或 Design Gate。

## Backend

状态：`todo`

保持 `todo`。不因为 Commerce 中存在 Order / Payment / Wallet 等能力，就推导 Subscription Backend 已存在。

## Admin

状态：`na`

当前 Feature Page Index 标记为 `na`。本次整理不推断未来会员运营后台的产品范围。

## Mobile

状态：`todo`

保持 `todo`。不把 Future / Deferred 记录解释为已有会员购买或权益展示实现。

## 集成

状态：`todo`

保持 `todo`。当前没有可据此提升 Lane 状态的已冻结跨域 Subscription / Entitlement 契约。

## 验收

状态：`todo`

保持 `todo`。在后续设计与实现事实形成前，不制造 Acceptance Scope 或 Gate。

## NEEDS_DECISION

- 社交会员是否以及何时进入后续版本范围。
- Subscription、Membership 与 Entitlement 的产品语义、Domain ownership 与持久化边界。
- 计费 / 续费 / 到期等能力是否属于该 Feature，以及与 Commerce Order / Payment 的关系。

以上均保持未决；本任务不作设计裁决。
