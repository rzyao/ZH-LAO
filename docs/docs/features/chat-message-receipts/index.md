---
feature_id: chat-message-receipts
title: 逐消息送达 / 已读回执
portfolio_status: deferred
domain:
- chat
- identity
- social
mobile_pages: []
admin_pages: []
---

# 逐消息送达 / 已读回执

## 功能概览

Portfolio Status：`deferred`。

该 Feature 已延期，不等于工程 `blocked`。当前 Chat canonical 的已读真相是 `chat_conversation_member.last_read_seq`，未读数量由游标派生；[消息模型](/domains/chat/message.md)同时明确 `MessageStatus` 不是 `delivered/read`，且当前不建立逐消息 Receipt。

[未决与延期事项](/governance/open-questions.md)明确首期不建 `chat_message_receipt` / `chat_delivery_receipt`。未来重新激活时必须作为新的明确设计扩展，不能把现有会话已读游标改写成逐消息回执模型。
