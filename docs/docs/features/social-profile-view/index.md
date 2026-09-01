---
feature_id: social-profile-view
title: 公开社交资料查看
portfolio_status: active
domain:
- social
- identity
- trust
mobile_pages: []
admin_pages: []
delivery_notes:
- 已冻结的数据模型与业务边界见本页设计 实际 Stage / Gate；公共应用 Contract 与正式 Social Design Gate 仍在收口。
---

# 公开社交资料查看

## 功能概览

Portfolio Status：`active`。

本 Feature 负责读取另一用户当前可公开展示的 Social Profile 及已获准公开的照片、兴趣、社交语言和 Prompt。它读取 Social 的当前展示事实，不复制 Identity 账户事实，也不把 Trust 审核/处罚历史暴露为 Social canonical 数据。
