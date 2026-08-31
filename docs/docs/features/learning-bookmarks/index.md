---
feature_id: learning-bookmarks
title: 学习内容收藏
portfolio_status: active
domain:
  - learning
  - content
  - identity
status:
  design: done
  backend: blocked
  admin: na
  mobile: todo
  integration: todo
  acceptance: todo
blocks:
  backend: "Learning implementation is blocked at LRN-00 because Content final implementation / CONTENT_GATE is not PASS."
evidence:
  design:
    - docs/docs/development/06-learning/LEARNING_PRODUCT_SEMANTICS.md
    - docs/docs/development/06-learning/LEARNING_USE_CASES.md
    - docs/docs/development/06-learning/LEARNING_API.md
    - docs/docs/development/06-learning/LEARNING_DESIGN_AUDIT.md
mobile_pages: []
admin_pages: []
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

## 设计

状态：done

- **Scope:** 冻结 List / Add / Remove / Batch Resolve Bookmark、Content current-public validation、idempotent add/remove、历史 availability 与分页排序语义；Bookmark 明确不是 learning activity。
- **Stage / Artifact:** `LEARNING_PRODUCT_SEMANTICS` §9、`LEARNING_USE_CASES` LRN-R13~R16、`LEARNING_API` §7、`LEARNING_DESIGN_AUDIT`。
- **Gate / Evidence:** `LEARNING_DESIGN_GATE = PASS`；独立审计确认 Bookmark add/remove concurrency 与 owner boundary 已纳入 frozen design。
- **Next Action:** 保持设计冻结；正式实现从 LRN-00 重新校验 entry gate，前置 repository/content resolver 能力通过后进入 LRN-06。

## Backend

状态：blocked

- **Scope:** 未来 LRN-06 的 bookmark repository/use cases，以及 LRN-10 的 runtime HTTP route 与 ownership enforcement；当前仓库没有 `apps/backend/src/modules/learning/` implementation。
- **Stage / Artifact:** `LEARNING_IMPLEMENTATION_PLAN` 的 LRN-00、LRN-02、LRN-06、LRN-10，以及 `LEARNING_EXECUTION_BRIEF`。
- **Gate / Evidence:** 当前没有 `CONTENT_GATE = PASS` 的 final implementation evidence；Implementation Plan 明确 `Learning Implementation = BLOCKED_BY_CONTENT_GATE`、`Implementation = NOT_STARTED`。
- **Next Action:** Content 达到 `COMPLETE / PASS / FROZEN` 后重新执行 LRN-00，再按依赖实现 Bookmark/History；不得 direct SQL `content.*` 替代 Content public resolver。

## Admin

状态：na

不适用：Frozen Learning Admin support contract 没有 Bookmark 专用 Admin 页面或 mutation，当前 Feature 是 learner-owned personal state；不得为了填 Lane 人为创建后台能力。

## Mobile

状态：todo

当前 `main` 没有本 Feature 的 Mobile 页面或实现证据。未来 Mobile 只应消费已实现并验收的 Bookmark runtime contract。

## 集成

状态：todo

LRN-12 Integration / Mobile-contract E2E 尚未开始；Content resolver 与 Learning Backend 均未进入可集成状态。

## 验收

状态：todo

Bookmark 的真实 PostgreSQL、并发、IDOR、HTTP 与 E2E 验收属于 LRN-06、LRN-10、LRN-12~14；当前没有这些 implementation Gate 的 PASS evidence。
