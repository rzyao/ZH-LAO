---
feature_id: login
title: 用户登录与会话
portfolio_status: active
domain:
- identity
source_migration: manual
delivery_evidence:
- /developer/features/login
- https://github.com/rzyao/ZH-LAO/tree/8f3237e/specs/001-user-login
- https://github.com/rzyao/ZH-LAO/blob/8f3237e/apps/backend/src/modules/identity/http/routes.ts
- https://github.com/rzyao/ZH-LAO/blob/8f3237e/apps/mobile/src/screens/auth/LoginScreen.tsx
last_updated: 2026-09-02
last_verified_at: 2026-09-02
---

# 用户登录与会话

## 用户价值

让中文或老挝语学习者通过手机号验证码或 Facebook 认证建立正式身份，并在访问令牌过期、设备更换或主动退出时安全管理会话。

## 使用者与可观察流程

- 使用者：未登录的学习者、已注册学习者；后台管理员认证是独立能力，不在本页冒充用户登录。
- 手机流程：输入手机号 → 请求 OTP → 输入 6 位验证码 → 新用户提交固定学习方向或老用户直接认证 → 获得会话令牌并进入主界面。
- 会话流程：使用 Refresh Token 刷新 → 旧凭证轮换失效；用户可退出当前会话或退出所有设备。
- 第三方流程：提交 Facebook 凭证 → 服务端校验 Provider → 已有账号登录或新用户注册。

## 范围与非范围

包含 Phone OTP、Phone/Facebook 认证、首次注册、Access/Refresh Token、Refresh rotation、当前会话退出和全端退出。不包含用户资料管理、设备管理后台、登录风控运营后台和第三方 Provider 运营配置；这些边界沿用[本功能页](/developer/features/login)和 Identity 文档。

## 参与系统

| 系统 | 参与方式 |
| --- | --- |
| Backend | Identity routes、服务和 Repository 提供认证与会话能力 |
| Mobile | Login/Otp screens 调用 Identity API，承载用户登录体验 |
| Admin | 用户登录不属于 Admin；后台管理员认证是独立能力 |

## 分层交付状态

| 层 | 状态 | 判断 |
| --- | --- | --- |
| 产品 | `defined / spec draft` | [Spec Kit spec](https://github.com/rzyao/ZH-LAO/blob/8f3237e/specs/001-user-login/spec.md)存在且仍为 Draft；不能据此宣称产品验收完成 |
| 数据库 | `baseline present` | [Identity auth migration](https://github.com/rzyao/ZH-LAO/blob/8f3237e/database/migrations/1220_identity_auth_runtime.sql)与数据库基线报告包含 OTP、Device、Session 等物理结构；本页未重新执行数据库 Gate |
| Backend | `implemented at migration baseline` | [Identity routes](https://github.com/rzyao/ZH-LAO/blob/8f3237e/apps/backend/src/modules/identity/http/routes.ts)及服务、Repository 已存在；针对 Identity module tests 12/12 通过 |
| Admin | `not applicable` | 用户登录体验在 Mobile；Admin 登录是另一个后台认证能力 |
| Mobile | `implemented in code; UI acceptance pending` | [LoginScreen](https://github.com/rzyao/ZH-LAO/blob/8f3237e/apps/mobile/src/screens/auth/LoginScreen.tsx)、[OtpScreen](https://github.com/rzyao/ZH-LAO/blob/8f3237e/apps/mobile/src/screens/auth/OtpScreen.tsx)已调用 Identity API；未找到专门的登录 UI 验收测试 |
| Integration | `not evidenced` | 已看到 Mobile 与 Backend 端点对接代码，但没有本页范围内的真实设备端到端证据 |
| Acceptance | `not evidenced` | Spec 仍为 Draft；不能以任务勾选或代码存在替代 Feature Gate |

## 证据

- [本功能页](/developer/features/login)
- [001-user-login Spec Kit 工件](https://github.com/rzyao/ZH-LAO/tree/8f3237e/specs/001-user-login)
- Backend targeted verification：`pnpm exec vitest run test/modules/identity test/modules/content --exclude test/integration/**` 中 Identity 6 个文件、12 tests PASS。
- Mobile repository verification：`pnpm test -- --runInBand`，10 suites、63 tests PASS；该结果包含基础回归，不等于登录端到端验收。

## 限制、阻塞与下一步

- `specs/001-user-login/spec.md` 当前状态为 Draft，产品验收和正式 Feature Gate 仍未证明。
- 未发现专门的 Mobile 登录/OTP UI 测试或真实设备 E2E 证据；需要在不改变 Identity authority 的前提下补齐。
- 当前详情页只核验到 Phone OTP 的 Mobile 体验；Facebook 的 Mobile 入口是否交付不能从 Backend 代码推断。
- 下一步应以 Feature Manifest/Execution Brief 定义集成范围，完成真实 API、错误态、会话恢复和 E2E 验收后再提升本页状态。
