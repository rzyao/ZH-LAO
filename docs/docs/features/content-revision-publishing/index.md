---
feature_id: content-revision-publishing
title: 内容 Revision 与发布治理
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

# 内容 Revision 与发布治理

## 功能概览

Portfolio Status：`active`。

本 Feature 负责 Content revision/publication canonical fact：`content.content_revisions`、immutable `revision_public_id`、draft → published → superseded lifecycle、current published revision 切换、historical revision resolution，以及 content/course/lesson/exercise/question/translation-set 的 snapshot/pin 语义。它不等同于 Admin 页面，也不等同于下游 Learning/Audio 的消费实现。
