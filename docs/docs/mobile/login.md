---
page_id: mobile-login
title: 登录页
route: /login
features:
  - login
domains:
  - identity
status: active
---

# 登录页

## 页面目标

让用户开始身份认证流程。

## Navigation

成功提交身份凭证后进入 [OTP 验证页](otp.md)。

## UI State

初始、提交中、校验失败和待验证。

## API 与错误处理

映射 Identity 认证入口；网络失败、无效凭证和限流必须明确提示。

## 权限与测试

未认证可访问。页面归属 [用户登录与会话](/features/login/)；设备测试与真实 API 集成待完成。
