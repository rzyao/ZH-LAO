---
feature_id: content-revision-publishing
title: 内容 Revision 与发布治理
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

# 内容 Revision 与发布治理

## 功能概览

Portfolio Status：`active`。

本 Feature 负责 Content revision/publication canonical fact：`content.content_revisions`、immutable `revision_public_id`、draft → published → superseded lifecycle、current published revision 切换、historical revision resolution，以及 content/course/lesson/exercise/question/translation-set 的 snapshot/pin 语义。它不等同于 Admin 页面，也不等同于下游 Learning/Audio 的消费实现。

## 设计

状态：done

- **Scope**：冻结 revision authority、支持的 entity types、translation-set revision 语义、published snapshot immutable、supersedes chain、current published transaction、historical revision resolution 与 Learning/Audio revision pin 边界。
- **Stage / Artifact**：[CONTENT_PRODUCT_SEMANTICS.md](../../development/05-content/CONTENT_PRODUCT_SEMANTICS.md) §12；数据库 authority 为 `database/migrations/1240_content_revision.sql`；[CONTENT_PUBLIC_CONTRACTS.md](../../development/05-content/CONTENT_PUBLIC_CONTRACTS.md) 与 [CONTENT_API.md](../../development/05-content/CONTENT_API.md) 冻结 revision resolution/publish contract。
- **Gate / Evidence**：[CONTENT_DESIGN_AUDIT.md](../../development/05-content/CONTENT_DESIGN_AUDIT.md) 的 Revision Audit 验证 stable roots、translation-set semantics 与 forward revision table 均可闭环，明确 `CONTENT_DESIGN_GATE = PASS`、revision support table = 1 via `1240`，无需修改 frozen `0400_content.sql`。
- **Next Action**：保持单一 revision authority；实现阶段不得再建第二套 revision table，也不得把 Admin 展示状态或 Learning/Audio consumer state 写成 Content canonical fact。

## Backend

状态：ready

- **Scope**：在 Knowledge/Curriculum/Practice authoring 中实现统一 revision create/update/publish/supersede 与 historical resolution，并通过 Content public contract向 Learning/Audio 提供 immutable revision resolution/pin 能力。
- **Stage / Artifact**：[CONTENT_EXECUTION_BRIEF.md](../../development/05-content/CONTENT_EXECUTION_BRIEF.md) 已 `ready`；revision 工作横跨 `CNT-04 Knowledge Authoring / Revisions`、`CNT-07 Curriculum Authoring / Lifecycle`、`CNT-08 Practice Definitions` 与 `CNT-09 Public Cross-Domain Contract`，并在后续 integration/security/race task 中闭环。
- **Gate / Evidence**：`CONTENT_DESIGN_GATE = PASS`，且最新 [OPERATIONS_IMPLEMENTATION_REPORT.md](../../development/04-operations/OPERATIONS_IMPLEMENTATION_REPORT.md) 已 `OPERATIONS_GATE = PASS`；但当前 main 不存在 Content Backend module、revision application service 或 `CONTENT_IMPLEMENTATION_REPORT.md`，所以没有实现完成证据。
- **Next Action**：按 Execution Brief 落实 revision numbering、stale update、publish race、supersedes chain、snapshot validation 与 historical resolution 测试，最终通过 `CONTENT_GATE = PASS` 证明 Backend 完成。

## Admin

状态：blocked

- **Scope**：计划显示 draft/published/superseded 状态与 revision identity，执行冻结 publish flow、展示 stale/conflict；禁止直接编辑 revision snapshot JSONB。
- **Stage / Artifact**：[CONTENT_ADMIN_EXECUTION_BRIEF.md](../../development/05-content/CONTENT_ADMIN_EXECUTION_BRIEF.md) §11 定义 Revisions UI/flow；[CONTENT_ADMIN_IMPLEMENTATION_REPORT.md](../../development/05-content/CONTENT_ADMIN_IMPLEMENTATION_REPORT.md) 当前为 implementation `NOT_STARTED` / `CONTENT_ADMIN_GATE = FAIL`。
- **Gate / Evidence**：`ADMIN_FOUNDATION_GATE = PASS` 且最新 `OPERATIONS_GATE = PASS`；但是 `CONTENT_GATE` 尚未 PASS，Content revision Backend/API 尚未实现，无法进行真实 publish/conflict/RBAC/audit 集成。旧 Admin 报告的 Operations blocker 已失效，剩余 blocker 是 Content Backend Final Gate。
- **Next Action**：先完成 Content Backend 并取得 `CONTENT_GATE = PASS`，再重新执行 Admin entry audit，随后实现 revision 状态与 publish/conflict UX、权限、audit 和 live E2E。

## Mobile

状态：na

不适用：Revision / 发布治理是 Content Backend/Admin 的治理能力。Mobile/下游 Domain 只消费已发布或 pinned revision contract，其自身页面交付状态属于对应用户 Feature。

## 集成

状态：todo

尚未开始。后续需验证 Admin publish → Content revision transaction → runtime current revision、Learning/Audio pinned historical resolution 与 Operations audit 的一致性；当前无 Backend/Admin 实现，不创建虚假集成工件。

## 验收

状态：todo

尚未开始。最终验收需要 revision numbering、publish/supersede race、historical resolution、Admin publish/conflict、RBAC/audit 和下游 pin contract 的真实证据；Design Gate 不能替代该 Feature 的验收 Gate。
