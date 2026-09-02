---
feature_id: guest-cloud-sync
title: 游客云同步与注册数据迁移
portfolio_status: deferred
domain:
- identity
source_migration: complete
last_updated: '2026-09-02'
source_migrated_at: '2026-09-02'
delivery_evidence: []
---

# 游客云同步与注册数据迁移

> `portfolio_status` 只表示产品组合归属，不表示实现完成；分层状态词汇与证据补录要求见[文档契约](../DOCUMENT_CONTRACT)。

## 用户价值与功能说明

本能力定义为 **游客云同步与注册数据迁移**（`guest-cloud-sync`）。本页保留该能力的现有描述；如果现有资料没有明确用户价值，本页不自行补造。

## 使用者或受益者

当前资料没有足够证据来确认具体使用者。本页暂记为：**未明确**。已声明的参与页面：Mobile `未明确`；Admin `未明确`。

## 范围与边界

- 声明的 Domain：`identity`
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

# 游客云同步与注册数据迁移

## 功能概览

本 Feature 的 canonical title 保持“游客云同步与注册数据迁移”，是否当前推进由独立的 `portfolio_status: deferred` 表达，不把“延期”写回标题或 实际 Stage / Gate。

Identity 当前允许未登录客户端携带 `installation_id`，并在注册/登录时绑定设备；但 canonical design、冻结 API 与最终审计都把服务端 `GuestDataMigration` 留在 deferred/not-supported 边界。设备绑定 **不等于** 游客云数据迁移，也没有证据表明游客学习/业务数据已在注册后自动合并到正式用户。
