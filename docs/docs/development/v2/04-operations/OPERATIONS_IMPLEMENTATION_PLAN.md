---
status: ready
phase: 4
phase_name: Operations Domain
document: OPERATIONS_IMPLEMENTATION_PLAN
last_updated: 2026-08-31
design_only: true
implementation_started: false
repository_commit_audited: d7b4ed1f204164bde39bf4cf4db324101ef15651
depends_on:
  - OPERATIONS_USE_CASES.md
  - OPERATIONS_RBAC_CONTRACTS.md
  - OPERATIONS_API.md
---

# ZH-LAO V2 — Operations Implementation Plan

> 本文件只冻结未来执行顺序。当前会话不得执行任何 OPS Implementation task。

## 1. Entry State

Repository facts at design audit start：

```text
Branch                              = main
Audited HEAD                        = d7b4ed1f204164bde39bf4cf4db324101ef15651
Identity Implementation             = COMPLETE / PASS / FROZEN
Admin Foundation                    = COMPLETE / PASS
Platform Design Gate                = PASS
Platform Implementation             = NOT_STARTED
Platform Final Gate                 = NOT_RUN
Operations frozen tables            = 5
Operations implementation module    = NOT_PRESENT
```

Important：后续本设计文档提交会使 `main` HEAD 前进，但所有 repository audit facts 以上述 pre-design commit 为基线。

## 2. Global Constraints

整个执行阶段禁止：

```text
edit database/v2/migrations/0200_operations.sql
add a sixth Operations table
add permission dictionary table
query identity.* directly
query/write platform.* from Operations repositories
create admin username/password/session/JWT system
add wildcard/deny/hierarchy/ABAC
add Redis/Kafka/microservice
implement Admin pages before backend contract tests pass
```

Only forward migration may be added if a real physical contract defect is discovered and separately approved；本 Design Audit 当前发现 `DATABASE_CONTRACT_CONFLICT = 0`，因此没有 Operations forward migration prerequisite。

## 3. Dependency Split

### Independent of Platform Implementation

以下可以在未来 Operations execution session 独立完成：

```text
OPS-01 Module Skeleton
OPS-02 Domain Types / Permission Catalog
OPS-03 Repositories
OPS-04 Identity Public Adapter / Operator Resolution
OPS-05 Authorization / RBAC
OPS-06 Operator Management
OPS-07 Role Management
OPS-08 Role Assignment / Permission Set
OPS-09 Audit Logging
OPS-10 Public Contracts
OPS-11 Operations HTTP/API
OPS-12 Bootstrap First Operator
OPS-13 Operations Integration/E2E
OPS-15 Security/Race
```

### Platform Integration Dependency

```text
OPS-14 Platform Management Integration
```

需要 Platform management application/HTTP implementation 可用。

Platform current Design Gate PASS 足以冻结 permission keys 与 route authorization requirement，但不能假装 runtime/module 已存在。

## 4. OPS-00 — Design Freeze

### Goal

将本会话产生的 Operations product/API/RBAC/audit decisions 作为 Implementation 唯一输入。

### Scope

```text
OPERATIONS_USE_CASES.md
OPERATIONS_RBAC_CONTRACTS.md
OPERATIONS_API.md
OPERATIONS_DESIGN_AUDIT.md
OPERATIONS_IMPLEMENTATION_PLAN.md
```

### Dependencies

Identity frozen public contract + frozen `0200_operations.sql` + Platform Design Gate PASS。

### Files

Docs only。

### Tests

No runtime test；执行文档交叉审计。

### Audit

确认 unresolved product decision = 0、database conflict = 0。

### Gate

`OPERATIONS_DESIGN_GATE = PASS` 才允许另一个执行会话进入 OPS-01。

## 5. OPS-01 — Module Skeleton

### Goal

创建与 Identity 一致的 Modular Monolith boundary，而不实现业务。

### Scope

目标结构：

```text
apps/backend/src/modules/operations/
├── domain/
├── application/
│   └── ports/
├── infrastructure/
├── http/
├── public/
└── index.ts
```

### Dependencies

Foundation module/composition conventions。

### Files

Operations module skeleton + composition registration only。

### Tests

- typecheck/build；
- import-boundary tests；
- no business route accidentally registered；
- no cross-domain internal import。

### Audit

Repositories/SQL/use cases still absent at this task end。

### Gate

Module boundary PASS。

## 6. OPS-02 — Domain Types / Permission Catalog

### Goal

实现冻结 UUID/status/role-code/permission grammar 与 canonical exact catalog。

### Scope

```text
OperatorId
RoleId
AuditLogId
OperatorStatus
RoleStatus
RoleCode
OperatorPermissionKey
AuditActionKey
OPERATOR_PERMISSION_CATALOG
```

Initial catalog = Operations 16 keys + Platform frozen 10 keys。

### Dependencies

OPS-01 + RBAC contract。

### Files

`domain/*` + `public/permissions.ts` or equivalent public-safe export。

### Tests

- exact 3-segment grammar；
- lower_snake_case；
- wildcard rejected；
- unknown permission rejected；
- all catalog keys <= DB varchar limits；
- Platform 10 frozen keys exact-match docs。

### Audit

No invented future Content/Trust/etc keys。

### Gate

Permission Catalog PASS。

## 7. OPS-03 — Repository Layer

### Goal

建立只访问 `operations.*` 的 repository contracts/PG implementations。

### Scope

至少覆盖：

```text
operators
roles
operator_roles
role_permissions
operator_audit_logs
RBAC resolution query
Audit query filters
```

Repository methods必须面向 use cases，而不是 raw generic CRUD gateway。

### Dependencies

OPS-02 + Foundation DatabaseExecutor/TransactionManager。

### Files

`application/ports/*`, `infrastructure/repositories.ts`。

### Tests

PostgreSQL integration：

- UUID mapping；
- UNIQUE auth_subject/code；
- composite PK；
- role reverse query；
- active-role permission resolution；
- audit filter/index-compatible queries；
- transaction rollback。

### Audit

```text
SQL touching identity.* = 0
SQL touching platform.* = 0
Operations tables touched = exactly frozen 5
```

### Gate

Repository boundary PASS。

## 8. OPS-04 — Identity Public Adapter / Operator Resolution

### Goal

复用 Identity/Fundation auth，建立 `AuthContext.subjectId -> Operator` resolution。

### Scope

- consume Foundation `AuthContext`；
- consume only `modules/identity/public` for Create/Enable/Bootstrap identity checks；
- resolve Operator by `auth_subject_id`；
- active/disabled semantics。

### Dependencies

Identity FROZEN public contract + OPS-03。

### Files

Operations application service/adapters only；禁止 import Identity application/infrastructure/repositories。

### Tests

- active Identity + active Operator；
- authenticated non-operator；
- disabled Operator；
- Identity subject not found/inactive for create/enable；
- import boundary static tests。

### Audit

No duplicated auth/session/JWT/OTP code。

### Gate

Identity Boundary PASS。

## 9. OPS-05 — Authorization / RBAC

### Goal

实现 exact Permission union 与统一 public authorizer。

### Scope

```text
active operator
→ active assigned roles
→ exact permission union
→ require exact key
```

No cache。

### Dependencies

OPS-02~04。

### Files

application authorization service + public contract adapter。

### Tests

- multiple-role union；
- duplicate key union；
- disabled role ignored；
- disabled operator deny all；
- no role => empty permissions；
- exact match only；
- wildcard absent；
- `super_admin` works only because explicit rows exist；remove an explicit row in test => permission denied，证明 no bypass。

### Audit

Search for `role.code === 'super_admin'` allow path must find 0 authorization bypass。

### Gate

RBAC Semantics PASS。

## 10. OPS-06 — Operator Management

### Goal

实现 List/Get/Create/Update/Disable/Enable Operator。

### Scope

按 Use Cases 冻结；`auth_subject_id` immutable；no delete。

### Dependencies

OPS-04/05 + TransactionManager + Audit local writer。

### Files

Operations application services；HTTP later in OPS-11。

### Tests

- create active identity subject；
- duplicate auth subject conflict；
- inactive/missing identity rejected；
- display name update；
- immutable auth subject；
- disable/enable；
- enable requires active Identity；
- no physical delete method；
- same-tx mutation+audit rollback tests。

### Audit

Operator lifecycle exactly frozen。

### Gate

Operator Management PASS。

## 11. OPS-07 — Role Management

### Goal

实现 List/Get/Create/Update/Disable/Enable Role 与 reserved super_admin policy。

### Scope

- code immutable；
- custom roles；
- super_admin reserved；
- no role deletion。

### Dependencies

OPS-03/05/09-local-audit primitive may be built in same execution batch but task gate requires audit availability before completion。

### Tests

- code regex/unique；
- code update rejected；
- metadata update；
- custom disable/enable；
- super_admin disable rejected；
- mutation+audit atomic。

### Audit

No `is_system` DB field invented。

### Gate

Role Management PASS。

## 12. OPS-08 — Role Assignment / Permissions

### Goal

实现 assignment 与唯一 `SetRolePermissions` mutation model。

### Scope

- list/assign/revoke Operator Roles；
- list catalog；
- list/set complete Role permission set；
- last-super-admin invariant。

### Dependencies

OPS-02/03/05/07。

### Tests

- multi-role；
- duplicate assign idempotent；
- concurrent duplicate assign；
- revoke idempotent；
- disabled target operator/role assign rejected；
- exact catalog validation；
- empty custom role set；
- concurrent permission replace serialized by Role row lock；
- super_admin set must equal full catalog；
- last-super-admin disable/revoke race with shared row lock；
- no duplicate/no-op audit。

### Audit

No Grant/Remove alternate permission service/API exists。

### Gate

Assignment/Permission PASS。

## 13. OPS-09 — Audit Logging

### Goal

实现 immutable success-only Operator audit canonical fact。

### Scope

- local transaction audit writer；
- public cross-domain success audit recorder；
- query list/detail；
- details allowlist/sanitization；
- no update/delete repository methods。

### Dependencies

OPS-03 + RBAC contract。

### Files

Operations audit application/infrastructure/public adapter。

### Tests

- actor FK；
- action grammar；
- target combinations；
- request_id/IP；
- details object/sensitive-key rejection；
- mutation + audit same tx；
- no-op mutation no audit；
- no update/delete path；
- failed/denied action does not create canonical audit row；
- audit filters + cursor pagination。

### Audit

Confirm no `result` DB field or hidden `details.result` convention introduced。

### Gate

Audit Contract PASS。

## 14. OPS-10 — Public Contracts

### Goal

冻结并实现其他 Domain 唯一可依赖的 Operations boundary。

### Scope

```text
OperationsAuthorizer
OperationsOperatorResolver
OperationsAuditRecorder
OperatorPermissionKey/catalog
AuthorizedOperatorContext
```

### Dependencies

OPS-05/09。

### Files

`modules/operations/public/*` + import-boundary tests。

### Tests

- public imports compile；
- no repo/DB/SQL export；
- external test fixture can authorize exact key and record safe success audit using only public contract。

### Audit

Cross-domain internal dependency = 0。

### Gate

Public Contract PASS。

## 15. OPS-11 — HTTP/API

### Goal

实现冻结 `/api/v1/admin/operations/**` endpoints。

### Scope

All REQUIRED HTTP endpoints in `OPERATIONS_API.md`，except Bootstrap/public audit recorder which are non-HTTP。

### Dependencies

OPS-06~10 + Foundation auth/error/http conventions。

### Files

`modules/operations/http/*` + composition wiring。

### Tests

HTTP integration：

- unauthenticated 401；
- authenticated non-operator 403；
- disabled operator 403；
- exact missing permission 403；
- success contracts；
- unknown fields/mass assignment rejected；
- UUID validation；
- stable errors；
- raw SQL errors hidden；
- GetCurrentOperator permission list；
- idempotent PUT/DELETE semantics。

### Audit

Route handler direct SQL/repository access = 0。

### Gate

HTTP/API PASS。

## 16. OPS-12 — Bootstrap First Operator

### Goal

解决 zero-admin initialization without public backdoor。

### Scope

Controlled CLI only；first Operator + reserved super_admin + full explicit catalog + audit。

### Dependencies

OPS-02/03/04/08/09。

### Files

Backend script/CLI composition；no HTTP route。

### Tests

- empty Operations succeeds；
- Identity missing/inactive rejected；
- transaction rollback leaves no partial role/operator/permission；
- second invocation rejected；
- no default credential；
- audit row produced；
- full catalog explicit rows assigned。

### Audit

Search public routes for bootstrap = 0。

### Gate

Bootstrap PASS。

## 17. OPS-13 — Operations Domain Integration / E2E

### Goal

用真实 PostgreSQL + Identity AuthenticationProvider 验证完整 Admin auth→RBAC→Operations mutation→audit 链路。

### Scope

No Platform dependency。

### Dependencies

OPS-01~12。

### Tests

E2E scenarios：

```text
bootstrap first operator
login/authenticate through existing Identity
GET /me
create custom operator/role
set permissions
assign role
new operator authorizes allowed endpoint
denied endpoint stays forbidden
disable operator immediately denies next request
disable role removes permissions
re-enable restores
last-super-admin protection
audit timeline contains successful mutations
```

### Audit

Fake core auth/repository = 0 in E2E。

### Gate

Operations Core E2E PASS。

## 18. OPS-14 — Platform Management Integration

### Goal

将 Platform frozen management APIs 接入 Operations authorization/audit contract。

### Scope

Only after Platform management application/HTTP exists：

```text
/api/v1/admin/platform/**
```

requires exact frozen Platform permissions。

No Operations proxy API，no Operations write to `platform.*`。

### Dependencies

```text
PLATFORM_IMPLEMENTATION = sufficient management capability available
Platform PLT-01 corrective prerequisite completed where required
OPS-10 public contract PASS
```

### Tests

- each Platform management resource read/write protected by correct exact key；
- frontend-only guards cannot bypass backend；
- Platform state remains Platform-owned；
- successful writes create Operations audit；
- audit failure path exposes committed-state ambiguity safely and critical logs request_id；
- no distributed/cross-domain DB transaction。

### Audit

`platform.*` SQL under Operations module = 0。

### Gate

Platform Integration PASS。

## 19. OPS-15 — Security / Race

### Goal

专项验证授权安全与关键并发 invariant。

### Scope

```text
mass assignment
IDOR
permission string injection
wildcard attempts
role disable race
operator disable race
permission replace race
last-super-admin race
bootstrap race
audit details secret leakage
```

### Dependencies

OPS-13；Platform-specific cases after OPS-14 when available。

### Tests

多轮 PostgreSQL race/stability suite。

### Audit

No stale authorization cache because cache absent；document linearization behavior for in-flight cross-domain request。

### Gate

Security/Race PASS。

## 20. OPS-16 — Final Design/Implementation Conformance Audit

### Goal

独立核对 frozen docs ↔ implementation。

### Scope

```text
DB ↔ repositories
Use Cases ↔ services
RBAC ↔ authorization
Public Contract ↔ imports
HTTP ↔ API doc
Audit ↔ transaction paths
Bootstrap ↔ no backdoor
Admin Foundation compatibility
Platform boundary
```

### Dependencies

All required implementation tasks complete。

### Tests

Full regression：backend verify/build/integration + database validation；no frozen migration edits。

### Audit Severity

BLOCKER / HIGH / MEDIUM / LOW。

### Gate

BLOCKER=0 and HIGH=0 before exit report。

## 21. OPS-17 — Final Report / Exit Gate

### Goal

生成 Operations Implementation final report and close phase。

### Scope

Evidence counts，dependency status，remaining tech debt，migration delta，security/race results。

### Dependencies

OPS-16 PASS。

### Files

Future：

```text
OPERATIONS_IMPLEMENTATION_REPORT.md
```

### Tests

Re-run required CI commands and fresh PostgreSQL validation。

### Audit

Do not mark complete if Platform-required integration remains an unresolved HIGH/BLOCKER under the then-current Master Plan。

### Gate

Future only：

```text
OPERATIONS_IMPLEMENTATION = COMPLETE
OPERATIONS_GATE = PASS
```

Current design session MUST NOT set either value。

## 22. Admin Client Scope After Backend Contract

Future Admin work may implement：

```text
current operator binding
permission-aware navigation
backend-backed route/action guards
operator list/detail/edit
role list/detail/edit
permission matrix/editor
audit log list/detail
```

But this plan does not implement Admin pages。

Admin page work should begin only after OPS-11/13 contracts are functional，and Platform Admin pages only after OPS-14 integration is functional。

## 23. Outbox / Cache Plan

```text
Operations RBAC outbox = NONE
Authorization cache    = NONE
Redis/Kafka            = NONE
```

Cross-domain reliable audit via outbox remains explicit DEFERRED TECH_DEBT，not a hidden OPS task。

## 24. Exit Conditions for Starting Implementation

Another execution-development session may start OPS-01 only if：

```text
OPERATIONS_DESIGN_GATE = PASS
frozen docs committed
user explicitly asks to begin Operations implementation
```

This document ends at planning。STOP。
