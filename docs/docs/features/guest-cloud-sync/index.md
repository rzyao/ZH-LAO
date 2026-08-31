---
feature_id: guest-cloud-sync
title: 游客云同步与注册数据迁移
portfolio_status: deferred
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

# 游客云同步与注册数据迁移

## 功能概览

本 Feature 的 canonical title 保持“游客云同步与注册数据迁移”，是否当前推进由独立的 `portfolio_status: deferred` 表达，不把“延期”写回标题或 Lane 状态。

Identity 当前允许未登录客户端携带 `installation_id`，并在注册/登录时绑定设备；但 canonical design、冻结 API 与最终审计都把服务端 `GuestDataMigration` 留在 deferred/not-supported 边界。设备绑定 **不等于** 游客云数据迁移，也没有证据表明游客学习/业务数据已在注册后自动合并到正式用户。

## 设计

- **Scope**：未来若重新激活，需要定义游客身份键、哪些数据可云端持久化/迁移、数据 Owner Domain、注册时机、幂等键、冲突/合并策略、失败重试、隐私与多设备规则；当前不提前裁决这些未冻结语义。
- **Stage / Artifact**：[Identity Flows](/domains/identity/flows) 描述游客浏览到注册/登录的边界并明确 server-side GuestDataMigration deferred；[Identity API](/development/02-identity/IDENTITY_API)、[Identity Design Audit](/development/02-identity/IDENTITY_DESIGN_AUDIT) 与 [IDN-20 Final Audit](/development/02-identity/IDN_20_FINAL_AUDIT) 均保留该 deferred 边界。Stage Registry 没有本 Feature 的 Design Stage。
- **Gate / Evidence**：没有 Guest Cloud Sync / Migration Design Gate、Execution Brief 或 Blueprint；Domain Gate PASS 明确不把 deferred 项自动纳入 V1。
- **Next Action**：保持 portfolio deferred；只有产品组合层正式重新激活后，才建立 Feature Design Stage 并冻结跨域数据所有权与迁移 contract。

## Backend

- **Scope**：当前登录链路可接收 `installation_id`、注册 Device 并创建 Session；这只建立设备归属，不执行游客云数据发现、claim、copy/merge 或 migration transaction。
- **Stage / Artifact**：真实登录/设备实现位于 `apps/backend/src/modules/identity/`，历史证据见 [Identity Implementation Report](/development/02-identity/IDENTITY_IMPLEMENTATION_REPORT) 与 [Regression Hotfix Report](/development/02-identity/IDENTITY_REGRESSION_HOTFIX_REPORT)。冻结 16 个 Identity HTTP endpoints 中没有 guest migration endpoint/use case，Stage Registry 也没有本 Feature Backend Stage。
- **Gate / Evidence**：最终审计明确 `GuestDataMigration` 为 deferred/not supported；代码与路由 Grounding 未发现迁移 use case。因此不能把 installation/device 能力误标为 `backend: done`。
- **Next Action**：portfolio 重新激活且 Design Gate 完成后，再按 Owner Domain contract 设计幂等迁移编排、事务/补偿与安全测试；此前保持 `todo`。

## Admin

- **Scope**：当前 Feature 定义不要求 Operator/Admin 管理游客迁移。
- **Stage / Artifact**：Feature Inventory 没有 Admin page 映射，也没有 Guest Migration Admin Stage。
- **Gate / Evidence**：没有正式 Admin 交付要求，本 Lane 为 `na`；不要因未来可能需要排障工具而提前制造 Admin Feature。
- **Next Action**：无；若未来设计确需人工补偿/排障，应另由正式 Stage/Feature contract 决定。

## Mobile

- **Scope**：未来可能负责游客本地身份/数据标识、注册时提交迁移所需 token/identifier、迁移状态与失败恢复；当前不等同于现有游客浏览或 Login 的 `installation_id` 采集。
- **Stage / Artifact**：没有 `guest-cloud-sync` Mobile Design / Execution Stage、Execution Brief、Blueprint 或实现报告。
- **Gate / Evidence**：现有 Mobile Foundation/Login Design 不能证明游客云同步或注册迁移已设计/实施；Feature portfolio 仍为 deferred。
- **Next Action**：仅在 Feature 重新激活并完成 Design/Backend contract 后建立 Mobile Stage；此前保持 `todo`。

## 集成

- **Scope**：未来需要协调 Identity 注册事务与真正拥有游客业务数据的 Domain，定义 claim/merge 的 public contract、幂等、部分失败、重试及观测性；不能由 Identity 直接跨 schema 拼接其它 Domain 数据。
- **Stage / Artifact**：当前没有 Guest Migration Integration Stage/Report，也没有已冻结的跨域 migration contract。
- **Gate / Evidence**：Identity canonical boundary 只覆盖身份、Device/Session 与注册事件；没有证据显示 Learning/Social/其它 Domain 已接入游客迁移协议。
- **Next Action**：重新激活后先确认实际游客数据 Owner 与迁移需求，再建立跨域 Integration Stage；不要在 deferred 状态下预造接口。

## 验收

- **Scope**：未来验收至少需要覆盖首次注册迁移、重复提交幂等、多设备/冲突、部分失败与重试、无数据丢失/串户、权限与隐私，以及迁移完成后的正式用户可见性。
- **Stage / Artifact**：没有 `guest-cloud-sync` Acceptance Stage、验收矩阵或 Acceptance Report。
- **Gate / Evidence**：Feature 尚处 portfolio deferred，且 Design/Backend/Mobile/Integration 都未进入正式交付，因此不存在 Acceptance Gate PASS 证据。
- **Next Action**：保持 `todo`；只有 portfolio 重新激活并且前置 Lane 具备真实 artifacts/evidence 后，才建立 Feature Acceptance Gate。