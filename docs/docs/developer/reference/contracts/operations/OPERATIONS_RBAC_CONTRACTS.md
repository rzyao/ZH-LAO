---
status: frozen
phase: 4
phase_name: Operations Domain
document: OPERATIONS_RBAC_CONTRACTS
last_updated: 2026-09-02
repository_commit_audited: 000f4c4aafacf4938d74902eddc4d78323196a89
database_authority:
  - database/migrations/0200_operations.sql
depends_on:
  - ../02-identity/IDENTITY_IMPLEMENTATION_REPORT.md
  - ../03-platform/PLATFORM_IMPLEMENTATION_REPORT.md
implementation_started: false
lifecycle: historical
---

> 迁移说明：本文是迁移时保留的契约/证据快照，不是当前调度权限。当前产品状态请看 [ZH-LAO 产品开发全景](/developer/)，执行规格请看 `.specify/` 与 `specs/`，真实完成请以代码、测试与 CI 为准。


# ZH-LAO  — Operations RBAC Contracts

> 本文冻结 Operations V1 的 Operator lifecycle、RBAC、Permission Catalog、Authorization、Audit 与 Bootstrap 契约。
>
> 本文只做设计，不修改 frozen migration，不实现 Operations，不增加第 6 张表，不建立管理员独立认证系统。

## 1. Repository Re-Audit

本设计开始时首次读取到的 `main` 为 Platform Design Gate 提交；在设计进行期间远程 `main` 又合入 Platform Phase 3 implementation 与 Identity regression hotfix。Operations 第一份文档真正写入前的代码基线提交为：

```text
000f4c4aafacf4938d74902eddc4d78323196a89
feat(platform): implement Phase 3 platform domain and identity hotfixes
```

因此本文件最终以 `000f4c4...` 作为 **pre-Operations-design repository audit baseline**，并以当前 `main` 上更晚的 Operations 文档提交作为最终文档状态。

增量审计确认：

```text
Identity Implementation = COMPLETE / PASS / FROZEN
Platform Design Gate     = PASS
Platform Implementation  = COMPLETE
Platform Final Gate      = PASS
Platform Domain          = FROZEN
Operations Implementation= NOT_STARTED
```

Platform 已实现 33 个 required use cases、6 张 frozen tables、`modules/platform/public` 与 5 个 runtime HTTP endpoints；Platform management application use cases 已实现，但当前注册的 HTTP routes 仍只有 runtime routes，因此管理端 RBAC/HTTP wiring 正是 Operations 后续 integration 工作，而不是 Platform 未完成 blocker。

## 2. Domain Boundary

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

跨 Domain 管理动作固定为：

```text
Operations decides WHO MAY ACT
Owner Domain decides WHAT THE BUSINESS ACTION MEANS
Operations records WHO ACTED after a successful accepted action
```

Operations 不代理或复制 Owner Domain canonical state。

## 3. Frozen Database Contract

Operations 仍严格为 5 张表：

```text
operations.operators
operations.roles
operations.operator_roles
operations.role_permissions
operations.operator_audit_logs
```

`database/migrations/0200_operations.sql` 不修改。

关键物理事实：

- Operator / Role / Audit Log `id` 都是 UUID；不存在 internal BIGINT API 泄漏问题。
- `operators.auth_subject_id UUID UNIQUE` 是 Identity stable logical UUID，无跨域 FK。
- `operator_roles` 使用 `PK(operator_id, role_id)` 与反向索引 `(role_id, operator_id)`。
- `role_permissions` 使用 `PK(role_id, permission_key)`。
- Audit target 是 polymorphic logical reference；跨 Domain 无 physical FK。
- Operator / Role 只有 `active | disabled`。
- Audit 表没有 `result/status` 字段；V1 不通过迁移补字段。

```text
DATABASE_CONTRACT_CONFLICT = 0
```

## 4. Operator Lifecycle — FROZEN

### 4.1 如何成为 Operator

V1 不允许 Operator 自助注册。

成为 Operator 只有两条受控路径：

1. 系统第一次初始化：one-time controlled CLI bootstrap。
2. 初始化以后：已认证、active 且拥有 `operations.operators.create` 的 Operator 通过 Admin Management API 创建。

Create/Enable/Bootstrap 需要 Identity subject validation。Operations **只依赖** `apps/backend/src/modules/identity/public/` 当前冻结的 `IdentityPublicQueries`：

```text
Identity subject exists
AND Identity status = active
```

禁止读取：

```text
identity.* SQL
identity/application
identity/infrastructure
Identity repositories
Identity internal BIGINT
```

### 4.2 Self Registration

```text
Operator self-registration = NOT_SUPPORTED
Public operator signup endpoint = FORBIDDEN
```

### 4.3 Mutable / Immutable

```text
id              immutable
auth_subject_id immutable
display_name    mutable
status          active <-> disabled through explicit commands
```

`auth_subject_id` 不允许重绑，否则历史 Audit actor identity 会失去稳定含义。

### 4.4 Disable

`disabled` 使该 Operator 在新的 authorization decision 中立即失去全部权限。

禁用时：

- 不删除 Operator；
- 不删除 `operator_roles`；
- 不删除历史 Audit；
- 不修改 Identity account/session；
- 未来重新 enable 后，原 active Role assignment 再次参与权限计算。

### 4.5 Enable

Enable 前必须使用 `IdentityPublicQueries` 确认对应 Identity subject 当前存在且 `active`；否则拒绝。

### 4.6 Identity Account State

当前生产 `IdentityAuthenticationProvider` 在每个受保护请求中验证 token 后重新读取 Identity user，并且只有 `status=active` 才产生 `AuthContext`。

因此：

```text
Identity inactive/closed
→ no usable AuthContext
→ Operations authorization does not start
```

Operations 不复制 Identity status，也不缓存第二份身份状态。

### 4.7 Delete

```text
Operator physical delete = NOT_SUPPORTED
Operator soft delete     = NOT_SUPPORTED
```

生命周期退出只使用 `status=disabled`。

## 5. Role Model — FROZEN

### 5.1 Flat RBAC

```text
Operator
→ zero or more Roles
→ zero or more exact Permission keys per Role
```

V1 无 Role hierarchy、priority、deny rule、direct operator permission。

### 5.2 Custom Roles

```text
Custom roles = SUPPORTED
```

创建规则：

- code lower_snake_case；
- code UNIQUE；
- initial status = active；
- initial permission set 可为空；
- 后续统一使用 `SetRolePermissions` 配置。

### 5.3 Role Mutation

```text
code        immutable
name        mutable
description mutable
status      active <-> disabled
```

Role disabled 后：

- `operator_roles` 保留；
- `role_permissions` 保留；
- authorization 立即忽略该 Role；
- re-enable 后原关系重新生效。

Role hard/soft delete 均不支持。

## 6. `super_admin` — FROZEN

V1 唯一 reserved Role code：

```text
super_admin
```

它的 authorization semantics 与普通 Role 完全相同：

```text
NO bypass
NO wildcard
NO implicit allow
NO is_super_admin column
```

它必须通过 `role_permissions` 显式拥有当前 canonical Permission Catalog 的全部 keys。

保护策略：

- code 不可修改；
- 不允许 disable；
- permission set 必须恰好等于完整 current catalog；
- name/description 可修改；
- 可分配给多个 Operator。

### 6.1 Catalog Evolution

不设计隐式 super-admin bypass 来解决新 permission 上线。

权限 catalog 新增 key 时，发布流程必须先让已有 active `super_admin` 使用仍然存在的 `operations.role_permissions.set` 执行完整集合 reconciliation，再开放依赖新 key 的管理行为。Bootstrap 对空系统直接写入当时完整 catalog。

V1 不做后台自动 permission seeding，也不在应用启动时偷偷改 RBAC 数据。

## 7. Role Assignment — FROZEN

### 7.1 Multiple Roles

```text
Multiple roles per Operator = YES
```

### 7.2 Assign

只有：

```text
target Operator active
AND target Role active
```

时允许建立新 assignment。

重复 Assign：

```text
already assigned -> success/no-op
```

数据库 composite PK 是并发最终唯一性保护。

### 7.3 Revoke

解绑即删除 `operator_roles` 当前关系。

重复 revoke：

```text
already absent -> success/no-op
```

只有真实关系变化才写 Audit。

### 7.4 Last Super Admin Protection

会减少 active super-admin 的 Operations 动作：

```text
DisableOperator(super-admin operator)
RemoveRoleFromOperator(super_admin)
```

必须共享同一 serialisation point：

```text
SELECT super_admin role FOR UPDATE
```

然后在同一 Operations transaction 重新计算：

```text
remaining active operators assigned to active super_admin >= 1
```

否则：

```text
409 LAST_SUPER_ADMIN_REQUIRED
```

由于 `super_admin` Role 自身禁止 disable 且权限必须完整，不再额外设计 Role-disable/permission-reduction 分支。

Identity 独立关闭最后一个 super-admin 对应 account 是 Identity recovery 问题；Operations 不允许认证后门绕过 Identity。

## 8. Permission Grammar — FROZEN

Canonical application grammar：

```text
<domain>.<resource>.<action>
```

**严格三段**。数据库 regex 允许三段以上只是较宽的物理格式保护；Operations application/catalog 只接受被注册的 exact 三段 key。

每段：

```text
^[a-z][a-z0-9_]*$
lower_snake_case
```

### 8.1 Domain Token

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

`Audio Production` token = `audio`；`Trust & Safety` token = `trust`。

### 8.2 Resource Token

Resource 使用 **plural lower_snake_case capability/resource family**。

已冻结示例：

```text
platform.feature_flags.*
platform.runtime_configs.*
platform.app_versions.*
platform.announcements.*
platform.regions.*

operations.operators.*
operations.roles.*
operations.operator_roles.*
operations.role_permissions.*
operations.audit_logs.*
```

上面的 `*` 仅表示文档中的 action 占位，不是合法 permission wildcard。

### 8.3 Action Token

Action 不是全系统固定 CRUD enum，而是 Owner Domain 设计时注册的 exact lower_snake_case capability action，例如 `read`, `write`, `publish`, `review`。

任何未进入 canonical catalog 的 action 都无效。

### 8.4 Wildcards

全部禁止：

```text
*
platform.*
platform.feature_flags.*
*.roles.read
```

Authorization 只做 exact key membership。

## 9. Canonical Permission Catalog — FROZEN

权威是 **code-level static/typed catalog**，不是数据库任意字符串，也不建 permission dictionary table。

目标位置：

```text
apps/backend/src/modules/operations/public/permissions.ts
```

概念 exports：

```text
OperatorPermissionKey
OPERATOR_PERMISSION_CATALOG
isOperatorPermissionKey()
assertOperatorPermissionKey()
```

### 9.1 Operations V1 — 16 keys

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

### 9.2 Platform — 10 frozen keys

Operations 原样接纳 Platform 已冻结 requirement：

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

当前 catalog：

```text
Operations = 16
Platform   = 10
Total      = 26
```

### 9.3 Future Domains

Content / Learning / Audio / Social / Chat / Commerce / Rewards / Trust exact admin keys 不在本会话提前发明。

新增流程：

```text
Owner Domain freezes management capability/API
→ exact permission requirement added to Operations code catalog
→ super_admin explicit permission set reconciled
→ protected route enabled
```

## 10. Permission Assignment Mutation Model — FROZEN

V1 只提供：

```text
SetRolePermissions(role_id, complete_permission_set)
```

不同时提供 Grant/Remove/Replace 三套等价 mutation。

规则：

1. request 是完整 exact key set；
2. 每个 key 必须在 current catalog；
3. duplicates rejected；
4. custom Role 可空；
5. transaction 内 `SELECT role FOR UPDATE`；
6. 计算 added / removed；
7. 删除 removed；
8. 插入 added；
9. no change => success/no-op，不写 mutation Audit；
10. `super_admin` 只接受恰好等于 current full catalog 的 set。

并发 replace 被 Role row lock 串行化；不增加 version 字段。

## 11. Authorization Algorithm — FROZEN

统一链路：

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
load active assigned roles
↓
load role_permissions
↓
UNION exact permissions
↓
required exact key exists?
↓
Owner Application Use Case
↓
required success Audit
```

Effective permissions：

```text
operator.status != active -> DENY ALL
otherwise -> UNION(permission keys of every active assigned Role)
```

- no Role => empty set；
- disabled Role => ignored；
- duplicate key through multiple Roles => one effective key；
- Identity inactive/closed => authentication denies before Operations；
- `super_admin` 不存在特殊 allow branch。

### 11.1 Authorization Linearization

V1 不缓存 authorization。

每个受保护请求读取 PostgreSQL current RBAC state。

跨 Domain owner write 的 admission linearization point 是成功 authorization decision。若 Operator/Role 在其后并发 disabled，已经进入 Owner Domain 的 in-flight action 不做 distributed rollback；下一次请求使用新状态并拒绝。

## 12. Operations Public Contract — FROZEN

目标路径：

```text
apps/backend/src/modules/operations/public/
```

稳定概念能力：

```text
OperationsAuthorizer
  requirePermission(authContext, permissionKey)

OperationsOperatorResolver
  resolveCurrentOperator(authContext)

OperationsAuditRecorder
  recordSuccessfulAction(...)

AuthorizedOperatorContext
OperatorPermissionKey + catalog constants/validator
```

`AuthorizedOperatorContext` 至少包含：

```text
operatorId UUID
authSubjectId UUID
```

禁止 public export：

```text
repositories
DatabaseExecutor
TransactionManager
DB rows
SQL
internal persistence models
Fastify handlers
```

其他 Domain 禁止直接查询 operations tables。

## 13. Admin Backend Authorization Contract — FROZEN

所有 `/api/v1/admin/**` 管理能力：

```text
Authentication = Foundation/Identity
Authorization  = Operations
Business write = Owner Domain
Audit actor    = Operations Operator UUID
```

Backend 是最终权限执行点。Admin 前端 `PermissionGuard/can()` 只负责 UI visibility/UX，不构成安全边界。

概念 route composition：

```text
requireAuthentication
→ Operations require exact permission
→ owner use case
→ record required success Audit
```

不得在每个 Domain 各写一套 RBAC SQL。

## 14. Audit Contract — FROZEN

### 14.1 Canonical Meaning

`operator_audit_logs` 表示：

```text
an authenticated/authorized Operator action
was accepted and successfully executed by the application
```

它不是：

```text
HTTP access log
login log
security denial log
exception log
business canonical fact store
```

Trust Decision/Enforcement、Commerce Refund、Platform Feature Flag state 等事实仍归 Owner Domain。

### 14.2 Who / What / Target / When / Context

```text
who             -> operator_id
did what        -> action_key
to what         -> target_domain + target_type + target_id
when            -> created_at
request context -> request_id + ip_address + whitelisted details
```

`ip_address` 必须来自 Foundation/Fastify 在正确 trusted-proxy 配置下解析的 remote address；不得盲信任任意客户端 `X-Forwarded-For`。

### 14.3 Result Semantics

Frozen DB 没有 result/status 字段，且 frozen database semantics 已明确只记录成功动作。

因此 V1：

```text
persisted operator_audit_logs row => implicit result = SUCCESS
```

不会创建 canonical Audit row 的情况：

```text
authentication failure
authorization denial
validation rejection
owner-domain business failure
unexpected failure before successful business commit
```

这些由 security/application/observability logs 承担。

```text
result=failed filter = NOT_SUPPORTED
```

禁止把 `result` 偷塞进 `details`。

### 14.4 MUST Audit

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
state-changing Admin management command = MUST audit
routine read-only list/detail            = no canonical Operator audit by default
```

敏感 export/read 如未来有合规需求，再单独冻结。

### 14.5 Operations Audit Action Keys

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

Audit action key 与 permission key 共用三段 grammar，但无需一一相同；例如 broad `platform.feature_flags.write` 可授权多个具体 Platform audit actions。

### 14.6 Target Semantics

Operations targets：

- Operator mutation：`operations / operator / operator UUID`
- Role mutation：`operations / role / role UUID`
- Role assignment：target Operator UUID；Role UUID/code 放 safe details
- Permission set：target Role UUID；added/removed keys 放 safe details

跨 Domain target 有 stable UUID logical/public ID 时写 `target_id`。

若 Owner resource 的稳定管理标识是 natural/composite key，且 frozen schema 没有 public UUID：

```text
target_domain + target_type set
target_id = NULL
stable natural key stored in small whitelisted details
```

不得发明外域 UUID。

### 14.7 Details Policy

允许小型 action-specific safe context，例如：

```text
role_id
added_permission_keys
removed_permission_keys
feature_flag_key
region_code
client_platform
build_number
reason_code
```

禁止：

```text
password/token/authorization header/OTP/session secret
complete user profile/order/chat message
payment/card credential
raw request body dump
large before/after business object snapshot
```

### 14.8 Transaction Boundary

Operations-owned mutation：

```text
Operations state write
+
operator_audit_logs INSERT
= SAME Operations transaction
```

跨 Domain owner mutation：

```text
Operations authorize
→ Owner Domain commits canonical state
→ Operations synchronously records success Audit
```

禁止跨 Domain distributed DB transaction，禁止 Operations 直接写 `platform.*` / `trust.*` / 其他外域表。

Platform 当前实现仍明确未引入 premature outbox；Operations 本设计不反向强行改变其冻结实现。

如果 owner write 已 commit 而 Audit insert 随后失败：

- 不伪造 owner rollback；
- critical log `request_id/operator/action/target`；
- 返回稳定 internal error，明确 canonical action 可能已提交，Admin 应 refresh 后再决定是否 retry；
- 记录为 V1 MEDIUM TECH_DEBT。

未来如要求强可靠跨域 Audit，必须单独冻结 owner-domain outbox event contract；不得隐式引入。

## 15. Audit Query Contract

V1 schema-supported filters：

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

默认 newest first，bounded cursor pagination。

## 16. Bootstrap First Operator — FROZEN

### 16.1 Surface

只使用 one-time controlled CLI；不提供 HTTP bootstrap endpoint，不使用默认账号密码。

概念 command：

```text
pnpm operations:bootstrap --auth-subject-id <uuid> --display-name <name>
```

正式 script 名在 Implementation 阶段按仓库 convention 落地。

### 16.2 Preconditions

```text
operations.operators count == 0
Identity public summary exists
Identity status == active
```

已有任何 Operator：

```text
BOOTSTRAP_ALREADY_COMPLETED
```

### 16.3 Atomic State

一个 Operations transaction：

1. create/ensure reserved `super_admin` Role；
2. set explicit permission rows to full current catalog；
3. create first Operator；
4. assign `super_admin`；
5. insert `operations.bootstrap.initialize` Audit，actor 为新 Operator。

无默认 username/password，无 public bootstrap route，无长期后门。

## 17. Cache / Performance — FROZEN

```text
PostgreSQL direct authorization read = YES
Redis                              = NO
in-process permission cache         = NO
```

理由：Operator 数量/Admin QPS 小；RBAC 是安全控制面；stale permission 风险高于当前性能收益；一次 join/query 足够完成 operator + active roles + permissions resolution。

## 18. Concurrency — FROZEN

| Race | V1 rule |
|---|---|
| same role concurrent assignment | composite PK；idempotent assign |
| same role concurrent revoke | DELETE 0/1；idempotent revoke |
| duplicate auth subject | `UNIQUE(auth_subject_id)` |
| duplicate role code | `UNIQUE(code)` |
| concurrent SetRolePermissions | `SELECT role FOR UPDATE`；serialized replacement |
| last-super-admin reduction | lock reserved `super_admin` role row + re-count |
| role disabled during authorization | current DB state at decision point；next request sees disabled |
| operator disabled during authorization | same；no RBAC cache |

Raw PostgreSQL SQLSTATE/constraint names 不得泄漏到 API。

## 19. REQUIRED / DEFERRED / NOT_SUPPORTED Policy

详细 Use Cases 见 `OPERATIONS_USE_CASES.md`。

DEFERRED：

```text
reliable outbox-backed cross-domain Audit delivery
sensitive read/export auditing policy
operator invitation workflow
admin MFA policy enforcement (Identity-owned)
```

NOT_SUPPORTED V1：

```text
Operator physical deletion
Role physical deletion
Custom permission creation
Wildcard permissions
Per-operator direct permissions
Temporary/expiring roles
Role hierarchy
Permission deny rules
ABAC
Resource-level ACL
Approval workflow
```

## 20. Frozen Result

```text
Operator Lifecycle       = FROZEN
Role Model               = FROZEN
Role Assignment          = FROZEN
Permission Grammar       = FROZEN
Permission Catalog       = FROZEN
Authorization Algorithm  = FROZEN
Audit Contract           = FROZEN
Bootstrap Strategy       = FROZEN
Cache Decision           = NO CACHE
Outbox Decision          = NO NEW V1 OUTBOX CONTRACT
Platform Design          = PASS
Platform Implementation  = COMPLETE / PASS / FROZEN
Platform Integration     = READY, not externally blocked
Operations Implementation= NOT_STARTED
```

STOP: 本文不开始 Operations Implementation。
