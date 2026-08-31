---
feature_id: social-discovery-preferences
title: 发现偏好设置
portfolio_status: active
domain:
  - social
  - identity
status:
  design: active
  backend: todo
  admin: na
  mobile: todo
  integration: todo
  acceptance: todo
mobile_pages: []
admin_pages: []
---

# 发现偏好设置

## 功能概览

Portfolio Status：`active`。

本 Feature 负责用户维护普通 Discovery 的硬筛选偏好。偏好是 Social Profile 自有事实，不写入 Identity；当前 V1 只冻结年龄、性别、国家和关系目标，距离不是本 Feature 已决条件，另由 `social-distance` 独立承载未决状态。

## 设计

状态：active

### 范围

- `social_preferences` 与 Profile 逻辑 1:1，保存可空 `min_age / max_age`。
- 性别、国家、目标分别使用 `social_preference_genders`、`social_preference_countries`、`social_preference_goals` 正规化多选关系。
- 某一多选子表零记录表示该维度“不限”，不使用 `all / any` 伪值。
- Discovery 必须同时满足 A 接受 B、B 接受 A；Preference 负责硬筛除，不保存算法权重、score 或推荐模型事实。
- V1 产品只暴露有限筛选：性别、年龄、国家、目标。距离 / 模糊距离不从当前 `country_code/region/city` 自行推导，保持在 `social-distance` 的待裁决范围。

### Stage / 工件 / Gate

已完成的设计资产：

- [Social 偏好、发现与关系](/domains/social/discovery-and-relationships)：偏好表、双向硬条件与 V1 筛选维度。
- [ADR-010](/adr/ADR-010-social-profile-discovery-and-relationships)：实时 Discovery 与正规化偏好的决策。
- [Social 数据库](/domains/social/database)：Preference / Exposure 表组及完整性边界。
- `database/v2/migrations/0700_social.sql` 已落 `social_preferences` 与三个多选偏好表。

当前 Gate 事实：正式 `SOCIAL-DESIGN` 仍未通过工作流 Gate，仓库没有 Preference Feature 的公共应用 Contract / Design Gate PASS。因此本 Lane 为 `active`。

### 已完成 / 当前进行

已完成：V1 偏好维度、数据库事实、双向硬筛选语义已经 frozen。

当前进行：设置/读取 Preference 的应用 Use Case、公共 Contract、校验/鉴权细节与正式 Gate 未收口。

### 下一步

完成 Preference 应用 Contract 和 Design Gate；距离需求继续留在 `social-distance`，不得在本 Feature 顺手裁决。

## Backend

状态：todo

### 范围

未来 Backend 实现偏好的读写与 Discovery 使用，不在本页提前设计路由、错误码或把 distance contract 混入已冻结 V1 Preference。

### Stage / 工件 / Gate

目前只有 `0700_social.sql` 物理表；`apps/backend/src` 无 Social module，Workflow Registry 的 `SOCIAL-BACKEND` 为 `todo`，无 F10 Preference Backend Gate。

### 下一步

Social Design Gate PASS 后进入真实 Backend 实现与验证。

## Admin

状态：na

### 原因

发现偏好由用户本人设置，不需要独立 Admin 交付面；运营可配置推荐策略若未来存在，应由 Platform/Admin 对应 Feature 证明，而不是在本页补造后台。

## Mobile

状态：todo

### 范围

未来 Mobile 提供年龄、性别、国家、目标偏好设置；不在距离裁决前加入距离 UI。

### Stage / 工件 / Gate

`mobile_pages` 为空，无 Preference Mobile Stage / Report / Gate。

### 下一步

公共 Contract 稳定后创建真实偏好设置页面并接入 Backend。

## 集成

状态：todo

### 范围

后续验证 Preference 写入与 Discovery 双向硬筛选之间的真实契约。

### Stage / 工件 / Gate

当前没有 Backend / Mobile 实现或 Integration Gate。

### 下一步

待两端实现后启动联调，确保零记录“不限”等 canonical 语义未发生漂移。

## 验收

状态：todo

### 范围

最终验证偏好保存、读取、双向筛选、不限维度和边界值等端到端行为。

### Stage / 工件 / Gate

当前无 F10 Preference E2E / Acceptance Gate。

### 下一步

真实集成完成后补验收场景与 Gate。
