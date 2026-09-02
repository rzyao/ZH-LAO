---
feature_id: learning-progress
title: 课程与 Lesson 进度
portfolio_status: active
domain:
- learning
- content
- identity
source_migration: complete
last_updated: '2026-09-02'
source_migrated_at: '2026-09-02'
delivery_evidence:
- /developer/reference/evidence/content/CONTENT_DESIGN_AUDIT
- /developer/reference/evidence/learning/LEARNING_DESIGN_AUDIT
---

# 课程与 Lesson 进度

<!-- breadcrumb:start -->
> **← 返回** [学习（Learning）](learning/) · [全量功能目录](index.md)
<!-- breadcrumb:end -->

> `portfolio_status` 只表示产品组合归属，不表示实现完成；分层状态词汇与证据补录要求见[文档契约](../DOCUMENT_CONTRACT)。

## 用户价值与功能说明

本能力定义为 **课程与 Lesson 进度**（`learning-progress`）。本页保留该能力的现有描述；如果现有资料没有明确用户价值，本页不自行补造。

## 使用者或受益者

当前资料没有足够证据来确认具体使用者。本页暂记为：**未明确**。已声明的参与页面：Mobile `未明确`；Admin `未明确`。

## 范围与边界

- 声明的 Domain：`learning`, `content`, `identity`
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

- [/developer/reference/evidence/content/CONTENT_DESIGN_AUDIT](/developer/reference/evidence/content/CONTENT_DESIGN_AUDIT)
- [/developer/reference/evidence/learning/LEARNING_DESIGN_AUDIT](/developer/reference/evidence/learning/LEARNING_DESIGN_AUDIT)

## 限制、阻塞与下一步

已记录的 `delivery_notes`：

- Content runtime read implementation and formal Content Backend Gate are not yet complete; Learning Backend execution remains blocked.

## 功能规则与背景

# 课程与 Lesson 进度

## 功能概览

Portfolio Status：`active`。

`learning-progress` 覆盖认证用户的 Course Progress 与 Lesson Progress current state、resume anchor、完成事实与课程完成重算。Learning 是这些 user-owned progress facts 的 owner；Content 只提供稳定 Course/Lesson/Section UUID、发布结构与 denominator；Identity 只提供 current-user 身份。
