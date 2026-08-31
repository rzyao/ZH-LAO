---
feature_id: permission-assignment
title: 角色权限分配
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
    - apps/backend/src/modules/operations/public/permissions.ts
    - apps/backend/src/modules/operations/application/services/operations-service.ts
mobile_pages: []
admin_pages: []
---

# 角色权限分配

## 功能概览

Portfolio Status：`active`。

该 Feature 的 canonical truth 是 code-level exact Permission Catalog + Role 完整权限集合替换；数据库只保存 assignment，不存在 permission dictionary table。Backend 已完成，但尚无 Operations Admin 权限配置 UI 与 UI 端到端验收。

## 设计

状态：done

- **范围**：Permission key 固定为 `<domain>.<resource>.<action>` exact key；禁止 wildcard/deny；Role 权限只通过 `SetRolePermissions(role_id, complete_permission_set)` 完整替换；`super_admin` 必须显式拥有完整 catalog。
- **Stage / Artifact**：Operations Domain Design；`domains/operations/rbac.md`、`OPERATIONS_RBAC_CONTRACTS.md`。
- **Gate / Evidence**：`OPERATIONS_DESIGN_GATE = PASS`；Permission Catalog、assignment model 与 authorization algorithm 已冻结。
- **下一步**：新增权限必须由 Owner Domain 先冻结 management capability，再进入 canonical catalog；Feature Page 不提前发明 key。

## Backend

状态：done

- **范围**：Permission Catalog 查询、Role permission 查询/完整集合替换、Operator↔Role assign/revoke、exact permission authorization 与 super-admin protection。
- **Stage / Artifact**：Operations Implementation；`public/permissions.ts`、`operations-service.ts`、HTTP routes 与 integration tests。
- **Gate / Evidence**：`OPERATIONS_GATE = PASS`；Implementation Report 将 assignment/permission set、HTTP/API、security/race 标记 COMPLETE/PASS，E2E 覆盖授权、拒绝与即时撤销。
- **下一步**：保持 catalog/type safety、full-replacement semantics 与权限即时生效回归。

## Admin

状态：todo

- **范围**：Role 权限查看/编辑、Operator 角色分配/解除，以及 permission-aware UI feedback。
- **Stage / Artifact**：当前 main 未发现 Operations 权限管理业务 UI implementation；Admin Foundation 仅提供通用 PermissionGuard/can() 骨架。
- **Gate / Evidence**：无 Permission Assignment Admin completion evidence。
- **下一步**：Operations Admin Stage 接入 permission catalog、role permissions 与 operator role assignment APIs。

## Mobile

状态：na

- **范围**：内部后台 RBAC 管理，不面向 Mobile。
- **Stage / Artifact**：不适用。
- **Gate / Evidence**：不要求 Mobile Gate。
- **下一步**：无。

## 集成

状态：todo

- **范围**：Admin 权限编辑/角色分配 UI 与 Operations APIs、guards、即时权限变化及 audit 的完整接线。
- **Stage / Artifact**：Backend E2E 已完成；Admin integration 尚未开始。
- **Gate / Evidence**：无 Admin+Backend permission-management E2E evidence。
- **下一步**：Admin 实现后覆盖 catalog load、full replace、invalid key、assign/revoke、403 与 immediate revocation。

## 验收

状态：todo

- **范围**：真实 Operator 在后台完成角色权限配置并验证授权结果与审计一致性。
- **Stage / Artifact**：Feature acceptance 未开始。
- **Gate / Evidence**：Operations Backend Gate PASS 不是该 Admin Feature 的端到端验收。
- **下一步**：待 Admin/集成完成后执行 Feature E2E 与验收 Gate。
