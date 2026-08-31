---
feature_id: practice-exercises
title: 练习与作答
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

# 练习与作答

## 功能概览

Portfolio Status：`active`。

`practice-exercises` 负责认证用户开始 Exercise attempt、逐题作答、完成或放弃 attempt 的核心练习链。Content 持有 Exercise/Question/revision/answer-rule 与 trusted scoring input；Learning 持有用户 attempt、question result、完成事实与事务/并发语义。错题本/Question Review Notebook 不属于本 Feature，canonical design 中仍为 deferred。

## 设计

状态：`done`。

- **Scope**：冻结 StartExerciseAttempt、SubmitQuestionAnswer、Complete/AbandonExerciseAttempt 的状态、幂等与并发规则；Content 提供 pinned Exercise revision 和 server-only scoring view，Learning 不复制 answer key/scoring canonical data。
- **Stage / Artifact**：`DESIGN_PASS`。主要工件为 `docs/docs/development/06-learning/LEARNING_USE_CASES.md`、`LEARNING_PROGRESS_CONTRACTS.md`、`LEARNING_PUBLIC_CONTRACTS.md`，以及 `docs/docs/development/05-content/CONTENT_API.md`、`CONTENT_PUBLIC_CONTRACTS.md`。
- **Gate / Evidence**：`LEARNING_DESIGN_GATE = PASS`；frozen contracts 已定义 attempt `in_progress -> completed|abandoned`、active-attempt advisory lock、maxAttempts、pinned revision token、typed answer validation 与 completion event。Content Design Gate 已冻结 `resolvePracticeForScoring()` trusted contract，并禁止把 correctness 暴露给 public pre-answer response。
- **Next Action**：保持 Content scoring owner / Learning attempt owner 的边界；不在本 Feature 引入错题本、长期历史 replay 或客户端可信评分。

## Backend

状态：`blocked`。

- **Scope**：Learning Backend 管理 current-user attempt lifecycle、question answer fact、事务与 completion outbox；Content Backend 提供 Exercise/Question current/pinned revision解析和 trusted scoring inputs。Identity 只提供 authenticated current-user context。
- **Stage / Artifact**：`CONTENT_BLOCKED / IMPLEMENTATION_BLOCKED`。Practice design frozen，但 Learning implementation 尚未启动，且没有 Learning Implementation Report。
- **Gate / Evidence**：`LEARNING_EXECUTION_BRIEF.md` 要求 Content read/scoring contract具备正式实现 Gate 后才允许 Learning implementation；当前 `apps/backend/src/modules/` 不存在 Content/Learning module，Backend tests 也没有 exercise attempt / answer / scoring integration tests。
- **Next Action**：Content 先实现并 Gate `resolvePracticeForScoring` 与 Exercise/Question read contract；随后 Learning 实现 attempt/answer/complete/abandon、并发/重试测试与 completion outbox，并以真实实现报告更新状态。

## Admin

状态：`na`。

不适用：题库/练习内容后台属于 Content Feature；Learning V1 也没有 generic attempt/progress mutation Admin 能力。

## Mobile

状态：`todo`。

Mobile 当前没有 Learning Core practice 业务 Feature 实现；不提前定义答题 UI 或把 Foundation API/form 能力当作本 Feature 交付。

## 集成

状态：`todo`。

Content trusted scoring 与 Learning attempt runtime 尚未有真实可运行集成，当前无 integration evidence。

## 验收

状态：`todo`。

练习开始、作答、完成/放弃尚无 Backend + Mobile 端到端 acceptance evidence。