---
feature_id: admin-login
title: 后台登录与操作员认证
portfolio_status: active
domain:
- operations
- identity
mobile_pages: []
admin_pages: []
delivery_evidence:
- docs/docs/domains/operations/index.md
- docs/docs/development/04-operations/OPERATIONS_RBAC_CONTRACTS.md
- docs/docs/development/04-operations/OPERATIONS_API.md
- docs/docs/development/04-operations/OPERATIONS_IMPLEMENTATION_REPORT.md
- apps/backend/src/modules/operations/http/routes.ts
- apps/backend/test/integration/operations-e2e.test.ts
---

# 后台登录与操作员认证

## 功能概览

Portfolio Status：`active`。

本 Feature 是 Identity 认证与 Operations Operator 授权边界的交汇点：Identity 负责凭证、OTP、JWT 与会话真实性；Operations 只把已认证的 Identity `subjectId` 解析为 active Operator，并计算角色与精确 Permission。`Operations Backend capability done` 不等于 `Admin 登录 UI done`，也不等于本 Feature 已端到端交付。
