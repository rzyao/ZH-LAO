---
feature_id: mastery-review
title: 掌握度与复习
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

## 设计

状态：done

- **Scope:** 冻结 deterministic V1 mastery score/status、due review 调度、review outcome、并发提交与 stale-write 语义；FSRS / SM-2、自适应 mastery 与人工 mastery correction 保持 deferred。
- **Stage / Artifact:** `LEARNING_PRODUCT_SEMANTICS` §7-8、`LEARNING_USE_CASES` LRN-R10~R12、`LEARNING_API` §5-6、`LEARNING_DESIGN_AUDIT`。
- **Gate / Evidence:** `LEARNING_DESIGN_GATE = PASS`；独立设计审计中的 Mastery 与 Review Scheduling 均为 PASS。
- **Next Action:** 保持设计冻结；正式实现前重新执行 LRN-00 entry audit，前置 Stage 通过后再进入 LRN-05。

## Backend

状态：blocked

- **Scope:** 未来 LRN-05 的 mastery/review policy、use cases、repositories，以及 LRN-10 的 runtime HTTP 暴露；当前仓库没有 `apps/backend/src/modules/learning/` implementation。
- **Stage / Artifact:** `LEARNING_IMPLEMENTATION_PLAN` 的 LRN-00、LRN-05、LRN-10，以及 `LEARNING_EXECUTION_BRIEF`。
- **Gate / Evidence:** 当前没有 `CONTENT_GATE = PASS` 的 final implementation evidence；Implementation Plan 明确 `Learning Implementation = BLOCKED_BY_CONTENT_GATE`、`Implementation = NOT_STARTED`。
- **Next Action:** 等待 Content 达到 `COMPLETE / PASS / FROZEN` 且提供 required public learning-structure contract；重新执行 LRN-00 后按依赖推进，禁止 direct SQL `content.*` 绕过 owner boundary。

## Admin

状态：na

不适用：当前 Feature 没有独立 Admin UI 交付。Frozen Learning contract 仅为未来 support context 规划只读 reviews diagnostics；该能力属于后续 LRN-11 Backend/Admin-support integration，且要求 `OPERATIONS_GATE = PASS` 与 exact permission `learning.support.read`，不能据此把 Admin Lane 写成已启动。

## Mobile

状态：todo

当前 `main` 没有本 Feature 的 Mobile 页面或实现证据。Mobile 必须基于已实现并通过 Gate 的 runtime contract 接入，不能把 API 设计冻结等同于 Mobile 完成。

## 集成

状态：todo

LRN-12 Integration / Mobile-contract E2E 尚未开始；Backend 仍在 entry gate 被 Content implementation dependency 阻塞。

## 验收

状态：todo

LRN-13 / LRN-14 security、race、final report 与 exit gate 尚未执行；当前不存在 `LEARNING_GATE = PASS` 或 Learning implementation report。
