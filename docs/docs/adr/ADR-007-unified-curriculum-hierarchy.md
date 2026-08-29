---
status: frozen
date: 2026-08-30
---

# ADR-007：统一课程分层与 LessonItem

课程统一采用 Course → Unit → Lesson → LessonSection → LessonItem。LessonItem 是教学节点，可表示知识、文字、媒体和练习；它不要求所有内容都成为 Knowledge Content。仅 Course 和 Lesson 管理发布状态。
