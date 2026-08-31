---
feature_id: social-post-interactions
title: 动态点赞、评论与回复
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

# 动态点赞、评论与回复

## 功能概览

Portfolio Status：`active`。

`social-post-interactions` 负责动态点赞 / 取消点赞、评论与回复的端到端交付跟踪。Like / Comment 的 canonical 事实来自 [Social 动态](/domains/social/community-content) 与 [Social 数据库](/domains/social/database)；举报仍只是 Social 的入口能力，举报事实唯一归 `trust.reports`。

当前真实状态是：Like / Comment / Reply 数据与业务约束已经冻结，`database/v2/migrations/0700_social.sql` 已落地 Like / Comment 表；但 Backend runtime、Mobile 与联调均没有 F12 实现证据。因此只将 Design Lane 标记为完成。

## 设计

状态：done

范围：确认点赞、取消点赞、评论与两层回复的边界。Like 是当前关系态，取消点赞物理删除；Comment 使用软删除并保存当前展示审核状态；回复通过 `parent_comment_id` / `reply_to_profile_id` 表达，Service 必须保证 parent 属于同一 Post 且指向根评论。只有能看到且未被 Block 的用户才能互动；首期不建 Comment Like，也不把举报、审核案件或 enforcement 事实放进 Social。

Stage / 工件：当前有效 canonical 工件为 [Social 动态](/domains/social/community-content) 与 [Social 数据库](/domains/social/database)；[设计决策台账](/governance/design-register) D-135～D-138 已冻结 Like / Comment 字段、跨域 ID 与评论 parent 等 application-level invariant。

Gate / 完成证据：仓库当前没有独立 `SOCIAL_DESIGN_GATE` 文件，因此不虚构 Gate。Design 完成依据为 canonical 文档 `status: frozen` 与 D-135～D-138 `frozen`；`database/v2/migrations/0700_social.sql` 实际创建 `social_post_likes` 与 `social_post_comments`，同时不存在 `social_reports`；`database/v2/migrations/1100_trust.sql` 实际创建 `trust.reports`，保持 canonical report fact 单一归属。

下一步：正式 Social Backend Stage 启动后，实现 Like / Unlike、Comment / Reply 的 API、事务级可见性 / Block / parent invariant 与真实测试，再由 Backend Gate 判定状态。

## Backend

状态：todo

范围：尚未进入 F12 动态互动 Backend 实现；当前不提前定义 endpoint、DTO、Service、Repository 或通知契约。

Stage / 工件 / Gate：当前没有 F12 Social Backend Stage / Brief / Gate；`apps/backend/src/modules` 尚无 Social Module，`apps/backend/src/main.ts` 也未注册 Social API。`0700_social.sql` 已有数据结构，但不能替代应用层 Like / Comment / Reply 实现证据。

下一步：等待正式 Social Backend Stage 后，再按 frozen contract 实现并补代码、测试和 Gate evidence。

## Admin

状态：na

不适用：点赞、评论与回复是用户侧交互能力，不定义独立 F12 Admin 交付面。评论的审核展示状态不改变事实归属：审核案件、限制、申诉与举报事实属于 Trust & Safety / Operations；当前 Admin `src/features` 也没有 Social Interactions 实现。

## Mobile

状态：todo

范围：尚未进入 F12 Mobile 动态互动实现；当前不提前设计点赞控件、评论列表、回复编辑器或删除交互。

Stage / 工件 / Gate：当前没有 F12 Mobile Stage / Brief / Gate；`apps/mobile/src/features` 当前只有 Foundation Feature，没有 Social Interactions 实现证据。

下一步：Backend contract 与正式 Mobile Stage 就绪后，再实现真实交互页面并补页面 ID、测试及设备验证 evidence。

## 集成

状态：todo

范围：Backend 与 Mobile 均未进入 F12 动态互动实现，当前不存在可执行的端到端联调对象。

Stage / 工件 / Gate：当前无 F12 Integration Stage、联调报告或 Gate。

下一步：待真实交付物存在后，再联调 Like / Unlike、Comment / Reply、Block / 可见性与删除行为，不提前制造集成事实。

## 验收

状态：todo

范围：当前尚无可验收的点赞、评论与回复端到端实现。

Stage / 工件 / Gate：当前无 F12 Acceptance Stage、验收报告或 Gate。

下一步：实现与集成完成后，按真实权限、重复点赞、取消点赞、两层回复、删除占位与 Block 场景建立验收证据。
