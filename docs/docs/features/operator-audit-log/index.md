---
feature_id: operator-audit-log
title: 后台操作审计查询
portfolio_status: active
domain:
- operations
mobile_pages: []
admin_pages: []
delivery_evidence:
- docs/docs/domains/operations/audit.md
- docs/docs/development/04-operations/OPERATIONS_RBAC_CONTRACTS.md
- docs/docs/development/04-operations/OPERATIONS_IMPLEMENTATION_REPORT.md
- apps/backend/src/modules/operations/http/routes.ts
- apps/backend/src/modules/operations/application/services/operations-service.ts
---

# 后台操作审计查询

## 功能概览

Portfolio Status：`active`。

Operations 已冻结 append-only success audit 契约并实现审计写入与查询 Backend；当前没有 Operations Audit Admin UI 的完成证据，因此 Backend capability 与 Admin/Feature 交付必须分开记录。
