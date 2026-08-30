---
status: frozen
last_updated: 2026-08-30
source: 拆分学习域
source_share_url: https://chatgpt.com/share/6a937088-e570-83e9-912e-11cc3de27eba
schema: content
---

# Content 域

> 「拆分学习域」会话最终裁决（分享 `6a937088`，[ADR-021](../../adr/ADR-021-content-and-learning-domain-split.md)，台账 [D-147](../../governance/design-register.md)）将原 Learning Domain 按职责拆分为 **Content Domain** 与 **Learning Domain**；全局分区收口修订（D-150）已给出逐表归属定稿（Content 31 张 / Learning 10 张 / 2 张由 Audio 取代）。

## 一句话定义

> **Content 管「用户学什么」；Learning 管「用户学得怎么样」。**

Content Domain 是教学内容的 **canonical source of truth**：所有与具体用户无关、可被多个用户共同消费的教学内容。

## 定位与职责

Content Domain 负责（判断标准：**即使系统中一个用户都没有，这些数据依然存在，则属于 Content**）：

- 语言/知识定义：拼音、汉字、词、句子、字母、音节、释义、例句
- 课程体系：Course → Unit → Lesson → Section → LessonItem 及发布状态
- canonical 教学翻译（`content.translations`，D-151）
- 词典语义与内容关系（Equivalent / Relation / Tag）
- 练习与题目定义、标准答案、答案规则
- 发音知识属性（`content.pronunciations`；音频生产归 Audio Production Domain）
- 内容版本与 Content Revision

Content Domain **不负责**：

- 用户学习进度、用户掌握程度、用户完成状态（归 [Learning](../learning/index.md)）
- 用户作答历史、搜索历史、翻译请求（归 Learning）
- 音频生产、版本、审核、发布（归 [Audio Production](../audio/index.md)）

## 与 Learning 的关系

依赖方向：

- `Learning → Identity`（Learning depends on Identity）
- `Learning → Content`（Learning depends on Content）

箭头仅表示逻辑依赖，**不表示数据库 physical FK**。

- Learning 保存 `user_id`（Identity UUID）与 `course_id` / `lesson_id` / `content_id` / `exercise_id` / `question_id`（Content `public_id` UUID）等 logical references。
- Content 内部实体保留已定稿内部 PK（BIGINT identity，域内真实 FK）；**所有会被其他 Domain 引用的 Content 实体（contents / courses / lessons / lesson_sections / exercises / questions 等）必须具有稳定 UUID `public_id`**（D-150）。
- Learning → Content **不建立跨 Domain physical FK**；任何域不得引用 Content 的内部 BIGINT PK。

## 事实边界

| 属于 Content 的事实 | 属于 Learning 的事实 |
| --- | --- |
| 这个词是什么 / 这个句子的正文是什么 | 用户是否学过这个词 |
| 这个 Lesson 包含什么 / 正确答案是什么 | 用户是否完成这个 Lesson |
| 标准发音要求是什么 | 用户对这个句子的掌握程度 |
| 当前 Content Revision 是什么 | 用户最后一次学习时间 / 是否需要复习 |

**不得为了查询方便在 Learning 中复制第二份 canonical 内容。**

## Content Revision

- Content Revision 描述「教学内容本身发生了什么版本变化」，正式归 **Content Domain** 管理（原 Learning 承担此职责已迁移）。
- Learning 可以记录「用户学习时对应的 content revision」，用于判断：内容更新后是否需要重新学习、已学习进度是否仍然有效、统计按哪个内容版本解释。
- Revision 本身仍由 Content Domain 管理。

## 与 Audio Production 的契约（D-148）

- **Content Domain 拥有文本、正确发音要求和 Content Revision**（修订自早期「Learning 拥有」的表述）。
- 依赖关系：`Audio Production → Content`（而非 `Audio Production → Learning`）。
- Content 提供稳定 logical UUID：`content_entity_id` / `content_revision_id`；Audio 使用 logical reference，不建立跨 Domain FK。
- Audio 的 `audio_slots.source_domain` 指向 **`content`**（不是历史的 `learning`）；Audio 仍只负责音频生产（Slot/Task/Attempt/Asset Version/Review/Event/Batch/Preset），不成为教学内容 canonical source。

## 与 Media/Asset Infrastructure 的契约（D-152）

- Content 的媒体引用（`cover_media_id`、`media_id` 等）统一保存 Media/Asset Infrastructure 的 **`asset_id` logical UUID**，无跨域物理 FK。
- 物理文件事实（storage provider / bucket / object key / mime / size / checksum / codec）唯一 canonical owner 为 Asset Infrastructure；Content 不复制这些事实（D-127/D-152）。

## 其他域引用规则（D-149）

- Social、Chat、Commerce、Rewards、Audio Production、Operations、Trust 等域，如果需要指向**教学内容**：统一引用 `Content Domain logical UUID`，而不是 Learning Domain 内部 ID。
- 只有引用**某个用户的学习事实**（如进度、掌握度），才引用 `Learning Domain logical UUID`。
- `content_id` 与 `learning_record_id / progress_id` 两个概念必须严格区分，不得混用。

## 事件归属

| 归 Content 的事件 | 归 Learning 的事件 |
| --- | --- |
| `content_created` / `content_updated` / `content_published` | `learning_started` / `lesson_completed` |
| `content_revision_created` / `lesson_published` | `vocabulary_learned` / `review_completed` / `progress_updated` |

Content 不记录用户学习事实；Learning 不产生第二份内容事实。

## Schema

`content.*` 与 `learning.*` 两个 Schema 严格分离。原 Learning Domain 的 43 张必建表已逐表定稿归属（D-150）：31 张迁入 `content.*`（[Content 数据库](database.md)）、10 张保留 / 迁入 `learning.*`（[Learning 数据库](../learning/database.md)）、2 张旧音频表由 Audio Production Domain 取代（D-145）。

## 规格页

- [Knowledge 规格](knowledge.md)（17 张知识表）
- [Curriculum 规格](curriculum.md)（课程编排与发布状态）
- [Dictionary 规格](dictionary.md)（词典语义与内容关系）
- [Practice 定义规格](practice.md)（练习/题目定义；作答历史归 Learning）
- [Content 数据库](database.md)（31 张表权威清单 + Translation 裁决 + 跨域契约）

## 数据库状态

- 域边界与拆分规则 `frozen`（D-147）；**逐表归属清单 `frozen`（D-150）**。
- 跨域 `public_id` 已统一为 UUID；`public_id` 生成实现（应用层 UUID v4/v7 选型等）为 `designing`，不影响契约。
