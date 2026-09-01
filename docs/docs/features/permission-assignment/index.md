---
feature_id: permission-assignment
title: 角色权限分配
portfolio_status: active
domain:
- operations
mobile_pages: []
admin_pages: []
delivery_evidence:
- docs/docs/domains/operations/rbac.md
- docs/docs/development/04-operations/OPERATIONS_RBAC_CONTRACTS.md
- docs/docs/development/04-operations/OPERATIONS_IMPLEMENTATION_REPORT.md
- apps/backend/src/modules/operations/public/permissions.ts
- apps/backend/src/modules/operations/application/services/operations-service.ts
---

# 角色权限分配

## 功能概览

Portfolio Status：`active`。

该 Feature 的 canonical truth 是 code-level exact Permission Catalog + Role 完整权限集合替换；数据库只保存 assignment，不存在 permission dictionary table。Backend 已完成，但尚无 Operations Admin 权限配置 UI 与 UI 端到端验收。
