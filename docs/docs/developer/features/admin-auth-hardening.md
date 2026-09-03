---
feature_id: admin-auth-hardening
title: 后台 MFA / 邀请 / 登录失败保护
portfolio_status: deferred
domain:
- operations
- identity
source_migration: complete
last_updated: '2026-09-02'
source_migrated_at: '2026-09-02'
delivery_evidence: []
---

# 后台 MFA / 邀请 / 登录失败保护

<!-- breadcrumb:start -->
> **← 返回** [运营（Operations）](operations/) · [全量功能目录](index.md)
<!-- breadcrumb:end -->

> `portfolio_status` 只表示产品组合归属，不表示实现完成；分层状态词汇与证据补录要求见[文档契约](../DOCUMENT_CONTRACT)。

## 用户价值与功能说明

本能力定义为 **后台 MFA / 邀请 / 登录失败保护**（`admin-auth-hardening`）。本页保留该能力的现有描述；如果现有资料没有明确用户价值，本页不自行补造。

## 使用者或受益者

当前资料没有足够证据来确认具体使用者。本页暂记为：**未明确**。已声明的参与页面：Mobile `未明确`；Admin `未明确`。

## 范围与边界

- 声明的 Domain：`operations`, `identity`
- 声明的 owns contracts：现有资料未明确
- 声明的 dependencies：现有资料未明确
- 详细包含/不包含边界以现有功能资料、Domain authority 和产品文档为准。

## 参与系统

| 系统 | 来源声明 |
| --- | --- | --- |
| Product | `portfolio_status: deferred` |
| Database | 当前资料未声明物理证据 |
| Backend | 当前资料未声明独立实现证据 |
| Admin | 未明确 |
| Mobile | 未明确 |
| Integration | 当前资料未声明独立集成证据 |
| Acceptance | 当前资料未声明 Feature Gate 证据 |

## 分层交付状态

| 层 | 状态 | 解释 |
| --- | --- | --- |
| 产品 | `deferred` | 页面声明的 portfolio 状态；`active` 不表示 implemented |
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

# 后台 MFA / 邀请 / 登录失败保护

## 功能概览

Portfolio Status：`deferred`。

该 Feature 当前仍在延期组合中。Operations V1 canonical 明确不拥有 password / OTP / JWT / session，也没有为 MFA、Operator invitation 或登录失败保护冻结新的 Operations 表、API 或状态机。本页只记录真实边界与下一步，不因 Operations Design/Backend Gate 已 PASS 而提前宣称该 Feature 已设计或实现。

## 与已实现能力的边界

- **登录失败保护（频控）** 子集已在 [admin-login](admin-login) 范围实现：`identity.admin.login` 路径的登录失败频控（`apps/backend/src/modules/identity/application/services/login-rate-limiter.ts`，FR-017，429 `LOGIN_RATE_LIMITED`）与失败安全日志已落地。本页仍保持 `deferred`，不因该子集实现而提前宣告整个 Feature 完成。
- **MFA / 操作员邀请** 仍为延期范围，无实现证据；延续本页记录的边界，不冻结新表、API 或状态机。
