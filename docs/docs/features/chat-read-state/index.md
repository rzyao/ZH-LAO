---
feature_id: chat-read-state
title: 会话已读与未读
portfolio_status: active
domain:
- chat
- identity
- social
mobile_pages: []
admin_pages: []
delivery_evidence:
- /domains/chat/conversation
- /adr/ADR-013-read-state-as-cursor-not-receipt-table
---

# 会话已读与未读

## 功能概览

Portfolio Status：`active`。

本 Feature 使用 `chat_conversation_member.last_read_seq` / `last_read_at` 表达每个成员的会话级已读游标，并从消息序列派生未读状态。它明确不使用逐消息 receipt 模型：不存在也不得恢复独立 `chat_message_receipt` 表、delivery receipt 或持久化 `unread_count`。
