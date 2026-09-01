---
feature_id: identity-user-admin
title: 用户账户查询与状态管理
portfolio_status: active
domain:
- identity
- operations
mobile_pages: []
admin_pages: []
---

# 用户账户查询与状态管理

## 功能概览

本 Feature 面向 Operator/Admin 对普通用户 Identity 账户进行查询，并在未来正式设计允许的范围内执行状态管理。它横跨 Identity 与 Operations：Identity 拥有用户身份事实和账户状态，Operations 拥有后台认证、RBAC、权限与审计控制面。

当前仓库只有 Identity 的窄 public query contract，以及 Operations 对“Operator 自身/角色/权限/审计”的冻结 API；不存在普通用户账户搜索、详情或状态管理的正式 Admin API/Page。因此不能把 Operations Domain 已完成或 Identity 内部 `changeStatus()` 误写为本 Feature 已交付。
