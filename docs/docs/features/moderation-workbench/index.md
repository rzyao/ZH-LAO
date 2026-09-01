---
feature_id: moderation-workbench
title: 审核案件 / 证据 / 决定工作台
portfolio_status: active
domain:
- trust
- operations
mobile_pages: []
admin_pages: []
---

# 审核案件 / 证据 / 决定工作台

## 功能概览

Portfolio Status：`active`。

本 Feature 面向运营审核人员处理 `Moderation Case`，查看/追加 `Evidence`，并形成唯一的 `Decision`。它不重新定义用户举报事实：用户举报始终来自 `trust.reports`；也不把 Decision 直接当成最终处罚执行或 Owner Domain 当前状态。

治理事实边界：`Report → Moderation Case → Evidence → Decision`。处罚执行进入 `Enforcement Action`，申诉进入 `Appeal`。
