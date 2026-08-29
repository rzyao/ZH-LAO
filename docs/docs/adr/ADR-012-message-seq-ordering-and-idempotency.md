---
status: frozen
date: 2026-08-30
---

# ADR-012：会话内 `seq` 严格排序与 `client_message_id` 幂等

## 决策

每条消息在所属会话内拥有严格递增的 `seq`。消息排序、分页、同步、未读、断点续传一律使用 `seq`，**不依赖 `created_at`**。`id` 只承担全局消息身份。

`seq` 通过在事务内原子自增 `chat_conversation.last_message_seq` 分配：

```sql
UPDATE chat_conversation
SET last_message_seq = last_message_seq + 1
WHERE id = ? AND status = 1
RETURNING last_message_seq;
```

同时每条消息携带客户端生成的 `client_message_id UUID`，并以 `UNIQUE (sender_user_id, client_message_id)` 保证网络重试不产生重复消息；唯一冲突视为 idempotent success 而非业务错误。

## 原因

`created_at` 在并发写入、重试、数据导入和多节点场景下可能撞时间戳，无法提供稳定顺序。`SELECT MAX(seq) + 1` 在并发下会撞号。把分配放进事务内的 `UPDATE ... RETURNING`，既利用行锁串行化，又能在回滚时不产生序号空洞。

聊天消息极易出现「用户点发送 → 网络超时 → 再次发送」；没有幂等键会产生重复消息。这是聊天可靠性核心能力，不是提前过度设计。

## 后果

- 同一个会话的并发发送会在 conversation 行上串行；对 1 对 1 私聊完全可以接受，换来严格顺序、简单实现、无重复 seq。
- 消息主体、内容 subtype、会话水位必须在同一事务写入，多图消息必须全有或全无。
- 发送者自己的 `last_read_seq` 在发送成功后自动推进，使游标始终表示「已处理到的最新会话位置」。
- 未来大型群聊出现行锁热点时，再评估分布式 sequence allocator、Snowflake ordering 或 Kafka partition offset。
- 字段级规格见 [消息模型](../domains/messaging/message.md)。
