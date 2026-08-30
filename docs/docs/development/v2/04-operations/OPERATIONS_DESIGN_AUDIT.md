---
status: complete
phase: 4
phase_name: Operations Domain
document: OPERATIONS_DESIGN_AUDIT
audited_at: 2026-08-31
design_gate: PASS
implementation_started: false
repository_commit_audited: d7b4ed1f204164bde39bf4cf4db324101ef15651
---

# ZH-LAO V2 — Operations Design Audit

## 1. Audit Scope

Independent pre-implementation audit of：

```text
Repository current main
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
Platform dependency
Concurrency/security
Implementation Plan
```

No Operations production code was implemented，and `0200_operations.sql` was not modified。

## 2. Repository Audit Facts

### 2.1 Branch / Commit

At the start of this design session：

```text
repository     = rzyao/ZH-LAO
branch         = main
default branch = main
HEAD           = d7b4ed1f204164bde39bf4cf4db324101ef15651
latest commit  = docs(platform): complete Platform design audit
```

Relevant preceding Platform commits included：

```text
981c5dcb... docs(platform): add Platform implementation plan
96598731... docs(platform): freeze Platform API contracts
48a8de7c... docs(platform): freeze runtime config contracts
```

Operations design documents created by this session necessarily advance `main` after the audited baseline commit；the baseline above remains the repository fact source used for the audit。

### 2.2 Current CI / Workflow

Repository contains `.github/workflows/foundation.yml`。

It runs：

```text
PostgreSQL 18 service
pnpm apps/backend verify
pnpm apps/backend build
pnpm apps/backend test:integration
pnpm database/v2 test
pnpm database/v2 validate
```

No Operations-specific CI existed before this design session because no Operations module existed。

### 2.3 Backend Architecture

Current backend has Foundation infrastructure plus `modules/identity`；`modules/platform` and `modules/operations` are not present at the audited commit。

Foundation provides：

```text
AuthContext { subjectId, sessionId? }
AuthenticationProvider
requireAuthentication()
AppError
DatabaseExecutor / TransactionManager
logging / outbox / HTTP infrastructure
```

### 2.4 Identity Status

Canonical development progress and implementation report show：

```text
IDENTITY_IMPLEMENTATION = COMPLETE
IDENTITY_GATE           = PASS
IDENTITY_DOMAIN         = FROZEN
```

Identity public boundary exists at：

```text
apps/backend/src/modules/identity/public/
```

`IdentityPublicQuery` exposes stable UUID status/summary reads and does not expose internal BIGINT to consumers。

Identity AuthenticationProvider validates Bearer tokens and only returns AuthContext for current Identity `status=active`。

### 2.5 Platform Status — Strictly Separated

Platform documents on current main prove：

```text
PLATFORM_DESIGN_GATE          = PASS
PLATFORM_IMPLEMENTATION_STARTED = NO
Platform implementation module   = absent
PLATFORM_FINAL_GATE              = NOT_RUN
```

Platform Design Gate PASS must not be reported as implementation completion。

Platform Design also has a required future prerequisite：

```text
PLT-01 forward-only Feature Flag Override index correction
```

before relevant Platform Override implementation。

### 2.6 Admin Foundation Status

```text
ADMIN_FOUNDATION      = COMPLETE
ADMIN_FOUNDATION_GATE = PASS
```

Foundation already includes：

```text
AuthProvider/AuthGuard
PermissionGuard/can()
token store
ApiClient
UUID/time/pagination/error contracts
11-Domain navigation placeholders
```

But report explicitly states real Operator login/permission fetch waits for Identity/Operations integration；no business CRUD pages exist。

## 3. Global Architecture Audit

PASS。

Design preserves：

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

No new microservice / Redis / Kafka introduced。

## 4. Frozen Database Audit

PASS。

`database/v2/migrations/0200_operations.sql` contains exactly：

```text
operations.operators
operations.roles
operations.operator_roles
operations.role_permissions
operations.operator_audit_logs
```

Important confirmations：

- Operator/Role/Audit IDs are UUID；
- `operators.auth_subject_id UUID UNIQUE`；
- no FK to Identity；
- `operator_roles PK(operator_id, role_id)`；
- reverse `(role_id, operator_id)` index exists；
- same-domain FKs real and `ON DELETE RESTRICT`；
- permission/audit action key regex exists；
- Audit schema supports actor/action/target/request/IP/details/time；
- Audit schema has **no result field**。

```text
Frozen migration edits = 0
New Operations tables  = 0
DATABASE_CONTRACT_CONFLICT = 0
```

## 5. Database ↔ Use Cases Audit

PASS。

All REQUIRED Use Cases fit frozen schema。

Notable adjudications：

- Operator/Role delete rejected rather than inventing deleted_at；
- `auth_subject_id` immutable application rule，不需要新 field；
- `super_admin` system protection is code/application policy，不需要 `is_system`；
- last-admin invariant uses transaction + row lock，不需要 new column；
- SetRolePermissions uses existing relation rows；
- Permission Catalog lives in code；no permission table；
- Bootstrap uses existing 5 tables；
- API identifiers are UUID-safe；no internal BIGINT issue。

## 6. Identity Boundary Audit

PASS。

Correct dependency：

```text
Foundation/Identity Authentication
→ AuthContext.subjectId UUID
→ Operations auth_subject_id lookup
```

Operations may use `identity/public` only for Create/Enable/Bootstrap subject validation。

Forbidden dependencies remain forbidden：

```text
identity/application
identity/infrastructure
identity repositories
identity.* SQL
Identity internal BIGINT
```

No duplicated password/OTP/session/JWT logic。

## 7. Platform Boundary Audit

PASS。

Operations consumes Platform frozen permission requirements but does not own Platform state。

```text
Operations = authorization + operator audit actor
Platform   = feature/config/version/announcement/region canonical state
```

Operations does not proxy Platform CRUD and does not write `platform.*`。

Platform Integration is explicitly marked `IMPLEMENTATION_DEPENDENCY` because Platform implementation is not present。

```text
Platform Design dependency        = SATISFIED
Platform runtime implementation   = NOT AVAILABLE
Operations Design blocker         = NO
Platform integration blocker now  = YES for OPS-14 only
```

## 8. Operator Lifecycle Audit

PASS。

Resolved decisions：

```text
self-registration      = NO
create by operator     = YES, exact permission
first operator         = controlled CLI bootstrap
disable                = status=disabled, retain history/roles
enable                  = requires active Identity subject
physical delete         = NO
auth_subject rebind     = NO
```

No unresolved lifecycle semantics。

## 9. Role Model Audit

PASS。

Resolved：

```text
custom roles            = YES
reserved super_admin    = YES
role code mutable       = NO
name/description mutable= YES
disabled role permission= ignored
role deletion           = NO
role hierarchy          = NO
```

`super_admin` is not authorization bypass；it has explicit rows for full catalog。

## 10. Permission Grammar / Catalog Audit

PASS。

```text
exact 3 segments
<domain>.<plural_resource>.<action>
lower_snake_case
wildcards = NO
custom DB permission creation = NO
```

Current exact catalog freezes：

```text
Operations = 16 keys
Platform   = 10 already-frozen keys
Total current catalog = 26 keys
```

No future Content/Learning/Audio/Social/Chat/Commerce/Rewards/Trust exact keys were invented prematurely。

Permission DB regex is intentionally looser (`3+` segments) than application contract；code catalog rejects anything not exactly registered，so no physical migration change is required。

## 11. Authorization Audit

PASS。

Frozen algorithm：

```text
Identity authenticated
→ Operator exists
→ Operator active
→ active roles only
→ union exact permissions
→ exact required key
```

Confirmed absent：

```text
wildcard
role hierarchy
deny
priority
per-user direct permission
superadmin bypass
permission cache
```

Identity disabled/closed already causes AuthenticationProvider to reject the request before Operations authorization。

Concurrency linearization for in-flight cross-domain actions is explicitly documented；no distributed rollback is claimed。

## 12. Last-Admin / Concurrency Audit

PASS。

Key races have a physical/application answer：

```text
duplicate assignment        -> composite PK
duplicate auth subject      -> UNIQUE
duplicate role code         -> UNIQUE
permission replace          -> SELECT role FOR UPDATE
last super-admin reduction  -> lock reserved role row + re-count
role/operator disable       -> no auth cache; current DB state at decision point
```

No new DB field required。

## 13. Audit Contract Audit

PASS with one documented V1 durability debt。

Frozen schema has no result field，so design correctly does **not** invent one。

Canonical meaning：

```text
persisted audit row = successful accepted Operator action
```

Failed auth / denied authz / validation failure / owner-domain failure remain security/application/observability logs。

This resolves the requested “result” dimension without violating frozen DB：success is implicit；failed-result Audit rows are not supported in V1。

Audit remains a trace of actor action，not a second Trust/Commerce/Platform business fact source。

### Cross-Domain Write Boundary

Operations-owned mutation：state + audit in same Operations transaction。

Owner-Domain mutation：owner commits first，then synchronous Operations success audit；no cross-domain transaction。

Because current Platform Design explicitly froze `Platform Outbox events = NONE REQUIRED IN V1`，this session does not silently introduce a Platform audit-outbox requirement。

Risk：owner commit can succeed while subsequent Audit persistence fails。

V1 response/logging semantics are frozen，and this is tracked below as MEDIUM TECH_DEBT rather than hidden。

## 14. Bootstrap Audit

PASS。

```text
public HTTP bootstrap = NO
default admin/admin    = NO
long-lived bootstrap env secret = NO
first-run CLI          = YES
Identity active check  = YES
single Operations tx   = YES
bootstrap audit        = YES
second invocation after any Operator exists = REJECT
```

No bootstrap auth backdoor remains in HTTP surface。

## 15. Public Contract Audit

PASS。

Frozen conceptual exports：

```text
OperationsAuthorizer
OperationsOperatorResolver
OperationsAuditRecorder
AuthorizedOperatorContext
OperatorPermissionKey / static catalog
```

Forbidden exports：

```text
repositories
DatabaseExecutor
TransactionManager
DB rows
SQL
```

This gives future owner Domains one reusable RBAC path instead of reimplementing Operations SQL。

## 16. HTTP/API Audit

PASS。

Operations management base follows current Platform/Admin convention：

```text
/api/v1/admin/operations
```

Key results：

- `/me` feeds Admin Foundation real permission state；
- operator/role management uses stable UUID；
- role assignments use idempotent PUT/DELETE；
- role permission mutation has one model only：complete-set PUT；
- Permission Catalog is read-only code source；
- Audit filters only use schema-supported dimensions；
- no bootstrap HTTP endpoint；
- Foundation AppError envelope reused。

Internal BIGINT leakage = 0。

## 17. Admin Integration Readiness Audit

PASS at contract level。

Admin Foundation has compatible Auth/Permission skeleton，UUID/error/API client contracts。

Future binding：

```text
Identity token
→ GET Operations /me
→ exact permissions
→ PermissionGuard/can() for UI
→ backend OperationsAuthorizer for actual enforcement
```

No Admin page code was started。

## 18. Cache / Performance Audit

PASS。

```text
PostgreSQL direct RBAC read = YES
in-process cache            = NO
Redis                       = NO
```

Given low Admin QPS and high stale-permission risk，this is the lower-operations V1 choice。

## 19. Use Case Audit

Final classification：

```text
REQUIRED      = 24
DEFERRED      = 4
NOT_SUPPORTED = 11
```

Required set covers current operator，authorization，operator/role management，assignment，permission catalog/set，audit query/recording，bootstrap。

No mechanical table CRUD expansion found。

## 20. Findings

### MEDIUM-01 — Cross-Domain Audit Persistence Gap

**Finding**

Frozen owner-domain write and Operations audit cannot be made atomic without either a cross-domain transaction or an owner-domain outbox integration contract。

**Why not silently use Outbox now**

Platform Design Gate has already frozen `Platform Outbox events = NONE REQUIRED IN V1`。Changing that here would invalidate a separate Domain design without an explicit revision。

**V1 Resolution/Containment**

```text
owner commit
→ synchronous Operations audit attempt
→ on audit failure: critical log request/operator/action/target
→ return stable ambiguity error; client refreshes before retry
```

**Residual Risk**

A committed business action can exist without the canonical Operator audit row if the second write fails。

**Status**

```text
ACCEPTED V1 TECH_DEBT
Severity = MEDIUM
Design decision unresolved = NO
Database conflict = NO
```

Future fix requires explicit cross-domain outbox contract revision。

### LOW-01 — DEVELOPMENT_PROGRESS Was Stale for Platform Design

At audit start，`DEVELOPMENT_PROGRESS.md` still showed Platform `NOT_STARTED / plan pending` despite Platform design docs existing and Design Gate PASS。

This is documentation drift，not runtime architecture drift。

This session should update the progress board after Operations docs are committed。

## 21. Anti-Pattern Audit

```text
duplicate admin auth system                 = 0
Operations SQL -> identity.*                 = 0
Operations SQL -> platform.*                 = 0
internal BIGINT leakage                      = 0
permission wildcard ambiguity                = 0
role hierarchy overengineering               = 0
ABAC creep                                    = 0
audit replacing business fact                = 0
Operations owning Platform state             = 0
public bootstrap backdoor                    = 0
superadmin authorization bypass              = 0
unhandled last-admin race                     = 0
permission cache stale-state design           = 0
```

## 22. Remaining Counts

After all product decisions are frozen：

```text
BLOCKER = 0
HIGH    = 0
MEDIUM  = 1
LOW     = 0 after progress board synchronization
```

`MEDIUM-01` is explicit V1 technical debt，not an unresolved product decision。

## 23. Gate Conditions

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
Frozen migration edited = NO
New Operations table required = NO
Operations implementation started = NO
```

## 24. Final Design Gate

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

Design PASS does not authorize implementation automatically。Another execution-development session must explicitly begin OPS-01。

STOP。
