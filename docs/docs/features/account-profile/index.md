---
feature_id: account-profile
title: 账户基础资料与学习方向
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

# 账户基础资料与学习方向

## 功能概览

本 Feature 面向用户自己的账户基础资料与学习方向。Identity 当前已经提供 BasicProfile 与固定 LearningProfile 的 Domain/Backend 能力，但仓库尚未为 `account-profile` 建立独立 Feature Stage/Gate，因此不能把 Domain 实现自动折算为本 Feature 的 Design、Backend 或 Mobile 已交付。

当前冻结语义中，首次注册可以设置学习方向，已有用户再次登录若提交冲突方向会返回 `LEARNING_DIRECTION_IMMUTABLE`；生产 API 只提供学习方向读取，没有修改学习方向的端点。

## 设计

- **Scope**：需要正式冻结用户可查看/编辑的 BasicProfile 字段，以及“学习方向”在产品层究竟保持首次注册后固定、还是未来允许变更；不能从标题推导出“可修改学习方向”。
- **Stage / Artifact**：Identity canonical design 已定义 `BasicProfile`、固定 `LearningProfile` 与首次注册学习方向语义，见 [Identity Domain](/domains/identity/) 与 [Identity Flows](/domains/identity/flows)；但 `AI_STAGE_REGISTRY.json` 没有 `account-profile` 的独立 Feature Design Stage。
- **Gate / Evidence**：[Identity API](/development/02-identity/IDENTITY_API) 明确已有 `GET/PATCH /me/profile`、`GET /me/learning-profile`，并把 `PATCH /me/learning-profile` / ChangeLearningDirection 留在 deferred/not-supported 边界。Domain Gate 不能替代本 Feature Design Gate。
- **Next Action**：先建立正式 Feature Design Stage，冻结自助资料字段、学习方向只读/变更边界、Mobile 交互与验收标准，再决定后续 Lane。

## Backend

- **Scope**：当前底层已具备个人资料读取/白名单更新、学习方向读取，以及首次注册创建 BasicProfile/LearningProfile；但“账户基础资料与学习方向”作为完整 Feature 的 Backend 交付范围尚未独立冻结。
- **Stage / Artifact**：真实实现位于 `apps/backend/src/modules/identity/http/routes.ts` 与 Profile 相关 use case；历史实施证据见 [Identity Implementation Report](/development/02-identity/IDENTITY_IMPLEMENTATION_REPORT) 和 [Regression Hotfix Report](/development/02-identity/IDENTITY_REGRESSION_HOTFIX_REPORT)。当前没有 `ACCOUNT-PROFILE-BACKEND` 一类正式 Stage/Blueprint/Report。
- **Gate / Evidence**：`identity-http.test.ts` 已验证个人资料读取/patch、显式 null 清空、空 patch 拒绝和学习方向读取；Phone 登录实现会在首次注册创建固定学习方向，并拒绝既有用户冲突方向。以上是可复用 Backend capability evidence，不等于本 Feature Backend Gate 已通过。
- **Next Action**：Design Gate 完成后，按冻结 Scope 建立 Feature Backend Stage；若最终仅复用现有能力，也要以 Feature-specific trace / tests / Gate 证明后才能从 `todo` 升级。

## Admin

- **Scope**：本 Feature 定义为用户自身账户资料与学习方向，不包含 Operator/Admin 后台管理。
- **Stage / Artifact**：Feature Inventory 未为 `account-profile` 映射 Admin 页面，也没有相应 Admin Stage。
- **Gate / Evidence**：没有需要交付的 Admin surface，因此本 Lane 为 `na`，而不是把 `identity-user-admin` 的职责合并到本页。
- **Next Action**：无；后台账户查询/状态管理由独立 `identity-user-admin` Feature 承担。

## Mobile

- **Scope**：用户查看/编辑 BasicProfile、查看学习方向，以及按照最终设计处理可编辑性、校验、错误态与保存反馈。
- **Stage / Artifact**：当前没有 `account-profile` 的 Mobile Design / Execution Stage、Execution Brief、Blueprint 或 Design Report。
- **Gate / Evidence**：仓库存在通用 Mobile Foundation 工作，但没有本 Feature 的 Mobile Gate/页面 evidence；因此保持 `todo`。
- **Next Action**：Design 与 Backend Feature contract 明确后，再建立 Mobile Design Stage 和页面/状态机/API mapping。

## 集成

- **Scope**：Mobile profile surface ↔ Identity `me/profile` / `me/learning-profile` API，并在头像 `avatar_media_id` 等字段上遵守既有跨域/资产契约。
- **Stage / Artifact**：没有 `account-profile` Integration Stage 或 Integration Report。
- **Gate / Evidence**：Backend API 能力存在，但没有 Mobile 调用链、真实环境联调和 Feature 级错误映射 evidence。
- **Next Action**：Mobile 与 Backend Lane 进入可执行状态后，建立联调矩阵，覆盖资料读取、部分更新、null 清空、校验失败与学习方向只读语义。

## 验收

- **Scope**：验证用户资料字段的显示/编辑规则、学习方向产品语义、API 校验、安全边界、Mobile 状态与端到端数据一致性。
- **Stage / Artifact**：没有 `account-profile` Acceptance Stage、验收矩阵或 Feature Acceptance Report。
- **Gate / Evidence**：Identity Domain 的 Backend 测试/Gate 只能证明底层能力，不能证明本 Feature 的产品、Mobile 与集成验收已完成。
- **Next Action**：待 Design、Backend、Mobile、Integration 均有正式 evidence 后建立 Feature Acceptance Gate。