---
feature_id: social-discovery
title: 发现、筛选与推荐
portfolio_status: active
domain:
  - social
  - identity
  - trust
  - platform
status:
  design: active
  backend: todo
  admin: na
  mobile: todo
  integration: todo
  acceptance: todo
mobile_pages: []
admin_pages: []
active_notes:
  design: "已冻结的数据模型与业务边界见本页设计 Lane；公共应用 Contract 与正式 Social Design Gate 仍在收口。"
---

# 发现、筛选与推荐

## 功能概览

Portfolio Status：`active`。

本 Feature 负责从当前事实实时计算普通 Discovery 候选并记录真实 Exposure。它不创建永久 Candidate、score、rank 或模型真相；Trust 治理结果只作为资格过滤输入，平台处罚仍属于 Trust。

## 设计

状态：active

### 范围

- 候选实时从 Profile、Preference、Block、Follow、Match 与 Exposure 等事实计算；不持久化 `social_discovery_candidates`。
- 最低资格包括：不是自己、双方 Profile 可参与发现、任一方向均无 Social Block、双向硬偏好兼容，并排除必须排除的当前关系。
- 已 Match 或已有任一方向 Follow 的对象从普通 Discovery 移除。
- `social_discovery_exposures` 只记录“候选真正被客户端展示”的事实；服务端返回候选不等于 Exposure。
- 首期 7 天 cooldown 是产品配置；Exposure 在线热数据 retention 为 90 天。可重复展示产生多行，不建立 viewer/candidate 永久唯一约束。
- 软排序可使用共同兴趣、语言互补、资料完整度、社交活跃度、新用户权重和小范围随机扰动，但 score / 算法版本不成为 canonical 业务表。
- Trust & Safety 的 restriction / moderation 结果可以影响候选资格，但平台处罚、审核案件和举报 canonical fact 不迁入 Social。
- 距离筛选与模糊距离展示不在本 Feature 自行裁决，继续由 `social-distance` 的 `pending_decision` 承载。

### Stage / 工件 / Gate

已完成的设计资产：

- [Social 偏好、发现与关系](/domains/social/discovery-and-relationships)：实时候选、Exposure、cooldown、retention 与排序边界。
- [Social 资料与展示内容](/domains/social/profile)：Profile 参与 Discovery 的资格基础。
- [ADR-010](/adr/ADR-010-social-profile-discovery-and-relationships)：实时计算候选、只持久化 Exposure 的决策。
- [Social 数据库](/domains/social/database)：Exposure 索引、90 天 retention 与“不建 Candidate”边界。
- `database/v2/migrations/0700_social.sql` 已落 `social_discovery_exposures` 与三个查询方向索引。

当前 Gate 事实：Workflow Registry 的正式 `SOCIAL-DESIGN` 仍为 `todo`，并存在下游引用的 `SOCIAL_DESIGN_GATE` 依赖，但当前 `main` 没有该 Gate 的 PASS 证据，也没有 Discovery 公共 API / 排序配置 Contract。因此本 Lane 为 `active`。

### 已完成 / 当前进行

已完成：候选事实来源、硬筛顺序、Exposure 真相、cooldown 与 retention 已 frozen。

当前进行：公共 Discovery Use Case / API Contract、可配置软排序的参数来源、Trust/Platform 运行时依赖与正式 Design Gate 尚未收口。

### 下一步

完成正式 Social Design Stage 与 Discovery 公共 Contract，明确真实依赖后通过 Design Gate；不把 distance pending decision 带入已冻结普通 Discovery 事实。

## Backend

状态：todo

### 范围

未来 Backend 实现实时候选计算、Exposure 写入、cooldown 与排序；当前不提前指定 endpoint、游标、错误码、查询计划或配置键。

### Stage / 工件 / Gate

当前只有数据库 schema；`apps/backend/src` 未发现 Social module，Workflow Registry 的 `SOCIAL-BACKEND` 为 `todo`，不存在 Discovery Backend Report / Gate。

### 下一步

正式 Design Gate 后建立 Social Backend Stage，并以真实代码、查询测试、跨域契约测试和 Gate 更新状态。

## Admin

状态：na

### 原因

普通 Discovery 是用户侧能力。未来若有推荐参数运营或 Feature Flag 管理，必须由 Platform/Admin 对应 Feature 提供真实页面、权限与 Gate；本页没有证据时不创建 Admin 完成事实。

## Mobile

状态：todo

### 范围

未来 Mobile 承载候选展示并在“实际展示卡片”后产生 Exposure 语义；具体卡片、分页/预取、曝光确认协议尚未形成正式 Mobile Contract。

### Stage / 工件 / Gate

`mobile_pages` 为空，无 F10 Discovery Mobile Stage / Report / Gate；通用网络/实时 Foundation 不等于 Discovery 已实现。

### 下一步

Backend Contract 稳定后建立真实 Discovery UI 与 Exposure 接入，再用 Mobile Gate 证明完成度。

## 集成

状态：todo

### 范围

后续需要真实验证 Social Profile / Preference / Block / Follow / Match、Identity 可用状态、Trust 治理结果与 Platform 配置之间的候选计算协作。

### Stage / 工件 / Gate

当前只有 canonical design，没有可运行 Social Backend + Mobile 链路或 Integration Gate。

### 下一步

各依赖实现可用后进行真实跨域联调，并确认 Exposure 只有在客户端实际展示后写入。

## 验收

状态：todo

### 范围

最终覆盖双向偏好、Block/Follow/Match 排除、Exposure cooldown、重复曝光允许、排序边界及 Trust ownership 不漂移等端到端场景。

### Stage / 工件 / Gate

当前无 Discovery E2E / Acceptance Report / Acceptance Gate。

### 下一步

实现与集成完成后建立完整验收矩阵并通过真实 Gate。
