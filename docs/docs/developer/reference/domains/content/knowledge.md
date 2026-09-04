---
status: frozen
last_updated: 2026-08-30
schema: content
---

# Knowledge 规格

所有表位于 `content` Schema，使用 PostgreSQL BIGINT Identity 或以 `content_id` 为主键（域内真实 FK）；默认删除策略是 `RESTRICT/NO ACTION`。核心知识不物理删除，通过 `contents.status=active/disabled/archived` 下架。

## Content Registry

### contents

| 字段 | 类型/约束 |
| --- | --- |
| `id` | `bigint generated always as identity primary key` |
| `public_id` | `uuid not null unique`（应用层生成、不可变；跨域 logical ID，D-150） |
| `language` | `varchar(8) not null check (zh, lo)` |
| `content_type` | `varchar(32) not null`; 仅 `zh_pinyin/zh_syllable/zh_hanzi/zh_word/zh_sentence/lo_letter/lo_syllable/lo_word/lo_sentence` |
| `status` | `varchar(16) not null default active`; 仅 `active/disabled/archived` |
| `created_at, updated_at` | `timestamptz not null default now()` |

写入专用知识表时，Content Service 必须校验 `content_type` 与表一致。

## 中文知识

| 表 | 冻结字段与约束 |
| --- | --- |
| `zh_pinyin` | `content_id bigint PK/FK → contents`；`syllable varchar(16) not null`、`initial varchar(8)`、`final varchar(16) not null`、`tone smallint not null check 1..5`、`display_form varchar(16) not null`；UNIQUE `(syllable, tone)`。 |
| `zh_syllables` | `content_id bigint PK/FK → contents`；`syllable varchar(16) not null unique`、`initial varchar(8)`、`final varchar(16) not null`、`display_form varchar(16) not null`。它是**不带声调**的中文音节身份；`zh_pinyin` 是带声调的拼音实体，二者不得互为别名。 |
| `zh_hanzi` | `content_id bigint PK/FK → contents`；`character varchar(4) not null unique`、`traditional_character varchar(4)`、`stroke_count smallint check null or >0`、`radical varchar(8)`。不再存 `primary_pinyin`。 |
| `zh_hanzi_pinyin` | `hanzi_content_id FK → zh_hanzi`、`pinyin_content_id FK → zh_pinyin`、`is_primary boolean not null default false`、`usage_note text`、`created_at timestamptz not null default now()`；PK `(hanzi_content_id,pinyin_content_id)`；partial UNIQUE `hanzi_content_id WHERE is_primary`。 |
| `zh_words` | `content_id bigint PK/FK → contents`；`simplified varchar(128) not null unique`、`traditional varchar(128)`、`pinyin_text varchar(256)`、`word_class varchar(32)`、`difficulty_level smallint check null or >=1`。 |
| `zh_word_hanzi` | `word_content_id FK → zh_words`、`hanzi_content_id FK → zh_hanzi`、`position smallint not null check >0`；PK `(word_content_id,position)`，允许同字重复。 |
| `zh_sentences` | `content_id bigint PK/FK → contents`；`text text not null unique`、`pinyin_text text`、`difficulty_level smallint check null or >=1`。 |

第一阶段不建 `zh_sentence_words`；将来需要精确分词时再增加。

## 老挝语知识

| 表 | 冻结字段与约束 |
| --- | --- |
| `lo_letters` | `content_id bigint PK/FK → contents`；`character varchar(16) not null`、`letter_type varchar(16) not null check consonant/vowel/tone_mark/other`、`letter_class varchar(16)`、`name varchar(64)`、`romanization varchar(64)`、`sort_order smallint`；UNIQUE `(character,letter_type)`。 |
| `lo_syllables` | `content_id bigint PK/FK → contents`；`text varchar(64) not null unique`、`romanization varchar(128)`、`tone smallint`、`pronunciation_key varchar(128)`、`difficulty_level smallint check null or >=1`。 |
| `lo_syllable_letters` | `syllable_content_id FK → lo_syllables`、`letter_content_id FK → lo_letters`、`position smallint not null check >0`、`role varchar(16) check null or initial/vowel/final/tone_mark/other`；PK `(syllable_content_id,position)`。 |
| `lo_words` | `content_id bigint PK/FK → contents`；`text varchar(256) not null unique`、`romanization varchar(256)`、`word_class varchar(32)`、`difficulty_level smallint check null or >=1`。 |
| `lo_word_syllables` | `word_content_id FK → lo_words`、`syllable_content_id FK → lo_syllables`、`position smallint not null check >0`；PK `(word_content_id,position)`。 |
| `lo_sentences` | `content_id bigint PK/FK → contents`；`text text not null unique`、`romanization text`、`difficulty_level smallint check null or >=1`。 |

老挝语复杂拼读规则不硬编码进字母或音节表；未来另建规则模型。

## 释义、翻译、例句和发音

| 表 | 冻结字段与约束 |
| --- | --- |
| `meanings` | `id bigint identity PK`、`content_id bigint not null FK → contents`、`language varchar(8) not null check zh/lo`、`word_class varchar(32)`、`definition text not null`、`sense_order smallint not null default 1 check >0`、`status varchar(16) not null default active check active/disabled`、审计时间；UNIQUE `(content_id,language,sense_order)`。 |
| `translations` | `id bigint identity PK`、`content_id bigint not null FK → contents`、`language varchar(8) not null check zh/lo`、`text text not null`、`is_primary boolean not null default false`、审计时间；partial UNIQUE `(content_id,language) WHERE is_primary`。主要服务 Sentence 与自由文本；Word 优先使用 Meaning/Equivalent。**canonical 教学翻译**（D-151）：仅存人工确认的正式翻译；用户即时 AI 翻译请求归 `learning.translation_requests`。 |
| `examples` | `id bigint identity PK`、`content_id bigint not null FK → contents`、`meaning_id bigint FK → meanings`、`sentence_content_id bigint not null FK → contents`、`sort_order smallint not null default 1 check >0`、`created_at timestamptz not null default now()`；UNIQUE `(content_id,sentence_content_id,meaning_id)`。 `meaning_id null` 表示通用例句。 |
| `pronunciations` | `id bigint identity PK`、`content_id bigint not null FK → contents`、`pronunciation_text varchar(256)`、`pronunciation_key varchar(128)`、`accent varchar(32)`、`source varchar(16) not null check human/tts/system`、`is_primary boolean not null default false`、审计时间。**本表只保存发音知识属性，不保存任何音频文件事实。** |

> 旧 `pronunciation_audios` / `tts_jobs` 已 `superseded`（D-145）：音频的生产、版本、审核与发布统一归 [Audio Production Domain](../audio/database.md)（Slot → Task → Generation Attempt → Asset Version → Review），Content 只经 `audio_slots.source_domain='content'` 提供内容 logical UUID，并消费最终正式音频（`official_asset_version_id`）。字段级迁移记录见 [Learning 数据库](../learning/database.md)。
