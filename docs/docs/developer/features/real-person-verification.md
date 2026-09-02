---
feature_id: real-person-verification
title: 真人认证提交
portfolio_status: pending_decision
domain:
- trust
- identity
- social
source_migration: complete
last_updated: '2026-09-02'
source_migrated_at: '2026-09-02'
delivery_evidence: []
---

# 真人认证提交

<!-- breadcrumb:start -->
> **← 返回** [信任与安全（Trust & Safety）](trust/) · [全量功能目录](index.md)
<!-- breadcrumb:end -->

> `portfolio_status` 只表示产品组合归属，不表示实现完成；分层状态词汇与证据补录要求见[文档契约](../DOCUMENT_CONTRACT)。

## 用户价值与功能说明

本能力定义为 **真人认证提交**（`real-person-verification`）。本页保留该能力的现有描述；如果现有资料没有明确用户价值，本页不自行补造。

## 使用者或受益者

当前资料没有足够证据来确认具体使用者。本页暂记为：**未明确**。已声明的参与页面：Mobile `未明确`；Admin `未明确`。

## 范围与边界

- 声明的 Domain：`trust`, `identity`, `social`
- 声明的 owns contracts：现有资料未明确
- 声明的 dependencies：现有资料未明确
- 详细包含/不包含边界以现有功能资料、Domain authority 和产品文档为准。

## 参与系统

| 系统 | 来源声明 |
| --- | --- | --- |
| Product | `portfolio_status: pending_decision` |
| Database | 当前资料未声明物理证据 |
| Backend | 当前资料未声明独立实现证据 |
| Admin | 未明确 |
| Mobile | 未明确 |
| Integration | 当前资料未声明独立集成证据 |
| Acceptance | 当前资料未声明 Feature Gate 证据 |

## 分层交付状态

| 层 | 状态 | 解释 |
| --- | --- | --- |
| 产品 | `pending_decision` | 页面声明的 portfolio 状态；`active` 不表示 implemented |
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

- TRUST_VERIFICATION_DESIGN

## 功能规则与背景

# 真人认证提交

## 功能概览

Portfolio Status：`pending_decision`。

当前仓库只冻结了真人认证的**跨域责任边界**：Trust & Safety 负责审核认证材料并产生 verification result；Identity 继续拥有用户/根账户状态；Social 只能消费明确的认证结果用于资格判断。真人认证的详细 Table / State Machine / API / Media Workflow 尚未冻结。

本 Feature 不得自行把真人认证映射为 `Report → Moderation Case → Evidence → Decision → Enforcement → Appeal` 六事实链，也不得复用其中任何表来“临时实现”认证。
