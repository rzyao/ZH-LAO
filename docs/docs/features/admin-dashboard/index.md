---
feature_id: admin-dashboard
title: 后台数据总览
portfolio_status: deferred
domain: []
status:
  design: todo
  backend: todo
  admin: todo
  mobile: na
  integration: na
  acceptance: na
mobile_pages: []
admin_pages: []
---

# 后台数据总览

## 功能概览

Portfolio Status：`deferred`。

`admin-dashboard` 是当前正式 Feature 清单中的功能。Feature Inventory 将其归入 Admin Foundation，当前只声明 Admin 交付 surface；Portfolio 仍为 `deferred`。

## 设计

状态：todo

范围：当前只确认“后台数据总览”这一正式 Feature；尚未形成该 Feature 的指标口径、数据来源或展示范围设计，本页不在延期状态下自行补定义。

Stage / 工件 / Gate：未发现 `admin-dashboard` 专属 Design Stage、Design Brief、Blueprint 或 Gate。[Admin Foundation Report](../../development/ADMIN_FOUNDATION_REPORT.md) 只证明后台工程 Foundation 已就绪，并明确 Overview 仅展示平台信息、没有假 KPI。

下一步：待 Portfolio 解除延期后先进入 Feature Design Stage，冻结真实数据口径与边界；当前保持 `todo`。

## Backend

状态：todo

范围：当前没有 `admin-dashboard` 专属 Backend 查询、聚合 API 或业务实现证据。

Stage / 工件 / Gate：[Application Foundation Report](../../development/01-foundation/APPLICATION_FOUNDATION_REPORT.md) 明确 Foundation 未实现任何业务 Domain；[Admin Foundation Report](../../development/ADMIN_FOUNDATION_REPORT.md) 也记录真实 Domain API 为 0。未发现本 Feature 的 Backend Execution Brief、Implementation Report 或 Gate。

下一步：设计冻结后再创建 Backend Stage 与真实 Contract；当前保持 `todo`。

## Admin

状态：todo

范围：Admin Foundation 已存在 Overview 页面与 AppShell，但报告明确该 Overview 仅展示平台信息、无假 KPI，且 Business Domain pages implemented = 0，因此不能把 Foundation Overview 计作“后台数据总览”Feature 已交付。

Stage / 工件 / Gate：[Admin Foundation Report](../../development/ADMIN_FOUNDATION_REPORT.md) 的 `ADMIN_FOUNDATION_GATE = PASS` 仅证明后台基础设施完成；未发现 `admin-dashboard` 专属 Admin Stage、Execution Brief、Implementation Report、Test Report 或 Gate。

下一步：Portfolio 解除延期且设计/Backend 契约就绪后，再在现有 Admin Foundation 上实现真实数据总览；当前保持 `todo`。

## Mobile

状态：na

范围：当前 Feature Inventory 只声明 Admin surface，未声明 Mobile；后台数据总览不在本 Feature 的 Mobile 交付范围内。

Stage / 工件 / Gate：不适用；未发现也无需创建当前 Mobile Stage / Gate。

下一步：无。仅在 canonical Feature Inventory 后续增加 Mobile surface 时重新启用。

## 集成

状态：na

范围：当前 Feature Inventory 未声明独立 Integration surface，本 Feature 不维护单独集成 Lane。

Stage / 工件 / Gate：不适用；当前没有本 Feature 的 Integration Stage / Gate。

下一步：无。若 canonical scope 后续增加 Integration surface，再由正式 Stage 承载。

## 验收

状态：na

范围：当前 Feature Inventory 未声明独立 Acceptance surface，因此本页不创建与 Inventory 冲突的验收 Lane 工作项。

Stage / 工件 / Gate：不适用；`ADMIN_FOUNDATION_GATE = PASS` 只属于 Foundation，不是 `admin-dashboard` Feature Gate。

下一步：无。若 canonical Inventory 后续加入 Acceptance surface，再维护对应验收工件与 Gate。
