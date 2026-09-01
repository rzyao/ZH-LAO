---
feature_id: chat-text
title: 文字与 Emoji 消息
portfolio_status: active
domain:
- chat
- identity
- social
mobile_pages: []
admin_pages: []
delivery_notes:
- Chat 消息主体、TEXT subtype、顺序与幂等语义已冻结；应用层请求响应、错误码等公共契约仍处于 designing，尚无 Feature 级 Design Gate。
---

# 文字与 Emoji 消息

## 功能概览

Portfolio Status：`active`。

`chat-text` 负责 Direct Conversation 中的文字与 Emoji 内容发送。当前 canonical MessageType 只有 `text` / `image`；本 Feature 的 Emoji 属于 `chat_message_text.text` 中的文本内容，不等于已延期的 Message Reaction，也不引入独立 Emoji / Reaction subtype。

本 Feature 只保存用户发送的原文。当前模型明确不增加 `translated_text`、`language`、`pinyin`、`lao_translation` 或 `chat_message_translation`；翻译不是当前 Chat Messaging canonical fact。
