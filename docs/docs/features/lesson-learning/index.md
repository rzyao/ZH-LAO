---
feature_id: lesson-learning
title: Lesson 学习流程
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
mobile_pages: []
admin_pages: []
blocks:
  backend: "Content runtime read implementation and formal Content Backend Gate are not yet complete; Learning Backend execution remains blocked."
evidence:
  design:
    - /development/05-content/CONTENT_DESIGN_AUDIT
    - /development/06-learning/LEARNING_DESIGN_AUDIT
---

# Lesson 学习流程

## 功能概览

Portfolio Status：`active`。

`lesson-learning` 负责认证用户从进入 Lesson、推进 Section 到完成 Lesson 的核心学习流程。Content 持有 Lesson/Section/Item 的结构与发布事实；Learning 持有用户 Lesson 状态、resume、完成事实及其事务语义；Identity 只提供 current-user 身份上下文。

## 设计

状态：`done`。

- **Scope**：冻结 StartLesson、UpdateLessonProgress、CompleteLesson 的用户态语义，以及 Lesson/Section/required item 结构由 Content 验证、Learning 只保存 user-owned state 的边界；不创建 LessonItem 永久进度模型。
- **Stage / Artifact**：`DESIGN_PASS`。有效工件包括 `docs/docs/development/06-learning/LEARNING_USE_CASES.md`、`LEARNING_PROGRESS_CONTRACTS.md`、`LEARNING_PUBLIC_CONTRACTS.md`，以及 `docs/docs/development/05-content/CONTENT_PUBLIC_CONTRACTS.md` / `CONTENT_API.md`。
- **Gate / Evidence**：`LEARNING_DESIGN_GATE = PASS`；frozen progress contract 已定义 Lesson `not_started -> in_progress -> completed`、server-owned monotonic percent、forward-only resume anchor 与 CompleteLesson preconditions。Content Design Gate 同样为 PASS，并冻结 Lesson/Section logical UUID 与 public read contract。
- **Next Action**：保持 frozen Lesson state machine 与 owner boundary；不得通过 client `completed=true`、Learning direct SQL Content 或新 persistence 字段绕过现有设计。

## Backend

状态：`blocked`。

- **Scope**：Learning Backend 负责 current-user Lesson progress、事务、activity 与首次 completion；Content trusted view 负责验证 Lesson 与 parent Course、ordered Sections、required Exercise/Knowledge structure。Learning 只通过 Content public contract读取这些事实。
- **Stage / Artifact**：`CONTENT_BLOCKED / IMPLEMENTATION_BLOCKED`。Learning implementation 尚未启动；当前只有 implementation plan / execution brief，没有 Learning Implementation Report。
- **Gate / Evidence**：`LEARNING_EXECUTION_BRIEF.md` 将 Content Gate 标记为 `NOT_PASS`；`LEARNING_PROGRESS_CONTRACTS.md` 明确若 Content final public module不能提供 typed Lesson learning-structure view，则 Learning implementation 必须 BLOCK。当前 `apps/backend/src/modules/` 没有 Content/Learning module，测试目录也没有 Lesson Learning tests。
- **Next Action**：先由 Content 完成并 Gate 住 Lesson trusted/public structure capability；之后再实现 Learning Start/Update/CompleteLesson transaction、completion outbox 与对应 unit/integration tests，并以正式报告更新本 Lane。

## Admin

状态：`na`。

不适用：本 Feature 不包含内容编辑或学习事实人工修改；Content Admin 与 Learning support read 属于各自独立 Feature/能力。

## Mobile

状态：`todo`。

当前 Mobile Foundation 可提供导航、API client 等基础设施，但没有 Lesson Learning 业务 Feature 实现；不提前定义页面行为或把 foundation skeleton 作为交付证据。

## 集成

状态：`todo`。

Content Lesson structure 与 Learning progress command 尚未形成真实运行集成，当前无可审计 integration artifact。

## 验收

状态：`todo`。

Lesson start/progress/completion 尚无 Backend + Mobile 端到端 acceptance evidence。