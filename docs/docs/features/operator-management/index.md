---
feature_id: operator-management
title: 操作员管理
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
    - docs/docs/domains/operations/index.md
    - docs/docs/development/04-operations/OPERATIONS_RBAC_CONTRACTS.md
  backend:
    - docs/docs/development/04-operations/OPERATIONS_IMPLEMENTATION_REPORT.md
    - apps/backend/src/modules/operations/http/routes.ts
    - apps/backend/src/modules/operations/application/services/operations-service.ts
mobile_pages: []
admin_pages:
  - admin-operators
---

# 操作员管理

## 功能概览

Portfolio Status：`active`。

Operations 已冻结并实现 Operator mapping/lifecycle 的 Backend 能力；当前 Feature 仍缺真实 Operations Admin UI 与 UI→API 端到端验收，因此不能把 Backend Gate PASS 等同于 Feature 全量 done。

## 设计

状态：done

- **范围**：管理 `Identity subject -> Operator` 映射、display name、`active | disabled` 生命周期；禁止自助注册、重绑 `auth_subject_id` 与删除 Operator，并保护最后一个 active super-admin。
- **Stage / Artifact**：Operations Domain Design；`domains/operations/index.md`、`OPERATIONS_RBAC_CONTRACTS.md`。
- **Gate / Evidence**：`OPERATIONS_DESIGN_GATE = PASS`，Operator lifecycle 与 Identity boundary 已冻结。
- **下一步**：保持 canonical contract；新增 Operator 语义必须先走 Operations 设计变更，不在 Feature Page 扩展模型。

## Backend

状态：done

- **范围**：列表/详情/创建/修改 display name/disable/enable，active Identity subject 校验，以及每个成功 mutation 的 Operations audit。
- **Stage / Artifact**：Operations Implementation；`routes.ts`、`operations-service.ts`、repository/integration tests。
- **Gate / Evidence**：`OPERATIONS_GATE = PASS`；Implementation Report 将 Operator Management 标记 COMPLETE，PostgreSQL E2E 覆盖创建、禁用与即时权限撤销。
- **下一步**：维持权限、last-super-admin 与并发回归测试；Backend 不等待 Admin UI 才算完成。

## Admin

状态：todo

- **范围**：`admin-operators` 对应的操作员列表、详情、创建、编辑、启用/禁用及权限错误反馈。
- **Stage / Artifact**：Feature 已有关联 Admin page ID，但当前 main 未发现 Operations 业务 UI implementation；Admin Foundation 只提供通用框架/权限骨架。
- **Gate / Evidence**：无 Operator Management Admin completion evidence。
- **下一步**：在 Operations Admin Stage 实现真实页面并接入 `/api/v1/admin/operations/operators*`。

## Mobile

状态：na

- **范围**：内部后台管理能力，不面向 Mobile。
- **Stage / Artifact**：不适用。
- **Gate / Evidence**：不要求 Mobile Gate。
- **下一步**：无。

## 集成

状态：todo

- **范围**：Admin 页面、Operator API、Identity subject lookup、RBAC guards 与成功审计的端到端接线。
- **Stage / Artifact**：Backend E2E 已完成；Admin integration 尚未开始。
- **Gate / Evidence**：现有 Operations E2E 证明 Backend capability，不证明 Admin UI integration。
- **下一步**：Admin 实现后覆盖 create/update/disable/enable、403、Identity inactive 与 last-super-admin 场景。

## 验收

状态：todo

- **范围**：以真实后台操作者完成 Operator 管理闭环并验证审计可追踪性。
- **Stage / Artifact**：Feature acceptance 尚未开始。
- **Gate / Evidence**：Operations Backend Gate 已 PASS，但无 Admin+Backend Feature acceptance evidence。
- **下一步**：待 Admin/集成完成后执行 Feature E2E 与验收 Gate。
