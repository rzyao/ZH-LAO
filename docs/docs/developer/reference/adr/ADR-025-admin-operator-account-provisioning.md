---
status: baseline
last_updated: 2026-09-04
---

# ADR-025：受控创建后台账号与操作员

**状态：** `已接受`

**日期：** `2026-09-04`

**批准：** 用户授权修订 Operations API 与 Identity ↔ Operations 协作规则，2026-09-04

**修订：** [Operations API](/developer/reference/contracts/operations/OPERATIONS_API.md)、[Operations RBAC 契约](/developer/reference/contracts/operations/OPERATIONS_RBAC_CONTRACTS.md)

## 决策

“新建操作员”不再要求管理者提供 `auth_subject_id` UUID。拥有 `operations.operators.create` 精确权限的后台管理员提交用户名与显示名称后，系统创建独立后台认证账号、对应的 active Operator，并生成一次性初始密码。

该命令继续使用 `/api/v1/admin/operations/operators`，但其请求体改为 `username` 与 `display_name`；禁止客户端提供 UUID、密码、状态或角色。成功响应遵守 ADR-023 的统一信封，并在 `data.initial_password` 中仅返回一次随机密码。关闭、刷新或后续查询均不可再次读取它。

Identity 保有 User、AdminCredential、用户名唯一性与密码哈希；Operations 保有 Operator、精确权限判定与成功操作审计。应用装配层使用两个窄写入端口在**同一个本地 PostgreSQL 事务**内编排这些已拥有的事实：Identity 写入 → Operations 写入 → Audit → 提交。任何一步失败即回滚，因而不会留下孤立后台账号或孤立 Operator。

## 后果

- 不修改已冻结物理迁移；复用 `identity.users`、`identity.admin_credentials` 和 `operations.operators`。
- 这不是公开注册、Mobile 账户提升、邀请、邮件/短信通知、MFA 或自动角色分配。
- 维持跨域所有权：编排器不直接执行跨 Domain SQL，也不暴露 Repository、SQL 或数据库 executor 作为公共 Domain 契约。
- 必须新增集成测试，覆盖成功提交、用户名冲突、Operations 写入失败回滚、无权限拒绝、一次性密码不进入审计或日志。
