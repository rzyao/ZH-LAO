---
feature_id: login
title: 用户登录与会话

portfolio_status: active

domain:
  - identity

status:
  design: done
  implementation: active
  verification: todo

contracts:
  owns:
    - 用户认证
    - 会话生命周期
    - Access Token / Refresh Token
    - 登录退出

  consumes:
    - OTP Provider Contract
    - Facebook Provider Contract

  forbidden:
    - 用户资料管理
    - 设备运营管理
    - 登录风控运营配置

dependencies:
  upstream:
    - otp-provider
    - identity-domain

  downstream:
    - account-profile

  external:
    - facebook-provider

evidence:
  artifacts:
    - /domains/identity/
    - /domains/identity/flows
    - /development/02-identity/IDENTITY_API
    - /development/02-identity/IDENTITY_IMPLEMENTATION_REPORT

  tests:
    - OTP authentication flow
    - Refresh rotation flow
    - Logout flow

  gate:
    - LOGIN-DESIGN-GATE
    - LOGIN-BACKEND-GATE
---

# 用户登录与会话

## 功能概览

用户登录与会话负责 Identity 领域中的用户认证入口和会话生命周期管理。

核心能力：

- Phone OTP 登录；
- Phone / Facebook 登录；
- 首次认证流程；
- Session 创建与恢复；
- Access Token / Refresh Token 生命周期；
- Refresh rotation；
- 单设备退出与全部会话退出；
- 认证失败与账号状态处理。

不包含：

- 用户资料管理；
- 设备管理后台；
- 登录风险运营系统；
- 第三方 Provider 运营配置。

---

## 生命周期

当前状态：

```text
active
```

当前阶段：

```text
Backend Capability 已完成
Mobile Integration 尚未完成
Feature Acceptance 尚未完成
```

状态成立依据：

- Identity Contract 已冻结；
- Backend 登录能力已实现；
- API 与实现报告已存在；
- 完整端到端验收尚未完成。

下一阶段：

完成 Mobile 接入、生产 Provider 集成和 Feature Acceptance。

---

## Contract 边界

### Owns

本 Feature 负责：

- 用户身份认证；
- Session 生命周期；
- Token 生命周期；
- 登录与退出语义。

### Consumes

依赖：

- OTP Provider Contract；
- Facebook Provider Contract。

### Forbidden

禁止：

- 修改用户资料领域；
- 管理运营后台策略；
- 承担第三方 Provider 配置管理。

---

## Dependency

### Upstream

依赖前置能力：

- OTP Provider；
- Identity Domain。

### Downstream

影响后续能力：

- Account Profile。

### External

外部系统：

- Facebook Provider。

---

## Evidence

### Artifacts

- Identity Domain 设计；
- Identity Flow 定义；
- Identity API；
- Identity Implementation Report。

### Tests

已覆盖：

- OTP 登录流程；
- Refresh rotation；
- Logout；
- Provider fail-closed 行为。

### Gate

已通过：

- LOGIN-DESIGN-GATE；
- LOGIN-BACKEND-GATE。

待完成：

- LOGIN-INTEGRATION-GATE；
- LOGIN-ACCEPTANCE-GATE。

---

## Gate

### LOGIN-DESIGN-GATE

目标：

冻结登录能力边界和认证契约。

输入：

- Identity Domain；
- Identity Flow；
- API Contract。

检查项：

- Contract 明确；
- 边界明确；
- 依赖明确。

结果：

PASS。

---

### LOGIN-BACKEND-GATE

目标：

确认 Backend 登录能力可用。

输入：

- API 实现；
- 测试结果；
- Implementation Report。

检查项：

- Authentication Flow；
- Session 创建；
- Token 生命周期；
- Logout 行为。

结果：

PASS。

---

## 验证计划

完成标准：

- Mobile 登录流程完成；
- Provider 真实环境接入完成；
- 端到端测试通过；
- Acceptance Evidence 完整。
