---
status: designing
last_updated: 2026-08-30
schema: messaging
source: 设计聊天领域
---

# 应用服务与领域事件

本页固化 Chat Domain 的**用例清单、事务边界、领域事件定义与实时分发边界**。

状态划分：

| 内容 | 状态 |
| --- | --- |
| 「不新建 Notification 域」等边界决策 | `baseline` |
| 三个领域事件与发布时机 | `baseline` |
| Outbox 机制与表结构 | `baseline`（项目级基础设施，不算 Chat 核心业务表） |
| 各用例的请求/响应字段、错误码、分页契约 | `designing`（主会话尚未逐项展开） |

---

## 用例清单

主会话在数据库定稿后给出的用例清单，用于检查数据库设计是否覆盖全部业务流程：

```text
getOrCreateDirectConversation
sendTextMessage
sendImageMessage
listConversations
listMessages
markConversationRead
recallMessage
hideConversation
clearConversationHistory
pinConversation
muteConversation
```

已确定的行为要点：

| 用例 | 已确定行为 |
| --- | --- |
| `getOrCreateDirectConversation` | 归一化 `low/high`；事务内创建；捕获唯一冲突后回查返回；创建时同事务建立 `conversation + direct + member×2 + user_state×2` |
| `sendTextMessage` | 单事务完成：权限校验 → 幂等 → 分配 seq → 插 message → 插 text → 更新 last_message_* → 推进 sender 已读 → 恢复 hidden → 提交 |
| `sendImageMessage` | 上传在事务外完成且 asset 必须 READY；事务内验证 asset 可用 → 插 message → 插 N 条 image → 更新水位 → 推进已读 → 恢复 hidden |
| `listConversations` | 先按 `member.user_id` 取会话；排除 `last_message_id IS NULL`；排序 `is_pinned DESC, pinned_at DESC, last_message_at DESC`；未读数聚合查询 |
| `listMessages` | `WHERE conversation_id = ? AND seq > cleared_before_seq AND seq < before_seq ORDER BY seq DESC LIMIT 50` |
| `markConversationRead` | `last_read_seq = GREATEST(last_read_seq, requested)`；服务端校验 `0 <= requested <= last_message_seq`；同时更新 `last_read_at` |
| `recallMessage` | 只允许撤回自己发送的消息；只改 `status`/`recalled_at`；原始 subtype 保留；不回退 `last_message_id` |
| `hideConversation` | 只写 `hidden_at`；不推进已读；不删除 conversation |
| `clearConversationHistory` | 同事务更新 `cleared_before_seq` 与 `last_read_seq = GREATEST(last_read_seq, cleared_before_seq)`；不删除消息 |
| `pinConversation` | 维护 `is_pinned` 与 `pinned_at` 的一致性（`false` ⇒ `pinned_at = NULL`） |
| `muteConversation` | 只写 `is_muted` |

字段级请求/响应契约、错误码、分页游标与鉴权细节尚未在主会话展开，标记为 `designing`，文档维护阶段不得自行补全。

---

## 领域事件

核心原则：

> 数据库事务负责写入聊天事实；事务提交之后，再把「发生了什么」发布出去。

第一阶段只定义三个事件。事件只表达聊天事实，消费端需要详情时再查 Chat Query。

### `MessageCreated`

```text
event_id
conversation_id
message_id
message_seq
sender_user_id
message_type
occurred_at
```

不要把完整文本、图片地址之类全部塞进事件。

### `MessageRecalled`

```text
event_id
conversation_id
message_id
message_seq
recalled_by_user_id
occurred_at
```

### `ConversationRead`

```text
event_id
conversation_id
user_id
last_read_seq
occurred_at
```

对方客户端据此实时更新「已读」。

---

## 发布时机

**事件不能在事务提交前直接发 WebSocket。** 错误流程是：插入消息 → WebSocket 推送成功 → 数据库 COMMIT 失败，用户会看到一条实际不存在的消息。

正确顺序：

```text
BEGIN
  ↓
写 conversation / message / subtype
  ↓
写 outbox_event
  ↓
COMMIT
  ↓
事件分发器发布
  ↓
WebSocket / Push
```

但这带来另一个问题：数据库已 COMMIT 而程序崩溃，事件未发布。因此需要 Outbox 机制。

---

## Outbox 机制

Outbox 是**基础设施模式，不是新业务域**。发送消息事务里把 `chat_message` + 内容 subtype + `chat_conversation` 更新 + outbox event 一起提交；事务提交后由后台 worker 扫描未发布事件并投递。

主会话给出的参考结构（`illustrative` 字段类型，最终属项目级基础设施设计）：

```sql
CREATE TABLE chat_outbox_event (
    id            BIGINT PRIMARY KEY,
    event_type    VARCHAR(64) NOT NULL,
    aggregate_id  BIGINT NOT NULL,
    payload       JSONB NOT NULL,
    occurred_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at  TIMESTAMPTZ NULL
);

CREATE INDEX idx_chat_outbox_unpublished
    ON chat_outbox_event(id)
    WHERE published_at IS NULL;
```

Worker 查询：

```sql
SELECT *
FROM chat_outbox_event
WHERE published_at IS NULL
ORDER BY id
LIMIT 100;
```

partial index 让扫描不会不断扫过已发布的大量历史事件。

**命名**：`chat_outbox_event` 是 Chat 视角的临时命名。主会话倾向后续统一为 `system_outbox_event` 或基础设施 schema 下的 `infra_outbox_event`，等后面统一设计项目级事件可靠投递机制时决定。当前**先设计机制，不急着定死成 Chat 专属表**，也不把它算进 Chat 核心业务表数量。

对当前架构不需要 Kafka/RabbitMQ，PostgreSQL 足够。

---

## 实时分发边界

不要加 `is_delivered` / `websocket_sent` / `push_sent` 到 `chat_message`。这些是传输状态，不是消息业务事实。

```text
chat_message   只关心消息本身
outbox         负责可靠地把事件交出去
WebSocket/Push 负责最终送达客户端
```

---

## 明确否决：不新建 Notification 域

主会话曾提出未来可拆出 Notification Domain 消费 Chat 事件。用户明确指出：

> 但是一开始的项目设计没有说有 notification domain

因此**不因为讨论到推送就临时新增一个 Notification Domain**。当前更合适的做法是把通知/实时分发当成基础设施能力，而不是业务域：

```text
Chat Domain
  ├── MessageCreated
  ├── MessageRecalled
  └── ConversationRead

Application / Infrastructure
  ├── WebSocket 推送
  ├── App Push
  └── 在线状态同步
```

Chat Domain 只负责表达「聊天里发生了什么」；这些事件怎么送到客户端，由应用层/基础设施层处理。实时 WebSocket 推送如果只是把聊天变化同步给在线客户端，视为 Chat 的应用/基础设施能力，不单独建「Realtime Domain」。

若未来真要设计「推送通知、系统通知、营销通知、设备 token」，再单独开 Notification Domain——那属于主架构会话的扩域决策，不在文档维护阶段自行决定。
