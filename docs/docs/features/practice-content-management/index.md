---
feature_id: practice-content-management
title: 练习与题库管理
portfolio_status: active
domain:
  - content
  - operations
status:
  design: done
  backend: ready
  admin: blocked
  mobile: na
  integration: todo
  acceptance: todo
evidence:
  design: CONTENT_DESIGN_AUDIT.md -> CONTENT_DESIGN_GATE = PASS
blocks:
  admin: CONTENT_GATE 尚未 PASS，当前 main 不存在 Content Backend module，无法开始真实 Content Admin 集成。
mobile_pages: []
admin_pages: []
---

# 练习与题库管理

## 功能概览

Portfolio Status：`active`。

本 Feature 负责 canonical practice/question definitions：Exercise、Question 及其 QuestionContent / Option / AnswerRule 聚合、排序、lifecycle、revision/publish 与正确答案定义。用户 attempt / answer / result 属于 Learning；runtime practice view 必须隐藏 scoring truth。

## 设计

状态：done

- **Scope**：冻结 Exercise/Question public roots、aggregate-internal Option/Rule/QuestionContent、question taxonomy、authoring invariants、answer-redacted runtime view、server-only trusted scoring view、revision 与发布规则。
- **Stage / Artifact**：[CONTENT_PRODUCT_SEMANTICS.md](../../development/05-content/CONTENT_PRODUCT_SEMANTICS.md) §§10–12；[CONTENT_USE_CASES.md](../../development/05-content/CONTENT_USE_CASES.md)；[CONTENT_API.md](../../development/05-content/CONTENT_API.md)；[CONTENT_PUBLIC_CONTRACTS.md](../../development/05-content/CONTENT_PUBLIC_CONTRACTS.md)。
- **Gate / Evidence**：[CONTENT_DESIGN_AUDIT.md](../../development/05-content/CONTENT_DESIGN_AUDIT.md) 的 Practice / Answer Leakage Audit 明确 `PublicPracticeView = answer-redacted`、`TrustedScoringView = server-only` 并 PASS；最终 `CONTENT_DESIGN_GATE = PASS`、Practice Contract = FROZEN。
- **Next Action**：保持 Content Definition 与 Learning attempt/result 边界，以及 Admin authoring DTO 与 runtime redacted DTO 分离；实现阶段不得把答案事实泄露到客户端。

## Backend

状态：ready

- **Scope**：实现 Exercise/Question aggregate authoring/read、ordering、publish/revision、trusted scoring public contract 与 answer-redacted runtime API，并覆盖答案泄露与 race/security 测试。
- **Stage / Artifact**：[CONTENT_EXECUTION_BRIEF.md](../../development/05-content/CONTENT_EXECUTION_BRIEF.md) 已 `ready`；主要对应 `CNT-08 Practice Definitions`，并通过 `CNT-09 Public Cross-Domain Contract`、`CNT-10 Runtime HTTP/API`、`CNT-11 Admin Management API` 完成消费者边界。
- **Gate / Evidence**：`CONTENT_DESIGN_GATE = PASS`，最新 [OPERATIONS_IMPLEMENTATION_REPORT.md](../../development/04-operations/OPERATIONS_IMPLEMENTATION_REPORT.md) 为 `OPERATIONS_GATE = PASS`；但 main 不存在 `apps/backend/src/modules/content` / `CONTENT_IMPLEMENTATION_REPORT.md`，没有真实实现与测试 Gate 可支持 `done`。
- **Next Action**：实现 CNT-08 及相关 public/runtime/admin contract，重点执行 answer leakage、publish/update race、strict validation 与 PostgreSQL integration，最终取得 `CONTENT_GATE = PASS`。

## Admin

状态：blocked

- **Scope**：计划提供 Exercise/Question aggregate authoring、Question contents/options/answer rules、ordering 与 publish lifecycle；Admin 可编辑正确答案定义，但其类型必须与 runtime redacted model 隔离。
- **Stage / Artifact**：[CONTENT_ADMIN_EXECUTION_BRIEF.md](../../development/05-content/CONTENT_ADMIN_EXECUTION_BRIEF.md) §10 定义 Practice Definitions；[CONTENT_ADMIN_IMPLEMENTATION_REPORT.md](../../development/05-content/CONTENT_ADMIN_IMPLEMENTATION_REPORT.md) 仍记录 `NOT_STARTED` / `CONTENT_ADMIN_GATE = FAIL`。
- **Gate / Evidence**：Admin Foundation 与最新 Operations Gate 已 PASS；`CONTENT_GATE` 尚未产生，Content Backend/API 不存在，故无法真实验证 mutation、RBAC/audit 或答案模型隔离。当前 blocker 仅保留仍成立的 Content Backend Gate。
- **Next Action**：完成 Content Backend Final Gate 后重新执行 Admin entry audit，再实现 Practice Admin、权限、audit 与 live authoring/publish E2E，并验证 runtime 无答案泄露。

## Mobile

状态：na

不适用：本 Feature 交付题库/练习定义的运营管理。Mobile 作答体验属于 Practice Exercises/Learning Feature，只消费 answer-redacted contract，不在此建立第二套 Mobile 交付状态。

## 集成

状态：todo

尚未开始。后续需验证 Admin authoring → Content trusted definition → Learning server-side scoring 与 runtime answer-redacted view 的双视图边界，以及 Operations RBAC/Audit；当前不虚构集成 Gate。

## 验收

状态：todo

尚未开始。最终验收必须包含真实 authoring/publish、trusted scoring、runtime answer-leakage security、权限/审计和端到端回归证据；设计 PASS 不等于 Feature PASS。
