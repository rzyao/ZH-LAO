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
contracts:
  owns:
    - 用户认证
    - 会话生命周期
    - Access Token / Refresh Token
    - 登录退出
  depends_on:
    - OTP Provider
    - Facebook Provider
evidence:
  design:
    stage:
      - LOGIN-FEATURE-DESIGN
    artifacts:
      - /domains/identity/
      - /domains/identity/flows
  backend:
    stage:
      - LOGIN-IDENTITY-DEPENDENCY
    artifacts:
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

## 设计

- **Scope**：冻结用户认证入口、登录流程、Session 生命周期、Token 契约、退出语义、账号状态限制以及 Provider unavailable 错误边界。
- **Stage / Artifact**：`LOGIN-FEATURE-DESIGN` 已完成；权威设计来源为 Identity Domain、Identity Flows 与 Identity API。
- **Gate / Evidence**：设计 Stage 已通过，登录 API、状态码、deferred 边界均已冻结。
- **Next Action**：保持 canonical contract 稳定；新增登录方式必须创建新的 Design Stage。

## Backend

- **Scope**：实现 OTP 请求与消费、Phone/Facebook 认证、Session 创建、Refresh rotation、Logout、Logout All、账号状态拒绝以及认证错误映射。
- **Stage / Artifact**：`LOGIN-IDENTITY-DEPENDENCY` 已完成；实现位于 Identity Backend 模块。
- **Gate / Evidence**：已有 Identity API、Implementation Report 以及登录相关测试覆盖 OTP、Refresh、Logout、Provider fail-closed 行为。
- **Next Action**：保持 Backend 能力冻结；生产 SMS/Facebook Provider 接入属于 Integration 范围。

## Admin

- **Scope**：登录 Feature 不负责 Operator/Admin 后台能力。
- **Stage / Artifact**：无 Login Admin Stage。
- **Gate / Evidence**：当前无 Admin surface，因此 Lane 为 `na`。
- **Next Action**：未来如增加登录风控后台，应建立独立 Feature。

## Mobile

- **Scope**：Mobile 登录入口、OTP 页面、API 调用、Token 保存恢复、错误状态以及设备信息提交。
- **Stage / Artifact**：`LOGIN-MOBILE-DESIGN` 当前为 ready；输入为 LOGIN_MOBILE_DESIGN_BRIEF。
- **Gate / Evidence**：尚无 Mobile Design Gate PASS，不代表 Mobile 已实现。
- **Next Action**：完成 Mobile Execution Brief、Implementation Blueprint、Design Report 后进入实现阶段。

## 集成

- **Scope**：Mobile、Identity API、生产 OTP Provider、Facebook Provider 与真实环境登录链路集成。
- **Stage / Artifact**：`LOGIN-INTEGRATION` 当前 todo。
- **Gate / Evidence**：测试 Provider 可验证 fail-closed 行为，但不代表生产 Provider 已接入。
- **Next Action**：建立正式 Integration Stage，并完成真实环境验证。

## 验收

- **Scope**：验证完整登录链路，包括 Mobile、Backend、Provider、Token 生命周期、异常处理以及账号状态。
- **Stage / Artifact**：`LOGIN-ACCEPTANCE` 当前 todo。
- **Gate / Evidence**：当前只有 Backend 回归证据，没有完整 Feature Acceptance Gate。
- **Next Action**：等待 Mobile 与 Integration 完成后建立 Feature Acceptance Report。