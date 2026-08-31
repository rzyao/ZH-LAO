---
feature_id: dictionary-content-management
title: 词典内容管理
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

# 词典内容管理

## 功能概览

Portfolio Status：`active`。

本 Feature 负责 canonical dictionary facts 的运营管理：canonical translation、跨语言 `content_equivalents`、同语言 `content_relations`、tags/content-tags，以及这些事实依附的 canonical knowledge metadata。用户词典搜索历史属于 Learning；runtime Dictionary Search 是消费能力，不等同于本管理 Feature。

## 设计

状态：done

- **Scope**：冻结 translation / equivalent / relation / meaning 的语义边界，词典关系与 tags 的 canonical ownership，以及 PostgreSQL V1 bounded exact/prefix/trigram search 能力边界；不引入 Redis、Elasticsearch、Meilisearch 或语义搜索承诺。
- **Stage / Artifact**：[CONTENT_PRODUCT_SEMANTICS.md](../../development/05-content/CONTENT_PRODUCT_SEMANTICS.md) §§7–8；[CONTENT_USE_CASES.md](../../development/05-content/CONTENT_USE_CASES.md)；[CONTENT_API.md](../../development/05-content/CONTENT_API.md)；[CONTENT_PUBLIC_CONTRACTS.md](../../development/05-content/CONTENT_PUBLIC_CONTRACTS.md)。
- **Gate / Evidence**：[CONTENT_DESIGN_AUDIT.md](../../development/05-content/CONTENT_DESIGN_AUDIT.md) 的 Knowledge / Dictionary Audit 验证了当前 trigram indexes、bounded search、translation ownership 与无额外 search infrastructure；最终 `CONTENT_DESIGN_GATE = PASS`、Dictionary Contract = FROZEN。
- **Next Action**：保持词典事实与 runtime/search history 边界不变；实现阶段只落实已冻结的 PostgreSQL first contract，不扩展未设计的高级搜索。

## Backend

状态：ready

- **Scope**：实现 dictionary canonical relationship/tag 管理与已冻结的 bounded lookup/search read path，复用 Content Registry/public UUID，不把用户搜索历史写入 Content。
- **Stage / Artifact**：[CONTENT_EXECUTION_BRIEF.md](../../development/05-content/CONTENT_EXECUTION_BRIEF.md) 已 `ready`；主要对应 `CNT-05 Dictionary`，并依赖 `CNT-03/04` 的 Knowledge/authoring 基础及 `CNT-10/11` 的 runtime/admin HTTP。
- **Gate / Evidence**：`CONTENT_DESIGN_GATE = PASS`；最新 [OPERATIONS_IMPLEMENTATION_REPORT.md](../../development/04-operations/OPERATIONS_IMPLEMENTATION_REPORT.md) 已 `OPERATIONS_GATE = PASS`。当前 main 仍没有 `apps/backend/src/modules/content` 和 `CONTENT_IMPLEMENTATION_REPORT.md`，故没有 Backend 完成证据。
- **Next Action**：执行 CNT-05 及相关依赖，覆盖 ranking/query bounds/empty results、relationship invariants、strict API 与真实 PostgreSQL regression，最终以 `CONTENT_GATE = PASS` 关闭 Lane。

## Admin

状态：blocked

- **Scope**：计划管理 equivalents、same-language relations、tags/content tags 与 canonical translation maintenance；不实现用户搜索历史，也不提供万能 JSON/table CRUD。
- **Stage / Artifact**：[CONTENT_ADMIN_EXECUTION_BRIEF.md](../../development/05-content/CONTENT_ADMIN_EXECUTION_BRIEF.md) §8 定义 Dictionary Management；[CONTENT_ADMIN_IMPLEMENTATION_REPORT.md](../../development/05-content/CONTENT_ADMIN_IMPLEMENTATION_REPORT.md) 当前仍为 implementation `NOT_STARTED` / gate `FAIL`。
- **Gate / Evidence**：最新 `OPERATIONS_GATE = PASS` 已消除旧报告的 Operations 前置阻塞，但 `CONTENT_GATE` 仍未 PASS，且 Content Backend 尚不存在，所以无法进行 live Admin API/RBAC/audit 集成。
- **Next Action**：先取得 Content Backend Final Gate，再重新执行 Admin entry audit，随后实现真实 Dictionary Admin 页面和权限/审计/E2E；在此之前不把设计或 placeholder 计为 done。

## Mobile

状态：na

不适用：本 Feature 是 canonical 词典内容运营能力。Mobile 的词典搜索与结果展示由 Dictionary Search 等用户 Feature 承担，搜索历史由 Learning 管理。

## 集成

状态：todo

尚未开始。后续需验证 Dictionary Admin → Content API → Operations RBAC/Audit 与 runtime bounded search/read 的事实一致性；当前不提前制造集成工件或 Gate。

## 验收

状态：todo

尚未开始。最终验收应以真实关系/tag authoring、bounded search regression、权限/审计与端到端结果为证据；设计完成不等于 Feature 验收完成。
