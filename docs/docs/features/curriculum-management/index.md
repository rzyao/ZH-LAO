---
feature_id: curriculum-management
title: 课程编排与发布
portfolio_status: active
domain:
- content
- operations
mobile_pages: []
admin_pages: []
delivery_evidence:
- CONTENT_DESIGN_AUDIT.md -> CONTENT_DESIGN_GATE = PASS
delivery_notes:
- CONTENT_GATE 尚未 PASS，当前 main 不存在 Content Backend module，无法开始真实 Content Admin 集成。
---

# 课程编排与发布

## 功能概览

Portfolio Status：`active`。

本 Feature 负责 canonical curriculum definition 与发布治理：`Course -> Unit -> Lesson -> LessonSection -> LessonItem` 的聚合编排、排序、Course/Lesson lifecycle、稳定 public roots 与 revision/publish 语义。用户课程进度、Lesson 完成与学习历史属于 Learning，不属于本 Feature。
