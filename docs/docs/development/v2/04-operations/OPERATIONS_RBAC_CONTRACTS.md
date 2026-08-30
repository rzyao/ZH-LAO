---
status: frozen
phase: 4
phase_name: Operations Domain
document: OPERATIONS_RBAC_CONTRACTS
last_updated: 2026-08-31
repository_commit_audited: d7b4ed1f204164bde39bf4cf4db324101ef15651
database_authority:
  - database/v2/migrations/0200_operations.sql
depends_on:
  - ../02-identity/IDENTITY_IMPLEMENTATION_REPORT.md
  - ../03-platform/PLATFORM_DESIGN_AUDIT.md
implementation_started: false
---

# ZH-LAO V2 — Operations RBAC Contracts

> 本文冻结 Operations V1 的 Operator lifecycle、RBAC、Permission Catalog、Authorization、Audit 与 Bootstrap 契约。
>
> 本文不修改 frozen migration，不实现 Operations，不新增第 6 张表，不建立管理员独立认证系统。

## 1. Domain Boundary

Operations canonical responsibilities：

```text
Operator identity mapping
RBAC
Role assignment
Permission assignment
Admin authorization control plane
Operator audit trail
```

Operations 不拥有：

```text
Identity authentication/session/JWT/OTP/password
Platform runtime state
Content canonical state
Trust moderation/enforcement state
Commerce canonical state
Rewards canonical state
```

跨 Domain 管理动作的规则固定为：

```text
Operations decides WHO MAY ACT
Owner Domain decides WHAT THE BUSINESS ACTION MEANS
Operations records WHO ACTED after a successful accepted action
```

## 2. Frozen Database Contract

Operations 仍严格为 5 张表：

```text
operations.operators
operations.roles
operations.operator_roles
operations.role_permissions
operations.operator_audit_logs
```

`0200_operations.sql` 不修改。

关键物理事实：

- Operator / Role / Audit Log `id` 都是 UUID；不存在 internal BIGINT API 泄漏问题。
- `operators.auth_subject_id UUID UNIQUE` 是 Identity stable logical UUID，无跨域 FK。
- `operator_roles` 使用 `PK(operator_id, role_id)` 与反向索引 `(role_id, operator_id)`。
- `role_permissions` 使用 `PK(role_id, permission_key)`。
- Audit target 是 polymorphic logical reference；跨 Domain 无 physical FK。
- Operator / Role 只有 `active | disabled`。
- Audit 表无 `result/status` 字段；V1 不通过迁移补字段。

## 3. Operator Lifecycle — FROZEN

### 3.1 Becoming an Operator

V1 不允许 Operator 自助注册。

成为 Operator 只有两条受控路径：

1. 系统第一次初始化：本地/部署环境中的 one-time bootstrap CLI。
2. 初始化以后：已认证且拥有 `operations.operators.create` 的 active Operator 通过 Admin Management API 创建。

创建 Operator 必须提供 Identity `auth_subject_id`。Operations 只能通过 `identity/public` 验证：

```text
Identity subject exists
AND Identity status = active
```

Operations 禁止读取 `identity.*` 表、Identity repository、Identity internal BIGINT。

### 3.2 Self Registration

```text
Operator self-registration = NOT_SUPPORTED
Public operator signup endpoint = FORBIDDEN
```

### 3.3 Operator Mutable Fields

创建后：

```text
id              immutable
auth_subject_id immutable
display_name    mutable
status          active <-> disabled
```

不允许把一个已有 Operator 重新绑定到另一个 Identity subject；否则历史 Audit actor identity 会失去稳定含义。

### 3.4 Disable

`disabled` 立即使该 Operator 在新的 authorization decision 中失去全部权限。

禁用时：

- 不删除 Operator；
- 不删除 `operator_roles`；
- 不删除历史 audit；
- 不撤销 Identity account/session；
- 未来重新 enable 后，原有 active Role assignment 会再次参与权限计算。

### 3.5 Enable

Enable 前必须通过 `identity/public` 再确认对应 Identity subject 当前存在且 `active`。

如果 Identity account inactive/closed：

```text
EnableOperator = rejected
```

### 3.6 Identity Account Status

Foundation/Identity AuthenticationProvider 已在每个受保护请求中校验 Identity subject 当前为 `active`。因此：

```text
Identity inactive/closed
→ authentication produces no AuthContext
→ Admin authorization cannot start
```

Operations 不复制 Identity account status，也不缓存第二份状态。

### 3.7 Delete

```text
Operator physical delete = NOT_SUPPORTED
Operator soft delete     = NOT_SUPPORTED
```

生命周期终止只使用 `status=disabled`。

## 4. Role Model — FROZEN

### 4.1 Flat RBAC

Role 是 permission 的平面集合：

```text
Operator
  -> zero or more Roles
  -> zero or more exact Permission keys per Role
```

V1 无 role hierarchy、priority、deny rule、direct operator permission。

### 4.2 Built-in Role

V1 只冻结一个 code-level reserved role：

```text
super_admin
```

`super_admin` 的 authorization semantics 与普通 Role 完全相同：

```text
NO bypass
NO is_super_admin flag
NO wildcard
NO implicit allow
```

它必须通过 `role_permissions` 显式拥有 Permission Catalog 中的全部当前权限。

保护策略：

- `code=super_admin` 保留；
- 不允许 disable；
- 不允许把其 permission set 改成“少于完整 catalog”；
- name/description 可修改；
- code 不可修改；
- 可分配给多个 Operator。

### 4.3 Custom Roles

```text
Custom roles = SUPPORTED
```

有权限的 Operator 可以创建自定义 Role。

创建：

- code 必须 lower_snake_case；
- code 唯一；
- 初始 status=active；
- permission 初始可为空，随后使用 SetRolePermissions 配置。

### 4.4 Role Mutation

```text
code        immutable
name        mutable
description mutable
status      active <-> disabled
```

Role disabled 后：

- 已有 `operator_roles` 保留；
- 已有 `role_permissions` 保留；
- authorization 立即忽略该 Role 的所有 Permission；
- re-enable 后原关系重新生效。

Role physical delete / soft delete 均不支持。

## 5. Role Assignment — FROZEN

### 5.1 Multiple Roles

```text
Multiple roles per Operator = YES
```

### 5.2 Assign

只有：

```text
target Operator active
AND target Role active
```

时允许建立新 assignment。

重复 Assign 使用 idempotent semantics：

```text
already assigned -> success/no-op
```

数据库 `PK(operator_id, role_id)` 是最终并发唯一性保护。

### 5.3 Revoke

Role assignment 可以撤销，物理删除 `operator_roles` 当前关系。

重复 revoke：

```text
already absent -> success/no-op
```

只有真实发生关系变化时写 Operator Audit。

### 5.4 Last Super Admin Protection

V1 必须防止 Operations 自己把系统锁死。

会减少可用 `super_admin` 的操作包括：

```text
DisableOperator(super-admin operator)
RemoveRoleFromOperator(super_admin)
```

这些路径必须共享同一 serialisation point：

```text
SELECT super_admin role FOR UPDATE
```

然后在同一 Operations transaction 中确认：

```text
remaining active operators assigned to active super_admin >= 1
```

否则：

```text
409 LAST_SUPER_ADMIN_REQUIRED
```

因为 `super_admin` 本身不可 disabled，且其权限不可被裁减为不完整 catalog，所以无需为另外两条路径建立分叉规则。

此 invariant 只覆盖 Operations 可控制的状态。Identity 独立关闭最后一个 super-admin 的 Identity account 属于跨域身份恢复事件，Operations 不得通过认证后门绕过 Identity。

## 6. Permission Grammar — FROZEN

Canonical grammar：

```text
<domain>.<resource>.<action>
```

Application-level contract **严格三段**。数据库 regex 允许三段以上只是物理层的宽格式保护；Operations application/catalog 不接受四段或更多段。

每段：

```text
lower_snake_case
^[a-z][a-z0-9_]*$
```

### 6.1 Domain Token

Domain token 使用稳定的 code/schema namespace：

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

`Audio Production` 的 permission domain token 固定为 `audio`；`Trust & Safety` 固定为 `trust`。

### 6.2 Resource Token

Resource 使用 **plural lower_snake_case capability/resource family**。

例如已冻结 Platform contract 使用：

```text
feature_flags
runtime_configs
app_versions
announcements
regions
```

Operations V1 使用：

```text
operators
roles
operator_roles
role_permissions
audit_logs
```

禁止同一资源同时出现 singular/plural 两套 key。

### 6.3 Action Token

Action 也是 exact lower_snake_case token，但不是一个全系统固定 CRUD enum。

每个 action 必须由 canonical Permission Catalog 明确注册。Owner Domain 的产品语义可以使用 `publish`, `review`, `resolve` 等具体行为；未注册 action 一律无效。

### 6.4 Wildcards

以下全部不支持：

```text
*
platform.*
platform.feature_flags.*
*.roles.read
```

Authorization 只比较 exact Permission key。

### 6.5 No Super Admin Bypass

```text
if role.code == super_admin -> allow all
```

这种逻辑明确禁止。

Super Admin 只是显式拥有全部 catalog rows 的受保护 Role。

## 7. Canonical Permission Catalog — FROZEN STRATEGY

Permission 的权威是代码，不是数据库自由字符串。

目标位置：

```text
apps/backend/src/modules/operations/public/permissions.ts
```

建议导出：

```text
OperatorPermissionKey
OPERATOR_PERMISSION_CATALOG
isOperatorPermissionKey()
assertOperatorPermissionKey()
```

其他 Domain 只能依赖 `operations/public` 中的 permission constants/types，不得自己复制字符串 registry，也不得查 `operations.role_permissions`。

### 7.1 Operations V1 Keys

```text
operations.operators.read
operations.operators.create
operations.operators.update
operations.operators.disable
operations.operators.enable

operations.roles.read
operations.roles.create
operations.roles.update
operations.roles.disable
operations.roles.enable

operations.operator_roles.read
operations.operator_roles.assign
operations.operator_roles.revoke

operations.role_permissions.read
operations.role_permissions.set

operations.audit_logs.read
```

### 7.2 Platform Keys Already Frozen by Platform Design

Operations 必须原样接纳 Platform 已冻结的 10 个 keys：

```text
platform.feature_flags.read
platform.feature_flags.write
platform.runtime_configs.read
platform.runtime_configs.write
platform.app_versions.read
platform.app_versions.write
platform.announcements.read
platform.announcements.write
platform.regions.read
platform.regions.write
```

### 7.3 Future Domains

Content / Learning / Audio / Social / Chat / Commerce / Rewards / Trust 的 exact admin permission keys **本会话不提前发明**。

规则是：

```text
Owner Domain freezes management capability/API
→ exact permission requirement is added to Operations catalog
→ super_admin explicit set is synchronized to full catalog
```

数据库不允许任意“创建 permission”。

## 8. Permission Assignment Mutation Model — FROZEN

V1 只提供一种 Role permission mutation：

```text
SetRolePermissions(role_id, complete_permission_set)
```

不同时再提供 GrantPermissionToRole / RemovePermissionFromRole，避免三套等价 mutation semantics。

规则：

1. request 必须是完整 exact key set；
2. 所有 key 必须存在于 code catalog；
3. array 内不允许重复；
4. custom Role 允许空 set；
5. transaction 内 `SELECT role FOR UPDATE`；
6. 计算 added / removed；
7. 删除 removed rows；
8. 插入 added rows；
9. 无变化时 success/no-op，不写 mutation audit；
10. `super_admin` 只接受“恰好等于当前完整 catalog”的 set。

并发 replace 因 Role row lock 串行化；V1 采用 serialized last-completed-write semantics，不增加 version 字段。

## 9. Authorization Algorithm — FROZEN

管理请求统一流程：

```text
Request
↓
Foundation requireAuthentication(Identity AuthenticationProvider)
↓
AuthContext(subjectId = Identity public UUID)
↓
Operations resolve operator by auth_subject_id
↓
operator exists?
↓
operator.status == active?
↓
load active roles
↓
load role_permissions
↓
union exact permissions
↓
required key exists?
↓
Owner Application Use Case
↓
Audit successful accepted mutation when required
```

Effective permissions：

```text
if operator.status != active:
    DENY ALL

permissions = UNION(permission keys of every active assigned role)
```

No Role => empty permission set.

Disabled Role => ignored.

Duplicate permission through multiple Roles => one effective key.

Identity disabled/closed => AuthenticationProvider rejects before Operations authorization.

### 9.1 Authorization Linearization

V1 不缓存 authorization。

每次受保护请求从 PostgreSQL 读取当前 Operator/Role/Permission state。

对于 Operations 自己的 mutation，应尽量在同一 Operations transaction 中授权/锁定 actor 与执行 mutation。

对于跨 Domain owner write：

```text
authorization decision is the admission linearization point
```

如果 Operator/Role 在该 decision 之后被并发禁用，已经被接纳并进入 owner Domain 的 in-flight action 不做跨域 distributed rollback；后续请求立即使用新状态并拒绝。

## 10. Public Authorization Contract — FROZEN

未来稳定 public boundary：

```text
apps/backend/src/modules/operations/public/
```

应至少暴露概念能力：

```text
OperationsAuthorizer
  requirePermission(authContext, permissionKey)

OperationsOperatorResolver
  resolveCurrentOperator(authContext)

OperationsAuditRecorder
  recordSuccessfulAction(...)

OperatorPermissionKey + catalog constants/validator
```

`requirePermission()` 返回安全的 `AuthorizedOperatorContext`，至少包含 stable `operatorId` 与 `authSubjectId`，用于 owner Domain attribution。

禁止 public export：

```text
repositories
DatabaseExecutor
TransactionManager
DB rows
SQL
internal persistence models
Fastify request handlers
```

其他 Domain 禁止直接查 operations tables。

## 11. Admin Backend Authorization Contract — FROZEN

所有 `/api/v1/admin/**` 业务管理路由的安全模型：

```text
Authentication = Foundation/Identity
Authorization  = Operations
Business write = Owner Domain
Audit actor    = Operations Operator UUID
```

Backend 是最终权限执行点。Admin 前端 `PermissionGuard/can()` 只改善 UI，不构成安全边界。

概念性 route composition：

```text
requireAuthentication
→ require exact Operations permission
→ invoke owner use case
→ record required successful operator action
```

不得在每个 Domain 重新实现一套 Role/Permission SQL。

## 12. Audit Contract — FROZEN

### 12.1 What `operator_audit_logs` Means

它是：

```text
canonical fact that an authenticated/authorized Operator action
was accepted and successfully executed by the application
```

它不是：

```text
HTTP access log
login log
security denial log
exception log
business fact store
```

Trust Decision/Enforcement、Commerce Refund、Platform Feature Flag state 等 canonical fact 仍由 owner Domain 保存。

### 12.2 Who / Did What / To What / When / Request Context

映射：

```text
who             -> operator_id
did what        -> action_key
to what         -> target_domain + target_type + target_id
when            -> created_at
request context -> request_id + ip_address + whitelisted details
```

### 12.3 Result Semantics Under Frozen Schema

Frozen DB **没有 result/status 字段**，现有 frozen database semantics 也明确 Audit 只记录已接受并执行动作。

因此 V1 result contract 冻结为：

```text
persisted operator_audit_logs row => result is implicitly SUCCESS
```

以下不会伪装成 Audit row：

```text
authentication failure
authorization denial
validation rejection
owner-domain business failure
unexpected exception before successful commit
```

它们进入 Foundation security/application/observability logs。

`result=failed` filter 因数据库契约无法表达，V1 `NOT_SUPPORTED`。

禁止把 `result` 偷塞进 `details` 来制造第二套隐式字段。

### 12.4 Actions That MUST Audit

Operations 自身所有真实 state mutation：

```text
operator create/update/disable/enable
role create/update/disable/enable
role assignment/revoke
role permission set
initial bootstrap
```

其他 Domain：

```text
state-changing Admin management commands MUST audit
read-only list/detail does not audit by default
```

未来敏感 export/read 如确有合规需求，再单独冻结为 audited read use case。

### 12.5 Operations Audit Action Keys

```text
operations.operators.create
operations.operators.update
operations.operators.disable
operations.operators.enable
operations.roles.create
operations.roles.update
operations.roles.disable
operations.roles.enable
operations.operator_roles.assign
operations.operator_roles.revoke
operations.role_permissions.set
operations.bootstrap.initialize
```

Audit action key 与 permission key 都使用三段 grammar，但不要求一一相同；例如 Platform 可能用 broad `platform.feature_flags.write` 授权，而 Audit 使用具体 `platform.feature_flags.create/update/retire` action。

### 12.6 Target Semantics

Operations targets：

- Operator mutation：`operations / operator / operator UUID`
- Role mutation：`operations / role / role UUID`
- Role assignment：target Operator UUID，Role UUID 放 whitelisted details
- Permission set：target Role UUID，added/removed keys 放 whitelisted details

跨 Domain target 如果 owner 有 stable UUID logical/public ID，则写 `target_id`。

如果 owner 的稳定管理 identifier 是 natural key/composite key 且 frozen schema 没有 public UUID（例如部分 Platform resources）：

```text
target_domain + target_type are set
target_id = NULL
stable natural key is stored only in small whitelisted details
```

不得发明外域 UUID。

### 12.7 Details Policy

`details` 只能存 action-specific 小型安全上下文：

```text
role_id
added_permission_keys
removed_permission_keys
feature_flag_key
region_code
client_platform/build_number
reason_code
```

禁止：

```text
password/token/authorization header
OTP/session secret
complete user profile/order/chat message
payment credential/card data
raw request body dump
large before/after business object snapshot
```

### 12.8 Transaction Boundary

Operations 自身 mutation：

```text
Operations canonical write
+
operator_audit_logs INSERT
= SAME Operations transaction
```

跨 Domain mutation：

```text
Operations authorize
→ Owner Domain commits canonical state
→ Operations synchronously records success audit
```

禁止 Operations transaction 包住另一个 Domain 的 database write；禁止 direct SQL 写 `platform.*` / `trust.*` 等。

当前 Platform Design 明确 `Platform Outbox events = NONE REQUIRED IN V1`，本会话不反向修改该冻结结论。因此 V1 不新增跨域 audit outbox contract。

如果 owner write 已 commit 而 Audit insert 随后失败：

- 不伪造 owner rollback；
- server 必须 critical log `request_id`、operator、action、target；
- Admin response 使用稳定 internal error 表达“canonical action may already be committed; refresh before retry”；
- 该 durability gap 记录为 V1 TECH_DEBT；未来若要 outbox-backed audit，必须作为显式跨域 contract revision 设计。

## 13. Audit Query Contract

Schema 支持的 V1 filters：

```text
operator_id
action_key
target_domain
target_type
target_id
request_id
created_at from/to
```

不支持：

```text
result filter
free-text details search
arbitrary JSONPath query
```

默认 `created_at DESC`，使用 bounded cursor pagination。

## 14. Bootstrap First Operator — FROZEN

### 14.1 Mechanism

只使用 one-time controlled CLI，不提供 HTTP bootstrap endpoint，不使用默认账号密码。

概念 command：

```text
pnpm operations:bootstrap --auth-subject-id <uuid> --display-name <name>
```

正式命令名在 Implementation 阶段按 backend scripts convention 落地，但 contract 不改变。

### 14.2 Preconditions

```text
operations.operators count == 0
Identity public summary exists
Identity status == active
```

只要已有任何 Operator：

```text
BOOTSTRAP_ALREADY_COMPLETED
```

因此 bootstrap 不能长期充当创建管理员后门。

### 14.3 Atomic Operations State

在一个 Operations transaction 中：

1. ensure/create reserved `super_admin` Role；
2. set its explicit permission rows to full current catalog；
3. create first Operator；
4. assign super_admin；
5. insert `operations.bootstrap.initialize` audit row，actor 为刚创建的 Operator。

无默认用户名/password；认证能力仍完全来自 Identity。

## 15. Cache / Performance Decision

V1：

```text
PostgreSQL direct authorization read = YES
Redis = NO
in-process permission cache = NO
```

理由：

- Operator 数量与 Admin QPS 很小；
- RBAC 是安全控制面，stale permission 风险大于当前性能收益；
- 一个 join/query 可完成 operator + active roles + permissions resolution；
- no-cache 自动获得 disable/role/permission 更新的下一请求可见性。

只有 profiling 证明需要时才重新设计 bounded cache + explicit invalidation。

## 16. Concurrency Rules — FROZEN

| Race | V1 rule |
|---|---|
| same role concurrent assignment | composite PK guarantees uniqueness; idempotent assign |
| same role concurrent revoke | DELETE 0/1 row; idempotent revoke |
| role disabled during authorization | DB current state at authorization linearization point; next request sees disabled |
| operator disabled during authorization | same as above; no auth cache |
| concurrent SetRolePermissions | `SELECT role FOR UPDATE`, serialized replacement |
| concurrent last-super-admin reduction | lock `super_admin` role row, then re-count before mutation |
| duplicate operator for same auth subject | UNIQUE(auth_subject_id), map to stable conflict |
| duplicate role code | UNIQUE(code), map to stable conflict |

Raw PostgreSQL constraint names / SQLSTATE must not escape API boundary.

## 17. REQUIRED / DEFERRED / NOT_SUPPORTED Policy Summary

REQUIRED V1 capabilities are detailed in `OPERATIONS_USE_CASES.md`.

Explicitly DEFERRED：

```text
reliable outbox-backed cross-domain audit delivery
sensitive read/export auditing policy
operator invitation workflow
admin MFA policy enforcement (Identity-owned)
```

Explicitly NOT_SUPPORTED in Operations V1：

```text
Operator physical deletion
Role physical deletion
Custom permission creation
Wildcard permissions
Per-operator direct permissions
Temporary/expiring role assignments
Role hierarchy
Permission deny rules
ABAC
Resource-level ACL
Approval workflow
```

## 18. Frozen Result

```text
Operator Lifecycle        = FROZEN
Role Model                = FROZEN
Role Assignment           = FROZEN
Permission Grammar        = FROZEN
Permission Catalog        = FROZEN
Authorization Algorithm   = FROZEN
Audit Contract            = FROZEN
Bootstrap Strategy        = FROZEN
Cache Decision            = NO CACHE
Outbox Decision           = NO NEW V1 OUTBOX CONTRACT
```

STOP: this document does not start Operations Implementation.
