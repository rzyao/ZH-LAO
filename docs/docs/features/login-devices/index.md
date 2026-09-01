---
feature_id: login-devices
title: 登录设备与会话管理
portfolio_status: active
domain:
- identity
mobile_pages: []
admin_pages: []
---

# 登录设备与会话管理

## 功能概览

本 Feature 面向用户查看自己的登录设备与会话，并执行已有契约允许的会话/设备管理动作。Identity Backend 已有设备列表、设备撤销、会话列表、Logout 与 Logout All 等底层能力，但 `login-devices` 尚无独立 Feature Stage/Gate，不能因为 Domain Backend 完成就把本页 实际 Stage / Gate 标为 done。

当前冻结 API 支持“按设备撤销并联动撤销设备上的会话”，不支持任意 Session ID 的单条 revoke/delete 端点。
