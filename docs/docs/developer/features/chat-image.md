---
feature_id: chat-image
title: 图片消息
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

# 图片消息

> `portfolio_status` 只表示产品组合归属，不表示实现完成；分层状态词汇与证据补录要求见[文档契约](../DOCUMENT_CONTRACT)。

## 用户价值与功能说明

本能力定义为 **图片消息**（`chat-image`）。本页保留该能力的现有描述；如果现有资料没有明确用户价值，本页不自行补造。

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

- IMAGE subtype 与 asset_id 引用语义已冻结；上传资产校验及公共 API 请求响应、错误契约仍未形成 Feature 级 Design Gate。

## 功能规则与背景

# 图片消息

## 功能概览

Portfolio Status：`active`。

`chat-image` 负责把已经由统一 Media / Asset 能力准备好的图片资产作为 Chat 消息发送。当前 canonical 使用 `chat_message.type = 'image'` 与 `chat_message_image` subtype；Chat 只保存 `asset_id` 和展示顺序，不保存对象存储 URL、MIME、宽高、文件大小或 checksum。

一条 IMAGE message 可以包含多张图片，以 `(message_id, position)` 表达顺序；当前不支持图片 caption，也不把文字和图片混成新的消息 subtype。
