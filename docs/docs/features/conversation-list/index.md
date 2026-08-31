---
feature_id: conversation-list
title: 聊天会话列表
portfolio_status: active
domain:
  - chat
  - identity
  - social
status:
  design: done
  backend: todo
  admin: na
  mobile: todo
  integration: todo
  acceptance: todo
mobile_pages: []
admin_pages: []
evidence:
  design:
    - /domains/chat/conversation
    - /adr/ADR-011-chat-conversation-identity-and-direct-uniqueness
    - /adr/ADR-013-read-state-as-cursor-not-receipt-table
---

# 聊天会话列表

## 功能概览

Portfolio Status：`active`。

本 Feature 负责当前用户的聊天会话列表投影：只展示自己是成员、已经产生消息且未被自己隐藏的会话，并结合个人置顶状态、最后消息与派生未读数形成列表。列表不是独立事实表；核心事实来自 Conversation、Member、Message 与 `chat_conversation_user_state`。

## 设计

状态：done

范围：确定会话列表的纳入条件、排序、最后消息预览与未读数计算边界。列表必须以 `chat_conversation_member.user_id = current_user` 为成员入口，仅纳入 `last_message_id IS NOT NULL` 且当前用户 `hidden_at IS NULL` 的会话；排序依次使用置顶状态、`pinned_at` 与 `last_message_at`。

执行阶段与产物：[Chat Conversation Final Canonical](/domains/chat/conversation)、[ADR-011](/adr/ADR-011-chat-conversation-identity-and-direct-uniqueness) 与 [ADR-013](/adr/ADR-013-read-state-as-cursor-not-receipt-table)。这些工件已冻结列表可见性、个人状态和 read-cursor 语义。

Gate / 完成证据：canonical 已明确空会话不进入列表、隐藏会话仅对当前用户不可见、置顶采用 `is_pinned + pinned_at` 稳定排序，最后消息预览从实际 Message subtype 派生而不是存储 `last_message_preview`；未读数也不存储 `unread_count`，而是按 `seq > last_read_seq`、非本人发送且 `status = normal` 的消息派生。

下一步：Backend 按冻结查询语义实现列表 projection、未读聚合和隐藏恢复，不新增独立列表事实、缓存型 `unread_count` 或 `last_message_preview` canonical 字段。

## Backend

状态：todo

范围：实现当前用户会话列表查询、分页/排序、最后消息 subtype projection、未读聚合，以及新消息或有效用户参与时将 `hidden_at` 恢复为 `NULL` 的应用服务行为。

执行阶段与产物：尚未进入 Chat Backend Feature 实现 Stage。数据库前置工件 `database/v2/migrations/0800_chat.sql` 已提供 Conversation、Member、User State、Message 及相关索引/字段，但 `main` 未发现 F13 会话列表 Backend Stage/Report、API/Service/Repository 实现。

Gate / 证据：有冻结设计与数据库结构，但没有可运行的列表接口、查询实现或 Backend PASS 证据，因此保持 `todo`。

下一步：建立 Chat Backend 执行工件，实现成员过滤、空会话过滤、隐藏过滤、置顶排序、最后消息投影和正确的未读聚合，并补查询与性能测试。

## Admin

状态：na

范围：F13 会话列表是 App 用户个人列表，不定义 Admin 端替用户维护置顶、隐藏、未读或列表排序的功能。

执行阶段与产物：N/A；当前 Feature `admin_pages` 为空，canonical 的列表状态均为用户个人状态或消息派生结果。

Gate / 证据：[Chat Conversation Final Canonical](/domains/chat/conversation) 将置顶、隐藏等归入 `chat_conversation_user_state`，不需要 Admin Lane 交付。

下一步：维持 `na`；运营查询、风控处置等若存在，应由各自 Feature 承担，不扩张 F13 范围。

## Mobile

状态：todo

范围：展示会话列表、最后消息、时间、置顶顺序和未读状态，并正确处理隐藏后消失、后续有效活动恢复等服务端语义；客户端不自建第二套 unread/list canonical state。

执行阶段与产物：尚未发现 F13 Conversation List 的 Mobile Design/Implementation Stage 工件，`mobile_pages` 当前为空。

Gate / 证据：无 Mobile 页面实现、真实列表 API 接入或设备验证证据，保持 `todo`。

下一步：Backend contract 可执行后，补列表页面/状态管理设计、真实接口接入和空态/分页/刷新/排序验证。

## 集成

状态：todo

范围：验证 Chat 列表事实与 Identity/Social 展示资料投影、消息写入、已读游标和 Conversation User State 之间的一致性，尤其覆盖新消息对排序、隐藏恢复和未读数的影响。

执行阶段与产物：尚无 F13 Conversation List Integration Stage/Report。

Gate / 证据：无跨模块真实联调或端到端列表投影证据，保持 `todo`。

下一步：在 Backend/Mobile 就绪后，覆盖新消息、撤回消息、本人消息、隐藏恢复、置顶变化和资料投影的集成场景。

## 验收

状态：todo

范围：验收空会话不展示、隐藏会话仅对本人消失、置顶会话稳定优先、普通会话按最后消息时间排序、最后消息预览来自真实 subtype，并确认未读数排除本人消息与 recalled 消息。

执行阶段与产物：尚无 F13 Conversation List Acceptance Report/Gate。

Gate / 证据：当前没有端到端验收记录，保持 `todo`。

下一步：完成实现与集成后执行真实数据/设备验收并记录 Gate；验收不得以持久化 `unread_count` 或 `last_message_preview` 作为通过条件。
