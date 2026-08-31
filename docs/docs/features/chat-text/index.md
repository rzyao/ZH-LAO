---
feature_id: chat-text
title: 文字与 Emoji 消息
portfolio_status: active
domain:
  - chat
  - identity
  - social
status:
  design: active
  backend: todo
  admin: na
  mobile: todo
  integration: todo
  acceptance: todo
mobile_pages: []
admin_pages: []
active_notes:
  design: Chat 消息主体、TEXT subtype、顺序与幂等语义已冻结；应用层请求响应、错误码等公共契约仍处于 designing，尚无 Feature 级 Design Gate。
---

# 文字与 Emoji 消息

## 功能概览

Portfolio Status：`active`。

`chat-text` 负责 Direct Conversation 中的文字与 Emoji 内容发送。当前 canonical MessageType 只有 `text` / `image`；本 Feature 的 Emoji 属于 `chat_message_text.text` 中的文本内容，不等于已延期的 Message Reaction，也不引入独立 Emoji / Reaction subtype。

本 Feature 只保存用户发送的原文。当前模型明确不增加 `translated_text`、`language`、`pinyin`、`lao_translation` 或 `chat_message_translation`；翻译不是当前 Chat Messaging canonical fact。

## 设计

状态：active

范围：定义文字与 Emoji 消息的消息身份、TEXT subtype、会话内严格顺序、客户端幂等、发送事务与跨域聊天资格边界。权威事实来自 [消息模型](/domains/chat/message) 与 [应用服务与领域事件](/domains/chat/application-and-events)。

Stage / 工件：`chat_message.type = 'text'` 与 `chat_message_text(message_id, text)` 已在 [消息模型](/domains/chat/message) 冻结；`sendTextMessage` 的事务行为、`canChat()` 边界和 `MessageCreated` 事件在 [应用服务与领域事件](/domains/chat/application-and-events) 中维护；物理数据库基线已存在 `database/v2/migrations/0800_chat.sql`，且 `expected-schema.json` 将 `chat_message` / `chat_message_text` 列入 Chat 预期 Schema。

已完成内容：已固定 `seq` 作为会话内严格顺序、`client_message_id` 作为发送幂等键；TEXT subtype 只保存非空原文；发送事务必须原子写入 message + text subtype + conversation 水位，并推进发送者已读游标。当前不建逐消息 receipt，也不把 `delivered/read` 写进 `chat_message.status`。

当前进行内容：[应用服务与领域事件](/domains/chat/application-and-events) 仍将各用例的请求/响应字段、错误码与分页契约标记为 `designing`；因此本 Feature 的设计 Lane 不能据现有模型文档直接宣告 done。

Gate / Evidence：消息与数据库核心语义已有 frozen canonical evidence，数据库迁移也与 `text/image`、`normal/recalled` 约束一致；但当前 `main` 未发现 Chat Feature 级 `CHAT_DESIGN_GATE` / 等价 Gate 产物，故状态保持 `active` 而不是 `done`。

下一步：冻结 `sendTextMessage` 的公共请求/响应、错误码与鉴权契约，形成可引用的 Chat Design Gate；随后再进入 Chat Backend API / Service / Repository 实现。

## Backend

状态：todo

当前 `apps/backend/src/modules/` 只有 Identity、Operations、Platform 模块，没有 Chat Backend 模块。`database/v2/migrations/0800_chat.sql` 证明 Chat 物理表基线已存在，但它不等于 `sendTextMessage` API、Service、Repository 与事务实现已经交付，因此 Backend Lane 不提前提升状态。

## Admin

状态：na

不适用：文字与 Emoji 消息是用户侧聊天能力，当前没有独立 Admin 交付端。

## Mobile

状态：todo

当前 `apps/mobile/src/features/` 只有 Foundation，没有 Chat 业务模块或聊天页面；现有通用 realtime skeleton 也明确不定义 chat message protocol。尚无文字消息输入、发送、失败重试或消息气泡的 Chat Mobile 实现证据。

## 集成

状态：todo

尚无 Chat Backend API 与 Chat Mobile 业务实现，当前不能形成文字消息端到端联调证据。

## 验收

状态：todo

待设计 Gate、Backend、Mobile 与集成链路具备真实证据后，再定义并执行本 Feature 的端到端验收。
