---
feature_id: guest-learning-browse
title: 游客浏览学习内容
portfolio_status: active
domain:
- learning
- content
mobile_pages: []
admin_pages: []
delivery_evidence:
- /development/05-content/CONTENT_DESIGN_AUDIT
- /development/06-learning/LEARNING_DESIGN_AUDIT
delivery_notes:
- Content runtime read implementation and formal Content Backend Gate are not yet complete; Learning Backend execution remains
  blocked.
---

# 游客浏览学习内容

## 功能概览

Portfolio Status：`active`。

`guest-learning-browse` 负责游客进入学习内容浏览链路。Content 是课程、Lesson 与已发布内容的 canonical owner；Learning 不为匿名浏览创建用户进度、历史或其它 user-owned 学习事实。需要进入用户态学习行为时，仍遵守 Learning runtime 的 authenticated / current-user ownership contract。
