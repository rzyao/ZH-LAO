---
status: frozen（域边界）/ designing（逐表归属）
last_updated: 2026-08-30
source: 数据库域设计 / 拆分学习域
---

# Learning 域

> 「拆分学习域」会话（分享 `6a937088`，[ADR-021](../../adr/ADR-021-content-and-learning-domain-split.md)，台账 [D-147](../../governance/design-register.md)）将原 Learning Domain 拆分为 **Content Domain**（canonical 教学内容）与 **Learning Domain**（用户学习状态与事实）。

**当前 Learning 域只负责：用户 × Content 之间产生的学习状态与学习事实**（课程/Lesson/Unit 进度、词汇/句子学习状态、完成记录、掌握状态、学习历史、复习状态、学习统计 canonical facts）。判断标准：**数据只有在某个用户开始学习之后才产生，则属于 Learning**。

Learning 不再拥有课程、词汇、句子等 canonical 内容本身——那些归 [Content 域](../content/index.md)。依赖方向 `Identity → Learning → Content`（逻辑依赖，非物理 FK）。

```text
Content（学什么）→ Learning（学得怎么样）
Progress / Mastery / Review / Activity
```

学习体系核心边界、模型和第一版 43 张必建表（与 Content 域合计）已冻结；可选的 `question_reviews` 不纳入第一版。冻结表示不再推翻层次与实体关系，不表示 Platform Media、内容发布机制或运营参数不能继续细化。43 张表在 `content.*` / `learning.*` 两 Schema 的**逐表归属清单**为 `designing`（建议映射见 [Content 数据库](../content/database.md) 与下方[表总览](database.md)）。

## 规格页

- [业务模型与边界](model.md)
- [表总览与跨层关系](database.md)
- [知识底座规格](knowledge.md)（Content 定义类）
- [课程体系规格](curriculum.md)（Content 定义类，含 Content Revision）
- [练习体系规格](practice.md)（定义归 Content、作答归 Learning）
- [学习进度规格](progress.md)（Learning 用户状态类）
- [词典规格](dictionary.md)（内容归 Content、搜索历史归 Learning）
- [发音、TTS 与翻译规格](ai-media.md)（发音知识归 Content；Audio 生产归 Audio 域）
