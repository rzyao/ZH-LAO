---
page_id: mobile-otp
title: OTP 验证页
route: /otp
features:
  - login
domains:
  - identity
status: active
---

# OTP 验证页

## 页面目标

完成一次性验证码验证并建立 Session。

## Navigation

从[登录页](login.md)进入；成功后进入已认证体验。

## UI State

输入、验证中、验证码失效、重发和验证成功。

## API 与错误处理

映射 Identity OTP 验证与重发能力；明确展示过期、错误与限流结果。

## 权限与测试

未认证可访问。页面归属 [用户登录与会话](/features/login/)；真实 API 与设备验收待完成。
