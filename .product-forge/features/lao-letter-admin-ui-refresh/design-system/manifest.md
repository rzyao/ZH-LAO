# 设计系统清单：字母管理 UI 优化

> 状态：只读提取｜来源：`apps/admin/src/components/ui/` 与 `apps/admin/src/design-system/tokens/index.css`

## 发现结果

- 框架：React 19、Tailwind CSS 4、Lucide 图标。
- 基础组件：`Button`、`Input`、`Badge`、`Table`、`Skeleton`、`Dialog` 等。
- 视觉令牌：背景、卡片、主色、文字、边框、成功/警告/错误状态，均由 CSS 变量提供，并支持深色主题。
- 当前目标页面：`apps/admin/src/features/content/structured/lo-letter-page.tsx`，路由为 `/content/lo/letters`。

## 设计约束

- 复用现有组件和 CSS 变量，不新增并行设计系统。
- 保留现有 URL 查询参数、权限、批量任务和 API 行为。
- 设计应改善页面分区、任务历史可读性、筛选工具栏和表格操作密度，而不改变领域状态与操作语义。
