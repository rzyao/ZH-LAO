-- Sources: docs/docs/domains/content/{knowledge,curriculum,dictionary,practice}.md

CREATE TABLE content.contents (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id uuid NOT NULL UNIQUE,
    language varchar(8) NOT NULL CHECK (language IN ('zh', 'lo')),
    content_type varchar(32) NOT NULL CHECK (content_type IN (
        'zh_pinyin', 'zh_hanzi', 'zh_word', 'zh_sentence',
        'lo_letter', 'lo_syllable', 'lo_word', 'lo_sentence'
    )),
    status varchar(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE content.zh_pinyin (
    content_id bigint PRIMARY KEY REFERENCES content.contents(id) ON DELETE RESTRICT,
    syllable varchar(16) NOT NULL,
    initial varchar(8),
    final varchar(16) NOT NULL,
    tone smallint NOT NULL CHECK (tone BETWEEN 1 AND 5),
    display_form varchar(16) NOT NULL,
    UNIQUE (syllable, tone)
);

CREATE TABLE content.zh_hanzi (
    content_id bigint PRIMARY KEY REFERENCES content.contents(id) ON DELETE RESTRICT,
    character varchar(4) NOT NULL UNIQUE,
    traditional_character varchar(4),
    stroke_count smallint CHECK (stroke_count IS NULL OR stroke_count > 0),
    radical varchar(8)
);

CREATE TABLE content.zh_hanzi_pinyin (
    hanzi_content_id bigint NOT NULL REFERENCES content.zh_hanzi(content_id) ON DELETE RESTRICT,
    pinyin_content_id bigint NOT NULL REFERENCES content.zh_pinyin(content_id) ON DELETE RESTRICT,
    is_primary boolean NOT NULL DEFAULT false,
    usage_note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (hanzi_content_id, pinyin_content_id)
);
CREATE UNIQUE INDEX uq_zh_hanzi_pinyin_primary
    ON content.zh_hanzi_pinyin(hanzi_content_id) WHERE is_primary;

CREATE TABLE content.zh_words (
    content_id bigint PRIMARY KEY REFERENCES content.contents(id) ON DELETE RESTRICT,
    simplified varchar(128) NOT NULL UNIQUE,
    traditional varchar(128),
    pinyin_text varchar(256),
    word_class varchar(32),
    difficulty_level smallint CHECK (difficulty_level IS NULL OR difficulty_level >= 1)
);

CREATE TABLE content.zh_word_hanzi (
    word_content_id bigint NOT NULL REFERENCES content.zh_words(content_id) ON DELETE RESTRICT,
    hanzi_content_id bigint NOT NULL REFERENCES content.zh_hanzi(content_id) ON DELETE RESTRICT,
    position smallint NOT NULL CHECK (position > 0),
    PRIMARY KEY (word_content_id, position)
);

CREATE TABLE content.zh_sentences (
    content_id bigint PRIMARY KEY REFERENCES content.contents(id) ON DELETE RESTRICT,
    text text NOT NULL UNIQUE,
    pinyin_text text,
    difficulty_level smallint CHECK (difficulty_level IS NULL OR difficulty_level >= 1)
);

CREATE TABLE content.lo_letters (
    content_id bigint PRIMARY KEY REFERENCES content.contents(id) ON DELETE RESTRICT,
    character varchar(16) NOT NULL,
    letter_type varchar(16) NOT NULL CHECK (letter_type IN ('consonant', 'vowel', 'tone_mark', 'other')),
    letter_class varchar(16),
    name varchar(64),
    romanization varchar(64),
    sort_order smallint,
    UNIQUE (character, letter_type)
);

CREATE TABLE content.lo_syllables (
    content_id bigint PRIMARY KEY REFERENCES content.contents(id) ON DELETE RESTRICT,
    text varchar(64) NOT NULL UNIQUE,
    romanization varchar(128),
    tone smallint,
    pronunciation_key varchar(128),
    difficulty_level smallint CHECK (difficulty_level IS NULL OR difficulty_level >= 1)
);

CREATE TABLE content.lo_syllable_letters (
    syllable_content_id bigint NOT NULL REFERENCES content.lo_syllables(content_id) ON DELETE RESTRICT,
    letter_content_id bigint NOT NULL REFERENCES content.lo_letters(content_id) ON DELETE RESTRICT,
    position smallint NOT NULL CHECK (position > 0),
    role varchar(16) CHECK (role IS NULL OR role IN ('initial', 'vowel', 'final', 'tone_mark', 'other')),
    PRIMARY KEY (syllable_content_id, position)
);

CREATE TABLE content.lo_words (
    content_id bigint PRIMARY KEY REFERENCES content.contents(id) ON DELETE RESTRICT,
    text varchar(256) NOT NULL UNIQUE,
    romanization varchar(256),
    word_class varchar(32),
    difficulty_level smallint CHECK (difficulty_level IS NULL OR difficulty_level >= 1)
);

CREATE TABLE content.lo_word_syllables (
    word_content_id bigint NOT NULL REFERENCES content.lo_words(content_id) ON DELETE RESTRICT,
    syllable_content_id bigint NOT NULL REFERENCES content.lo_syllables(content_id) ON DELETE RESTRICT,
    position smallint NOT NULL CHECK (position > 0),
    PRIMARY KEY (word_content_id, position)
);

CREATE TABLE content.lo_sentences (
    content_id bigint PRIMARY KEY REFERENCES content.contents(id) ON DELETE RESTRICT,
    text text NOT NULL UNIQUE,
    romanization text,
    difficulty_level smallint CHECK (difficulty_level IS NULL OR difficulty_level >= 1)
);

CREATE TABLE content.meanings (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    content_id bigint NOT NULL REFERENCES content.contents(id) ON DELETE RESTRICT,
    language varchar(8) NOT NULL CHECK (language IN ('zh', 'lo')),
    word_class varchar(32),
    definition text NOT NULL,
    sense_order smallint NOT NULL DEFAULT 1 CHECK (sense_order > 0),
    status varchar(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (content_id, language, sense_order)
);

CREATE TABLE content.translations (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    content_id bigint NOT NULL REFERENCES content.contents(id) ON DELETE RESTRICT,
    language varchar(8) NOT NULL CHECK (language IN ('zh', 'lo')),
    text text NOT NULL,
    is_primary boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_translations_primary
    ON content.translations(content_id, language) WHERE is_primary;

CREATE TABLE content.examples (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    content_id bigint NOT NULL REFERENCES content.contents(id) ON DELETE RESTRICT,
    meaning_id bigint REFERENCES content.meanings(id) ON DELETE RESTRICT,
    sentence_content_id bigint NOT NULL REFERENCES content.contents(id) ON DELETE RESTRICT,
    sort_order smallint NOT NULL DEFAULT 1 CHECK (sort_order > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (content_id, sentence_content_id, meaning_id)
);

CREATE TABLE content.pronunciations (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    content_id bigint NOT NULL REFERENCES content.contents(id) ON DELETE RESTRICT,
    pronunciation_text varchar(256),
    pronunciation_key varchar(128),
    accent varchar(32),
    source varchar(16) NOT NULL CHECK (source IN ('human', 'tts', 'system')),
    is_primary boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE content.content_equivalents (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source_content_id bigint NOT NULL REFERENCES content.contents(id) ON DELETE RESTRICT,
    target_content_id bigint NOT NULL REFERENCES content.contents(id) ON DELETE RESTRICT,
    relation_type varchar(32) NOT NULL DEFAULT 'translation'
        CHECK (relation_type IN ('translation', 'equivalent', 'approximate')),
    confidence numeric(5,2) CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 100),
    is_primary boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (source_content_id <> target_content_id),
    UNIQUE (source_content_id, target_content_id, relation_type)
);

CREATE TABLE content.content_relations (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source_content_id bigint NOT NULL REFERENCES content.contents(id) ON DELETE RESTRICT,
    target_content_id bigint NOT NULL REFERENCES content.contents(id) ON DELETE RESTRICT,
    relation_type varchar(32) NOT NULL CHECK (relation_type IN ('synonym', 'antonym', 'related', 'derived', 'variant')),
    sort_order smallint NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (source_content_id <> target_content_id),
    UNIQUE (source_content_id, target_content_id, relation_type)
);

CREATE TABLE content.tags (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code varchar(64) NOT NULL UNIQUE,
    name varchar(64) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE content.content_tags (
    content_id bigint NOT NULL REFERENCES content.contents(id) ON DELETE RESTRICT,
    tag_id bigint NOT NULL REFERENCES content.tags(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (content_id, tag_id)
);

CREATE TABLE content.courses (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id uuid NOT NULL UNIQUE,
    learning_language varchar(8) NOT NULL CHECK (learning_language IN ('zh', 'lo')),
    title varchar(128) NOT NULL,
    subtitle varchar(256),
    description text,
    cover_media_id uuid,
    status varchar(16) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE content.units (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    course_id bigint NOT NULL REFERENCES content.courses(id) ON DELETE RESTRICT,
    title varchar(128) NOT NULL,
    description text,
    sort_order integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (course_id, sort_order)
);

CREATE TABLE content.lessons (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id uuid NOT NULL UNIQUE,
    unit_id bigint NOT NULL REFERENCES content.units(id) ON DELETE RESTRICT,
    title varchar(128) NOT NULL,
    description text,
    sort_order integer NOT NULL,
    estimated_minutes smallint CHECK (estimated_minutes IS NULL OR estimated_minutes > 0),
    status varchar(16) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (unit_id, sort_order)
);

CREATE TABLE content.lesson_sections (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id uuid NOT NULL UNIQUE,
    lesson_id bigint NOT NULL REFERENCES content.lessons(id) ON DELETE RESTRICT,
    section_type varchar(32) NOT NULL CHECK (section_type IN ('introduction', 'knowledge', 'example', 'practice', 'summary', 'custom')),
    title varchar(128),
    description text,
    sort_order integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (lesson_id, sort_order)
);

CREATE TABLE content.exercises (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id uuid NOT NULL UNIQUE,
    title varchar(128),
    description text,
    exercise_type varchar(32) NOT NULL DEFAULT 'practice' CHECK (exercise_type IN ('practice', 'review', 'test')),
    passing_score smallint CHECK (passing_score IS NULL OR passing_score BETWEEN 0 AND 100),
    max_attempts smallint CHECK (max_attempts IS NULL OR max_attempts > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE content.questions (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id uuid NOT NULL UNIQUE,
    exercise_id bigint NOT NULL REFERENCES content.exercises(id) ON DELETE RESTRICT,
    question_type varchar(32) NOT NULL CHECK (question_type IN (
        'single_choice', 'multiple_choice', 'true_false', 'fill_blank',
        'ordering', 'matching', 'listen_choice', 'content_choice'
    )),
    prompt text,
    sort_order integer NOT NULL,
    score numeric(8,2) NOT NULL DEFAULT 1 CHECK (score >= 0),
    explanation text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (exercise_id, sort_order)
);

CREATE TABLE content.question_contents (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    question_id bigint NOT NULL REFERENCES content.questions(id) ON DELETE RESTRICT,
    role varchar(32) NOT NULL CHECK (role IN ('prompt', 'audio', 'image', 'reference', 'hint')),
    content_id bigint REFERENCES content.contents(id) ON DELETE RESTRICT,
    media_id uuid,
    text_value text,
    sort_order integer NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE content.question_options (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    question_id bigint NOT NULL REFERENCES content.questions(id) ON DELETE RESTRICT,
    content_id bigint REFERENCES content.contents(id) ON DELETE RESTRICT,
    text_value text,
    media_id uuid,
    sort_order integer NOT NULL,
    is_correct boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (question_id, sort_order)
);

CREATE TABLE content.answer_rules (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    question_id bigint NOT NULL REFERENCES content.questions(id) ON DELETE RESTRICT,
    rule_type varchar(32) NOT NULL CHECK (rule_type IN ('exact_text', 'normalized_text', 'content', 'sequence', 'matching')),
    expected_text text,
    content_id bigint REFERENCES content.contents(id) ON DELETE RESTRICT,
    sort_order integer NOT NULL DEFAULT 1,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE content.lesson_items (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    section_id bigint NOT NULL REFERENCES content.lesson_sections(id) ON DELETE RESTRICT,
    item_type varchar(32) NOT NULL CHECK (item_type IN ('text', 'knowledge', 'image', 'audio', 'exercise', 'tip', 'dialogue')),
    content_id bigint REFERENCES content.contents(id) ON DELETE RESTRICT,
    exercise_id bigint REFERENCES content.exercises(id) ON DELETE RESTRICT,
    media_id uuid,
    title varchar(256),
    body text,
    sort_order integer NOT NULL,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
    is_required boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (section_id, sort_order),
    CONSTRAINT lesson_items_required_value_check CHECK (
        (item_type <> 'knowledge' OR content_id IS NOT NULL) AND
        (item_type <> 'exercise' OR exercise_id IS NOT NULL) AND
        (item_type NOT IN ('image', 'audio') OR media_id IS NOT NULL) AND
        (item_type NOT IN ('text', 'tip', 'dialogue') OR body IS NOT NULL)
    )
);

CREATE INDEX idx_zh_words_simplified_trgm ON content.zh_words USING gin (simplified gin_trgm_ops);
CREATE INDEX idx_zh_words_traditional_trgm ON content.zh_words USING gin (traditional gin_trgm_ops);
CREATE INDEX idx_zh_words_pinyin_text_trgm ON content.zh_words USING gin (pinyin_text gin_trgm_ops);
CREATE INDEX idx_lo_words_text_trgm ON content.lo_words USING gin (text gin_trgm_ops);
CREATE INDEX idx_lo_words_romanization_trgm ON content.lo_words USING gin (romanization gin_trgm_ops);
