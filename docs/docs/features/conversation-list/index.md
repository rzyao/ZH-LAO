---
feature_id: conversation-list
title: 聊天会话列表
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
- /adr/ADR-013-read-state-as-cursor-not-receipt-table
---

# 聊天会话列表

## 功能概览

Portfolio Status：`active`。

本 Feature 负责当前用户的聊天会话列表投影：只展示自己是成员、已经产生消息且未被自己隐藏的会话，并结合个人置顶状态、最后消息与派生未读数形成列表。列表不是独立事实表；核心事实来自 Conversation、Member、Message 与 `chat_conversation_user_state`。
