---
feature_id: advanced-reward-types
title: 会员天数 / POINT / BADGE 等新奖励类型
portfolio_status: deferred
domain:
- rewards
- commerce
source_migration: complete
last_updated: '2026-09-02'
source_migrated_at: '2026-09-02'
delivery_evidence: []
---

# 会员天数 / POINT / BADGE 等新奖励类型

<!-- breadcrumb:start -->
> **← 返回** [奖励（Rewards）](rewards/) · [全量功能目录](index.md)
<!-- breadcrumb:end -->

> `portfolio_status` 只表示产品组合归属，不表示实现完成；分层状态词汇与证据补录要求见[文档契约](../DOCUMENT_CONTRACT)。

## 用户价值与功能说明

本能力定义为 **会员天数 / POINT / BADGE 等新奖励类型**（`advanced-reward-types`）。本页保留该能力的现有描述；如果现有资料没有明确用户价值，本页不自行补造。

## 使用者或受益者

当前资料没有足够证据来确认具体使用者。本页暂记为：**未明确**。已声明的参与页面：Mobile `未明确`；Admin `未明确`。

## 范围与边界

- 声明的 Domain：`rewards`, `commerce`
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

# 会员天数 / POINT / BADGE 等新奖励类型

## 功能概览

Portfolio Status：`deferred`。

本 Feature 只代表未来扩展奖励类型的开发入口，不表示这些类型已经进入当前 Rewards canonical。当前冻结的 Rewards V1 **只支持 Coin**；`ADR-017` 明确把会员天数、POINT / EXP / BADGE / GIFT / COUPON 等奖励形态延后。

因此本 Feature 不提前设计统一的“新奖励资产模型”，也不假设所有奖励最终都由 Commerce Wallet 承接。未来每种奖励类型都必须先明确事实归属、目标 Domain、交付语义与幂等契约，再决定是否复用现有 Reward Grant / Delivery 模式。
