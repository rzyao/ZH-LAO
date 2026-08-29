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

## 状态：逻辑模型 `frozen`，物理 DDL `designing`

| 层面 | 状态 | 说明 |
| --- | --- | --- |
| 实体、字段语义、约束意图、索引意图、业务规则 | `frozen` | 可直接作为实现依据 |
| 物理 DDL | `designing` | 下表列出尚未定稿的物理项，**在补齐前不应直接复制执行** |

未定稿的物理项：

| 项 | 说明 |
| --- | --- |
| 跨域用户 FK | `user_id` / `user_low_id` / `user_high_id` 的目标表（`identity.users` 或最终命名）未定 |
| Media FK | `chat_message_image.asset_id` → Platform Media 的 FK，等 Media 表定稿后补 |
| `chat_direct_conversation.created_at` | 会话倾向不保留；最终由 migration 阶段裁决 |
| `public_id` 生成 | 长度已定为 `varchar(32)`，生成算法与各实体前缀未定 |
| Outbox 物理表 | 属项目级基础设施设计，不在本 Schema 内定稿 |

因此本节标题为**逻辑 DDL**：结构与约束已定稿，物理落地前需补上表项目。

## 逻辑 DDL（按依赖顺序）

```sql
-- 1. Conversation
CREATE TABLE chat_conversation (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id           VARCHAR(32) NOT NULL UNIQUE,

    type                VARCHAR(32) NOT NULL,
    status              VARCHAR(32) NOT NULL,

    last_message_seq    BIGINT NOT NULL DEFAULT 0,
    last_message_id     BIGINT NULL,
    last_message_at     TIMESTAMPTZ NULL,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT ck_chat_conversation_type
        CHECK (type IN ('direct')),
    CONSTRAINT ck_chat_conversation_status
        CHECK (status IN ('active', 'closed')),
    CONSTRAINT ck_chat_conversation_last_message_seq
        CHECK (last_message_seq >= 0),
    CONSTRAINT ck_chat_conversation_last_message CHECK (
        (last_message_seq = 0 AND last_message_id IS NULL AND last_message_at IS NULL)
        OR
        (last_message_seq > 0 AND last_message_id IS NOT NULL AND last_message_at IS NOT NULL)
    )
);

-- 2. Direct Conversation
CREATE TABLE chat_direct_conversation (
    conversation_id BIGINT PRIMARY KEY,

    user_low_id     BIGINT NOT NULL,
    user_high_id    BIGINT NOT NULL,

    CONSTRAINT fk_chat_direct_conversation
        FOREIGN KEY (conversation_id) REFERENCES chat_conversation(id),

    CONSTRAINT ck_chat_direct_user_order CHECK (user_low_id < user_high_id),
    CONSTRAINT uq_chat_direct_users      UNIQUE (user_low_id, user_high_id)
);

-- 3. Conversation Member
CREATE TABLE chat_conversation_member (
    conversation_id BIGINT NOT NULL,
    user_id         BIGINT NOT NULL,

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
    user_id            BIGINT NOT NULL,

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

    CONSTRAINT ck_chat_conversation_user_state_cleared_seq
        CHECK (cleared_before_seq >= 0),
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
    id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id             VARCHAR(32) NOT NULL UNIQUE,

    conversation_id       BIGINT NOT NULL,
    sender_user_id        BIGINT NOT NULL,

    client_message_id     UUID NOT NULL,

    seq                   BIGINT NOT NULL,

    type                  VARCHAR(32) NOT NULL,
    status                VARCHAR(32) NOT NULL,

    reply_to_message_id   BIGINT NULL,

    recalled_at           TIMESTAMPTZ NULL,

    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

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
    asset_id   BIGINT NOT NULL,
    position   SMALLINT NOT NULL,

    PRIMARY KEY (message_id, position),

    CONSTRAINT fk_chat_message_image_message
        FOREIGN KEY (message_id) REFERENCES chat_message(id),

    CONSTRAINT uq_chat_message_image_asset UNIQUE (message_id, asset_id),
    CONSTRAINT ck_chat_message_image_position CHECK (position >= 0)
);
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
| 状态/枚举 | `varchar(32)` + CHECK | `varchar(32)` + CHECK | 已回归规范 |
| 主键 | `bigint generated always as identity` | `bigint generated always as identity` | 已回归规范 |
| `public_id` | User、Post、Conversation、Message、Order 需要 | `chat_conversation`、`chat_message` 均已具备 | 已回归规范 |

剩余物理差异（非规范冲突，属未定稿项）见本节开头的「状态」表：跨域用户 FK、Media FK、`chat_direct_conversation.created_at`、`public_id` 生成算法、Outbox 物理表。

**这些未定稿项不影响已 `frozen` 的字段语义、约束意图与业务规则，不得据此把七表模型整体降级为 `designing`。**
