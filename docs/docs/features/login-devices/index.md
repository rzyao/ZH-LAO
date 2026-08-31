---
feature_id: login-devices
title: 登录设备与会话管理
portfolio_status: active
domain:
  - identity
status:
  design: todo
  backend: todo
  admin: na
  mobile: todo
  integration: todo
  acceptance: todo
mobile_pages: []
admin_pages: []
evidence: {}
---

# 登录设备与会话管理

## 功能概览

本 Feature 面向用户查看自己的登录设备与会话，并执行已有契约允许的会话/设备管理动作。Identity Backend 已有设备列表、设备撤销、会话列表、Logout 与 Logout All 等底层能力，但 `login-devices` 尚无独立 Feature Stage/Gate，不能因为 Domain Backend 完成就把本页 Backend Lane 标为 done。

当前冻结 API 支持“按设备撤销并联动撤销设备上的会话”，不支持任意 Session ID 的单条 revoke/delete 端点。

## 设计

- **Scope**：需要正式冻结设备与会话列表的展示语义、当前设备识别、撤销设备、Logout / Logout All 的产品动作，以及明确“不提供任意 session revoke”是否继续作为 Feature 边界。
- **Stage / Artifact**：[Identity Domain](/domains/identity/) 与 [Identity Flows](/domains/identity/flows) 已定义 Device/Session Domain 语义；[Identity API](/development/02-identity/IDENTITY_API) 已冻结现有端点，但 `AI_STAGE_REGISTRY.json` 没有 `login-devices` Feature Design Stage。
- **Gate / Evidence**：Identity Design/Domain Gate 证明底层契约稳定，不等于本 Feature 的产品流程、Mobile surface 与 acceptance scope 已设计完成。
- **Next Action**：建立 `login-devices` Design Stage，冻结用户可见字段、动作、确认/错误态、当前设备/当前会话语义和验收边界。

## Backend

- **Scope**：可复用能力包括 `GET /me/devices`、`DELETE /me/devices/{installation_id}`、`GET /me/sessions`、`POST /sessions/logout`、`POST /sessions/logout-all`；设备撤销会在事务内撤销该设备绑定的 sessions，Refresh 会拒绝 revoked device/session。
- **Stage / Artifact**：实现位于 `apps/backend/src/modules/identity/application/use-cases/session-device-lifecycle.ts` 与 `http/routes.ts`；历史实施证据见 [Identity Implementation Report](/development/02-identity/IDENTITY_IMPLEMENTATION_REPORT) 和 [Regression Hotfix Report](/development/02-identity/IDENTITY_REGRESSION_HOTFIX_REPORT)。没有 `login-devices` 独立 Backend Stage/Blueprint/Report。
- **Gate / Evidence**：`session-device-lifecycle.test.ts` 与 `identity-http.test.ts` 验证 Refresh rotation、设备撤销导致 Session 失效、设备/会话安全视图和 Logout All。它们证明 Domain Backend capability 已存在，但当前缺少 Feature-specific Backend Gate/trace，因此保持 `todo`。
- **Next Action**：Design Gate 完成后建立 Feature Backend Stage，把已有 endpoints/use cases/tests 映射到冻结 Feature requirements；只有 trace 与 Gate 完整后才考虑升级状态。

## Admin

- **Scope**：本 Feature 是用户自助登录设备/会话管理，不包含 Operator/Admin 后台。
- **Stage / Artifact**：Feature Inventory 未映射 Admin 页面，也没有 Login Devices Admin Stage。
- **Gate / Evidence**：没有 Admin 交付要求，本 Lane 为 `na`。
- **Next Action**：无；Operator 侧账户管理属于独立 `identity-user-admin` Feature，不在本页混合。

## Mobile

- **Scope**：展示用户设备/会话列表，提供撤销设备、当前会话退出、全部会话退出及相应确认、加载、空态和错误态。
- **Stage / Artifact**：当前没有 `login-devices` Mobile Design / Execution Stage、Execution Brief、Blueprint 或实现报告。
- **Gate / Evidence**：没有 Feature-specific Mobile 页面/测试/Gate evidence；Backend API 存在不能推导 Mobile 已实施。
- **Next Action**：Design 与 Backend Feature contract 冻结后，建立 Mobile Design Stage，定义列表模型、当前设备标识、危险动作确认与 token/session 本地清理语义。

## 集成

- **Scope**：Mobile session/token storage 与 Identity 的 devices/sessions/logout/logout-all API 联调，重点验证撤销动作后的本地认证状态与服务端 Session 状态一致。
- **Stage / Artifact**：没有 `login-devices` Integration Stage 或 Integration Report。
- **Gate / Evidence**：Backend integration tests 证明服务端事务语义，但没有真实 Mobile ↔ Backend 联调 evidence。
- **Next Action**：Mobile implementation 后建立联调矩阵，覆盖撤销当前/非当前设备、Logout、Logout All、Refresh after revoke 与重认证恢复。

## 验收

- **Scope**：验证设备/会话可见性、安全字段、撤销效果、Refresh 拒绝、Logout/Logout All、本地 token 清理和重认证恢复的端到端行为。
- **Stage / Artifact**：没有 `login-devices` Acceptance Stage 或 Feature Acceptance Report。
- **Gate / Evidence**：现有 Backend tests/Gate 不覆盖产品 UI 与真实端到端用户路径，不能作为本 Feature Acceptance PASS。
- **Next Action**：待前置 Lane 完成后建立 Feature Acceptance Gate，并用可复现的 Mobile + Backend 场景验收。