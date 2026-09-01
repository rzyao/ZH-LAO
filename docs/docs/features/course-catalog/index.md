---
feature_id: course-catalog
title: 课程列表与课程详情
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

# 课程列表与课程详情

## 功能概览

Portfolio Status：`active`。

`course-catalog` 覆盖课程列表、课程详情、课程结构与进入课程前的读取链路。课程/Lesson 定义、发布状态、结构与 revision 属于 Content；Learning 只在进入 user-owned 学习状态后持有进度、resume 等事实；Identity 只提供认证用户上下文，不成为课程内容 owner。
