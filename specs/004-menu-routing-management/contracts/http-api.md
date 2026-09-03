# HTTP API Contract: 菜单与路由配置管理 (004-menu-routing-management)

**Feature Branch**: `004-menu-routing-management` | **Date**: 2026-09-03

> ⚠️ **目标契约(Proposed)**: 本契约对应架构变更请求,在 ADR / D-xxx 批准前
> 不具备权威性。批准后落入 `apps/backend/src/modules/platform/http/management-routes.ts`
> 扩展。全部端点复用现有认证/授权/审计链路:
> `requireAuthentication(auth)` + `authorizer.requirePermission(authContext, key)` +
> `audit.recordSuccessfulAction(...)`(对照现有 `/api/v1/admin/platform/*` 模式)。

## 端点总览

| Method | Path | 权限 | 审计 action_key |
| --- | --- | --- | --- |
| GET | `/api/v1/admin/platform/menus` | `platform.menus.read` | — |
| POST | `/api/v1/admin/platform/menus` | `platform.menus.write` | `platform.menus.write` |
| PATCH | `/api/v1/admin/platform/menus/:id` | `platform.menus.write` | `platform.menus.write` |
| POST | `/api/v1/admin/platform/menus/:id/remove` | `platform.menus.write` | `platform.menus.write` |
| PUT | `/api/v1/admin/platform/menus/:parent_id/order` | `platform.menus.write` | `platform.menus.write` |
| GET | `/api/v1/admin/platform/route-targets` | `platform.menus.read` | — |

## 通用约定

- **Base path**: `/api/v1/admin/platform`
- **认证**: 所有端点需要 Bearer 访问令牌(`requireAuthentication`)。
- **授权**: 按表「权限」列执行(`authorizer.requirePermission`)。权限 key 为精确
  三段式,无通配符(对齐现有 Platform 页面 `useExactPermission` 语义)。
- **错误**: 使用现有 `AppError` 语义:
  - `401 UNAUTHORIZED` — 未认证
  - `403 FORBIDDEN` — 认证但无权限
  - `404 PLATFORM_NOT_FOUND` — 菜单项不存在
  - `400 PLATFORM_INVALID_ARGUMENT` — 请求校验失败(route_key 不在白名单、层级超深、label 空白等)
  - `409 PLATFORM_CONFLICT` — `expected_updated_at` 不匹配(并发冲突)
- **时间**: 所有时间字段 ISO 8601 UTC(`toISOString()`),对齐现有 DTO。
- **审计**: 写操作成功后调用 `audit.recordSuccessfulAction`:
  - `target`: `{ domain:'platform', type:'menu', id: String(menuId) }`
  - `details`: `{ command: 'create'|'update'|'remove'|'reorder', ...关键变更 }`
  - `action_key`: 统一 `platform.menus.write`(对齐 feature_flags 单一 write action_key)

---

## 1. GET `/api/v1/admin/platform/menus` — 树形菜单列表

返回完整菜单树(含权限),供菜单管理页与 Sidebar 渲染消费。

**Response 200**:
```json
{
  "groups": [
    {
      "id": 1,
      "label": "系统运维",
      "icon": "settings",
      "route_key": "operations",
      "status": "active",
      "sort_order": 0,
      "updated_at": "2026-09-03T00:00:00.000Z",
      "children": [
        {
          "id": 10,
          "label": "平台控制台",
          "icon": "database",
          "route_key": "platform",
          "status": "active",
          "sort_order": 0,
          "updated_at": "2026-09-03T00:00:00.000Z",
          "children": [
            {
              "id": 101,
              "label": "功能开关",
              "icon": "sliders_horizontal",
              "route_key": "platform.feature_flags",
              "status": "active",
              "sort_order": 0,
              "updated_at": "2026-09-03T00:00:00.000Z",
              "permissions": ["platform.feature_flags.read"],
              "children": []
            }
          ]
        }
      ]
    }
  ]
}
```

- `groups` = 顶层分组(`parent_id IS NULL`)数组;每项含 `children`(一级项)→
  `children`(子项)。层级固定 ≤3 层。
- 字段: `id`(bigint)、`label`、`route_key`(可空,分组可能为 null)、`icon`(可空)、
  `status`、`sort_order`、`updated_at`、`permissions`(string[],仅叶节点含;
  分组/中间层可为空数组或省略)、`children`。
- `removed` 状态的菜单项不出现在列表中。

---

## 2. POST `/api/v1/admin/platform/menus` — 创建菜单项

创建分组(`parent_id` 省略/null)、一级项或子项。

**Request Body**:
```json
{
  "parent_id": null,
  "label": "系统运维",
  "route_key": "operations",
  "icon": "settings",
  "permissions": ["operations.operators.read", "operations.roles.read"],
  "sort_order": 0
}
```

**字段说明**:
- `parent_id`: `bigint | null` 可选 — 不传/null 表示顶层分组;传值表示挂到该父项下。
- `label`: `string` 必填 — 非空(`btrim(label) <> ''`),≤120 字符。
- `route_key`: `string` 可选 — 分组可空;非分组必填且必须命中白名单
  (`MENU_ROUTE_TARGET_KEYS`,服务端镜像校验)。
- `icon`: `string | null` 可选 — ≤64 字符(lucide key),后端仅格式校验,不做白名单。
- `permissions`: `string[]` 可选 — 权限 key 列表;每个 key 必须存在于
  `OPERATOR_PERMISSION_CATALOG`。
- `sort_order`: `integer` 可选 — 同层排序,默认 0。

**校验 (400)**:
- `label` 空白。
- 非分组且 `route_key` 缺失或不在白名单。
- `permissions` 含不在 catalog 的 key。
- 层级超深(挂载后深度 > 3)。
- 父项不存在或父项为 `removed`。

**Response 201**:
```json
{ "menu": { "id": 11, "label": "系统运维", "route_key": "operations", "icon": "settings",
  "status": "active", "sort_order": 0, "updated_at": "2026-09-03T00:00:00.000Z",
  "permissions": ["operations.operators.read", "operations.roles.read"], "children": [] } }
```

**审计**: `{ command:'create', label, route_key, parent_id }`

---

## 3. PATCH `/api/v1/admin/platform/menus/:id` — 编辑菜单项

**Request Body**(全部可选,至少一个):
```json
{
  "label": "平台控制台",
  "route_key": "platform",
  "icon": "database",
  "permissions": ["platform.announcements.read"],
  "status": "active",
  "sort_order": 2,
  "expected_updated_at": "2026-09-03T00:00:00.000Z"
}
```

**字段说明**:
- 可编辑: `label`、`route_key`(白名单校验同创建)、`icon`、`permissions`(整体替换)、
  `status`(`active`↔`disabled`;禁止直接写 `removed`)、`sort_order`。
- `expected_updated_at`: **必填** — 当前看到的 `updated_at`;不匹配 → 409。
- `permissions` 整体替换语义: 传则替换全部;不传则不变。

**响应**: 更新后的 `menu`(同创建 DTO 形状)。

**校验 (400)**: 同创建;`status` 不能为 `removed`(删除走 remove 端点)。
**404**: `id` 不存在或已 `removed`。
**409**: `expected_updated_at` 不匹配。

**审计**: `{ command:'update', label?, route_key?, status?, ...变更前后 }`

---

## 4. POST `/api/v1/admin/platform/menus/:id/remove` — 删除菜单项

**Request Body**:
```json
{ "expected_updated_at": "2026-09-03T00:00:00.000Z" }
```

**语义**:
- 将目标菜单项置 `status = 'removed'`(终态,审计保留,永不物理 DELETE)。
- **级联**: 若含子项,子项一并置 `removed`(与 spec「显式确认并处理子项」一致,
  级联删除为已确认语义)。
- 对齐 feature_flags `POST /:key/retire` 先例(用 POST 而非 DELETE)。

**Response 200**:
```json
{ "menu": { "id": 11, "label": "系统运维", "route_key": "operations", "status": "removed", ... } }
```

**404**: `id` 不存在。
**409**: `expected_updated_at` 不匹配。

**审计**: `{ command:'remove', cascade_children: [ids] }`

---

## 5. PUT `/api/v1/admin/platform/menus/:parent_id/order` — 整体重排单层

`parent_id` 为 `0` 表示顶层(分组层);否则为分组/一级项的 id。

**Request Body**:
```json
{
  "order": [12, 10, 15],
  "expected_updated_at": "2026-09-03T00:00:00.000Z"
}
```

- `order`: 该层全量有序 id 数组(仅含 `active` 项);服务端按数组序写
  `sort_order = 0..n-1`。
- `expected_updated_at`: 目标父项(或整层代表)的 `updated_at`;不匹配 → 409。
  防止两运营人员并发重排互相覆盖。
- 跨父级移动不在本端点(前端先改 `parent_id` 再重排)。

**Response 200**: `{ reordered: [ids] }`

**审计**: `{ command:'reorder', parent_id, order: [...ids] }`(满足 US-004-AS2
  「批量排序可追溯」)。

---

## 6. GET `/api/v1/admin/platform/route-targets` — 路由目标白名单

返回前端注册的白名单(供菜单管理页「目标路由」下拉框消费)。

**Response 200**:
```json
{
  "route_targets": [
    { "key": "overview", "href": "/", "label": "总览看板" },
    { "key": "platform", "href": "/platform", "label": "平台控制台" },
    { "key": "platform.feature_flags", "href": "/platform/feature-flags", "label": "功能开关" },
    { "key": "operations.operators", "href": "/operations/operators", "label": "操作员管理" }
  ]
}
```

- 白名单集合 = `apps/admin/src/navigation/route-registry.ts` 导出的
  `ADMIN_ROUTE_TARGETS`(前端单一事实源)。
- 后端镜像一份 `MENU_ROUTE_TARGET_KEYS`(仅 key 字符串,不复制 href)用于写入校验。
- 该端点将 `ADMIN_ROUTE_TARGETS` 中转给前端菜单管理页;后端不维护路径。

---

## 权限与审计约束

- 新增权限 key(加入 `OPERATOR_PERMISSION_CATALOG`):
  - `platform.menus.read`
  - `platform.menus.write`
- `super_admin` 角色在 bootstrap 时注入完整 catalog,自动获得上述权限(无需 seed)。
- 菜单可见性过滤在**前端**用 `can()`(OR 语义);服务端 `platform.menus.*` 权限
  控制「能否管理菜单」,二者独立。
- 写审计对齐 Operations 约定: 只记录**成功**动作;权限拒绝/认证失败进安全/应用日志。
