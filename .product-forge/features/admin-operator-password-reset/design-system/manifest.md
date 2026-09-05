# 设计系统采集：后台操作员密码重置

> 来源：`apps/admin/src/components`（React / Base UI / Tailwind）

## 可复用组件

- `CMP-ConfirmDialog`：适合“重置密码”不可逆确认；在提交中禁用关闭和动作。
- `CMP-Dialog`：适合只展示一次的临时密码结果。
- `CMP-Button`：提供加载、禁用、破坏性与轮廓变体，已有可见焦点样式。
- `CMP-Toast`：用于不包含秘密的成功、复制或失败状态消息。

## 约束

- 实现必须使用现有 Dialog/AlertDialog 的焦点与键盘语义，不能以裸 `div` 伪造模态框。
- 临时密码必须仅存于结果 Dialog 的组件局部状态，不进入 Toast、路由、查询缓存或持久化状态。
- 本清单是从代码采集的索引，不是新的设计系统事实源。
