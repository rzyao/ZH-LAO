---
feature_id: learning-activity-history
title: 学习活动历史
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

# 学习活动历史

## 功能概览

Portfolio Status：`active`。

本 Feature 对应 `learning.learning_activities` 的不可变学习业务历史事实。它不是 Event Sourcing，也不是通用 clickstream / analytics；current progress、mastery、review state 仍由各自 current-state 表维护。Frozen V1 activity taxonomy 为 `course_started`、`lesson_started`、`lesson_completed`、`content_viewed`、`content_practiced`、`exercise_started`、`exercise_completed`、`review_completed`。

当前 runtime contract **没有独立 `/api/v1/learning/activity` 列表路由**；learner 侧通过 `GET /api/v1/learning/home` 获取 bounded `recentActivities`。Frozen support contract 另规划 `/api/v1/admin/learning/users/{userId}/activities` 只读诊断，但尚未实现。

Canonical evidence：[Learning Product Semantics](../../development/06-learning/LEARNING_PRODUCT_SEMANTICS.md)、[Learning Use Cases](../../development/06-learning/LEARNING_USE_CASES.md)、[Learning API](../../development/06-learning/LEARNING_API.md)、[Learning Design Audit](../../development/06-learning/LEARNING_DESIGN_AUDIT.md)。

## 设计

状态：done

- **Scope:** 冻结 8-type immutable learning history、transition occurrence/idempotency、与 current-state mutation 同 transaction 的规则、metadata allowlist，以及 learner Home recent-activity / support-read 边界；排除 generic telemetry、raw answer、translation plaintext 与 opaque token。
- **Stage / Artifact:** `LEARNING_PRODUCT_SEMANTICS` §3、`LEARNING_USE_CASES` LRN-R01 与 internal `WriteLearningActivity`、`LEARNING_API` §2/§11、`LEARNING_DESIGN_AUDIT` Activity Audit。
- **Gate / Evidence:** `LEARNING_DESIGN_GATE = PASS`；Design Audit 的 Activity Audit = PASS，并明确 `learning_activities = immutable learning history != current state != event sourcing`。
- **Next Action:** 保持设计冻结；实现入口通过后先完成 LRN-02 repositories，再进入 LRN-03 Activity Facts，随后由 LRN-10/11 暴露已冻结的读取 contract。

## Backend

状态：blocked

- **Scope:** 未来 LRN-03 typed activity append/query、transition dedupe、metadata validation，以及 LRN-10 Home aggregation；当前仓库没有 `apps/backend/src/modules/learning/` implementation。
- **Stage / Artifact:** `LEARNING_IMPLEMENTATION_PLAN` 的 LRN-00、LRN-02、LRN-03、LRN-10，以及 `LEARNING_EXECUTION_BRIEF`。
- **Gate / Evidence:** 当前没有 `CONTENT_GATE = PASS` 的 final implementation evidence；Implementation Plan 明确 `Learning Implementation = BLOCKED_BY_CONTENT_GATE`、`Implementation = NOT_STARTED`。
- **Next Action:** 等待 Content final Gate 后重跑 LRN-00；通过后实现 activity repository/contract，并验证 retry 不重复 transition activity、metadata 不泄漏敏感数据。

## Admin

状态：na

不适用：当前 Feature 没有独立 Admin UI 交付。Frozen contract 只为后续 support context 规划只读 activities diagnostics；该 Backend/Admin-support integration 仍属于 LRN-11，要求 `OPERATIONS_GATE = PASS` 与 `learning.support.read`，不能据此宣称 Admin Lane 已启动。

## Mobile

状态：todo

当前 `main` 没有本 Feature 的 Mobile 页面或实现证据。Learner 侧未来仅通过 Learning Home 的 bounded `recentActivities` 消费该能力，不应自行读取或重建 activity history。

## 集成

状态：todo

Activity 与 progress/mastery/review/practice 的 transaction coupling 需要在各实现 Stage 与 LRN-12 E2E 中验证；当前 Backend 尚未进入 implementation。

## 验收

状态：todo

LRN-13 / LRN-14 需要验证 IDOR、metadata/privacy、transition retry、完整回归与 final exit gate；当前不存在 implementation-level PASS evidence。
