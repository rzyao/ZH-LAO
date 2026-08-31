---
feature_id: chat-recall
title: 消息撤回
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
  design: 撤回已冻结为 chat_message 自身的 normal/recalled 生命周期；公共 recallMessage API 与错误契约仍未形成 Feature 级 Design Gate。
---

# 消息撤回

## 功能概览

Portfolio Status：`active`。

`chat-recall` 负责发送者撤回自己已经发送的消息。当前 canonical 不创建 `chat_message_recall` 实体或表，也不 DELETE 消息：撤回只把 `chat_message.status` 从 `normal` 改为 `recalled` 并写入 `recalled_at`，原始 `chat_message_text` / `chat_message_image` subtype 保留用于治理、审计与纠纷取证。

撤回最后一条消息不会回退 `chat_conversation.last_message_id`；客户端根据消息生命周期状态展示“消息已撤回”，而不是把数据库原文覆盖成提示文本。

## 设计

状态：active

范围：定义消息撤回权限、生命周期变化、原始内容保留、会话水位行为与 `MessageRecalled` 事件边界。权威事实来自 [消息模型](/domains/chat/message) 与 [应用服务与领域事件](/domains/chat/application-and-events)。

Stage / 工件：`chat_message.status IN ('normal','recalled')`、`recalled_at` 一致性约束、仅发送者可撤回及原 subtype 保留已经进入 frozen canonical；`database/v2/migrations/0800_chat.sql` 已实际落地相同状态与 CHECK 约束。

已完成内容：已明确撤回不是独立实体、不建 recall table、不物理删除、不覆盖原始内容；`recallMessage` 只允许操作本人消息，撤回后保留原 seq 和 conversation last-message 指针，并以 `MessageRecalled` 表达事务提交后的聊天事实。

当前进行内容：`recallMessage` 的公共请求/响应字段、错误码（例如非发送者、消息不存在、重复撤回等最终对外语义）仍未在 canonical 应用契约中冻结；当前没有 Feature 级 Design Gate。

Gate / Evidence：消息生命周期模型与真实数据库迁移一致，足以证明撤回模型不是独立表；但当前 `main` 未发现 Chat Feature 级 Design Gate，因此设计 Lane 保持 `active` 而非 `done`。

下一步：冻结 `recallMessage` API / 错误契约并建立 Design Gate，再实现对应 Backend command、Repository 更新、Outbox 事件与查询映射。

## Backend

状态：todo

当前 `apps/backend/src/modules/` 不存在 Chat 模块，也没有 `recallMessage` Service / Repository / Route。数据库中的 `status` / `recalled_at` 字段只是可执行的数据基线，不代表撤回业务命令已经实现。

## Admin

状态：na

不适用：用户撤回是用户侧聊天能力；Trust / Operations 的治理动作属于其它职责，不在本 Feature 新建 Admin 撤回模型。

## Mobile

状态：todo

当前 `apps/mobile/src/features/` 尚无 Chat 模块、消息长按操作、撤回状态气泡或 recall API 接入，因此没有 Mobile 实现证据。

## 集成

状态：todo

尚无真实 `recallMessage` Backend 与 Chat Mobile 链路，也没有 `MessageRecalled` 到客户端状态更新的端到端联调证据。

## 验收

状态：todo

待设计 Gate、Backend、Mobile 和事件分发链路具备真实证据后，再验证权限、原内容保留、幂等/重复操作语义与客户端撤回展示。
