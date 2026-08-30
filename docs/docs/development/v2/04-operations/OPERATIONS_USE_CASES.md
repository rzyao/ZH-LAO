---
status: frozen
phase: 4
phase_name: Operations Domain
document: OPERATIONS_USE_CASES
last_updated: 2026-08-31
depends_on:
  - OPERATIONS_RBAC_CONTRACTS.md
database_authority:
  - database/v2/migrations/0200_operations.sql
implementation_started: false
---

# ZH-LAO V2 — Operations Use Cases

> Use Cases 从 Admin/Operator 产品行为推导，不从 5 张表机械生成 CRUD。

## 1. Classification

```text
REQUIRED      = 24
DEFERRED      = 4
NOT_SUPPORTED = 11
```

## 2. Product Actors

### Authenticated User

Identity 已认证但不一定是 Operator。

### Active Operator

满足：

```text
Identity authenticated
AND operations.operators exists by auth_subject_id
AND operator.status = active
```

### Authorized Operator

Active Operator 且 exact required Permission 存在于 active Role permission union。

### Bootstrap Actor

只有系统第一次初始化时，由受控 CLI 指定的 active Identity subject。不是长期 HTTP actor。

## 3. REQUIRED — Current Operator / Authorization

### OPS-UC-01 GetCurrentOperator

**Goal**：让 Admin Foundation 获取当前 Operator identity、roles、effective permissions，用于 permission-aware navigation / route/action guards。

Auth：Identity authenticated + active Operator；不要求额外 Permission。

Returns conceptually：

```text
operator_id UUID
display_name
status
roles: [{role_id, code, name}]
permissions: exact key[]
```

Rules：

- no Operator → access denied；
- disabled Operator → denied；
- disabled Roles 不出 effective permissions；
- 不暴露 repository row / internal persistence model。

### OPS-UC-02 AuthorizeOperator

**Goal**：为所有 Admin management API 提供统一 exact-permission authorization。

Input：

```text
AuthContext
OperatorPermissionKey
```

Output：authorized Operator context or stable denial error。

No wildcard / superadmin bypass / cross-domain SQL。

## 4. REQUIRED — Operator Management

### OPS-UC-03 ListOperators

Permission：`operations.operators.read`

支持小规模分页与 status filter；不提供 arbitrary search engine。

### OPS-UC-04 GetOperator

Permission：`operations.operators.read`

Identifier：Operator UUID。

### OPS-UC-05 CreateOperator

Permission：`operations.operators.create`

Input：

```text
auth_subject_id UUID
display_name
```

Rules：

1. `identity/public` subject 必须存在且 active；
2. `auth_subject_id` 不得已绑定其他 Operator；
3. 新 Operator status 固定 active；
4. 不在 CreateOperator 内创建密码/session/JWT；
5. 不自动赋任何 Role；
6. create + Operations audit 同 transaction。

Audit：`operations.operators.create`。

### OPS-UC-06 UpdateOperator

Permission：`operations.operators.update`

V1 只允许修改 `display_name`。

不允许修改：

```text
id
auth_subject_id
status through generic patch
```

Audit：只有真实变化时写 `operations.operators.update`。

### OPS-UC-07 DisableOperator

Permission：`operations.operators.disable`

Rules：

- idempotent already-disabled => success/no-op；
- 不删除 roles/audit；
- 如果目标是 active `super_admin` operator，执行 last-super-admin protection；
- 真实 active→disabled 与 audit 同 transaction。

Audit：`operations.operators.disable`。

### OPS-UC-08 EnableOperator

Permission：`operations.operators.enable`

Rules：

- Identity subject 必须当前 active；
- idempotent already-active => success/no-op；
- 原有 active Role assignments 会重新参与 authorization；
- mutation + audit same transaction。

Audit：`operations.operators.enable`。

## 5. REQUIRED — Role Management

### OPS-UC-09 ListRoles

Permission：`operations.roles.read`

支持 status filter；role code/name 可作为简单管理筛选，但不引入全文检索。

### OPS-UC-10 GetRole

Permission：`operations.roles.read`

Identifier：Role UUID。

### OPS-UC-11 CreateRole

Permission：`operations.roles.create`

Input：

```text
code
name
description optional
```

Rules：

- lower_snake_case；
- code unique；
- `super_admin` 保留，不能通过普通 CreateRole 重建/抢占；
- initial status=active；
- permissions 初始为空；
- mutation + audit same transaction。

Audit：`operations.roles.create`。

### OPS-UC-12 UpdateRole

Permission：`operations.roles.update`

可改：

```text
name
description
```

不可改：

```text
id
code
status through generic patch
```

`super_admin` 允许修改 display metadata，但 code 固定。

Audit：真实变化时 `operations.roles.update`。

### OPS-UC-13 DisableRole

Permission：`operations.roles.disable`

Rules：

- idempotent already-disabled => success/no-op；
- `super_admin` => `SYSTEM_ROLE_PROTECTED`；
- assignment/permissions 保留；
- mutation + audit same transaction。

Audit：`operations.roles.disable`。

### OPS-UC-14 EnableRole

Permission：`operations.roles.enable`

Rules：

- idempotent already-active => success/no-op；
- re-enable 后现有 assignment/permission 恢复生效；
- mutation + audit same transaction。

Audit：`operations.roles.enable`。

## 6. REQUIRED — Role Assignment

### OPS-UC-15 ListOperatorRoles

Permission：`operations.operator_roles.read`

返回当前 assignment，包括 Role 当前 status，便于 Admin 识别“已分配但 disabled”的 Role。

### OPS-UC-16 AssignRoleToOperator

Permission：`operations.operator_roles.assign`

Rules：

- target Operator 必须 active；
- target Role 必须 active；
- duplicate assignment => success/no-op；
- multiple roles supported；
- composite PK 是并发最终保护；
- real insert + audit same transaction；
- 分配 `super_admin` 时参与统一 super-admin serialization lock。

Audit：`operations.operator_roles.assign`，target=Operator UUID，details 包含 role_id/code。

### OPS-UC-17 RemoveRoleFromOperator

Permission：`operations.operator_roles.revoke`

Rules：

- absent assignment => success/no-op；
- real delete + audit same transaction；
- revoke `super_admin` 前执行 last-super-admin invariant。

Audit：`operations.operator_roles.revoke`。

## 7. REQUIRED — Permission Catalog / Role Permissions

### OPS-UC-18 ListPermissionCatalog

Permission：`operations.role_permissions.read`

Source：code-level canonical catalog，不查 permission dictionary table。

Returns：

```text
key
domain
resource
action
```

V1 不要求数据库可编辑 description/localization。

### OPS-UC-19 ListRolePermissions

Permission：`operations.role_permissions.read`

返回 exact assigned keys，并标识 Role status。

### OPS-UC-20 SetRolePermissions

Permission：`operations.role_permissions.set`

这是 V1 唯一 Role permission mutation。

Input：完整 `permission_keys[]`。

Rules：

1. exact catalog validation；
2. duplicates rejected；
3. custom Role 可空；
4. `SELECT role FOR UPDATE`；
5. transaction 内 replace；
6. no change => success/no-op；
7. `super_admin` 只允许完整 catalog set；
8. mutation + audit same transaction。

Audit：`operations.role_permissions.set`，target=Role UUID，details 只记录 added/removed key arrays。

## 8. REQUIRED — Audit Query / Recording

### OPS-UC-21 ListOperatorAuditLogs

Permission：`operations.audit_logs.read`

Supported filters：

```text
operator_id
action_key
target_domain
target_type
target_id
request_id
created_from
created_to
```

Pagination：bounded cursor，default newest first。

`result` filter 不支持，因为 frozen audit row 的 persisted result 固定隐含 SUCCESS。

### OPS-UC-22 GetOperatorAuditLog

Permission：`operations.audit_logs.read`

Identifier：Audit UUID。

返回 whitelisted details，不对 details 做自由 JSON 查询。

### OPS-UC-23 RecordSuccessfulOperatorAction

HTTP：无独立公开 endpoint。

Purpose：Operations public/application contract，供 owner Domain management orchestration 记录成功 Operator action。

Rules：

- caller 必须提供已授权 Operator context；
- action key 必须代码定义，不允许来自任意 client string；
- request context 只取 request_id / source IP / action-specific safe details；
- 不记录 failed/denied attempt；
- 不成为业务事实 source。

Operations 自身 mutations 不通过“事后跨域调用”实现，而是在本域 transaction 内直接写同一 canonical audit 表。

## 9. REQUIRED — Bootstrap

### OPS-UC-24 BootstrapFirstOperator

Surface：controlled CLI only。

Preconditions：

```text
no existing operators
active Identity subject exists
```

Effects in one Operations transaction：

```text
ensure reserved super_admin
set explicit full catalog permissions
create first operator
assign super_admin
write bootstrap audit
```

No HTTP route / no default password / no permanent bootstrap secret。

## 10. DEFERRED

### OPS-D01 ReliableCrossDomainAuditDelivery

Future option：shared outbox-backed delivery for owner-domain admin writes。

Reason deferred：Platform design currently freezes `Platform Outbox events = NONE REQUIRED IN V1`; Operations design will not silently invalidate that contract.

### OPS-D02 AuditSensitiveReadOrExport

Routine read-only admin access is not audited in V1。Future compliance requirements may classify exports or sensitive reads as auditable actions。

### OPS-D03 InviteOperator

Invitation/pending onboarding workflow is deferred。Frozen Operator schema has no invite/pending lifecycle and V1 can create Operator after Identity subject exists。

### OPS-D04 EnforceAdminMfaPolicy

Admin MFA is Identity/Auth ownership。Operations may later require an Authentication Assurance contract, but V1 does not invent MFA/session state。

## 11. NOT_SUPPORTED

```text
OPS-N01 DeleteOperator
OPS-N02 DeleteRole
OPS-N03 CreateCustomPermission
OPS-N04 AssignDirectPermissionToOperator
OPS-N05 EvaluateWildcardPermission
OPS-N06 TemporaryRoleAssignment / expiry
OPS-N07 RoleHierarchy / inheritance
OPS-N08 PermissionDenyRules
OPS-N09 ABAC
OPS-N10 ResourceLevelACL in Operations
OPS-N11 ApprovalWorkflow / four-eyes engine
```

These are not hidden implementation TODOs. They are deliberately outside Operations V1.

## 12. Idempotency Matrix

| Use Case | Retry semantics |
|---|---|
| Get/List | retry-safe |
| CreateOperator | duplicate auth subject -> stable conflict |
| CreateRole | duplicate code -> stable conflict |
| UpdateOperator/Role | repeated same value -> success/no-op |
| Disable/Enable | repeated same state -> success/no-op |
| AssignRole | repeated assignment -> success/no-op |
| RemoveRole | repeated absence -> success/no-op |
| SetRolePermissions | repeated identical complete set -> success/no-op |
| Bootstrap | once any Operator exists -> hard conflict |

No-op retries do not create duplicate Audit facts。

## 13. Cross-Domain Use Case Boundary

### Identity

Operations may call only `identity/public` for subject existence/status checks needed by Create/Enable/Bootstrap。

Authorization of an HTTP request starts from Foundation `AuthContext` produced by Identity AuthenticationProvider。

### Platform

Platform Design Gate is PASS but implementation is not started at the audited commit。

Operations can freeze and implement the Platform permission keys now，but Platform management route integration remains an implementation dependency。

Operations never updates `platform.*` directly。

### Future Owner Domains

Future Content/Learning/Audio/Social/Chat/Commerce/Rewards/Trust management actions follow：

```text
Operations authorize exact key
→ Owner Domain command
→ Operator audit according to frozen audit policy
```

This document does not define those Domain management APIs。

## 14. Final Use Case Gate

```text
Table-driven CRUD smell                    = 0
Duplicate auth system                      = 0
Cross-domain SQL                           = 0
Direct operator permission path            = 0
Wildcard/deny/hierarchy ambiguity          = 0
Unresolved Operator lifecycle decision     = 0
Unresolved Role model decision             = 0
Unresolved Permission mutation decision    = 0
Unresolved Bootstrap decision              = 0

OPERATIONS_USE_CASES = FROZEN
```

STOP: no Operations implementation starts here.
