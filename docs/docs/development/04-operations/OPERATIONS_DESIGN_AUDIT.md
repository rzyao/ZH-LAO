---
status: complete
phase: 4
phase_name: Operations Domain
document: OPERATIONS_DESIGN_AUDIT
audited_at: 2026-08-31
design_gate: PASS
implementation_started: false
repository_commit_audited: 000f4c4aafacf4938d74902eddc4d78323196a89
---

# ZH-LAO  — Operations Design Audit

## 1. Audit Scope

Independent pre-implementation audit of：

```text
Repository current main / relevant concurrent delta
Frozen Operations DB
Product semantics
Operator lifecycle
RBAC / Permission Catalog
Authorization
Audit
Bootstrap
Backend public boundary
HTTP/API
Admin Foundation integration
Platform integration readiness
Concurrency/security
Implementation Plan
```

No Operations production code was implemented and `0200_operations.sql` was not modified。

## 2. Repository Audit & Mid-Session Delta

### 2.1 Final Code Baseline

本会话开始时首次读到：

```text
d7b4ed1f204164bde39bf4cf4db324101ef15651
docs(platform): complete Platform design audit
```

随后远程 `main` 在 Operations 第一份设计文档写入前新增：

```text
000f4c4aafacf4938d74902eddc4d78323196a89
feat(platform): implement Phase 3 platform domain and identity hotfixes
```

Operations 第一份设计提交 `4301bf...` 的 parent 正是 `000f4c4...`，因此最终 repository/code audit baseline 统一改为 `000f4c4...`。

本会话之后的 HEAD 继续前进仅因为 Operations 文档更新；没有 Operations source implementation。

### 2.2 Relevant Repository State

当前 backend modules：

```text
identity   = present
platform   = present
operations = absent
```

因此：

```text
OPERATIONS_IMPLEMENTATION_STARTED = NO
```

### 2.3 Current CI

`.github/workflows/foundation.yml` 当前包含：

```text
backend job:
  PostgreSQL 18
  backend verify
  backend build
  backend integration
  database test
  database validate

admin job:
  admin verify
  Playwright Chromium E2E

docs job:
  VitePress/docs build

mobile job:
  mobile verify
  continue-on-error in current workflow text
```

本 Design Session 没有修改 CI。

## 3. Canonical Architecture Audit

PASS。

保持：

```text
Modular Monolith
Node.js + TypeScript + ESM
Fastify
PostgreSQL
pg
Zod
Pino
Vitest
same-domain FK = real PostgreSQL FK
cross-domain physical FK = forbidden
cross-domain internal BIGINT reference = forbidden
cross-domain reference = stable logical UUID
```

No Redis / Kafka / permission microservice。

## 4. Frozen Database Audit

PASS。

`database/migrations/0200_operations.sql` exactly：

```text
operations.operators
operations.roles
operations.operator_roles
operations.role_permissions
operations.operator_audit_logs
```

Confirmed：

- Operator/Role/Audit IDs UUID；
- `operators.auth_subject_id UUID UNIQUE`；
- no Identity FK；
- `operator_roles PK(operator_id, role_id)`；
- reverse `(role_id,operator_id)` index；
- same-domain FKs real + `ON DELETE RESTRICT`；
- permission/action format CHECKs；
- Audit actor/action/target/request/IP/details/time fields；
- no Audit result/status field。

```text
Frozen migration edits = 0
New Operations tables  = 0
DATABASE_CONTRACT_CONFLICT = 0
```

## 5. Database ↔ Use Cases Audit

PASS。

所有 24 REQUIRED Use Cases 均适配 frozen schema：

- delete 不支持，使用 existing `disabled`；
- auth subject immutability 是 application invariant；
- reserved `super_admin` 是 code policy，不需要 `is_system`；
- last-admin protection 用 existing rows + transaction lock；
- complete-set permission mutation 使用 existing relation table；
- code catalog 无需 dictionary table；
- Bootstrap 只使用现有 5 tables；
- Operator/Role/Audit UUID 可安全用于 Admin API。

No DB contract workaround or hidden field required。

## 6. Identity Boundary Audit

PASS。

当前 `identity/public` 已收紧为纯接口：

```text
IdentityPublicQueries
IdentityPublicSummary
UserPublicId / IdentityAccountStatus public types
```

Operations only consumes that public boundary for Create/Enable/Bootstrap subject checks。

当前 Foundation/Identity auth pipeline：

```text
Bearer token
→ IdentityAuthenticationProvider
→ read Identity by public UUID
→ only status=active yields AuthContext.subjectId
```

禁止：

```text
identity/application import
identity/infrastructure import
Identity repositories
identity.* SQL
internal BIGINT
```

Duplicate admin password/OTP/JWT/session system = 0。

## 7. Platform Status Audit — Strictly Separated

PASS。

Current repository now proves：

```text
PLATFORM_DESIGN_GATE = PASS
PLATFORM_PHYSICAL_CONTRACT = PASS
PLATFORM_IMPLEMENTATION = COMPLETE
PLATFORM_GATE = PASS
PLATFORM_DOMAIN = FROZEN
```

Platform corrected physical index drift using forward-only `1250_platform_override_indexes.sql` without editing frozen `0300_platform.sql`。

Platform implementation report confirms：

```text
6 frozen tables
33 required use cases implemented
3 public readers
5 runtime HTTP endpoints
0 cross-domain SQL
0 internal BIGINT leak
0 Redis/Kafka/premature outbox
BLOCKER/HIGH/MEDIUM/LOW = 0
```

### Platform Management Integration Reality

Current `apps/backend/src/modules/platform/http/routes.ts` registers runtime endpoints only。Platform management application use cases are implemented but management HTTP/RBAC wiring is not registered there。

Therefore：

```text
Platform Design dependency       = SATISFIED
Platform Implementation dependency= SATISFIED
Platform Final Gate              = PASS
Operations integration blocker   = NO
Remaining work                   = OPS-14 RBAC/Audit management wiring
```

Operations still must not write `platform.*` or own Platform state。

## 8. Operator Lifecycle Audit

PASS。

Frozen decisions：

```text
self-registration  = NO
first operator     = controlled one-time CLI
normal creation    = exact operations.operators.create
Identity validation= public contract only
auth_subject rebind= NO
disable            = retain history/assignments
enable             = requires active Identity
physical delete    = NO
soft delete        = NO
```

Unresolved lifecycle decisions = 0。

## 9. Role Model Audit

PASS。

```text
custom roles            = YES
role code mutable       = NO
name/description mutable= YES
disabled role           = ignored by RBAC
role delete             = NO
role hierarchy          = NO
reserved super_admin    = YES
super_admin bypass      = NO
```

`super_admin` permissions remain explicit current catalog rows。

Catalog evolution strategy does not require a hidden bypass：existing `operations.role_permissions.set` performs reconciliation before newly protected behavior is used。

## 10. Permission Grammar / Catalog Audit

PASS。

```text
application grammar = exact 3 segments
<domain>.<plural_resource>.<action>
lower_snake_case
wildcard = NO
custom DB permission creation = NO
```

Current exact catalog：

```text
Operations = 16
Platform   = 10
Total      = 26
```

No Content/Learning/Audio/Social/Chat/Commerce/Rewards/Trust exact keys invented prematurely。

Physical regex being wider (`3+` segments) is not a contract conflict because application accepts only registered exact keys。

## 11. Authorization Audit

PASS。

```text
Identity authenticated
→ Operator exists
→ Operator active
→ active assigned Roles only
→ UNION exact keys
→ required exact key membership
```

Confirmed absent：

```text
wildcard
role hierarchy
deny
priority
per-user direct permission
super-admin bypass
permission cache
```

In-flight owner action linearization documented without claiming distributed rollback。

## 12. Last-Admin / Concurrency Audit

PASS。

| Race | Protection |
|---|---|
| duplicate assignment | composite PK + idempotency |
| duplicate auth subject | UNIQUE |
| duplicate role code | UNIQUE |
| concurrent permission replace | `SELECT role FOR UPDATE` |
| concurrent final super-admin reduction | lock reserved Role row + re-count |
| role/operator disabled | no cache; next decision reads current DB |

No new DB column required。

## 13. Audit Contract Audit

PASS with one explicit V1 durability debt。

### Success-only Fact

Frozen schema has no result field and existing DB design explicitly defines Audit as accepted/executed Operator actions。

Therefore：

```text
persisted audit row = implicit SUCCESS
```

Auth failure / authz denial / validation reject / owner failure / pre-success exception -> security/application/observability logs。

`details.result` workaround is forbidden。

### Business Fact Boundary

Audit remains action trail only：

```text
Trust enforcement canonical fact -> Trust
Commerce refund canonical fact   -> Commerce
Platform state                   -> Platform
who performed admin action       -> Operations Audit
```

### Transaction Boundary

Operations own mutation：same Operations transaction for state + Audit。

Cross Domain：

```text
Operations authorize
→ Owner Domain canonical commit
→ synchronous Operations success Audit
```

No cross-domain DB transaction。

### MEDIUM-01 — Cross-Domain Audit Persistence Gap

Owner commit can succeed while later Operations Audit insert fails。

Platform current implementation intentionally has no premature outbox，so Operations Design does not silently impose a new Platform event contract。

V1 containment：

```text
critical log request_id/operator/action/target
stable internal ambiguity error
Admin refresh before retry
```

Future reliable fix requires explicit owner-domain outbox Audit contract revision。

```text
Severity = MEDIUM
Status   = ACCEPTED V1 TECH_DEBT
Unresolved product decision = NO
Database conflict = NO
```

## 14. Bootstrap Audit

PASS。

```text
public bootstrap HTTP = NO
default admin/admin    = NO
long-lived auth bypass = NO
controlled CLI         = YES
Identity active check  = YES
single Operations tx   = YES
super_admin full catalog= YES
bootstrap Audit        = YES
second invocation      = REJECT once any Operator exists
```

No bootstrap backdoor remains in HTTP contract。

## 15. Public Contract Audit

PASS。

Frozen public concepts：

```text
OperationsAuthorizer
OperationsOperatorResolver
OperationsAuditRecorder
AuthorizedOperatorContext
OperatorPermissionKey/static catalog
```

Forbidden exports：

```text
repositories
DatabaseExecutor
TransactionManager
DB rows
SQL
```

Other Domains have one reusable RBAC path and must not query Operations tables themselves。

## 16. HTTP/API Audit

PASS。

```text
base = /api/v1/admin/operations
```

- `/me` supplies real current Operator + effective permission state；
- Operator/Role/Audit identifiers UUID；
- assignment uses idempotent PUT/DELETE；
- Role permission mutation uses one complete-set PUT；
- Permission Catalog read-only from code；
- Audit filters match schema fields；
- no failed-result query；
- no bootstrap HTTP；
- Foundation error envelope reused。

Internal BIGINT leakage = 0。

## 17. Admin Foundation Readiness Audit

PASS at contract level。

Admin Foundation already has：

```text
AuthProvider/AuthGuard
PermissionGuard/can()
ApiClient
token store
UUID/time/pagination/error contracts
```

Binding：

```text
Identity token
→ Operations /me
→ exact effective permissions
→ frontend permission-aware UI
→ backend OperationsAuthorizer = actual security enforcement
```

No Admin page implemented in this session。

## 18. Cache / Performance Audit

PASS。

```text
PostgreSQL direct RBAC read = YES
in-process cache            = NO
Redis                       = NO
```

For low Admin QPS and security-sensitive permissions, no-cache is the low-ops V1 choice。

## 19. Use Case Audit

```text
REQUIRED      = 24
DEFERRED      = 4
NOT_SUPPORTED = 11
```

No mechanical 5-table CRUD expansion detected。

## 20. Anti-Pattern Audit

```text
duplicate admin auth system               = 0
Operations SQL -> identity.*               = 0
Operations SQL -> platform.*               = 0
internal BIGINT leakage                    = 0
permission wildcard ambiguity              = 0
role hierarchy overengineering             = 0
ABAC creep                                  = 0
Audit replacing owner business fact        = 0
Operations owning Platform state           = 0
public bootstrap backdoor                  = 0
super_admin authorization bypass           = 0
unhandled last-admin race                  = 0
stale authorization cache design           = 0
```

## 21. Findings

```text
BLOCKER = 0
HIGH    = 0
MEDIUM  = 1
LOW     = 0
```

Only remaining finding：

```text
MEDIUM-01 Cross-Domain Audit Persistence Gap
= accepted V1 TECH_DEBT
```

No unresolved product decisions and no database contract conflicts remain。

## 22. Gate Conditions

Required：

```text
BLOCKER = 0
HIGH = 0
Unresolved product decisions = 0
Database contract conflicts = 0
```

Actual：

```text
BLOCKER = 0
HIGH = 0
Unresolved product decisions = 0
Database contract conflicts = 0
Frozen Operations migration edited = NO
New Operations table required = NO
Operations implementation started = NO
Platform external integration blocker = NO
```

## 23. Final Design Gate

```text
Operator Lifecycle        = FROZEN
RBAC Model                = FROZEN
Permission Grammar        = FROZEN
Authorization Algorithm   = FROZEN
Audit Contract            = FROZEN
Bootstrap Strategy        = FROZEN
Identity Boundary         = PASS
Platform Boundary         = PASS
Public Contract           = FROZEN
HTTP/API Contract         = FROZEN

OPERATIONS_DESIGN_GATE = PASS
OPERATIONS_IMPLEMENTATION_STARTED = NO
```

Design PASS 不自动授权 implementation。必须由另一个 execution-development session 明确进入 OPS-01。

STOP。
