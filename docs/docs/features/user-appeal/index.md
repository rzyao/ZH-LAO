---
feature_id: user-appeal
title: 用户申诉
portfolio_status: active
domain:
  - trust
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
---

# 用户申诉

## 功能概览

Portfolio Status：`active`。

用户针对符合申诉条件的治理决定/处罚发起复核请求，canonical 事实写入 `trust.appeals`。数据库关系以 `appeal.decision_id` 指向 immutable Moderation Decision；申诉不会重写原 Decision，也不会直接修改原 Enforcement Action。申诉获准后的处罚调整必须通过 Enforcement 生命周期保留审计链。

本 Feature 只负责用户侧 **Appeal 提交与状态消费**；运营复核属于 `appeal-review` Feature。

## 设计

状态：todo

范围：定义申诉资格、提交 reason、用户身份、一个 Decision/用户的 V1 唯一申诉约束，以及用户可见的申诉生命周期；必须区分 Appeal 与原 Report / Case / Evidence / Decision / Enforcement。

执行阶段与产物：仓库没有本 Feature 独立 Design Stage / Brief；设计输入已冻结在 [Trust & Safety](/domains/trust/)、[Moderation](/domains/trust/moderation)、[Contracts](/domains/trust/contracts) 和 [Trust 数据库](/domains/trust/database)。

Gate / 完成证据：`database/migrations/1100_trust.sql` 已落地 `trust.appeals`、Decision FK、appellant logical UUID、状态机与唯一约束，数据库 baseline PASS；但没有“用户申诉”Feature 级 Design Gate，因此保持 `todo`。

下一步：建立本 Feature Design Stage，在既有 canonical 模型上冻结“哪些 Decision/Enforcement 可申诉”、提交/撤回/查询契约、错误码与用户可见状态，不改变 immutable Decision 规则。

## Backend

状态：todo

范围：实现 Appeal 提交、资格校验、查询/撤回等用户侧 Application Service；写入 `trust.appeals`，不通过申诉接口直接更新 Moderation Decision 或处罚目标 Domain。

执行阶段与产物：[后端开发](/development/backend/) 没有 Trust Backend 任务目录，`apps/backend` 没有 Appeal API/Service/Repository；现有 migration 只提供数据层前置事实。

Gate / 完成证据：数据库 baseline 验证 Appeal 表、FK 与生命周期约束，但没有鉴权、资格判断、重复申诉处理、API tests 或 Backend Gate。

下一步：创建 Appeal Backend Brief，明确 Identity user logical UUID 鉴权、Decision/处罚资格查询、唯一冲突与撤回语义，实现 Service/API/Repository 与测试。

## Admin

状态：na

范围：用户申诉“提交”不是 Admin 操作；运营人员领取、审阅、裁决 Appeal 属于 `appeal-review` Feature。

执行阶段与产物：[后台开发](/development/admin/) 没有本 Feature 独立 Admin 页面。

Gate / 完成证据：不适用；不能在用户申诉 Feature 内复制一套后台 Appeal 事实。

下一步：无；后台复核进入 `appeal-review` Feature。

## Mobile

状态：todo

范围：提供申诉入口、理由输入、提交结果与状态展示，并清楚区分“已提交/审核中/已解决/已撤回”与处罚实际是否已经变更。

执行阶段与产物：[Mobile 页面清单](/mobile/pages) 当前没有申诉页面，`mobile_pages` 为空；现有 Mobile screens/features 中也没有 Appeal 实现。

Gate / 完成证据：没有 Mobile page contract、实现或测试 Gate；数据库 Appeal 状态存在不代表用户侧流程已完成。

下一步：Backend 合同稳定后建立申诉 Mobile 页面契约，覆盖资格不可用、重复申诉、提交失败、状态查询与撤回反馈。

## 集成

状态：todo

范围：连接 Identity 登录用户与 Trust Appeal API，并把申诉处理结果与 Enforcement correction 保持解耦：Appeal resolution 是复核结果，真正处罚调整仍由 Enforcement Action 历史表达。

执行阶段与产物：当前只有 [Trust Contracts](/domains/trust/contracts) 与 Appeal/Enforcement 数据关系，没有用户端 ↔ Trust Backend Integration Stage。

Gate / 完成证据：没有 Identity auth + Appeal API + Mobile 的真实联调，也没有 granted appeal 后 Enforcement correction 的端到端证据。

下一步：完成 Backend/Mobile 后增加集成测试，验证 appellant 身份、Decision 归属/资格、Appeal 状态与后续 Enforcement 调整边界。

## 验收

状态：todo

范围：验收用户从可申诉对象进入、提交/撤回/查看状态的完整路径，并验证原 Decision 保持 immutable、获准申诉通过新的 Enforcement 生命周期纠正而非覆盖历史。

执行阶段与产物：仓库没有本 Feature Acceptance Stage / Report。

Gate / 完成证据：没有 Appeal 用户流 E2E 或最终验收 Gate。

下一步：覆盖合法/无资格/重复申诉、并发、撤回、审核中不可非法变更、结果展示及 granted 后处罚纠正链路的 E2E。
