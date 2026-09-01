---
feature_id: practice-content-management
title: 练习与题库管理
portfolio_status: active
domain:
- content
- operations
mobile_pages: []
admin_pages: []
delivery_evidence:
- CONTENT_DESIGN_AUDIT.md -> CONTENT_DESIGN_GATE = PASS
delivery_notes:
- CONTENT_GATE 尚未 PASS，当前 main 不存在 Content Backend module，无法开始真实 Content Admin 集成。
---

# 练习与题库管理

## 功能概览

Portfolio Status：`active`。

本 Feature 负责 canonical practice/question definitions：Exercise、Question 及其 QuestionContent / Option / AnswerRule 聚合、排序、lifecycle、revision/publish 与正确答案定义。用户 attempt / answer / result 属于 Learning；runtime practice view 必须隐藏 scoring truth。
