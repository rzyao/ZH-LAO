---
feature_id: appeal-review
title: 申诉复核后台
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

# 申诉复核后台

## 功能概览

Portfolio Status：`active`。

本 Feature 面向运营复核人员处理 `trust.appeals`：领取申诉、查看原 Case / Evidence / Decision 与申诉补充 Evidence，形成 Appeal resolution。原 Moderation Decision 保持 immutable；若申诉改变处罚结果，应通过 Enforcement Action 的撤销/替代链保留历史，而不是覆盖原 Decision 或原处罚事实。

## 设计

状态：todo

范围：定义 Appeal 队列、领取/开始复核、原治理上下文与申诉 Evidence 展示、resolution 提交和复核审计；必须区分 Appeal resolution、Moderation Decision 与 Enforcement correction。

执行阶段与产物：仓库没有本 Feature 独立 Design Stage / Brief；设计输入已冻结在 [Trust & Safety](/domains/trust/)、[Moderation](/domains/trust/moderation)、[Contracts](/domains/trust/contracts) 和 [Trust 数据库](/domains/trust/database)。

Gate / 完成证据：`1100_trust.sql` 已落地 `trust.appeals` 与 `trust.enforcement_actions.appeal_id`，`1210_trust_evidence.sql` 允许 Evidence 关联 `appeal_id`；数据库 baseline PASS。但不存在本 Feature Design Gate，故保持 `todo`。

下一步：建立 Appeal Review Feature Design Stage，冻结队列/详情/领取、Evidence、resolution 与 Enforcement correction 的页面/API 工作流，不重写 canonical 历史事实。

## Backend

状态：todo

范围：实现 Appeal 审核队列、reviewer 领取、Evidence 读取/追加、resolution 提交及必要的 Enforcement correction command；原 Decision 只读，复核结果不得通过 UPDATE 改写 Decision。

执行阶段与产物：[后端开发](/development/backend/) 没有 Trust Backend 目录，`apps/backend` 没有 Appeal Review Service/API；数据库只提供 Appeal/Evidence/Enforcement 的结构与约束。

Gate / 完成证据：没有 reviewer 权限、状态转换、resolution 原子提交、处罚纠正 orchestration 的实现报告、测试或 Backend Gate。

下一步：建立 Trust Appeal Review Backend Brief，实现 `submitted → under_review → resolved` / withdrawn 合法转换、operator logical UUID、Evidence 与 correction command，并补并发/权限/失败测试。

## Admin

状态：todo

范围：实现申诉队列与详情工作台，展示原 Case / Evidence / Decision / Enforcement 历史、申诉理由与补充证据，并提供受权限控制的 resolution 操作和清晰的 mutation/audit 反馈。

执行阶段与产物：[后台开发](/development/admin/) 没有 Appeal Review Admin 任务；`apps/admin/src` 中未发现 appeal 页面/路由，`admin_pages` 为空。

Gate / 完成证据：没有页面 contract、权限映射、实现、E2E 或 Admin Gate；Operations Foundation/RBAC 只能作为未来依赖，不是本工作台完成证据。

下一步：Backend Public Contract 明确后创建 Appeal Review Admin Design/Execution Brief，冻结权限、队列筛选、详情信息架构、resolution 确认与 audit 展示，再实施。

## Mobile

状态：na

范围：本 Feature 是运营复核后台；用户端提交和查看申诉属于 `user-appeal` Feature。

执行阶段与产物：无 Mobile 页面或路由。

Gate / 完成证据：不适用。

下一步：无。

## 集成

状态：todo

范围：连接 Operations operator 身份/RBAC、Trust Appeal/Evidence/Decision/Enforcement API 与必要的 Owner Domain 处罚纠正链；Appeal resolution 本身不等于 Owner Domain 已恢复状态。

执行阶段与产物：当前有 [Trust Contracts](/domains/trust/contracts) 与数据库审计链，但没有 Admin ↔ Backend ↔ Enforcement/Owner Domain 的 Integration Stage。

Gate / 完成证据：没有 reviewer auth/RBAC 联调，没有 granted/partially_granted 后 Enforcement correction 的真实 producer/consumer 证据，也没有跨层 integration tests。

下一步：Backend/Admin 就绪后联调 operator 权限、Evidence asset、resolution 原子提交与 Enforcement correction，并验证失败时原 Decision/Appeal/Action 历史仍可审计。

## 验收

状态：todo

范围：验收从 submitted Appeal 到 under_review/resolved 的后台全流程，覆盖 Evidence、Decision 只读、resolution 与后续处罚纠正，并验证 denied/partially_granted/granted 的差异。

执行阶段与产物：仓库没有 Appeal Review Acceptance Report / Gate。

Gate / 完成证据：没有后台 E2E、权限、并发领取、非法状态转换或处罚纠正验收证据。

下一步：实现后覆盖队列领取、重复领取、Evidence、各 resolution、权限拒绝、失败恢复，以及 granted/partially_granted 后 Enforcement 历史链的端到端验收。
