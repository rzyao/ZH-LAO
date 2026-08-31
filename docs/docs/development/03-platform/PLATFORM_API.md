---
status: audited
phase: 3
phase_name: Platform Domain
document: PLATFORM_API
last_updated: 2026-08-31
depends_on:
  - PLATFORM_USE_CASES.md
  - PLATFORM_CONFIG_CONTRACTS.md
database_authority:
  - database/migrations/0300_platform.sql
next_step: Platform Design Audit
---

# ZH-LAO  — PLATFORM API

> 目标路径：`docs/docs/development/03-platform/PLATFORM_API.md`
>
> 本文冻结 PHASE 3 — Platform Domain 的 HTTP/API Contract。
>
> API 必须由 Platform Use Case 推导，不从数据库表生成 CRUD。
>
> 本文不进入编码，不实现 Operations operator auth，不修改 frozen migration。

---

# 1. API Status

```text
PLATFORM_API_STATUS = AUDITED / READY_FOR_IMPLEMENTATION
PLATFORM_IMPLEMENTATION_STARTED = NO
```

Base prefix：

```text
/api/v1/platform
```

JSON 字段使用：

```text
snake_case
```

时间使用 ISO 8601 UTC。

所有错误继续使用 Foundation Error Envelope。

---

# 2. Runtime HTTP Endpoints

V1 Runtime HTTP 只开放真正面向客户端的能力。

| Endpoint | Auth | Use Case | V1 |
|---|---|---|---|
| `POST /api/v1/platform/features/resolve` | Public | ResolveFeatureFlags | REQUIRED |
| `POST /api/v1/platform/app-version/check` | Public | CheckAppVersion | REQUIRED |
| `GET /api/v1/platform/announcements` | Public | GetActiveAnnouncements | REQUIRED |
| `GET /api/v1/platform/regions` | Public | ListActiveRegions | REQUIRED |
| `GET /api/v1/platform/regions/:code` | Public | GetRegion | REQUIRED |

V1 不开放 generic Runtime Config HTTP。

原因：Frozen DB 没有 public/private 字段；在没有明确 `client_public` registry key 需求前，公开 generic config endpoint 会把 Platform 退化为无边界配置中心。

如果未来出现真实 Mobile config key，先在 `PLATFORM_CONFIG_CONTRACTS.md` registry 中冻结为 `client_public`，再新增窄接口或 public-key-only batch endpoint。

---

# 3. Resolve Feature Flags

## Request

```http
POST /api/v1/platform/features/resolve
Content-Type: application/json
```

```json
{
  "keys": ["social_discovery", "new_learning_home"],
  "region_code": "LA",
  "client_platform": "android"
}
```

Rules：

- `keys`: 1..100 unique-ish strings；服务端可去重执行；
- key 必须满足 frozen key 格式；
- `region_code` optional；格式必须满足 Region code regex；
- `client_platform` optional: `android | ios`；
- 不接收 user / percentage / arbitrary attributes。

## Response

```json
{
  "features": [
    {
      "key": "social_discovery",
      "enabled": true,
      "reason": "region_client_override"
    },
    {
      "key": "new_learning_home",
      "enabled": false,
      "reason": "flag_not_found"
    }
  ]
}
```

Reason values：

```text
flag_not_found
flag_inactive
flag_retired
region_client_override
region_override
client_override
default_enabled
```

Flag not found 不返回 404；它是 per-key fail-closed decision。

Infrastructure/database failure 仍返回 Platform/Service error，不能假装所有 Flag false。

## Security

Public Feature Flag 只用于产品体验控制，不代表权限。Backend owner Domain 必须继续执行真实 authorization / entitlement / Trust checks。

---

# 4. App Version Check

## Request

```http
POST /api/v1/platform/app-version/check
Content-Type: application/json
```

```json
{
  "client_platform": "android",
  "current_version": "2.3.0",
  "build_number": 23001
}
```

## Response — Supported / Optional

```json
{
  "client_platform": "android",
  "current_version": "2.3.0",
  "current_build_number": 23001,
  "known_build": true,
  "supported": true,
  "update_available": true,
  "update_required": false,
  "current_status": "active",
  "update_policy": "optional",
  "latest_version": "2.4.0",
  "latest_build_number": 24001,
  "minimum_supported_version": "2.2.0",
  "minimum_supported_build_number": 22001,
  "latest_release_notes": "...",
  "reason": "newer_version_available"
}
```

## Response — Blocked

```json
{
  "client_platform": "ios",
  "current_version": "1.8.0",
  "current_build_number": 18001,
  "known_build": true,
  "supported": false,
  "update_available": true,
  "update_required": true,
  "current_status": "blocked",
  "update_policy": "required",
  "latest_version": "2.0.0",
  "latest_build_number": 20001,
  "minimum_supported_version": "1.9.0",
  "minimum_supported_build_number": 19001,
  "reason": "blocked"
}
```

## Errors

- malformed request → `400 PLATFORM_INVALID_ARGUMENT`；
- exact build exists but version string mismatch → `409 APP_VERSION_MISMATCH`；
- no active released upgrade target when a decision requires one → `503 APP_VERSION_POLICY_UNAVAILABLE`。

## Contract Notes

- ordering only by numeric `build_number`；
- no SemVer comparison；
- no region/channel；
- no store URL from Platform DB；
- Mobile store link stays in Mobile build/deployment configuration。

---

# 5. Active Announcements

## Request

```http
GET /api/v1/platform/announcements?region_code=LA&client_platform=android
```

Both query params optional。

## Response

```json
{
  "announcements": [
    {
      "announcement_id": "uuid",
      "title": "Service notice",
      "content": "...",
      "starts_at": "2026-08-31T00:00:00Z",
      "ends_at": "2026-09-02T00:00:00Z"
    }
  ]
}
```

Rules：

```text
published
AND starts_at <= now
AND (ends_at null OR ends_at > now)
AND scope matches request
```

Sort：

```text
starts_at DESC
created_at DESC
public_id ASC
```

No pagination in V1 because active Platform announcements are expected to remain a small bounded set。Implementation SHOULD cap response, e.g. 50；超过 cap 应通过 management/audit 发现，不把它演化为 historical listing API。

No locale/priority fields；database does not support them。

---

# 6. Regions

## `GET /api/v1/platform/regions`

只返回 active regions：

```json
{
  "regions": [
    {
      "code": "CN",
      "name": "China",
      "default_locale": "zh-CN",
      "timezone": "Asia/Shanghai"
    },
    {
      "code": "LA",
      "name": "Laos",
      "default_locale": "lo-LA",
      "timezone": "Asia/Vientiane"
    }
  ]
}
```

排序：`code ASC`。

## `GET /api/v1/platform/regions/:code`

Runtime client endpoint 只把 active Region 作为可选择产品 Region 返回。

- active → `200`；
- unknown / inactive / retired → `404 PLATFORM_NOT_FOUND`。

原因：Mobile 的公开 Region endpoint 是当前产品可用列表，不是历史管理查询。

Backend cross-domain 若需要区分 unknown/inactive/retired，应使用 `PlatformRegionReader.getRegion()`，不要依赖 public HTTP 折叠结果。

---

# 7. Runtime Auth Boundary

以下 runtime reads 在 V1 可 Public：

```text
feature resolve
app version check
active announcements
active regions
```

理由：它们是启动/登录前客户端也需要的产品运行控制信息，不包含用户隐私或 secret。

要求：

- rate limiting 复用 Foundation 能力；
- response 不含 internal BIGINT；
- response 不含 server-only runtime configs；
- cache headers 可在实现阶段按 endpoint 定义，但不得造成 App Version / Flag 的不可接受 stale 行为。

---

# 8. Management HTTP Boundary

Platform Management API 的 resource owner 是 Platform，但 caller authorization owner 是 Operations。

因此 Phase 3 冻结路径与 permission requirement，但**不得自建 operator auth**。

建议 prefix：

```text
/api/v1/admin/platform
```

当 Operations provider 尚未接入时：

```text
Management application use cases = implementable
Management HTTP routes = may remain unregistered / integration-blocked
```

不能为了方便临时开放无保护写接口。

---

# 9. Management Permission Keys

未来 Operations RBAC permission requirement：

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

这些是 requirement，不是 Platform 内部权限实现。

Operations 完成后由统一 operator-auth/RBAC adapter 强制。

---

# 10. Feature Flag Management API

## Query

```text
GET /api/v1/admin/platform/feature-flags
GET /api/v1/admin/platform/feature-flags/:key
```

可返回 management-needed fields：

```text
key
name
description
default_enabled
status
created_at
updated_at
overrides with region_code/client_platform/enabled
```

不返回内部 BIGINT。

## Create

```text
POST /api/v1/admin/platform/feature-flags
```

Request：

```json
{
  "key": "social_discovery",
  "name": "Social Discovery",
  "description": "...",
  "default_enabled": false
}
```

初始 status 固定 active；不允许创建 retired/inactive 来绕过 lifecycle command。

## Update

```text
PATCH /api/v1/admin/platform/feature-flags/:key
```

允许：

```text
name
description
default_enabled
status active<->inactive
```

不允许改 key。

Retire 使用显式 command：

```text
POST /api/v1/admin/platform/feature-flags/:key/retire
```

## Override

```text
PUT    /api/v1/admin/platform/feature-flags/:key/override
DELETE /api/v1/admin/platform/feature-flags/:key/override
```

Body/query scope：

```json
{
  "region_code": "LA",
  "client_platform": "android",
  "enabled": true
}
```

Set 至少 region/client 一项；DELETE 同样按 normalized scope 定位。

Global Override rejected：`400 FEATURE_FLAG_INVALID_SCOPE`。

---

# 11. Runtime Config Management API

```text
GET   /api/v1/admin/platform/runtime-configs
GET   /api/v1/admin/platform/runtime-configs/:key
PUT   /api/v1/admin/platform/runtime-configs/:key
POST  /api/v1/admin/platform/runtime-configs/:key/retire
```

No delete after formal use。

PUT request：

```json
{
  "value_type": "string",
  "value": "zh-CN",
  "description": "Default product locale",
  "expected_updated_at": "2026-08-31T01:00:00Z"
}
```

Rules：

- key must be registered in code registry；
- `value_type` must match registry definition；
- existing key cannot change value_type；
- stale expected_updated_at → `409 PLATFORM_CONFLICT`；
- retired terminal；
- server-only/client-public visibility is registry metadata, not DB field。

---

# 12. App Version Management API

```text
GET    /api/v1/admin/platform/app-versions?client_platform=android
POST   /api/v1/admin/platform/app-versions
PATCH  /api/v1/admin/platform/app-versions/:client_platform/:build_number
POST   /api/v1/admin/platform/app-versions/:client_platform/:build_number/publish
POST   /api/v1/admin/platform/app-versions/:client_platform/:build_number/policy
DELETE /api/v1/admin/platform/app-versions/:client_platform/:build_number
```

DELETE only draft and never-released row。

Create draft request：

```json
{
  "client_platform": "android",
  "version": "2.4.0",
  "build_number": 24001,
  "release_notes": "..."
}
```

Publish：

```text
draft -> active/none
released_at = now
```

V1 publish does not schedule future release。

Policy request：

```json
{
  "status": "deprecated",
  "update_policy": "optional",
  "expected_updated_at": "..."
}
```

Application validates status-policy CHECK plus higher active target invariant。

---

# 13. Announcement Management API

```text
GET    /api/v1/admin/platform/announcements
GET    /api/v1/admin/platform/announcements/:announcement_id
POST   /api/v1/admin/platform/announcements
PATCH  /api/v1/admin/platform/announcements/:announcement_id
POST   /api/v1/admin/platform/announcements/:announcement_id/publish
POST   /api/v1/admin/platform/announcements/:announcement_id/retire
DELETE /api/v1/admin/platform/announcements/:announcement_id
```

Public identifier = `announcements.public_id UUID`。

Draft create supports only DB fields：

```json
{
  "title": "...",
  "content": "...",
  "region_code": "LA",
  "client_platform": "android",
  "starts_at": "2026-09-01T00:00:00Z",
  "ends_at": "2026-09-03T00:00:00Z"
}
```

No locale, language, priority, push channel。

Publish requires starts_at；if omitted in draft, publish command may set `starts_at=now` explicitly as product action。

Published update：title/content/ends_at only；scope/initial start immutable after publish。

DELETE only draft；published history retained。

---

# 14. Region Management API

```text
GET   /api/v1/admin/platform/regions
GET   /api/v1/admin/platform/regions/:code
POST  /api/v1/admin/platform/regions
PATCH /api/v1/admin/platform/regions/:code
POST  /api/v1/admin/platform/regions/:code/retire
```

Create：

```json
{
  "code": "LA",
  "name": "Laos",
  "default_locale": "lo-LA",
  "timezone": "Asia/Vientiane"
}
```

Initial status active。

PATCH allows：

```text
name
default_locale
timezone
status active<->inactive
```

code immutable；retired via explicit command；retired terminal；no physical delete for used Region。

---

# 15. Management Response / IDs

Admin API may expose stable natural/public identifiers：

```text
feature flag -> key
runtime config -> key
app version -> client_platform + build_number
announcement -> public_id UUID
region -> code
```

禁止暴露：

```text
feature_flags.id
feature_flag_overrides.id
runtime_configs.id
app_versions.id
announcements.id
regions.id
```

---

# 16. Idempotency / Retry Semantics

- GET/read naturally retry-safe；
- Feature Override PUT is idempotent by normalized scope；
- Remove Override DELETE: absent row still success/no-op；
- Retire commands: already retired returns success/current terminal state；
- Publish command: exact same already-published state may be retry-safe if no conflicting change；
- draft create is not automatically idempotent unless natural unique key catches duplicate；
- app-version create same platform/build conflict maps to stable conflict；
- management command must not expose raw `23505` etc。

---

# 17. HTTP Status Guidance

```text
200  successful read/update/command
201  created draft/flag/region
204  idempotent delete where no body useful
400  validation/unsupported scope
404  management resource or active runtime region not found
409  lifecycle/stale-write/version mismatch/conflict
503  runtime policy/config unavailable due incomplete canonical state
500  unexpected internal failure
```

具体 Foundation error envelope 复用已有统一 contract。

---

# 18. API Audit Checklist

```text
Table CRUD as core runtime API = 0
Generic client runtime config dump = 0
Unsupported flag scope = 0
Internal BIGINT exposure = 0
SemVer ordering = 0
Invented store URL = 0
Invented announcement locale/priority = 0
Platform-owned operator auth = 0
Operations-owned Platform state = 0
Cross-domain physical FK = 0
```

本文到此停止，不开始 Platform Implementation。
