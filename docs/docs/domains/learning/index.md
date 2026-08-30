---
status: frozen
last_updated: 2026-08-30
source: 数据库域设计 / 拆分学习域
schema: learning
---

# Learning 域

> 「拆分学习域」会话（分享 `6a937088`，[ADR-021](../../adr/ADR-021-content-and-learning-domain-split.md)，台账 [D-147](../../governance/design-register.md)）将原 Learning Domain 拆分为 **Content Domain**（canonical 教学内容）与 **Learning Domain**（用户学习状态与事实）；全局分区收口修订（D-150）已完成逐表归属定稿。

**当前 Learning 域只负责：用户 × Content 之间产生的学习状态与学习事实**（课程/Lesson 进度、词汇/句子掌握状态、完成记录、复习状态、学习历史、作答历史、搜索历史、翻译请求）。判断标准：**数据只有在某个用户开始学习之后才产生，则属于 Learning**。

Learning 不再拥有课程、词汇、句子等 canonical 内容本身——那些归 [Content 域](../content/index.md)。依赖方向：

- `Learning → Identity`（Learning depends on Identity）
- `Learning → Content`（Learning depends on Content）

均为逻辑依赖，**不建立跨 Domain 物理 FK**；跨域引用统一保存对方 logical UUID（`user_id` 为 Identity UUID，`course_id` / `lesson_id` / `content_id` / `exercise_id` / `question_id` 为 Content `public_id` UUID），不引用对方内部 BIGINT PK。

```text
Content（学什么）→ Learning（学得怎么样）
Progress / Mastery / Review / Activity / Attempts
```

Learning 域最终冻结为 **10 张表**（[表总览](database.md)）；原 Learning 43 张必建表中 31 张定义类表归 `content.*`、2 张旧音频表（`pronunciation_audios` / `tts_jobs`）由 [Audio Production Domain](../audio/index.md) 取代（D-145/D-150）。冻结表示不再推翻层次与实体关系，不表示运营参数或发布机制不能继续细化。

## 规格页

- [业务模型与边界](model.md)
- [表总览与跨层关系](database.md)（10 张表权威清单 + 作答/搜索/翻译请求规格）
- [Progress、Mastery 与 Review 规格](progress.md)（6 张用户状态表）
- 知识底座 / 课程体系 / 词典语义 / 练习定义等 canonical 内容规格已迁至 [Content 域](../content/index.md)
- 发音与音频生产规格见 [Audio Production 域](../audio/index.md)
