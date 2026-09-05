# 产品规格索引：字母管理 UI 优化

> 状态：DRAFT｜创建：2026-09-05｜特性：`lao-letter-admin-ui-refresh`

## 要实现的体验

让内容管理员在不改变既有字母查询、批量操作和审核发布规则的前提下，更快理解当前列表、筛选条件、选中范围和任务进度。

| 文档 | 用途 | 状态 |
| --- | --- | --- |
| [product-spec.md](./product-spec.md) | 目标、需求与验收标准 | DRAFT |
| [journeys/journeys.yml](./journeys/journeys.yml) | 结构化用户旅程（E2E 来源） | DRAFT |
| [wireframes/字母管理页面.html](./wireframes/字母管理页面.html) | 详细页面线框 | DRAFT |
| [mockups/index.html](./mockups/index.html) | 项目风格原型 | DRAFT |
| [mockups/component-map.yml](./mockups/component-map.yml) | 原型区域到实际组件的映射 | DRAFT |
| [digest.md](./digest.md) | 下游阶段交接摘要 | DRAFT |

## 已确认决策

| 决策 | 选择 | 原因 |
| --- | --- | --- |
| 轨道 | Express | 单页面表现层优化，无契约变化 |
| 目标路由 | `/content/lo/letters` | 当前内容管理入口 |
| 视觉基础 | 项目现有组件与令牌 | 保持后台体验和深色主题兼容 |
| 用户旅程 | 2 条 | 覆盖检索与既有批量任务的核心体验 |
