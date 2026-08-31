---
feature_id: enforcement-management
title: 平台处罚与能力限制
portfolio_status: active
domain:
  - trust
  - operations
  - identity
  - social
  - chat
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

# 平台处罚与能力限制

## 功能概览

Portfolio Status：`active`。

本 Feature 管理 canonical `Enforcement Action`：它必须由 Trust 的 Moderation Decision 派生并保留生命周期历史。`Enforcement Action` 是“平台处罚事实”，**不等于** Identity / Social / Chat 等 Owner Domain 已经完成实际状态变更；Owner Domain 只能通过公开契约/共享 Outbox 消费处罚结果后更新自己的事实。

Report、Case、Evidence、Decision 与 Appeal 均不是本 Feature 的替代数据模型。

## 设计

状态：todo

范围：定义 warning、内容限制/移除、社交/聊天能力限制、账户暂停/封禁等处罚动作及 `pending / applied / expired / revoked / cancelled / failed` 生命周期；处罚调整保留历史，不覆盖原 Decision。

执行阶段与产物：仓库没有本 Feature 独立 Design Stage / Brief；设计输入已冻结在 [Trust & Safety](/domains/trust/)、[Moderation](/domains/trust/moderation)、[Contracts](/domains/trust/contracts) 与 [Trust 数据库](/domains/trust/database)。

Gate / 完成证据：`database/migrations/1100_trust.sql` 已创建 `trust.enforcement_actions` 并冻结 target、lifecycle 与 Decision/Appeal FK；数据库 baseline PASS。但没有本 Feature 的 Design Gate，故保持 `todo`。

下一步：建立 Enforcement Feature Design Stage，在不改 canonical 表模型的前提下冻结创建/应用/过期/撤销/失败的 Application Contract、Owner Domain 执行回执与错误处理。

## Backend

状态：todo

范围：实现从 immutable Decision 创建 Enforcement Action、推进处罚生命周期、发布跨域执行事件并记录失败/结束原因；不得从 Trust Repository 直接更新 Identity / Social / Chat schema。

执行阶段与产物：[后端开发](/development/backend/) 当前没有 Trust Backend 目录，`apps/backend` 没有 Enforcement Service/API/worker；数据库已有 `trust.enforcement_actions`，共享 `infrastructure.system_outbox_events` 也已有物理基线。

Gate / 完成证据：数据库 baseline 验证了 Enforcement 表与共享 Outbox，但没有处罚 Application Service、事件发布/消费、重试、回执或 Backend tests/Gate。

下一步：创建 Trust Enforcement Backend Brief，落地 Decision → Action、共享 Outbox 发布、生命周期推进、幂等/失败处理与测试；Owner Domain 的实际变更必须经各自 Application Service。

## Admin

状态：todo

范围：为有权限的运营人员提供处罚详情、状态、有效期、失败原因与必要的受控撤销/调整入口；任何操作都必须可审计，不能直接编辑 Owner Domain 当前状态。

执行阶段与产物：[后台开发](/development/admin/) 没有 Enforcement Admin 任务，`apps/admin/src` 也没有处罚管理页面/路由，`admin_pages` 为空。

Gate / 完成证据：Operations 的 RBAC/审计基础并不等于 Enforcement Admin 已实现；当前没有页面 contract、实现测试或 Admin Gate。

下一步：Backend Public Contract 稳定后建立 Enforcement Admin 设计与执行任务，明确权限、危险操作确认、Mutation feedback 与 operator audit，再实现页面。

## Mobile

状态：na

范围：处罚创建、管理与生命周期操作属于 Trust/Operations 管理能力，不由用户 Mobile 直接执行。

执行阶段与产物：无对应 Mobile 页面；用户端若未来展示限制结果，应由具体 Owner Domain 的产品 Feature 定义，不在本 Feature 建立处罚管理 UI。

Gate / 完成证据：不适用。

下一步：无。

## 集成

状态：todo

范围：实现 `Trust Decision/Enforcement → Public Contract / infrastructure.system_outbox_events → Owner Domain Application Service / State Machine`；Action 状态与 Owner Domain 状态必须保持两个事实层次。

执行阶段与产物：[Trust Contracts](/domains/trust/contracts) 已冻结跨域边界，共享 Outbox 物理基线已存在；当前没有 Enforcement 跨域 Integration Stage 或消费者实现。

Gate / 完成证据：数据库层可证明没有非法跨域 FK，但不能证明处罚已经在 Identity / Social / Chat 生效；仓库没有真实 producer/consumer 联调或回执测试。

下一步：实现并测试各类 Action 的发布、Owner Domain 幂等消费、失败/重试与结果确认；禁止以“`trust.enforcement_actions.status=applied`”单独推断远端状态已改变。

## 验收

状态：todo

范围：验收 Decision → Enforcement Action → Owner Domain 实际执行的完整链路，以及 expiry/revoke/failure/appeal correction 的历史可追溯性。

执行阶段与产物：没有该 Feature 的 Acceptance Report / Gate；现有 database baseline 只覆盖结构与约束。

Gate / 完成证据：没有跨域 E2E 证明 Action 与 Owner Domain 实际状态一致，也没有失败恢复与重复事件验收证据。

下一步：完成 Backend/Admin/Integration 后覆盖各 action_type、定时过期、撤销/失败、重复事件、Owner Domain 幂等与审计链 E2E，并验证不重写原 Decision/Action 历史。
