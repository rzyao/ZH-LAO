---
feature_id: social-profile-view
title: 公开社交资料查看
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

# 公开社交资料查看

## 功能概览

Portfolio Status：`active`。

本 Feature 负责读取另一用户当前可公开展示的 Social Profile 及已获准公开的照片、兴趣、社交语言和 Prompt。它读取 Social 的当前展示事实，不复制 Identity 账户事实，也不把 Trust 审核/处罚历史暴露为 Social canonical 数据。

## 设计

状态：active

### 范围

- 公开对象必须来自可参与公开展示的 Social Profile，而不是直接读取 Identity Basic Profile。
- 资料可见性由 Profile 生命周期、Social 当前展示审核状态及对应子对象的公开条件共同决定；不新增 `is_visible` / `can_discover` 第二真相字段。
- 照片公开读取仅包含 `deleted_at IS NULL AND moderation_status='approved'`；Prompt 采用同类展示资格。
- 跨域引用统一使用稳定 logical/public UUID；Social 内部 BIGINT 不作为外部公开契约。
- Trust 只提供治理/审核结果；完整案件、限制、申诉与举报事实仍属于 Trust，而不是公开 Profile payload 的 Social canonical fact。

### Stage / 工件 / Gate

已完成的设计资产：

- [Social 资料与展示内容](/domains/social/profile)：公开资料、照片和 Prompt 的展示资格。
- [Social 域](/domains/social/)：Social / Identity / Trust / Media ownership 边界。
- [Social 数据库](/domains/social/database)：稳定 `public_id` 与跨域 logical UUID 规则。
- [ADR-010](/adr/ADR-010-social-profile-discovery-and-relationships)：Profile 作为独立社交身份的决策。
- `database/v2/migrations/0700_social.sql`：Profile、Photo、Prompt 等 physical schema 已存在。

当前 Gate 事实：正式 `SOCIAL-DESIGN` 在 Workflow Registry 中仍未完成，仓库没有公开资料读取 Feature 的公共 API Contract / Design Gate PASS。因此设计已有大量 frozen artifact，但 Lane 仍为 `active`。

### 已完成 / 当前进行

已完成：公开资料事实来源、展示资格、logical UUID 与 Trust 边界已经确定。

当前进行：公开读取 Use Case、响应 Contract、鉴权/隐私规则以及正式 Gate 尚未收口。

### 下一步

完成公开 Profile 的正式应用 Contract 与隐私/鉴权边界，并通过真实 Social Design Gate。

## Backend

状态：todo

### 范围

未来 Backend 只实现已定义的公开读取语义与资格过滤；不提前定义 URL、分页、错误码或 Trust 内部数据结构。

### Stage / 工件 / Gate

远程 `apps/backend/src` 未发现 Social module；Workflow Registry 的 `SOCIAL-BACKEND` 为 `todo`，当前没有公开 Profile Backend Report / Gate。

### 下一步

设计 Contract 完成后实现公开 Profile 查询及过滤，并用真实测试/Gate 更新状态。

## Admin

状态：na

### 原因

公开资料查看是用户侧能力。Trust/Admin 的审核、限制或案件操作属于其它 Feature；本 Feature 不把治理后台视为自身交付面。

## Mobile

状态：todo

### 范围

未来 Mobile 展示公开 Social Profile 及可见资料内容；具体页面与交互尚未进入正式 F10 Mobile Stage。

### Stage / 工件 / Gate

`mobile_pages` 为空，没有公开 Profile Mobile Artifact / Gate。

### 下一步

待公共读取 Contract 稳定后创建真实页面并接入 Backend。

## 集成

状态：todo

### 范围

未来验证 Social 公开资料读取与 Identity 用户状态、Trust 展示资格及 Media/Asset 引用的真实协作。

### Stage / 工件 / Gate

当前不存在可运行的 F10 Backend/Mobile 联调与 Integration Gate。

### 下一步

待两端实现后启动集成验证，尤其确认 Trust 事实只被消费、不被复制。

## 验收

状态：todo

### 范围

最终覆盖可公开 Profile、未审核/已删除资料不可见、logical UUID 边界和跨域治理边界等 E2E 场景。

### Stage / 工件 / Gate

当前无公开 Profile E2E / Acceptance Report / Gate。

### 下一步

实现完成后建立验收场景并通过真实 Gate。
