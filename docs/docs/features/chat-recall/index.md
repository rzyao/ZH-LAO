---
feature_id: chat-recall
title: 消息撤回
portfolio_status: active
domain:
- chat
- identity
- social
mobile_pages: []
admin_pages: []
delivery_notes:
- 撤回已冻结为 chat_message 自身的 normal/recalled 生命周期；公共 recallMessage API 与错误契约仍未形成 Feature 级 Design Gate。
---

# 消息撤回

## 功能概览

Portfolio Status：`active`。

`chat-recall` 负责发送者撤回自己已经发送的消息。当前 canonical 不创建 `chat_message_recall` 实体或表，也不 DELETE 消息：撤回只把 `chat_message.status` 从 `normal` 改为 `recalled` 并写入 `recalled_at`，原始 `chat_message_text` / `chat_message_image` subtype 保留用于治理、审计与纠纷取证。

撤回最后一条消息不会回退 `chat_conversation.last_message_id`；客户端根据消息生命周期状态展示“消息已撤回”，而不是把数据库原文覆盖成提示文本。
