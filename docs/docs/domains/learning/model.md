---
status: frozen
last_updated: 2026-08-30
---

# Learning 业务模型与边界

## 核心闭环

```text
Knowledge → Course → Lesson → Practice Attempt
→ Mastery → Review → 再次 Practice
```

历史行为与当前状态分开：`learning_activities` 记录历史，Progress/Mastery/Review 表保存可快速查询的当前状态。它不是 Event Sourcing。

## 分层原则

- 中文和老挝语知识结构分别建模；中文为拼音、汉字、词、句子，老挝语为字母、音节、词、句子。
- Content Registry 提供统一身份；具体知识实体保留在专用表，禁止万能 `contents.data JSONB`。
- 课程统一为 Course → Unit → Lesson → Section → LessonItem；课程内容与知识内容分开。
- Practice 的题目定义结构化；不同用户答案使用 JSONB。
- Dictionary 不是第二套词库。正式 Word/Sentence 和其 Meaning、Translation、Example、Equivalent、Relation、Tag 共同构成词典读模型。
- 发音是知识属性，音频是 MediaAsset，TTS 是异步生成过程，翻译是独立能力。

## 服务边界

- Learning Service 保证具体知识表与 Content Registry 的 `content_type` 一致；普通 FK 只保证 Registry 存在。
- Application Service 完成课程发布校验、练习评分、进度更新和复习调度；不使用数据库 Trigger。
- TTS Job 成功后创建 Platform MediaAsset，再创建 PronunciationAudio。
- 正式教学翻译写入 `translations`；用户即时翻译只写入 `translation_requests`，不得自动污染知识库。
- TTS 与翻译使用 Entitlement 授权，例如 `learning.translation.daily`、`learning.tts.premium_voice`；不判断 `user.vip`。

## 明确不做

第一阶段不做排行榜、XP、金币、连续学习、复杂 SRS、AI Tutor、独立搜索集群、`unit_progress` 和永久 `lesson_item_progress`。
