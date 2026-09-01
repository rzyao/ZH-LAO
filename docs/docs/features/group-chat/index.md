---
feature_id: group-chat
title: 群聊
portfolio_status: deferred
domain:
- chat
- identity
- social
mobile_pages: []
admin_pages: []
---

# 群聊

## 功能概览

Portfolio Status：`deferred`。

该 Feature 已延期，不等于工程 `blocked`。当前 Chat canonical 只定义 Direct Conversation：同一用户对唯一 Direct Conversation、Direct 成员集合恒定，且 [Chat 域](/domains/chat/) 明确当前不包含群聊。[未决与延期事项](/governance/open-questions.md)进一步明确首期不建 `chat_group` / `chat_group_member`。

未来若重新激活群聊，必须作为新的明确 canonical 扩展，不能通过放宽现有 Direct Conversation 不变量或复用其唯一性约束来“兼容”群聊。
