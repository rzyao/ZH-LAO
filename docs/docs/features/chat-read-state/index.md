---
feature_id: chat-read-state
title: 会话已读与未读
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
    - /adr/ADR-013-read-state-as-cursor-not-receipt-table
---

# 会话已读与未读

## 功能概览

Portfolio Status：`active`。

本 Feature 使用 `chat_conversation_member.last_read_seq` / `last_read_at` 表达每个成员的会话级已读游标，并从消息序列派生未读状态。它明确不使用逐消息 receipt 模型：不存在也不得恢复独立 `chat_message_receipt` 表、delivery receipt 或持久化 `unread_count`。

## 设计

状态：done

范围：定义会话级 read cursor 的单调推进、上界约束、未读聚合、本人发送后的游标推进，以及清空历史与隐藏会话对 read state 的不同影响。已读状态属于 Member；置顶/隐藏/清历史等个人列表状态属于 `chat_conversation_user_state`，两者保持分离。

执行阶段与产物：[Chat Conversation Final Canonical](/domains/chat/conversation) 与 [ADR-013](/adr/ADR-013-read-state-as-cursor-not-receipt-table)。ADR 已明确裁决“cursor 而不是 receipt table”。

Gate / 完成证据：冻结设计要求 `last_read_seq` 通过 `GREATEST(old, new)` 单调推进且不得超过 `chat_conversation.last_message_seq`；未读消息按 `seq > last_read_seq`、发送者不是当前用户且消息仍为正常状态派生。本人成功发送消息后自动推进自己的 read cursor；清历史时 read cursor 至少推进到 `cleared_before_seq`；仅隐藏会话不得改变 read cursor。

下一步：Backend 按 cursor 契约实现更新和查询，不引入 message receipt、delivery 状态表或第二套未读事实。

## Backend

状态：todo

范围：实现 read cursor 更新用例/API、单调更新与边界校验、列表未读聚合，以及发送成功/清历史时对 read cursor 的原子协同；如产品需要展示对方已读位置，也应从对方 Member cursor 派生而不是创建 receipt 行。

执行阶段与产物：尚未进入 Chat Backend Feature 实现 Stage。数据库前置工件 `database/migrations/0800_chat.sql` 已包含 `chat_conversation_member.last_read_seq`、`last_read_at`，且没有 message receipt 表；但 `main` 未发现对应 F13 read-state Backend Stage/Report 或应用/API 实现。

Gate / 证据：数据库字段与冻结 ADR 只能证明模型已落地，不能证明已读/未读业务已实现；没有可运行接口、Service/Repository 测试或 Backend PASS，因此保持 `todo`。

下一步：实现 monotonic cursor 更新、`last_message_seq` 上界校验、未读聚合以及 send/clear-history 协同事务，并补乱序请求、重复请求与并发场景测试。

## Admin

状态：na

范围：已读/未读是 App 用户的会话成员状态，不定义 Admin 手工改已读、制造 receipt 或覆盖用户 cursor 的交付面。

执行阶段与产物：N/A；当前 Feature `admin_pages` 为空，read state canonical 仅属于 Conversation Member。

Gate / 证据：[ADR-013](/adr/ADR-013-read-state-as-cursor-not-receipt-table) 已固定 read-state 的用户会话边界，没有 F13 Admin 依赖。

下一步：维持 `na`；运营审计或治理能力如需读取聊天事实，应由独立 Feature/权限边界处理，不在本 Feature 增加写入口。

## Mobile

状态：todo

范围：在进入/阅读会话时按服务端 contract 推进 read cursor，展示由服务端/查询层派生的未读结果，并正确处理多设备、乱序网络与重试；客户端不得把本地已读标记作为 canonical receipt。

执行阶段与产物：尚未发现 F13 Read State 的 Mobile Design/Implementation Stage 工件，`mobile_pages` 当前为空。

Gate / 证据：无真实 API 接入、多设备同步或设备验证证据，保持 `todo`。

下一步：Backend contract 就绪后，补 Mobile read-trigger 策略、接口接入、离线/重连后的 cursor 合并和真实设备验证。

## 集成

状态：todo

范围：验证发送消息、读取消息、会话列表未读数、清历史及隐藏行为之间的 cursor 一致性，并覆盖多设备/乱序请求不会使 `last_read_seq` 回退。

执行阶段与产物：尚无 F13 Read State Integration Stage/Report。

Gate / 证据：无跨消息写入、Conversation User State 与 Mobile 的联调证据，保持 `todo`。

下一步：在 Backend/Mobile 就绪后，执行 send→auto-read、peer unread、read advance、clear-history、hide-without-read-advance 和乱序重试集成测试。

## 验收

状态：todo

范围：验收已读游标只前进不后退、不得超过会话水位；本人发送不制造自己的未读；清历史后对应旧消息不再形成未读；隐藏本身不改变已读；未读计算排除本人消息和非正常消息，并确认系统没有逐消息 receipt canonical fact。

执行阶段与产物：尚无 F13 Read State Acceptance Report/Gate。

Gate / 证据：当前没有端到端验收与多设备证据，保持 `todo`。

下一步：实现和集成完成后，以真实消息序列和多设备场景执行验收并记录 Gate 结果。
