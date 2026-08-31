---
feature_id: role-management
title: 角色管理
portfolio_status: active
domain:
  - operations
status:
  design: done
  backend: done
  admin: todo
  mobile: na
  integration: todo
  acceptance: todo
evidence:
  design:
    - docs/docs/domains/operations/rbac.md
    - docs/docs/development/04-operations/OPERATIONS_RBAC_CONTRACTS.md
  backend:
    - docs/docs/development/04-operations/OPERATIONS_IMPLEMENTATION_REPORT.md
    - apps/backend/src/modules/operations/http/routes.ts
    - apps/backend/src/modules/operations/application/services/operations-service.ts
mobile_pages: []
admin_pages: []
---

# 角色管理

## 功能概览

Portfolio Status：`active`。

Operations V1 已冻结 flat RBAC 与 Role lifecycle，并已完成 Backend API/实现；当前没有可证明 Role Management Admin UI 已交付的证据，因此 Admin、集成与 Feature 验收仍保持未启动。

## 设计

状态：done

- **范围**：支持 custom Role；`code` immutable、`name/description` mutable、状态仅 `active | disabled`；不支持 hierarchy、deny、wildcard、direct operator permission；`super_admin` 是受保护 reserved Role。
- **Stage / Artifact**：Operations Domain Design；`domains/operations/rbac.md`、`OPERATIONS_RBAC_CONTRACTS.md`。
- **Gate / Evidence**：`OPERATIONS_DESIGN_GATE = PASS`，Role model 与 super-admin invariants 已冻结。
- **下一步**：保持 frozen contract；未来 Role 扩展先通过 Operations Design Gate。

## Backend

状态：done

- **范围**：Role 列表/详情/创建/更新/disable/enable，并执行 reserved `super_admin` 保护与成功 mutation audit。
- **Stage / Artifact**：Operations Implementation；`routes.ts`、`operations-service.ts`、integration/security tests。
- **Gate / Evidence**：`OPERATIONS_GATE = PASS`；Implementation Report 的 Role Management 与 security/race gates 均通过。
- **下一步**：持续回归 `super_admin` protection、role status 与 authorization immediate effect。

## Admin

状态：todo

- **范围**：Role 列表、创建、编辑、启用/禁用及受保护角色错误反馈。
- **Stage / Artifact**：当前 main 未发现 Operations Role 业务 UI implementation；Admin Foundation 仅提供通用壳层/权限 guard。
- **Gate / Evidence**：无 Role Management Admin Gate / UI evidence。
- **下一步**：Operations Admin Stage 建立真实页面并接入 `/api/v1/admin/operations/roles*`。

## Mobile

状态：na

- **范围**：内部后台管理能力，不面向 Mobile。
- **Stage / Artifact**：不适用。
- **Gate / Evidence**：不要求 Mobile Gate。
- **下一步**：无。

## 集成

状态：todo

- **范围**：Admin Role UI 与 protected API、permission guards、审计和 role-disable 即时授权效果的接线。
- **Stage / Artifact**：Backend integration 已验证；Admin integration 未开始。
- **Gate / Evidence**：无 Admin+Backend Role Management E2E evidence。
- **下一步**：Admin 完成后覆盖 CRUD-like lifecycle、403、reserved role protection 与即时权限变化。

## 验收

状态：todo

- **范围**：真实 Operator 在后台完成 Role 管理并获得正确错误与审计反馈。
- **Stage / Artifact**：Feature acceptance 未开始。
- **Gate / Evidence**：Backend Gate PASS 仅证明 Operations capability，不证明端到端 Admin Feature。
- **下一步**：待 Admin/集成完成后执行 Feature E2E 与验收 Gate。
