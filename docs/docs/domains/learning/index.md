---
status: frozen
last_updated: 2026-08-31
schema: learning
---

# Learning 域

Learning Domain 负责**用户 × Content 之间产生的学习状态与学习事实**，回答“这个用户学得怎么样”。

判断标准：**只有在某个用户开始学习之后才会产生的数据，属于 Learning。**

## 核心职责

Learning 负责：

- Course / Lesson 学习进度；
- Vocabulary / Sentence 掌握状态；
- 学习完成记录与 Activity 历史；
- Review / 复习状态；
- 用户作答历史；
- 用户搜索历史；
- 即时翻译请求及其用户侧历史。

Learning 不拥有课程、词汇、句子、练习定义、标准答案等 canonical 教学内容；这些事实由 [Content](../content/index.md) 拥有。

## 领域关系

```text
Identity
   │
   │ user logical UUID
   ▼
Learning ◄──── Content
              教学内容 logical UUID
```

依赖方向：

```text
Learning → Identity
Learning → Content
```

这些都是逻辑依赖，不建立跨 Domain physical FK。

## 跨域引用

- `user_id` 引用 Identity 的稳定 logical/public UUID；
- `course_id`、`lesson_id`、`content_id`、`exercise_id`、`question_id` 等引用 Content 暴露的稳定 `public_id` UUID；
- Learning 不得引用 Identity 或 Content 的内部 BIGINT PK；
- Learning 不复制第二份 canonical Content 数据。

## 事实边界

| Content | Learning |
| --- | --- |
| 课程、Lesson、题目定义 | 用户学习 / 完成进度 |
| 词、句子、知识关系 | 用户掌握状态 |
| 标准答案 | 用户作答事实 |
| Content Revision | 用户学习时关联的版本与状态 |
| canonical 翻译 | 用户即时翻译请求 |

## Activity 与当前状态

Learning 区分：

```text
Activity / Attempt = 已经发生的历史事实
Progress / Mastery / Review = 当前用户学习状态
```

历史事实不应被当前状态覆盖；当前状态也不需要通过反复扫描全部历史才能读取。

## Content Revision 消费

Learning 可以记录用户学习行为对应的 Content Revision，用于解释：

- 用户当时学的是哪个内容版本；
- 内容更新后是否需要重新学习或复习；
- 历史统计应该按哪个版本解释。

Revision 的 canonical owner 仍然是 Content。

## 与 Audio Production 的边界

音频的生产、版本、审核与正式发布归 [Audio Production](../audio/index.md)。Learning 只消费教学体验所需要的最终结果，不拥有 Audio Task、Asset Version 或 TTS 生产事实。

## V1 数据范围

Learning V1 固定 **10 张业务表**。完整表清单、用户作答、搜索、翻译请求和跨域引用规则见[数据设计](database.md)。

## 文档地图

- [业务模型与边界](model.md)
- [学习进度、掌握与复习](progress.md)
- [数据设计](database.md)
- [Content 域](../content/index.md)：canonical 教学内容。
- [Audio Production 域](../audio/index.md)：音频生产与发布。
- [ADR-021](../../adr/ADR-021-content-and-learning-domain-split.md)：Content / Learning 边界形成的架构决策历史。
