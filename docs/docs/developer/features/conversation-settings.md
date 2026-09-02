---
feature_id: conversation-settings
title: 置顶 / 免打扰 / 隐藏 / 清空历史
portfolio_status: active
domain:
- chat
- identity
- social
source_migration: complete
last_updated: '2026-09-02'
last_verified_at: '2026-09-02'
delivery_evidence:
- /developer/reference/domains/chat/conversation
- /developer/reference/adr/ADR-011-chat-conversation-identity-and-direct-uniqueness
- /developer/reference/adr/ADR-013-read-state-as-cursor-not-receipt-table
---

# 置顶 / 免打扰 / 隐藏 / 清空历史

> 本页记录当前可追溯的产品范围与交付证据；组合状态不等于实现完成。

## 用户价值与功能说明

本能力定义为 **置顶 / 免打扰 / 隐藏 / 清空历史**（`conversation-settings`）。本页保留该能力的现有描述；如果现有资料没有明确用户价值，本页不自行补造。

## 使用者或受益者

当前资料没有足够证据来确认具体使用者。本页暂记为：**未明确**。已声明的参与页面：Mobile `未明确`；Admin `未明确`。

## 范围与边界

- 声明的 Domain：`chat`, `identity`, `social`
- 声明的 owns contracts：现有资料未明确
- 声明的 dependencies：现有资料未明确
- 详细包含/不包含边界以现有功能资料、Domain authority 和产品文档为准。

## 参与系统

| 系统 | 来源声明 | 本页判断 |
| --- | --- | --- |
| Product | `portfolio_status: active` | 产品组合状态，不等于实现完成 |
| Database | 当前资料未声明物理证据 | `not evidenced` |
| Backend | 当前资料未声明独立实现证据 | `not evidenced` |
| Admin | 未明确 | `not evidenced` |
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

- [/developer/reference/domains/chat/conversation](/developer/reference/domains/chat/conversation)
- [/developer/reference/adr/ADR-011-chat-conversation-identity-and-direct-uniqueness](/developer/reference/adr/ADR-011-chat-conversation-identity-and-direct-uniqueness)
- [/developer/reference/adr/ADR-013-read-state-as-cursor-not-receipt-table](/developer/reference/adr/ADR-013-read-state-as-cursor-not-receipt-table)

## 限制、阻塞与下一步

已记录的 `delivery_notes`：

- 当前资料没有声明 delivery_notes。

- 本页默认不把 `active`、Spec、任务清单或页面存在推断为已实现。
- 下一步：由对应 Stage / Feature Gate 补充明确的分层证据，再更新本页生成输入或手工核验页。

## 功能规则与背景

# 置顶 / 免打扰 / 隐藏 / 清空历史

## 功能概览

Portfolio Status：`active`。

本 Feature 的四类个人会话操作全部落在同一 canonical 模型 `chat_conversation_user_state`：`is_pinned + pinned_at` 表示置顶，`is_muted` 表示免打扰，`hidden_at` 表示仅对当前用户隐藏会话，`cleared_before_seq` 表示仅对当前用户清空指定水位之前的历史。它们都不会删除共享 Conversation 或 Message 事实。
