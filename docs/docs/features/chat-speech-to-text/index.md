---
feature_id: chat-speech-to-text
title: 语音转文字
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

# 语音转文字

## 功能概览

Portfolio Status：`pending_decision`。

[未决与延期事项](/governance/open-questions.md)把“语音转文字”与语音消息、聊天翻译一起列入 D-056：产品定位存在这些能力，但当前 Chat 首期数据库只到 TEXT / IMAGE，需要主会话确认范围。与此同时，[消息模型](/domains/chat/message.md)当前只有 `text` / `image` MessageType，没有 `voice`、转写 subtype 或转写结果字段。

因此本 Feature 当前不是可直接实现的 Backend/Mobile 任务，也不能通过给 Chat 消息增加 transcription 字段来绕过裁决。语音转文字最终属于消息持久事实、派生能力还是其它领域能力，均须由 canonical 设计正式决定。

NEEDS_DECISION：`CHAT_SCOPE_DECISION`——确认语音转文字是否进入当前产品组合，并明确它与语音消息、Chat 原始消息事实及 Learning 能力的职责边界；本文档不预判结果存储方式或 API。
