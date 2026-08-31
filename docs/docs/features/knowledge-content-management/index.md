---
feature_id: knowledge-content-management
title: 知识内容管理
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

# 知识内容管理

## 功能概览

Portfolio Status：`active`。

本 Feature 负责 canonical teaching knowledge 的运营管理能力：统一 Content Registry、8 类知识 subtype、meaning / canonical translation / example / pronunciation metadata，以及 equivalents / relations / tags 与知识 lifecycle。用户学习事实、即时翻译结果、音频生产状态和资产存储事实分别属于 Learning、Audio、Asset，不在本 Feature 内复制。

## 设计

状态：done

- **Scope**：冻结 Registry + subtype 原子创建、类型/语言一致性、知识生命周期、稳定 public UUID、typed read model，以及 meanings / canonical translations / examples / pronunciation metadata / relations / tags 的归属与聚合语义。
- **Stage / Artifact**：[CONTENT_PRODUCT_SEMANTICS.md](../../development/05-content/CONTENT_PRODUCT_SEMANTICS.md) §§3–7；[CONTENT_USE_CASES.md](../../development/05-content/CONTENT_USE_CASES.md)；[CONTENT_API.md](../../development/05-content/CONTENT_API.md)；[CONTENT_PUBLIC_CONTRACTS.md](../../development/05-content/CONTENT_PUBLIC_CONTRACTS.md)。
- **Gate / Evidence**：[CONTENT_DESIGN_AUDIT.md](../../development/05-content/CONTENT_DESIGN_AUDIT.md) 已完成 Registry/Subtype、Knowledge/Dictionary、Public ID、Concurrency 等独立审计，并明确 `CONTENT_DESIGN_GATE = PASS`、Knowledge Contract = FROZEN。
- **Next Action**：设计保持 frozen；后续实现只能消费 canonical contract。如实现发现真实 contract conflict，回到 Content 设计治理处理，不在 Feature Page 发明第二套事实。

## Backend

状态：ready

- **Scope**：实现 Content module 中知识 Registry/typed read、authoring、revision、bounded validation 与 runtime/admin API；不得暴露 internal BIGINT，不得直接访问其他 Domain SQL。
- **Stage / Artifact**：[CONTENT_EXECUTION_BRIEF.md](../../development/05-content/CONTENT_EXECUTION_BRIEF.md) 已处于 `ready`；对应执行序列主要为 `CNT-03 Knowledge Registry / Reads` 与 `CNT-04 Knowledge Authoring / Revisions`，并由 `CNT-09/10/11` 接 Public Contract、runtime HTTP 与 Admin API。
- **Gate / Evidence**：`CONTENT_DESIGN_GATE = PASS`；最新 [OPERATIONS_IMPLEMENTATION_REPORT.md](../../development/04-operations/OPERATIONS_IMPLEMENTATION_REPORT.md) 已明确 `OPERATIONS_GATE = PASS`。但当前 `apps/backend/src/modules/` 只有 identity / operations / platform，不存在 `content` module，也不存在 `CONTENT_IMPLEMENTATION_REPORT.md`，因此只能标记 `ready`，不能写 `done`。
- **Next Action**：按 Execution Brief 实现并测试对应 CNT tasks，完成真实 PostgreSQL / security / race / API regression，最终由 `CONTENT_GATE = PASS` 证明 Backend 完成。

## Admin

状态：blocked

- **Scope**：计划提供 canonical knowledge create/edit、meanings、canonical translations、examples、pronunciation metadata、relations/tags、lifecycle 与 revision/publish 操作；只消费冻结 Content API 和 Operations 权限/审计能力。
- **Stage / Artifact**：[CONTENT_ADMIN_EXECUTION_BRIEF.md](../../development/05-content/CONTENT_ADMIN_EXECUTION_BRIEF.md) §7 定义 Knowledge Authoring；[CONTENT_ADMIN_IMPLEMENTATION_REPORT.md](../../development/05-content/CONTENT_ADMIN_IMPLEMENTATION_REPORT.md) 记录 implementation `NOT_STARTED` / gate `FAIL`。
- **Gate / Evidence**：`ADMIN_FOUNDATION_GATE = PASS`，且最新 `OPERATIONS_GATE = PASS`；但 `CONTENT_GATE` 仍不存在，当前没有 Content Backend contract 可供 live Admin 消费。旧 Admin 报告中的 Operations blocker 已被最新 Operations Final Gate 消除，剩余真实 blocker 是 Content Backend Gate。
- **Next Action**：先完成 Backend 并取得 `CONTENT_GATE = PASS` / Content Domain frozen；随后重新执行 Admin entry audit，再实现真实页面、RBAC、audit 与 live E2E，不能用 placeholder 或设计稿冒充完成。

## Mobile

状态：na

不适用：本 Feature 是 canonical 内容运营/管理能力。Mobile 对知识内容的消费属于 Learning/Dictionary 等用户 Feature，不在本页建立第二个 Mobile 交付事实源。

## 集成

状态：todo

尚未开始。集成范围将在 Content Backend 与 Content Admin 都存在真实实现后，验证 Admin → Content API → Operations RBAC/Audit、Knowledge revision/public read 与下游 Public Contract 的闭环；当前不提前制造 Stage 或 Gate。

## 验收

状态：todo

尚未开始。只有 Backend、Admin 与集成证据齐全后，才执行该 Feature 的端到端验收并引用真实测试/Gate；设计 Gate 本身不能替代 Feature 验收。
