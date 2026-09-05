# 产品规格交接摘要

## 已定基线

- 用户：内容管理员。
- 范围：`/content/lo/letters` 的表现层与信息层级。
- 核心故事：`US-001` 列表上下文、`US-002` 筛选反馈、`US-003` 批量操作可辨认、`US-004` 任务进度可辨认。
- 旅程：`JRN-001` 查找与筛选、`JRN-002` 选择与跟踪批量任务。
- 设计系统：已提取，使用现有 UI 组件、CSS 变量与深色主题能力。

## 产物

- `product-spec.md`：简洁规格与验收标准。
- `journeys/journeys.yml`：E2E 的结构化来源。
- `wireframes/字母管理页面.html`：待生成的详细线框。
- `mockups/`：待生成的项目风格原型和组件映射。
- `../design-system/manifest.yml`：已提取的只读组件与令牌清单。

## 风险与交接

- 不得把视觉优化扩展为 API、权限、批量状态机或领域规则的变更。
- 下游计划应以 `US → JRN → CMP` 为线索，目标路径为 `apps/admin/src/features/content/structured/lo-letter-page.tsx` 及其局部展示组件。
- 需要在实施后验证所有既有查询、选择、批量任务与可访问性行为不回归。
