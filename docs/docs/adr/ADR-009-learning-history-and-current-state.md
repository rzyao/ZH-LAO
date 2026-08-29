---
status: frozen
date: 2026-08-30
---

# ADR-009：Learning History 与 Current State 分离

LearningActivity 保存行为历史；CourseProgress、LessonProgress、ContentMastery、ContentReviews 保存当前状态。应用不通过重放 Activity 计算首页进度，因此该模型不是 Event Sourcing。
