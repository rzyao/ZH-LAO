# 设计系统清单

来源：`apps/admin/src/components/ui` 与 `apps/admin/src/design-system/tokens/index.css`。

- 框架：React；没有发现 Storybook。
- 表单沿用 `CMP-Dialog`、`CMP-FormField`、`CMP-Input`、`CMP-Button`。
- 色彩、圆角必须引用现有 CSS 变量，避免在此功能中复制或新增视觉 Token。
- 现有操作员页面已经使用这组组件；本功能只替换字段与提交行为。
