---
feature_id: chat-realtime
title: 实时消息传输与重连
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
  design: Chat 已确定事务提交后事件分发、Outbox 与 seq 同步边界；Chat 专用频道协议、重连与 replay 策略仍未冻结，Mobile 仅有无真实 transport 的 Foundation skeleton。
---

# 实时消息传输与重连

## 功能概览

Portfolio Status：`active`。

`chat-realtime` 负责把已经提交的 Chat 事实同步给在线客户端，并在连接中断后依据服务器持久化事实恢复一致状态。Chat Domain 自身不把 WebSocket 连接、`websocket_sent`、`is_delivered` 等传输状态写进 `chat_message`；可靠事实仍以数据库中的 conversation/message、`seq` 与已读游标为准。

当前 canonical 的实时边界是“事务内写 Chat 事实 + Outbox，提交后再由应用/基础设施分发”。重连/同步不能依赖逐消息 receipt table，也不能把 delivery/read 状态扩成新的消息状态。

## 设计

状态：active

范围：定义 `MessageCreated`、`MessageRecalled`、`ConversationRead` 等提交后事件如何进入实时分发，以及客户端如何以 `seq` / 查询结果恢复消息顺序与缺口；不在 Chat 业务模型里持久化连接状态或逐消息 delivery receipt。权威事实来自 [应用服务与领域事件](/domains/chat/application-and-events) 与 [消息模型](/domains/chat/message)。

Stage / 工件：[应用服务与领域事件](/domains/chat/application-and-events) 已确定事务提交前不得直接发 WebSocket、Chat 事件通过全系统 `system_outbox_events` 可靠交付的边界；[消息模型](/domains/chat/message) 已固定 `seq` 作为排序、分页、同步与断点续传依据。Mobile Foundation 已提供 `RealtimeClient` 接口、连接状态与订阅原语，但源码明确声明不包含 chat message protocol、conversation subscription semantics、reconnect + replay policy。

已完成内容：已固定“数据库事实优先、提交后分发”的一致性原则；不在 `chat_message` 增加 `is_delivered` / `websocket_sent`；Backend 已有通用 Outbox publisher 基础设施，Mobile 已有通用 realtime interface 与 no-op 测试骨架。

当前进行内容：Chat 专用 event envelope / channel 命名、鉴权与订阅语义、断线后的 reconnect/backoff、从哪个 `seq` replay / 补拉、实时事件与 REST 查询去重等协议尚未在 canonical 中冻结。现有 Mobile `createNoopRealtimeClient()` 只在内存中回送 payload，不发送到设备外，也不是实际 Chat transport。

Gate / Evidence：当前 `main` 能证明实时基础设施边界与接口 skeleton 已存在，但 `apps/backend/src/modules/` 没有 Chat 模块，Mobile realtime 源码与测试都明确说明“no real transport / no chat protocol”，且未发现 Chat Realtime Feature 级 Design Gate；因此设计 Lane 保持 `active`，Backend/Mobile 不提升状态。

下一步：先冻结 Chat realtime protocol、conversation subscription、重连与 replay / 补拉规则，并明确 `seq` 缺口恢复与幂等去重契约；形成 Design Gate 后再实现服务器 transport adapter 与 Mobile Chat realtime adapter。

## Backend

状态：todo

Backend 已有通用 `system_outbox_events` 发布基础设施，但 `apps/backend/src/modules/` 当前没有 Chat 模块，也没有 Chat event producer、WebSocket / realtime transport adapter、conversation subscription 或 replay endpoint 的实现证据。通用 Outbox 不能等同于 Chat 实时传输已经实现。

## Admin

状态：na

不适用：实时消息传输与重连是用户侧 Chat 的应用/基础设施能力，当前不需要独立 Admin 交付端。

## Mobile

状态：todo

Mobile Foundation 已有 `RealtimeClient`、`useRealtimeConnection` 与连接状态接口，但源码明确把 chat protocol、conversation subscription、delivery/read receipt semantics、reconnect + replay policy 列为非范围；测试使用的是 no-op in-memory client。当前没有 Chat 频道订阅、消息增量合并、断线补拉或真实 transport 实现，因此 Mobile Lane 保持 todo。

## 集成

状态：todo

尚无服务器 Chat transport 与 Mobile Chat adapter，当前没有“提交消息 → Outbox → 实时事件 → 客户端增量更新 → 断线后按 seq 补拉”的真实端到端联调证据。

## 验收

状态：todo

待协议、Backend transport、Mobile adapter 与集成链路完成后，再验收顺序一致性、重复事件去重、断线重连、缺口补拉、撤回同步与已读游标同步。
