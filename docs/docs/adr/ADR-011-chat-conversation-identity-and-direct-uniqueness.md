---
status: frozen
date: 2026-08-30
---

# ADR-011：Chat Conversation 与 Social Match 解耦，Direct 用户对唯一

## 决策

Chat Conversation 不隶属于 Social Match。Chat 表不保存 `match_id`、`follow_id` 或 relationship status；是否允许发送消息在发送时由业务策略读取 Social 暴露的关系状态判断。

同一对用户全生命周期**只有一个 Direct Conversation**，由 `chat_direct_conversation` 的 `UNIQUE (user_low_id, user_high_id)` 在数据库层保证，其中 `user_low_id = min(A, B)`、`user_high_id = max(A, B)`，并由 `CHECK (user_low_id < user_high_id)` 同时禁止自己与自己会话。

另外严格区分三层状态：

- `chat_conversation`：共享会话事实与消息水位。
- `chat_conversation_member`：成员身份与已读游标。
- `chat_conversation_user_state`：用户个人的置顶、免打扰、隐藏、清空。

## 原因

Social Relationship 表达「为什么两个人可以聊天」，Chat Conversation 表达「他们聊天产生的数据容器」，二者生命周期不同：取消关注改变社交关系，但历史聊天记录仍然存在。若聊天直接依赖当前 match 状态，会产生严重的生命周期耦合。

「先 SELECT 再 INSERT」无法在并发下保证用户对唯一；把不变量下沉到数据库唯一约束，可以让 `create(A,B)` 与 `create(B,A)` 并发时只有一个成功。

共享实体与用户资源必须分离，否则 A 删除会话会连带删除 B 的会话——这是聊天数据库最容易设计错的地方。

## 后果

- `getOrCreateDirectConversation` 必须捕获唯一冲突后回查已有会话，而不是只做「查不到就建」。
- 取消关注、解除匹配、拉黑、隐藏聊天、清空记录、用户注销都不能删除或关闭 conversation；只有真正的系统级处置才使用 `CLOSED`。
- 聊天列表不展示 `last_message_id IS NULL` 的空会话，因此可以提前 get-or-create 而不制造空白条目。
- 未来群聊通过新增 `chat_group_conversation` 等 subtype 表扩展，不推翻当前模型。
- 字段级规格见 [会话模型](../domains/messaging/conversation.md)。
