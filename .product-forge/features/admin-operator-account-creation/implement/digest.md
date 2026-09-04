# Phase Digest：实现

## 关键决定

- 新增编排服务，在一个 TransactionManager 事务中调用 Identity 与 Operations 内部写入器。
- POST Operators 路由改为接收用户名和显示名称，返回 ADR-023 信封及一次性初始密码。
- Admin 表单删除 UUID，成功后在 Dialog 内展示可复制的密码；关闭后重置。

## 产出

- Backend：Identity account writer、Operations operator writer、编排服务、路由与组合根。
- Admin：创建输入契约、API 信封解析、创建 Dialog 体验和契约测试。
- 文档：ADR-025、Operations API/RBAC 契约、业务状态码表。

## 验证

- Backend/Admin 类型检查通过。
- Admin 契约测试 8 项通过。
- Backend 回归：44 个测试文件、174 项测试通过。
- 补充 Backend 编排/API 测试 5 项和 Admin 一次性密码 UI 测试 1 项通过；真实 PostgreSQL 回滚测试已加入集成套件，本机因未配置 `ADMIN_DATABASE_URL` 跳过。

## 风险与交接

- Lite 例外未生成 test-first 任务；Verify 阶段应优先审查事务回滚与初始密码泄露路径。
- 一次性密码关闭后无法找回是有意行为；重置密码为后续能力。
