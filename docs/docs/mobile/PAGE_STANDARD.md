---
status: active
---

# Mobile Page 文档规范

每个真实 Mobile Screen 使用稳定 `page_id`，并在 Frontmatter 声明 Route、所属 Feature、涉及 Domain 与页面状态：

```yaml
page_id: mobile-login
title: 登录页
route: /login
features: [login]
domains: [identity]
status: active
```

正文固定说明页面目标、Navigation、UI State、API 与错误处理、权限与测试。`features` 必须与 Feature Page 的 `mobile_pages` 双向一致。
