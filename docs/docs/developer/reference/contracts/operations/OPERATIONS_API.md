---
status: frozen
phase: 4
phase_name: Operations Domain
document: OPERATIONS_API
last_updated: 2026-09-02
repository_commit_audited: 000f4c4aafacf4938d74902eddc4d78323196a89
depends_on:
  - OPERATIONS_USE_CASES.md
  - OPERATIONS_RBAC_CONTRACTS.md
implementation_started: false
lifecycle: historical
---

> 迁移说明：本文是迁移时保留的契约/证据快照，不是当前调度权限。当前产品状态请看 [ZH-LAO 产品开发全景](/developer/)，执行规格请看 `.specify/` 与 `specs/`，真实完成请以代码、测试与 CI 为准。


# ZH-LAO  — Operations API / Public Contract

> 本文冻结 Operations V1 HTTP/API 与 backend public boundary。API 从 Use Cases 推导，不从数据库表机械生成 CRUD。

## 1. Conventions

Platform 已冻结管理 API 统一 convention：

```text
/api/v1/admin/<domain>
```

Operations base：

```text
/api/v1/admin/operations
```

JSON：`snake_case`。

IDs：外部只使用 stable UUID / Owner Domain 已冻结的 stable public/natural identifier。

Time：ISO 8601 UTC。

Errors：复用 Foundation `AppError` / error envelope，不建立第二套 envelope。

## 2. Authentication / Authorization Pipeline

所有 Operations HTTP endpoints 都需要当前 Identity AuthenticationProvider：

```text
Authorization: Bearer <Identity access token>
```

统一链路：

```text
requireAuthentication(Identity AuthenticationProvider)
→ request.authContext.subjectId
→ Operations resolve current Operator
→ operator active?
→ exact permission check when required
→ Operations Use Case
→ required success Audit
```

Backend 是最终安全边界。Admin frontend PermissionGuard/can() 只负责 UI visibility/UX。

## 3. Endpoint Summary

### Current Operator

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/api/v1/admin/operations/me` | active Operator only |

### Operators

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/api/v1/admin/operations/operators` | `operations.operators.read` |
| GET | `/api/v1/admin/operations/operators/:operator_id` | `operations.operators.read` |
| POST | `/api/v1/admin/operations/operators` | `operations.operators.create` |
| PATCH | `/api/v1/admin/operations/operators/:operator_id` | `operations.operators.update` |
| POST | `/api/v1/admin/operations/operators/:operator_id/disable` | `operations.operators.disable` |
| POST | `/api/v1/admin/operations/operators/:operator_id/enable` | `operations.operators.enable` |

### Roles

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/api/v1/admin/operations/roles` | `operations.roles.read` |
| GET | `/api/v1/admin/operations/roles/:role_id` | `operations.roles.read` |
| POST | `/api/v1/admin/operations/roles` | `operations.roles.create` |
| PATCH | `/api/v1/admin/operations/roles/:role_id` | `operations.roles.update` |
| POST | `/api/v1/admin/operations/roles/:role_id/disable` | `operations.roles.disable` |
| POST | `/api/v1/admin/operations/roles/:role_id/enable` | `operations.roles.enable` |

### Assignments

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/api/v1/admin/operations/operators/:operator_id/roles` | `operations.operator_roles.read` |
| PUT | `/api/v1/admin/operations/operators/:operator_id/roles/:role_id` | `operations.operator_roles.assign` |
| DELETE | `/api/v1/admin/operations/operators/:operator_id/roles/:role_id` | `operations.operator_roles.revoke` |

### Permissions

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/api/v1/admin/operations/permissions` | `operations.role_permissions.read` |
| GET | `/api/v1/admin/operations/roles/:role_id/permissions` | `operations.role_permissions.read` |
| PUT | `/api/v1/admin/operations/roles/:role_id/permissions` | `operations.role_permissions.set` |

### Audit

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/api/v1/admin/operations/audit-logs` | `operations.audit_logs.read` |
| GET | `/api/v1/admin/operations/audit-logs/:audit_log_id` | `operations.audit_logs.read` |

Bootstrap **没有 HTTP endpoint**。

## 4. GET Current Operator

```http
GET /api/v1/admin/operations/me
```

Requires authenticated active Operator，no extra Permission。

Response：

```json
{
  "operator": {
    "operator_id": "uuid",
    "display_name": "Operations Admin",
    "status": "active",
    "roles": [
      {
        "role_id": "uuid",
        "code": "super_admin",
        "name": "Super Admin"
      }
    ],
    "permissions": [
      "operations.operators.read",
      "platform.feature_flags.read"
    ]
  }
}
```

Rules：

- only effective active-role permissions；
- permission list deterministic key ASC；
- no repository/DB internals；
- 这是 Admin Foundation `can()` / permission-aware navigation 的真实数据源。

## 5. Operators API

### 5.1 List

```http
GET /api/v1/admin/operations/operators?page=1&page_size=50&status=active
```

V1 filters：

```text
status = active|disabled optional
```

使用 Admin Foundation 已有 offset/page contract。

Default sort：

```text
created_at DESC
id ASC
```

Response：

```json
{
  "items": [
    {
      "operator_id": "uuid",
      "auth_subject_id": "uuid",
      "display_name": "...",
      "status": "active",
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "page": 1,
  "page_size": 50,
  "total": 1
}
```

`auth_subject_id` 是 Identity stable public UUID，不是 internal BIGINT。

### 5.2 Detail

```http
GET /api/v1/admin/operations/operators/:operator_id
```

可包含 assigned Role summaries。

### 5.3 Create

```http
POST /api/v1/admin/operations/operators
Content-Type: application/json
```

```json
{
  "auth_subject_id": "uuid",
  "display_name": "Content Operator"
}
```

Rules：

- `IdentityPublicQueries` 确认 subject exists + active；
- strict body / unknown fields rejected；
- caller 不能提供 status；
- caller 不能在同一 request 提供 role_ids；
- `auth_subject_id` immutable after create。

Response：`201`。

### 5.4 Update

```http
PATCH /api/v1/admin/operations/operators/:operator_id
```

```json
{
  "display_name": "New Display Name"
}
```

Only `display_name` mutable。

### 5.5 Disable / Enable

```text
POST /api/v1/admin/operations/operators/:operator_id/disable
POST /api/v1/admin/operations/operators/:operator_id/enable
```

Empty body V1。

Already requested state -> `200` current representation / no-op。

Last-super-admin protection -> `409 LAST_SUPER_ADMIN_REQUIRED`。

Enable with inactive/missing Identity subject -> stable conflict/error。

## 6. Roles API

### 6.1 List / Detail

```text
GET /api/v1/admin/operations/roles
GET /api/v1/admin/operations/roles/:role_id
```

Optional：`status=active|disabled`。

### 6.2 Create

```http
POST /api/v1/admin/operations/roles
```

```json
{
  "code": "content_operator",
  "name": "Content Operator",
  "description": "..."
}
```

Rules：

- lower_snake_case code；
- code immutable；
- initial status active；
- normal API 不创建 reserved `super_admin`；
- initial permission set empty。

### 6.3 Update

```http
PATCH /api/v1/admin/operations/roles/:role_id
```

```json
{
  "name": "Content Manager",
  "description": "..."
}
```

Cannot patch `code` or `status`。

### 6.4 Disable / Enable

```text
POST /api/v1/admin/operations/roles/:role_id/disable
POST /api/v1/admin/operations/roles/:role_id/enable
```

Disable `super_admin` -> `409 SYSTEM_ROLE_PROTECTED`。

## 7. Role Assignment API

### 7.1 List

```http
GET /api/v1/admin/operations/operators/:operator_id/roles
```

```json
{
  "roles": [
    {
      "role_id": "uuid",
      "code": "content_operator",
      "name": "Content Operator",
      "status": "active",
      "assigned_at": "2026-08-31T00:00:00Z"
    }
  ]
}
```

`assigned_at` 是 API semantic name，对应 frozen `operator_roles.created_at`，不增加 DB 字段。

### 7.2 Assign

```http
PUT /api/v1/admin/operations/operators/:operator_id/roles/:role_id
```

No body。

```text
missing -> create + Audit
existing -> 200 no-op, no duplicate Audit
```

Target Operator/Role 必须 active。

### 7.3 Revoke

```http
DELETE /api/v1/admin/operations/operators/:operator_id/roles/:role_id
```

```text
existing -> delete + Audit
absent   -> 204 no-op
```

Removing final active `super_admin` -> `409 LAST_SUPER_ADMIN_REQUIRED`。

## 8. Permission Catalog API

```http
GET /api/v1/admin/operations/permissions
```

Source：code catalog。

Response：

```json
{
  "permissions": [
    {
      "key": "operations.operators.read",
      "domain": "operations",
      "resource": "operators",
      "action": "read"
    },
    {
      "key": "platform.feature_flags.read",
      "domain": "platform",
      "resource": "feature_flags",
      "action": "read"
    }
  ]
}
```

Sorted key ASC。

不存在 permission create/update/delete endpoint。

## 9. Role Permissions API

### 9.1 List

```http
GET /api/v1/admin/operations/roles/:role_id/permissions
```

```json
{
  "role_id": "uuid",
  "permissions": ["operations.operators.read"]
}
```

### 9.2 Set Complete Set

```http
PUT /api/v1/admin/operations/roles/:role_id/permissions
```

```json
{
  "permission_keys": [
    "operations.operators.read",
    "platform.feature_flags.read"
  ]
}
```

Contract：

- complete replacement，not patch；
- every key exact catalog member；
- duplicate rejected；
- custom Role may use `[]`；
- identical set -> `200` no-op；
- `super_admin` request 必须恰好等于 current full catalog，否则 `409 SYSTEM_ROLE_PROTECTED`。

不提供 separate grant/remove endpoints。

## 10. Audit Query API

### 10.1 List

```http
GET /api/v1/admin/operations/audit-logs
```

Supported query params：

```text
operator_id
action_key
target_domain
target_type
target_id
request_id
created_from
created_to
cursor
limit
```

Rules：

- limit default 50, max 100；
- sort `created_at DESC, id DESC`；
- cursor encodes last `(created_at,id)`；
- no result filter；
- no arbitrary `details` JSON search。

Response：

```json
{
  "items": [
    {
      "audit_log_id": "uuid",
      "operator_id": "uuid",
      "action_key": "operations.roles.update",
      "target": {
        "domain": "operations",
        "type": "role",
        "id": "uuid"
      },
      "request_id": "req_...",
      "ip_address": "203.0.113.10",
      "details": {},
      "created_at": "2026-08-31T00:00:00Z",
      "result": "success"
    }
  ],
  "next_cursor": null
}
```

`result="success"` 如果返回，只是 API **derived constant**，用于表达 frozen row semantics；数据库没有 result column，也不能 filter failures。Implementation 可以省略这个 derived field，但不能暗示 DB 有 result。

### 10.2 Detail

```http
GET /api/v1/admin/operations/audit-logs/:audit_log_id
```

返回 immutable Audit representation。

## 11. Stable Errors

Foundation：

```text
UNAUTHENTICATED            401
AUTHENTICATION_UNAVAILABLE 503
FORBIDDEN                  403
```

Operations：

| Code | HTTP | Meaning |
|---|---:|---|
| `OPERATOR_ACCESS_DENIED` | 403 | authenticated Identity subject has no active Operator mapping |
| `OPERATOR_DISABLED` | 403 | current Operator disabled |
| `OPERATOR_NOT_FOUND` | 404 | managed Operator not found |
| `OPERATOR_ALREADY_EXISTS` | 409 | auth_subject_id already mapped |
| `OPERATOR_AUTH_SUBJECT_NOT_FOUND` | 400 | Identity subject does not exist |
| `OPERATOR_AUTH_SUBJECT_INACTIVE` | 409 | Identity subject not active |
| `ROLE_NOT_FOUND` | 404 | Role not found |
| `ROLE_DISABLED` | 409 | assignment target Role disabled |
| `ROLE_CODE_CONFLICT` | 409 | Role code exists |
| `INVALID_PERMISSION` | 400 | permission key not in canonical catalog / invalid |
| `LAST_SUPER_ADMIN_REQUIRED` | 409 | mutation would remove final active super-admin |
| `SYSTEM_ROLE_PROTECTED` | 409 | forbidden reserved super_admin mutation |
| `AUDIT_LOG_NOT_FOUND` | 404 | Audit row not found |
| `BOOTSTRAP_ALREADY_COMPLETED` | CLI/domain conflict | bootstrap cannot run after first Operator exists |
| `OPERATOR_AUDIT_PERSISTENCE_FAILED` | 500 | owner action may already be committed but success Audit persistence failed |

Malformed UUID / unknown field / pagination errors continue through Foundation validation mapping。

Raw PostgreSQL SQLSTATE/constraint names 不得逃逸。

## 12. Platform Integration Contract

Current repository：

```text
PLATFORM_DESIGN_GATE = PASS
PLATFORM_IMPLEMENTATION = COMPLETE
PLATFORM_GATE = PASS
PLATFORM_DOMAIN = FROZEN
```

Platform 已实现所有 33 required use cases 与 3 个 backend public readers；当前 `platform/http/routes.ts` 注册 5 个 runtime endpoints，未注册管理 HTTP routes。

Platform 冻结的 permission requirements：

```text
platform.feature_flags.read/write
platform.runtime_configs.read/write
platform.app_versions.read/write
platform.announcements.read/write
platform.regions.read/write
```

Operations 实现后，管理路由应由 Platform HTTP/application adapter 使用 Operations public authorizer，而不是让 Operations 创建 Platform proxy CRUD。

Concept flow：

```text
PATCH /api/v1/admin/platform/feature-flags/:key
→ Identity authentication
→ Operations require platform.feature_flags.write
→ Platform UpdateFeatureFlag
→ Platform commits canonical state
→ Operations record success Audit
```

**Integration blocker = NO**：Platform application implementation 已可用。剩余工作是 Operations Phase 的 RBAC/Audit integration wiring。

Operations 不写 `platform.*`。

## 13. Backend Public Contract

Target：

```text
apps/backend/src/modules/operations/public/
```

### 13.1 Permission Types / Catalog

```text
OperatorPermissionKey
OPERATOR_PERMISSION_CATALOG
isOperatorPermissionKey
```

### 13.2 OperationsAuthorizer

Concept：

```text
requirePermission(
  authContext: AuthContext,
  permission: OperatorPermissionKey
) -> AuthorizedOperatorContext
```

Minimum context：

```text
operatorId UUID
authSubjectId UUID
```

### 13.3 OperationsOperatorResolver

```text
resolveCurrentOperator(authContext)
```

### 13.4 OperationsAuditRecorder

```text
recordSuccessfulAction({
  operator,
  actionKey,
  target,
  requestContext,
  details
})
```

### 13.5 Forbidden Public Exports

```text
OperationsRepositories
DatabaseExecutor
TransactionManager
Postgres rows
SQL builders
operator_roles rows
role_permissions rows
Fastify route internals
```

## 14. Admin Foundation Integration

Admin Foundation 已存在：

```text
AuthProvider
AuthGuard
PermissionGuard
can()
token store
ApiClient
UUID/time/pagination/error contracts
```

Operations future binding：

```text
Identity access token
→ GET /api/v1/admin/operations/me
→ exact effective permissions
→ PermissionGuard/can() for UI
→ backend OperationsAuthorizer for actual enforcement
```

本 Design Session 不开发 Admin 页面。

## 15. HTTP Audit Checklist

```text
Admin prefix aligned                    = YES
Public operator registration            = NO
Independent admin password/login API    = NO
Internal BIGINT exposure                = 0
Cross-domain SQL                        = 0
Generic permission CRUD                 = 0
Wildcard API                            = 0
Duplicate permission mutation APIs      = 0
Bootstrap HTTP endpoint                 = 0
Second error envelope                   = 0
Platform external integration blocker   = 0

OPERATIONS_HTTP_API       = FROZEN
OPERATIONS_PUBLIC_CONTRACT= FROZEN
```

STOP: 本文不实现 route/public module。
