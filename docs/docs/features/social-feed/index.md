---
feature_id: social-feed
title: 关注 Feed 与动态浏览
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

# 关注 Feed 与动态浏览

## 功能概览

Portfolio Status：`active`。

`social-feed` 负责关注 Feed 与动态浏览的端到端交付跟踪。Social 的 Post、关系、Block 与展示资格事实以 [Social 动态](/domains/social/community-content) 和 [Social 数据库](/domains/social/database) 为准；举报事实不属于 Social，`trust.reports` 是全系统唯一 canonical user report fact。

当前真实状态是：Social 内容设计已经冻结，`database/migrations/0700_social.sql` 已包含 Post/Like/Comment 等 Social 数据结构；但 `apps/backend/src/main.ts` 尚未注册 Social Module/API，`apps/mobile/src/features` 也没有 Social Feature 实现。因此本页只将 实际 Stage / Gate 标记为完成，其余实现 实际 Stage / Gate 不提前升级。
