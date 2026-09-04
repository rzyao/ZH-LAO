# 变更日志：后台操作员账号创建

## CR-001：随机生成并仅当次展示初始密码 — 2026-09-04

| 字段 | 内容 |
| --- | --- |
| 状态 | ACCEPTED |
| 优先级 | Must Have |
| 请求阶段 | 产品规格确认前 |
| 原因 | 避免创建者选择、传递或重复使用密码 |
| 影响 | 5 个规格工件；尚无任务或代码变更 |
| 阶段回滚 | 不需要 |

### 已修改工件

| 工件 | 变更 |
| --- | --- |
| `product-spec/product-spec.md` | 初始密码改为服务端随机生成与仅当次显示的需求、验收和安全要求 |
| `product-spec/journeys/journeys.yml` | 更新成功步骤和关闭后的不可见边界场景 |
| `product-spec/journeys/JRN-001-create-admin-operator.md` | 更新成功状态 |
| `product-spec/wireframes/wireframe-create-admin-operator.html` | 移除密码输入框，说明一次性提示 |
| `product-spec/mockups/component-map.yml` | 增加成功提示的组件映射 |
