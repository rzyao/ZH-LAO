---
status: frozen
last_updated: 2026-08-30
source: 数据库域设计
---

# Learning 域

Learning 的核心边界、模型和第一版 43 张必建表已冻结；可选的 `question_reviews` 不纳入第一版。冻结表示不再推翻层次与实体关系，不表示 Platform Media、内容发布机制或运营参数不能继续细化。

```text
Knowledge → Curriculum → Practice → Progress/Mastery/Review
→ Dictionary → Pronunciation/TTS/Translation
```

- [业务模型与边界](model.md)
- [表总览与跨层关系](database.md)
- [知识底座规格](knowledge.md)
- [课程体系规格](curriculum.md)
- [练习体系规格](practice.md)
- [学习进度规格](progress.md)
- [词典规格](dictionary.md)
- [发音、TTS 与翻译规格](ai-media.md)
