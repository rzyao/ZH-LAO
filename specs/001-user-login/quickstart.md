# Quickstart & Verification Guide: 用户登录与会话 (User Login & Session)

**Feature Branch**: `001-user-login` | **Date**: 2026-09-02 | **Spec**: [spec.md](./spec.md)

本文档提供端到端验证用户登录、会话轮换与退出流程的快速指引。

---

## 1. 运行前置条件 (Prerequisites)

- Node.js 22+ & pnpm
- 本地或 CI PostgreSQL 数据库运行，且已执行完全部迁移（包括 `0100_identity.sql` 与 `1220_identity_auth_runtime.sql`）。
- 后端服务配置了开发/测试环境环境变量：
  ```bash
  DATABASE_URL="postgres://postgres:postgres@localhost:5432/zhlao"
  JWT_SECRET="test-jwt-secret-at-least-32-characters-long"
  OTP_FAKE_PROVIDER="true" # 测试环境下拦截并记录 OTP
  ```

---

## 2. 端到端核心业务验证场景 (Verification Scenarios)

### 场景 A: 新用户首次手机号注册全流程 (US-001)

1. **申请验证码**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/identity/phone-otp \
     -H "Content-Type: application/json" \
     -d '{"phone": "+8562099990001", "purpose": "login"}'
   ```
   **期望结果**: HTTP 200 `{"status": "accepted", "retry_after_seconds": 60}`。

2. **提交认证并注册（含学习方向）**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/identity/auth/phone \
     -H "Content-Type: application/json" \
     -d '{
       "phone": "+8562099990001",
       "otp_code": "123456",
       "learning_direction": {"native_language": "lo", "learning_language": "zh"},
       "device": {
         "installation_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
         "platform": "android"
       }
     }'
   ```
   **期望结果**: HTTP 200，包含：
   - `is_new_user: true`
   - `account_status: "active"`
   - `access_token` (JWT，有效时长 900s)
   - `refresh_token` (单次有效随机凭证)
   - 数据库中 `identity.users`、`identity.auth_identities`、`identity.learning_profiles`、`identity.basic_profiles` 与 `identity.sessions` 均生成对应记录，且 `code_hash` 与 `refresh_token_hash` 绝非明文。

---

### 场景 B: 会话刷新与凭证轮换验证 (US-002)

1. **正常刷新**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/identity/sessions/refresh \
     -H "Content-Type: application/json" \
     -d '{"refresh_token": "<SCENARIO_A_REFRESH_TOKEN>"}'
   ```
   **期望结果**: HTTP 200，返回新的 `access_token` 和全新的 `refresh_token`。

2. **旧 Refresh Token 重放攻击测试**:
   再次执行上述相同的 curl 请求（使用已消费的旧 Refresh Token）。
   **期望结果**: HTTP 401 `{"error": {"code": "INVALID_CREDENTIAL", ...}}`。

---

### 场景 C: 单设备退出与全端登出验证 (US-003)

1. **退出当前设备**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/identity/sessions/logout \
     -H "Content-Type: application/json" \
     -d '{"refresh_token": "<CURRENT_REFRESH_TOKEN>"}'
   ```
   **期望结果**: HTTP 204 No Content。后续尝试使用该 token 刷新返回 401。

2. **全端设备会话一键登出**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/identity/sessions/logout-all \
     -H "Authorization: Bearer <VALID_ACCESS_TOKEN>"
   ```
   **期望结果**: HTTP 204 No Content。该用户下在 `identity.sessions` 中的所有活跃会话均被置为 `status = 'revoked', revocation_reason = 'logout_all'`。

---

### 场景 D: 频控与安全边界验证 (Edge Cases)

1. **60 秒冷却测试**: 连续两次调用 `POST /api/v1/identity/phone-otp`，第二次立即触发 HTTP 429 `OTP_RATE_LIMITED`。
2. **验证码 5 次输错锁定测试**: 使用错误验证码连续调用 5 次 `POST /api/v1/identity/auth/phone`，第 5 次后状态转为 `locked`，第 6 次即使输入正确验证码也返回 `OTP_LOCKED`。
3. **老用户尝试篡改学习方向**: 注册后再次登录并传入反向学习语言对，系统返回 HTTP 409 `LEARNING_DIRECTION_IMMUTABLE`。

---

## 3. 自动化测试套件执行指令 (Automated Test Suites)

```bash
# 后端 Identity 模块测试
pnpm --filter @zhlao/backend test src/modules/identity

# 移动端 Auth 模块测试
pnpm --filter @zhlao/mobile test src/auth
```
