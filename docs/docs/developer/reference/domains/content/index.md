---
status: frozen
last_updated: 2026-08-31
schema: content
---

# 内容（Content）

Content Domain 负责**用户要学什么**，是所有与具体用户无关、可被多个用户共同消费的教学内容的 canonical source of truth。

判断标准：**即使系统中没有任何用户，这条教学数据仍然应该存在，则它属于 Content。**

## 核心职责

Content 负责：

- 语言与知识定义：拼音、汉字、词、句子、字母、音节、释义、例句；
- 课程体系：Course → Unit → Lesson → Section → LessonItem；
- canonical 教学翻译；
- 词典语义、Equivalent、Relation 与 Tag；
- 练习与题目定义、标准答案和答案规则；
- 发音知识属性；
- 内容版本与 Content Revision；
- 教学内容的发布状态与结构关系。

Content 不负责：

- 用户学习进度、掌握程度、完成状态、复习状态；
- 用户作答历史、搜索历史、即时翻译请求；
- 音频生产、版本、审核和发布；
- 具体媒体文件的物理存储事实。

## 领域能力地图

Content 当前提供的稳定能力包括：

```text
知识内容
课程体系
词典语义
练习与标准答案
发音知识属性
内容发布
Content Revision
跨域可引用的稳定内容标识
```

这些能力可以被多个 Feature 消费，但 Content 不负责消费者页面或端到端交付流程。

## 参与的产品功能

| 产品功能 | 关系 | Content 职责 |
| --- | --- | --- |
| [音频生产](/developer/features/audio-production) | 参与领域 | 提供 canonical 教学内容、发音要求、Content Revision 与规范生产输入 |

音频生产 Feature 不改变 Content 对教学内容的 canonical ownership。

## 与 Learning 的边界

```text
Content = 学什么
Learning = 用户学得怎么样
```

| Content 的事实 | Learning 的事实 |
| --- | --- |
| 一个词 / 句子是什么 | 某用户是否学过它 |
| 一个 Lesson 包含什么 | 某用户是否完成 Lesson |
| 正确答案是什么 | 某用户提交了什么答案 |
| 标准发音要求是什么 | 某用户对内容的掌握程度 |
| 当前 Content Revision | 用户学习时关联的内容版本与学习状态 |

Learning 可以引用 Content，但不能复制第二份 canonical 内容。

## 跨域引用

- Content 内部可以继续使用已经冻结的内部主键与域内真实 FK；
- 所有可能被其他 Domain 引用的 Content 实体必须暴露稳定 UUID `public_id`；
- Learning、Audio、Social、Chat、Commerce、Rewards、Operations、Trust 等领域只引用这些稳定 logical/public UUID；
- 跨 Domain 不建立 physical FK，也不得引用 Content 内部 BIGINT PK。

## Content Revision

Content Revision 表达教学内容本身发生了什么版本变化，由 Content 拥有。

其他领域可以保存某次业务行为对应的 Content Revision logical UUID，用于解释历史事实，但不能修改或重新定义 Content Revision。

## 与 Audio Production 的契约

```text
Content 提供 canonical 文本、发音要求与 Content Revision
        ↓
Audio Production 建立生产需求与生产快照
        ↓
Audio 负责生产、审核、发布和正式音频版本
```

- Audio 引用 `content_entity_id` / `content_revision_id` 等稳定 UUID；
- Content 不拥有 Audio Task、Attempt、Asset Version 或 Review；
- Audio 不成为规范发音知识或教学内容的 canonical owner。

## 与 Media / Asset Infrastructure 的契约

Content 中的媒体字段只保存 `asset_id` logical UUID。

物理文件事实，例如 provider、bucket、object key、MIME、size、checksum、codec 与物理生命周期，统一由 Media / Asset Infrastructure 拥有；Content 不复制这些技术事实。

## 事件归属

Content 只发布教学内容本身的变化，例如：

```text
content_created
content_updated
content_published
content_revision_created
lesson_published
```

用户学习行为由 Learning 发布，不能混入 Content 事件模型。

## V1 数据范围

Content V1 固定 **31 张业务表**。完整表清单、字段、约束、索引和跨域 ID 规则见[数据设计](database.md)。

## 文档地图

- [知识内容](knowledge.md)：语言知识、发音知识属性、释义与例句。
- [课程体系](curriculum.md)：Course、Unit、Lesson、Section 与 LessonItem。
- [词典](dictionary.md)：词典语义、Equivalent、Relation 与 Tag。
- [词汇](vocabulary.md)、[句子](sentence.md) 与 [音节](syllable.md)：具体内容对象的规范语义。
- [练习](practice.md)：练习与题目定义、标准答案与规则。
- [音频绑定](audio-binding.md)：Content 向 Audio 提供规范生产输入的边界。
- [版本复核](versioning-review.md)：Content Revision 的复核与约束记录。
- [数据设计](database.md)：31 张表与数据库契约。
- [音频生产 Feature](/developer/features/audio-production)
- [ADR-021](/developer/reference/adr/ADR-021-content-and-learning-domain-split.md)：Content / Learning 边界形成的架构决策历史。
