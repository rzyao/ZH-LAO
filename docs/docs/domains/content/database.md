---
status: designing（逐表归属）/ frozen（拆分规则）
last_updated: 2026-08-30
schema: content
source_share_url: https://chatgpt.com/share/6a937088-e570-83e9-912e-11cc3de27eba
---

# Content 数据库总览

> 「拆分学习域」会话裁决（D-147）：原 Learning 的 43 张必建表**按职责迁移**到 `content.*` 与 `learning.*` 两个 Schema，**不重新设计已定稿表**（仅 Domain ownership / Schema 名 / 跨域 logical reference 调整）。会话给出迁移规则（定义类 → content、用户状态/行为类 → learning）但**未逐表点名**，下表为按规则整理的**建议映射**，`designing`，待主会话确认逐表归属清单。

## 归属规则（裁决，frozen）

| 迁入 `content.*` | 保留 / 迁入 `learning.*` |
| --- | --- |
| 教学内容定义表 | 用户进度表 |
| 内容组织关系表 | 用户学习状态表 |
| 课程 / Unit / Lesson 定义表 | 用户完成事实表 |
| Vocabulary / Sentence 等 canonical content 表 | 用户复习状态表 |
| Content Revision / Version 相关表 | 用户与教学内容产生的学习关系表 |

## 43 张必建表建议映射（designing）

> 分层与表名沿用 [Learning 数据库](../learning/database.md) 已冻结清单；`pronunciation_audios` / `tts_jobs` 已被 Audio Production 域取代（`superseded`，D-145），不计入新计数。

| 分层 | 表 | 建议归属 |
| --- | --- | --- |
| Knowledge | `contents`、中文/老挝语知识表、`meanings`、`translations`、`examples`、`pronunciations` | `content` |
| Dictionary | `content_equivalents`、`content_relations`、`tags`、`content_tags` | `content` |
| Dictionary | `dictionary_search_history` | `learning`（用户搜索行为事实） |
| Curriculum | `courses`、`units`、`lessons`、`lesson_sections`、`lesson_items` | `content` |
| Practice | `exercises`、`questions`、`question_contents`、`question_options`、`answer_rules` | `content`（练习/题目定义） |
| Practice | `exercise_attempts`、`question_attempts` | `learning`（作答历史） |
| Progress | `learning_activities`、`course_progress`、`lesson_progress`、`content_mastery`、`content_reviews`、`content_bookmarks` | `learning` |
| Audio & AI | `translation_requests` | `designing`（用户发起的翻译行为事实，倾向 `learning`；待主会话确认） |

## 跨域 ID 契约（D-147 / D-149）

- Content 内部实体保留已定稿内部 PK（含早期 BIGINT identity 口径，按 ADR-018 各域自定主键）。
- **所有会被其他 Domain 引用的 Content 实体必须具有稳定 UUID logical/public ID**（与 ADR-018、Chat/Social 的 `public_id uuid` 口径一致）。
- Learning 只保存 `content_id` / `course_id` / `lesson_id` / `unit_id` / `vocabulary_id` / `sentence_id` 等 **logical references**，不建跨域物理 FK、不得引用 Content 内部 BIGINT PK。
- 他域引用教学内容统一用 Content logical UUID；引用用户学习事实才用 Learning logical UUID；`content_id` 与 `learning_record_id / progress_id` 不得混用。
- 跨域 `public_id` 的字段级落地（哪些实体、字段名、生成方式）随逐表归属清单一起由主会话确认。

## 跨层完整性（沿用已冻结结论）

- 所有可教学知识通过 `contents.id` 获得统一身份；专用表以 `content_id` 为 PK/FK（域内 FK 保留）。
- Content 指向 Media/Asset 的 `media_id` 等跨域引用待 Platform Media 规格冻结后确认落地方式（ADR-018：业务域只存 `asset_id` logical UUID，不建跨域 FK）。
- 核心 Knowledge Content 不物理删除；下架使用 `contents.status`（D-100 统一删除策略）。

## 规格页

字段级规格仍以 [Learning 数据库](../learning/database.md) 及分层页为唯一事实源（本拆分不改字段契约）：
[Knowledge](../learning/knowledge.md) · [Curriculum](../learning/curriculum.md) · [Practice](../learning/practice.md) · [Dictionary](../learning/dictionary.md) · [AI & Media](../learning/ai-media.md)
