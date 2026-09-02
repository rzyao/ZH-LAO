---
status: frozen
last_updated: 2026-08-30
schema: chat
source: 设计聊天领域
source_conversation_id: 6a9319c2-2204-83ea-9341-7a57757a3082
---

# Chat 数据库总览

Chat Schema 第一阶段正式定稿为 **7 张表**。主方案已明确「这版之后原则上不再改核心结构，后续增加礼物、群聊、逐条删除、Reaction 等，通过新增表扩展，而不是推翻当前模型」。

| 组 | 表 | 规格 |
| --- | --- | --- |
| 会话 | `chat_conversation`、`chat_direct_conversation` | [会话模型](conversation.md) |
| 成员与用户状态 | `chat_conversation_member`、`chat_conversation_user_state` | [会话模型](conversation.md) |
| 消息 | `chat_message` | [消息模型](message.md) |
| 消息内容 | `chat_message_text`、`chat_message_image` | [消息模型](message.md) |

## 状态：逻辑模型与跨域契约 `frozen`，少量物理项 `designing`

| 层面 | 状态 | 说明 |
| --- | --- | --- |
| 实体、字段语义、约束意图、索引意图、业务规则 | `frozen` | 可直接作为实现依据 |
| 跨域契约（public_id UUID、跨域 logical UUID、无跨域物理 FK） | `frozen`（Chat 会话结尾「全域审计后的最终修正版」，消息 [64] 指令 + [71] 产出） | 与全局最终版 [ADR-018](/developer/reference/adr/ADR-018-global-database-design-principles-final.md) 一致 |
| 物理 DDL | `designing` | 下表列出尚未定稿的物理项，**在补齐前不应直接复制执行** |

已被「全域审计后的最终修正版」解决的物理项（不再列入 designing）：

| 项 | 结论 |
| --- | --- |
| 跨域用户身份 | `user_id` / `user_low_id` / `user_high_id` / `sender_user_id` 一律保存 **Identity logical UUID**，不建跨域物理 FK |
| Media 引用 | `chat_message_image.asset_id` 保存 **Media/Asset logical UUID**，不建跨域物理 FK |
| `public_id` | `chat_conversation` 与 `chat_message` 的 `public_id` 定为 **UUID**（应用层生成），取代早期 `varchar(32)` 口径（[ADR-015](/developer/reference/adr/ADR-015-chat-naming-and-sql-adjudication.md) 该项被本审计 supersede） |
| `chat_direct_conversation.created_at` | 最终修正版为三列（conversation_id / user_low_id / user_high_id），不保留 |
| `chat_conversation.last_message_id` | 在 `chat_message` 建表后追加 FK → `chat_message(id)`；**移除** `last_message_seq / id / at` 组合 CHECK |

剩余 designing 物理项：

| 项 | 说明 |
| --- | --- |
| Outbox 物理表 | 属项目级基础设施（全系统唯一 `system_outbox_events`），物理字段/索引/retention 待定，不在本 Schema 内定稿 |
| UUID 分配实现 | `public_id` 为应用层生成的 UUID，具体生成/分配方式为实现参数 |

因此本节标题为**逻辑 DDL**：结构与约束已定稿，物理落地前需补上表项目。

## 逻辑 DDL（按依赖顺序）

```sql
-- 1. Conversation
CREATE TABLE chat_conversation (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id           UUID NOT NULL UNIQUE,      -- 跨域 logical ID（应用层生成）

    type                VARCHAR(32) NOT NULL,
    status              VARCHAR(32) NOT NULL,

    last_message_seq    BIGINT NOT NULL DEFAULT 0,
    last_message_id     BIGINT NULL,               -- FK 在 chat_message 建表后追加
    last_message_at     TIMESTAMPTZ NULL,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT ck_chat_conversation_type CHECK (type IN ('direct')),
    CONSTRAINT ck_chat_conversation_status CHECK (status IN ('active', 'closed')),
    CONSTRAINT ck_chat_conversation_last_message_seq CHECK (last_message_seq >= 0)
);

-- 注意：全域审计最终修正版已移除 last_message_seq/id/at 的组合 CHECK。
-- 该 CHECK 与「先原子分配 seq、再插消息、最后更新 last_message 指针」的正常事务流程冲突，
-- 三项一致性改由同一 application transaction 保证（见「Application-Level Invariants」）。

-- 2. Direct Conversation（最终版三列；user_low_id / user_high_id 为 Identity logical UUID，不建跨域 FK）
CREATE TABLE chat_direct_conversation (
    conversation_id BIGINT PRIMARY KEY,

    user_low_id     UUID NOT NULL,
    user_high_id    UUID NOT NULL,

    CONSTRAINT fk_chat_direct_conversation
        FOREIGN KEY (conversation_id) REFERENCES chat_conversation(id),

    CONSTRAINT ck_chat_direct_user_order CHECK (user_low_id < user_high_id),
    CONSTRAINT uq_chat_direct_users      UNIQUE (user_low_id, user_high_id)
);

-- 3. Conversation Member
CREATE TABLE chat_conversation_member (
    conversation_id BIGINT NOT NULL,
    user_id         UUID NOT NULL,                 -- Identity logical UUID，不建跨域 FK

    joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    last_read_seq   BIGINT NOT NULL DEFAULT 0,
    last_read_at    TIMESTAMPTZ NULL,

    PRIMARY KEY (conversation_id, user_id),

    CONSTRAINT fk_chat_member_conversation
        FOREIGN KEY (conversation_id) REFERENCES chat_conversation(id),

    CONSTRAINT ck_chat_member_last_read_seq CHECK (last_read_seq >= 0),
    CONSTRAINT ck_chat_member_last_read CHECK (
        (last_read_seq = 0 AND last_read_at IS NULL)
        OR
        (last_read_seq > 0 AND last_read_at IS NOT NULL)
    )
);

CREATE INDEX idx_chat_member_user
    ON chat_conversation_member(user_id, conversation_id);

-- 4. Conversation User State
CREATE TABLE chat_conversation_user_state (
    conversation_id    BIGINT NOT NULL,
    user_id            UUID NOT NULL,              -- Identity logical UUID，不建跨域 FK

    hidden_at          TIMESTAMPTZ NULL,

    cleared_before_seq BIGINT NOT NULL DEFAULT 0,

    is_pinned          BOOLEAN NOT NULL DEFAULT FALSE,
    pinned_at          TIMESTAMPTZ NULL,

    is_muted           BOOLEAN NOT NULL DEFAULT FALSE,

    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (conversation_id, user_id),

    CONSTRAINT fk_chat_conversation_user_state_member
        FOREIGN KEY (conversation_id, user_id)
        REFERENCES chat_conversation_member(conversation_id, user_id),

    CONSTRAINT ck_chat_conversation_user_state_cleared_seq CHECK (cleared_before_seq >= 0),
    CONSTRAINT ck_chat_conversation_user_state_pin CHECK (
        (is_pinned = FALSE AND pinned_at IS NULL)
        OR
        (is_pinned = TRUE  AND pinned_at IS NOT NULL)
    )
);

CREATE INDEX idx_chat_conversation_user_state_user
    ON chat_conversation_user_state(user_id, conversation_id);

-- 5. Message
CREATE TABLE chat_message (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id           UUID NOT NULL UNIQUE,      -- 跨域 logical ID（应用层生成）

    conversation_id     BIGINT NOT NULL,
    sender_user_id      UUID NOT NULL,             -- Identity logical UUID，不建跨域 FK

    client_message_id   UUID NOT NULL,

    seq                 BIGINT NOT NULL,

    type                VARCHAR(32) NOT NULL,
    status              VARCHAR(32) NOT NULL,

    reply_to_message_id BIGINT NULL,

    recalled_at         TIMESTAMPTZ NULL,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_chat_message_conversation
        FOREIGN KEY (conversation_id) REFERENCES chat_conversation(id),

    CONSTRAINT fk_chat_message_sender_member
        FOREIGN KEY (conversation_id, sender_user_id)
        REFERENCES chat_conversation_member(conversation_id, user_id),

    CONSTRAINT fk_chat_message_reply
        FOREIGN KEY (reply_to_message_id) REFERENCES chat_message(id),

    CONSTRAINT uq_chat_message_seq       UNIQUE (conversation_id, seq),
    CONSTRAINT uq_chat_message_client_id UNIQUE (sender_user_id, client_message_id),

    CONSTRAINT ck_chat_message_seq  CHECK (seq > 0),
    CONSTRAINT ck_chat_message_type CHECK (type IN ('text', 'image')),
    CONSTRAINT ck_chat_message_status CHECK (status IN ('normal', 'recalled')),
    CONSTRAINT ck_chat_message_recall CHECK (
        (status = 'normal' AND recalled_at IS NULL)
        OR
        (status = 'recalled' AND recalled_at IS NOT NULL)
    )
);

-- 6. Text Message
CREATE TABLE chat_message_text (
    message_id BIGINT PRIMARY KEY,
    text       TEXT NOT NULL,

    CONSTRAINT fk_chat_message_text_message
        FOREIGN KEY (message_id) REFERENCES chat_message(id),

    CONSTRAINT ck_chat_message_text_not_blank
        CHECK (length(btrim(text)) > 0)
);

-- 7. Image Message
CREATE TABLE chat_message_image (
    message_id BIGINT NOT NULL,
    asset_id   UUID NOT NULL,                      -- Media/Asset logical UUID，不建跨域 FK
    position   SMALLINT NOT NULL,

    PRIMARY KEY (message_id, position),

    CONSTRAINT fk_chat_message_image_message
        FOREIGN KEY (message_id) REFERENCES chat_message(id),

    CONSTRAINT uq_chat_message_image_asset UNIQUE (message_id, asset_id),
    CONSTRAINT ck_chat_message_image_position CHECK (position >= 0)
);

-- 8. 依赖追加（chat_message 已建）：last_message_id FK
ALTER TABLE chat_conversation
ADD CONSTRAINT fk_chat_conversation_last_message
FOREIGN KEY (last_message_id) REFERENCES chat_message(id);
```

## 枚举字典

| 枚举 | 值 |
| --- | --- |
| `ConversationType` | `'direct'` |
| `ConversationStatus` | `'active'`、`'closed'` |
| `MessageType` | `'text'`、`'image'` |
| `MessageStatus` | `'normal'`、`'recalled'` |

## 索引意图

除主键/UNIQUE 自动生成的索引外，主动需要的只有两条：

```sql
CREATE INDEX idx_chat_member_user
    ON chat_conversation_member(user_id, conversation_id);

CREATE INDEX idx_chat_conversation_user_state_user
    ON chat_conversation_user_state(user_id, conversation_id);
```

这些 UNIQUE 本身已提供索引：

```text
chat_direct_conversation (user_low_id, user_high_id)
chat_message             (conversation_id, seq)
chat_message             (sender_user_id, client_message_id)
chat_message_image       (message_id, asset_id)
```

当前**明确不建**：

| 不建 | 原因 |
| --- | --- |
| `chat_message(conversation_id, created_at)` | 消息排序已明确以 `seq` 为准 |
| `chat_message(sender_user_id, created_at)` | 当前没有「查看某用户所有发送消息」的核心产品查询；审核或后台偶发查询不能成为前台表过度索引的理由 |
| `chat_conversation(last_message_at)` 索引 | 聊天列表先按用户取会话再 join，不是扫描全表 |
| `chat_message_image(asset_id)` 索引 | 没有通过 asset 反查消息的真实需求 |

原则：**只给已经明确存在的查询加索引，不做「也许以后会用」的索引。**

`public_id UNIQUE` 会额外产生唯一索引；若未来确认 API 完全不按 `public_id` 反查，可再评估，但当前按全局规范保留。

## 明确不建的表

正式锁定：

```text
❌ chat_message_gift          礼物集成 deferred
❌ chat_message_receipt       已读用 last_read_seq 游标
❌ chat_delivery_receipt      送达状态第一阶段不做
❌ chat_message_recall        撤回是 chat_message 的状态，不是实体
❌ chat_message_reaction      无确定需求
❌ chat_message_user_state    单条「仅自己删除」非必需
❌ chat_message_translation   翻译是否进入首期待主方案裁决
❌ chat_message_attachment    Chat 不自建附件主资源表
❌ chat_group                 当前只有 Direct
❌ chat_group_member          当前只有 Direct
❌ chat_outbox_event          属项目级基础设施设计，不在本 Schema 定稿
```

同时明确不存在的领域实体：`MessageReceipt`、`MessageRecall`、`MessageTranslation`、`GiftMessageReference`。

## 与全局 SQL 规范的关系

| 项 | 全局规范 | Chat 现状 | 结论 |
| --- | --- | --- | --- |
| 表名 | 复数 | `chat_*` 单数带前缀 | **已裁决例外**：域与 Schema 已统一为 `chat`，`chat_` 前缀与 Schema 名一致；表名与会话定稿逐字保持 |
| 状态/枚举 | `varchar(32)` + CHECK | `varchar(32)` + CHECK | 已回归规范（全域审计最终修正版 DDL 中 `type`/`status` 以 `smallint` 表达，属会话早期风格；本项目按 [ADR-015](/developer/reference/adr/ADR-015-chat-naming-and-sql-adjudication.md) 统一为 `varchar(32)+CHECK`，枚举语义等价） |
| 主键 | `bigint generated always as identity` | `bigint generated always as identity` | 已回归规范 |
| `public_id` | 跨域 logical/public ID 统一 **UUID**（[ADR-018](/developer/reference/adr/ADR-018-global-database-design-principles-final.md)） | `chat_conversation`、`chat_message` 均为 `public_id UUID NOT NULL UNIQUE` | 已回归规范（全域审计最终修正版将早期 `varchar(32)` 定为 `UUID`，应用层生成） |
| 跨域 ID | 跨域只存 logical UUID，禁止跨域物理 FK | `user_id`/`sender_user_id`/`asset_id` 均存 logical UUID，无跨域 FK | 已回归规范（Chat 会话「全域审计后的最终修正版」） |

剩余物理差异（非规范冲突，属未定稿项）见本节开头的「状态」表：Outbox 物理表与 UUID 分配实现。

**这些未定稿项不影响已 `frozen` 的字段语义、约束意图与业务规则，不得据此把七表模型整体降级为 `designing`。**

## Application-Level Invariants（全域审计最终修正版，`frozen`）

以下规则是数据库普通约束**无法完整表达**、必须由 application transaction / policy 保证的不变量（来源：Chat 会话消息 [71]「全域审计后的最终修正版」第十九节，37 条）。文档维护阶段不自行增删。

1. `public_id` 创建后永久不可修改。
2. Direct conversation 创建时 `type` 必须为 `DIRECT`。
3. 每个 `chat_direct_conversation` 必须恰好有两个 member。
4. 两个 member 必须恰好等于 `user_low_id / user_high_id`。
5. Direct Conversation 不允许普通 `addMember/removeMember`。
6. Direct 创建时 conversation、direct row、两个 member、两个 user_state 必须原子创建。
7. 同一用户对始终通过 `getOrCreateDirectConversation()` 复用。
8. Social relationship 结束不能删除 conversation/member/history。
9. 发送消息前必须调用 Social `canChat` / relationship policy。
10. sender 必须是 conversation member；数据库复合 FK 同时兜底。
11. `last_message_seq` 必须通过原子递增分配，不允许 `MAX(seq)+1`。
12. 新 message 的 `seq` 必须等于本次 conversation 分配出的 sequence。
13. `last_message_id` 必须指向同一 conversation 的最新 message。
14. `last_message_seq` 必须等于该 latest message 的 `seq`。
15. `last_message_at` 必须对应 latest message 的时间。
16. 上述 seq 分配、message 写入、subtype 写入、last-message 更新必须处于同一数据库事务。
17. `client_message_id` 重试产生 UNIQUE 冲突时必须按幂等成功处理，而不是创建第二条消息。
18. TEXT message 必须恰好存在一个 `chat_message_text`，且不能有 image rows。
19. IMAGE message 必须至少存在一个 `chat_message_image`，且不能有 text row。
20. 多图 `position` 必须连续、有确定顺序；最大图片数由产品/application 限制。
21. `reply_to_message_id` 必须属于同一个 conversation。
22. 不允许新回复已撤回消息；已经建立的 reply 在目标后来 recall 后继续存在。
23. Recall 只能通过 message 自身状态完成，不建立 recall table。
24. 普通 Recall 不物理删除 message/content。
25. `last_read_seq` 只能单调增加。
26. `last_read_seq` 不得超过当前 conversation 的有效消息水位。
27. 发送者成功发送自己的新消息后，可以把自己的 `last_read_seq` 推进至新 `seq`。
28. `clearConversationHistory` 更新 `cleared_before_seq` 时，应同时将自己的 `last_read_seq` 至少推进到相同位置。
29. `hidden_at` 不等价于已读，隐藏 conversation 不自动修改 read cursor。
30. 收到新消息或用户重新主动聊天时，应根据既定产品规则恢复 `hidden_at = NULL`。
31. `listConversations` 必须应用当前用户的 `hidden_at IS NULL`。
32. 空 conversation，即 `last_message_id IS NULL`，默认不进入聊天列表。
33. `cleared_before_seq` 影响消息历史/摘要可见边界，但不自动隐藏 conversation。
34. Chat 使用 Identity UUID，但不拥有 Identity 用户事实。
35. Chat 不持久化 Social follow/match/block 事实。
36. Chat 使用 Media asset UUID，但不拥有文件存储事实。
37. 所有跨 Domain API、事件、审计引用只能使用 Chat `public_id`，不得泄漏内部 BIGINT `id`。

## 跨域边界（全域审计最终修正版，`frozen`）

| 协作方 | 最终边界 |
| --- | --- |
| Chat ↔ Identity | Chat 保存 `user_id / sender_user_id / user_low_id / user_high_id`（Identity stable logical UUID）；**不建 Identity 物理 FK**；不持有用户账户生命周期、用户名、头像、注册状态、认证信息。用户注销后 Chat 历史如何匿名化/保留属账号与数据治理策略，不通过跨域 FK cascade 处理 |
| Chat ↔ Social | Chat 完全不保存 `match_id / follow_id / relationship status`；发送时经 `ChatApplicationService → Social relationship policy → canChat(sender, peer)` 判断；unmatch/block/unfollow 不物理删除 Chat conversation/history，后续 `canChat = true` 继续复用原 Direct Conversation |
| Chat ↔ Media | Chat 只保存 `asset_id UUID`；无 Media physical FK；发送 IMAGE message 时 application service 验证 asset 存在、状态允许、发送者有权、类型为 image，验证通过后创建 message + image rows；Media URL 变化不影响 Chat 数据 |
| Chat ↔ Trust / Operations / Commerce | 跨域不建物理 FK；若需引用 Chat 实体，只能使用 `conversation.public_id` / `message.public_id`（UUID） |
