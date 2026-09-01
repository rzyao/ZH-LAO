---
feature_id: learning-activity-history
title: 学习活动历史
portfolio_status: active
domain:
- learning
- content
- identity
mobile_pages: []
admin_pages: []
delivery_evidence:
- docs/docs/development/06-learning/LEARNING_PRODUCT_SEMANTICS.md
- docs/docs/development/06-learning/LEARNING_USE_CASES.md
- docs/docs/development/06-learning/LEARNING_API.md
- docs/docs/development/06-learning/LEARNING_DESIGN_AUDIT.md
delivery_notes:
- Learning implementation is blocked at LRN-00 because Content final implementation / CONTENT_GATE is not PASS.
---

# 学习活动历史

## 功能概览

Portfolio Status：`active`。

本 Feature 对应 `learning.learning_activities` 的不可变学习业务历史事实。它不是 Event Sourcing，也不是通用 clickstream / analytics；current progress、mastery、review state 仍由各自 current-state 表维护。Frozen V1 activity taxonomy 为 `course_started`、`lesson_started`、`lesson_completed`、`content_viewed`、`content_practiced`、`exercise_started`、`exercise_completed`、`review_completed`。

当前 runtime contract **没有独立 `/api/v1/learning/activity` 列表路由**；learner 侧通过 `GET /api/v1/learning/home` 获取 bounded `recentActivities`。Frozen support contract 另规划 `/api/v1/admin/learning/users/{userId}/activities` 只读诊断，但尚未实现。

Canonical evidence：[Learning Product Semantics](../../development/06-learning/LEARNING_PRODUCT_SEMANTICS.md)、[Learning Use Cases](../../development/06-learning/LEARNING_USE_CASES.md)、[Learning API](../../development/06-learning/LEARNING_API.md)、[Learning Design Audit](../../development/06-learning/LEARNING_DESIGN_AUDIT.md)。
