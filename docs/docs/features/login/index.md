---
feature_id: login
title: 用户登录与会话
portfolio_status: active
domain:
  - identity
status:
  design: done
  backend: done
  admin: na
  mobile: ready
  integration: todo
  acceptance: todo
mobile_pages:
  - mobile-login
  - mobile-otp
admin_pages: []
evidence:
  design:
    - /domains/identity/
    - /domains/identity/flows
  backend:
    - /development/backend/identity/
    - /development/02-identity/IDENTITY_API
    - /development/02-identity/IDENTITY_IMPLEMENTATION_REPORT
    - /development/02-identity/IDENTITY_REGRESSION_HOTFIX_REPORT
---

# 用户登录与会话

## 功能概览

本 Feature 覆盖 Identity 的用户认证入口与会话主链路：Phone OTP、Phone/Facebook 登录或首次注册、Access Token / Refresh Token、Refresh rotation、当前会话退出、全部会话退出，以及认证失败、账号状态、Provider unavailable 等错误语义。首次注册时可同时冻结学习方向并可绑定设备；登录后的资料、设备管理等独立能力不在本 Feature 中重复定义。

当前 Identity Domain 已整体通过 Gate，但本页只按 `login` 自身的 Stage、实现代码和测试判断各 Lane，不能用 Domain 级 `IDENTITY_GATE = PASS` 替代 Feature 级完成证据。

## 设计

- **Scope**：冻结 Phone OTP 请求/消费、Phone/Facebook 认证、首次注册、固定学习方向、Access/Refresh Token、Refresh rotation、Logout / Logout All、账号状态拒绝、设备绑定与 Provider unavailable 的产品/契约语义；Facebook 客户端只提交 opaque credential，服务端验证并推导 provider subject。
- **Stage / Artifact**：`AI_STAGE_REGISTRY.json` 中 `LOGIN-FEATURE-DESIGN = done`；权威设计见 [Identity Domain](/domains/identity/)、[Identity Flows](/domains/identity/flows) 与 [Identity API](/development/02-identity/IDENTITY_API)。
- **Gate / Evidence**：Login 的 Feature Design Stage 已在 Stage Registry 标记完成；冻结 API 明确登录/会话端点、状态码与 deferred 边界。Identity 最终审计只作为上游 Domain 证据，不单独证明其它 Feature Lane。
- **Next Action**：保持已冻结的登录契约；若新增 provider、登录方式或会话语义，先进入新的正式 Design Stage，不在 Mobile/Integration Lane 中反向改写 canonical contract。

## Backend

- **Scope**：已实现 `POST /phone-otp`、`POST /auth/phone`、`POST /auth/facebook`、`POST /sessions/refresh`、`POST /sessions/logout`、`POST /sessions/logout-all` 及 Bearer authentication；覆盖 OTP HMAC、冷却/次数限制、原子消费，首次注册与 Session 创建，Refresh token 每次轮换，disabled/closed 账号拒绝，设备撤销后的 Session 拒绝，以及统一验证/认证错误映射。
- **Stage / Artifact**：`LOGIN-IDENTITY-DEPENDENCY = done`；实现位于 `apps/backend/src/modules/identity/`，核心路由为 `http/routes.ts`，Phone OTP 认证为 `application/use-cases/authenticate-with-phone-otp.ts`，Session 生命周期为 `application/use-cases/session-device-lifecycle.ts`。实施证据见 [Identity Backend](/development/backend/identity/)、[Identity Implementation Report](/development/02-identity/IDENTITY_IMPLEMENTATION_REPORT) 与 [Regression Hotfix Report](/development/02-identity/IDENTITY_REGRESSION_HOTFIX_REPORT)。
- **Gate / Evidence**：Feature 自身 Stage 已标记 Backend dependency 完成，且 `identity-http.test.ts`、`request-phone-otp.test.ts`、`session-device-lifecycle.test.ts`、`identity-provider.test.ts` 直接覆盖登录、OTP、Refresh/Logout、设备撤销与 Provider fail-closed；最新 Identity Re-Audit 为 PASS。生产未配置 SMS/Facebook adapter 时返回 `503 PROVIDER_UNAVAILABLE`，不会 fake-success。
- **Next Action**：Backend Lane 保持冻结；真实 SMS/OTP 与 Meta/Facebook provider adapter 属 Integration debt，不把该生产集成债误写为 Backend 未完成，也不以 Backend 完成推导 Integration 完成。

## Admin

- **Scope**：用户登录主链路没有独立 Operator/Admin 页面或后台操作责任。
- **Stage / Artifact**：Feature Inventory 的 `login` 没有 Admin page 映射，Stage Registry 也没有 Login Admin Stage。
- **Gate / Evidence**：当前正式 Feature 定义未要求 Admin 交付，因此本 Lane 为 `na`。
- **Next Action**：无；若未来增加登录风控/运营后台，应以新的正式 Feature/Stage 建模，不在本页隐式扩张 Admin Scope。

## Mobile

- **Scope**：规划中的 Mobile 登录设计包括登录入口、OTP 输入/状态、真实 Identity API 调用、Session/token 持久化与恢复、错误态以及设备信息提交；本 Lane 当前只到设计准备阶段，不代表业务代码已开始。
- **Stage / Artifact**：`LOGIN-MOBILE-DESIGN = ready`，设计输入为 [LOGIN_MOBILE_DESIGN_BRIEF](/development/mobile/auth/LOGIN_MOBILE_DESIGN_BRIEF)。该 Brief 要求后续生成 `LOGIN_MOBILE_EXECUTION_BRIEF.md`、`LOGIN_MOBILE_IMPLEMENTATION_BLUEPRINT.md`、`LOGIN_MOBILE_DESIGN_REPORT.md`；当前 main 尚无这些产物。
- **Gate / Evidence**：`LOGIN_MOBILE_DESIGN_GATE` 尚未有 PASS 证据，且 `LOGIN-MOBILE = todo`。因此原页面 `mobile: active` 与“真实 API 集成推进中”的描述构成 `STATUS_CONFLICT`，本次按 Registry 修正为 `ready`。
- **Next Action**：执行 `LOGIN-MOBILE-DESIGN`，产出 Execution Brief、Implementation Blueprint、Design Report 并通过 Design Gate；之后才允许把 `LOGIN-MOBILE` 进入 active implementation。

## 集成

- **Scope**：Mobile ↔ Identity API、生产 SMS/OTP delivery、真实 Meta/Facebook credential verifier、Session 恢复与设备绑定的端到端生产集成。
- **Stage / Artifact**：`LOGIN-INTEGRATION = todo`；Identity Final Audit / Regression Hotfix 将真实 SMS 与 Facebook adapter 明确记录为 Production Integration Debt。
- **Gate / Evidence**：测试环境显式 Fake provider 可用，但生产缺 provider 时安全返回 `503 PROVIDER_UNAVAILABLE`；这证明 Backend fail-closed，不等于生产 provider 已集成。
- **Next Action**：在正式 Integration Stage 中接入生产 provider，并用真实配置/环境验证 Mobile 登录、OTP 投递、Facebook credential verification、Refresh 与恢复链路后再变更状态。

## 验收

- **Scope**：对真实 Mobile + Backend + 生产 Provider 的登录、首次注册、OTP 异常、Provider unavailable、Token refresh/replay、Logout、Logout All、设备/账号状态与恢复链路做 Feature 级验收。
- **Stage / Artifact**：`LOGIN-ACCEPTANCE = todo`；当前只有 Backend integration/security/race/provider 测试与历史 Domain Gate，没有 Login Feature 的 Mobile/Integration Acceptance Report。
- **Gate / Evidence**：Backend 回归证据充分，但 `LOGIN-MOBILE` 与 `LOGIN-INTEGRATION` 尚未完成，因此不存在可支持 `acceptance: done` 的端到端 Gate。
- **Next Action**：等待 Mobile 与 Integration Lane 的正式 Gate 完成，再建立 Login Acceptance Stage、验收矩阵和可复现的真实环境 evidence。