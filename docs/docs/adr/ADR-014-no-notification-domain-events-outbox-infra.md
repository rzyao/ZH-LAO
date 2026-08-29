---
status: baseline
date: 2026-08-30
---

# ADR-014：不新增 Notification 域，聊天事件由 Outbox 可靠投递

## 决策

不因为讨论到推送而临时新增 Notification Domain，也不单独建「Realtime Domain」。

Chat Domain 在数据库事务提交后发布三个领域事件：`MessageCreated`、`MessageRecalled`、`ConversationRead`。事件只表达聊天事实（ID、seq、参与者、时间），不塞完整文本与图片地址；消费端需要详情时再查 Chat Query。

为保证「消息存在则事件一定存在」，事件写入 Outbox 表并与消息在同一事务提交，随后由后台 worker 扫描未发布事件投递到 WebSocket / App Push。WebSocket 推送、App Push、在线状态同步属于 Application / Infrastructure 能力。

不把 `is_delivered`、`websocket_sent`、`push_sent` 写进 `chat_message`——这些是传输状态，不是消息业务事实。

## 原因

用户明确指出「一开始的项目设计没有说有 notification domain」，因此不应在 Chat 设计过程中随意扩域。

事件不能在事务提交前直接推送：否则会出现「WebSocket 推送成功但 COMMIT 失败」，用户看到一条实际不存在的消息。只在提交后发事件则会遇到「COMMIT 成功但进程崩溃，事件丢失」，Outbox 用同一事务写入解决这个缺口。

当前架构不需要 Kafka/RabbitMQ，PostgreSQL 足够。

## 后果

- Chat 事务必须包含 outbox 行写入。
- `chat_outbox_event` 是 Chat 视角的临时命名，后续应统一为项目级基础设施表（例如 `system_outbox_event` 或 `infra_outbox_event`）；当前先设计机制，不把它算进 Chat 核心业务表数量。
- 未来若要设计推送通知、系统通知、营销通知、设备 token，需由主架构会话决定是否单独开 Notification Domain；文档维护阶段不自行扩域。
- 事件与用例规格见 [应用服务与事件](../domains/chat/application-and-events.md)。
