---
layout: page
sidebar: false
status: template
last_updated: 2026-09-02
---

# Feature Page 模板

复制本模板到 `docs/docs/features/<feature_id>/index.md` 后，补齐真实事实。正式 Feature Page 必须人工维护，不得生成固定交付状态占位章节。

## Frontmatter

```yaml
feature_id: replace-me
title: 功能名称
portfolio_status: active
domain:
  - domain-id
mobile_pages: []
admin_pages: []
contracts:
  owns: []
  depends_on: []
  forbidden: []
delivery_evidence: []
delivery_notes: []
```

## 功能概览

说明用户或运营目标、包含与不包含范围、Domain canonical 文档、真实 Stage / Gate / Report / 页面证据，以及仍待解决的产品决策或上游依赖。

只有确有复杂状态机、权限或验收模型时才增加对应章节，不创建通用占位结构。
