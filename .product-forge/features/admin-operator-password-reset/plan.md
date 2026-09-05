# 技术计划：后台操作员密码重置

> 状态：待技术计划审批｜Feature：`admin-operator-password-reset`｜2026-09-05
>
> 上游权威：[ADR-031](../../docs/docs/developer/reference/adr/ADR-031-admin-operator-password-reset.md)、[Identity 域](../../docs/docs/developer/reference/domains/identity/index.md)、[Operations 域](../../docs/docs/developer/reference/domains/operations/index.md)、[桥接规格](./spec.md)

## 1. 实现边界与决策

| 事项 | 决策 |
| --- | --- |
| 授权 | 仅 active 管理员持有 exact permission `operations.operators.reset_password` 时可执行。权限和前端可见性不是后端 guard 的替代。 |
| 目标规则 | 仅限其他 active 操作员；禁止自重置。重置 `super_admin` 目标时 actor 必须也是 `super_admin`。 |
| 秘密 | 生成的临时密码仅在成功 HTTP 响应的 `data.temporary_password` 出现一次；不进日志、审计、缓存、query state、持久化或读取接口。 |
| 一致性 | 凭据 hash、`password_change_required`、会话撤销和成功审计在同一 PostgreSQL 本地事务内全部提交或全部回滚。 |
| 首次登录 | 被重置账户认证后进入“仅可改自己的密码”的受限会话；改密成功清除标记并撤销会话。 |

不新增公开找回、邮件/SMS、Mobile 账户处理或临时密码读取/再显示端点。

## 2. 目标架构

```text
Admin operators page
  -> POST /api/v1/admin/operations/operators/:operator_id/password-reset
     -> Operations reset orchestration (authorization + target eligibility)
        -> Identity narrow credential write port
           generate secret -> hash -> password_change_required=true -> revoke target sessions
        -> Operations audit write (secret-free)
     <- unified success envelope + one-time temporary_password, Cache-Control: no-store

Temporary-password login
  -> Identity authentication reads password_change_required
  -> restricted admin session / route allowlist (own-password change and logout only)
  -> existing own-password change clears flag and revokes sessions atomically
```

Operations coordinates the transaction and writes its audit record; it does not write Identity tables directly. Identity continues to own credential policy, hash, session behavior and password-change-required state.

## 3. 数据库与事务计划

1. 新建下一编号的**前向** migration（实施前确认当前迁移序号），在 `admin_credentials` 增加 `password_change_required boolean NOT NULL DEFAULT false`，并写清既有账户默认不受限。
2. 不修改冻结的 `database/migrations/1260_admin_credentials.sql` 或任何既有 migration。
3. 在 Operations 编排服务取得单一数据库 transaction；将 Identity 窄写端口和 audit repository 都绑定到该 transaction。
4. 任一 credential 更新、Session 撤销或 audit 插入异常时抛出并回滚；事务提交前绝不构造成功响应或暴露秘密。
5. 在实施前执行迁移专项计划：升级校验、回填/默认值检查、回滚策略及生产前验证查询。该功能因此进入可选的 `migration_plan` 阶段。

## 4. API 与认证契约

### 新增命令

`POST /api/v1/admin/operations/operators/:operator_id/password-reset`

- 请求体为空；受 bearer 身份和 exact permission 保护。
- 成功为既有统一信封：`{ code: "OK", data: { operator: {...}, temporary_password: string }, request_id }`；响应设置 `Cache-Control: no-store`。
- 与现有 Operations 业务错误格式一致，覆盖无权限、actor/target inactive、self target、特权层级不满足和目标不存在；拒绝不泄露临时密码，且没有副作用。
- OpenAPI 补齐路径参数、成功 schema、错误码、`no-store` 响应头及“秘密仅一次出现”的说明；不提供 GET/read-back 合约。

### 强制改密认证状态

- Identity 登录用例读取权威 `password_change_required`，将受限状态传递到认证上下文/token。
- admin auth guard 在该状态下仅放行登出和现有“改自己的密码”端点；拒绝任何业务端点，包括重置端点。
- own-password change 必须保留当前密码校验；在同一事务中写新 hash、清除标记并撤销会话。改密完成后客户端按现有安全流程重新认证。
- 不以管理端路由隐藏作为访问限制；后端 guard 是最终执行点。

## 5. 后端工作包

### B1：Identity 凭据能力与 migration

- 在 Identity 中从现有 `AdminCredentialOperations` 抽取复用的随机临时密码生成及 hash 策略，避免 Operations 自行生成或处理 hash。
- 为 Operations 提供窄写端口：输入 target admin subject、事务上下文；输出仅在内存中的临时密码以及必要的非秘密结果。它负责更新 hash、设置 required 标记和撤销该 subject 的全部会话。
- 扩展 own-password change，使其原子清除 required 标记；保留对密码 policy、错误规范和 SessionRepository 的权威所有权。
- 更新 Identity repository/query 类型与认证用例，使登录可得知 required 状态。

### B2：Operations 授权、编排与审计

- 在 Operations permission catalog、RBAC 契约及角色授予流程中加入 `operations.operators.reset_password`。实现时明确哪些标准角色拥有该权限，避免仅目录存在而无人可用。
- 新建/扩展 reset orchestration service：先解析 actor 和 target，检查 active、不同 subject、目标操作员身份及 super-admin 层级，再开始命令事务。
- 复用 admin-operator-provisioning 的跨模块 composition 模式，注入 Identity 窄端口而非跨域 SQL。
- 在同一 transaction 中调用 Identity 写端口并写成功审计 `operations.operators.reset_password`；审计 payload 只记录 actor/target/结果/request correlation 等安全字段，绝不包含密码或 hash。
- 将服务注册到应用 composition root，保持模块依赖方向为 Operations -> Identity public port。

### B3：HTTP 与错误处理

- 在 Operations routes 增加命令路由，采用现有 actor extraction、permission middleware、统一响应 envelope 和 request-id 规范。
- 将业务 guard 映射到已登记或经权威补齐的业务码，确保前端能区分“不可执行”与网络失败，且不会因错误对象 shape 再次触发 envelope 解析错误。
- 对所有成功/失败分支审查日志序列化、异常包装、metrics 标签和 HTTP cache headers，防止 `temporary_password` 外泄。

## 6. 管理端工作包

- 在 `apps/admin/src/features/operations/contracts.ts` 增加成功 payload schema，确保该 feature API 按共享 `ApiClient` 已解包后的 `data` 解析，而不重复解析外层信封。
- 在操作员列表为有该权限且 target 可操作时提供“重置密码”操作；前端规则仅用于减少误操作，所有条件仍由后端复验。
- 使用项目既有 `ConfirmDialog/Dialog`：明确不可逆提示、target 名称、确认/cancel、提交中禁用，防止双击重复命令。
- 成功后只在局部 result dialog/state 展示与复制临时密码；关闭、导航、刷新或 mutation 生命周期结束即销毁。禁止写入 URL、localStorage、query cache、toast 文本或列表数据。
- 网络/未知响应错误不自动重试；提示管理员无法恢复该秘密，可按业务权限重新发起新的重置。
- 更新认证上下文、路由 guard 和 change-password 视图以响应受限登录状态：强制进入既有改密流程，不能通过前端导航绕过后端限制。

## 7. 验证策略（先测试关键安全性质）

| 测试 | 层级 | 证明 |
| --- | --- | --- |
| TC-001 | 后端集成 | 成功调用更新 hash、设置 flag、撤销所有 sessions、写无秘密 audit，并仅响应一次临时密码。 |
| TC-002/003 | 路由 + 服务 | 缺权限、inactive、self、super-admin 层级拒绝，零状态变化。 |
| TC-004 | 数据库集成 | 分别注入 credential、Session、audit 失败，断言整个事务回滚。 |
| TC-005 | API + 前端单元 | `no-store`；日志/audit/读取 payload/state 中无临时密码；关闭后不能再次读取。 |
| TC-006 | Identity + 路由集成 | 临时密码登录仅允许 own-password change/logout；改密成功清 flag 并撤销会话。 |
| TC-007 | 前端组件 | 网络失败不重试、不显示旧密码，允许用户明确重新发起命令。 |
| 无障碍回归 | Playwright + axe | Dialog 名称、描述、焦点移动/恢复、错误与复制反馈可访问。 |

实施期间先为 TC-001、TC-003、TC-004、TC-006 编写失败测试，再写功能代码。执行现有 backend/admin 类型检查及相关测试；数据库 migration 按仓库规定运行验证。

## 8. 需求可追溯

| Spec / story | 计划落点 | 验证 |
| --- | --- | --- |
| US-001、FR-001 | B2/B3、管理端 reset mutation 与 dialog | TC-001、TC-005 |
| US-002、FR-002、FR-005、FR-006 | B2/B3、前端受控局部秘密状态 | TC-002、TC-003、TC-004、TC-005、TC-007、axe |
| US-003、FR-003、FR-004、FR-007 | B1、受限认证 guard、own-password change | TC-001、TC-004、TC-006 |

## 9. 实施顺序与风险控制

1. 先生成 migration plan，确认当前迁移序号和 rollout/rollback 验证。
2. 建立 migration、Identity port 和事务测试，再实现 Operations orchestration/audit/route。
3. 补认证受限状态与 own-password 清标记，完成 TC-006。
4. 接入管理端交互，完成秘密生命周期和无障碍测试。
5. 执行 API 合约、权限文档、追踪矩阵与全链路验证。

最大风险是“受限认证状态在某条路由漏拦截”与“事务边界被跨模块调用打破”。两者分别以后端 allowlist 集成测试和失败注入事务测试作为放行条件；不以 UI 隐藏或人工检查替代。
