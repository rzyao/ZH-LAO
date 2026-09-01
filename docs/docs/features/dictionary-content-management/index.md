---
feature_id: dictionary-content-management
title: 词典内容管理
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

# 词典内容管理

## 功能概览

Portfolio Status：`active`。

本 Feature 负责 canonical dictionary facts 的运营管理：canonical translation、跨语言 `content_equivalents`、同语言 `content_relations`、tags/content-tags，以及这些事实依附的 canonical knowledge metadata。用户词典搜索历史属于 Learning；runtime Dictionary Search 是消费能力，不等同于本管理 Feature。
