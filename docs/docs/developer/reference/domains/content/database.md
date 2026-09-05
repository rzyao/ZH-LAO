---
status: baseline
last_updated: 2026-09-04
schema: content
source_share_url: https://chatgpt.com/share/6a937088-e570-83e9-912e-11cc3de27eba
---

# Content 数据库总览

> 「拆分学习域」会话裁决（[ADR-021](/developer/reference/adr/ADR-021-content-and-learning-domain-split.md)，D-147）将原 Learning 域按职责拆分为 Content + Learning；D-150 的 31 张归属基线仍有效。Content–Audio 公共边界收口以**前向迁移 `1360_content_audio_eligible_types.sql`**增加 `zh_syllables`，使已批准的 `zh_syllable` Audio 身份可由 Content 解析；不修改任何冻结迁移。2 张（`pronunciation_audios` / `tts_jobs`）仍由 Audio Production Domain 取代不再建表。本页是 Content 表归属的**唯一权威清单**。

## 归属规则（裁决，frozen）

| 迁入 `content.*` | 保留 / 迁入 `learning.*` |
| --- | --- |
| 教学内容定义表 | 用户进度表 |
| 内容组织关系表 | 用户学习状态表 |
| 课程 / Unit / Lesson 定义表 | 用户完成事实表 |
| Vocabulary / Sentence 等 canonical content 表 | 用户复习状态表 |
| Content Revision / Version 相关表 | 用户与教学内容产生的学习关系表 |

判断标准：**零用户时依然存在的数据 → Content；用户开始学习后才产生的数据 → Learning。**

## Content 最终表清单（39 张，baseline + ADR-032 前向变更）

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

### Curriculum（6 张）

| # | 表 | 说明 |
| ---: | --- | --- |
| 26 | `courses` | 课程定义与发布状态 |
| 27 | `units` | 单元 |
| 28 | `lessons` | Lesson 定义与发布状态 |
| 29 | `lesson_sections` | Lesson 分节 |
| 30 | `lesson_items` | Lesson 内容项 |
| 31 | `curriculum_command_receipts` | Course/Lesson 生命周期命令的持久化幂等收据（ADR-032） |

### Curriculum revision published-view 前向变更（ADR-029，待实施）

`0400_content.sql` 是冻结物理基线；下表是 **已接受但尚未实施** 的前向 migration 目标，不得写回或改写冻结 migration。

| 表 | 新字段 / 规则 | 说明 |
|---|---|---|
| `courses` | `published_revision_id bigint NULL FK → content_revisions(id) RESTRICT`; `working_revision_id bigint NULL FK → content_revisions(id) RESTRICT` | 内部 current/working revision pointers；公开与跨域只使用 Course UUID / revision UUID。 |
| `lessons` | 同 `courses` 两个 pointer 字段 | Lesson 可独立审核发布；不因所属 Course 的新 revision 失去自身历史。 |
| `content_revisions.snapshot`（`entity_type=course`） | 固定 Unit 顺序、Lesson UUID 与 Lesson revision UUID | 课程正式编排快照。 |
| `content_revisions.snapshot`（`entity_type=lesson`） | 固定 Section/Item 顺序，以及知识/练习 logical UUID 与 published revision UUID | 不复制 canonical 知识或答案；是 LessonItem revision pin 的唯一规范载体。 |

应用服务在 root row lock 下校验 pointer 所指 revision 的 entity type/entity UUID/status，防止跨实体指针；数据库 FK 只保护 revision 行存在。`courses.status` / `lessons.status` 是 aggregate availability projection（draft/published/archived），不是 revision review state；有合法 `published_revision_id` 才可为 public current view。pointer、revision 状态、旧版本 supersede、availability projection、审计和事件必须在同一发布事务内更新。

### Curriculum 生命周期幂等收据（ADR-032）

`curriculum_command_receipts` 是 Content 所有的持久化收据，只覆盖 Course/Lesson revision 的 `submit`、`review`、`publish` 命令；必须通过新的前向 migration 创建，不得改写冻结 migration。

| 字段 | 类型 | Null | 约束 | 说明 |
| --- | --- | --- | --- | --- |
| `id` | `bigint generated always as identity` | 否 | PK，仅域内使用 | 不可向 HTTP 输出。 |
| `operator_id` | `uuid` | 否 | 无跨域物理 FK | Operations operator logical UUID。 |
| `aggregate_type` | `varchar(16)` | 否 | CHECK `course/lesson` | Content aggregate 类型。 |
| `aggregate_id` | `uuid` | 否 | — | Course/Lesson logical/public UUID。 |
| `command` | `varchar(32)` | 否 | CHECK 六类 Course/Lesson submit/review/publish 命令 | 防止不同生命周期动作错误重放。 |
| `idempotency_key` | `varchar(128)` | 否 | 非空 | 客户端提供的请求键。 |
| `request_fingerprint` | `varchar(64)` | 否 | SHA-256 规范化请求摘要 | 同 key 的请求一致性判定。 |
| `response_payload` | `jsonb` | 否 | object | 仅保存可公开重放的成功响应身份；不得含内部 BIGINT 或秘密。 |
| `created_at, updated_at` | `timestamptz` | 否 | DEFAULT `now()` | 收据审计时间。 |

唯一约束为 `UNIQUE(operator_id, aggregate_type, aggregate_id, command, idempotency_key)`。命令开始时先在调用方的 Content 本地事务中取得或创建 receipt；已存在 receipt 的 fingerprint 不同必须拒绝为 `CONFLICT`，一致时重放其成功 payload。新 receipt 与状态变更、发布 pointer、Operations 成功审计一起提交；任一失败整体回滚，不能留下成功可重放的 receipt。

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

### 字母批量任务（2 张，D-167 / ADR-028）

以下为新增目标契约；必须通过新的前向 migration 实现，不得修改既有冻结 migration。

#### `lo_letter_batch_tasks`

| 字段 | 类型 | Null | 默认/约束 | 说明 |
| --- | --- | --- | --- | --- |
| `id` | `bigint generated always as identity` | 否 | PK | 域内任务 ID |
| `public_id` | `uuid` | 否 | UNIQUE | API 使用的稳定任务 UUID |
| `action` | `varchar(24)` | 否 | CHECK `submit_review/approve/reject/publish/archive` | 批量动作 |
| `selection_mode` | `varchar(16)` | 否 | CHECK `explicit_ids/query_all` | 页内显式选择或当前查询全部 |
| `selection_query` | `jsonb` | 是 | 必须为 object | `query_all` 的规范化查询快照；不允许任意字段或 SQL |
| `selection_hash` | `varchar(64)` | 否 | — | 规范化查询与稳定有序 Content UUID 集合的 SHA-256 |
| `expected_count` | `integer` | 否 | CHECK `> 0` | 管理员确认时看到的数量 |
| `target_count` | `integer` | 否 | CHECK `> 0` | 提交事务实际冻结的数量，必须等于 expected_count |
| `reason` | `text` | 是 | `reject/archive` 时 trim 后非空 | 驳回或归档原因 |
| `requested_by_operator_id` | `uuid` | 否 | 无跨域 FK | Operations Operator logical UUID |
| `idempotency_key` | `varchar(128)` | 否 | UNIQUE(`requested_by_operator_id`,`idempotency_key`) | 客户端提交幂等键 |
| `status` | `varchar(32)` | 否 | DEFAULT `queued`; CHECK `queued/running/completed/completed_with_issues/failed` | 任务状态 |
| `processed_count` | `integer` | 否 | DEFAULT 0, CHECK `>=0` | 已处理数量 |
| `succeeded_count` | `integer` | 否 | DEFAULT 0, CHECK `>=0` | 成功数量 |
| `failed_count` | `integer` | 否 | DEFAULT 0, CHECK `>=0` | 失败数量 |
| `skipped_count` | `integer` | 否 | DEFAULT 0, CHECK `>=0` | 跳过数量 |
| `last_error_code` | `varchar(64)` | 是 | — | 最近任务级安全错误码 |
| `created_at, updated_at` | `timestamptz` | 否 | DEFAULT `now()` | 审计时间 |
| `started_at, completed_at` | `timestamptz` | 是 | 与状态一致 | 执行时间 |

同行不变量：`processed_count = succeeded_count + failed_count + skipped_count` 且 `processed_count <= target_count`；`completed*` 时 `processed_count = target_count`；`selection_mode='query_all'` 时 `selection_query IS NOT NULL`。任务长期保留，不提供物理删除或清理。

队列索引：`(status, created_at)` WHERE `status IN ('queued','running')`；历史查询索引：`(requested_by_operator_id, created_at DESC)`。

#### `lo_letter_batch_task_items`

| 字段 | 类型 | Null | 默认/约束 | 说明 |
| --- | --- | --- | --- | --- |
| `id` | `bigint generated always as identity` | 否 | PK | 明细 ID |
| `task_id` | `bigint` | 否 | FK → `lo_letter_batch_tasks(id)` ON DELETE RESTRICT | 所属任务 |
| `item_no` | `integer` | 否 | CHECK `>0`; UNIQUE(`task_id`,`item_no`) | 稳定顺序 |
| `content_id` | `uuid` | 否 | UNIQUE(`task_id`,`content_id`) | 冻结的 Content logical UUID |
| `revision_id` | `uuid` | 是 | — | 提交时适用的 Revision UUID；`archive` 可空 |
| `status` | `varchar(16)` | 否 | DEFAULT `queued`; CHECK `queued/running/succeeded/failed/skipped` | 逐项状态 |
| `error_code` | `varchar(64)` | 是 | — | 失败/跳过业务码 |
| `error_message` | `text` | 是 | — | 安全可展示原因 |
| `retry_count` | `integer` | 否 | DEFAULT 0, CHECK `>=0` | 失败项重试次数 |
| `last_attempt_at, completed_at` | `timestamptz` | 是 | — | 执行时间 |
| `created_at, updated_at` | `timestamptz` | 否 | DEFAULT `now()` | 审计时间 |

提交任务的单一 Content 事务必须创建任务、解析完整目标集合、写入全部 items 后才允许置 `queued`；目标集合为空，或实际数量/hash 与预览的 `expected_count/selection_hash` 不同则整体拒绝。Worker 使用 `FOR UPDATE SKIP LOCKED` 分批认领，逐项在独立事务中重取当前 Content/Revision 并执行状态、锁版本和权限检查。失败项重试只把 `failed` 明细恢复为 `queued`，并在同一事务内扣回相应 `processed_count/failed_count`；成功和跳过项不重复执行。

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

## 分支数据库结构整合（D-172）

2026-09-05 经用户批准，中文结构以 `1310_content_language_structures.sql` 为准。`1360_content_audio_eligible_types.sql` 是音频分支的旧模型，原始 SQL 和已有迁移账本记录保留，通过 `database/checks/migration-supersessions.json` 标记替代关系，新的安装不会执行该重复建表脚本。`1309_content_audio_legacy_preflight.sql` 在 1310 前执行，仅移除无内容身份、无数据的旧无声调音节表；存在旧数据时拒绝迁移，必须先完成显式业务映射，不猜测声调、不静默删除。已应用的旧脚本仍验证校验和，不伪造已应用记录。

Audio 使用同一 Content UUID 与版本快照；`zh_pinyin_element` 和带声调的 `zh_syllable` 定义见 [Content 知识规格](knowledge.md)，音频角色与领域边界见 [Audio Binding](audio-binding.md)。
