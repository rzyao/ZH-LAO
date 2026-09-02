---
status: active
---

# Admin Page 文档规范

每个真实 Admin 页面使用稳定 `page_id`，并在 Frontmatter 声明 Route、所属 Feature、涉及 Domain、权限与页面状态：

```yaml
page_id: admin-operators
title: 操作员管理
route: /operators
features: [operator-management]
domains: [operations]
permissions: [operations.operator.read]
status: todo
```

正文固定说明页面目标、UI State 与操作、Backend API、权限、审计和测试。`features` 必须与 Feature Page 的 `admin_pages` 双向一致。
