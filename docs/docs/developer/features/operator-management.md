---
feature_id: operator-management
title: 操作员管理
portfolio_status: active
domain:
- operations
source_migration: complete
last_updated: '2026-09-02'
last_verified_at: '2026-09-02'
delivery_evidence:
- docs/docs/developer/reference/domains/operations/index.md
- docs/docs/developer/reference/contracts/operations/OPERATIONS_RBAC_CONTRACTS
- docs/docs/developer/reference/evidence/operations/OPERATIONS_IMPLEMENTATION_REPORT
- apps/backend/src/modules/operations/http/routes.ts
- apps/backend/src/modules/operations/application/services/operations-service.ts
---

# 操作员管理

> 本页记录当前可追溯的产品范围与交付证据；组合状态不等于实现完成。

## 用户价值与功能说明

本能力定义为 **操作员管理**（`operator-management`）。本页保留该能力的现有描述；如果现有资料没有明确用户价值，本页不自行补造。

## 使用者或受益者

当前资料没有足够证据来确认具体使用者。本页暂记为：**未明确**。已声明的参与页面：Mobile `未明确`；Admin ``admin-operators``。

## 范围与边界

- 声明的 Domain：`operations`
- 声明的 owns contracts：现有资料未明确
- 声明的 dependencies：现有资料未明确
- 详细包含/不包含边界以现有功能资料、Domain authority 和产品文档为准。

## 参与系统

| 系统 | 来源声明 | 本页判断 |
| --- | --- | --- |
| Product | `portfolio_status: active` | 产品组合状态，不等于实现完成 |
| Database | 当前资料未声明物理证据 | `not evidenced` |
| Backend | 当前资料未声明独立实现证据 | `not evidenced` |
| Admin | `admin-operators` | `not evidenced` |
| Mobile | 未明确 | `not evidenced` |
| Integration | 当前资料未声明独立集成证据 | `not evidenced` |
| Acceptance | 当前资料未声明 Feature Gate 证据 | `not evidenced` |

## 分层交付状态

| 层 | 状态 | 解释 |
| --- | --- | --- |
| 产品 | `active` | 页面声明的 portfolio 状态；`active` 不表示 implemented |
| 数据库 | `not evidenced` | 本页没有从 Feature Page 推断数据库完成 |
| Backend | `not evidenced` | 需要代码、测试、Gate 或 Report 的明确证据 |
| Admin | `not evidenced` | 需要真实页面、契约和验证证据 |
| Mobile | `not evidenced` | 需要真实页面、契约和验证证据 |
| Integration | `not evidenced` | 需要跨层真实集成证据 |
| Acceptance | `not evidenced` | 需要 Feature Gate / E2E / 验收证据 |

## 证据

已记录的 `delivery_evidence` 如下；路径已尽量转为可点击的当前文档路由，裸 Stage/Decision ID 仍保留为标识：

- [docs/docs/developer/reference/domains/operations/index.md](/developer/reference/domains/operations/)
- [docs/docs/developer/reference/contracts/operations/OPERATIONS_RBAC_CONTRACTS](/developer/reference/contracts/operations/OPERATIONS_RBAC_CONTRACTS)
- [docs/docs/developer/reference/evidence/operations/OPERATIONS_IMPLEMENTATION_REPORT](/developer/reference/evidence/operations/OPERATIONS_IMPLEMENTATION_REPORT)
- `apps/backend/src/modules/operations/http/routes.ts`
- `apps/backend/src/modules/operations/application/services/operations-service.ts`

## 限制、阻塞与下一步

已记录的 `delivery_notes`：

- 当前资料没有声明 delivery_notes。

- 本页默认不把 `active`、Spec、任务清单或页面存在推断为已实现。
- 下一步：由对应 Stage / Feature Gate 补充明确的分层证据，再更新本页生成输入或手工核验页。

## 功能规则与背景

# 操作员管理

## 功能概览

Portfolio Status：`active`。

Operations 已冻结并实现 Operator mapping/lifecycle 的 Backend 能力；当前 Feature 仍缺真实 Operations Admin UI 与 UI→API 端到端验收，因此不能把 Backend Gate PASS 等同于 Feature 全量 done。
