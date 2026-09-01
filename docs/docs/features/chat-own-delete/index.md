---
feature_id: chat-own-delete
title: 单条消息仅自己删除
portfolio_status: deferred
domain:
- chat
- identity
- social
mobile_pages: []
admin_pages: []
---

# 单条消息仅自己删除

## 功能概览

Portfolio Status：`deferred`。

该 Feature 已延期，不等于工程 `blocked`。当前 Chat canonical 明确区分三件事：撤回改变共享消息生命周期但保留原内容；清空历史只推进用户级 `cleared_before_seq`；单条消息“仅自己删除”当前不支持，也不应把 `chat_message.status` 改造成用户私有删除状态。

[未决与延期事项](/governance/open-questions.md)明确首期不建用于单条私有删除的 `chat_message_user_state`。未来若激活必须作为新的明确设计扩展。
