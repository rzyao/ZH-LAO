# 设计系统清单

> 从 `apps/admin/src` 只读采集；实际实现仍是唯一代码事实来源。

后台采用 React，共享应用外壳、变量化样式、基于 TanStack 的数据表格、Base UI 对话框基础组件和本地组件库。内容管理页面应复用 `DataTable` 展示有数据、加载、空和错误状态，使用 `Button` 承载主要或破坏性操作，使用 `Dialog` 编辑草稿和审核结果，使用 `StatusBadge` 展示版本与发布状态。

现有通用选择器不足以长期支撑端到端测试；实现时必须为页面根节点和关键操作增加功能专属 `data-testid`。

组件标识、导入位置、变体和设计变量见 [manifest.yml](./manifest.yml)。
