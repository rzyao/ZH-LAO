---
feature_id: promotions-coupons
title: 促销与优惠券
portfolio_status: deferred
domain:
  - commerce
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

# 促销与优惠券

## 功能概览

- Portfolio Status：`deferred`。
- `portfolio_status` 只表达 Portfolio / 生命周期决策，不替代六个交付 Lane 的状态。
- 当前证据只支持将该 Feature 保留在 Future / Deferred；不据此设计 Coupon system、促销规则、核销状态机或订单优惠架构。

## 现有证据

- [Commerce canonical](../../domains/commerce/index.md)：V1 范围明确延后 `Promotion / Coupon`，且当前不建表。
- [Feature Page Index](../../development/workflow/FEATURE_PAGE_INDEX.json)：记录 canonical title、`portfolio_status: deferred` 与当前六 Lane 状态。
- [Domain Lifecycle Matrix](../../development/DOMAIN_LIFECYCLE_MATRIX.md)：作为派生视图展示当前 Feature 与 Lane 状态，不作为新增设计事实来源。

## 设计

状态：`todo`

保持 `todo`。现有 evidence 不支持把该 Feature 判为已完成设计；本次整理不创建 Coupon schema、促销规则、状态机或 Design Gate。

## Backend

状态：`todo`

保持 `todo`。不因为 Commerce 已有 Catalog / Order / Payment / Wallet 能力，就推导促销或优惠券 Backend 已存在。

## Admin

状态：`na`

当前 Feature Page Index 标记为 `na`。本次整理不推断未来活动配置、发券或核销运营后台的产品范围。

## Mobile

状态：`todo`

保持 `todo`。不把 Future / Deferred 记录解释为已有领券、用券或优惠展示实现。

## 集成

状态：`todo`

保持 `todo`。当前没有可据此提升 Lane 状态的已冻结 Promotion / Coupon 与订单、支付、钱包集成契约。

## 验收

状态：`todo`

保持 `todo`。在后续设计与实现事实形成前，不制造 Acceptance Scope 或 Gate。

## NEEDS_DECISION

- Promotion / Coupon 是否以及何时进入后续版本范围。
- 活动规则、优惠券生命周期与 apply / redeem 语义。
- 与 Product / Order / Payment / Wallet 的边界及优惠金额如何进入交易事实。

以上均保持未决；本任务不作设计裁决。
