---
status: active
---

# Feature 文档规范

每个进入正式 Feature 清单的功能必须有且只有一个人工维护的 canonical Feature Page，路径为 `/features/<feature_id>/`。只要进入正式清单就创建页面，不以“是否已经开始设计”为前提。Feature Page 是端到端交付事实源；它不复制 Domain 的数据、契约或状态机事实，而是链接到其唯一来源。

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

状态只允许 `todo`、`active`、`blocked`、`done`、`na`。阻塞 Lane 必须使用 `blocks.<lane>` 记录原因。`portfolio_status`（例如 `planned`、`deferred`、`unresolved`）属于 Feature Inventory 的产品组合语义，不直接作为 Lane 状态写入矩阵。

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

每个 Lane 至少说明当前状态、范围、关联 Stage / 工件 / Gate 与下一步；`na` 必须说明原因。已有的用户目标、用户流程、领域关系、Use Case、状态机、Contract 等内容必须归入 `设计`，已有 Backend/Admin/Mobile 工件同理归入对应模块，不得因模板迁移删除。

推荐的每个 Lane 内部结构：

```text
状态
范围
Stage / 工件 / Gate
下一步
```

Stage 仍由 `feature_id × lane` 逻辑节点承载，但人工阅读入口始终是本页对应模块；不生成独立 Node Detail 页面。

## 派生视图与关联

`FEATURE_PAGE_INDEX.json` 与 `DOMAIN_LIFECYCLE_MATRIX.md` 都从 Feature Page Frontmatter 派生。Matrix 不保存或展示 Stage 细节，所有 Feature 单元格跳转到 Feature Page 的对应章节；Domain 单元格继续跳转到 Domain 或现有 Domain 级开发/Gate canonical 页面。

`mobile_pages` 与 `admin_pages` 使用稳定页面 ID，形成 Feature 与真实页面的多对多关系。页面自身也必须反向列出所属 Feature。

## Matrix 视觉与状态边界

Matrix 第一列固定为 `开发对象`，通过 Domain 行与缩进后的 Feature 行表达：

```text
Domain
  Feature
```

列固定为：开发对象、设计 AI、Backend AI、Admin AI、Mobile AI、集成 AI、验收 AI。矩阵只显示 `✅ 完成`、`▶ 进行中`、`! 阻塞`、`○ 未启动`、`— 不适用` 五种概览状态；READY、validating、recovery、deferred 等 Stage 或产品组合细节必须留在 Feature Page、Stage、Gate 或 Inventory。
