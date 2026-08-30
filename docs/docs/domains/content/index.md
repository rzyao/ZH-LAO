---
status: frozen（域边界）/ designing（逐表归属）
last_updated: 2026-08-30
source: 拆分学习域
source_share_url: https://chatgpt.com/share/6a937088-e570-83e9-912e-11cc3de27eba
schema: content
---

# Content 域

> 「拆分学习域」会话最终裁决（分享 `6a937088`，[ADR-021](../../adr/ADR-021-content-and-learning-domain-split.md)，台账 [D-147](../../governance/design-register.md)）将原 Learning Domain 按职责拆分为 **Content Domain** 与 **Learning Domain**。本页为 Content 域入口；已冻结的字段级规格仍由 Learning 域分层页承载（见下「规格页」），本拆分**不重新设计已定稿数据模型**。

## 一句话定义

> **Content 管「用户学什么」；Learning 管「用户学得怎么样」。**

Content Domain 是教学内容的 **canonical source of truth**：所有与具体用户无关、可被多个用户共同消费的教学内容。

## 定位与职责

Content Domain 负责（判断标准：**即使系统中一个用户都没有，这些数据依然存在，则属于 Content**）：

- 课程体系、单元、课程 / Lesson
- 词汇、句子、教学文本
- 内容之间的组织关系、内容语言信息
- 标准答案、标准发音要求
- 教学内容版本、Content Revision、内容发布状态

Content Domain **不负责**：

- 用户学习进度、用户掌握程度、用户完成状态
- 用户个人学习记录、用户复习状态、用户学习行为

## 与 Learning 的关系

依赖方向：

```text
Identity → Learning → Content
```

其中箭头仅表示逻辑依赖，**不表示数据库 physical FK**。

- Learning 可以保存 `user_id` / `content_id` / `course_id` / `lesson_id` / `unit_id` / `vocabulary_id` / `sentence_id` 等 logical references。
- Content 内部实体可以继续使用已定稿的内部 PK；**所有会被其他 Domain 引用的 Content 实体必须具有稳定 UUID logical/public ID**。
- Learning → Content **不建立跨 Domain physical FK**；Learning 不得引用 Content 的内部 BIGINT PK。
- Identity 用户通过稳定 UUID logical ID 引用；Learning → Identity 不建 physical FK。

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
- Audio 仍只负责音频生产（Slot/Task/Attempt/Asset Version/Review/Event/Batch/Preset），不成为教学内容 canonical source。

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

`content.*` 与 `learning.*` 两个 Schema 严格分离。原 Learning Domain 的表按职责迁移：

- **迁入 `content.*`**：教学内容定义表、内容组织关系表、课程 / Unit / Lesson 定义表、Vocabulary / Sentence 等 canonical content 表、Content Revision / Version 相关表。
- **保留在 `learning.*`**：用户进度表、用户学习状态表、用户完成事实表、用户复习状态表、用户与教学内容产生的学习关系表。

本次只是 Schema / Domain ownership 调整，**不得因为拆 Domain 顺便重新设计已经最终定稿的表**。

## 规格页

字段级规格沿用原 Learning 域已冻结的分层页（按职责归属 Content 的部分）：

- [知识底座规格](../learning/knowledge.md)（Knowledge 内容定义）
- [课程体系规格](../learning/curriculum.md)（课程编排与发布状态、Content Revision）
- [练习体系规格](../learning/practice.md)（练习/题目**定义**部分）
- [词典规格](../learning/dictionary.md)（词典语义与内容关系）
- [发音、TTS 与翻译规格](../learning/ai-media.md)（发音知识属性与翻译请求）

## 数据库状态

- 域边界与拆分规则 `frozen`（D-147）。
- 43 张必建表在两 Schema 的**逐表归属清单**与跨域 `public_id` 字段级落地 `designing`，见 [Content 数据库](database.md) 与 [Learning 数据库](../learning/database.md)。
