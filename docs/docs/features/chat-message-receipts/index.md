---
feature_id: chat-message-receipts
title: 逐消息送达 / 已读回执
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

# 逐消息送达 / 已读回执

## 功能概览

Portfolio Status：`deferred`。

该 Feature 已延期，不等于工程 `blocked`。当前 Chat canonical 的已读真相是 `chat_conversation_member.last_read_seq`，未读数量由游标派生；[消息模型](/domains/chat/message.md)同时明确 `MessageStatus` 不是 `delivered/read`，且当前不建立逐消息 Receipt。

[未决与延期事项](/governance/open-questions.md)明确首期不建 `chat_message_receipt` / `chat_delivery_receipt`。因此六 Lane 保持 `todo/na`，未来重新激活时必须作为新的明确设计扩展，不能把现有会话已读游标改写成逐消息回执模型。

## 设计

状态：todo

当前未启动。已有 canonical 证据只说明“首期不包含逐消息送达/已读回执”，并不构成未来设计。下一步仅在 Portfolio 重新激活后，从需求与语义设计开始；不得预建 receipt table 或 Contract。

## Backend

状态：todo

当前未启动。现有 Backend canonical 以 `last_read_seq` 表达会话已读事实，消息状态不承载 delivered/read；没有本 Feature 的有效 Backend Stage / Artifact / Gate。Portfolio 激活并通过新设计后再启动实现。

## Admin

状态：na

不适用：当前 Feature 没有已定义的 Admin 交付面。

## Mobile

状态：todo

当前未启动。没有逐消息回执 public contract 或本 Feature 的 canonical Mobile 工件；不要把现有会话未读/已读 UI 证据误算为逐消息 Receipt。Portfolio 激活并完成设计后再建立 Mobile Stage。

## 集成

状态：todo

当前未启动。没有 delivery/read receipt 的跨端或跨域集成契约；现有实时传输、重连与会话已读能力不等于本 Feature 已交付。待 Portfolio 激活并形成正式 contract 后再进入集成。

## 验收

状态：todo

当前未启动。没有本 Feature 的验收范围、E2E 证据或 Gate；现有 `last_read_seq` 验收不能替代逐消息送达/已读回执验收。
