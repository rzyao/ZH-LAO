---
feature_id: social-profile-media
title: 社交照片 / 兴趣 / 语言 / Prompt
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
---

# 社交照片 / 兴趣 / 语言 / Prompt

## 功能概览

Portfolio Status：`active`。

本 Feature 汇总 Social Profile 的四类展示内容：资料照片、兴趣、社交语言与 Prompt。它们是 Social 自有资料事实；媒体物理文件属于 Media / Asset Infrastructure，平台审核历史与处罚属于 Trust & Safety。

当前 canonical 数据模型和 migration 已冻结，但正式 Social Design Gate、Backend、Mobile、集成和验收仍未完成。

## 设计

状态：active

### 范围

- 照片：`social_profile_photos` 最多 6 张，`position=1` 为主图；Social 只保存 `media_id` logical UUID，不保存 URL、bucket、object key 等文件事实。
- 兴趣：`social_interests` 是平台维护字典，`social_profile_interests` 保存 Profile 选择与顺序；首期不允许用户自定义公开兴趣。
- 社交语言：`social_profile_languages` 是 Social 公开语言画像，不绑定 Learning 进度；每人最多一门母语由 partial unique 约束。
- Prompt：`social_prompt_templates` 是平台题库，`social_profile_prompts` 是可审核 UGC，最多 3 条并保留稳定 `public_id`。
- 照片和 Prompt 的 `moderation_status` 只决定 Social 对象展示资格；Trust 拥有审核/执法历史，举报 canonical fact 统一是 `trust.reports`。

### Stage / 工件 / Gate

已完成的设计资产：

- [Social 资料与展示内容](/domains/social/profile)：照片、兴趣、语言、Prompt 的字段、约束、公开规则和生命周期。
- [Social 域](/domains/social/)：Social 与 Identity、Trust、Media/Asset 的 ownership 边界。
- [ADR-010](/adr/ADR-010-social-profile-discovery-and-relationships)：资料正规化与平台字典原则。
- [Social 数据库](/domains/social/database)：V1 19 表与 logical UUID 规则。
- Repository artifact：`database/v2/migrations/0700_social.sql` 已落 `social_profile_photos`、`social_interests`、`social_profile_interests`、`social_profile_languages`、`social_prompt_templates`、`social_profile_prompts`。

当前 Gate 事实：Workflow Registry 仍把正式 `SOCIAL-DESIGN` 记为 `todo`，当前 `main` 没有 F10 media/profile-content 专属 Design Gate PASS。因此本 Lane 为 `active` 而不是 `done`。

### 已完成 / 当前进行

已完成：四类资料的 canonical ownership、数据库约束、审核状态含义和跨域引用方式已 frozen。

当前进行：缺公共 Use Case / API Contract、媒体接入流程与正式 Design Gate 的最终收口。

### 下一步

在正式 Social Design Stage 中冻结资料内容的用户操作 Contract、Media/Asset logical reference 校验与 Trust 协作边界，并以真实 Gate 结束设计 Lane。

## Backend

状态：todo

### 范围

未来 Backend 根据 frozen model 实现照片排序/软删除、兴趣选择、语言画像、Prompt 编辑与展示资格；不得在本页提前设计具体路由或把 Trust moderation history 存回 Social。

### Stage / 工件 / Gate

当前只有数据库 migration；`apps/backend/src` 未发现 Social module，Workflow Registry 的 `SOCIAL-BACKEND` 为 `todo`，不存在本 Feature 的 Backend Report / Gate。

### 下一步

正式 Social Design Gate PASS 后创建 Social Backend Stage，并用代码、测试和 Gate 证据推进状态。

## Admin

状态：na

### 原因

本 Feature 的交付端是用户资料编辑。兴趣/Prompt 字典未来若需要运营后台，应由独立 Admin/运营 Feature 证明其页面与权限；当前没有证据，不能因为字典是“平台维护”就把本 Feature Admin Lane 写成 done 或 active。

## Mobile

状态：todo

### 范围

未来 Mobile 需要提供照片、兴趣、语言、Prompt 的真实编辑/排序/审核状态交互；当前不提前指定页面结构。

### Stage / 工件 / Gate

`mobile_pages` 为空，没有 F10 Social profile media Mobile Stage / Report / Gate；通用图片选择或 Foundation 能力不是该 Feature 的交付证据。

### 下一步

待 Backend Contract 稳定后建立真实 Mobile 页面、上传/引用流程和接口接入。

## 集成

状态：todo

### 范围

未来联调至少涉及 Social ↔ Identity logical user、Social ↔ Media/Asset logical media UUID，以及 Social 对 Trust 审核结果的消费边界。

### Stage / 工件 / Gate

当前只有设计契约和 physical schema，没有跨域 live integration artifact / Gate。

### 下一步

待 Social Backend 与 Mobile 实现存在后启动跨域集成验证，确认没有复制 Media 或 Trust canonical fact。

## 验收

状态：todo

### 范围

最终验收照片数量/主图/排序、兴趣数量与顺序、语言约束、Prompt 数量/顺序以及未审核内容不可公开等用户流程。

### Stage / 工件 / Gate

当前无本 Feature E2E、Acceptance Report 或 Acceptance Gate。

### 下一步

在真实实现和集成完成后补端到端验收与 Gate。
