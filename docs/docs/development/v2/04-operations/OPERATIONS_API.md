---
status: frozen
phase: 4
phase_name: Operations Domain
document: OPERATIONS_API
last_updated: 2026-08-31
depends_on:
  - OPERATIONS_USE_CASES.md
  - OPERATIONS_RBAC_CONTRACTS.md
implementation_started: false
---

# ZH-LAO V2 — Operations API / Public Contract

> 本文冻结 Operations V1 HTTP/API 与 backend public boundary。API 从 Use Cases 推导，不从数据库表生成 CRUD。

## 1. API Conventions

现有 Platform Management contract 已冻结统一 Admin prefix：

```text
/api/v1/admin/<domain>
```

因此 Operations V1 base 固定为：

```text
/api/v1/admin/operations
```

不采用 `/api/v1/operations` 暴露后台管理接口，避免与 public/runtime API 混淆。

JSON：`snake_case`。

UUID：标准 string UUID。

Time：ISO 8601 UTC。

Error envelope：复用 Foundation `AppError` / HTTP error handler，不建立第二套 envelope。

## 2. Authentication / Authorization Pipeline

所有 Operations HTTP endpoint 都需要 Identity Authentication：

```text
Authorization: Bearer <Identity access token>
```

统一链路：

```text
requireAuthentication(Identity AuthenticationProvider)
→ request.authContext.subjectId
→ Operations resolve current Operator
→ active check
→ exact permission check when endpoint requires one
→ Use Case
→ required success Audit
```

Backend 是最终安全边界。Admin 前端 permission guard 不能替代 backend authorization。

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

### Role Assignments

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

Bootstrap has **no HTTP endpoint**。

## 4. GET Current Operator

```http
GET /api/v1/admin/operations/me
```

Requires authenticated active Operator but no extra permission。

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

- effective permissions only；
- disabled Role permissions omitted；
- permission list deterministic sorted ASC；
- no internal DB row / repository details。

This endpoint is the Admin Foundation source for `can()` / navigation / route/action guards。

## 5. Operators API

### 5.1 List

```http
GET /api/v1/admin/operations/operators?page=1&page_size=50&status=active
```

V1 filters：

```text
status = active|disabled optional
```

Pagination：offset/page contract already supported by Admin Foundation。

Default sort：

```text
created_at DESC
id ASC
```

Response concept：

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

`auth_subject_id` is Identity stable public UUID and is safe for authorized Operations management surfaces；it is not an Identity internal PK。

### 5.2 Detail

```http
GET /api/v1/admin/operations/operators/:operator_id
```

May include assigned role summaries。

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

Server rules：

- subject must exist and be active via `identity/public`；
- unknown fields rejected；
- status cannot be supplied；
- role_ids cannot be supplied；assignment is a separate use case；
- `auth_subject_id` cannot later be changed。

Response：`201` with Operator representation。

### 5.4 Update

```http
PATCH /api/v1/admin/operations/operators/:operator_id
```

```json
{
  "display_name": "New Display Name"
}
```

Only `display_name` is mutable here。

No generic status patch。

### 5.5 Disable / Enable

```http
POST /api/v1/admin/operations/operators/:operator_id/disable
POST /api/v1/admin/operations/operators/:operator_id/enable
```

Empty body V1。

Already in requested state => `200` current representation/no-op。

Last active super-admin protection may return `409 LAST_SUPER_ADMIN_REQUIRED`。

Enable may return conflict if Identity subject is no longer active。

## 6. Roles API

### 6.1 List / Detail

```text
GET /api/v1/admin/operations/roles
GET /api/v1/admin/operations/roles/:role_id
```

Optional filter：`status=active|disabled`。

Response fields use Role UUID + stable code；never expose persistence-specific objects。

### 6.2 Create

```http
POST /api/v1/admin/operations/roles
```

```json
{
  "code": "content_operator",
  "name": "Content Operator",
  "description": "Can manage content according to assigned permissions"
}
```

Rules：

- code lower_snake_case；
- code immutable after create；
- initial status active；
- normal API cannot create reserved `super_admin`；
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

`super_admin` disable => `409 SYSTEM_ROLE_PROTECTED`。

## 7. Role Assignment API

### 7.1 List

```http
GET /api/v1/admin/operations/operators/:operator_id/roles
```

Response：

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

`assigned_at` is API naming for frozen `operator_roles.created_at` semantics，不引入数据库字段。

### 7.2 Assign

```http
PUT /api/v1/admin/operations/operators/:operator_id/roles/:role_id
```

No body。

Semantics：

```text
missing assignment -> create + audit
existing assignment -> 200 no-op, no duplicate audit
```

Target Operator/Role must both be active。

### 7.3 Revoke

```http
DELETE /api/v1/admin/operations/operators/:operator_id/roles/:role_id
```

Semantics：

```text
existing -> delete + audit
absent   -> 204 no-op
```

Revoke last active `super_admin` assignment => `409 LAST_SUPER_ADMIN_REQUIRED`。

## 8. Permission Catalog API

```http
GET /api/v1/admin/operations/permissions
```

Source = code catalog。

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

Sorted by key ASC。

No permission create/update/delete endpoint。

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

### 9.2 Set Complete Permission Set

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

- complete replacement, not patch；
- every key exact catalog member；
- duplicate keys rejected；
- custom role may use `[]`；
- identical set => `200` no-op；
- `super_admin` request must equal full current catalog or return `409 SYSTEM_ROLE_PROTECTED`。

Response returns final sorted set。

No separate grant/remove permission endpoints in V1。

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

Whitespace above is illustrative only; actual parameter names are the snake_case tokens without leading spaces。

Rules：

- `limit` default 50, max 100；
- sort `created_at DESC`, deterministic tie-break by `id DESC`；
- cursor encodes last `(created_at,id)`；
- no `result` filter；
- no arbitrary details JSON search。

Response concept：

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

Important：`result="success"` 是 API **derived constant**，用于向 Admin 清楚表达 frozen row semantics；数据库没有 result 字段，且 V1 不能查询/filter failure。

如果不希望返回这个 derived field，Implementation 可省略，但不得暗示数据库存在 result column。Canonical semantic 仍是 persisted row = success。

### 10.2 Detail

```http
GET /api/v1/admin/operations/audit-logs/:audit_log_id
```

Returns one immutable Audit representation。

## 11. Stable Error Contract

Foundation errors继续复用：

```text
UNAUTHENTICATED                  401
AUTHENTICATION_UNAVAILABLE       503
FORBIDDEN                        403
```

Operations V1 stable errors：

| Code | HTTP | Meaning |
|---|---:|---|
| `OPERATOR_ACCESS_DENIED` | 403 | authenticated Identity subject has no active Operator mapping |
| `OPERATOR_DISABLED` | 403 | current Operator is disabled |
| `OPERATOR_NOT_FOUND` | 404 | managed target Operator not found |
| `OPERATOR_ALREADY_EXISTS` | 409 | auth_subject_id already mapped |
| `OPERATOR_AUTH_SUBJECT_NOT_FOUND` | 400 | Identity subject does not exist |
| `OPERATOR_AUTH_SUBJECT_INACTIVE` | 409 | Identity subject is not active |
| `ROLE_NOT_FOUND` | 404 | Role not found |
| `ROLE_DISABLED` | 409 | requested assignment target Role disabled |
| `ROLE_CODE_CONFLICT` | 409 | Role code already exists |
| `INVALID_PERMISSION` | 400 | permission key not in canonical catalog / grammar invalid |
| `LAST_SUPER_ADMIN_REQUIRED` | 409 | mutation would remove final active super-admin |
| `SYSTEM_ROLE_PROTECTED` | 409 | forbidden mutation of reserved super_admin policy |
| `AUDIT_LOG_NOT_FOUND` | 404 | Audit row not found |
| `BOOTSTRAP_ALREADY_COMPLETED` | CLI/domain conflict | bootstrap may not run after first Operator exists |
| `OPERATOR_AUDIT_PERSISTENCE_FAILED` | 500 | cross-domain canonical write may have committed but success audit persistence failed |

Unknown request fields / malformed UUID / invalid pagination continue through Foundation validation/error mapping；不建立 Operations-specific envelope。

Raw PostgreSQL SQLSTATE/constraint names must never escape。

## 12. Cross-Domain Platform Integration Contract

Platform Design Gate already froze these permission requirements：

```text
platform.feature_flags.read/write
platform.runtime_configs.read/write
platform.app_versions.read/write
platform.announcements.read/write
platform.regions.read/write
```

Once Platform management HTTP is implemented, its route composition must use Operations public authorizer rather than Platform-owned RBAC。

Example product flow：

```text
PATCH /api/v1/admin/platform/feature-flags/:key
→ Identity authentication
→ Operations require platform.feature_flags.write
→ Platform UpdateFeatureFlag
→ Platform commits canonical state
→ Operations record success audit
```

Operations does not expose proxy CRUD endpoints for Platform and does not write `platform.*`。

Platform Implementation is not present at the repository commit audited for this design；this is an `IMPLEMENTATION_DEPENDENCY`, not an Operations Design blocker。

## 13. Backend Public Contract

Target path：

```text
apps/backend/src/modules/operations/public/
```

Canonical conceptual exports：

### 13.1 Permission Types / Catalog

```text
OperatorPermissionKey
OPERATOR_PERMISSION_CATALOG
isOperatorPermissionKey
```

### 13.2 OperationsAuthorizer

Concept signature：

```text
requirePermission(
  authContext: AuthContext,
  permission: OperatorPermissionKey
) -> AuthorizedOperatorContext
```

`AuthorizedOperatorContext` is an immutable application/public DTO，not a DB row。

Minimum fields：

```text
operatorId UUID
authSubjectId UUID
```

It may also carry the authorized permission for diagnostics，but consumers must not mutate/reinterpret roles。

### 13.3 OperationsOperatorResolver

```text
resolveCurrentOperator(authContext)
```

Used where current Operator summary is needed without an additional permission requirement。

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

Consumers do not pass repository/transaction/SQL objects。

### 13.5 Forbidden Public Exports

```text
OperationsRepositories
Postgres rows
DatabaseExecutor
TransactionManager
SQL builders
operator_roles rows
role_permissions rows
Fastify route internals
```

## 14. Admin Foundation Integration Contract

Admin Foundation already has：

```text
AuthProvider
AuthGuard
PermissionGuard
can()
token store
ApiClient
Unauthorized/Forbidden error mapping
```

Operations implementation later must bind real data as follows：

```text
Admin login/access token       -> Identity/Fundation auth
GET /admin/operations/me       -> current Operator + exact permissions
PermissionGuard/can()          -> UI visibility only
Backend OperationsAuthorizer   -> actual enforcement
```

Future Operations Admin pages：

```text
Operator management
Role management
Permission editor
Audit log view
```

are NOT implemented by this design session。

## 15. HTTP Audit Checklist

```text
Admin prefix aligned with Platform        = YES
Public operator registration              = NO
Independent admin password/login API      = NO
Internal BIGINT exposure                  = 0
Cross-domain SQL                          = 0
Generic permission CRUD                   = 0
Wildcard API                              = 0
Duplicate role-permission mutation APIs   = 0
Bootstrap HTTP endpoint                   = 0
Second error envelope                     = 0

OPERATIONS_HTTP_API = FROZEN
OPERATIONS_PUBLIC_CONTRACT = FROZEN
```

STOP: no route or public module implementation is performed in this document.
