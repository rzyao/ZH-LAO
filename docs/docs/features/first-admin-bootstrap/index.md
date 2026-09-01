---
feature_id: first-admin-bootstrap
title: 首个管理员 Bootstrap
portfolio_status: active
domain:
- operations
mobile_pages: []
admin_pages: []
delivery_evidence:
- docs/docs/domains/operations/audit.md
- docs/docs/development/04-operations/OPERATIONS_RBAC_CONTRACTS.md
- docs/docs/development/04-operations/OPERATIONS_IMPLEMENTATION_REPORT.md
- apps/backend/src/modules/operations/application/services/operations-service.ts
- apps/backend/test/integration/operations-e2e.test.ts
---

# 首个管理员 Bootstrap

## 功能概览

Portfolio Status：`active`。

Bootstrap 是一个受控的 one-time CLI/operational initialization capability，不是 Admin 页面。它要求目标 Identity subject 已存在且 active、系统中 Operator 数为 0，并在单一 Operations transaction 内创建/同步 reserved `super_admin`、完整 Permission Catalog、首个 Operator、role assignment 与 bootstrap audit。canonical 明确禁止公开 HTTP bootstrap。
