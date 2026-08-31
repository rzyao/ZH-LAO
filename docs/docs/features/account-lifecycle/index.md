---
feature_id: account-lifecycle
title: 账户禁用 / 关闭与会话撤销
portfolio_status: active
domain:
  - identity
status:
  design: todo
  backend: todo
  admin: todo
  mobile: todo
  integration: todo
  acceptance: todo
mobile_pages: []
admin_pages: []
evidence: {}
---

# 账户禁用 / 关闭与会话撤销

## 功能概览

本 Feature 负责账户从 active/disabled/closed 状态变化到产品可执行的“禁用、恢复、关闭/注销”流程，以及状态变化与 Session 撤销之间的联动。Identity Domain 已实现并验证底层账户状态机，但当前冻结生产 HTTP **没有** `/me/disable`、`/me/enable`、`/me/close` 或 `DELETE /me`；因此底层 `IdentityState.changeStatus()` 不能被当作本 Feature 已交付。

`closed` 在当前 Domain 语义中是 terminal；状态转为 disabled/closed 会撤销该用户全部 Sessions。是否由用户自助、Operator 后台或其它正式入口触发，仍需由 Feature Design 明确。

## 设计

- **Scope**：需要冻结禁用、重新启用、关闭/注销的发起主体、确认与冷却/不可逆语义、权限边界、会话撤销、事件、错误态，以及 user-self-service 与 Operator/Admin 的责任分割。
- **Stage / Artifact**：[Identity Domain](/domains/identity/) 已定义 `active / disabled / closed`，最新 [Regression Hotfix Report](/development/02-identity/IDENTITY_REGRESSION_HOTFIX_REPORT) 验证 `closed = terminal` 与并发状态转换；但 `AI_STAGE_REGISTRY.json` 没有 `account-lifecycle` Feature Design Stage。
- **Gate / Evidence**：[Identity API](/development/02-identity/IDENTITY_API) 明确账户 disable/enable/close HTTP 属 deferred/非冻结端点；Domain State Machine/Gate 只证明内部语义，不证明产品入口已经设计完成。
- **Next Action**：建立正式 Feature Design Stage，先决定哪些状态动作对用户/Operator 暴露、入口与权限如何划分，再冻结 API/Admin/Mobile scope。

## Backend

- **Scope**：现有内部 `IdentityState.changeStatus()` 使用 `SELECT ... FOR UPDATE` 后的最新状态做转换裁决；active↔disabled、active|disabled→closed，closed 不可恢复；非 active 转换会在同一事务撤销全部用户 Sessions 并写账户状态事件。
- **Stage / Artifact**：实现位于 `apps/backend/src/modules/identity/application/use-cases/identity-state.ts`；相关历史审计见 [Identity Implementation Report](/development/02-identity/IDENTITY_IMPLEMENTATION_REPORT)、[IDN-20 Final Audit](/development/02-identity/IDN_20_FINAL_AUDIT) 与 [Regression Hotfix Report](/development/02-identity/IDENTITY_REGRESSION_HOTFIX_REPORT)。没有本 Feature 独立 Backend Stage/Blueprint/Report。
- **Gate / Evidence**：Race tests 已证明并发状态转换不会破坏 closed terminal，Domain Re-Audit 为 PASS；但冻结 HTTP 的 16 个端点中没有 disable/enable/close，因此不存在可证明本 Feature Backend API 已交付的 Gate。
- **Next Action**：只有 Feature Design 冻结具体入口后，才能建立 Backend Stage；需要新增/复用 API 时按正式 Blueprint 实施，并补 Feature-specific HTTP/security/race tests。

## Admin

- **Scope**：可能承担 Operator 对账户状态的查询/动作入口，但具体动作、RBAC、审计、双人审批或原因字段均不能从 Feature title 推断。
- **Stage / Artifact**：当前 `account-lifecycle` 没有 Admin page 映射、Admin Design Stage、Execution Brief 或实现报告。
- **Gate / Evidence**：Identity 内部状态机不是 Admin surface；仓库没有可证明本 Feature Admin 已启动或完成的证据，因此保持 `todo`。
- **Next Action**：由 Feature Design 明确 Operator responsibility，并与 `identity-user-admin` 去重后，再建立 Admin Stage 和权限/审计契约。

## Mobile

- **Scope**：若产品允许用户自助关闭/注销或其它生命周期动作，Mobile 需要确认、风险提示、成功后本地 Session/token 清理与不可逆状态展示；当前不预设一定提供哪些动作。
- **Stage / Artifact**：没有 `account-lifecycle` Mobile Design / Execution Stage、Execution Brief、Blueprint 或实现报告。
- **Gate / Evidence**：冻结 API 尚无 user-facing lifecycle mutation endpoint，因此不存在可进行真实 Mobile 集成的已冻结 contract。
- **Next Action**：Design/Backend Gate 明确用户入口后，再创建 Mobile Stage；若最终无 Mobile self-service，应由正式设计把本 Lane改为 `na`，而不是本次猜测。

## 集成

- **Scope**：账户状态变化与 Auth/Session、Mobile token storage、Operator/Admin（如适用）以及相关下游 Domain 的 active-identity contract 联动。
- **Stage / Artifact**：没有 `account-lifecycle` Integration Stage 或 Integration Report。
- **Gate / Evidence**：Identity 内部已验证状态变化会撤销 Sessions，public query contract 可供下游检查 active/status；但没有用户/Admin 入口到这些内部语义的 Feature 端到端链路。
- **Next Action**：在正式入口存在后验证状态动作→Session revoke→后续认证拒绝→客户端退出/后台展示→下游 active check 的完整链路。

## 验收

- **Scope**：验收允许的状态转换、closed terminal、Session 全撤销、并发安全、权限/审计、用户或 Operator 入口、客户端退出与后续认证拒绝。
- **Stage / Artifact**：没有 `account-lifecycle` Acceptance Stage 或 Feature Acceptance Report。
- **Gate / Evidence**：Domain race/security tests 只覆盖底层 invariants；当前没有 Feature 入口与跨端验收证据。
- **Next Action**：待 Design、Backend 及适用的 Admin/Mobile/Integration Lane 完成后建立 Feature Acceptance Gate；未完成前保持 `todo`。