# Spec：后台操作员密码重置

> Feature：`admin-operator-password-reset`｜SpecKit mode：classic｜2026-09-05
> 权威输入：[ADR-031](../../docs/docs/developer/reference/adr/ADR-031-admin-operator-password-reset.md)、[产品规格](./product-spec/product-spec.md)、[研究](./research/README.md)

## 目标

授权后台管理员可安全重置其他 active 操作员的后台密码，同时原子撤销目标会话并保留无秘密审计。该能力不提供公开找回、Mobile 账户处理或秘密恢复。

## 权威快照

- Identity 拥有 admin credential、hash、Session 和 `password_change_required`；Operations 拥有 RBAC 与成功审计。
- `operations.operators.reset_password` 是唯一授权键；actor/target 都 active，actor 不得等于 target；重置 `super_admin` 目标要求 actor 亦为 `super_admin`。
- 前向 migration 新增 `password_change_required boolean NOT NULL DEFAULT false`；冻结历史 migration 不修改。
- 命令内凭证变更、目标全部 Session 撤销及成功审计同一 PostgreSQL 本地事务提交，失败全部回滚。

## 用户故事与验收

### US-001：成功重置

作为有精确权限的 active 管理员，我要为另一名可重置的 active 操作员生成临时密码。

- Given actor/target 满足资格，When actor 确认 `POST /api/v1/admin/operations/operators/:operator_id/password-reset`，Then 统一成功信封只一次返回 `data.temporary_password`，并已更新 hash、撤销全部 target active Session、写成功审计。
- Given 任一凭证、Session 或 audit 写入失败，When 命令结束，Then 三者全部回滚且不返回秘密。

### US-002：保护越权与秘密

作为安全负责人，我要阻止越权和秘密重放。

- Given actor 无精确权限、目标为自己、任一方 inactive，或 actor 非 super_admin 而目标为 super_admin，When 调用命令，Then 返回已登记业务码、无副作用且无秘密。
- Given 成功响应后 Dialog 关闭/刷新/离开，When 再次读取目标，Then 不会返回或持久化临时密码。
- Given 浏览器网络失败，When 未收到可解析成功响应，Then 客户端不自动重试，且无读取接口可恢复秘密。

### US-003：首次登录改密

作为被重置的操作员，我必须在首次临时密码登录后改密。

- Given `password_change_required=true`，When 用临时密码认证成功，Then 仅允许完成既有改密操作；成功改密原子清除该标记并撤销会话。

## FR

| ID | Requirement |
| --- | --- |
| FR-001 | 新增 exact permission、API 路由、前端 guard 与审计动作 `operations.operators.reset_password`。 |
| FR-002 | 后端实现全部 actor/target/特权 guard，前端不作为安全边界。 |
| FR-003 | Identity 窄写端口生成合规随机临时密码、存 hash、标记首次改密并撤销 target sessions。 |
| FR-004 | 编排服务使 Identity 变更与 Operations audit 同一事务提交或回滚。 |
| FR-005 | 仅成功响应一次返回 `temporary_password`，含 no-store；禁止秘密进入日志、audit、query cache、持久化状态或读取接口。 |
| FR-006 | 管理端提供不可逆确认、加载防重复提交、一次性复制/关闭结果和无障碍焦点行为。 |
| FR-007 | 登录及改密流程强制执行 `password_change_required`。 |

## 技术范围

`apps/backend/src/modules/identity`、`apps/backend/src/modules/operations`、`apps/backend/src/modules/admin-operator-provisioning`、`apps/admin/src/features/operations`、新前向 migration。复用 `AdminCredentialOperations`、SessionRepository、OperationsService、AdminOperatorProvisioningService、ConfirmDialog/Dialog；Operations 不直接 SQL 写 Identity。

## NFR 与测试

| NFR | 测量 |
| --- | --- |
| 秘密不泄露 | API/组件/日志断言中没有临时密码；成功响应外检索为零。 |
| 原子性 | 集成测试注入 Identity、Session、Audit 各失败点，断言无持久化副作用。 |
| 无障碍 | Playwright + axe 验证 Dialog 语义、焦点与状态消息。 |

关键测试：TC-001 成功原子重置；TC-002 无权限；TC-003 自己/特权目标拒绝；TC-004 任一失败回滚；TC-005 临时密码一次性与 no-store；TC-006 首次登录强制改密；TC-007 网络失败不自动重试。

## 风险

前向 migration、权限目录补授和认证 middleware 的强制改密分支需要计划阶段设计；不允许用现有代码行为替代本规格或 ADR-031。
