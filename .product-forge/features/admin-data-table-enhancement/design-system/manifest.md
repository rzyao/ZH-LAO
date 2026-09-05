# 管理端设计系统清单

> 状态：只读提取；设计系统仍以 `apps/admin/src/` 中的代码为唯一事实源。

## 发现结果

- **框架：**React 19、Tailwind CSS v4、Base UI。
- **组件：**现有 UI 原语覆盖按钮、复选框、输入框、选择器、下拉菜单、对话框、表格，以及加载、空态和错误态。
- **表格基础：**`DataTable` 已组合 TanStack Table、列显示、客户端选择、排序和客户端分页；服务端模式与批量工作流尚未实现。
- **令牌：**`apps/admin/src/design-system/tokens/index.css` 定义了浅/深色语义颜色、圆角、阴影与字体令牌。
- **Storybook：**未发现；组件属性以源码为依据。

## 规格阶段注意事项

`CMP-DataTable`、`CMP-DataTablePagination` 的稳定测试选择器尚未在现有实现中提供；本清单标明了后续实现需要补足的 selector 目标，而非声称它们已经存在。其他原语使用其已暴露的原生语义选择器。
