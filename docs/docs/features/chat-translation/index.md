---
feature_id: chat-translation
title: 聊天翻译
portfolio_status: pending_decision
domain:
- chat
- identity
- social
- learning
mobile_pages: []
admin_pages: []
delivery_notes:
- CHAT_SCOPE_DECISION
---

# 聊天翻译

## 功能概览

Portfolio Status：`pending_decision`。

当前 Chat canonical 明确规定聊天原文是不可变事实，Chat 不拥有翻译结果或语言知识事实，并明确不包含消息翻译；[消息模型](/domains/chat/message.md)禁止在 `chat_message_text` 中增加 `translated_text`、`language` 等派生字段。[未决与延期事项](/governance/open-questions.md)又记录产品定位中存在聊天翻译能力，因此当前真实状态是范围/归属待裁决，而不是等待补一个 translation model。

当前禁止创建 `chat_message_translation`、给 `chat_message_text` 追加翻译字段，或把 Learning 的翻译事实复制进 Chat。任何未来方案都必须先解决 `CHAT_SCOPE_DECISION` 并更新 canonical 设计。

NEEDS_DECISION：`CHAT_SCOPE_DECISION`——确认聊天翻译是否进入当前产品组合，以及它与 Chat 原文事实、Learning 翻译能力之间的正式职责边界；本文档不裁决持久化模型或 API 形态。
