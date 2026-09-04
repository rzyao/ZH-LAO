---
status: baseline
last_updated: 2026-09-04
schema: content
source_share_url: https://chatgpt.com/share/6a937088-e570-83e9-912e-11cc3de27eba
---

# Content 数据库总览

> 「拆分学习域」会话裁决（[ADR-021](/developer/reference/adr/ADR-021-content-and-learning-domain-split.md)，D-147）将原 Learning 域按职责拆分为 Content + Learning；**全局分区收口修订（D-150）已给出逐表归属定稿**：原 Learning 43 张必建表中，31 张归 `content.*`、10 张归 `learning.*`、2 张（`pronunciation_audios` / `tts_jobs`）由 Audio Production Domain 取代不再建表。本页是 Content 表归属的**唯一权威清单**；字段级规格见各分层页（本拆分不重新设计已定稿字段契约，仅修正跨域 ID/FK 口径）。

## 归属规则（裁决，frozen）

| 迁入 `content.*` | 保留 / 迁入 `learning.*` |
| --- | --- |
| 教学内容定义表 | 用户进度表 |
| 内容组织关系表 | 用户学习状态表 |
| 课程 / Unit / Lesson 定义表 | 用户完成事实表 |
| Vocabulary / Sentence 等 canonical content 表 | 用户复习状态表 |
| Content Revision / Version 相关表 | 用户与教学内容产生的学习关系表 |

判断标准：**零用户时依然存在的数据 → Content；用户开始学习后才产生的数据 → Learning。**

## Content 最终表清单（36 张，baseline）

### Knowledge（21 张）

| # | 表 | 说明 |
| ---: | --- | --- |
| 1 | `contents` | Content Registry：所有可教学知识的统一身份 |
| 2 | `zh_pinyin_elements` | 中文拼音基础元素 |
| 3 | `zh_syllables` | 中文音节（业务所称“发音”） |
| 4 | `zh_syllable_pinyin_elements` | 中文音节 ↔ 拼音元素有序构成 |
| 5 | `zh_hanzi` | 中文汉字 |
| 6 | `zh_hanzi_syllables` | 汉字 ↔ 中文音节关系 |
| 7 | `zh_words` | 中文词语 |
| 8 | `zh_word_hanzi` | 词语 ↔ 汉字有序构成 |
| 9 | `zh_sentences` | 中文句子 |
| 10 | `zh_sentence_words` | 句子 ↔ 中文词语有序构成 |
| 11 | `lo_letters` | 老挝语字母 |
| 12 | `lo_syllables` | 老挝语音节 |
| 13 | `lo_syllable_letters` | 音节 ↔ 字母有序构成 |
| 14 | `lo_words` | 老挝语词语 |
| 15 | `lo_word_syllables` | 词语 ↔ 音节有序构成 |
| 16 | `lo_sentences` | 老挝语句子 |
| 17 | `lo_sentence_words` | 句子 ↔ 老挝语词语有序构成 |
| 18 | `meanings` | 释义 |
| 19 | `translations` | **canonical 教学翻译**（人工确认的正式翻译内容，D-151） |
| 20 | `examples` | 例句 |
| 21 | `pronunciations` | 发音知识属性（音频生产归 Audio Production Domain） |

### Dictionary（4 张）

| # | 表 | 说明 |
| ---: | --- | --- |
| 22 | `content_equivalents` | 跨语言正式对应关系 |
| 23 | `content_relations` | 同语言内容关系（synonym/antonym 等） |
| 24 | `tags` | 内容标签定义 |
| 25 | `content_tags` | 内容 ↔ 标签关系 |

（`dictionary_search_history` 是用户搜索行为事实，归 `learning.*`，见 [Learning 数据库](../learning/database.md)。）

### Curriculum（5 张）

| # | 表 | 说明 |
| ---: | --- | --- |
| 26 | `courses` | 课程定义与发布状态 |
| 27 | `units` | 单元 |
| 28 | `lessons` | Lesson 定义与发布状态 |
| 29 | `lesson_sections` | Lesson 分节 |
| 30 | `lesson_items` | Lesson 内容项 |

### Revision（1 张）

`content_revisions` 为 Content 结构化版本历史（迁移 `1240_content_revision.sql` 是冻结的历史基线；D-158 已裁决以**新前向迁移**补齐审核工作流。多态 `entity_id` 为 Content logical/public UUID，无物理 FK）：

| 字段 | 类型 | Null | 默认/约束 | 说明 |
| --- | --- | --- | --- | --- |
| `id` | `bigint generated always as identity` | 否 | PK | 版本 ID |
| `revision_public_id` | `uuid` | 否 | UNIQUE | 版本对外 ID |
| `entity_type` | `varchar(32)` | 否 | CHECK `content/course/lesson/exercise/question/translation` | 版本所属实体类型（多态） |
| `entity_id` | `uuid` | 否 | — | 实体 Content logical/public UUID |
| `revision_number` | `integer` | 否 | CHECK `> 0` | 版本号 |
| `status` | `varchar(16)` | 否 | DEFAULT `draft`; CHECK `draft/pending_review/approved/published/rejected/superseded` | 版本审核与发布状态 |
| `snapshot` | `jsonb` | 否 | CHECK `jsonb_typeof=object` | 版本快照 |
| `created_by_operator_id` | `uuid` | 是 | — | 创建操作人 |
| `reviewed_by_operator_id` | `uuid` | 是 | — | 最近一次审核操作人；跨域 logical UUID |
| `review_remark` | `text` | 是 | `rejected` 时非空 | 驳回原因或审核说明 |
| `reviewed_at` | `timestamptz` | 是 | — | 最近一次审核时间 |
| `lock_version` | `integer` | 否 | DEFAULT `0`; CHECK `>= 0` | 乐观锁版本 |
| `created_at` | `timestamptz` | 否 | DEFAULT `now()` | 创建时间 |
| `updated_at` | `timestamptz` | 否 | DEFAULT `now()` | 最近修改时间 |
| `published_at` | `timestamptz` | 是 | 与 `status='published'` 强一致 | 发布时间 |
| `supersedes_revision_id` | `bigint` | 是 | FK → `content.content_revisions(id)` ON DELETE RESTRICT | 被本版本取代的上一版 |

约束：`UNIQUE(entity_type, entity_id, revision_number)`；`(status='published' AND published_at IS NOT NULL) OR (status<>'published' AND published_at IS NULL)`；`status='rejected'` 时 `review_remark` 必须为非空；同一实体至多一个活动工作版本（`draft/pending_review/approved/rejected`）由 partial unique index 保证。索引：`(entity_type,entity_id) WHERE status='published'`、`(entity_type,entity_id,revision_number DESC)`、`(status,published_at DESC)`。

审核状态机与允许流转以 [Content 版本复核](versioning-review.md) 为唯一完整定义：`draft → pending_review → approved → published → superseded`；`pending_review → rejected → draft`，以及 `approved → draft`。严禁 `draft` 直接发布或批准。

> **D-158 实施记录：**冻结的 `1240_content_revision.sql` 未被修改。前向迁移 `1290_content_revision_review_workflow.sql` 已实现上述字段、约束、索引及历史三状态数据兼容，并在目标 PostgreSQL 通过审计；Content 后端审核/发布链路已获得真实集成测试证据。

### Practice 定义（5 张）

| # | 表 | 说明 |
| ---: | --- | --- |
| 32 | `exercises` | 练习定义 |
| 33 | `questions` | 题目定义 |
| 34 | `question_contents` | 题目内容引用 |
| 35 | `question_options` | 题目选项与正确答案 |
| 36 | `answer_rules` | 答案规则 |

（`exercise_attempts` / `question_attempts` 是用户作答事实，归 `learning.*`，见 [Learning 数据库](../learning/database.md)。）

## Translation ownership 最终裁决（D-151）

- **canonical 教学翻译**（系统预先存在、人工确认的正式翻译内容）→ `content.translations`，属 Content。
- **用户即时翻译请求及执行结果**（某用户发起一次翻译并产生 AI 结果的运行事实）→ `learning.translation_requests`，属 Learning；正式入库须经人工确认并提升为 `content.translations`（Request → Review → Promote 流程第一阶段不实现）。
- 全站口径一致：Domain Map、Content/Learning/数据库文档均按此结论表述，不再存在「待裁决」。

## 跨域 ID 契约（D-147 / D-149 / D-150）

- Content 内部实体保留已定稿内部 PK（BIGINT identity，按 ADR-018 各域自定主键），域内关系建真实 FK。
- **所有会被其他 Domain 引用的 Content 实体必须具有稳定 UUID logical/public ID**：`contents` / `courses` / `lessons` / `exercises` / `questions` 的 `public_id` 统一为 **UUID**（应用层生成、不可变、UNIQUE），取代早期 `varchar(32)` 口径。
- Learning 只保存 `content_id` / `course_id` / `lesson_id` / `unit_id` / `vocabulary_id` / `sentence_id` 等 **Content logical UUID references**，不建跨域物理 FK、不得引用 Content 内部 BIGINT PK。
- 他域引用教学内容统一用 Content logical UUID；引用用户学习事实才用 Learning logical UUID；`content_id` 与 `learning_record_id / progress_id` 不得混用。
- Content 被引用实体的 `public_id` 生成实现（应用层 UUID v4/v7 选型等）为 `designing`，不影响本契约。

## Media/Asset 引用契约（ADR-018 / D-152）

- Content 的 `cover_media_id`、`media_id` 等媒体引用统一保存 **Media/Asset Infrastructure 的 `asset_id` logical UUID**，不建跨域物理 FK，不复制 storage provider / bucket / object key / mime / size / checksum 等底层存储事实（物理文件事实唯一 canonical owner 为 Asset Infrastructure，D-127/D-152）。
- 业务音频不在此列：词汇/句子/课程等 canonical 内容的音频由 Audio Production Domain 经 Slot 模型生产（`audio_slots.source_domain = 'content'`，`content_entity_id` 为 Content logical UUID），Content 只消费最终正式音频（`official_asset_version_id` → asset）。

## 跨层完整性（沿用已冻结结论）

- 所有可教学知识通过 `contents.id` 获得统一身份；专用表以 `content_id` 为 PK/FK（域内 FK 保留）。
- 核心 Knowledge Content 不物理删除；下架使用 `contents.status`（D-100 统一删除策略）。
- Registry 类型匹配由 Content Service 校验，避免为此引入复杂跨表约束。

## 规格页

字段级规格（本拆分不改字段契约，仅按最终 ID/FK 规范修正跨域引用类型）：

- [Knowledge 规格](knowledge.md)（17 张知识表）
- [Curriculum 规格](curriculum.md)（课程编排与发布状态、Content Revision）
- [Dictionary 规格](dictionary.md)（词典语义与内容关系）
- [Practice 定义规格](practice.md)（练习/题目定义；作答历史归 [Learning 数据库](../learning/database.md)）
