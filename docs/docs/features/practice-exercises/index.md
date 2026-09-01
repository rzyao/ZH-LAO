---
feature_id: practice-exercises
title: 练习与作答
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

# 练习与作答

## 功能概览

Portfolio Status：`active`。

`practice-exercises` 负责认证用户开始 Exercise attempt、逐题作答、完成或放弃 attempt 的核心练习链。Content 持有 Exercise/Question/revision/answer-rule 与 trusted scoring input；Learning 持有用户 attempt、question result、完成事实与事务/并发语义。错题本/Question Review Notebook 不属于本 Feature，canonical design 中仍为 deferred。
