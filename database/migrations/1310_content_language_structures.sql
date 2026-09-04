-- D-164：建立分离的中文拼音元素、中文音节和中老句子组成结构。
-- 一次性切换：不保留旧 zh_pinyin 运行兼容层，也不静默删除旧数据。

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM content.zh_pinyin)
       OR EXISTS (SELECT 1 FROM content.zh_hanzi_pinyin)
       OR EXISTS (SELECT 1 FROM content.contents WHERE content_type = 'zh_pinyin') THEN
        RAISE EXCEPTION '旧中文拼音数据尚未清理或转换，拒绝执行一次性结构切换';
    END IF;
END
$$;

DROP TABLE content.zh_hanzi_pinyin;
DROP TABLE content.zh_pinyin;

ALTER TABLE content.contents
    DROP CONSTRAINT contents_content_type_check,
    ADD CONSTRAINT contents_content_type_check CHECK (content_type IN (
        'zh_pinyin_element', 'zh_syllable', 'zh_hanzi', 'zh_word', 'zh_sentence',
        'lo_letter', 'lo_syllable', 'lo_word', 'lo_sentence'
    ));

CREATE TABLE content.zh_pinyin_elements (
    content_id bigint PRIMARY KEY REFERENCES content.contents(id) ON DELETE RESTRICT,
    element_type varchar(16) NOT NULL
        CHECK (element_type IN ('initial', 'final', 'tone_mark', 'separator', 'other')),
    value varchar(16) NOT NULL,
    display_form varchar(16) NOT NULL,
    sort_order smallint,
    UNIQUE (element_type, value)
);

CREATE TABLE content.zh_syllables (
    content_id bigint PRIMARY KEY REFERENCES content.contents(id) ON DELETE RESTRICT,
    base_form varchar(32) NOT NULL,
    tone smallint NOT NULL CHECK (tone BETWEEN 1 AND 5),
    display_form varchar(32) NOT NULL UNIQUE,
    UNIQUE (base_form, tone)
);

CREATE TABLE content.zh_syllable_pinyin_elements (
    syllable_content_id bigint NOT NULL REFERENCES content.zh_syllables(content_id) ON DELETE RESTRICT,
    pinyin_element_content_id bigint NOT NULL REFERENCES content.zh_pinyin_elements(content_id) ON DELETE RESTRICT,
    position smallint NOT NULL CHECK (position > 0),
    role varchar(16) CHECK (role IS NULL OR role IN ('initial', 'final', 'tone_mark', 'separator', 'other')),
    PRIMARY KEY (syllable_content_id, position)
);

CREATE TABLE content.zh_hanzi_syllables (
    hanzi_content_id bigint NOT NULL REFERENCES content.zh_hanzi(content_id) ON DELETE RESTRICT,
    syllable_content_id bigint NOT NULL REFERENCES content.zh_syllables(content_id) ON DELETE RESTRICT,
    is_primary boolean NOT NULL DEFAULT false,
    usage_note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (hanzi_content_id, syllable_content_id)
);

CREATE UNIQUE INDEX uq_zh_hanzi_syllables_primary
    ON content.zh_hanzi_syllables(hanzi_content_id)
    WHERE is_primary;

CREATE TABLE content.zh_sentence_words (
    sentence_content_id bigint NOT NULL REFERENCES content.zh_sentences(content_id) ON DELETE RESTRICT,
    word_content_id bigint NOT NULL REFERENCES content.zh_words(content_id) ON DELETE RESTRICT,
    position smallint NOT NULL CHECK (position > 0),
    surface_form text,
    PRIMARY KEY (sentence_content_id, position)
);

CREATE TABLE content.lo_sentence_words (
    sentence_content_id bigint NOT NULL REFERENCES content.lo_sentences(content_id) ON DELETE RESTRICT,
    word_content_id bigint NOT NULL REFERENCES content.lo_words(content_id) ON DELETE RESTRICT,
    position smallint NOT NULL CHECK (position > 0),
    surface_form text,
    PRIMARY KEY (sentence_content_id, position)
);
