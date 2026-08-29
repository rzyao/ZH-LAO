---
status: frozen
last_updated: 2026-08-30
schema: messaging
source: 设计聊天领域
---

# 消息模型

消息层由一张主体表加内容 subtype 表组成：

```text
chat_message                 消息身份、顺序、发送者、生命周期
    ├── chat_message_text    TEXT 消息实际内容
    └── chat_message_image   IMAGE 消息实际内容（引用 Platform Media）
```

核心原则：**消息主体与消息内容分离；消息不物理删除；撤回不删除原记录；排序不依赖 `created_at`；礼物消息只引用 Commerce 结果，不承载交易真相。**

---

## `chat_message` — 消息主体

| 字段 | 类型 | Null | 默认/约束 | 说明 |
| --- | --- | --- | --- | --- |
| `id` | `bigint` | 否 | PK | 全局消息身份 |
| `conversation_id` | `bigint` | 否 | FK → `chat_conversation(id)` | 所属会话 |
| `sender_user_id` | `bigint` | 否 | — | 发送者 |
| `client_message_id` | `uuid` | 否 | 与 sender 组成 UNIQUE | 客户端幂等键 |
| `seq` | `bigint` | 否 | CHECK `> 0`；与 conversation 组成 UNIQUE | 会话内严格递增顺序 |
| `type` | `smallint` | 否 | CHECK `IN (1, 2)` | 消息业务类型 |
| `status` | `smallint` | 否 | CHECK `IN (1, 2)` | 消息生命周期状态 |
| `reply_to_message_id` | `bigint` | 是 | FK → `chat_message(id)` | 引用/回复目标 |
| `recalled_at` | `timestamptz` | 是 | — | 撤回时间 |
| `created_at` | `timestamptz` | 否 | DEFAULT `now()` | 服务器时间 |

约束：

```sql
CONSTRAINT fk_chat_message_sender_member
    FOREIGN KEY (conversation_id, sender_user_id)
    REFERENCES chat_conversation_member(conversation_id, user_id);

CONSTRAINT uq_chat_message_seq      UNIQUE (conversation_id, seq);
CONSTRAINT uq_chat_message_client_id UNIQUE (sender_user_id, client_message_id);

CONSTRAINT ck_chat_message_recall CHECK (
    (status = 1 AND recalled_at IS NULL)
    OR
    (status = 2 AND recalled_at IS NOT NULL)
);
```

复合 FK `(conversation_id, sender_user_id) → member` 是**同域约束**，让数据库直接阻止「用户往自己不属于的 conversation 插消息」，不必只靠应用层保证。

### 枚举

```text
MessageType
1 = TEXT
2 = IMAGE

MessageStatus
1 = NORMAL
2 = RECALLED
```

`type` 表示**消息业务类型，不是 MIME 类型**；JPEG/PNG/WebP 都是 `IMAGE`，具体 MIME 在媒体资源里。

`status` **不等于** `sending / sent / delivered / read`。`DELIVERED / READ` 是针对接收方的状态，不是消息本身唯一状态。客户端的 `sending / failed` 属于客户端瞬态状态，不写数据库；`chat_message` 一旦创建成功即代表服务器已正式接受。是否已读由 `chat_conversation_member.last_read_seq` 推导。

暂时没有 `GIFT / VOICE / VIDEO / FILE / STICKER / LOCATION`。未来 `REMOVED` 若用于审核强制屏蔽违规内容可再增加，但**用户自己删除某条消息不能把 status 改成 REMOVED**，因为对方仍可能看到。

### `id` 与 `seq` 为什么都需要

| 字段 | 职责 | 用于 |
| --- | --- | --- |
| `id` | 全局识别这一条消息 | API、`reply_to_message_id`、举报、审核、礼物关联、日志追踪 |
| `seq` | 这条消息在会话中排第几 | 排序、分页、同步、未读、断点续传 |

不依赖 `created_at` 做严格顺序：极短时间内并发写入可能撞时间戳，重试、导入数据、多节点都会导致顺序不稳定。

### `seq` 分配

**绝对不能** `SELECT MAX(seq) + 1`，并发会撞。正确方式是原子自增 conversation 行：

```sql
UPDATE chat_conversation
SET last_message_seq = last_message_seq + 1
WHERE id = :conversation_id
  AND status = 1
RETURNING last_message_seq;
```

- 该 UPDATE 会对 conversation 行加锁，同一私聊并发发送自然得到 101、102，不撞也不乱序。
- **`seq` 分配绝不能在事务外完成**。与应用层分配相比，事务回滚时 `last_message_seq` 一起回滚，不会产生序号空洞。
- 对 1 对 1 私聊而言，同一会话行锁是可接受的热点；换来严格顺序、简单实现、无重复 seq。未来大型群聊再考虑分布式 sequence allocator、Snowflake ordering 或 Kafka partition offset。

### `client_message_id` 与幂等

聊天极易出现「用户点发送 → 网络超时 → 客户端不知道成功没有 → 再次发送」。客户端生成 UUID，服务端先查：

```sql
SELECT id, conversation_id, seq
FROM chat_message
WHERE sender_user_id = :sender AND client_message_id = :client_message_id;
```

已存在则直接返回原消息。`UNIQUE (sender_user_id, client_message_id)` 保证即使两个完全并发的重试同时进来也只成功一个；唯一冲突应视为 **idempotent success**，不是业务错误。

不需要在 Chat 数据表里额外增加 `request_id`/`trace_id`——它们属于基础设施日志，与消息领域身份不同。

### `sender_user_id`

虽然可以从 member 知道谁是成员，但无法知道具体哪一个成员发了这条消息，因此必须由消息自身持有。业务约束「sender 必须是当前 conversation 的 member」已由上面的复合 FK 在数据库层保证。

### `reply_to_message_id`

- 第一版直接支持，成本极低。
- 有 FK，但**「回复目标必须属于同一 conversation」继续由应用层校验**，不为此做复杂 trigger。
- 被回复消息可能已撤回、被隐藏或用户侧删除，客户端展示引用时不能假设原内容永远可见。
- **不允许新建对已撤回消息的回复**（用户已看不到原内容）；但如果先回复、后撤回，已存在的 reply 不删除，客户端展示「引用消息已撤回」。

### `created_at`

使用**服务器时间**。客户端时间可能错误、时区错误、被人为修改或离线很久，不能作为真相。未来若需排查客户端发送体验可另记 `client_sent_at`，当前不需要。

### 不建的字段

| 不建 | 原因 |
| --- | --- |
| `sent_at` | 当前所有消息都是服务器接收请求后即时生成，与 `created_at` 一致；未来支持离线重放/定时消息才需要区分 |
| `updated_at` | 消息创建后基本 immutable，可变只有 `status` 与 `recalled_at`；用明确字段审计比模糊的 `updated_at` 更有意义 |
| `recalled_by_user_id` | 当前只能撤回自己发送的消息，`recalled_by_user_id` 恒等于 `sender_user_id`；未来管理员强制撤回属于另一种语义，再增加 `removed_by` / `moderation_action_id` |
| `is_delivered` / `websocket_sent` / `push_sent` | 传输状态，不是消息业务事实 |
| `content` / `image_url` / `gift_id` 等 | 会让 90% 字段为 NULL；内容应下沉到 subtype 表 |

---

## `chat_message_text` — 文本消息内容

| 字段 | 类型 | Null | 默认/约束 | 说明 |
| --- | --- | --- | --- | --- |
| `message_id` | `bigint` | 否 | PK；FK → `chat_message(id)` | 所属消息 |
| `text` | `text` | 否 | CHECK `length(btrim(text)) > 0` | 用户真正发送的原文 |

- 用 `text` 而非 `varchar(n)`：消息长度属于产品规则，未来调整概率高，PostgreSQL `TEXT` 无性能劣势；最大长度（例如 2000 Unicode 字符）由应用层控制，改限制不需要迁数据库。
- CHECK 使用 `btrim` 而非 `length(text) > 0`，纯空格消息也应被挡住。
- **不增加 `translated_text`、`language`、`pinyin`、`lao_translation`。** 本产品同时有语言学习属性，更要把「聊天原文」与「翻译结果」分开：`chat_message_text.text = immutable original content`，翻译是派生数据，未来可单独建 `chat_message_translation` 或交给 Learning/Translation 能力。

---

## `chat_message_image` — 图片消息内容

| 字段 | 类型 | Null | 默认/约束 | 说明 |
| --- | --- | --- | --- | --- |
| `message_id` | `bigint` | 否 | PK 组成部分；FK → `chat_message(id)` | 所属消息 |
| `asset_id` | `bigint` | 否 | 与 message_id 组成 UNIQUE | 引用统一 Media/Asset 能力 |
| `position` | `smallint` | 否 | CHECK `>= 0` | 展示顺序，从 0 开始 |

```sql
PRIMARY KEY (message_id, position)
UNIQUE (message_id, asset_id)
```

不需要自己的代理 `id`——身份就是 `(message_id, position)`。

### 关键决策

- **一条 IMAGE 消息支持多张图片。** 一次选择 4 张视为一条 IMAGE message（`position` 0..3），使回复整组、撤回整组、已读、排序都简单。若未来产品希望「一次选 9 张生成 9 个气泡」，属于 UI/产品规则变化，改发送逻辑即可；领域模型上一次发送动作形成一个 message 更一致。
- **不存 `image_url` / `storage_key` / `mime_type` / `width` / `height` / `file_size` / `checksum`。** 这些属于统一 Media/Asset 能力。数据库应存资源身份（`asset_id`）而非访问表现（URL）——CDN 域名换掉后文件身份不变，URL 在读取时生成。宽高描述资源本身，同一 asset 被不同地方引用时仍是 1080×1440，因此不是 Chat Message 属性。
- **不建 `chat_attachment` 主资源表。** 头像、动态图片、聊天图片、举报证据、礼物素材、学习内容都会用媒体；每个域各建一套会重复 mime/size/checksum/生命周期。Chat 只拥有「使用关系」。
- **不建 `asset_id` 单独索引**，除非未来出现「通过 asset 反查聊天消息」的真实业务需求。
- **不支持 caption。** 第一阶段 TEXT 与 IMAGE 分别发送，不设计混合消息类型。
- **最多张数由应用层控制**（例如 9 张），不用复杂数据库 CHECK 限制一条 message 的总行数。

### 上传流程与消息事务分离

```text
客户端选择图片
      ↓
Media 获取上传凭证
      ↓
上传文件
      ↓
Media asset = READY
      ↓
调用 sendImageMessage(asset_ids[])
      ↓
Chat 事务：验证 asset 可使用 + 创建 message + 创建 chat_message_image rows
```

**不要**先创建 `chat_message` 再慢慢上传图片，否则极易产生「message 已存在但 asset 上传失败」的半成品消息。规则：只有处于 READY 状态且当前用户有权使用的 media asset 才能被发送为聊天消息。

**绝对不要把远程对象存储操作放进数据库事务。**

---

## subtype 一致性

数据库保证结构完整性，应用服务保证 subtype 一致性。

- 所有发送操作必须经过明确命令 `sendTextMessage()` / `sendImageMessage()` / `sendGiftMessage()`，而不是 `createMessage(type, payload)`。
- 每个操作在同一事务里 `insert chat_message` + `insert subtype row(s)` + `commit`。
- 不写复杂 trigger 保证「type = TEXT 必须存在 chat_message_text 且不能同时存在 chat_message_image」。

---

## 发送消息事务

统一抽象为 `SendMessage`，内部按类型分支。一个数据库事务内完成：

```text
1. 校验 conversation 存在且为 ACTIVE
2. 校验 sender 是该 conversation member
3. 校验当前业务关系允许发送消息
4. 校验 client_message_id 幂等
5. 原子分配新的 seq
6. 插入 chat_message
7. 插入对应 subtype 内容
8. 更新 chat_conversation.last_message_id / last_message_at
9. 推进 sender.last_read_seq
10. 恢复相关用户的 hidden_at
11. 提交事务
```

**消息主体、内容、会话水位必须一起成功或一起失败。** 多图消息必须全有或全无：任何一张 `chat_message_image` 失败就 ROLLBACK，整条消息不存在。

### 权限检查与边界

发送前必须确认「当前 sender 是否允许给 recipient 发消息」，但**不要让数据库做 `chat_message → FK social_match`**。应用层通过聊天权限策略读取 Social 暴露的关系状态：

```text
ChatApplicationService
    ├── 聊天权限策略：canChat(A, B)
    └── ChatRepository.send(...)
```

模块化单体下这个检查可以发生在同一次业务请求中，但不要把 Social 表结构硬编码进 Chat Repository。

**接受极短的 TOCTOU 竞争窗口**：检查时双方还能聊天，下一毫秒 A 拉黑 B，消息事务继续提交。不要为此把 Social relationship 与 Chat message 做成跨聚合锁。产品语义定义为「请求进入系统时具备发送资格，就允许本次消息完成；下一条消息再按最新关系判断」。

### 失败与重试

由于有 `client_message_id`，客户端可以安全重试。响应在网络途中丢失导致客户端显示 failed 时，重新提交相同 `client_message_id`，服务端返回原消息，客户端从 failed 恢复成 sent，不产生重复消息。

### conversation 创建与首条消息

推荐 `getOrCreateDirectConversation` 独立保证幂等，`sendMessage` 独立事务。因为 conversation 即使没有消息也允许存在（空 conversation 不进聊天列表），拆分后服务职责更清晰。

---

## 撤回

```text
chat_message.status = RECALLED(2)
chat_message.recalled_at = now()
```

- **不 DELETE，不覆盖成「消息已撤回」文本。** 原始 `chat_message_text` / `chat_message_image` 全部保留，供审核、举报、安全审计、纠纷处理取证。
- 客户端根据 `status = RECALLED` 显示「对方撤回了一条消息」。
- **只能撤回自己发送的消息**，属业务规则，不需要数据库 trigger。
- 撤回最后一条消息不回退 `chat_conversation.last_message_id`。

---

## 消息层明确不建

| 不建 | 原因 |
| --- | --- |
| `chat_message_user_state` | 单条「仅自己删除」目前不是必需功能；「清空聊天记录」由 `cleared_before_seq` 支持 |
| `chat_message_receipt` | 已读用 `last_read_seq` 游标即可，1 对 1 私聊不需要逐条记录，不值得承受写放大 |
| `chat_delivery_receipt` | 送达状态第一阶段不做，会引入 device/push/websocket/multi-device 复杂度 |
| `chat_message_reaction` | 没有确定需求 |
| `chat_message_gift` | 礼物从第一阶段范围移除，等 Commerce 设计礼物体系时再回来定义集成方式 |
| `chat_message_translation` | 翻译是原始消息之上的派生能力，不混进聊天事实 |
| `chat_message_attachment` | Chat 不自己建附件主资源表，直接引用 `asset_id` |
| `chat_group` / `chat_group_member` | 当前只有 Direct |
