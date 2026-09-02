---
feature_id: social-feed
title: 关注 Feed 与动态浏览
portfolio_status: active
domain:
- social
- identity
- trust
source_migration: complete
last_updated: '2026-09-02'
last_verified_at: '2026-09-02'
delivery_evidence:
- /developer/reference/domains/social/community-content
- /developer/reference/domains/social/database
- /developer/reference/governance/design-register
---

# 关注 Feed 与动态浏览

> 本页记录当前可追溯的产品范围与交付证据；组合状态不等于实现完成。

## 用户价值与功能说明

本能力定义为 **关注 Feed 与动态浏览**（`social-feed`）。本页保留该能力的现有描述；如果现有资料没有明确用户价值，本页不自行补造。

## 使用者或受益者

当前资料没有足够证据来确认具体使用者。本页暂记为：**未明确**。已声明的参与页面：Mobile `未明确`；Admin `未明确`。

## 范围与边界

- 声明的 Domain：`social`, `identity`, `trust`
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

- [/developer/reference/domains/social/community-content](/developer/reference/domains/social/community-content)
- [/developer/reference/domains/social/database](/developer/reference/domains/social/database)
- [/developer/reference/governance/design-register](/developer/reference/governance/design-register)

## 限制、阻塞与下一步

已记录的 `delivery_notes`：

- 当前资料没有声明 delivery_notes。

- 本页默认不把 `active`、Spec、任务清单或页面存在推断为已实现。
- 下一步：由对应 Stage / Feature Gate 补充明确的分层证据，再更新本页生成输入或手工核验页。

## 功能规则与背景

# 关注 Feed 与动态浏览

## 功能概览

Portfolio Status：`active`。

`social-feed` 负责关注 Feed 与动态浏览的端到端交付跟踪。Social 的 Post、关系、Block 与展示资格事实以 [Social 动态](/developer/reference/domains/social/community-content) 和 [Social 数据库](/developer/reference/domains/social/database) 为准；举报事实不属于 Social，`trust.reports` 是全系统唯一 canonical user report fact。

当前真实状态是：Social 内容设计已经冻结，`database/migrations/0700_social.sql` 已包含 Post/Like/Comment 等 Social 数据结构；但 `apps/backend/src/main.ts` 尚未注册 Social Module/API，`apps/mobile/src/features` 也没有 Social Feature 实现。因此本页只将 实际 Stage / Gate 标记为完成，其余实现 实际 Stage / Gate 不提前升级。
