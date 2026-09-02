---
feature_id: chat-recall
title: 消息撤回
portfolio_status: active
domain:
- chat
- identity
- social
source_migration: complete
last_updated: '2026-09-02'
source_migrated_at: '2026-09-02'
delivery_evidence: []
---

# 消息撤回

<!-- breadcrumb:start -->
> **← 返回** [聊天（Chat）](chat/) · [全量功能目录](index.md)
<!-- breadcrumb:end -->

> `portfolio_status` 只表示产品组合归属，不表示实现完成；分层状态词汇与证据补录要求见[文档契约](../DOCUMENT_CONTRACT)。

## 用户价值与功能说明

本能力定义为 **消息撤回**（`chat-recall`）。本页保留该能力的现有描述；如果现有资料没有明确用户价值，本页不自行补造。

## 使用者或受益者

当前资料没有足够证据来确认具体使用者。本页暂记为：**未明确**。已声明的参与页面：Mobile `未明确`；Admin `未明确`。

## 范围与边界

- 声明的 Domain：`chat`, `identity`, `social`
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

- 撤回已冻结为 chat_message 自身的 normal/recalled 生命周期；公共 recallMessage API 与错误契约仍未形成 Feature 级 Design Gate。

## 功能规则与背景

# 消息撤回

## 功能概览

Portfolio Status：`active`。

`chat-recall` 负责发送者撤回自己已经发送的消息。当前 canonical 不创建 `chat_message_recall` 实体或表，也不 DELETE 消息：撤回只把 `chat_message.status` 从 `normal` 改为 `recalled` 并写入 `recalled_at`，原始 `chat_message_text` / `chat_message_image` subtype 保留用于治理、审计与纠纷取证。

撤回最后一条消息不会回退 `chat_conversation.last_message_id`；客户端根据消息生命周期状态展示“消息已撤回”，而不是把数据库原文覆盖成提示文本。
