---
status: frozen
last_updated: 2026-08-30
schema: messaging
source: 设计聊天领域
---

# Messaging 数据库总览

Messaging Schema 第一阶段正式定稿为 **7 张表**。主会话已明确「这版之后原则上不再改核心结构，后续增加礼物、群聊、逐条删除、Reaction 等，通过新增表扩展，而不是推翻当前模型」。

| 组 | 表 | 规格 |
| --- | --- | --- |
| 会话 | `chat_conversation`、`chat_direct_conversation` | [会话模型](conversation.md) |
| 成员与用户状态 | `chat_conversation_member`、`chat_conversation_user_state` | [会话模型](conversation.md) |
| 消息 | `chat_message` | [消息模型](message.md) |
| 消息内容 | `chat_message_text`、`chat_message_image` | [消息模型](message.md) |

## 完整 DDL（按依赖顺序）

主会话约定：`user_id`、`user_low_id`、`user_high_id` 的跨域用户表 FK 先不写，因为全局用户身份主表的最终命名需与整个项目保持一致；Chat Domain 内部的 FK 则全部明确。

```sql
-- 1. Conversation
CREATE TABLE chat_conversation (
    id                BIGINT PRIMARY KEY,

    type              SMALLINT NOT NULL,
    status            SMALLINT NOT NULL,

    last_message_seq  BIGINT NOT NULL DEFAULT 0,
    last_message_id   BIGINT NULL,
    last_message_at   TIMESTAMPTZ NULL,

    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT ck_chat_conversation_type            CHECK (type IN (1)),
    CONSTRAINT ck_chat_conversation_status          CHECK (status IN (1, 2)),
    CONSTRAINT ck_chat_conversation_last_message_seq CHECK (last_message_seq >= 0),
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
    id                    BIGINT PRIMARY KEY,

    conversation_id       BIGINT NOT NULL,
    sender_user_id        BIGINT NOT NULL,

    client_message_id     UUID NOT NULL,

    seq                   BIGINT NOT NULL,

    type                  SMALLINT NOT NULL,
    status                SMALLINT NOT NULL,

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
    CONSTRAINT ck_chat_message_type CHECK (type IN (1, 2)),
    CONSTRAINT ck_chat_message_status CHECK (status IN (1, 2)),
    CONSTRAINT ck_chat_message_recall CHECK (
        (status = 1 AND recalled_at IS NULL)
        OR
        (status = 2 AND recalled_at IS NOT NULL)
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
| `ConversationType` | `1 = DIRECT` |
| `ConversationStatus` | `1 = ACTIVE`、`2 = CLOSED` |
| `MessageType` | `1 = TEXT`、`2 = IMAGE` |
| `MessageStatus` | `1 = NORMAL`、`2 = RECALLED` |

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

## 明确不建的表

正式锁定：

```text
❌ chat_message_user_state    单条「仅自己删除」非必需
❌ chat_message_receipt       已读用 last_read_seq 游标
❌ chat_delivery_receipt      送达状态第一阶段不做
❌ chat_message_reaction      无确定需求
❌ chat_message_gift          礼物从第一阶段移除
❌ chat_group                 当前只有 Direct
❌ chat_group_member          当前只有 Direct
❌ chat_message_translation   翻译是派生能力
❌ chat_message_attachment    Chat 不自建附件主资源表
❌ chat_outbox_event          属后续项目级基础设施设计，不算 Chat 核心业务表
```

以后有明确需求再加，通过新增表扩展而不是推翻当前模型。

## 与全局 SQL 规范的差异（`designing`）

主会话在 Chat Domain 设计中使用的 SQL 风格与[数据库总规范](../../architecture/database.md)已确立的十二项规则存在三处偏差。**文档维护会话不自行裁决，全部提交主架构会话决定**，在决定前按下列方式记录：

| 项 | 全局规范 | Chat 会话用法 | 状态 |
| --- | --- | --- | --- |
| 表名 | 复数，且 Identity/Learning 不带域前缀（`users`、`courses`），Social 带前缀（`social_profiles`） | 单数且带域前缀：`chat_conversation`、`chat_message` | `designing` |
| 状态/枚举类型 | `varchar(32)` + CHECK（Identity 使用 `'active'/'disabled'/'closed'`） | `smallint` + CHECK（`1 = ACTIVE`） | `designing` |
| 主键 | `bigint generated always as identity primary key` | `BIGINT PRIMARY KEY`（未声明 identity，ID 生成方式未定） | `designing` |

附带影响：

- 表名落在 `messaging` Schema 后是否应为 `messaging.conversations` 而非 `messaging.chat_conversation`，取决于主会话对前缀的统一裁决。
- `chat_direct_conversation` 与主会话推荐版本之间是否保留 `created_at`，属 migration 阶段可复核项（`designing`）。
- 跨域用户身份 FK 的目标表（`identity.users` 或最终命名）待全局用户主表定稿后补齐（`designing`）。
- `chat_message_image.asset_id` 指向 Platform Media 的具体 FK 等 Media 表定稿后再补（`designing`）。

上表之外的字段、类型、约束、索引与业务规则均为 `frozen`。**不得因上述命名与类型差异，把已定稿的 7 张表整体降级为 `designing`。**

裁决后应同步更新本页 DDL、[数据库总规范](../../architecture/database.md)与[设计台账](../../governance/design-register.md)。
