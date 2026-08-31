---
feature_id: moderation-workbench
title: 审核案件 / 证据 / 决定工作台
portfolio_status: active
domain:
  - trust
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
---

# 审核案件 / 证据 / 决定工作台

## 功能概览

Portfolio Status：`active`。

本 Feature 面向运营审核人员处理 `Moderation Case`，查看/追加 `Evidence`，并形成唯一的 `Decision`。它不重新定义用户举报事实：用户举报始终来自 `trust.reports`；也不把 Decision 直接当成最终处罚执行或 Owner Domain 当前状态。

治理事实边界：`Report → Moderation Case → Evidence → Decision`。处罚执行进入 `Enforcement Action`，申诉进入 `Appeal`。

## 设计

状态：todo

范围：定义审核队列、案件领取/开始审核、证据查看与补充、最终决定记录等工作台语义；必须保持 Report、Case、Evidence、Decision 四类事实分离，Decision 不覆盖原 Report 或 Evidence。

执行阶段与产物：仓库没有本 Feature 独立 Design Stage / Brief；设计输入已冻结在 [Trust & Safety](/domains/trust/)、[Moderation](/domains/trust/moderation)、[Contracts](/domains/trust/contracts) 和 [Trust 数据库](/domains/trust/database)。

Gate / 完成证据：`1100_trust.sql` 已落地 `trust.moderation_cases` 与 `trust.moderation_decisions`，`1210_trust_evidence.sql` 已落地 `trust.moderation_evidence`；数据库 baseline PASS。但没有“审核工作台”Feature 级 Design Gate，故本 Lane 保持 `todo`。

下一步：建立工作台 Feature Design Stage，基于既有 canonical 状态机冻结列表/详情/领取、Evidence 展示与添加、Decision 提交的页面与 Public API 契约，不改变已冻结事实模型。

## Backend

状态：todo

范围：提供 Case 队列与详情、审核开始/分配、Evidence 读取与受控追加、Decision 提交等 Application Service；一个 user Report V1 最多对应一个 Case，一个 Case 最多一个 immutable Decision。

执行阶段与产物：[后端开发](/development/backend/) 没有 Trust Backend 目录，`apps/backend` 没有 Trust Application/API 实现；现有三张相关表仅是数据库前置实现。

Gate / 完成证据：数据库 migration 与 baseline 已验证 Case/Evidence/Decision 约束，但仓库没有 Trust Backend Brief、实现报告、API tests 或 Backend Gate。

下一步：建立 Trust Backend 任务，实现案件查询/状态转换、Evidence 权限与不可变快照规则、Decision 原子提交及测试，并显式接入 Operations operator logical UUID。

## Admin

状态：todo

范围：实现运营审核工作台，包括案件队列、优先级/状态、审核人、证据上下文、Decision 表单，以及 Loading / Empty / Error / Retry、权限与审计反馈。

执行阶段与产物：[后台开发](/development/admin/) 当前没有 Trust/Moderation 工作台任务；`apps/admin/src` 中也不存在 moderation 或 appeal 页面/路由，`admin_pages` 为空。

Gate / 完成证据：没有 Admin 页面 contract、实现、E2E 或 Gate。Operations 的认证/RBAC 基础能力不能被当成本工作台已完成证据。

下一步：待 Trust Backend Public Contract 可消费后，创建 Moderation Admin Design/Execution Brief，定义权限、路由、操作确认与 audit 行为，再进入实现。

## Mobile

状态：na

范围：Moderation Case / Evidence / Decision 是运营审核能力，不由用户 Mobile 客户端执行。

执行阶段与产物：无 Mobile 页面；用户侧举报与申诉分别由 `user-reporting`、`user-appeal` Feature 承担。

Gate / 完成证据：不适用；不得为了展示审核内部事实而在 Mobile 复制案件工作台。

下一步：无。

## 集成

状态：todo

范围：连接 Trust 审核服务、Operations operator 身份/权限以及 Evidence 所需的 Asset logical UUID；被审核对象只通过 canonical subject 三元组引用 Owner Domain，不建立跨域物理 FK。

执行阶段与产物：当前只有 [Trust Contracts](/domains/trust/contracts)、数据库 logical UUID / FK 约束与 `infrastructure.assets` 前置事实；没有工作台跨层 Integration Stage。

Gate / 完成证据：`1210_trust_evidence.sql` 已确认媒体证据只保存 `asset_id`，物理存储事实归 Infrastructure；但没有 Admin ↔ Backend 联调、权限或 Evidence 读取/添加集成测试。

下一步：Backend 与 Admin 就绪后完成 operator auth/RBAC、Evidence asset 读取、Case 状态转换和 Decision 提交联调，并验证跨域 owner 数据不被 Trust 直接写入。

## 验收

状态：todo

范围：验收从待审 Case 到 Evidence 审阅、Decision 形成的完整运营路径，验证 Report 不可被工作台改写、Evidence 保留审计价值、Decision 唯一且与 Enforcement 分离。

执行阶段与产物：仓库没有该工作台 Acceptance Report / Gate；数据库 baseline 仅验证结构约束。

Gate / 完成证据：没有工作台 E2E、RBAC、并发领取/状态转换或 Decision 提交验收证据。

下一步：实现后覆盖 queue → in_review → resolved、Evidence 各类型、非法状态转换、权限拒绝、Decision 唯一性以及失败重试的 E2E 验收。
