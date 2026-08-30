---
status: frozen
last_updated: 2026-08-31
revision: "Operations V1 application/RBAC/audit/API design gate PASS; 5-table database contract unchanged"
schema: operations
source_conversation_id: 6a9351a6-17b8-83ea-b172-5f58121a431f
source_share_url: https://chatgpt.com/share/6a9351a6-17b8-83ea-b172-5f58121a431f
---

# Operations 域

Operations Domain = **内部运营后台的身份映射、RBAC 授权控制面与 Operator 操作审计域**。

它回答三个问题：

1. 谁是后台 Operator；
2. 当前 Operator 可以做什么；
3. 哪个 Operator 成功执行过什么管理动作。

Operations 不是业务状态聚合层。Platform / Content / Trust / Commerce / Rewards 等 canonical state 始终由各自 Domain 保存。

## Canonical Application Design

PHASE 4 application design 已于 2026-08-31 完成并通过：

```text
OPERATIONS_DESIGN_GATE = PASS
OPERATIONS_IMPLEMENTATION_STARTED = NO
```

权威设计文档：

- [Operations Implementation Plan](../../development/v2/04-operations/OPERATIONS_IMPLEMENTATION_PLAN.md)
- [Operations Use Cases](../../development/v2/04-operations/OPERATIONS_USE_CASES.md)
- [Operations RBAC Contracts](../../development/v2/04-operations/OPERATIONS_RBAC_CONTRACTS.md)
- [Operations API / Public Contract](../../development/v2/04-operations/OPERATIONS_API.md)
- [Operations Design Audit](../../development/v2/04-operations/OPERATIONS_DESIGN_AUDIT.md)

数据库字段、FK、CHECK、INDEX 与删除策略仍以 [Operations 数据库总览](database.md) 与 `database/v2/migrations/0200_operations.sql` 为 frozen authority；本次 Design Gate 没有修改 migration。

## 一句话边界

```text
Operations = Operator mapping + RBAC + Admin authorization + Operator audit
Identity   = authentication / account / token / session canonical owner
Platform   = platform runtime state canonical owner
Owner Domain = its own business state canonical owner
```

## 最终 5 张表

| 子域 | 实体 | 表 | 职责 |
| --- | --- | --- | --- |
| Operator | Operator | `operations.operators` | Identity stable UUID ↔ 后台 Operator 映射与 active/disabled 状态 |
| RBAC | Role | `operations.roles` | 平面 Role |
| RBAC | OperatorRole | `operations.operator_roles` | Operator ↔ Role assignment |
| RBAC | RolePermission | `operations.role_permissions` | Role ↔ exact permission key |
| Audit | OperatorAuditLog | `operations.operator_audit_logs` | 成功、已接受的 Operator 管理动作 append-only 事实 |

```text
operations
├── operators
├── roles
├── operator_roles
├── role_permissions
└── operator_audit_logs
```

禁止增加 Permission dictionary table 或第 6 张 Operations 核心业务表。

## Identity Boundary

`operators.auth_subject_id`：

```text
UUID
UNIQUE
Identity stable logical/public subject reference
NO cross-domain FK
```

正式请求链路：

```text
Foundation / Identity Authentication
→ AuthContext(subjectId)
→ Operations resolve Operator by auth_subject_id
→ RBAC authorization
```

Operations 只能依赖 `apps/backend/src/modules/identity/public/`，禁止直接依赖 Identity repositories、application/infrastructure 或 SQL tables。

Operations 不实现：password、OTP、JWT issuing、session、独立管理员用户名密码。

## Operator Lifecycle

V1 已冻结：

```text
self registration = NO
create operator   = authorized Operator management action
first operator    = one-time controlled CLI bootstrap
status            = active | disabled
physical delete   = NO
soft delete       = NO
auth_subject_id   = immutable after create
```

Create / Enable 必须通过 `identity/public` 确认 Identity subject 当前存在且 active。

Operator disabled 后所有新的 authorization decision 立即 deny；角色关系和历史审计保留。重新 enable 后，已有 active Role assignment 重新参与权限计算。

Identity account inactive/closed 时，现有 Identity AuthenticationProvider 不产生可用 AuthContext，因此 Admin authorization 无法进入 Operations。

## Role Model

Role 是 exact permissions 的平面集合：

```text
Operator
→ zero or more Roles
→ exact Permission union
```

Role：

```text
code        UNIQUE + lower_snake_case + immutable
name        mutable
description mutable
status      active | disabled
physical delete = NO
```

Disabled Role 的 assignment/permissions 保留，但 authorization 完全忽略该 Role。

V1 允许自定义 Role。

## `super_admin`

`super_admin` 是唯一冻结的 code-level reserved Role。

它不是 bypass：

```text
NO is_super_admin field
NO wildcard
NO role-code allow-all branch
```

它仍通过 `role_permissions` 显式拥有 canonical Permission Catalog 中的全部当前 keys。

保护规则：

- 不允许 disable；
- 不允许 permission set 少于完整 catalog；
- 可以分配给多个 Operator；
- DisableOperator / revoke super_admin assignment 不得导致 active super-admin Operator 数量变成 0。

Last-admin race 通过对 `super_admin` Role row 的共享 `SELECT ... FOR UPDATE` serialization point + transaction re-count 解决，不新增数据库字段。

## Permission Model

Canonical grammar：

```text
<domain>.<resource>.<action>
```

Application contract 严格三段；全部 lower_snake_case。

Domain token：

```text
identity
platform
operations
content
learning
audio
social
chat
commerce
rewards
trust
```

Resource 统一使用 plural lower_snake_case capability family。

V1 authorization 只支持 **exact permission key**：

```text
wildcard            = NO
deny permission     = NO
role hierarchy      = NO
role priority       = NO
direct user permission = NO
ABAC                = NO
resource ACL        = NO
```

## Permission Catalog Authority

不建 `operations.permissions` 表。

Permission 的权威来自 Operations code-level static catalog，未来目标 public path：

```text
apps/backend/src/modules/operations/public/permissions.ts
```

数据库只存 Role 当前拥有的 exact key；写入前应用层必须验证 key 属于 catalog。

当前设计冻结：

```text
Operations exact keys = 16
Platform exact keys   = 10 (from frozen Platform Design)
Current catalog total = 26
```

后续 Content/Learning/Audio/Social/Chat/Commerce/Rewards/Trust 的 exact keys 只有在各自 Admin capability/API 冻结后才加入，不提前发明。

Role permission mutation V1 只保留：

```text
SetRolePermissions(role_id, complete_permission_set)
```

不同时提供 grant/remove/replace 三套等价 API。

## Authorization Semantics

```text
Identity authenticated
→ Operator exists
→ Operator active
→ active assigned Roles
→ union exact role_permissions
→ required exact key exists
```

- multiple roles = permission union；
- disabled Role = ignored；
- disabled Operator = deny all；
- no Role = empty permission set；
- super_admin = explicit rows only；
- Redis/in-process permission cache = NO in V1。

## Audit Semantics

Operations Audit 是：

```text
who             -> operator_id
did what        -> action_key
to what         -> target_domain/target_type/target_id
when            -> created_at
request context -> request_id/ip_address/details
```

Frozen DB 没有 `result` 字段，且数据库文档已冻结“只记录已接受并成功执行的 Operator action”。因此：

```text
persisted operator_audit_logs row => implicit result = success
```

认证失败、权限拒绝、validation/business failure、pre-commit exception 进入 security/application/observability logs，不伪造 failed Audit row，也不把 `result` 偷塞进 `details`。

Audit 不替代业务事实：

```text
Trust decision/enforcement -> Trust
Commerce refund            -> Commerce
Platform feature/config    -> Platform
Operator action trail      -> Operations
```

### Audit Transaction Boundary

Operations 自己的 mutation：

```text
state mutation + audit INSERT = same Operations transaction
```

跨 Domain management mutation：

```text
Operations authorize
→ Owner Domain commits canonical state
→ Operations synchronously records success Audit
```

不允许 Operations transaction 包住另一个 Domain write，不允许 Operations direct SQL 外域表。

当前 Platform Design 已冻结 `Platform Outbox events = NONE REQUIRED IN V1`，所以本次 Operations Design 不反向引入 Platform audit outbox。Owner commit 后 Audit persistence 失败的 durability gap 已在 Design Audit 记录为 V1 MEDIUM TECH_DEBT，未来要改为 outbox 必须单独做跨域 contract revision。

## Bootstrap

系统第一个 Operator 通过 one-time controlled CLI 初始化：

```text
active Identity subject
+ empty operations.operators
→ reserved super_admin
→ full explicit permission catalog rows
→ first Operator
→ super_admin assignment
→ bootstrap audit
```

全部 Operations state 在一个本域 transaction 完成。

禁止：

```text
admin/admin
public bootstrap HTTP
long-lived bootstrap secret
```

一旦存在任何 Operator，bootstrap 必须拒绝再次执行。

## Admin Foundation Contract

Admin Foundation 已提供 Auth/Permission skeleton。

Operations 完成后真实绑定：

```text
Identity access token
→ GET /api/v1/admin/operations/me
→ current Operator + exact effective permissions
→ Admin PermissionGuard/can() (UI only)
→ backend OperationsAuthorizer (real enforcement)
```

Operations HTTP base：

```text
/api/v1/admin/operations
```

Backend public boundary未来固定在：

```text
apps/backend/src/modules/operations/public/
```

概念 exports：

```text
OperationsAuthorizer
OperationsOperatorResolver
OperationsAuditRecorder
AuthorizedOperatorContext
OperatorPermissionKey / static catalog
```

禁止 public export repositories / DB executor / transaction manager / SQL / DB rows。

## Platform Boundary

截至 Operations Repository Audit 的基线 commit：

```text
PLATFORM_DESIGN_GATE = PASS
PLATFORM_IMPLEMENTATION_STARTED = NO
PLATFORM_FINAL_GATE = NOT_RUN
```

Operations 原样接纳 Platform 已冻结的 10 个 RBAC keys，但 Platform management route 实际接入属于 `IMPLEMENTATION_DEPENDENCY`。

Operations 不写 `platform.*`，不复制 Feature Flag / Runtime Config / App Version / Announcement / Region state。

## Delete Strategy

| 表 | 物理删除 | 正确策略 |
| --- | ---: | --- |
| `operators` | NO | `status=disabled` |
| `roles` | NO | `status=disabled` |
| `operator_roles` | YES | revoke relation；历史进 Audit |
| `role_permissions` | YES | complete-set reconciliation；历史进 Audit |
| `operator_audit_logs` | NO | append-only |

## V1 Explicit Non-Goals

```text
Permission dictionary table
Operator physical deletion
Role physical deletion
Custom permission creation
Wildcard permissions
Per-user direct permissions
Temporary roles
Role hierarchy
Permission deny rules
ABAC
Resource-level ACL
Approval workflow
Independent admin authentication system
Redis/Kafka/microservice
```

## Current Domain Status

```text
Operations frozen database tables = 5
Operator Lifecycle                = FROZEN
RBAC Model                        = FROZEN
Permission Grammar                = FROZEN
Authorization Algorithm           = FROZEN
Audit Contract                    = FROZEN
Bootstrap Strategy                = FROZEN
Public Contract                   = FROZEN
HTTP/API Contract                 = FROZEN
OPERATIONS_DESIGN_GATE            = PASS
OPERATIONS_IMPLEMENTATION_STARTED = NO
```
