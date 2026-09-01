---
feature_id: lesson-learning
title: Lesson 学习流程
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

# Lesson 学习流程

## 功能概览

Portfolio Status：`active`。

`lesson-learning` 负责认证用户从进入 Lesson、推进 Section 到完成 Lesson 的核心学习流程。Content 持有 Lesson/Section/Item 的结构与发布事实；Learning 持有用户 Lesson 状态、resume、完成事实及其事务语义；Identity 只提供 current-user 身份上下文。
