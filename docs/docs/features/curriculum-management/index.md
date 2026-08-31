---
feature_id: curriculum-management
title: 课程编排与发布
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

# 课程编排与发布

## 功能概览

Portfolio Status：`active`。

本 Feature 负责 canonical curriculum definition 与发布治理：`Course -> Unit -> Lesson -> LessonSection -> LessonItem` 的聚合编排、排序、Course/Lesson lifecycle、稳定 public roots 与 revision/publish 语义。用户课程进度、Lesson 完成与学习历史属于 Learning，不属于本 Feature。

## 设计

状态：done

- **Scope**：冻结课程层级、Course/Lesson public UUID、Unit/LessonItem aggregate-internal 边界、LessonSection 跨域 UUID、`learning_language` 语义、whole-aggregate replacement、ordering/concurrency、draft/published/archived lifecycle 与 revision 规则。
- **Stage / Artifact**：[CONTENT_PRODUCT_SEMANTICS.md](../../development/05-content/CONTENT_PRODUCT_SEMANTICS.md) §9 与 §12；[CONTENT_USE_CASES.md](../../development/05-content/CONTENT_USE_CASES.md)；[CONTENT_API.md](../../development/05-content/CONTENT_API.md)；[CONTENT_PUBLIC_CONTRACTS.md](../../development/05-content/CONTENT_PUBLIC_CONTRACTS.md)。
- **Gate / Evidence**：[CONTENT_DESIGN_AUDIT.md](../../development/05-content/CONTENT_DESIGN_AUDIT.md) 的 Curriculum Audit 明确 physical hierarchy、ordering、lifecycle 与 aggregate replacement 均 PASS；总结果为 `CONTENT_DESIGN_GATE = PASS`、Curriculum Contract = FROZEN。
- **Next Action**：保持 canonical curriculum contract frozen；实现阶段不得为 Unit/Item 发明 public ID、独立 lifecycle 或 table CRUD。

## Backend

状态：ready

- **Scope**：实现课程/课时 aggregate read、authoring、reorder、lifecycle、revision 与 runtime/admin API，使用 root lock + `expectedUpdatedAt` 等冻结并发规则，并验证 Content/Exercise/Asset logical references。
- **Stage / Artifact**：[CONTENT_EXECUTION_BRIEF.md](../../development/05-content/CONTENT_EXECUTION_BRIEF.md) 已 `ready`；主要对应 `CNT-06 Curriculum Reads`、`CNT-07 Curriculum Authoring / Lifecycle`，并由 `CNT-09/10/11` 完成 Public Contract、HTTP 与 Admin API 接线。
- **Gate / Evidence**：`CONTENT_DESIGN_GATE = PASS`；最新 [OPERATIONS_IMPLEMENTATION_REPORT.md](../../development/04-operations/OPERATIONS_IMPLEMENTATION_REPORT.md) 已 `OPERATIONS_GATE = PASS`。当前 `apps/backend/src/modules/content` 与 `CONTENT_IMPLEMENTATION_REPORT.md` 均不存在，因此 Backend 尚未实现，状态为 `ready` 而非 `done`。
- **Next Action**：按 CNT 计划实现 read/authoring/reorder/publish race 等真实 PostgreSQL 测试，最终通过 `CONTENT_GATE = PASS` 关闭 Backend Lane。

## Admin

状态：blocked

- **Scope**：计划围绕 Course → Unit → Lesson → Section → Item 做 aggregate authoring、ordering/reorder、conflict recovery、draft/publish/archive 操作，不生成每表 CRUD。
- **Stage / Artifact**：[CONTENT_ADMIN_EXECUTION_BRIEF.md](../../development/05-content/CONTENT_ADMIN_EXECUTION_BRIEF.md) §9 定义 Curriculum Admin；[CONTENT_ADMIN_IMPLEMENTATION_REPORT.md](../../development/05-content/CONTENT_ADMIN_IMPLEMENTATION_REPORT.md) 仍记录 `NOT_STARTED` / `CONTENT_ADMIN_GATE = FAIL`。
- **Gate / Evidence**：Admin Foundation 与最新 Operations Gate 均 PASS；但 `CONTENT_GATE` 尚未产生，Content Backend/API 未实现，因此 Admin 没有可真实集成的后端。旧报告中的 Operations blocker 已过期，当前剩余 blocker 是 Content Backend Gate。
- **Next Action**：等待 `CONTENT_GATE = PASS` / Content Domain frozen 后重新执行 Admin entry audit，再实现课程编排页面、权限控制、operator audit 与 live reorder/publish E2E。

## Mobile

状态：na

不适用：这里交付的是课程内容运营与发布能力；Mobile 的课程浏览、课程详情和 Lesson 学习属于 Learning Core 等用户 Feature。

## 集成

状态：todo

尚未开始。后续集成必须验证 Admin aggregate mutations → Content Backend → Operations RBAC/Audit，以及发布后的 runtime/Public Contract 可见性；当前没有 Backend/Admin 实现，不创建虚假集成 Stage/Gate。

## 验收

状态：todo

尚未开始。最终验收至少需要真实课程编辑、reorder、publish、conflict 与权限/审计证据；`CONTENT_DESIGN_GATE` 不能替代端到端 Feature 验收。
