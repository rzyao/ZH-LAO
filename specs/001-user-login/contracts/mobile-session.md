# Mobile Client Contract: 会话适配器与存储标准

**Feature Branch**: `001-user-login` | **Date**: 2026-09-02 | **Authority**: `apps/mobile/src/auth/`

移动客户端必须严格遵守 Mobile Foundation 规定的安全存储与会话注入生命周期规范。

---

## 1. 凭据隔离存储契约 (`tokenStore`)

| 凭据类型 | 存储介质 | 安全性说明 | 读写权限 |
|---|---|---|---|
| **Access Token** | 仅运行时内存 (`credentialMemory`) | 永不持久化、严禁写入 AsyncStorage、不进入任何日志。应用杀进程后自然清除。 | 同步读写 |
| **Refresh Token** | 操作系统安全钥匙串 (`Expo SecureStore`) | 硬件级加密防护（iOS Keychain / Android KeyStore）。严禁写入 AsyncStorage。 | 异步 Promise 读写 |
| **Session Metadata** | 操作系统安全钥匙串 (`Expo SecureStore`) | 记录当前会话主体的 `subjectId` (UUID) 与最后更新时间。 | 异步 Promise 读写 |
| **User Preferences** | `AsyncStorage` | 仅存储 UI 语言、主题偏好等非凭证数据，绝对禁止任何认证凭据渗入。 | 异步 Promise 读写 |

---

## 2. 身份恢复适配器契约 (`IdentitySessionAdapter`)

- **Interface Definition** (来自于 `apps/mobile/src/auth/session/identityAdapter.ts`):
  ```typescript
  export interface IdentitySession {
    readonly accessToken: string;
    readonly refreshToken: string;
    readonly subjectId: PublicId;
    readonly expiresAt: IsoDateTimeString | null;
  }

  export interface RestoreSessionInput {
    readonly refreshToken: string;
  }

  export interface IdentitySessionAdapter {
    /**
     * 向 POST /api/v1/identity/sessions/refresh 发起会话续签
     */
    restoreSession(input: RestoreSessionInput): Promise<IdentitySession>;
  }
  ```
- **Lifecycle Integration**:
  1. 应用启动阶段，`bootstrapSession` 从 `tokenStore` 读取本地 Refresh Token。
  2. 若存在，调用注入的 `IdentitySessionAdapter.restoreSession`。
  3. 续签成功：更新内存中的 `access_token` 与安全钥匙串中的新 `refresh_token`，`SessionState` 转为 `authenticated`。
  4. 续签失败（401/403/过期）：清除本地凭据，`SessionState` 平滑降级为 `anonymous`。
  5. 挂载 Axios 拦截器：当业务请求收到 `401 Unauthorized` 时触发 `unauthorizedListener`，执行退出或自动刷新逻辑。

---

## 3. 移动端路由导航交互契约 (`RootNavigator`)

- **Login Screen Route**: `Login` (`apps/mobile/src/screens/auth/LoginScreen.tsx` 归属页面)
  - 路由入参: `{ returnTo?: string }`
  - 职责: 收集国家码/手机号，执行格式校验，调用 `POST /api/v1/identity/phone-otp`。成功后携带手机号跳转至 OTP 验证页。
- **OTP Screen Route**: `Otp` (`apps/mobile/src/screens/auth/OtpScreen.tsx` 归属页面)
  - 路由入参: `{ phone: string, purpose: 'login' }`
  - 职责: 提供 6 位验证码输入、60 秒倒计时、重新发送以及提交认证逻辑。认证成功后更新 `AuthContext` 状态并跳转至主界面。
