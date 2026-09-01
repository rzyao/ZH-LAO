---
feature_id: direct-conversation
title: 发起 / 打开一对一会话
portfolio_status: active
domain:
- chat
- identity
- social
mobile_pages: []
admin_pages: []
delivery_evidence:
- /domains/chat/conversation
- /adr/ADR-011-chat-conversation-identity-and-direct-uniqueness
---

# 发起 / 打开一对一会话

## 功能概览

Portfolio Status：`active`。

本 Feature 负责为两个用户发起或打开同一条 Direct Conversation。会话身份、成员关系和个人会话状态分别由 `chat_conversation`、`chat_direct_conversation`、`chat_conversation_member`、`chat_conversation_user_state` 承载；是否允许聊天属于进入 Chat 前的外部判定，Chat 不持久化 `match_id`，也不以 Social Match 作为会话身份。

当前 Chat canonical 仅定义一对一会话；群聊、消息翻译、礼物消息等不属于本 Feature。
