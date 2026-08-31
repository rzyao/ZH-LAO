---
feature_id: wrong-answer-notebook
title: 错题本
portfolio_status: deferred
domain:
  - learning
  - content
  - identity
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

# 错题本

## 功能概览

Portfolio Status：`deferred`。

当前 Frozen Learning V1 **没有独立错题本实现**。`LEARNING_USE_CASES` 将 `Question review notebook / question_reviews` 明确列为 D11 Deferred（first phase excluded）；这与已经冻结的 `learning.content_reviews` 内容级复习调度不是同一能力，也不能因为已有 question attempts / review scheduling 就推导出错题本已经设计或实现。

本页只保留正式 Portfolio Feature 身份与当前 Lane 状态。Portfolio 的 `deferred` 不等于任何 Lane 的 `blocked`。

参考：[Learning Use Cases](../../development/06-learning/LEARNING_USE_CASES.md)、[Learning Design Audit](../../development/06-learning/LEARNING_DESIGN_AUDIT.md)。

## 设计

状态：todo

Portfolio 当前为 `deferred`；该 Lane 尚未进入独立设计，不在本页提前创建 Feature Scope、Stage 或 Gate。

## Backend

状态：todo

Portfolio 当前为 `deferred`；没有独立错题本 Backend implementation，不在本页从现有 attempts / reviews 推导实现范围或实施 Gate。

## Admin

状态：na

不适用：当前 deferred Feature 没有独立 Admin 交付；本页不为未来可能的错题运营能力预建后台范围。

## Mobile

状态：todo

Portfolio 当前为 `deferred`；没有独立错题本 Mobile 页面证据，也不提前定义未来页面或交互范围。

## 集成

状态：todo

Portfolio 当前为 `deferred`；尚未进入独立集成设计，不创建集成 Stage 或 Gate。

## 验收

状态：todo

Portfolio 当前为 `deferred`；没有独立错题本验收对象，不创建虚假的验收 Gate。只有 Portfolio 重新进入当前开发组合后，才按当时最新 canonical evidence 建立交付事实。
