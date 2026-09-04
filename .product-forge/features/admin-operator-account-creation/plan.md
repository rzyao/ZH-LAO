# 技术方案：后台操作员账号创建

> 状态：DRAFT｜日期：2026-09-04｜模式：Lite（用户确认不生成 `spec.md`）
> 权威输入：[ADR-025](/developer/reference/adr/ADR-025-admin-operator-account-provisioning.md)｜[Operations API](/developer/reference/contracts/operations/OPERATIONS_API.md)

## 1. 目标与边界

将 `POST /api/v1/admin/operations/operators` 的调用语义从“传入已有
`auth_subject_id`”改为“传入 `username` 与 `display_name`”。服务端在一次本地
PostgreSQL 事务中创建 Identity 后台认证账号、Operations Operator 与成功审计；只在
成功响应中一次性返回随机初始密码。

不新建表、不修改冻结迁移、不触及 Mobile 登录、邀请、通知、MFA、自动角色分配或密码
重置流程。

## 2. 设计

### 2.1 HTTP 契约

- 保持路径和权限：`POST /api/v1/admin/operations/operators`，由
  `operations.operators.create` 保护。
- 请求严格为 `{ username, display_name }`；拒绝 UUID、密码、状态、角色及未知字段。
- 成功使用 ADR-023 信封，`data` 含 Operator 摘要与 `initial_password`；响应配置
  `Cache-Control: no-store`。
- 用户名冲突映射为 `ADMIN_USERNAME_CONFLICT`，且不泄漏密码或内部 ID。

### 2.2 域边界与事务

在应用装配层新增一个专用的 `AdminOperatorProvisioningService`，而不是让 HTTP 路由
或任一 Domain Repository 直接跨 Schema 写入。

```text
Operations route: authenticate + requirePermission
  → Provisioning service（单一 TransactionManager.run）
    → Identity narrow writer: user + admin credential + scrypt hash
    → Operations narrow writer: operator + operations.operators.create audit
  → committed result: operator + transient initial password
```

- Identity writer 只写 `identity.users` 和 `identity.admin_credentials`，并拥有用户名
  规范化、随机密码和 scrypt 哈希逻辑。
- Operations writer 只写 `operations.operators` 和 `operator_audit_logs`；审计 details
  不含密码、令牌或用户名以外的敏感值。
- 两个 writer 接受同一个内部事务工作单元；它不进入任何 `public/` Repository 契约。
- 任意异常冒泡至外层事务，统一回滚；数据库唯一约束仍作为并发用户名与映射的最终裁决。

### 2.3 随机密码

- 用 Node `crypto` 的加密安全随机源生成满足现有 8–128、至少字母和数字的密码。
- 仅将明文保留在用例的局部返回值：计算 scrypt 哈希后写库，随后随成功响应发送。
- 管理端仅在成功 Dialog 的 React 内存状态显示并复制；关闭、刷新、路由离开、列表刷新
  都清空该状态，绝不缓存或写日志。

### 2.4 前端

- `operatorCreateInputSchema` 改为 `username` 与 `display_name`；删除 UUID 表单字段。
- `operationsAdminApi.createOperator` 解析 ADR-023 信封，并返回 Operator 与一次性密码。
- 创建 Dialog 成功后切换为只读“复制初始密码”成功状态；关闭后销毁密码，并使列表刷新。
- 沿用既有 Dialog、FormField、Input、Button、toast 和 mutation 失效策略。

## 3. 变更区域

| 区域 | 预期变更 |
| --- | --- |
| `apps/backend/src/modules/identity/` | Identity 窄写入端口、后台账号创建用例、随机密码/哈希复用与单元测试 |
| `apps/backend/src/modules/operations/` | 事务内 Operator + Audit writer、路由的新请求/信封响应与测试 |
| `apps/backend/src/main.ts` / composition | 组装编排服务，不形成 Identity ↔ Operations 循环依赖 |
| `apps/admin/src/features/operations/` | 新客户端契约、创建表单与一次性密码复制体验及测试 |
| `docs/docs/developer/reference/` | 已完成 ADR-025、Operations API 与 RBAC 契约修订 |

## 4. 验证策略

1. **Identity 单元测试**：用户名规范化、随机密码满足策略、只写 hash、重复用户名。
2. **Operations/编排单元测试**：调用者权限已经在路由前裁决；Operation writer 失败或
   Audit 失败时外层事务回滚；审计详情拒绝密码。
3. **后端集成测试**：成功创建后可用返回密码登录；重复用户名无新增 User/credential/
   Operator；无权限无写入；响应和数据库/审计中不含初始密码。
4. **Admin 组件与契约测试**：无 UUID/密码输入；创建成功可复制；关闭后密码不再渲染；
   API 信封解析和错误提示正确。
5. **回归**：既有后台登录、改密、Operator 角色分配、启用/禁用与权限测试继续通过。

## 5. 约束检查

| 检查 | 结论 |
| --- | --- |
| FR-001–FR-008 覆盖 | 完整：表单、API、编排、临时密码、审计与错误场景均有实现位置 |
| 数据模型 | 无 schema/迁移变化；复用冻结表 |
| 安全 | 精确权限、scrypt、`no-store`、一次性内存展示、无敏感审计/日志 |
| 架构 | ADR-025 限定为同库本地事务与窄写入端口；不公开 Repository/SQL |
| 测试 | 单元、集成、Admin 组件和回归均明确 |

## 6. 风险

- 现有 API 调用方需随 Admin 同步切换；本仓库只有 Admin 调用方，作为同一改动一并更新。
- 需谨慎处理 composition，防止建立 Identity 与 Operations 的循环导入；编排依赖应由根部装配。
- 初始密码无法再次读取是有意安全约束；未来需单独设计重置密码能力。
