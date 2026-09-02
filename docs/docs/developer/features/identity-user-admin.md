---
feature_id: identity-user-admin
title: 用户账户查询与状态管理
portfolio_status: active
domain:
- identity
- operations
source_migration: complete
last_updated: '2026-09-02'
source_migrated_at: '2026-09-02'
delivery_evidence: []
---

# 用户账户查询与状态管理

> `portfolio_status` 只表示产品组合归属，不表示实现完成；分层状态词汇与证据补录要求见[文档契约](../DOCUMENT_CONTRACT)。

## 用户价值与功能说明

本能力定义为 **用户账户查询与状态管理**（`identity-user-admin`）。本页保留该能力的现有描述；如果现有资料没有明确用户价值，本页不自行补造。

## 使用者或受益者

当前资料没有足够证据来确认具体使用者。本页暂记为：**未明确**。已声明的参与页面：Mobile `未明确`；Admin `未明确`。

## 范围与边界

- 声明的 Domain：`identity`, `operations`
- 声明的 owns contracts：现有资料未明确
- 声明的 dependencies：现有资料未明确
- 详细包含/不包含边界以现有功能资料、Domain authority 和产品文档为准。

## 参与系统

| 系统 | 来源声明 |
| --- | --- | --- |
| Product | `portfolio_status: active` |
| Database | 当前资料未声明物理证据 |
| Backend | 当前资料未声明独立实现证据 |
| Admin | 未明确 |
| Mobile | 未明确 |
| Integration | 当前资料未声明独立集成证据 |
| Acceptance | 当前资料未声明 Feature Gate 证据 |

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

已声明的 `delivery_evidence`：

- 本页尚无可引用的交付证据；补录要求见[文档契约](../DOCUMENT_CONTRACT)。

## 限制、阻塞与下一步

已记录的 `delivery_notes`：

- 本页尚无记录的交付备注。

## 功能规则与背景

# 用户账户查询与状态管理

## 功能概览

本 Feature 面向 Operator/Admin 对普通用户 Identity 账户进行查询，并在未来正式设计允许的范围内执行状态管理。它横跨 Identity 与 Operations：Identity 拥有用户身份事实和账户状态，Operations 拥有后台认证、RBAC、权限与审计控制面。

当前仓库只有 Identity 的窄 public query contract，以及 Operations 对“Operator 自身/角色/权限/审计”的冻结 API；不存在普通用户账户搜索、详情或状态管理的正式 Admin API/Page。因此不能把 Operations Domain 已完成或 Identity 内部 `changeStatus()` 误写为本 Feature 已交付。
