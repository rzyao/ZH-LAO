---
feature_id: learning-progress
title: 课程与 Lesson 进度
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
---

# 课程与 Lesson 进度

## 功能概览

Portfolio Status：`active`。

`learning-progress` 覆盖认证用户的 Course Progress 与 Lesson Progress current state、resume anchor、完成事实与课程完成重算。Learning 是这些 user-owned progress facts 的 owner；Content 只提供稳定 Course/Lesson/Section UUID、发布结构与 denominator；Identity 只提供 current-user 身份。

## 设计

状态：`done`。

- **Scope**：冻结 Course/Lesson progress natural key、状态机、server-owned monotonic percent、forward-only resume anchor、Lesson completion 驱动 Course recalculation 与 terminal completion 语义；不让 Content 写 Learning progress，也不把 progress detail扩大成通用跨域 public reader。
- **Stage / Artifact**：`DESIGN_PASS`。主要工件为 `docs/docs/development/06-learning/LEARNING_PROGRESS_CONTRACTS.md`、`LEARNING_USE_CASES.md`、`LEARNING_PUBLIC_CONTRACTS.md`、`LEARNING_PRODUCT_SEMANTICS.md`，并依赖 `docs/docs/development/05-content/CONTENT_PUBLIC_CONTRACTS.md` 的 stable UUID/read contract。
- **Gate / Evidence**：`LEARNING_DESIGN_GATE = PASS`；frozen contract 明确 `course_progress` key=`(user UUID, course UUID)`、`lesson_progress` key=`(user UUID, lesson UUID)`，missing row 为 virtual not_started，completed 为 terminal fact；Course percent denominator 来自 resolved published Course structure。Content Design Gate 同样为 PASS。
- **Next Action**：保持 Learning owner / Content structure-provider 边界；实现阶段不得引入跨域 physical FK、client-owned percentage 或 Content-side progress write。

## Backend

状态：`blocked`。

- **Scope**：Learning Backend 实现 Get/Start/Resume Course、Get/Start/Update/Complete Lesson、Course completion recalculation、activity 与 completion outbox；执行前通过 Content public/trusted views校验 Course/Lesson/Section 与结构。
- **Stage / Artifact**：`CONTENT_BLOCKED / IMPLEMENTATION_BLOCKED`。Design 已完成，但 Learning Backend `NOT_STARTED`，当前没有 Learning module、Learning tests 或 `LEARNING_IMPLEMENTATION_REPORT.md`。
- **Gate / Evidence**：`LEARNING_EXECUTION_BRIEF.md` 记录 `content_gate_status = NOT_PASS` 并禁止在 Gate 前创建正式 Learning modules/routes；`DEVELOPMENT_PROGRESS.md` 同样将 Learning Backend 记为 Not Started / Blocked By Content Backend Gate。当前 `apps/backend/src/modules/` 只有 Identity、Operations、Platform。
- **Next Action**：Content 先完成并 Gate Course/Lesson/Section trusted read capability；随后 Learning 按 progress transaction contract实现代码、并发/幂等/完成语义 tests 与 Implementation Report，再据证据推进 integration/acceptance。

## Admin

状态：`na`。

不适用：本 Feature 不包含 generic 人工修改学习进度；Learning support diagnostics 与其它后台能力不在本 F06 Feature 范围内。

## Mobile

状态：`todo`。

当前 Mobile 只有 Foundation，没有 Course/Lesson progress 业务 Feature 实现；不提前把导航、storage 或 query skeleton 解释为进度交付。

## 集成

状态：`todo`。

Content structure read 与 Learning progress runtime 尚未形成真实集成 artifact；保持 todo，等待 Backend Gate 后开始。

## 验收

状态：`todo`。

Course/Lesson progress、resume 与 completion 尚无端到端 acceptance evidence。