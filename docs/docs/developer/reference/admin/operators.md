---
page_id: admin-operators
title: 操作员与 RBAC 管理
route: /operations/operators
features:
  - operator-management
domains:
  - operations
permissions:
  - operations.operators.read
  - operations.operators.create
  - operations.operators.update
  - operations.operators.disable
  - operations.operators.enable
  - operations.operator_roles.assign
  - operations.operator_roles.revoke
status: active
---

# 操作员与 RBAC 权限管理

## 页面目标

供具备权限的操作员管理系统后台操作员映射、配置扁平 RBAC 角色与权限矩阵、查看操作审计日志。

## 相关路由与功能

- **操作员管理**：`/operations/operators`（支持查询、新建关联 Identity、分配角色、启用/禁用）
- **角色与权限矩阵**：`/operations/roles`（支持角色 CRUD、全域树状权限矩阵整量配置 `SetRolePermissions`）
- **操作审计日志**：`/operations/audit-logs`（多条件筛选、查看 JSONB 变更载荷）

## UI State 与安全规范

- **最后超级管理员保护**：系统禁止禁用最后一位激活的 `super_admin` 操作员或移除其角色。
- **自身防呆**：当前登录账号无法在 UI 上禁用自身。
- **即时生效**：权限直查 PostgreSQL 事务快照，修改后下一次 API 请求即刻生效。

## 关联架构文档

- 领域设计：[运营（Operations）](/developer/reference/domains/operations/) 与 [RBAC 与授权](/developer/reference/domains/operations/rbac)
- 交付证据：[Operations Admin 实施交付报告](/developer/reference/evidence/operations/OPERATIONS_IMPLEMENTATION_REPORT)
