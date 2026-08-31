---
feature_id: group-chat
title: 群聊
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

# 群聊

## 功能概览

Portfolio Status：`deferred`。

该 Feature 已延期，不等于工程 `blocked`。当前 Chat canonical 只定义 Direct Conversation：同一用户对唯一 Direct Conversation、Direct 成员集合恒定，且 [Chat 域](/domains/chat/) 明确当前不包含群聊。[未决与延期事项](/governance/open-questions.md)进一步明确首期不建 `chat_group` / `chat_group_member`。

因此六 Lane 保持 `todo/na`。未来若重新激活群聊，必须作为新的明确 canonical 扩展，不能通过放宽现有 Direct Conversation 不变量或复用其唯一性约束来“兼容”群聊。

## 设计

状态：todo

当前未启动。现有 canonical 只定义 Direct Conversation 的不变量并明确排除群聊，没有群聊成员、角色、生命周期等未来语义。下一步仅在 Portfolio 激活后重新做产品/领域设计，不预建 group table 或 Contract。

## Backend

状态：todo

当前未启动。现有 Chat 7 表模型与主要用例围绕 Direct Conversation，没有获准的 Group Chat API / Service / Repository contract。待正式新设计通过后再启动 Backend。

## Admin

状态：na

不适用：当前 Feature 没有已定义的 Admin 交付面。

## Mobile

状态：todo

当前未启动。没有群聊 public contract 或本 Feature 的 canonical Mobile 页面/导航工件；现有一对一聊天 UI 不能作为群聊交付证据。

## 集成

状态：todo

当前未启动。群聊会改变当前 Direct-only 的成员与资格边界，但目前没有获准的跨域/跨端 contract；待 Portfolio 激活并完成新设计后再进入集成。

## 验收

状态：todo

当前未启动。没有群聊验收范围、真实实现证据或 Gate；一对一会话的现有测试与 Gate 不覆盖该 Feature。
