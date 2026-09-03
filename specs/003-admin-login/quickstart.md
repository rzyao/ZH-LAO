# Quickstart & Verification Guide: 后台管理员登录 (Admin Login)

**Feature Branch**: `003-admin-login` | **Date**: 2026-09-03 | **Spec**: [spec.md](./spec.md)

本文档提供端到端验证后台管理员登录、会话刷新、改密、退出与审计流程的快速指引。契约详见 [contracts/http-api.md](./contracts/http-api.md) 与 [contracts/frontend-session.md](./contracts/frontend-session.md)，数据模型详见 [data-model.md](./data-model.md)。

---

## 1. 运行前置条件 (Prerequisites)

- Node.js 22+ & pnpm。
- 本地或 CI PostgreSQL 数据库运行，已执行全部迁移（`0100_identity.sql`、`1220_identity_auth_runtime.sql`、`1260_admin_credentials.sql`、`0200_operations.sql` 等）。
- 后端服务环境变量：
  ```bash
  DATABASE_URL="postgres://postgres:postgres@localhost:5432/zhlao"
  JWT_SECRET="test-jwt-secret-at-least-32-characters-long"
  ```
- 首次启动自动执行 `ensureDefaultAdmin` 引导，创建默认管理员（`admin / 123456`）与 `super_admin` 运营映射。

---

## 2. 端到端核心业务验证场景 (Verification Scenarios)

### 场景 A: 管理员登录全流程 (US-001 / FR-001..006)

1. **登录**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/admin/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "123456"}'
   ```
   **期望结果**: HTTP 200，返回 `access_token`（JWT, expires_in=900）、`refresh_token`、`session_expires_at`。数据库 `identity.sessions` 新增一条 `active` 会话。

2. **获取当前操作员**:
   ```bash
   curl -X GET http://localhost:3000/api/v1/admin/operations/me \
     -H "Authorization: Bearer <ACCESS_TOKEN>"
   ```
   **期望结果**: HTTP 200，返回 `operator`（含 `roles`、`permissions`）。`super_admin` 权限集应等于 `OPERATOR_PERMISSION_CATALOG` 全量。

3. **错误密码防枚举**: 提交错误密码与不存在用户名，两者均返回 HTTP 401 `INVALID_CREDENTIAL`，响应结构一致。

### 场景 B: 会话刷新与令牌轮换 (US-002 / FR-007)

1. **正常刷新**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/identity/sessions/refresh \
     -H "Content-Type: application/json" \
     -d '{"refresh_token": "<REFRESH_TOKEN>"}'
   ```
   **期望结果**: HTTP 200，返回新的 `access_token` 与全新 `refresh_token`；旧 refresh token 立即失效。

2. **旧 token 重放攻击测试**: 再次使用已消费的旧 refresh token 刷新。
   **期望结果**: HTTP 401 `INVALID_CREDENTIAL`。

### 场景 C: 默认管理员引导幂等 (US-003 / FR-009..010)

1. 在空库首次启动：`ensureDefaultAdmin` 创建 `admin_credentials` 与 `super_admin` operator。
2. 再次重启服务：不产生重复账号，引导空转无副作用（幂等）。
3. 已存在至少一个 operator 后重启：不再创建默认管理员。

### 场景 D: 修改管理员密码 (US-004 / FR-011)

1. **成功改密**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/admin/auth/change-password \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <ACCESS_TOKEN>" \
     -d '{"current_password": "123456", "new_password": "admin12345"}'
   ```
   **期望结果**: HTTP 200 `{ "status": "changed", "session_revoked": true }`。当前用户全部会话置为 `revoked`（reason=`password_changed`），旧访问令牌后续请求返回 401。

2. **旧密码登录被拒**: 使用旧密码 `123456` 登录 → HTTP 401。
3. **新密码登录成功**: 使用 `admin12345` 登录 → HTTP 200。
4. **强度校验**: 新密码仅数字/过短/与当前相同 → HTTP 400 `VALIDATION_ERROR`。

### 场景 E: 管理员退出 (US-005 / FR-012)

1. **退出**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/identity/sessions/logout \
     -H "Content-Type: application/json" \
     -d '{"refresh_token": "<REFRESH_TOKEN>"}'
   ```
   **期望结果**: HTTP 204。会话置为 `revoked`（reason=`logout`），刷新令牌失效。
2. **退出后刷新被拒**: 使用该 refresh token 刷新 → HTTP 401。

### 场景 F: 登录失败频控 (FR-017)

1. 连续使用错误密码登录同一账号 ≥ 5 次。
   **期望结果**: 第 5 次后返回 HTTP 429 `LOGIN_RATE_LIMITED`；冷却期内继续尝试仍被拒。
2. 冷却期后（或成功登录）计数清零，恢复正常。

### 场景 G: 审计与安全 (FR-015 / SC-006)

1. 查询审计日志:
   ```bash
   curl -X GET "http://localhost:3000/api/v1/admin/operations/audit-logs?action_key=identity.admin.login" \
     -H "Authorization: Bearer <ACCESS_TOKEN>"
   ```
   **期望结果**: 登录成功产生 `identity.admin.login` 审计记录；`details` 不含密码/令牌等敏感字段。
2. 登录失败**不**产生 `operator_audit_logs` 记录（进入安全日志），符合 audit.md 成功语义。

---

## 3. 自动化测试套件执行指令 (Automated Test Suites)

```bash
# 后端 Identity 模块测试（含 admin auth）
pnpm --filter @zhlao/backend test src/modules/identity

# 后端 Operations 模块测试（审计/RBAC）
pnpm --filter @zhlao/backend test src/modules/operations

# Admin 前端认证模块测试（AuthContext / refresh-session / 改密）
pnpm --filter @zhlao/admin test src/auth
```

---

## 4. 前端手动验证 (Manual Frontend Flow)

1. 启动 Admin（`pnpm --filter @zhlao/admin dev`）与后端。
2. 访问 `/login`，使用 `admin / 123456` 登录 → 跳转首页。
3. 等待 Access Token 过期（或手动清除内存 token）→ 触发受保护请求 → 前端自动刷新并重放，无跳转。
4. 刷新令牌被撤销场景 → 前端清会话并重定向 `/login`。
5. 修改密码 → 全部会话撤销 → 前端重定向 `/login` 并提示重新登录。
