---
feature_id: operator-management
title: 操作员管理
portfolio_status: active
domain:
- operations
mobile_pages: []
admin_pages:
- admin-operators
delivery_evidence:
- docs/docs/domains/operations/index.md
- docs/docs/development/04-operations/OPERATIONS_RBAC_CONTRACTS.md
- docs/docs/development/04-operations/OPERATIONS_IMPLEMENTATION_REPORT.md
- apps/backend/src/modules/operations/http/routes.ts
- apps/backend/src/modules/operations/application/services/operations-service.ts
---

# 操作员管理

## 功能概览

Portfolio Status：`active`。

Operations 已冻结并实现 Operator mapping/lifecycle 的 Backend 能力；当前 Feature 仍缺真实 Operations Admin UI 与 UI→API 端到端验收，因此不能把 Backend Gate PASS 等同于 Feature 全量 done。
