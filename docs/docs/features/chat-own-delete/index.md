---
feature_id: chat-own-delete
title: 单条消息仅自己删除
portfolio_status: deferred
domain:
  - chat
  - identity
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

# 单条消息仅自己删除

## 功能概览

Portfolio Status：`deferred`。

该 Feature 已延期，不等于工程 `blocked`。当前 Chat canonical 明确区分三件事：撤回改变共享消息生命周期但保留原内容；清空历史只推进用户级 `cleared_before_seq`；单条消息“仅自己删除”当前不支持，也不应把 `chat_message.status` 改造成用户私有删除状态。

[未决与延期事项](/governance/open-questions.md)明确首期不建用于单条私有删除的 `chat_message_user_state`。因此六 Lane 保持 `todo/na`，未来若激活必须作为新的明确设计扩展。

## 设计

状态：todo

当前未启动。现有 canonical 只明确“清空历史 ≠ 单条仅自己删除”“撤回 ≠ 仅自己删除”，没有本 Feature 的未来语义或数据模型。下一步仅在 Portfolio 激活后从用户可见语义和治理边界重新设计，不预建 user-state table。

## Backend

状态：todo

当前未启动。[消息模型](/domains/chat/message.md)明确用户自己删除某条消息不能通过把共享 `MessageStatus` 改成 `removed` 来实现；当前也没有本 Feature 的 Backend contract、Artifact 或 Gate。待正式新设计通过后再实现。

## Admin

状态：na

不适用：当前 Feature 没有已定义的 Admin 交付面。

## Mobile

状态：todo

当前未启动。现有“撤回”或“清空历史”交互不等于单条消息仅自己删除；没有本 Feature 的 public contract 或 canonical Mobile 工件。

## 集成

状态：todo

当前未启动。没有单条私有删除的同步/跨端 contract；不得把现有撤回同步或 `cleared_before_seq` 行为当作本 Feature 的集成证据。

## 验收

状态：todo

当前未启动。没有本 Feature 的验收范围、实现证据或 Gate；现有撤回/清空历史验收不覆盖该能力。
