---
feature_id: first-admin-bootstrap
title: 首个管理员 Bootstrap
portfolio_status: active
domain:
  - operations
status:
  design: done
  backend: done
  admin: na
  mobile: na
  integration: na
  acceptance: done
evidence:
  design:
    - docs/docs/domains/operations/audit.md
    - docs/docs/development/04-operations/OPERATIONS_RBAC_CONTRACTS.md
  backend:
    - docs/docs/development/04-operations/OPERATIONS_IMPLEMENTATION_REPORT.md
    - apps/backend/src/modules/operations/application/services/operations-service.ts
  acceptance:
    - docs/docs/development/04-operations/OPERATIONS_IMPLEMENTATION_REPORT.md
    - apps/backend/test/integration/operations-e2e.test.ts
mobile_pages: []
admin_pages: []
---

# 首个管理员 Bootstrap

## 功能概览

Portfolio Status：`active`。

Bootstrap 是一个受控的 one-time CLI/operational initialization capability，不是 Admin 页面。它要求目标 Identity subject 已存在且 active、系统中 Operator 数为 0，并在单一 Operations transaction 内创建/同步 reserved `super_admin`、完整 Permission Catalog、首个 Operator、role assignment 与 bootstrap audit。canonical 明确禁止公开 HTTP bootstrap。

## 设计

状态：done

- **范围**：解决零 Operator 系统的首次初始化；仅 controlled CLI/operational path，禁止 public HTTP、自助注册或绕过 Identity。
- **Stage / Artifact**：Operations Domain Design；`domains/operations/audit.md`、`OPERATIONS_RBAC_CONTRACTS.md`。
- **Gate / Evidence**：`OPERATIONS_DESIGN_GATE = PASS`；zero-operator prerequisite、active Identity prerequisite、super-admin full catalog 与 transactional audit 已冻结。
- **下一步**：保持 one-time/CLI-only contract；任何恢复/重置方案必须另行设计，不能扩大 bootstrap 后门。

## Backend

状态：done

- **范围**：校验 active Identity subject、串行化 bootstrap、拒绝二次初始化、创建/同步 `super_admin` 完整权限、创建首个 Operator、绑定角色并写 success audit。
- **Stage / Artifact**：Operations Implementation；`operations-service.ts::bootstrap()`、repository locks 与 Operations integration/security tests。
- **Gate / Evidence**：`OPERATIONS_GATE = PASS`；Implementation Report 将 Bootstrap、security/race 与 concurrency gate 标记 COMPLETE/PASS，service 实现中包含 `BOOTSTRAP_ALREADY_COMPLETED` 与事务内初始化。
- **下一步**：保持并发/二次 bootstrap/Identity inactive 回归，禁止增加 HTTP backdoor。

## Admin

状态：na

- **范围**：canonical 明确 Bootstrap 不通过 Admin UI 或 public HTTP 暴露。
- **Stage / Artifact**：不适用；Operations API 明确 `Bootstrap has NO HTTP endpoint`。
- **Gate / Evidence**：Admin 页面不是该 Feature 的交付条件。
- **下一步**：无；不得为了“补 Admin Lane”创建 Bootstrap 页面。

## Mobile

状态：na

- **范围**：内部初始化能力，不面向 Mobile。
- **Stage / Artifact**：不适用。
- **Gate / Evidence**：不要求 Mobile Gate。
- **下一步**：无。

## 集成

状态：na

- **范围**：本 Feature 无 Admin/Mobile surface integration Lane；Identity subject validation 与 PostgreSQL transaction 已属于 Backend implementation/verification。
- **Stage / Artifact**：不适用。
- **Gate / Evidence**：不要求额外 UI integration Gate。
- **下一步**：无。

## 验收

状态：done

- **范围**：验证真实 Identity subject 可完成首个 Operator 初始化，并验证重复/并发 bootstrap 被拒绝、super-admin 权限完整且审计存在。
- **Stage / Artifact**：Operations Final Gate；`OPERATIONS_IMPLEMENTATION_REPORT.md` 及 PostgreSQL integration/E2E suites。
- **Gate / Evidence**：`OPERATIONS_GATE = PASS`；Operations focused suites、security/race、concurrency gate 与 E2E 均通过，且报告明确 `OPS-12 Bootstrap = COMPLETE`。
- **下一步**：仅保持 Gate regression；若未来引入 recovery bootstrap，必须作为新设计/验收范围处理。
