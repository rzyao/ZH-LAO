---
feature_id: social-posting
title: 发布 / 删除文字图片动态
portfolio_status: active
domain:
  - social
  - identity
  - trust
status:
  design: done
  backend: todo
  admin: na
  mobile: todo
  integration: todo
  acceptance: todo
mobile_pages: []
admin_pages: []
evidence:
  design:
    - /domains/social/community-content
    - /domains/social/database
    - /governance/design-register
---

# 发布 / 删除文字图片动态

## 功能概览

Portfolio Status：`active`。

`social-posting` 负责文字 / 图片动态的发布与删除交付跟踪。Post 与 Media 的 canonical 事实以 [Social 动态](/domains/social/community-content) 和 [Social 数据库](/domains/social/database) 为准；图片只保存 Media/Asset logical UUID，不把 URL 或存储元数据复制进 Social。举报事实只归 `trust.reports`。

当前真实状态是：Social Post / Media 设计已冻结，`database/v2/migrations/0700_social.sql` 已落地对应表结构；但 Backend runtime 尚无 Social Module/API，Mobile 也没有 Social Feature 实现。因此仅 Design Lane 完成，后续 Lane 保持真实 `todo/na`。

## 设计

状态：done

范围：确认文字 / 图片动态发布与删除的责任边界：`social_posts` 保存动态及当前展示审核状态，`social_post_media` 只关联 Media/Asset logical UUID；动态允许 text-only 或 image-only，但正文或图片至少存在一个是 Service invariant；首期删除通过 `deleted_at` 软删除，不通过级联物理删除改写 Like / Comment 历史。Social 不拥有举报事实。

Stage / 工件：当前有效 canonical 工件为 [Social 动态](/domains/social/community-content) 与 [Social 数据库](/domains/social/database)；[设计决策台账](/governance/design-register) D-135～D-138 已冻结 Post/Media 字段、跨域 UUID 规则以及“正文或图片至少一个”等 application-level invariant。

Gate / 完成证据：仓库当前没有独立 `SOCIAL_DESIGN_GATE` 文件，因此不虚构 Gate。Design 完成依据为 canonical 文档 `status: frozen` 与 D-135～D-138 `frozen`；`database/v2/migrations/0700_social.sql` 实际创建 `social_posts` 与 `social_post_media`，并没有 `social_reports`；`database/v2/migrations/1100_trust.sql` 实际创建 `trust.reports`，与唯一 canonical report fact 一致。

下一步：正式 Social Backend Stage 启动后，基于冻结 contract 实现发布 / 删除 API、事务级 Service invariant、Asset logical UUID 接入与真实测试，再以 Backend Gate 判定实现状态。

## Backend

状态：todo

范围：尚未进入 F12 发布 / 删除动态 Backend 实现；当前不预先定义 endpoint、DTO、Service 或 Repository 细节。

Stage / 工件 / Gate：当前没有 F12 Social Backend Stage / Brief / Gate；`apps/backend/src/modules` 尚无 Social Module，`apps/backend/src/main.ts` 也未注册 Social API。`0700_social.sql` 是数据库基线，不等同于应用层发布 / 删除能力完成。

下一步：等待正式 Social Backend Stage，随后按 frozen Post/Media contract 实现并补代码、测试和 Gate evidence。

## Admin

状态：na

不适用：本 Feature 是用户侧发布 / 删除能力，不定义独立 Social Posting Admin 交付面。审核展示状态可以影响 Post 是否可见，但审核案件、限制、申诉与举报事实属于 Trust & Safety / Operations；当前 Admin `src/features` 也没有 Social Posting 实现，不能据此把 Admin 标为 done 或 active。

## Mobile

状态：todo

范围：尚未进入 F12 Mobile 发布 / 删除实现；当前不提前设计发布页、图片选择、删除确认等 UI 细节。

Stage / 工件 / Gate：当前没有 F12 Mobile Stage / Brief / Gate；`apps/mobile/src/features` 当前只有 Foundation Feature，没有 Social Posting 实现证据。

下一步：待 Backend contract 与正式 Mobile Stage 就绪后，再实现真实页面、Asset 上传衔接及设备验证，并回填稳定 `mobile_pages` 与 evidence。

## 集成

状态：todo

范围：当前没有 Backend 与 Mobile 两端的发布 / 删除实现可供联调。

Stage / 工件 / Gate：当前无 F12 Integration Stage、联调报告或 Gate。

下一步：待真实 Backend / Mobile 交付物存在后再验证文字、图片、软删除、审核展示状态与 Asset logical UUID 的端到端行为。

## 验收

状态：todo

范围：当前尚无可验收的发布 / 删除动态端到端实现。

Stage / 工件 / Gate：当前无 F12 Acceptance Stage、验收报告或 Gate。

下一步：实现与集成完成后，按真实发布、图片动态、删除、审核不可见及权限异常路径建立验收证据。
