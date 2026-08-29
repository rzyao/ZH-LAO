---
status: frozen
date: 2026-08-30
---

# ADR-008：Practice 定义结构化，用户答案使用 JSONB

Exercise、Question、Content、Option 和 AnswerRule 使用结构化关系。QuestionAttempt 的用户答案因单选、多选、填空、排序和配对而使用 JSONB；这不等同于将题目定义塞入万能 JSONB。
