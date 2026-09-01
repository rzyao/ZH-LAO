---
feature_id: social-post-interactions
title: 动态点赞、评论与回复
portfolio_status: active
domain:
- social
- identity
- trust
mobile_pages: []
admin_pages: []
delivery_evidence:
- /domains/social/community-content
- /domains/social/database
- /governance/design-register
---

# 动态点赞、评论与回复

## 功能概览

Portfolio Status：`active`。

`social-post-interactions` 负责动态点赞 / 取消点赞、评论与回复的端到端交付跟踪。Like / Comment 的 canonical 事实来自 [Social 动态](/domains/social/community-content) 与 [Social 数据库](/domains/social/database)；举报仍只是 Social 的入口能力，举报事实唯一归 `trust.reports`。

当前真实状态是：Like / Comment / Reply 数据与业务约束已经冻结，`database/migrations/0700_social.sql` 已落地 Like / Comment 表；但 Backend runtime、Mobile 与联调均没有 F12 实现证据。因此只将 实际 Stage / Gate 标记为完成。
