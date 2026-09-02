---
feature_id: chat-voice-message
title: 语音消息
portfolio_status: pending_decision
domain:
- chat
- identity
- social
- learning
source_migration: complete
last_updated: '2026-09-02'
source_migrated_at: '2026-09-02'
delivery_evidence: []
---

# 语音消息

<!-- breadcrumb:start -->
> **← 返回** [聊天（Chat）](chat/) · [全量功能目录](index.md)
<!-- breadcrumb:end -->

> `portfolio_status` 只表示产品组合归属，不表示实现完成；分层状态词汇与证据补录要求见[文档契约](../DOCUMENT_CONTRACT)。

## 用户价值与功能说明

本能力定义为 **语音消息**（`chat-voice-message`）。本页保留该能力的现有描述；如果现有资料没有明确用户价值，本页不自行补造。

## 使用者或受益者

当前资料没有足够证据来确认具体使用者。本页暂记为：**未明确**。已声明的参与页面：Mobile `未明确`；Admin `未明确`。

## 范围与边界

- 声明的 Domain：`chat`, `identity`, `social`, `learning`
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

- CHAT_SCOPE_DECISION

## 功能规则与背景

# 语音消息

## 功能概览

Portfolio Status：`pending_decision`。

当前 Chat canonical 只定义 `text` / `image` 两种 MessageType、7 张业务表，并明确把 Voice Message 排除在当前模型之外；[未决与延期事项](/developer/reference/governance/open-questions.md)同时记录产品定位中存在语音能力、但 Chat 首期数据库只到 TEXT / IMAGE 的范围冲突。因此该 Feature 不是“缺一张表”的实现任务，而是 `CHAT_SCOPE_DECISION` 尚未完成。

当前禁止通过补 `voice` MessageType、语音 subtype 表或临时 API 来绕过裁决。若未来进入正式范围，必须先更新 canonical Chat design，再进入各执行 实际 Stage / Gate。

NEEDS_DECISION：`CHAT_SCOPE_DECISION`——确认语音消息是否进入当前产品组合；若进入，再由 canonical 设计明确 Chat 与 Media / Asset、Learning 的职责边界，本文档不代替该裁决。
