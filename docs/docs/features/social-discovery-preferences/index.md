---
feature_id: social-discovery-preferences
title: 发现偏好设置
portfolio_status: active
domain:
- social
- identity
mobile_pages: []
admin_pages: []
delivery_notes:
- 已冻结的数据模型与业务边界见本页设计 实际 Stage / Gate；公共应用 Contract 与正式 Social Design Gate 仍在收口。
---

# 发现偏好设置

## 功能概览

Portfolio Status：`active`。

本 Feature 负责用户维护普通 Discovery 的硬筛选偏好。偏好是 Social Profile 自有事实，不写入 Identity；当前 V1 只冻结年龄、性别、国家和关系目标，距离不是本 Feature 已决条件，另由 `social-distance` 独立承载未决状态。
