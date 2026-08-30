---
status: frozen
last_updated: 2026-08-30
schema: learning
---

# Learning 数据库总览

> **「拆分学习域」会话裁决（D-147）**：原 Learning 域拆分为 Content + Learning 两域，本页 43 张必建表按职责归属 `content.*` / `learning.*` 两个 Schema（定义类 → content、用户状态/行为类 → learning），**不重新设计已定稿表**。下表新增「建议 Schema 归属」列（`designing`，逐表归属清单待主会话确认；建议映射汇总见 [Content 数据库](../content/database.md)）。

第一版共 **43 张必建表**，另有 1 张可选 `question_reviews`。会话曾称 44 张，但最终列出的表名去重后为 43 张；本页按明确实体清单计数。各表字段和约束只在下列分层规格页完整定义。

> **取代说明（2026-08-30）**：`pronunciation_audios` 与 `tts_jobs` 两表的表级设计已被 Audio Production Domain（`audio` Schema 9 张表）取代，`superseded`（D-145）；本页计数暂维持 43 张不变，删除/迁移方式与计数调整待主会话确认（见 [未决事项](../../governance/open-questions.md)）。

| 分层 | 表数 | 表 | 建议 Schema 归属 |
| --- | ---: | --- | --- |
| Knowledge | 18 | `contents`、中文/老挝语知识表、`meanings`、`translations`、`examples`、`pronunciations` | `content` |
| Dictionary | 5 | `content_equivalents`、`content_relations`、`tags`、`content_tags`、`dictionary_search_history` | 前 4 张 `content`；`dictionary_search_history` `learning` |
| Curriculum | 5 | `courses`、`units`、`lessons`、`lesson_sections`、`lesson_items` | `content` |
| Practice | 7 | `exercises`、`questions`、`question_contents`、`question_options`、`answer_rules`、`exercise_attempts`、`question_attempts` | 前 5 张 `content`（定义）；后 2 张 `learning`（作答历史） |
| Progress | 6 | `learning_activities`、`course_progress`、`lesson_progress`、`content_mastery`、`content_reviews`、`content_bookmarks` | `learning` |
| Audio & AI | 3 | ~~`pronunciation_audios`~~、~~`tts_jobs`~~（均已被 Audio Production Domain 取代，D-145）、`translation_requests` | `pronunciation_audios`/`tts_jobs` `superseded`（归 Audio 域）；`translation_requests` `designing`（倾向 `learning`） |

## 规格页

- [Knowledge](knowledge.md)：18 张知识表与非物理删除策略。
- [Curriculum](curriculum.md)：课程编排和发布状态。
- [Practice](practice.md)：题目定义、答案规则和作答历史。
- [Progress](progress.md)：学习活动、当前进度、掌握度和复习。
- [Dictionary](dictionary.md)：词典语义、搜索和用户搜索历史。
- [AI & Media](ai-media.md)：发音、音频、TTS、翻译与 MediaAsset 引用。

## 跨层完整性

- 所有可教学知识通过 `contents.id` 获得统一身份；专用表以 `content_id` 为 PK/FK。
- Registry 类型匹配由 Learning Service 校验，避免为此引入复杂跨表约束。
- Learning 指向 `platform.media_assets` 的 `media_id`、`cover_media_id`、`result_media_id` 将在 Platform Media 规格冻结后补齐跨 Schema FK。
- 课程、题目、活动和用户状态都可以引用 Identity User、Learning Content 与其他 Learning 实体；跨层行为由 Application Service 在事务中协调。
- 核心 Knowledge Content 不物理删除；下架使用 `contents.status`。关系表和运营草稿可按各自编辑策略处理。

## 已取代的早期方案

- `pronunciations.audio_media_id` 与 `voice` 已由 `pronunciation_audios` 取代。
- `meanings.meaning` 已改为 `definition`；Meaning 增加状态。
- 旧 Examples 仅绑定 Content；当前支持可选 `meaning_id`。
- Unit、LessonSection、LessonItem 不再拥有独立发布状态；仅 Course 与 Lesson 管理发布生命周期。
