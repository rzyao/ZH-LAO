-- Generated mechanically from the frozen documentation named below.
-- Source: docs/docs/domains/chat/database.md
-- Do not edit an applied migration; add a new migration instead.
SET LOCAL search_path = chat, public;

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
