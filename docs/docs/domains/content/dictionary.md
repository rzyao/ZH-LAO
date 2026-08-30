---
status: frozen
last_updated: 2026-08-30
schema: content
---

# Dictionary 规格

词典是基于 Knowledge 的聚合读模型，不创建 `dictionary_entries` 或重复的 Dictionary Word。词本身就是词典条目。本页 4 张语义/关系表均位于 `content` Schema；用户搜索行为事实（`dictionary_search_history`）归 [Learning 数据库](../learning/database.md)。

## 语义与关系表

| 表 | 冻结字段与约束 |
| --- | --- |
| `content_equivalents` | `id bigint identity PK`、`source_content_id bigint not null FK → contents`、`target_content_id bigint not null FK → contents`、`relation_type varchar(32) not null default translation check translation/equivalent/approximate`、`confidence numeric(5,2) check null or 0..100`、`is_primary boolean not null default false`、审计时间；CHECK 源目标不同；UNIQUE `(source_content_id,target_content_id,relation_type)`。表达正式跨语言实体关系。 |
| `content_relations` | `id bigint identity PK`、`source_content_id bigint not null FK → contents`、`target_content_id bigint not null FK → contents`、`relation_type varchar(32) not null check synonym/antonym/related/derived/variant`、`sort_order smallint not null default 1`、`created_at timestamptz not null default now()`；CHECK 源目标不同；UNIQUE `(source_content_id,target_content_id,relation_type)`。 |
| `tags` | `id bigint identity PK`、`code varchar(64) not null unique`、`name varchar(64) not null`、`created_at timestamptz not null default now()`。 |
| `content_tags` | `content_id bigint not null FK → contents`、`tag_id bigint not null FK → tags`、`created_at timestamptz not null default now()`；PK `(content_id,tag_id)`。 |

## 词典语义

- Meaning 是某 Content 在某语言中的文本释义。
- Equivalent 是两个正式 Content 实体的跨语言对应；它不等于文本释义。
- Translation 主要服务 Sentence 与自由文本；Word 优先用 Meaning + Equivalent。
- Example 优先复用正式 Sentence Content，可以挂在整个 Word 或具体 Meaning。
- 用户侧事实归 Learning：收藏复用 `learning.content_bookmarks`；搜索历史存 `learning.dictionary_search_history`（`user_id` 为 Identity logical UUID、`selected_content_id` 为 Content logical UUID，均无跨域 FK），不混入 `learning.learning_activities`。

## 搜索策略

第一阶段使用 PostgreSQL，不引入 Elasticsearch。启用 `pg_trgm`，为下列字段建立 GIN trigram 索引：

```text
zh_words.simplified
zh_words.traditional
zh_words.pinyin_text
lo_words.text
lo_words.romanization
```

读取词典时按 Word → Pronunciations → Meanings → Content Equivalents → Examples → Relations 聚合。搜索索引的具体 migration 属于实现阶段，不在本轮创建。
