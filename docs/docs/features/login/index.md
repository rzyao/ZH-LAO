---
feature_id: login
title: 用户登录与会话
portfolio_status: active
domain:
  - identity
status:
  design: done
  backend: done
  mobile: ready
  integration: todo
  acceptance: todo
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
    - 用户资料修改
    - 设备管理运营能力
    - 登录风控运营后台
dependencies:
  upstream:
    - OTP Provider
    - Facebook Provider
  downstream:
    - account-profile
  external:
    - SMS Provider
    - Facebook OAuth Provider
evidence:
  design:
    artifacts:
      - Identity Domain
      - Identity Flows
      - Identity API
    gate:
      - LOGIN-FEATURE-DESIGN
  backend:
    artifacts:
      - Identity Backend
      - Identity API
      - Implementation Report
    tests:
      - Login API tests
    gate:
      - LOGIN-BACKEND-GATE
---

# 用户登录与会话

## 功能概览

负责 Identity 领域认证入口和会话生命周期。

负责：
- Phone OTP 登录
- Phone / Facebook 登录
- Access Token / Refresh Token 生命周期
- Refresh rotation
- 登录退出
- 认证失败和账号状态处理

不负责：
- 用户资料管理
- 设备管理运营
- 登录风控运营
- Provider 运营配置

## Contract 边界

### Owns
- Authentication Contract
- Session Lifecycle Contract
- Token Contract

### Consumes
- OTP Provider Contract
- Facebook Provider Contract

### Forbidden
- Login 不修改 Profile
- Login 不管理运营策略

## Dependency

### Upstream
- OTP Provider
- Facebook Provider

### Downstream
- account-profile

### External
- SMS Provider
- Facebook OAuth Provider

## 设计

### Scope
冻结认证入口、登录流程、Session 生命周期、Token 契约和错误边界。

### Stage / Artifact
`LOGIN-FEATURE-DESIGN` 已完成。

### Gate / Evidence
设计 Contract 和流程已冻结。

### Next Action
新增登录方式时创建新的 Design Stage。

## Backend

### Scope
实现 OTP、Phone/Facebook 认证、Session 创建、Refresh rotation、Logout 和错误映射。

### Stage / Artifact
`LOGIN-BACKEND` 已完成。

### Gate / Evidence
已有 API、实现报告和测试证据。

### Next Action
生产 Provider 接入进入 Integration。

## Mobile

### Scope
Mobile 登录入口、OTP 页面、Token 保存恢复和错误展示。

### Stage / Artifact
`LOGIN-MOBILE-DESIGN` 当前 ready。

### Gate / Evidence
尚未完成 Mobile Gate。

### Next Action
完成 Mobile Design Artifact 后进入实现。

## Integration

### Scope
验证 Mobile、Identity API、生产 Provider 的真实登录链路。

### Stage / Artifact
`LOGIN-INTEGRATION` 当前 todo。

### Gate / Evidence
需要完成真实环境验证。

### Next Action
建立 Integration Gate。

## Acceptance

### Scope
验证完整认证链路和异常处理。

### Stage / Artifact
`LOGIN-ACCEPTANCE` 当前 todo。

### Gate / Evidence
需要完整 Feature Acceptance Evidence。

### Next Action
等待 Mobile 与 Integration 完成后建立 Acceptance Report。
