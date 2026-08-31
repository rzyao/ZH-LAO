---
status: active
last_updated: 2026-08-31
---

# 后台开发

Admin 以**页面、工作台和运营流程**为主线，不按 Domain 或数据库表机械分组。

标准页面实施需要回答：

```text
运营目标
→ 页面 / 路由 / 工作流
→ 消费哪些 Public/API Contract
→ RBAC / Permission
→ Loading / Empty / Error / Retry
→ Mutation feedback / audit
→ Integration / E2E
```

## 当前入口

- [后台基础](foundation/)
- [权限与操作员](access-control/)
- [平台控制](platform-control/)
- [内容管理](content-management/)
- [音频生产工作台](audio-production/)

一个工作台可以消费多个 Domain，但页面文档不得重新定义 Domain 内部事实。

新任务路径：

```text
docs/docs/development/admin/<page-or-workflow>/
```
