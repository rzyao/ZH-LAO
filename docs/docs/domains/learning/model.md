---
status: frozen
last_updated: 2026-08-30
schema: learning
---

# Learning 业务模型与边界

> 「拆分学习域」裁决（[ADR-021](../../adr/ADR-021-content-and-learning-domain-split.md)，D-147/D-150）：Content 管「用户学什么」，Learning 管「用户学得怎么样」。本页只描述 **用户 × Content 的学习事实与状态**；知识结构、课程编排、题目定义、词典语义等 canonical 内容模型见 [Content 域](../content/index.md)。

## 核心闭环

```text
Content（学什么）→ Learning（学得怎么样）
Learning Activity → Progress / Mastery / Review → 再次 Practice
```

历史行为与当前状态分开：`learning_activities` 记录历史，Progress/Mastery/Review 表保存可快速查询的当前状态。它不是 Event Sourcing。

## 分层原则（Learning 侧）

- Learning 只保存用户学习事实：进度、掌握、复习、作答、搜索历史、翻译请求。
- 所有对 Identity（`user_id`）与 Content（`course_id` / `lesson_id` / `content_id` / `exercise_id` / `question_id`）的引用一律保存对方 **logical UUID**，不建跨域物理 FK、不引用对方内部 BIGINT PK。
- 历史行为（Activity）与当前状态（Progress/Mastery/Review）分开；当前状态不通过扫描 Activity 计算。
- 不同用户的作答内容使用 JSONB（`answer_data`）；题目定义本身（Content 侧）不使用万能 JSONB。

## 服务边界

- Learning Service 负责练习评分、进度更新和复习调度（Application Service 在事务中完成，不使用数据库 Trigger）。
- 用户即时翻译只写入 `learning.translation_requests`，不得自动污染知识库；正式教学翻译须经人工确认后写入 `content.translations`（D-151，Request → Review → Promote 流程第一阶段不实现）。
- 发音知识属性归 `content.pronunciations`；音频生产归 [Audio Production Domain](../audio/index.md)（Slot → Task → Attempt → Asset Version → Review），Learning 不拥有任何 TTS Job、录音生产或音频版本事实（D-145）。
- TTS 与翻译使用 Entitlement 授权，例如 `learning.translation.daily`、`learning.tts.premium_voice`；不判断 `user.vip`。

## 明确不做

第一阶段不做排行榜、XP、金币、连续学习、复杂 SRS、AI Tutor、独立搜索集群、`unit_progress` 和永久 `lesson_item_progress`。
