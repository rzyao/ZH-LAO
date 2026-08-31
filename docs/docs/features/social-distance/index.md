---
feature_id: social-distance
title: 距离筛选与模糊距离展示
portfolio_status: pending_decision
domain:
  - social
  - identity
status:
  design: blocked
  backend: blocked
  admin: na
  mobile: blocked
  integration: blocked
  acceptance: blocked
mobile_pages: []
admin_pages: []
blocks:
  design: SOCIAL_LOCATION_SCOPE_DECISION
  backend: SOCIAL_LOCATION_SCOPE_DECISION
  mobile: SOCIAL_LOCATION_SCOPE_DECISION
  integration: SOCIAL_LOCATION_SCOPE_DECISION
  acceptance: SOCIAL_LOCATION_SCOPE_DECISION
---

# 距离筛选与模糊距离展示

## 功能概览

Portfolio Status：`pending_decision`。

本 Feature 保留当前正式清单中的“距离筛选与模糊距离展示”需求，但不代表该能力已获准进入实现。现有 Social canonical location 只有 `country_code / region / city` 粗粒度位置，并明确首期不引入经纬度 / PostGIS；因此仓库当前没有足以支撑真实距离计算或模糊距离展示的 canonical 数据契约。

NEEDS_DECISION：`SOCIAL_LOCATION_SCOPE_DECISION`。本文档只记录这一阻塞，不裁决是否上线、不发明坐标来源、精度、隐私规则或距离算法。

## 设计

状态：blocked

### 范围

需要先裁决“距离筛选与模糊距离展示”是否进入当前产品组合，以及进入后应由哪套 location contract 支撑。当前 frozen Social Profile 只能表达国家/地区/城市，不能把这些字段伪装成精确距离事实。

### Stage / 工件 / Gate

已完成的相关资产：

- [Social 资料与展示内容](/domains/social/profile)：冻结 `country_code / region / city` 为首期粗粒度位置，并明确“不引入经纬度/PostGIS”。
- [Social 偏好、发现与关系](/domains/social/discovery-and-relationships)：V1 硬筛选仅包含性别、年龄、国家、目标；普通 Discovery 的实时候选语义已冻结。
- [ADR-010](/adr/ADR-010-social-profile-discovery-and-relationships)：冻结当前 Profile / Preference / Discovery 基线。
- `database/migrations/0700_social.sql` 只落粗粒度 Profile location，没有 latitude / longitude / geography 字段。

Gate / 阻塞证据：本 Feature 当前 frontmatter 的 Portfolio 为 `pending_decision`，五个执行 Lane 均被 `SOCIAL_LOCATION_SCOPE_DECISION` 阻塞；当前 `main` 没有完成该裁决的 canonical 产物，也没有 Distance Design Gate PASS。

### 已完成 / 当前阻塞

已完成：普通 Discovery 和粗粒度 location 的现行边界清楚，且不存在“已实现精确距离”的误导性数据模型。

阻塞对象：`SOCIAL_LOCATION_SCOPE_DECISION`。

等待条件：裁决该 Feature 是否进入当前范围；如进入，必须先把真实 location ownership、可用数据、公开粒度与计算 Contract 写回 canonical 设计并形成可审计 Gate。

### 下一步

仅在 `SOCIAL_LOCATION_SCOPE_DECISION` 被正式解决后重新评估 Design Lane；未裁决前不扩 Social canonical schema。

## Backend

状态：blocked

### 范围

Backend 目前不能实现真实距离筛选/模糊距离，因为没有已裁决 location / distance Contract。不得使用 `country_code / region / city` 推导伪精确距离，也不得在 Feature 文档中预设坐标字段或地理数据库方案。

### Stage / 工件 / Gate

`apps/backend/src` 当前没有 Social module；更关键的是 `SOCIAL_LOCATION_SCOPE_DECISION` 尚未解决，所以不存在可执行的 Distance Backend Stage / Contract / Gate。

Gate / 阻塞证据：`SOCIAL_LOCATION_SCOPE_DECISION`；无 Backend PASS 证据。

### 已完成 / 当前阻塞

已完成：确认现有 `0700_social.sql` 不含真实距离所需的坐标事实。

等待条件：Design decision + canonical location/distance Contract。

### 下一步

裁决通过且 Design Gate 完成后，再创建 Backend Stage；若裁决不进入当前产品组合，则按正式 Portfolio 决策调整，而不是本页自行改状态。

## Admin

状态：na

### 原因

当前待裁决能力是用户侧距离筛选/展示，不存在需要由本 Feature 交付的 Admin 页面。若未来出现位置策略运营配置，需由对应 Platform/Admin Feature 单独证明。

## Mobile

状态：blocked

### 范围

Mobile 不能在产品范围和 distance Contract 未定时提前设计距离筛选控件、距离文案或位置权限流程。

### Stage / 工件 / Gate

`mobile_pages` 为空，没有 Distance Mobile Stage / Artifact / Gate；`SOCIAL_LOCATION_SCOPE_DECISION` 是当前阻塞对象。

### 已完成 / 当前阻塞

已完成：普通 Discovery 的非距离基线可独立推进。

等待条件：明确该能力是否进入产品组合，以及可供 Mobile 消费的正式距离/模糊展示 Contract。

### 下一步

裁决后再创建真实 Mobile Stage；未裁决前不补造页面或权限事实。

## 集成

状态：blocked

### 范围

真实集成至少需要可运行的 location source、Social distance Contract、Backend 与 Mobile；这些前置尚未被 canonical 裁决。

### Stage / 工件 / Gate

当前只有普通 Discovery / Profile 的 frozen design，没有 Distance Integration Artifact / Gate。

Gate / 阻塞证据：`SOCIAL_LOCATION_SCOPE_DECISION`。

### 已完成 / 当前阻塞

已完成：明确现有粗粒度 location 不构成距离集成事实。

等待条件：设计裁决及 Backend/Mobile 实现完成。

### 下一步

裁决并实现后再启动跨端/跨域联调。

## 验收

状态：blocked

### 范围

在产品语义、数据来源和模糊展示 Contract 未定前，无法定义可信的距离 E2E 验收标准；本页不自行发明阈值或精度。

### Stage / 工件 / Gate

当前无 Distance Acceptance Scenario / Report / Gate。

Gate / 阻塞证据：`SOCIAL_LOCATION_SCOPE_DECISION`。

### 已完成 / 当前阻塞

已完成：识别出现行 canonical 数据能力与 Feature 名称之间的决策缺口。

等待条件：正式范围裁决、可运行实现和集成结果。

### 下一步

仅在前置条件满足后建立验收矩阵并由真实 Gate 判定结果。
