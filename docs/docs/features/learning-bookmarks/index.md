---
feature_id: learning-bookmarks
title: 学习内容收藏
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

# 学习内容收藏

## 功能概览

Portfolio Status：`active`。

本 Feature 是 learner-owned 的学习内容收藏状态。Frozen Learning V1 使用 `learning.content_bookmarks`，不把 Bookmark 写入 Content，也不把 Bookmark 记作 `learning_activities`。历史收藏在 Content disabled / archived 后保留，并由读取结果表达 availability。

当前 learner API contract：

- `GET /api/v1/learning/bookmarks`
- `PUT /api/v1/learning/bookmarks/{contentId}`
- `DELETE /api/v1/learning/bookmarks/{contentId}`
- `POST /api/v1/learning/bookmarks/resolve`

Canonical evidence：[Learning Product Semantics](../../development/06-learning/LEARNING_PRODUCT_SEMANTICS.md)、[Learning Use Cases](../../development/06-learning/LEARNING_USE_CASES.md)、[Learning API](../../development/06-learning/LEARNING_API.md)、[Learning Design Audit](../../development/06-learning/LEARNING_DESIGN_AUDIT.md)。
