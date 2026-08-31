---
status: active
---

# Development Node 模型

Development Node 是逻辑开发单元，而非导航页面：

```text
Development Node = feature_id × lane
```

例如 `login.mobile` 表示登录功能的 Mobile Lane。Node 的 Stage、工件、Gate 和下一步都展示在对应 [Feature Page](/features/login/) 的 Lane 模块中；不得生成 `/development/nodes/*` 详情页。

Feature Page 是功能级唯一人工维护入口。其 Lane 状态仅允许 `todo`、`active`、`blocked`、`done`、`na`；`blocked` 必须在 Frontmatter 的 `blocks` 中说明原因。
