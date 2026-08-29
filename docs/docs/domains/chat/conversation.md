---
status: frozen
last_updated: 2026-08-30
schema: chat
source: 设计聊天领域
source_conversation_id: 6a9319c2-2204-83ea-9341-7a57757a3082
---

# 会话模型

会话聚合由四张表组成，职责严格分离：

```text
chat_conversation              共享会话事实与消息水位
chat_direct_conversation       Direct 双方身份 + 用户对唯一性（subtype / invariant 表）
chat_conversation_member       谁属于这个会话 + 读到哪里（membership truth）
chat_conversation_user_state   用户自己的聊天列表/UI 状态（user preference truth）
```

三者都存用户属于**有意的数据重复**：`chat_direct_conversation` 保证 Direct 唯一身份，`chat_conversation_member` 表达成员状态与生命周期。二者不可合并。

---

## `chat_conversation` — 会话聚合根

它只表示「一个聊天会话实体存在，并且当前处于什么整体状态」。

| 字段 | 类型 | Null | 默认/约束 | 说明 |
| --- | --- | --- | --- | --- |
| `id` | `bigint generated always as identity` | 否 | PK | 内部会话 ID（Chat 内部使用，不对外） |
| `public_id` | `uuid` | 否 | UNIQUE | 对外/跨域会话 ID；应用层生成，创建后不可修改 |
| `type` | `varchar(32)` | 否 | CHECK `IN ('direct')` | 会话类型 |
| `status` | `varchar(32)` | 否 | CHECK `IN ('active','closed')` | 会话整体状态 |
| `last_message_seq` | `bigint` | 否 | DEFAULT `0`；CHECK `>= 0` | 会话内消息水位，同时用于分配下一条 seq |
| `last_message_id` | `bigint` | 是 | FK → `chat_message(id)`（在 message 建表后追加） | 查询冗余指针；chat_message 与 chat_conversation 的双向引用因追加顺序而可行 |
| `last_message_at` | `timestamptz` | 是 | — | 聊天列表排序依据 |
| `created_at` | `timestamptz` | 否 | DEFAULT `now()` | 创建时间 |
| `updated_at` | `timestamptz` | 否 | DEFAULT `now()` | 更新时间 |

一致性约束：

- `type` CHECK `IN ('direct')`、`status` CHECK `IN ('active','closed')`、`last_message_seq >= 0`。
- **全域审计最终修正版已移除** `last_message_seq / last_message_id / last_message_at` 的组合 CHECK：该 CHECK 与「先原子分配 seq、再插消息、最后更新 last_message 指针」的正常事务流程冲突，三项一致性改由同一 application transaction 保证（见 [数据库总览](database.md) 的 Application-Level Invariants）。
- `last_message_id` 在 `chat_message` 建表后追加 FK → `chat_message(id)`，避免建表顺序上的循环依赖。

### 枚举语义

`ConversationType`：`'direct'`。未来可扩 `'group'`、`'system'`、`'customer_service'`，但当前 CHECK 只允许 `'direct'`，等真正支持时再放宽。

`ConversationStatus`：`'active'`、`'closed'`。`'closed'` 是**非常强的系统级状态**，只用于后台永久关闭异常会话、系统迁移废弃、严重违规导致整个会话不可继续使用。

以下行为都**不能**把 conversation 置为 closed，也**不能**删除 conversation：

```text
取消关注      解除匹配      拉黑
隐藏聊天      删除聊天      清空聊天记录      用户注销
```

### 明确不存在的字段

| 不建 | 原因 |
| --- | --- |
| `created_by` | Direct 会话是双方共同资源，语义是 `getOrCreateDirectConversation(A,B)`，不是「谁创建了房间」；未来要分析谁先发起，应从第一条真实消息或领域事件判断 |
| `user1_id` / `user2_id` | 属于 `chat_direct_conversation` 与 member；共享实体不承载参与者身份 |
| `last_read_message_id` / `unread_count` | 已读是成员维度，未读是派生值 |
| `message_count` | 一致性成本高且当前无核心业务需要；统计走查询、分析系统或异步 projection |
| `last_activity_at` | 语义模糊（发消息、已读、送礼、撤回、进入页面算不算？）；排序应明确使用 `last_message_at` |
| `metadata JSONB` | 早期「万能逃生口」；Chat 是核心数据域，不知道放什么就不要创建 |
| `deleted_at` | conversation 是共享资源；用户「删除聊天」是隐藏，不是删除 |
| `match_id` / `follow_id` / `relationship_status` | Social 关系生命周期与会话身份生命周期不同 |
| `peer_name` / `peer_avatar_url` | 属 Social/Profile；聊天查询服务组合 profile projection |

### `last_message_*` 是明确的派生状态

`source of truth = chat_message`。三个字段都是查询冗余；即使异步更新短暂不一致也不会破坏聊天记录。

全域审计最终修正版决定：`last_message_id` 在 `chat_message` 建表后追加 FK → `chat_message(id)`（它是 Chat 内部引用，允许真实 FK；通过追加顺序避免建表循环依赖）。但以下规则无法靠 FK 完整保证，属 application-level invariant（见 [数据库总览](database.md)）：`last_message_id` 指向的 message 必须属于当前 conversation，且 `message.seq = last_message_seq`。

**撤回最后一条消息后，不把 `last_message_id` 回退到上一条。** 最后一条消息仍然是那条被撤回的消息，只是展示为「对方撤回了一条消息」。管理员移除同理，由展示层决定摘要，不重算上一条。

### 生命周期

```text
双方第一次需要进入聊天
      ↓
getOrCreateDirectConversation
      ↓ 不存在时，同一事务创建：
chat_conversation
chat_direct_conversation
chat_conversation_member × 2
chat_conversation_user_state × 2

取消关注        → conversation 不删除
重新互相关注    → 直接恢复使用原 conversation
用户删除聊天    → conversation 不删除，只改自己的 user_state
用户注销        → conversation 仍不物理删除；匿名化与保留由 Account/Privacy/Compliance 规则决定
```

---

## `chat_direct_conversation` — Direct 身份不变量表

职责单一：表达「这个 Direct Conversation 对应哪两个用户」，并在数据库层保证同一对用户只能存在一个私聊会话。

| 字段 | 类型 | Null | 默认/约束 | 说明 |
| --- | --- | --- | --- | --- |
| `conversation_id` | `bigint` | 否 | PK；FK → `chat_conversation(id)` | 一对一引用会话 |
| `user_low_id` | `uuid` | 否 | — | `min(userA_uuid, userB_uuid)`；Identity logical UUID，不建跨域 FK |
| `user_high_id` | `uuid` | 否 | CHECK `user_low_id < user_high_id` | `max(userA_uuid, userB_uuid)`；Identity logical UUID，不建跨域 FK |

```sql
CONSTRAINT uq_chat_direct_users UNIQUE (user_low_id, user_high_id);
```

统一规则：`user_low_id = min(userA_uuid, userB_uuid)`，`user_high_id = max(userA_uuid, userB_uuid)`（以 Identity logical UUID 做 canonical ordering）。因此数据库直接保证三件事：

```text
A-B 与 B-A 等价
一个用户不能和自己建立 Direct Conversation
同一用户对不能创建第二个 Direct Conversation
```

`user_low_id / user_high_id` 保存 Identity logical UUID，**不建立 Identity 物理 FK**（全域审计最终修正版，见 [数据库总览](database.md) 的「跨域边界」）。

### Direct 成员集合不变量（`frozen`）

数据库层目前只保证用户对唯一，**并不能**阻止一个 Direct conversation 出现第三个 member，也不能保证 member 恰好就是 low/high 两人。因此正式冻结下列领域不变量：

> **对 `type = 'direct'` 的 conversation，`chat_conversation_member` 必须恰好包含两条记录，且其 `user_id` 集合必须恰好等于 `{user_low_id, user_high_id}`。**
>
> 记作：`DirectConversationMembers = {user_low_id, user_high_id}`

执行约定：

- 成员**只能**通过 `getOrCreateDirectConversation()` 创建，不存在通用的 `addMember()` 入口；非 Direct 会话类型出现之前不得提供该能力。
- 不为此引入数据库触发器或复杂 CHECK——代价不值得。由应用服务在同一事务内创建两条 member，并由**集成测试**覆盖该不变量。
- 真正的关键唯一性（`A+B` 只有一个 conversation）已由 `UNIQUE(user_low_id, user_high_id)` 在数据库层保证。
- 全域审计最终修正版将其明确为 **application-level cross-row invariant**：每个 `chat_direct_conversation` 必须恰好有两个 member，且必须严格等于 `{user_low_id, user_high_id}`；Direct Conversation 禁止暴露普通 `addMember()` / `removeMember()` API，它不是可变成员集合（见 [数据库总览](database.md) Application-Level Invariants #3~#6）。

### 关键决策

- **不叫 `user1_id/user2_id`。** 「谁是第一」没有任何业务含义（发起人？当前用户？先注册的？）。`low/high` 明确表达这是 canonical ordering，不代表角色。
- **不存 `match_id`。** 第一次互关产生 match → conversation；解除后几年再互关，Social 可能形成新的关系事件甚至新的 match 记录，但 conversation 仍然是原来那个。
- **不存 `initiator_user_id`。** 会话身份是 `A ↔ B`，不是 `A → B`；「谁先发起」有多种定义，应由消息或事件判断。
- **不存 `status`。** 状态由 `chat_conversation.status` 统一管理；subtype 表重复状态会导致「哪个才是真状态」的歧义。
- **不存 `deleted_at`。** 生命周期统一由 `chat_conversation` 管理。
- **不保留 `created_at`。** 全域审计最终修正版为三列（conversation_id / user_low_id / user_high_id）。它是 Conversation 的 Direct subtype，不是独立生命周期实体；`chat_conversation.created_at` 已经存在。

### 创建算法：`getOrCreateDirectConversation`

应用层**不要**只做「先 SELECT，没有再 INSERT」。

```text
normalize(A, B) → low = min(A,B), high = max(A,B)
事务内创建：conversation + direct + member × 2 + user_state × 2
捕获 UNIQUE(user_low_id, user_high_id) 冲突 → 重新查询已有 conversation 并返回
```

即使两个用户同时第一次进入聊天（`create(A,B)` 与 `create(B,A)` 并发），数据库唯一约束最终也只让一个成功，另一个捕获冲突后回查。因此应用服务语义是 `getOrCreateDirectConversation`，不是 `createConversation`。

---

## `chat_conversation_member` — 成员真相

表示「谁属于这个 conversation，以及这个成员读到了哪里」。

| 字段 | 类型 | Null | 默认/约束 | 说明 |
| --- | --- | --- | --- | --- |
| `conversation_id` | `bigint` | 否 | PK 组成部分；FK → `chat_conversation(id)` | 会话 |
| `user_id` | `uuid` | 否 | PK 组成部分 | 成员用户 ID（Identity logical UUID，不建跨域 FK） |
| `joined_at` | `timestamptz` | 否 | DEFAULT `now()` | 成为成员的时间 |
| `last_read_seq` | `bigint` | 否 | DEFAULT `0`；CHECK `>= 0` | 已读游标，**核心字段** |
| `last_read_at` | `timestamptz` | 是 | — | 最近一次推进已读位置的时间（审计/同步/排障） |

```sql
CONSTRAINT ck_chat_member_last_read CHECK (
    (last_read_seq = 0 AND last_read_at IS NULL)
    OR
    (last_read_seq > 0 AND last_read_at IS NOT NULL)
);

CREATE INDEX idx_chat_member_user
    ON chat_conversation_member(user_id, conversation_id);
```

### 关键决策

- **不保留 `status`。** 主方案在总审查中明确删除。当前 Direct Chat 成员一旦建立就长期存在，不存在真正的 `left / removed` 生命周期；保留只有一个合法值的字段不符合原则。未来群聊/客服会话出现成员退出语义时再加。
- **不保留 `left_at`。** 没有真实的 member leave 业务；否则极易被误用成取消关注时间、拉黑时间、删除聊天时间。
- **不存 `unread_count`。** 与 `last_read_seq` 同时当真相会产生 `last_read_seq = 500` 但 `unread_count = 7` 而实际只有 5 条未读的矛盾。**`last_read_seq` 是真相，未读数是派生数据。**
- **不存 `last_delivered_message_id`。** 第一阶段只支持「服务器已接受」与「已读/未读」，不做复杂 delivery receipt。
- **不存 `is_pinned` / `is_muted` / `hidden_at`。** 属 `chat_conversation_user_state`，否则 member 表会变成垃圾桶。
- **不表达 Block。** `A block B` 属 Social / Safety / Relationship；B 并没有因此退出 conversation，历史聊天仍属双方。发送时由 `canChat()` 检查即可。
- **Social 状态变化不改 member。** 取消关注、解除互关、重新互关原则上都不修改本表。
- **不建 `MessageReceipt` 之类的已读实体。** 已读就是成员游标。

### `last_read_seq` 语义与更新规则

- 表示「该用户已确认读到本会话第 N 条消息」。
- **只能单调递增**。多设备乱序上报时必须使用 `GREATEST(last_read_seq, :requested)`。
- 更新时机是**用户实际进入会话、客户端确认消息进入已读范围后**，不是「收到消息」。
- 服务端校验 `0 <= requested_seq <= conversation.last_message_seq`（seq 由服务端生成）。
- **发送者自己发送成功后自动推进** `last_read_seq = GREATEST(last_read_seq, 新 seq)`，使游标始终表示「当前用户已处理到的最新会话位置」。
- **清空聊天记录时同步推进** `last_read_seq = GREATEST(last_read_seq, cleared_before_seq)`，否则会出现「消息看不到但 badge 还显示未读」。
- **隐藏会话不推进已读**。`hidden_at` 与 `last_read_seq` 完全独立。

---

## `chat_conversation_user_state` — 用户个人会话状态

保存某个成员自己的聊天 UI / 可见状态。

| 字段 | 类型 | Null | 默认/约束 | 说明 |
| --- | --- | --- | --- | --- |
| `conversation_id` | `bigint` | 否 | PK 组成部分 | 会话 |
| `user_id` | `uuid` | 否 | PK 组成部分 | 用户（Identity logical UUID，不建跨域 FK） |
| `hidden_at` | `timestamptz` | 是 | — | 从自己的聊天列表隐藏 |
| `cleared_before_seq` | `bigint` | 否 | DEFAULT `0`；CHECK `>= 0` | 该 seq 及以前的历史消息对该用户不再展示 |
| `is_pinned` | `boolean` | 否 | DEFAULT `false` | 是否置顶 |
| `pinned_at` | `timestamptz` | 是 | — | 置顶时间，用于多个置顶会话之间稳定排序 |
| `is_muted` | `boolean` | 否 | DEFAULT `false` | 是否免打扰 |
| `updated_at` | `timestamptz` | 否 | DEFAULT `now()` | 更新时间 |

```sql
CONSTRAINT fk_chat_conversation_user_state_member
    FOREIGN KEY (conversation_id, user_id)
    REFERENCES chat_conversation_member(conversation_id, user_id);

CONSTRAINT ck_chat_conversation_user_state_pin CHECK (
    (is_pinned = FALSE AND pinned_at IS NULL)
    OR
    (is_pinned = TRUE  AND pinned_at IS NOT NULL)
);

CREATE INDEX idx_chat_conversation_user_state_user
    ON chat_conversation_user_state(user_id, conversation_id);
```

复合 FK 到 member 的价值：数据库直接保证**不是 conversation member 就不可能拥有该 conversation 的个人状态**。这是 Chat 域内部约束，不存在跨域耦合问题，因此不需要再单独 FK `conversation_id → chat_conversation`。

### 字段语义

| 产品行为 | 字段 | 说明 |
| --- | --- | --- |
| 删除/隐藏会话 | `hidden_at` | 只是从自己的列表消失，conversation 并未删除 |
| 清空聊天记录 | `cleared_before_seq` | 移动历史可见起点，不逐条写隐藏，不删除消息 |
| 置顶 | `is_pinned` + `pinned_at` | 需要 `pinned_at` 才能稳定决定多个置顶会话之间的顺序 |
| 免打扰 | `is_muted` | 纯个人偏好，不影响对方 |

- **命名用 `hidden_at` 而不是 `deleted_at`。** 数据库命名应表达真实语义而非 UI 文案；UI 可以写「删除聊天」。
- **不建 `archived_at`。** 隐藏、归档、删除会话语义容易重叠，当前产品没有明确归档功能就不加。
- **不与 member 合并。** 即使 Direct Chat 中二者总是一一对应，`member = membership truth`、`user_state = user preference/view state`，职责不同。
- **创建 member 时同时创建默认 user_state 行**，避免后续处理 `state row not found`。

### 历史可见边界

清空聊天记录不逐条插入隐藏记录。假设当前 `last_message_seq = 500`：

```text
cleared_before_seq = 500
查询：WHERE conversation_id = ? AND seq > cleared_before_seq
之后新消息 seq = 501 自然正常显示
```

因此「清空聊天记录」本质不是删除消息，而是**移动当前用户的历史可见起点**。

---

## 聊天列表查询模型

### 读取路径与过滤条件

```text
chat_conversation_member (WHERE user_id = ?)   ← 用户参与了哪些会话
        ↓ join
chat_conversation                              ← last_message_id / last_message_at
        ↓ join
chat_conversation_user_state                   ← pinned / muted / hidden / cleared
        ↓ 组合
Social/Profile projection                      ← 头像、昵称（不在 Chat 冗余）
```

`listConversations` 的**完整过滤条件**（三者缺一不可）：

```sql
WHERE m.user_id = :current_user
  AND c.last_message_id IS NOT NULL      -- 空会话不进列表
  AND s.hidden_at IS NULL                -- 已隐藏的会话不出现在列表
```

遗漏 `hidden_at IS NULL` 会导致「删除/隐藏聊天」的用户仍然看到该会话。

查询顺序是**先按用户取会话，再 join**，不是扫描全表 conversation 再过滤。因此当前不需要给 `last_message_at` 单独建索引。

### 排序

```text
1. is_pinned DESC
2. 置顶内部：pinned_at DESC
3. 普通会话：last_message_at DESC
```

不引入 `pin_order`；未来允许手动调整置顶顺序时再评估。

### 未读数

第一阶段采用聚合查询，不存 `unread_count`：

```sql
SELECT m.conversation_id, COUNT(msg.id) AS unread_count
FROM chat_conversation_member m
JOIN chat_message msg
  ON msg.conversation_id = m.conversation_id
 AND msg.seq > m.last_read_seq
 AND msg.sender_user_id <> m.user_id
 AND msg.status = 'normal'
WHERE m.user_id = :user_id
GROUP BY m.conversation_id;
```

不能简单用 `last_message_seq - last_read_seq`，因为区间内可能包含自己发出的消息、已撤回消息和未来不计未读的消息。等真实数据量起来再引入 projection 或缓存列，当前不提前双写。

### 最后一条消息摘要

不存 `last_message_preview`。根据 `last_message_id` 加载对应 subtype 后由展示层生成：

```text
TEXT     → 截取 text
IMAGE    → [图片]
RECALLED → [消息已撤回]
```

不要把展示文案写进核心表。

### 隐藏恢复规则

收到新消息，或用户主动再次参与该会话的有效聊天行为（例如从对方资料页进入并发送），都恢复 `hidden_at = NULL`。这是 application service 行为，不是数据库 trigger。为兼容未来非 Direct 会话类型，业务层应明确更新参与此次消息相关的成员，而不是默认全部。
