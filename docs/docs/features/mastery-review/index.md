---
feature_id: mastery-review
title: 掌握度与复习
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

# 掌握度与复习

## 功能概览

Portfolio Status：`active`。

本 Feature 覆盖 Learning V1 的内容掌握度与复习调度。Frozen contract 使用 `learning.content_mastery` 保存用户当前掌握状态，使用 `learning.content_reviews` 保存每 `(user, content)` 唯一的当前复习调度；当前状态不从 activity history 重算，也不把 FSRS / SM-2 等高级算法隐藏进现有 schema。

当前 learner API contract：

- `GET /api/v1/learning/mastery/{contentId}`
- `POST /api/v1/learning/mastery/resolve`
- `GET /api/v1/learning/reviews/due`
- `POST /api/v1/learning/reviews/{contentId}/results`

Canonical evidence：[Learning Product Semantics](../../development/06-learning/LEARNING_PRODUCT_SEMANTICS.md)、[Learning Use Cases](../../development/06-learning/LEARNING_USE_CASES.md)、[Learning API](../../development/06-learning/LEARNING_API.md)、[Learning Design Audit](../../development/06-learning/LEARNING_DESIGN_AUDIT.md)。
