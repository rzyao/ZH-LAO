---
feature_id: conversation-settings
title: 置顶 / 免打扰 / 隐藏 / 清空历史
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

# 置顶 / 免打扰 / 隐藏 / 清空历史

## 功能概览

Portfolio Status：`active`。

本 Feature 的四类个人会话操作全部落在同一 canonical 模型 `chat_conversation_user_state`：`is_pinned + pinned_at` 表示置顶，`is_muted` 表示免打扰，`hidden_at` 表示仅对当前用户隐藏会话，`cleared_before_seq` 表示仅对当前用户清空指定水位之前的历史。它们都不会删除共享 Conversation 或 Message 事实。
