# Interface Contract: 前端会话自动刷新与存储

**Feature Branch**: `003-admin-login` | **Date**: 2026-09-03 | **Authority**: `apps/admin/src/auth/*`、`apps/admin/src/api/client/*`

本契约定义 Admin 前端认证会话的本地存储、自动刷新与 401 恢复行为。它是后端会话生命周期（`identity.sessions` + 强制轮换）在前端的镜像，不引入后端新契约。

---

## 1. 会话存储 (`session-store.ts`)

- **存储键**: `zh-lao.admin.session`（`localStorage`）。
- **结构**:
  ```ts
  interface AdminSession {
    accessToken: string
    refreshToken: string
    operator: CurrentOperator
    permissions: string[]
  }
  ```
- **行为**:
  - `readAdminSession()`: 读取并校验结构完整性；损坏则返回 `null`（不抛异常）。
  - `writeAdminSession(session)`: 覆盖写入。
  - `clearAdminSession()`: 移除键。
- **已存在，不改动结构**；仅由 `AuthContext` 与 `refresh-session.ts` 读写。

## 2. 令牌内存存储 (`token-store.ts`)

- 模块级单例 `accessToken`，`setAccessToken` 通知订阅者。
- 由 `AuthContext` / `refresh-session.ts` 更新。

## 3. API 客户端 401 缝 (`api/client/index.ts`)

- `apiClient` 构造时注入 `getAccessToken` 与 `onUnauthorized`。
- `setUnauthorizedHandler(handler)` 注册应用级 401 兜底（当前为清会话登出）。

## 4. 会话自动刷新 (`refresh-session.ts`) — 新增

- **职责**: 当 `apiClient.onUnauthorized`（401）触发时，若存在 refresh token，尝试自动续期并重放原请求。
- **流程**:
  1. 收到 401（非 `skipAuth` 请求）。
  2. 若已有进行中的 refresh Promise，复用之（并发 401 合并为单次 refresh，Promise 去重）。
  3. 调用 `POST /api/v1/identity/sessions/refresh`（`skipAuth: true`）。
  4. 成功 → 更新 `session-store`（新 access + refresh token）与 `token-store`，重放原请求。
  5. 失败 / 无 refresh token → 触发兜底（`setUnauthorizedHandler`），清会话并重定向登录页。
- **约束**:
  - 刷新仅对**非刷新请求**触发（避免刷新自身 401 死循环）。
  - 刷新请求本身不做 401 重放。
  - 重放采用「单次重试」语义：原请求最多自动重试一次。

## 5. 改密流程 (`AuthContext.changePassword` + `change-password.tsx`) — 新增

- `api.ts` 新增 `changeAdminPassword(currentPassword, newPassword)`:
  ```ts
  POST /api/v1/admin/auth/change-password  // Bearer, skipAuth: false
  ```
- 成功后:
  - 后端已撤销全部会话 → 前端清除本地会话并重定向登录页，提示"密码已修改，请重新登录"。
- 失败:
  - `401 INVALID_CREDENTIAL` → 提示"当前密码错误"。
  - `400 VALIDATION_ERROR` → 提示强度/重复问题。

## 6. 登录页 (`login.tsx`) 安全增强

- 输入 trim 与长度校验（FR-002）。
- 统一错误提示（防枚举，FR-004）：不区分"用户名不存在"与"密码错误"。
- 默认超管提示 `admin / 123456` 仅首次引导场景显示；生产环境隐藏（决策 7）。
- 登录成功 → 写会话 → 跳转首页。

---

## 前端行为矩阵

| 场景 | 行为 |
| --- | --- |
| 未登录访问受保护页 | `AuthGuard` 重定向 `/login` |
| Access Token 过期（受保护请求 401） | refresh → 重放；失败则清会话登出 |
| 刷新令牌也被撤销 | 清会话 + 重定向登录页 |
| 修改密码成功 | 后端撤销全部会话 → 前端清会话 + 重定向登录页 |
| 权限变更（403） | 静默刷新 `/api/v1/admin/operations/me` 更新权限池 |
| 主动退出 | 调 `/identity/sessions/logout`（fire-and-forget）→ 清会话 → 重定向登录页 |
