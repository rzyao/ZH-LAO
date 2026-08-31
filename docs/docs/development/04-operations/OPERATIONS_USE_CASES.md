---
status: frozen
phase: 4
phase_name: Operations Domain
document: OPERATIONS_USE_CASES
last_updated: 2026-08-31
repository_commit_audited: 000f4c4aafacf4938d74902eddc4d78323196a89
depends_on:
  - OPERATIONS_RBAC_CONTRACTS.md
database_authority:
  - database/v2/migrations/0200_operations.sql
implementation_started: false
---

# ZH-LAO V2 — Operations Use Cases

> Use Cases 从 Admin / Operator 产品行为推导，不从 5 张表机械生成 CRUD。

## 1. Classification

```text
REQUIRED      = 24
DEFERRED      = 4
NOT_SUPPORTED = 11
```

## 2. Actors

### Authenticated Identity Subject

由 Foundation / Identity AuthenticationProvider 认证；可能还不是 Operator。

### Active Operator

```text
Identity authenticated
AND operations.operators exists by auth_subject_id
AND operator.status = active
```

### Authorized Operator

Active Operator 且所需 exact Permission 存在于所有 active assigned Roles 的 permission union。

### Bootstrap Actor

仅系统第一次初始化时，由 controlled CLI 指定的 active Identity subject；不是长期 HTTP actor。

## 3. REQUIRED — Current Operator / Authorization

### OPS-UC-01 GetCurrentOperator

**Goal**：给 Admin Foundation 提供当前 Operator、active Roles 与 effective permissions，用于 permission-aware navigation / route/action guards。

**Auth**：Identity authenticated + active Operator；无需额外 Permission。

Output：

```text
operator_id UUID
display_name
status
roles: [{role_id, code, name}]
permissions: exact key[]
```

Rules：

- no Operator -> denied；
- disabled Operator -> denied；
- disabled Role permissions 不进入 effective set；
- 不暴露 DB row/repository/internal persistence types。

### OPS-UC-02 AuthorizeOperator

**Goal**：为所有 Admin management APIs 提供唯一 RBAC enforcement path。

Input：

```text
AuthContext
OperatorPermissionKey
```

Output：`AuthorizedOperatorContext` 或稳定 denial error。

No wildcard / deny / super-admin bypass / cross-domain SQL。

## 4. REQUIRED — Operator Management

### OPS-UC-03 ListOperators

Permission：`operations.operators.read`

支持 bounded pagination + `status=active|disabled`；V1 不引入全文检索。

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

1. 使用 `IdentityPublicQueries` 验证 subject 存在且 active；
2. `auth_subject_id` 不得已绑定另一个 Operator；
3. initial status 固定 active；
4. 不创建 password/session/JWT；
5. 不自动赋 Role；
6. create + Audit 同一个 Operations transaction。

Audit：`operations.operators.create`。

### OPS-UC-06 UpdateOperator

Permission：`operations.operators.update`

V1 只允许修改 `display_name`。

不可修改：

```text
id
auth_subject_id
status through generic patch
```

只有真实变化写 `operations.operators.update` Audit。

### OPS-UC-07 DisableOperator

Permission：`operations.operators.disable`

Rules：

- already disabled -> success/no-op；
- 不删除 roles/audit；
- 若目标当前拥有 active `super_admin` assignment，执行 last-super-admin protection；
- real active->disabled + Audit 同 transaction。

Audit：`operations.operators.disable`。

### OPS-UC-08 EnableOperator

Permission：`operations.operators.enable`

Rules：

- Identity subject 必须当前 active；
- already active -> success/no-op；
- 原 active Role assignments 重新参与权限计算；
- mutation + Audit 同 transaction。

Audit：`operations.operators.enable`。

## 5. REQUIRED — Role Management

### OPS-UC-09 ListRoles

Permission：`operations.roles.read`

支持 status filter。

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
- code UNIQUE；
- reserved `super_admin` 不允许通过普通 CreateRole 抢占/重建；
- initial status=active；
- initial permission set empty；
- mutation + Audit same transaction。

Audit：`operations.roles.create`。

### OPS-UC-12 UpdateRole

Permission：`operations.roles.update`

可改：`name`, `description`。

不可改：`id`, `code`, generic `status`。

`super_admin` 允许修改 display metadata。

Audit：真实变化时 `operations.roles.update`。

### OPS-UC-13 DisableRole

Permission：`operations.roles.disable`

- already disabled -> success/no-op；
- `super_admin` -> `SYSTEM_ROLE_PROTECTED`；
- assignments/permissions 保留；
- real mutation + Audit same transaction。

### OPS-UC-14 EnableRole

Permission：`operations.roles.enable`

- already active -> success/no-op；
- re-enable 后现有 assignments/permissions 恢复参与 RBAC；
- mutation + Audit same transaction。

## 6. REQUIRED — Role Assignment

### OPS-UC-15 ListOperatorRoles

Permission：`operations.operator_roles.read`

返回当前 assignment，并带 Role status，使 Admin 可看到“已分配但当前 disabled”的 Role。

### OPS-UC-16 AssignRoleToOperator

Permission：`operations.operator_roles.assign`

Rules：

- target Operator active；
- target Role active；
- duplicate assignment -> success/no-op；
- multiple roles supported；
- composite PK 是并发最终保护；
- real insert + Audit same transaction。

Audit：`operations.operator_roles.assign`，target=Operator UUID，safe details 包含 role_id/code。

### OPS-UC-17 RemoveRoleFromOperator

Permission：`operations.operator_roles.revoke`

Rules：

- absent -> success/no-op；
- real delete + Audit same transaction；
- revoke `super_admin` 前执行 last-super-admin invariant。

Audit：`operations.operator_roles.revoke`。

## 7. REQUIRED — Permission Catalog / Role Permissions

### OPS-UC-18 ListPermissionCatalog

Permission：`operations.role_permissions.read`

Source：code-level canonical catalog，不查询 permission dictionary table。

Returns：

```text
key
domain
resource
action
```

### OPS-UC-19 ListRolePermissions

Permission：`operations.role_permissions.read`

返回 Role 当前 exact assigned keys。

### OPS-UC-20 SetRolePermissions

Permission：`operations.role_permissions.set`

V1 唯一 Role permission mutation。

Input：完整 `permission_keys[]`。

Rules：

1. exact catalog validation；
2. duplicate rejected；
3. custom Role 可空；
4. `SELECT role FOR UPDATE`；
5. transaction 内 complete replace；
6. no change -> success/no-op；
7. `super_admin` 只允许 current full catalog；
8. mutation + Audit same transaction。

Audit：`operations.role_permissions.set`，target=Role UUID，safe details 只保留 added/removed key arrays。

### Catalog Evolution Rule

新增 permission 时不自动写 DB：

```text
code catalog deployed
→ active super_admin uses existing operations.role_permissions.set
→ reconcile its explicit set to full current catalog
→ enable/use newly protected behavior
```

Bootstrap 对空系统直接写 full current catalog。

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

Pagination：bounded cursor，newest first。

不支持 `result` filter，因为 persisted row 的结果语义固定为 success。

### OPS-UC-22 GetOperatorAuditLog

Permission：`operations.audit_logs.read`

Identifier：Audit UUID。

### OPS-UC-23 RecordSuccessfulOperatorAction

HTTP：无独立 endpoint。

用途：Operations public/application contract，供 Owner Domain management orchestration 记录 successful Operator action。

Rules：

- caller 提供已授权 Operator context；
- action key 来自 code-defined action，不接受任意 client string；
- request context 只保留 request_id / normalized source IP / safe details；
- 不记录 failed/denied attempt；
- 不成为 Owner Domain business fact source。

Operations 自身 mutation 在本域 transaction 内直接写同一 audit table，不走事后跨域调用。

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
create first Operator
assign super_admin
write bootstrap Audit
```

No HTTP route / no default password / no permanent bootstrap secret。

## 10. DEFERRED

### OPS-D01 ReliableCrossDomainAuditDelivery

Future option：owner-domain outbox-backed reliable success Audit delivery。

Reason：当前 Owner Domain（包括已经 COMPLETE/PASS 的 Platform）没有冻结这个跨域 Audit event contract；本 Operations 设计不隐式重写另一个 Domain 的 outbox contract。

### OPS-D02 AuditSensitiveReadOrExport

Routine read-only Admin access V1 不写 canonical Operator Audit。未来合规需求可将特定 export/sensitive read 明确升级为 audited action。

### OPS-D03 InviteOperator

邀请/pending onboarding deferred。Frozen Operator schema 没有 invite/pending lifecycle；V1 在 Identity subject 已存在后直接创建 Operator。

### OPS-D04 EnforceAdminMfaPolicy

MFA/session assurance 属 Identity/Auth。未来如需要，Operations 只消费正式 authentication-assurance public contract，不创建自己的 MFA state。

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

这些不是隐藏 TODO，而是 V1 明确不支持。

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

No-op retries 不产生重复 Audit facts。

## 13. Cross-Domain Boundary

### Identity

Operations 只使用当前 `identity/public` 的 `IdentityPublicQueries` 做 Create/Enable/Bootstrap subject validation。

HTTP authorization 从 Foundation `AuthContext` 开始。

### Platform

Repository re-audit 当前状态：

```text
PLATFORM_DESIGN_GATE = PASS
PLATFORM_IMPLEMENTATION = COMPLETE
PLATFORM_GATE = PASS
PLATFORM_DOMAIN = FROZEN
```

Platform 已实现 33 个 required application use cases，且 runtime HTTP 已注册。Operations 可以直接冻结并未来实现其 10 个 permission keys。

Platform management HTTP authorization wiring 仍需要 Operations public authorizer；这是 **Operations/Platform integration work**，不是外部 implementation blocker。

Operations 永远不直接更新 `platform.*`。

### Future Owner Domains

```text
Operations authorize exact key
→ Owner Domain command
→ Operator Audit according to frozen policy
```

本文件不越界设计 Content/Learning/Audio/Social/Chat/Commerce/Rewards/Trust 的完整 Admin APIs。

## 14. Final Use Case Gate

```text
REQUIRED                                     = 24
DEFERRED                                     = 4
NOT_SUPPORTED                                = 11
Table-driven CRUD smell                      = 0
Duplicate auth system                        = 0
Cross-domain SQL                             = 0
Direct operator permission path              = 0
Wildcard/deny/hierarchy ambiguity            = 0
Unresolved Operator lifecycle decision       = 0
Unresolved Role model decision               = 0
Unresolved Permission mutation decision      = 0
Unresolved Bootstrap decision                = 0
Platform external implementation blocker     = 0

OPERATIONS_USE_CASES = FROZEN
```

STOP: 本文件不开始 Operations Implementation。
