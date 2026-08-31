---
status: frozen
last_updated: 2026-08-31
revision: "Operations V1 application/RBAC/audit/API design gate PASS; re-audited after Platform implementation PASS; 5-table DB contract unchanged"
schema: operations
source_conversation_id: 6a9351a6-17b8-83ea-b172-5f58121a431f
source_share_url: https://chatgpt.com/share/6a9351a6-17b8-83ea-b172-5f58121a431f
---

# Operations 域

Operations Domain = **内部运营后台的 Operator identity mapping、RBAC 授权控制面与操作审计域**。

它回答：

1. 谁是后台 Operator；
2. 当前 Operator 可以做什么；
3. 哪个 Operator 成功执行过什么管理动作。

Operations 不是业务状态聚合层。Identity / Platform / Content / Trust / Commerce / Rewards 等 canonical state 始终由各自 Domain 保存。

## Current Design Status

```text
Repository code audit baseline       = 000f4c4aafacf4938d74902eddc4d78323196a89
Operations frozen database tables    = 5
Operator Lifecycle                   = FROZEN
RBAC Model                           = FROZEN
Permission Grammar                   = FROZEN
Authorization Algorithm              = FROZEN
Audit Contract                       = FROZEN
Bootstrap Strategy                   = FROZEN
Public Contract                      = FROZEN
HTTP/API Contract                    = FROZEN
OPERATIONS_DESIGN_GATE               = PASS
OPERATIONS_IMPLEMENTATION_STARTED    = NO
```

Canonical application design：

- [Operations Implementation Plan](../../development/04-operations/OPERATIONS_IMPLEMENTATION_PLAN.md)
- [Operations Use Cases](../../development/04-operations/OPERATIONS_USE_CASES.md)
- [Operations RBAC Contracts](../../development/04-operations/OPERATIONS_RBAC_CONTRACTS.md)
- [Operations API / Public Contract](../../development/04-operations/OPERATIONS_API.md)
- [Operations Design Audit](../../development/04-operations/OPERATIONS_DESIGN_AUDIT.md)

数据库字段、FK、CHECK、INDEX、状态和删除策略仍以 [Operations 数据库总览](database.md) 与 `database/v2/migrations/0200_operations.sql` 为 frozen authority。

## Final 5 Tables

```text
operations
├── operators
├── roles
├── operator_roles
├── role_permissions
└── operator_audit_logs
```

| 表 | Canonical responsibility |
|---|---|
| `operations.operators` | Identity stable UUID ↔ Operator mapping，active/disabled |
| `operations.roles` | flat Role |
| `operations.operator_roles` | Operator ↔ Role current assignment |
| `operations.role_permissions` | Role ↔ exact permission key current assignment |
| `operations.operator_audit_logs` | successful accepted Operator management action trail |

禁止第 6 张核心表，禁止 permission dictionary table。

## Identity Boundary

`operators.auth_subject_id`：

```text
UUID
UNIQUE
Identity stable logical/public subject reference
NO cross-domain FK
```

Current request flow：

```text
Foundation / Identity AuthenticationProvider
→ AuthContext(subjectId)
→ Operations resolve Operator by auth_subject_id
→ RBAC authorization
```

Create/Enable/Bootstrap 只依赖 current `apps/backend/src/modules/identity/public/` 的 `IdentityPublicQueries`；禁止 Identity repository/application/infrastructure/SQL dependency。

Operations 不实现 password、OTP、JWT issuing、session 或管理员独立登录系统。

## Operator Lifecycle

```text
self registration = NO
normal create      = authorized management action
first operator     = one-time controlled CLI bootstrap
status             = active | disabled
auth_subject_id    = immutable
physical delete    = NO
soft delete        = NO
```

Disabled Operator 对新的 authorization decision deny all；roles/audit 保留。Enable 要重新确认 Identity subject active。

Current Identity AuthenticationProvider 本身只对 active Identity account 产生 AuthContext，所以 Identity inactive/closed 会在 Operations 之前被拒绝。

## Role / RBAC Model

```text
Operator
→ zero or more active Roles
→ UNION exact Permission keys
```

Role：

```text
code        UNIQUE + lower_snake_case + immutable
name        mutable
description mutable
status      active | disabled
physical delete = NO
```

Disabled Role relationships 保留但不参与 permission union。

V1 支持 custom Role。

### `super_admin`

唯一 reserved role code：`super_admin`。

它不是 bypass：

```text
NO wildcard
NO is_super_admin field
NO role-code allow-all branch
```

它必须显式拥有 current Permission Catalog 的全部 rows，不允许 disable，不允许 permission set 少于完整 catalog。

减少 active super-admin 的 DisableOperator / revoke assignment 路径必须锁 `super_admin` Role row 并在 transaction 中确保仍至少有 1 个 active super-admin Operator。

## Permission Model

Application canonical grammar：

```text
<domain>.<resource>.<action>
```

严格三段，全部 lower_snake_case；resource 使用 plural capability family。

Domain tokens：

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

V1：

```text
exact keys only
wildcard = NO
deny = NO
role hierarchy = NO
role priority = NO
direct operator permission = NO
ABAC = NO
resource ACL = NO
```

## Permission Catalog Authority

Permission authority = Operations code-level static/typed catalog；数据库只保存 Role current assignment。

Target path：

```text
apps/backend/src/modules/operations/public/permissions.ts
```

Current frozen catalog：

```text
Operations keys = 16
Platform keys   = 10
Total           = 26
```

后续 Domain exact admin keys 只有在 Owner Domain 冻结 management capability/API 后加入。

Role permission mutation V1 只保留：

```text
SetRolePermissions(role_id, complete_permission_set)
```

## Authorization

```text
Identity authenticated
→ Operator exists
→ Operator active
→ active assigned Roles
→ UNION exact role_permissions
→ required exact key exists
```

No RBAC cache / Redis。

## Audit

Frozen Audit fields表达：

```text
who             -> operator_id
did what        -> action_key
to what         -> target_domain / target_type / target_id
when            -> created_at
request context -> request_id / ip_address / safe details
```

Frozen DB 没有 `result` field，且 database contract 定义 Audit 只记录已接受并成功执行动作，所以：

```text
persisted Audit row = implicit SUCCESS
```

Auth failure / authorization denial / validation/business failure / exception 进入 security/application/observability logs，不伪造 failed Audit row，不用 `details.result`。

Operations-owned mutation：state + Audit 同 Operations transaction。

Cross Domain：

```text
Operations authorize
→ Owner Domain canonical commit
→ synchronous Operations success Audit
```

不做 distributed transaction，不 direct SQL 外域。

跨域 owner commit 后 Audit write 失败的 durability gap 是 V1 `MEDIUM` TECH_DEBT；未来强可靠方案必须另行冻结 outbox contract。

## Bootstrap

One-time controlled CLI：

```text
active Identity subject
+ zero operators
→ reserved super_admin
→ full explicit catalog
→ first Operator
→ assignment
→ bootstrap Audit
```

禁止 public bootstrap HTTP、默认 `admin/admin`、长期后门。

## Admin / Public Contract

Operations future HTTP base：

```text
/api/v1/admin/operations
```

Future backend public boundary：

```text
apps/backend/src/modules/operations/public/
```

Concept exports：

```text
OperationsAuthorizer
OperationsOperatorResolver
OperationsAuditRecorder
AuthorizedOperatorContext
OperatorPermissionKey / catalog
```

不 export repositories / DB executor / TransactionManager / SQL / DB rows。

Admin Foundation：

```text
Identity token
→ Operations /me
→ exact effective permissions
→ frontend PermissionGuard/can() for UX
→ backend OperationsAuthorizer for enforcement
```

## Platform Boundary — Current Repository

Current real status：

```text
PLATFORM_DESIGN_GATE = PASS
PLATFORM_IMPLEMENTATION = COMPLETE
PLATFORM_GATE = PASS
PLATFORM_DOMAIN = FROZEN
```

Platform 已完成 6 frozen tables、33 required use cases、public readers、runtime HTTP 和 forward-only physical correction。

Current Platform HTTP 仍只注册 runtime endpoints；Platform management application use cases 已实现。因此 Operations 后续 OPS-14 可以直接完成 management RBAC/Audit wiring：

```text
Platform external integration blocker = NO
```

Operations 原样接纳 Platform frozen 10 permission requirements，但永远不复制或直接写 Feature Flag / Runtime Config / App Version / Announcement / Region canonical state。

## V1 Explicit Non-Goals

```text
Permission dictionary table
Operator/Role deletion
Custom permission creation
Wildcard
Direct operator permission
Temporary roles
Role hierarchy
Deny rules
ABAC
Resource ACL
Approval workflow
Independent admin authentication
Redis/Kafka/microservice
```

## Final Design Findings

```text
BLOCKER = 0
HIGH    = 0
MEDIUM  = 1  (accepted cross-domain Audit durability TECH_DEBT)
LOW     = 0
Unresolved product decisions = 0
Database contract conflicts  = 0

OPERATIONS_DESIGN_GATE = PASS
OPERATIONS_IMPLEMENTATION_STARTED = NO
```
