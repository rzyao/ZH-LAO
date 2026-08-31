---
page_id: admin-operators
title: 操作员管理
route: /operators
features:
  - operator-management
domains:
  - operations
permissions:
  - operations.operator.read
  - operations.operator.update
status: todo
---

# 操作员管理

## 页面目标

供具备权限的运营人员查询和管理操作员。

## UI State 与操作

包含列表、详情、编辑、无权限与提交失败状态；每项变更必须留下审计记录。

## Backend API、权限与测试

API 和权限以 Operations 契约为准。页面归属 [操作员管理](/features/operator-management/)；实现和测试待推进。
