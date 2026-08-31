---
feature_id: social-profile
title: 社交资料创建与编辑
portfolio_status: active
domain:
  - social
  - identity
  - trust
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

# 社交资料创建与编辑

## 功能概览

Portfolio Status：`active`。

本 Feature 负责用户主动进入社交场景后创建、编辑并维护唯一 Social Profile。Social Profile 是独立公开社交身份，不复用 Identity Basic Profile，也不拥有账号认证、平台处罚或举报事实。

当前仓库已经冻结 Profile 的 canonical 数据语义并落盘 Social migration；但正式 `SOCIAL-DESIGN` 工作流尚未形成 PASS Gate，也没有 F10 专属 Backend / Mobile 实现，因此不能把“数据设计完成”写成端到端交付完成。

## 设计

状态：active

### 范围

- `social_profiles` 表达一个 Identity User 对应至多一个 Social Profile；跨域仅保存 Identity logical UUID，不建立跨域物理 FK。
- Profile 自有 `display_name`、性别、生日、粗粒度位置、职业、教育、简介、关系目标、资料生命周期与展示审核状态。
- `draft / active / paused / closed` 是 Social Profile 生命周期；`paused` 退出普通 Discovery，`closed` 关闭 Social 功能，但都不等于 Identity 账号注销。
- Profile 的 `moderation_status` 只表达 Social 对象是否可展示/参与发现；完整审核历史、Restriction、处罚、申诉及 `trust.reports` 仍由 Trust & Safety 拥有，不能写成 Social canonical fact。

### Stage / 工件 / Gate

已完成的设计资产：

- [Social 域](/domains/social/)：冻结 Social 业务边界与 Profile → Discovery 主链。
- [Social 资料与展示内容](/domains/social/profile)：冻结 `social_profiles` 字段、生命周期、公开资格与跨域 UUID 规则。
- [ADR-010](/adr/ADR-010-social-profile-discovery-and-relationships)：冻结一人一份 Social Profile、资料正规化与实时 Discovery 原则。
- [Social 数据库](/domains/social/database)：冻结 Social V1 19 表及 Trust / Media / Identity 跨域边界。
- Repository artifact：`database/migrations/0700_social.sql` 已创建 `social.social_profiles` 及约束。

当前 Gate 事实：`docs/docs/development/workflow/AI_STAGE_REGISTRY.json` 仍把正式 `SOCIAL-DESIGN` 登记为 `todo`；当前 `main` 未发现可证明 `SOCIAL_DESIGN_GATE = PASS` 的 Feature / Domain Gate 产物。因此本 Lane 只记为 `active`，不冒充 `done`。

### 已完成 / 当前进行

已完成：Profile 的事实归属、字段、状态与跨域边界已经 frozen，并已有 physical schema migration。

当前进行：仍缺正式 Social Design Stage 对产品 Use Case、公共 Contract / API 边界与 Gate 的收口。

### 下一步

完成正式 `SOCIAL-DESIGN`，把创建/编辑 Profile 的公共用例与 Contract 写入 canonical 工件并通过真实 Design Gate；Gate PASS 后再评估本 Lane 是否可升级为 `done`。

## Backend

状态：todo

### 范围

未来 Backend 只实现已经冻结的 Profile 事实与生命周期，不在本页提前发明 endpoint、错误码、鉴权细节或跨域 Trust 流程。

### Stage / 工件 / Gate

当前仅有 `0700_social.sql` 数据库物理基线。远程 `apps/backend/src` 未发现 Social module，Workflow Registry 的 `SOCIAL-BACKEND` 仍为 `todo`，也没有 F10 Profile Backend Report / Gate。

### 下一步

待正式 Social Design Gate 给出公共 Contract 后，创建并执行真实 Social Backend Stage；在实现、测试和 Gate 证据出现前保持 `todo`。

## Admin

状态：na

### 原因

本 Feature 是用户侧 Social Profile 创建与编辑，不以 Admin 页面作为交付端。资料审核/平台治理如需后台能力，应由对应 Trust / Operations / Admin Feature 负责，不能因为 Profile 有 `moderation_status` 就把 Admin Lane 写成已交付。

## Mobile

状态：todo

### 范围

未来 Mobile 承载用户创建、编辑和查看自身 Social Profile 的交互；具体页面、导航和表单 Contract 尚未进入本 Feature 的正式 Mobile Stage。

### Stage / 工件 / Gate

`mobile_pages` 当前为空，仓库没有 F10 Profile Mobile Stage / Report / Gate；通用 Mobile Foundation 不等于 Social Profile 已实现。

### 下一步

待 Social 公共 Contract 稳定后建立真实 Mobile 页面与 Stage，并接入真实 Backend；在此之前保持 `todo`。

## 集成

状态：todo

### 范围

后续需要验证 Identity logical UUID、Social Profile 生命周期以及 Trust 展示资格之间的真实运行时协作，但不复制 Identity/Trust canonical fact。

### Stage / 工件 / Gate

当前只有设计级跨域契约，尚无 Profile Backend + Mobile 的真实联调工件或 Integration Gate。

### 下一步

待 Backend 与 Mobile 形成可运行实现后再启动真实集成验证。

## 验收

状态：todo

### 范围

最终验收覆盖创建唯一 Profile、编辑核心资料、生命周期变化、公开资格与跨域边界不变量。

### Stage / 工件 / Gate

当前无 F10 Profile E2E / Acceptance Report / Acceptance Gate；数据库 migration 不等于用户流程验收。

### 下一步

在实现与集成完成后建立端到端验收场景并以真实 Gate 判定交付。
