---
status: active
---

# Feature 文档规范

每个进入正式 Feature 清单的功能必须有且只有一个 canonical Feature Page，路径为 `/features/<feature_id>/`。Feature Page 是功能级唯一人工维护的开发控制页；它不复制 Domain 的数据、契约或状态机事实，而是链接到其唯一来源。

## Frontmatter

```yaml
feature_id: login
title: 用户登录与会话
domain: [identity]
status:
  design: done
  backend: done
  admin: na
  mobile: active
  integration: todo
  acceptance: todo
mobile_pages: [mobile-login, mobile-otp]
admin_pages: []
```

状态只允许 `todo`、`active`、`blocked`、`done`、`na`。阻塞 Lane 必须使用 `blocks.<lane>` 记录原因。

## 固定章节

章节顺序不可调整，六个章节即使不适用也必须保留：

```text
功能概览
设计
Backend
Admin
Mobile
集成
验收
```

每个 Lane 至少说明当前状态、范围、关联 Stage / 工件 / Gate 与下一步；`na` 必须说明原因。

## 派生视图与关联

`FEATURE_PAGE_INDEX.json` 与 `DOMAIN_LIFECYCLE_MATRIX.md` 都从 Feature Page Frontmatter 派生。Matrix 不保存或展示 Stage 细节，所有单元格跳转到 Feature Page 的对应章节。

`mobile_pages` 与 `admin_pages` 使用稳定页面 ID，形成 Feature 与真实页面的多对多关系。页面自身也必须反向列出所属 Feature。
