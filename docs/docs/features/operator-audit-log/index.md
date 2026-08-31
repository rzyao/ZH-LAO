---
feature_id: operator-audit-log
title: 后台操作审计查询
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
    - docs/docs/domains/operations/audit.md
    - docs/docs/development/04-operations/OPERATIONS_RBAC_CONTRACTS.md
  backend:
    - docs/docs/development/04-operations/OPERATIONS_IMPLEMENTATION_REPORT.md
    - apps/backend/src/modules/operations/http/routes.ts
    - apps/backend/src/modules/operations/application/services/operations-service.ts
mobile_pages: []
admin_pages: []
---

# 后台操作审计查询

## 功能概览

Portfolio Status：`active`。

Operations 已冻结 append-only success audit 契约并实现审计写入与查询 Backend；当前没有 Operations Audit Admin UI 的完成证据，因此 Backend capability 与 Admin/Feature 交付必须分开记录。

## 设计

状态：done

- **范围**：记录已成功接受的 Operator 管理动作；本地 Operations mutation 与 audit 同事务；失败的认证、授权、校验和业务拒绝不写 success audit；敏感信息不得进入 details。
- **Stage / Artifact**：Operations Domain Design；`domains/operations/audit.md`、`OPERATIONS_RBAC_CONTRACTS.md`。
- **Gate / Evidence**：`OPERATIONS_DESIGN_GATE = PASS`；audit semantics、target logical reference 与敏感信息边界已冻结。
- **下一步**：保持 append-only success-audit contract；跨 Domain audit durability 仍按 canonical 技术债处理，不在本 Feature 偷换为新模型。

## Backend

状态：done

- **范围**：成功 mutation audit persistence、审计列表/详情查询，以及 `operations.audit_logs.read` 精确权限保护。
- **Stage / Artifact**：Operations Implementation；`operations-service.ts`、HTTP routes、repositories 与 integration tests。
- **Gate / Evidence**：`OPERATIONS_GATE = PASS`；Operations E2E 已验证 create/assign/role-status 等 mutation 产生可查询审计记录。
- **下一步**：维持敏感字段拒绝、事务一致性与查询权限回归；跨 Domain durability 作为已接受非阻塞技术债继续跟踪。

## Admin

状态：todo

- **范围**：后台审计列表、详情、筛选/分页及权限拒绝反馈。
- **Stage / Artifact**：当前 main 未发现 Operations audit 业务 UI implementation。
- **Gate / Evidence**：无 Audit Admin Gate / UI E2E evidence。
- **下一步**：Operations Admin Stage 接入 `/api/v1/admin/operations/audit-logs*`，以 API contract 支持的真实过滤项为准。

## Mobile

状态：na

- **范围**：内部后台审计查询，不面向 Mobile。
- **Stage / Artifact**：不适用。
- **Gate / Evidence**：不要求 Mobile Gate。
- **下一步**：无。

## 集成

状态：todo

- **范围**：Admin 审计查询 UI 与 protected audit APIs、RBAC 和分页/过滤错误处理的完整接线。
- **Stage / Artifact**：Backend audit integration 已完成；Admin integration 未开始。
- **Gate / Evidence**：无 Admin+Backend audit-query E2E evidence。
- **下一步**：Admin 实现后覆盖正常查询、无权限、分页/过滤与审计详情场景。

## 验收

状态：todo

- **范围**：真实 Operator 能在后台按权限查询管理操作轨迹，并确认 UI 展示与 canonical audit fact 一致。
- **Stage / Artifact**：Feature acceptance 未开始。
- **Gate / Evidence**：Backend Gate PASS 不等于 Audit Admin Feature 已端到端验收。
- **下一步**：待 Admin/集成完成后执行 Feature E2E 与验收 Gate。
