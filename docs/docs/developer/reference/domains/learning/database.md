---
status: frozen
last_updated: 2026-08-30
schema: learning
---

# Learning 数据库总览

> **「拆分学习域」会话裁决（[ADR-021](/developer/reference/adr/ADR-021-content-and-learning-domain-split.md)，D-147）+ 全局分区收口修订（D-150/D-151）**：原 Learning 域 43 张必建表已逐表定稿归属——31 张定义类表迁入 `content.*`（唯一权威清单见 [Content 数据库](../content/database.md)），**10 张用户学习事实表保留 / 迁入 `learning.*`**，2 张旧音频表（`pronunciation_audios` / `tts_jobs`）由 Audio Production Domain 取代、不再建表（D-145）。字段契约沿用已冻结规格，仅按最终 ID/FK 规范修正跨域引用类型（跨域一律 logical UUID、无物理 FK）。

## Learning 最终表清单（10 张，frozen）

| # | 表 | 来源分层 | 说明 |
| ---: | --- | --- | --- |
| 1 | `learning_activities` | Progress | 用户学习行为历史（canonical facts） |
| 2 | `course_progress` | Progress | 用户 × 课程进度 |
| 3 | `lesson_progress` | Progress | 用户 × Lesson 进度 |
| 4 | `content_mastery` | Progress | 用户 × Content 掌握状态 |
| 5 | `content_reviews` | Progress | 用户复习调度状态 |
| 6 | `content_bookmarks` | Progress | 用户内容收藏 |
| 7 | `exercise_attempts` | Practice 作答 | 用户练习作答历史 |
| 8 | `question_attempts` | Practice 作答 | 用户逐题作答记录 |
| 9 | `dictionary_search_history` | Dictionary | 用户词典搜索行为事实 |
| 10 | `translation_requests` | AI & Translation | 用户即时翻译请求与执行结果（D-151） |

**已由其他 Domain 取代 / 迁出的旧表**：

| 旧表 | 处置 |
| --- | --- |
| `pronunciation_audios` | `superseded`（D-145）：业务音频生产/版本/发布统一归 Audio Production Domain（`audio` Schema 9 张表），不在 Content/Learning 建表 |
| `tts_jobs` | `superseded`（D-145）：TTS 技术执行归 `audio.audio_generation_attempts`，TTS 配置归 TTS 服务自维护 |
| 其余 31 张定义类表 | 迁入 `content.*`，见 [Content 数据库](../content/database.md) |

> 历史计数说明：原 Learning「43 张必建表」= 31（content）+ 10（learning）+ 2（superseded）；最终两 Schema 合计 **41 张**（Content 31 + Learning 10）。

## 用户事实表规格（自 Dictionary / Practice / AI & Media 分层页迁入）

### `dictionary_search_history`

| 字段 | 冻结字段与约束（最终口径） |
| --- | --- |
| 全部字段 | `id bigint identity PK`、`user_id uuid not null`（Identity logical UUID，无跨域 FK）、`query_text varchar(256) not null`、可空 `selected_content_id uuid`（Content logical UUID，无跨域 FK）、`searched_at timestamptz not null default now()`。 |

搜索历史不混入 `learning_activities`；收藏复用 `content_bookmarks`。

### `exercise_attempts`

| 字段 | 冻结字段与约束（最终口径） |
| --- | --- |
| 全部字段 | `id bigint identity PK`、`user_id uuid not null`（Identity logical UUID，无跨域 FK）、`exercise_id uuid not null`（Content logical UUID，无跨域 FK）、`status varchar(16) not null default in_progress check in_progress/completed/abandoned`、`total_score numeric(10,2)`、`earned_score numeric(10,2)`、`score_percent numeric(5,2) check null or 0..100`、`started_at timestamptz not null default now()`、`completed_at timestamptz`、`created_at timestamptz not null default now()`。同一用户可多次尝试，禁止 UNIQUE `(user_id,exercise_id)`。 |

### `question_attempts`

| 字段 | 冻结字段与约束（最终口径） |
| --- | --- |
| 全部字段 | `id bigint identity PK`、`exercise_attempt_id bigint not null FK → exercise_attempts`（域内 FK）、`question_id uuid not null`（Content logical UUID，无跨域 FK）、`answer_data jsonb not null`、`is_correct boolean`、`earned_score numeric(10,2)`、`answered_at timestamptz not null default now()`；UNIQUE `(exercise_attempt_id,question_id)`。 |

`answer_data` 是允许的 JSONB：可分别表达单选、多选、填空、排序和配对答案；题目定义本身（Content 侧）不使用万能 JSONB。可选表 `question_reviews` 仅在高频错题本产品需求出现时建立，第一阶段不纳入。

### `translation_requests`（Translation ownership 裁决，D-151）

| 字段 | 冻结字段与约束（最终口径） |
| --- | --- |
| 全部字段 | `id bigint identity PK`、可空 `user_id uuid`（Identity logical UUID，无跨域 FK）、`source_language varchar(8) not null`、`target_language varchar(8) not null`、`source_text text not null`、`translated_text text`、`provider varchar(64)`、`model varchar(128)`、`status varchar(16) not null default pending check pending/processing/succeeded/failed`、`error_code varchar(64)`、`created_at timestamptz not null default now()`、`completed_at timestamptz`；CHECK 仅允许 zh→lo 或 lo→zh。 |

裁决依据：用户发起一次翻译请求并产生执行结果是**用户行为/运行事实**（没有具体用户就没有意义），归 Learning；系统预先存在、人工确认的 canonical 教学翻译是内容定义，归 `content.translations`。即时 AI 结果只保留在 `learning.translation_requests`，不得自动污染知识库；未来若审核入库，使用 Request → Review → Promote → `content.translations` 流程，第一阶段不实现。

## 规格页

- [业务模型与边界](model.md)
- [表总览与跨层关系](database.md)（本页）
- [Progress、Mastery 与 Review 规格](progress.md)（6 张用户状态表）

## 跨层完整性

- 历史行为（`learning_activities`）与当前状态（Progress/Mastery/Review 表）分开；当前状态不通过扫描 Activity 计算。
- 所有跨域引用（`user_id` → Identity、`content_id` / `course_id` / `lesson_id` / `exercise_id` / `question_id` → Content）一律保存对方 **logical UUID**，不建跨域物理 FK、不引用 Content 内部 BIGINT PK（D-097/D-098/D-147）。
- 课程发布校验、练习评分、进度更新和复习调度由 Application Service 在事务中完成，不使用 Trigger。
- 核心 Knowledge Content 不物理删除；下架使用 `contents.status`（归 Content 域）。

## 已取代的早期方案

- `pronunciation_audios`（`id bigint PK`、`pronunciation_id FK`、`media_id`、`audio_source human/tts`、`voice_code/provider/model`、`quality_score`、`is_primary`、`status`）与 `tts_jobs`（`content_id/pronunciation_id`、`input_text/language/provider/model/voice_code`、`status pending/processing/succeeded/failed/cancelled`、`result_media_id/error_*`、时间戳）：表级设计 `superseded`（D-145），被 Audio Production Domain 的 Slot/Task/Attempt/Asset Version/Review 模型取代（[ADR-020](/developer/reference/adr/ADR-020-audio-production-domain.md)、[Audio 数据库](../audio/database.md)）。此处仅存字段概要作迁移记录。
- `pronunciations.audio_media_id` 与 `voice` 早期方案已由 Audio Production Domain 取代（发音知识属性归 `content.pronunciations`，音频生产归 Audio）。
- 旧 Examples 仅绑定 Content；当前支持可选 `meaning_id`（归 Content 规格）。
- Unit、LessonSection、LessonItem 不拥有独立发布状态；仅 Course 与 Lesson 管理发布生命周期（归 Content 规格）。
