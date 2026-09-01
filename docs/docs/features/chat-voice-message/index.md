---
feature_id: chat-voice-message
title: 语音消息
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

# 语音消息

## 功能概览

Portfolio Status：`pending_decision`。

当前 Chat canonical 只定义 `text` / `image` 两种 MessageType、7 张业务表，并明确把 Voice Message 排除在当前模型之外；[未决与延期事项](/governance/open-questions.md)同时记录产品定位中存在语音能力、但 Chat 首期数据库只到 TEXT / IMAGE 的范围冲突。因此该 Feature 不是“缺一张表”的实现任务，而是 `CHAT_SCOPE_DECISION` 尚未完成。

当前禁止通过补 `voice` MessageType、语音 subtype 表或临时 API 来绕过裁决。若未来进入正式范围，必须先更新 canonical Chat design，再进入各执行 实际 Stage / Gate。

NEEDS_DECISION：`CHAT_SCOPE_DECISION`——确认语音消息是否进入当前产品组合；若进入，再由 canonical 设计明确 Chat 与 Media / Asset、Learning 的职责边界，本文档不代替该裁决。
