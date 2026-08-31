---
feature_id: chat-reactions
title: 消息 Reaction
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

# 消息 Reaction

## 功能概览

Portfolio Status：`deferred`。

该 Feature 已延期，不等于工程 `blocked`。[Chat 域](/domains/chat/) 与 [未决与延期事项](/governance/open-questions.md)都明确当前模型不包含消息 Reaction，首期不建 `chat_message_reaction`。

因此六 Lane 保持 `todo/na`。这里记录的是当前真实边界，不是未来 Reaction 数据结构的预设计；未来重新激活时必须走新的 canonical 设计扩展。

## 设计

状态：todo

当前未启动。现有 canonical 只给出“不包含 Reaction”的边界，没有本 Feature 的未来语义、Stage、Artifact 或 Gate。下一步仅在 Portfolio 重新激活后从产品语义设计开始，不预建 reaction table / Contract。

## Backend

状态：todo

当前未启动。当前 Chat 7 表模型没有 Reaction 子模型，也没有获准的 Reaction API / Service / Repository contract；待新设计通过后再启动 Backend。

## Admin

状态：na

不适用：当前 Feature 没有已定义的 Admin 交付面。

## Mobile

状态：todo

当前未启动。没有 Reaction public contract 或本 Feature 的 canonical Mobile 工件；不得把其它消息交互 UI 当作 Reaction 交付证据。

## 集成

状态：todo

当前未启动。没有 Reaction 的跨端/跨域 contract 或集成 Gate；待 Portfolio 激活并完成正式设计后再进入联调。

## 验收

状态：todo

当前未启动。没有本 Feature 的验收范围、真实实现证据或 Gate；不得从现有消息发送/撤回测试推导 Reaction 已完成。
