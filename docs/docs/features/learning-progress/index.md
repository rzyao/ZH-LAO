---
feature_id: learning-progress
title: 课程与 Lesson 进度
portfolio_status: active
domain:
- learning
- content
- identity
mobile_pages: []
admin_pages: []
delivery_evidence:
- /development/05-content/CONTENT_DESIGN_AUDIT
- /development/06-learning/LEARNING_DESIGN_AUDIT
delivery_notes:
- Content runtime read implementation and formal Content Backend Gate are not yet complete; Learning Backend execution remains
  blocked.
---

# 课程与 Lesson 进度

## 功能概览

Portfolio Status：`active`。

`learning-progress` 覆盖认证用户的 Course Progress 与 Lesson Progress current state、resume anchor、完成事实与课程完成重算。Learning 是这些 user-owned progress facts 的 owner；Content 只提供稳定 Course/Lesson/Section UUID、发布结构与 denominator；Identity 只提供 current-user 身份。
