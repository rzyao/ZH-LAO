---
status: designing
last_updated: 2026-08-30
schema: chat
source: 设计聊天领域
source_conversation_id: 6a9319c2-2204-83ea-9341-7a57757a3082
---

# 应用服务与领域事件

本页固化 Chat 域的**用例清单、`canChat()` 权限契约、领域事件定义与实时分发边界**。

状态划分：

| 内容 | 状态 |
| --- | --- |
| 「不新增 Notification 域」等边界决策 | `baseline` |
| `canChat()` 权限契约 | `frozen` |
| `listConversations` 过滤条件 | `frozen` |
| 三个领域事件与发布时机 | `baseline` |
| Outbox 机制 | `baseline`（命名已裁决为全系统唯一 `system_outbox_events`，物理字段 `designing`；不算 Chat Schema 业务表） |
| 各用例的请求/响应字段、错误码、分页契约 | `designing`（主方案尚未逐项展开） |

---

## 用例清单

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

**当前不存在 `sendGiftMessage()`。** 礼物集成 `deferred`，用例集合在礼物被正式设计之前保持上述 11 个。

已确定的行为要点：

| 用例 | 已确定行为 |
| --- | --- |
| `getOrCreateDirectConversation` | 归一化 `low/high`；事务内创建；捕获唯一冲突后回查返回；创建时同事务建立 `conversation + direct + member×2 + user_state×2`；**这是创建成员的唯一入口** |
| `sendTextMessage` | 单事务完成：`canChat()` → 幂等 → 分配 seq → 插 message → 插 text → 更新 last_message_* → 推进 sender 已读 → 恢复 hidden → 提交 |
| `sendImageMessage` | 上传在事务外完成且 asset 必须 READY；事务内验证 asset 可用 → 插 message → 插 N 条 image → 更新水位 → 推进已读 → 恢复 hidden |
| `listConversations` | 三条过滤缺一不可，见下方 |
| `listMessages` | `WHERE conversation_id = ? AND seq > cleared_before_seq AND seq < before_seq ORDER BY seq DESC LIMIT 50` |
| `markConversationRead` | `last_read_seq = GREATEST(last_read_seq, requested)`；服务端校验 `0 <= requested <= last_message_seq`；同时更新 `last_read_at` |
| `recallMessage` | 只允许撤回自己发送的消息；只改 `status`/`recalled_at`；原始 subtype 保留；不回退 `last_message_id` |
| `hideConversation` | 只写 `hidden_at`；不推进已读；不删除 conversation |
| `clearConversationHistory` | 同事务更新 `cleared_before_seq` 与 `last_read_seq = GREATEST(last_read_seq, cleared_before_seq)`；不删除消息 |
| `pinConversation` | 维护 `is_pinned` 与 `pinned_at` 的一致性（`false` ⇒ `pinned_at = NULL`） |
| `muteConversation` | 只写 `is_muted` |

### `listConversations` 过滤条件（`frozen`）

```sql
SELECT ...
FROM chat_conversation_member m
JOIN chat_conversation c          ON c.id = m.conversation_id
JOIN chat_conversation_user_state s
  ON  s.conversation_id = m.conversation_id
  AND s.user_id = m.user_id
WHERE m.user_id = :current_user
  AND c.last_message_id IS NOT NULL   -- 空会话不进列表
  AND s.hidden_at IS NULL             -- 已隐藏的会话不出现在列表
ORDER BY s.is_pinned DESC, s.pinned_at DESC, c.last_message_at DESC;
```

三个条件缺一不可：

| 条件 | 缺失后果 |
| --- | --- |
| `m.user_id = :current_user` | 看到别人的会话 |
| `c.last_message_id IS NOT NULL` | 匹配后未说话的空会话塞满聊天列表 |
| `s.hidden_at IS NULL` | 「删除/隐藏聊天」后会话仍然出现在列表 |

字段级请求/响应契约、错误码、分页游标与鉴权细节尚未在主方案展开，标记为 `designing`，文档维护阶段不得自行补全。

---

## canChat 权限契约

`canChat(sender, recipient)` 是 Chat 域唯一的发消息授权入口。Chat **不复制** Social 的状态机，只在发送时读取 Social 与 Trust & Safety 暴露的事实。

### 判定顺序

| # | 条件 | 不满足时 | 依据来源 |
| --- | --- | --- | --- |
| 1 | `conversation.status = 'active'` | 拒绝 | Chat 自有事实 |
| 2 | `sender` 是该 conversation 的 member | 拒绝 | `chat_conversation_member`（数据库已用复合 FK 保证） |
| 3 | 当前 Social 关系授予聊天权限 | 拒绝 | Social 暴露的关系事实 |
| 4 | 双方之间无 `social_blocks` 记录 | 拒绝 | Social 当前关系事实 |
| 5 | 无 Trust & Safety 针对 messaging 的 restriction | 拒绝 | Trust & Safety 的 Restriction |
| 6 | — | — | **paused 不影响已有 Match 与聊天**，不参与判定 |
| 7 | — | — | **不检查任何付费权益**：Match 后聊天永久免费 |

### 明确裁定

- **paused 只退出 Discovery，不影响已有 Match 与已有会话的聊天。** paused 用户仍然可以正常收发消息。
- **Match 后聊天永久免费。** 不检查会员、权益、余额或任何付费状态；未来若出现「必须付费才能继续聊」的产品形态，属于新的商业模式变更，需重新裁决而非在此追加条件。
- **Block 双向阻断**：只要任一方存在 block 记录，双方都不能再发送新消息；已发出的历史消息保留。
- **解除 Match / 取消关注不关闭会话。** conversation 仍然存在，历史消息仍然保留；再次获得聊天权限后继续复用原 conversation。
- **竞争窗口**：请求进入系统时具备发送资格即允许本次消息完成，不做跨聚合锁。下一条消息按最新关系重新判定。

### 边界

- 判定发生在应用层，**不是**数据库外键或触发器。Chat 不存 `match_id`、relationship status。
- 模块化单体下可与发送在同一请求内完成，但不要把 Social 表结构硬编码进 Chat Repository；Chat 只依赖 `canChat()` 这个契约。

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
public_id
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
public_id
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
写 outbox 事件行
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

Outbox 是**基础设施模式，不是新业务域**。发送消息事务里把 `chat_message` + 内容 subtype + `chat_conversation` 更新 + outbox 事件行一起提交；事务提交后由后台 worker 扫描未发布事件并投递。

主方案给出的参考结构（`illustrative` 字段类型，最终属项目级基础设施设计）：

```sql
CREATE TABLE <infra>_outbox_event (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_type    VARCHAR(64) NOT NULL,
    aggregate_id  BIGINT NOT NULL,
    payload       JSONB NOT NULL,
    occurred_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at  TIMESTAMPTZ NULL
);

CREATE INDEX idx_outbox_unpublished
    ON <infra>_outbox_event(id)
    WHERE published_at IS NULL;
```

Worker 查询：

```sql
SELECT *
FROM <infra>_outbox_event
WHERE published_at IS NULL
ORDER BY id
LIMIT 100;
```

partial index 让扫描不会不断扫过已发布的大量历史事件。

**命名已裁决**（全局最终版 [ADR-018](../adr/ADR-018-global-database-design-principles-final.md)，台账 D-117 / D-127）：统一为全系统**唯一一套** `system_outbox_events`（Platform Infrastructure，`source_domain` 区分来源，不按域分表，不算 Chat Schema 业务表）。上文示例中的 `<infra>_outbox_event` 仅为机制示意。剩余为其物理字段、索引与 retention 参数（`designing`）；在定稿前 `MessageCreated` 等事件没有持久化保障，实现时不得假设事件一定可达。

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

主方案曾提出未来可拆出 Notification Domain 消费 Chat 事件。用户明确指出：

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

Chat 域只负责表达「聊天里发生了什么」；这些事件怎么送到客户端，由应用层/基础设施层处理。实时 WebSocket 推送如果只是把聊天变化同步给在线客户端，视为 Chat 的应用/基础设施能力，不单独建「Realtime Domain」。

若未来真要设计「推送通知、系统通知、营销通知、设备 token」，再单独开 Notification Domain——那属于主方案的扩域决策，不在文档维护阶段自行决定。
