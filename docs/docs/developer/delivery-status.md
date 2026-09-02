---
status: active
last_updated: 2026-09-02
---

# 交付状态

本页是面向人的状态阅读入口，不建立第二套状态事实源。功能级交付状态以各 Feature Page 的分层证据和 `docs/docs/developer/feature-catalog.json` 为准；本页只做聚合摘要。

## 功能分层证据现状

当前 103 个 Feature detail 页面按人工分层核验进度分为两类：

- **已完成人工分层核验：2 页** —— [用户登录与会话](features/login)、[老挝语字母管理](features/lao-alphabet-management)。两页在 Backend、Mobile 等层已有迁移时代码与测试证据，但 Integration 与 Acceptance 均为 `not_evidenced`，尚不能宣称任一功能端到端可用。
- **尚未核验：101 页** —— 分层状态默认 `not_evidenced`。页面存在、`portfolio_status: active` 或 Spec Kit 工件存在，都不构成实现证据。

逐页分层摘要见[功能目录](features/)；机器可读清单位于 `feature-catalog.json`，其 `layer_status_counts` 是分层状态的权威计数。

## 读分层状态的规则

- 分层状态使用[文档契约](DOCUMENT_CONTRACT)定义的受控词汇：`not_evidenced`、`evidenced`、`evidenced_limited`、`not_applicable`、`verified`。
- 每一层是独立断点：Backend 有证据不推出 Admin、Mobile 或 Integration 有证据；`verified` 只覆盖被核验的层。
- 分层状态描述代码/测试证据的存量，不替代 Feature Gate 与产品验收结论。

## 迁移时阶段快照

> 下表是迁移时（2026-09-02）对基础设施与阶段性 Gate 的核验快照，只作历史背景。它描述的是「阶段/基础设施完成」，不等于该领域内的用户功能已可用；按功能逐层核验请以上方功能分层证据为准。

| 区域 | 迁移时快照 | 证据入口 |
| --- | --- | --- |
| PostgreSQL Baseline | `COMPLETE` / `PASS` | [数据库架构规范](/developer/reference/architecture/data/postgresql)与仓库 `database/README.md` |
| Application Foundation | `COMPLETE` / `PASS` | [迁移时交付基线](evidence/delivery-baseline) |
| Admin Foundation | `COMPLETE` / `PASS` | [迁移时交付基线](evidence/delivery-baseline) |
| Mobile Foundation | `COMPLETE` / `PASS` | [迁移时交付基线](evidence/delivery-baseline) |
| Identity（阶段） | `COMPLETE` / `PASS` | [Identity API 契约](reference/contracts/identity/IDENTITY_API.md)与[迁移时交付基线](evidence/delivery-baseline) |
| Platform（阶段） | `COMPLETE` / `PASS` | [Platform 设计证据](reference/evidence/platform/PLATFORM_DESIGN_AUDIT.md)与[迁移时交付基线](evidence/delivery-baseline) |
| Operations（阶段） | `COMPLETE` / `PASS` | [Operations 实施证据](reference/evidence/operations/OPERATIONS_IMPLEMENTATION_REPORT.md)与[迁移时交付基线](evidence/delivery-baseline) |

阶段 `COMPLETE` 与功能分层证据的张力以具体 Feature Page 为准：例如 Identity 阶段 `COMPLETE`，但 Identity 的 6 个功能页中目前仅[登录](features/login)完成人工核验。

## 来源冲突记录

**迁移时来源冲突（2026-09-02）**：核验基线 `8f3237e` 已包含 Lao Alphabet 的 Backend、Admin、Mobile 实现，而退役前的 `DEVELOPMENT_PROGRESS.md`（`last_updated: 2026-09-02`）和 `NEXT_ACTIONS.md`（`source_head: 8b433866...`）仍把 Content 写成未开始/准备中。本页不把旧看板当作当前事实，也不把局部字母实现扩大为 Content Domain 完成；完整记录见[迁移时交付基线](evidence/delivery-baseline)。

## 状态入口

- [功能总览](features/)
- [当前开发方式](development-workflow)
- [迁移时交付基线](evidence/delivery-baseline)
- [阶段历史](evidence/history)
- [未决事项](/developer/reference/governance/open-questions)

旧看板中的 `CONTENT-BACKEND-PREP` 只代表其记录时的调度快照；它已随旧实施树退役，不能启动或阻塞新的实现。
