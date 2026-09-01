---
feature_id: social-posting
title: 发布 / 删除文字图片动态
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

# 发布 / 删除文字图片动态

## 功能概览

Portfolio Status：`active`。

`social-posting` 负责文字 / 图片动态的发布与删除交付跟踪。Post 与 Media 的 canonical 事实以 [Social 动态](/domains/social/community-content) 和 [Social 数据库](/domains/social/database) 为准；图片只保存 Media/Asset logical UUID，不把 URL 或存储元数据复制进 Social。举报事实只归 `trust.reports`。

当前真实状态是：Social Post / Media 设计已冻结，`database/migrations/0700_social.sql` 已落地对应表结构；但 Backend runtime 尚无 Social Module/API，Mobile 也没有 Social Feature 实现。因此仅 实际 Stage / Gate 完成，后续 实际 Stage / Gate 保持真实 `todo/na`。
