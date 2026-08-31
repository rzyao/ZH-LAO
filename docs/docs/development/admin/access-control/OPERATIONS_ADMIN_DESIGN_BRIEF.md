---
status: ready
role: design_worker
stage_id: OPERATIONS-ADMIN-DESIGN
last_updated: 2026-08-31
---

# Operations Admin 设计 Brief

本 Stage 设计后台 Operator / Role / Permission / Audit 的页面与工作流，并生成实现蓝图；**不写 Admin 业务代码，不修改 Operations 权限语义**。

## Mission

```text
latest main grounding
→ verify ADMIN_FOUNDATION_GATE + OPERATIONS_GATE
→ read Operations RBAC/Audit/API authority
→ inspect Admin Foundation and current routes
→ define IA / pages / operator flows
→ exact permission + API mapping
→ create Execution Brief + Blueprint + tests
→ OPERATIONS_ADMIN_DESIGN_GATE
→ push
→ STOP
```

## Required Outputs

```text
docs/docs/development/admin/access-control/OPERATIONS_ADMIN_EXECUTION_BRIEF.md
docs/docs/development/admin/access-control/OPERATIONS_ADMIN_IMPLEMENTATION_BLUEPRINT.md
docs/docs/development/admin/access-control/OPERATIONS_ADMIN_DESIGN_REPORT.md
```

设计至少覆盖 Operator、Role、Role Assignment、Permission Assignment、Audit Log、Bootstrap/首管理员的可见边界；必须遵守 exact permission key、无 wildcard/deny/role hierarchy、UI Guard 不是安全边界。

完成条件：`OPERATIONS_ADMIN_DESIGN_GATE = PASS`。完成后 push `main` 并 STOP，不开始 Admin Implementation。