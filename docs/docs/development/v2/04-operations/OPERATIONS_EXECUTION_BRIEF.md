---
status: ready
phase: 4
phase_name: Operations Domain
artifact: execution_brief
entry_gate: OPERATIONS_DESIGN_GATE = PASS
execution_started: false
last_updated: 2026-08-31
---

# ZH-LAO V2 — Operations Execution Brief

> 本文件是 **Operations Domain 执行开发会话的入口文档**。
>
> 它不是新的设计权威，也不替代 `OPERATIONS_IMPLEMENTATION_PLAN.md`、`OPERATIONS_USE_CASES.md`、`OPERATIONS_RBAC_CONTRACTS.md`、`OPERATIONS_API.md`、`OPERATIONS_DESIGN_AUDIT.md`。
>
> 执行 AI 必须先通过 GitHub 连接器读取远程仓库当前 `main`，再依据当前 canonical 文档实施；不得根据本文件中的历史状态猜测仓库现状。

## 1. Mission

执行完整 Operations Implementation：

```text
Repository Re-Audit
→ Read Frozen Design
→ OPS-00 Entry Check
→ OPS-01 ... OPS-xx Implementation
→ PostgreSQL Integration / Security / Race
→ Platform Management Integration
→ Final Audit
→ OPERATIONS_GATE
→ Freeze Operations
→ STOP
```

本会话是 **纯执行开发会话**。

不要重新做 Operations 产品设计；不要开始 Content Domain；不要开发 Admin 前端页面。

## 2. Mandatory GitHub Entry Audit

开始任何代码修改前，必须使用 GitHub 连接器连接：

```text
repository = rzyao/ZH-LAO
branch = main
```

读取并记录：

```text
latest HEAD commit
DEVELOPMENT_PROGRESS.md
MASTER_DEVELOPMENT_PLAN.md
04-operations/* canonical docs
0200_operations.sql
current backend module conventions
identity/public current exports
platform/public current exports
Platform implementation report
current CI workflow
current migration registry/count
```

必须确认：

```text
OPERATIONS_DESIGN_GATE = PASS
Identity = COMPLETE / PASS / FROZEN
Platform = COMPLETE / PASS / FROZEN
Admin Foundation = PASS
Operations implementation has not already been completed by another commit
```

如果远程 `main` 已经前进，以当前仓库事实为准，不要回滚到本文写入时的 commit。

如果 `OPERATIONS_DESIGN_GATE != PASS`：

```text
OPERATIONS_IMPLEMENTATION = BLOCKED
STOP
```

如果发现 canonical 文档互相冲突，先标记 `DESIGN_CONTRACT_CONFLICT`，不得自行重设计后继续。

## 3. Design Authority

按以下优先级执行：

```text
1. Frozen PostgreSQL physical contract
2. OPERATIONS_DESIGN_AUDIT.md
3. OPERATIONS_RBAC_CONTRACTS.md
4. OPERATIONS_USE_CASES.md
5. OPERATIONS_API.md
6. OPERATIONS_IMPLEMENTATION_PLAN.md
7. Current Foundation / Identity / Platform public contracts
8. This Execution Brief
```

核心 canonical docs：

```text
docs/docs/development/v2/04-operations/OPERATIONS_IMPLEMENTATION_PLAN.md
docs/docs/development/v2/04-operations/OPERATIONS_USE_CASES.md
docs/docs/development/v2/04-operations/OPERATIONS_RBAC_CONTRACTS.md
docs/docs/development/v2/04-operations/OPERATIONS_API.md
docs/docs/development/v2/04-operations/OPERATIONS_DESIGN_AUDIT.md
```

数据库权威：

```text
database/v2/migrations/0200_operations.sql
```

Operations frozen core tables = exactly 5：

```text
operations.operators
operations.roles
operations.operator_roles
operations.role_permissions
operations.operator_audit_logs
```

## 4. Global Architecture Rules

继续遵守全局规则：

```text
Modular Monolith
Node.js + TypeScript + ESM
Fastify
PostgreSQL
pg
Zod
Pino
Vitest
```

数据库：

```text
same Domain FK = real PostgreSQL FK
cross Domain physical FK = 0
cross Domain internal BIGINT reference = 0
cross Domain reference = stable logical/public UUID
```

代码边界：

```text
apps/backend/src/modules/operations/
├── domain/
├── application/
├── infrastructure/
├── http/
└── public/
```

Operations 不得拥有自己的 `Pool`，必须复用 Foundation `DatabaseExecutor` / `TransactionManager`。

Operations repositories 只允许 SQL `operations.*`。

禁止直接 SQL：

```text
identity.*
platform.*
content.*
learning.*
audio.*
social.*
chat.*
commerce.*
rewards.*
trust.*
```

跨 Domain 调用只允许对应 `public/` contract。

## 5. Identity Boundary

管理员身份认证不属于 Operations。

必须复用当前 Foundation/Identity authentication：

```text
Bearer / AuthContext
→ Identity stable public subject UUID
→ Operations operator resolution by auth_subject_id
→ RBAC authorization
```

只允许依赖当前：

```text
modules/identity/public
```

禁止：

```text
Identity repositories
Identity application internals
Identity infrastructure
Identity internal BIGINT
重新实现 OTP/password/session/JWT
```

Operations 负责的是 **operator mapping + authorization**，不是第二套 authentication system。

## 6. RBAC Contract Must Remain Exact

严格执行 frozen RBAC contract。

核心算法：

```text
authenticated Identity subject
→ active Operator
→ active assigned Roles
→ exact permission UNION
→ exact permission match
→ allow / deny
```

不得引入：

```text
wildcard permission
deny rule
role hierarchy
ABAC
per-user direct permission
implicit super_admin bypass
```

`super_admin` 如果存在，权限必须来自显式 role_permissions rows；禁止代码中：

```text
if (role.code === 'super_admin') allowEverything()
```

Permission grammar 和 catalog 必须完全遵循 `OPERATIONS_RBAC_CONTRACTS.md`。

初始 catalog 只实现已经冻结的 Operations + Platform 权限；不要提前为 Content/Trust 等未来 Domain 发明 permission keys。

## 7. Operator / Role Lifecycle

所有 lifecycle 以 frozen Use Cases 为准。

必须保持至少以下原则：

```text
Operator auth_subject_id immutable
Operator physical delete = not supported
Role code immutable
Used Role physical delete = not supported
Role disabled => authorization no longer derives permissions from it
Operator disabled => deny all operator permissions
Identity inactive/closed => cannot become an effective operator
```

不要因为 Admin 使用方便而新增数据库字段或改变 lifecycle。

## 8. Audit Contract

`operations.operator_audit_logs` 是 operator 行为审计事实，不是其他 Domain 的 canonical business fact。

Operations 自身 mutation：

```text
Operations state mutation
+
Operations success audit
```

应按 frozen contract 尽可能同一 Operations transaction 原子完成。

跨 Domain management，例如 Platform：

```text
Operator authorization
→ Platform canonical mutation
→ Operations audit according to frozen success/failure semantics
```

禁止通过跨 Domain transaction 或直接 SQL 强行实现 distributed atomicity。

Design Audit 已接受的 V1 cross-domain audit durability TECH_DEBT 必须保留真实记录；不得偷偷宣称已解决，除非本轮确实按 canonical architecture 提供了经过审计的新方案且不改变冻结设计。

## 9. Bootstrap First Operator

严格实现冻结 bootstrap strategy。

必须满足：

```text
explicit
controlled
non-public HTTP
no default username/password
no permanent backdoor
identity subject validation
repeat-safe / conflict-safe
observable/auditable according to contract
```

不得加入：

```text
admin/admin
hard-coded admin token
special query parameter secret
unprotected bootstrap route
```

## 10. Execute the Actual OPS Plan

**不要根据本文重新编号任务。**

必须读取当前 `OPERATIONS_IMPLEMENTATION_PLAN.md`，按其中最新 `OPS-xx` 顺序连续执行。

仓库设计时的任务范围包括但不限于：

```text
Module Skeleton
Domain Types / Permission Catalog
Repositories
Identity Public Adapter / Operator Resolution
Authorization / RBAC
Operator Management
Role Management
Role Assignment / Permission Set
Audit Logging
Public Contracts
Operations HTTP/API
Bootstrap First Operator
Integration/E2E
Platform Management Integration
Security/Race
Final Audit / Report / Exit Gate
```

如果当前 plan 已新增、合并或重新编号任务，以当前 plan 为准。

每个 OPS task：

```text
Implement
→ focused tests
→ audit task invariant
→ PASS
→ next task
```

不需要每个 task 停下来等待人工回复；这是连续执行任务。

## 11. Platform Management Integration

Platform 已冻结，当前 Platform canonical state 仍归 Platform。

Operations Implementation 必须完成 frozen integration scope：

```text
/api/v1/admin/platform/* management routes
→ Foundation/Identity authentication
→ Operations operator resolution
→ exact Operations permission enforcement
→ Platform application use case
→ Operations audit
```

Platform permission requirements 必须与当前 `PLATFORM_API.md` / Operations permission catalog exact-match。

禁止：

```text
Operations repository SQL platform.*
复制 Platform state 到 Operations
在 Platform 中实现第二套 RBAC
为了测试临时开放无鉴权 Platform write API
```

如果 Platform 管理 use cases 或 adapter 已在当前 `main` 中实现，复用它们；不要重新实现 canonical Platform business logic。

## 12. Public Contract

最终其他 Domain 只应依赖：

```text
modules/operations/public
```

Public API 应提供冻结的 operator authorization / summary / permission contract，而不是 persistence internals。

Public exports 禁止出现：

```text
OperationsRepositories
DatabaseExecutor
TransactionManager
Postgres*Repository
internal BIGINT
raw DB row
SQL adapter
```

Architecture tests 必须证明：

```text
other-domain -> operations/public = allowed
other-domain -> operations/application = forbidden
other-domain -> operations/infrastructure = forbidden
```

## 13. HTTP/API

严格实现当前 `OPERATIONS_API.md`。

HTTP layer 只做：

```text
validation
auth context
application invocation
presentation
```

必须：

```text
HTTP SQL = 0
HTTP direct repository access = 0
unknown fields rejected
Foundation error envelope reused
internal BIGINT response exposure = 0
```

不要为了 Admin UI 便利擅自增加未冻结 endpoint。

## 14. Security Audit

至少检查：

```text
operator privilege escalation
role assignment authorization
permission mutation authorization
mass assignment
IDOR
inactive operator bypass
disabled role bypass
super_admin implicit bypass
bootstrap backdoor
internal ID leakage
cross-domain internal imports
sensitive auth/token logging
SQL ownership
```

专项搜索：

```text
TODO
FIXME
HACK
as any
@ts-ignore
@ts-expect-error
console.log
role.code === 'super_admin'
SELECT ... identity.
SELECT ... platform.
```

任何命中都要人工判断并在最终报告分类。

## 15. PostgreSQL Concurrency / Race

使用真实 PostgreSQL。

至少覆盖当前 frozen design 实际需要的竞争：

```text
same role concurrent assignment
same role concurrent removal
operator disable vs authorize
role disable vs authorize
role permission concurrent replace/update
last-admin / lockout protection race（若 frozen contract requires）
bootstrap concurrency
unique auth_subject / role code conflicts
```

测试业务 invariant，不依赖窄毫秒 timing assertion。

不得用 mock DB / SQLite 替代 race tests。

## 16. Database Freeze

默认：

```text
0200_operations.sql modifications = 0
Operations core tables = 5
```

设计阶段已经裁决：

```text
DATABASE_CONTRACT_CONFLICT = 0
Operations corrective migration prerequisite = NO
```

因此不要主动加 migration。

如果实现过程中真的发现 frozen physical contract defect：

```text
1. 不得修改历史 frozen migration
2. 标记 DATABASE_CONTRACT_CONFLICT
3. 给出证据
4. 只有符合项目 forward-only migration policy 时才能新增 forward migration
5. 必须重新执行全库 audit
```

Migration 数量不得写死为 18；始终读取当前 migration registry，最终报告实际：

```text
Fresh migrations = current actual count
Second run = 0
Database audit = PASS
```

## 17. Full Regression

完成后至少执行当前仓库已有的 mandatory gates：

```text
Backend typecheck
Backend lint
Architecture audit
Backend build
Unit tests
Real PostgreSQL integration
Security tests
Race tests
Database tests
Fresh migration validation
Second migration no-op
Database audit
Identity regression
Platform regression
Admin Foundation regression
Mobile Foundation regression if current CI marks it mandatory
Docs / VitePress build
GitHub workflow validation
```

以当前 package scripts / CI 为准，不得使用：

```text
|| true
--passWithNoTests
continue-on-error
```

掩盖 mandatory failure。

## 18. Documentation / Report

实现过程中更新当前 canonical plan/report/progress，而不是制造互相冲突的权威源。

最终至少生成：

```text
docs/docs/development/v2/04-operations/OPERATIONS_IMPLEMENTATION_REPORT.md
```

并更新：

```text
OPERATIONS_IMPLEMENTATION_PLAN.md task status
OPERATIONS_DESIGN_AUDIT.md only if needed to record post-design facts without rewriting historical result
DEVELOPMENT_PROGRESS.md
```

报告必须保留真实历史和实际测试数量。

## 19. Final Independent Audit

最终重新审计：

```text
Frozen 5-table contract
Required Use Cases
RBAC exact semantics
Permission catalog
Identity boundary
Platform boundary
Public contract
HTTP contract
Bootstrap
Audit semantics
Security
Concurrency
Database freeze
Full regression
```

Severity：

```text
BLOCKER
HIGH
MEDIUM
LOW
```

只有：

```text
BLOCKER = 0
HIGH = 0
all mandatory gates = PASS
```

才允许：

```text
OPERATIONS_IMPLEMENTATION = COMPLETE
OPERATIONS_GATE = PASS
OPERATIONS_DOMAIN = FROZEN
```

MEDIUM/LOW 如保留，必须记录 owner / rationale / removal condition / target phase。

## 20. Hard Stop / Out of Scope

本执行会话绝对不要：

```text
start Content Domain
implement Content permissions ahead of Content design
build Admin frontend pages
redesign Platform
modify Identity internals
add Operations table
add permission dictionary table
add wildcard RBAC
add ABAC
add Redis
add Kafka
split microservice
create admin username/password/session/JWT system
```

完成 Operations Gate 后必须 STOP。

## 21. Final Response Format

最终只汇报：

```text
OPERATIONS IMPLEMENTATION RESULT

Repository HEAD = ...
OPS-xx = COMPLETE / BLOCKED
...

Database:
Frozen tables = 5
0200 migration changes = 0
Forward migration added = YES/NO
Fresh migrations = actual current count
Second run = 0
Database audit = PASS/FAIL
Cross-domain SQL = 0/...

Architecture:
Operations DB Pool = 0/...
Foundation TransactionManager reused = YES/NO
Identity internal imports = 0/...
Platform direct SQL = 0/...
HTTP SQL = 0/...
HTTP repository access = 0/...
Public internal exposure = 0/...

RBAC = PASS/FAIL
Bootstrap = PASS/FAIL
Audit = PASS/FAIL
Platform Management Integration = PASS/FAIL
Security = PASS/FAIL
Concurrency = PASS/FAIL

Tests:
Unit = ?
Integration = ?
HTTP = ?
E2E = ?
Security = ?
Race = ?

Identity Regression = PASS/FAIL
Platform Regression = PASS/FAIL
Admin Regression = PASS/FAIL
Mobile Regression = PASS/FAIL/NOT_MANDATORY
Docs Build = PASS/FAIL
CI = PASS/FAIL

Findings:
BLOCKER = ?
HIGH = ?
MEDIUM = ?
LOW = ?

OPERATIONS_DESIGN_GATE = PASS
OPERATIONS_IMPLEMENTATION = COMPLETE/IN_PROGRESS/BLOCKED
OPERATIONS_GATE = PASS/FAIL
OPERATIONS_DOMAIN = FROZEN/NOT_FROZEN
```

然后列出修改文件、测试、报告路径、TECH_DEBT / OUT_OF_SCOPE_FINDING。

**STOP。不得自动进入 Content。**
