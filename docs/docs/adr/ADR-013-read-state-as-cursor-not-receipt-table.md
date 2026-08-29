---
status: frozen
date: 2026-08-30
---

# ADR-013：已读使用 `last_read_seq` 游标，不建 Receipt 表

## 决策

每个成员在 `chat_conversation_member` 上只维护一个已读游标 `last_read_seq`（及辅助的 `last_read_at`）。

- `last_read_seq` 是真相，未读数是派生值，不把两者同时当真相。
- 未读数通过区间查询计算，不能用 `last_message_seq - last_read_seq` 简单相减。
- `last_read_seq` 只能单调递增，多设备乱序上报时使用 `GREATEST`。
- 对方是否已读由 `peer.last_read_seq >= my_message.seq` 推导。
- 第一阶段不建 `chat_message_receipt`、`chat_delivery_receipt`，不记录消息是否送达对方设备，也不把 `SENDING/SENT/DELIVERED/READ` 放进 `chat_message.status`。

## 原因

1 对 1 私聊里，逐条 receipt 会带来明显的写放大，而普通交友私聊并不需要「第 41 条在 10:01 被读、第 42 条在 10:03 被读」这种精度。游标模型足以支撑已读回执、双勾状态、未读 badge 和聊天列表。

`unread_count` 与 `last_read_seq` 并存会产生互相依赖的两份真相；只保留一份可避免「游标 500、未读 7、实际 5 条」这类矛盾。

送达状态会立刻引入 device、push、websocket、offline delivery、multi-device 复杂度，第一阶段产品只需要「服务器已接受」与「已读/未读」。

## 后果

- 未读数在第一阶段用聚合查询获得；等真实数据量起来再引入 projection 或缓存列，当前不提前双写。
- 清空聊天记录时必须同步推进 `last_read_seq`，否则会出现「消息看不到但 badge 还显示未读」。
- 隐藏会话不推进已读；`hidden_at` 与 `last_read_seq` 完全独立。
- 未来企业客服、强审计或逐条送达时间需求出现时，再设计 `chat_message_receipt`。
- 字段级规格见 [会话模型](../domains/messaging/conversation.md)。
