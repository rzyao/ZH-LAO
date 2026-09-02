---
feature_id: chat-speech-to-text
title: 语音转文字
portfolio_status: pending_decision
domain:
- chat
- identity
- social
- learning
source_migration: complete
last_updated: '2026-09-02'
last_verified_at: '2026-09-02'
delivery_evidence: []
---

# 语音转文字

> 本页记录当前可追溯的产品范围与交付证据；组合状态不等于实现完成。

## 用户价值与功能说明

本能力定义为 **语音转文字**（`chat-speech-to-text`）。本页保留该能力的现有描述；如果现有资料没有明确用户价值，本页不自行补造。

## 使用者或受益者

当前资料没有足够证据来确认具体使用者。本页暂记为：**未明确**。已声明的参与页面：Mobile `未明确`；Admin `未明确`。

## 范围与边界

- 声明的 Domain：`chat`, `identity`, `social`, `learning`
- 声明的 owns contracts：现有资料未明确
- 声明的 dependencies：现有资料未明确
- 详细包含/不包含边界以现有功能资料、Domain authority 和产品文档为准。

## 参与系统

| 系统 | 来源声明 | 本页判断 |
| --- | --- | --- |
| Product | `portfolio_status: pending_decision` | 产品组合状态，不等于实现完成 |
| Database | 当前资料未声明物理证据 | `not evidenced` |
| Backend | 当前资料未声明独立实现证据 | `not evidenced` |
| Admin | 未明确 | `not evidenced` |
| Mobile | 未明确 | `not evidenced` |
| Integration | 当前资料未声明独立集成证据 | `not evidenced` |
| Acceptance | 当前资料未声明 Feature Gate 证据 | `not evidenced` |

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

已记录的 `delivery_evidence` 如下；路径已尽量转为可点击的当前文档路由，裸 Stage/Decision ID 仍保留为标识：

- 当前资料没有声明 delivery_evidence。

## 限制、阻塞与下一步

已记录的 `delivery_notes`：

- CHAT_SCOPE_DECISION

- 本页默认不把 `active`、Spec、任务清单或页面存在推断为已实现。
- 下一步：由对应 Stage / Feature Gate 补充明确的分层证据，再更新本页生成输入或手工核验页。

## 功能规则与背景

# 语音转文字

## 功能概览

Portfolio Status：`pending_decision`。

[未决与延期事项](/developer/reference/governance/open-questions.md)把“语音转文字”与语音消息、聊天翻译一起列入 D-056：产品定位存在这些能力，但当前 Chat 首期数据库只到 TEXT / IMAGE，需要主会话确认范围。与此同时，[消息模型](/developer/reference/domains/chat/message.md)当前只有 `text` / `image` MessageType，没有 `voice`、转写 subtype 或转写结果字段。

因此本 Feature 当前不是可直接实现的 Backend/Mobile 任务，也不能通过给 Chat 消息增加 transcription 字段来绕过裁决。语音转文字最终属于消息持久事实、派生能力还是其它领域能力，均须由 canonical 设计正式决定。

NEEDS_DECISION：`CHAT_SCOPE_DECISION`——确认语音转文字是否进入当前产品组合，并明确它与语音消息、Chat 原始消息事实及 Learning 能力的职责边界；本文档不预判结果存储方式或 API。
