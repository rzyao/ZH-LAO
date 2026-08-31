---
layout: page
sidebar: false
status: template
---

# Feature Page 模板

复制本模板到 `docs/docs/features/<feature_id>/index.md` 后，补齐 Frontmatter 和实际事实。正式 Feature Page 必须人工维护，不要用本页替代正式页面。

## Frontmatter

```yaml
feature_id: replace-me
title: 功能名称
domain: [domain-id]
status:
  design: todo
  backend: todo
  admin: na
  mobile: todo
  integration: todo
  acceptance: todo
mobile_pages: []
admin_pages: []
```

## 功能概览

功能定位、范围、非范围，以及 Domain canonical 文档链接。

## 设计

状态：todo

范围、用户目标、用户流程、领域关系、Use Cases、状态机、Contract、设计产物与 Design Gate。

## Backend

状态：todo

Backend canonical implementation、相关 Stage、Implementation Report、Audit 与 Gate。

## Admin

状态：na

不适用原因，或后台页面、权限、API、操作与 Audit/Gate。

## Mobile

状态：todo

Mobile 页面、用户旅程、相关 Stage、实现与验收证据。

## 集成

状态：todo

真实跨端/跨域集成、集成 Stage、风险与 Gate。

## 验收

状态：todo

E2E、回归、验收报告与最终 Gate。
