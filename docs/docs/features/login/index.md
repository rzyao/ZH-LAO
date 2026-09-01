---
feature_id: login
title: 用户登录与会话
portfolio_status: active
domain:
- identity
mobile_pages:
- mobile-login
- mobile-otp
admin_pages: []
contracts:
  owns:
  - 用户认证
  - 会话生命周期
  - Access Token / Refresh Token
  - 登录退出
  depends_on:
  - OTP Provider
  - Facebook Provider
delivery_evidence:
- LOGIN-FEATURE-DESIGN
- /domains/identity/
- /domains/identity/flows
- LOGIN-IDENTITY-DEPENDENCY
- /development/backend/identity/
- /development/02-identity/IDENTITY_API
- /development/02-identity/IDENTITY_IMPLEMENTATION_REPORT
---

# 用户登录与会话

## 功能概览

用户登录与会话负责 Identity 领域中的认证入口和会话生命周期。

包含：

- Phone OTP 登录
- Phone / Facebook 登录
- 首次注册认证流程
- Access Token / Refresh Token
- Refresh rotation
- 当前会话退出
- 全部会话退出
- 认证失败与账号状态错误处理

不包含：

- 用户资料管理
- 设备管理后台
- 登录风控运营后台
- 第三方 Provider 运营配置

这些能力由其它 Feature 或独立 Stage 管理。
