---
feature_id: identity-user-admin
title: 用户账户查询与状态管理
portfolio_status: active
domain:
  - identity
  - operations
status:
  design: todo
  backend: todo
  admin: todo
  mobile: na
  integration: todo
  acceptance: todo
mobile_pages: []
admin_pages: []
evidence: {}
---

# 用户账户查询与状态管理

## 功能概览

本 Feature 面向 Operator/Admin 对普通用户 Identity 账户进行查询，并在未来正式设计允许的范围内执行状态管理。它横跨 Identity 与 Operations：Identity 拥有用户身份事实和账户状态，Operations 拥有后台认证、RBAC、权限与审计控制面。

当前仓库只有 Identity 的窄 public query contract，以及 Operations 对“Operator 自身/角色/权限/审计”的冻结 API；不存在普通用户账户搜索、详情或状态管理的正式 Admin API/Page。因此不能把 Operations Domain 已完成或 Identity 内部 `changeStatus()` 误写为本 Feature 已交付。

## 设计

- **Scope**：需要冻结普通用户的后台检索键、列表/详情可见字段、PII 最小化、允许的账户状态动作、动作原因/审计要求、权限键，以及与 `account-lifecycle` 的职责分割。
- **Stage / Artifact**：[Identity Domain](/domains/identity/) 定义账户事实与状态；[Operations Domain](/domains/operations/) 和 [Operations API](/development/04-operations/OPERATIONS_API) 定义 Operator authentication/RBAC/audit 约束。`AI_STAGE_REGISTRY.json` 没有 `identity-user-admin` 的独立 Feature Design Stage。
- **Gate / Evidence**：Operations V1 API 只冻结 current operator、operators、roles、assignments、permissions、audit logs；Identity 冻结 HTTP 也只有用户自助 `/me` 系列，没有普通用户后台查询/状态 mutation contract。不存在本 Feature Design Gate PASS 证据。
- **Next Action**：先建立 Feature Design Stage，冻结用户查询与状态动作的产品/RBAC/audit/PII contract；不得直接把 Identity repository 或内部 state use case 暴露给 Admin。

## Backend

- **Scope**：可复用的 Identity boundary 目前只有 `IdentityPublicQueries.getIdentityAccountStatus()`、`isIdentityActive()`、`getIdentitySummary()`，返回 stable public UUID/status；内部 `IdentityState.changeStatus()` 具备并发安全状态转换和 Session revoke，但不是 Operator API。
- **Stage / Artifact**：Identity public query 实现在 `apps/backend/src/modules/identity/application/services/identity-public-query.ts`；状态机在 `application/use-cases/identity-state.ts`。Operations 的冻结 Backend contract 见 [Operations API](/development/04-operations/OPERATIONS_API)。没有 `identity-user-admin` Backend Stage、Blueprint 或 Implementation Report。
- **Gate / Evidence**：现有 Operations endpoints 不包含用户账户搜索/详情/禁用/关闭；Identity 16 个冻结 HTTP endpoints 也没有 Operator-facing 用户管理接口。因此底层能力不能支持 `backend: done`。
- **Next Action**：Design Gate 后通过 Owner Domain public contract 设计专用查询/命令边界与 Operations-facing endpoint；补 RBAC、PII、安全、并发状态转换和审计测试，再进入 Feature Backend Gate。

## Admin

- **Scope**：未来 Admin surface 可能包括用户搜索、账户摘要/状态展示和经授权的状态动作；具体字段、筛选项与动作必须来自正式 Design，不从标题生成 CRUD。
- **Stage / Artifact**：当前 Feature Inventory 的 `admin_pages` 为空，远程 Admin 文档树没有 Identity 用户管理页面，也没有本 Feature 的 Admin Design/Execution Stage。
- **Gate / Evidence**：Operations Admin Foundation/Access Control 已存在并不等于 Identity User Admin 已实现；没有页面、路由、Feature-specific report 或 Gate evidence，故保持 `todo`。
- **Next Action**：Backend contract 与 RBAC 权限冻结后，建立 Admin Design Stage，定义页面信息架构、权限可见性、危险动作确认、审计反馈与错误态。

## Mobile

- **Scope**：这是 Operator/Admin 后台 Feature，不属于用户 Mobile 客户端。
- **Stage / Artifact**：Feature Inventory 未映射 Mobile 页面，也没有 Mobile Stage。
- **Gate / Evidence**：正式职责边界不要求 Mobile surface，因此本 Lane 为 `na`。
- **Next Action**：无；用户自助账户生命周期属于 `account-lifecycle`，不要在本 Feature 混入 Mobile 自助流程。

## 集成

- **Scope**：Operations Authentication/RBAC/Audit ↔ Identity 受控 public query/command boundary ↔ Admin UI 的端到端联动；若允许状态动作，还需验证 Session revoke 与后续认证拒绝。
- **Stage / Artifact**：当前没有 `identity-user-admin` Integration Stage 或 Integration Report；Operations API 仅使用 `IdentityPublicQueries` 验证 Operator 的 Identity subject 是否存在且 active，并没有普通用户管理链路。
- **Gate / Evidence**：现有跨域 contract 证明 Identity↔Operations 可通过 public boundary 协作，但没有本 Feature 的查询/状态 API 和 Admin UI，因此不存在端到端 integration evidence。
- **Next Action**：前置 Design/Backend/Admin Lane 完成后建立集成矩阵，覆盖权限、审计、PII、查询、状态动作、Session revoke 和失败回滚。

## 验收

- **Scope**：验收普通用户账户查询正确性、PII 最小化、RBAC 拒绝/允许、审计完整性、状态转换并发安全、Session 联动，以及 Admin UI 不绕过 Backend authorization。
- **Stage / Artifact**：没有 `identity-user-admin` Acceptance Stage、验收矩阵或 Feature Acceptance Report。
- **Gate / Evidence**：Identity/Operations 各自 Domain Gate 不能合并推导本跨域 Feature Acceptance PASS；当前缺少实际 Feature API/UI/Integration evidence。
- **Next Action**：等适用前置 Lane 完成后建立 Feature Acceptance Gate，并使用 Operator 身份、真实权限和用户状态场景做可复现验收。