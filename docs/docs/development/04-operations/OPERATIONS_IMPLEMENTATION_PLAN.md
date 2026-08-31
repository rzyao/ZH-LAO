---
status: complete
phase: 4
phase_name: Operations Domain
document: OPERATIONS_IMPLEMENTATION_PLAN
last_updated: 2026-08-31
design_only: false
implementation_started: true
implementation_complete: true
implementation_gate: PASS
repository_commit_audited: e1330ba7db6de6b946ec529a84a8cca26f1ea8e9
depends_on:
  - OPERATIONS_USE_CASES.md
  - OPERATIONS_RBAC_CONTRACTS.md
  - OPERATIONS_API.md
  - ../03-platform/PLATFORM_IMPLEMENTATION_REPORT.md
---

# ZH-LAO  — Operations Implementation Plan

## 0. Implementation Closure Status

本计划最初作为 Design Gate 后的执行顺序冻结文件。以下状态是 2026-08-31 完成 `OPERATIONS_EXECUTION_BRIEF.md` 最终实施审计后的权威收口状态；下文保留的“未来执行 / 当前设计会话不得实现”等文字属于设计时历史语境，不再覆盖本节最终状态。

```text
Tested implementation head = e1330ba7db6de6b946ec529a84a8cca26f1ea8e9
OPS-00 ~ OPS-17            = COMPLETE
OPERATIONS_IMPLEMENTATION  = COMPLETE
OPERATIONS_GATE            = PASS
OPERATIONS_DOMAIN          = FROZEN
```

| Task | Status |
| --- | --- |
| OPS-00 Design Freeze | `COMPLETE / PASS` |
| OPS-01 Module Skeleton | `COMPLETE / PASS` |
| OPS-02 Domain Types / Permission Catalog | `COMPLETE / PASS` |
| OPS-03 Repository Layer | `COMPLETE / PASS` |
| OPS-04 Identity Public Adapter / Operator Resolution | `COMPLETE / PASS` |
| OPS-05 Authorization / RBAC | `COMPLETE / PASS` |
| OPS-06 Operator Management | `COMPLETE / PASS` |
| OPS-07 Role Management | `COMPLETE / PASS` |
| OPS-08 Role Assignment / Permission Set | `COMPLETE / PASS` |
| OPS-09 Audit Logging | `COMPLETE / PASS` |
| OPS-10 Public Contracts | `COMPLETE / PASS` |
| OPS-11 Operations HTTP/API | `COMPLETE / PASS` |
| OPS-12 Bootstrap First Operator | `COMPLETE / PASS` |
| OPS-13 Operations Core Integration / E2E | `COMPLETE / PASS` |
| OPS-14 Platform Management RBAC/Audit Integration | `COMPLETE / PASS` |
| OPS-15 Security / Race | `COMPLETE / PASS` |
| OPS-16 Final Implementation Conformance Audit | `COMPLETE / PASS` |
| OPS-17 Final Report / Exit Gate | `COMPLETE / PASS` |

最终实现、测试、finding 与 Exit Gate 证据见 `OPERATIONS_IMPLEMENTATION_REPORT.md`。

> 以下内容保留为 implementation execution specification / historical plan，不重写设计历史。

## 1. Entry State

最终 repository re-audit baseline：

```text
Branch                       = main
Pre-Operations design commit = 000f4c4aafacf4938d74902eddc4d78323196a89
Identity                     = COMPLETE / PASS / FROZEN
Admin Foundation             = COMPLETE / PASS
Platform Design Gate         = PASS
Platform Implementation      = COMPLETE
Platform Gate                = PASS
Platform Domain              = FROZEN
Operations frozen tables     = 5
Operations module            = NOT_PRESENT
Operations implementation    = NOT_STARTED
```

Platform 已完成 PLT-01 corrective migration（`1250_platform_override_indexes.sql`）和 Phase 3 implementation，所以本 Operations Phase 不再等待 Platform implementation。

当前 Platform application 层已经实现 33 required use cases；HTTP 只注册 runtime routes。Platform management HTTP + Operations RBAC/Audit wiring 属 OPS-14 integration scope。

## 2. Global Constraints

整个未来执行阶段禁止：

```text
edit database/migrations/0200_operations.sql
add a sixth Operations table
add permission dictionary table
query identity.* directly
query/write platform.* from Operations repositories
create admin username/password/session/JWT system
add wildcard/deny/hierarchy/ABAC
add Redis/Kafka/microservice
start Content Domain
```

本 Design Audit：

```text
DATABASE_CONTRACT_CONFLICT = 0
Operations corrective migration required = NO
```

## 3. Dependency Split

### Operations Core

OPS-01 ~ OPS-13 与 OPS-15 可直接基于 Identity/Fundation + frozen Operations DB 实施。

### Platform Integration

OPS-14 的 external dependency **已经满足**：Platform `COMPLETE/PASS/FROZEN`。

它仍应排在 Operations public authorizer/audit 完成之后，因为剩余工作是：

```text
Platform management HTTP/application adapter
+ Operations exact permission enforcement
+ Operations success Audit
```

不是 Platform canonical logic redesign。

## OPS-00 — Design Freeze

**Goal**：将本会话文档设为唯一 implementation input。

**Scope**：

```text
OPERATIONS_USE_CASES.md
OPERATIONS_RBAC_CONTRACTS.md
OPERATIONS_API.md
OPERATIONS_IMPLEMENTATION_PLAN.md
OPERATIONS_DESIGN_AUDIT.md
```

**Dependencies**：Identity PASS；Platform PASS；frozen `0200_operations.sql`。

**Files**：docs only。

**Tests**：document cross-check。

**Audit**：unresolved decisions=0；database conflicts=0。

**Gate**：`OPERATIONS_DESIGN_GATE = PASS` before OPS-01。

## OPS-01 — Module Skeleton

**Goal**：创建与当前 Identity/Platform 一致的 Modular Monolith boundary，不实现业务。

**Scope**：

```text
apps/backend/src/modules/operations/
├── domain/
├── application/ports/
├── infrastructure/
├── http/
├── public/
└── index.ts
```

**Dependencies**：Foundation module/composition conventions。

**Files**：Operations skeleton + composition registration only。

**Tests**：typecheck/build；import-boundary；business route absent。

**Audit**：no repositories/SQL/business behavior accidentally introduced。

**Gate**：Module Boundary PASS。

## OPS-02 — Domain Types / Permission Catalog

**Goal**：实现 UUID/status/role code/permission grammar 与 static catalog。

**Scope**：

```text
OperatorId / RoleId / AuditLogId
OperatorStatus / RoleStatus
RoleCode
OperatorPermissionKey / AuditActionKey
OPERATOR_PERMISSION_CATALOG
```

Initial catalog：Operations 16 + Platform 10 = 26 exact keys。

**Dependencies**：OPS-01 + RBAC contract。

**Files**：`domain/*`，`public/permissions.ts` or equivalent。

**Tests**：exact 3 segments；lower_snake_case；wildcard reject；unknown reject；varchar length；Platform 10 exact-match frozen docs。

**Audit**：no invented future Domain keys；no permissions table。

**Gate**：Permission Catalog PASS。

## OPS-03 — Repository Layer

**Goal**：建立只访问 `operations.*` 的 persistence boundary。

**Scope**：operators / roles / operator_roles / role_permissions / operator_audit_logs / RBAC resolution / audit filters。

**Dependencies**：OPS-02；Foundation DatabaseExecutor/TransactionManager。

**Files**：`application/ports/*`，`infrastructure/repositories.ts`。

**Tests**：real PostgreSQL UUID mapping；UNIQUE constraints；composite PK；role reverse lookup；active-role permission union query；audit filters；rollback。

**Audit**：

```text
SQL identity.* = 0
SQL platform.* = 0
Operations tables touched = frozen 5 only
```

**Gate**：Repository Boundary PASS。

## OPS-04 — Identity Public Adapter / Operator Resolution

**Goal**：实现 `AuthContext.subjectId -> Operator` 与 Create/Enable/Bootstrap Identity validation。

**Scope**：consume Foundation AuthContext；consume only current `IdentityPublicQueries` interface；resolve by `auth_subject_id`；active/disabled semantics。

**Dependencies**：Identity PASS + OPS-03。

**Files**：Operations application adapters/services；no Identity internals。

**Tests**：active identity/operator；non-operator；disabled operator；missing/inactive subject；static import boundary。

**Audit**：duplicate password/OTP/session/JWT code = 0。

**Gate**：Identity Boundary PASS。

## OPS-05 — Authorization / RBAC

**Goal**：实现 exact Permission union 与 stable public authorizer。

**Scope**：

```text
active Operator
→ active Roles
→ exact permission UNION
→ require exact key
```

No cache。

**Dependencies**：OPS-02~04。

**Files**：application authorization service + public adapter。

**Tests**：multi-role union；duplicate collapse；disabled role ignored；disabled operator deny all；no-role empty；exact-only；wildcard absent；super_admin explicit-row proof（删除一条 test permission 后 deny）。

**Audit**：authorization allow branch based on `role.code === 'super_admin'` = 0。

**Gate**：RBAC PASS。

## OPS-06 — Operator Management

**Goal**：实现 List/Get/Create/Update/Disable/Enable Operator。

**Scope**：frozen Use Cases；auth_subject immutable；no delete。

**Dependencies**：OPS-04/05 + local Audit primitive。

**Files**：Operations application services。

**Tests**：active Identity create；duplicate conflict；inactive/missing Identity；display name update；immutable auth subject；disable/enable；enable requires active Identity；no delete method；same-tx state+Audit rollback。

**Audit**：lifecycle matches contract。

**Gate**：Operator Management PASS。

## OPS-07 — Role Management

**Goal**：实现 List/Get/Create/Update/Disable/Enable Role 与 reserved `super_admin` policy。

**Scope**：code immutable；custom roles；super_admin protected；no delete。

**Dependencies**：OPS-03/05 + local Audit primitive。

**Files**：Role application services。

**Tests**：code format/unique；code update reject；metadata update；custom disable/enable；super_admin disable reject；state+Audit atomic。

**Audit**：no `is_system` DB field invented。

**Gate**：Role Management PASS。

## OPS-08 — Role Assignment / Permission Set

**Goal**：实现 assignment 与唯一 complete-set permission mutation。

**Scope**：list/assign/revoke roles；list catalog；list/set Role permissions；last-super-admin invariant；super_admin catalog reconciliation。

**Dependencies**：OPS-02/03/05/07。

**Files**：assignment/permission application services。

**Tests**：multi-role；duplicate assign idempotent；concurrent duplicate assign；revoke idempotent；disabled target reject；catalog validation；empty custom set；concurrent set serialized；super_admin exact full catalog；last-admin disable/revoke race；no-op no Audit。

**Audit**：no alternate Grant/Remove permission service/API。

**Gate**：Assignment/Permission PASS。

## OPS-09 — Audit Logging

**Goal**：实现 immutable success-only Operator Audit。

**Scope**：local same-tx Audit writer；public cross-domain success recorder；list/detail queries；safe details policy；no update/delete repository path。

**Dependencies**：OPS-03 + Audit contract。

**Files**：audit application/infrastructure/public adapter。

**Tests**：actor FK；action grammar；target combinations；request_id/IP；trusted-proxy source handling；safe details rejection；same-tx rollback；no-op no Audit；failed/denied no canonical Audit；cursor/filter queries；no UPDATE/DELETE path。

**Audit**：no `result` column or `details.result` convention。

**Gate**：Audit Contract PASS。

## OPS-10 — Public Contracts

**Goal**：实现其他 Domain 唯一允许依赖的 Operations boundary。

**Scope**：

```text
OperationsAuthorizer
OperationsOperatorResolver
OperationsAuditRecorder
AuthorizedOperatorContext
OperatorPermissionKey/catalog
```

**Dependencies**：OPS-05/09。

**Files**：`modules/operations/public/*`。

**Tests**：public imports compile；external fixture can authorize + record safe Audit using public contract only。

**Audit**：repo/DB/SQL export = 0。

**Gate**：Public Contract PASS。

## OPS-11 — Operations HTTP/API

**Goal**：实现 frozen `/api/v1/admin/operations/**` endpoints。

**Scope**：所有 REQUIRED Operations HTTP endpoints；Bootstrap 与 public Audit recorder 不走 HTTP。

**Dependencies**：OPS-06~10 + Foundation auth/error conventions。

**Files**：`modules/operations/http/*` + composition wiring。

**Tests**：401；authenticated non-operator 403；disabled 403；missing exact permission 403；success DTO；strict unknown fields；UUID；stable errors；SQL errors hidden；`/me` effective permissions；idempotent PUT/DELETE。

**Audit**：route direct SQL/repository access = 0。

**Gate**：Operations HTTP PASS。

## OPS-12 — Bootstrap First Operator

**Goal**：解决 zero-admin initialization，不留 public backdoor。

**Scope**：controlled CLI；first Operator + reserved super_admin + full exact catalog + Audit。

**Dependencies**：OPS-02/03/04/08/09。

**Files**：backend CLI/script composition；no HTTP route。

**Tests**：empty system success；Identity missing/inactive reject；transaction rollback no partial state；second invocation reject；no default credential；Audit produced；full explicit catalog rows。

**Audit**：public bootstrap route = 0；long-lived bypass = 0。

**Gate**：Bootstrap PASS。

## OPS-13 — Operations Core Integration / E2E

**Goal**：用 real PostgreSQL + current Identity AuthenticationProvider 验证 auth→RBAC→Operations mutation→Audit 全链路。

**Scope**：Operations core only。

**Dependencies**：OPS-01~12。

**Files**：integration/E2E tests。

**Tests**：bootstrap；Identity login/auth；GET `/me`；create operator/role；set permissions；assign；allowed/denied endpoints；disable operator immediate next-request deny；disable role removes permission；re-enable restores；last-admin protection；Audit timeline。

**Audit**：core auth/repository fakes = 0 in E2E。

**Gate**：Operations Core E2E PASS。

## OPS-14 — Platform Management RBAC/Audit Integration

**Goal**：将 Platform 已实现的 management application use cases 接入统一 Admin authentication/RBAC/Audit contract。

**Scope**：实现/注册 frozen `/api/v1/admin/platform/**` management routes or adapter wiring；每个 resource 使用已冻结 Platform exact permission；Platform canonical writes 仍由 Platform application/infrastructure 执行。

**Dependencies**：

```text
PLATFORM_IMPLEMENTATION = COMPLETE
PLATFORM_GATE = PASS
OPS-10 Public Contract PASS
OPS-11 HTTP infrastructure available
```

External dependency status：**SATISFIED**。

**Files**：composition root + Platform management HTTP adapter/integration wiring as required；不得在 Operations repository 增加 Platform SQL。

**Tests**：每个 Platform management read/write exact permission；frontend guard bypass cannot bypass backend；Platform state remains owner-owned；successful write Audit；Audit failure ambiguity handling；no distributed transaction。

**Audit**：

```text
Operations SQL -> platform.* = 0
Platform-owned RBAC implementation = 0
Operations-owned Platform state = 0
```

**Gate**：Platform Integration PASS。

## OPS-15 — Security / Race

**Goal**：专项验证授权安全与关键并发 invariant。

**Scope**：mass assignment；IDOR；permission injection；wildcard attempts；operator/role disable races；permission replace race；last-super-admin race；bootstrap race；Audit secret leakage；proxy/IP handling。

**Dependencies**：OPS-13；Platform cases after OPS-14。

**Files**：security/race tests only unless finding requires contract-conformant fix。

**Tests**：multi-run real PostgreSQL concurrency suite。

**Audit**：no stale RBAC cache；linearization semantics match docs。

**Gate**：Security/Race PASS。

## OPS-16 — Final Implementation Conformance Audit

**Goal**：独立核对 frozen docs ↔ implementation。

**Scope**：DB/repositories；Use Cases/services；RBAC；Public Contract；HTTP；Audit；Bootstrap；Admin Foundation compatibility；Platform boundary。

**Dependencies**：OPS-01~15 required work complete。

**Files**：audit report inputs only。

**Tests**：backend verify/build/integration；database validation；targeted architecture searches；fresh PostgreSQL。

**Audit**：Severity = BLOCKER/HIGH/MEDIUM/LOW；frozen migration edit check。

**Gate**：BLOCKER=0/HIGH=0 before final report。

## OPS-17 — Final Report / Exit Gate

**Goal**：生成未来 `OPERATIONS_IMPLEMENTATION_REPORT.md` 并决定 implementation Gate。

**Scope**：tests/evidence；dependency status；security/race；migration delta；remaining debt。

**Dependencies**：OPS-16 PASS。

**Files**：future implementation report + progress sync。

**Tests**：re-run repository CI-required backend/database commands；Admin integration tests when implemented。

**Audit**：不得把 Design Gate 当 Implementation Gate。

**Gate**：未来才能设置：

```text
OPERATIONS_IMPLEMENTATION = COMPLETE
OPERATIONS_GATE = PASS
```

当前会话必须保持：

```text
OPERATIONS_IMPLEMENTATION_STARTED = NO
```

## 4. Admin Client Scope After Backend Contract

未来可实现：

```text
current Operator binding
permission-aware navigation
backend-backed route/action guards
Operator management
Role management
Permission editor
Audit log view
```

但本计划不开发 Admin 页面。

## 5. Outbox / Cache Decision

```text
Operations RBAC outbox = NONE
Authorization cache    = NONE
Redis/Kafka            = NONE
```

Reliable cross-domain Audit delivery via outbox 仍为 explicit DEFERRED TECH_DEBT，不是隐藏 implementation task。

## 6. Start Condition

另一个 execution-development session 只有在：

```text
OPERATIONS_DESIGN_GATE = PASS
canonical docs committed
user explicitly asks to begin Operations implementation
```

后才能进入 OPS-01。

STOP。
