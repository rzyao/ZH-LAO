---
status: active
last_updated: 2026-09-02
source: scripts/build_developer_feature_catalog.py
---

# 奖励（Rewards）

> 返回 [全量功能目录](../) ｜ 本领域共 **3** 个功能（Portfolio：`active` 2、`deferred` 1）。

## 功能

> 开发状态由[六层交付状态](../../DOCUMENT_CONTRACT)推导：`completed` 需 Integration 与 Acceptance 均 `verified`；任一层有证据为 `in_progress`；无证据为 `not_started`。

| 功能 | 开发状态 | Portfolio | 分层状态摘要 | 证据条目 | 来源迁移 |
| --- | --- | --- | --- | ---: | --- |
| [会员天数 / POINT / BADGE 等新奖励类型](../advanced-reward-types) | ⚪ not_started | `deferred` | — | 0 | `complete` |
| [奖励计划 / 规则 / 发放监控后台](../reward-operations) | ⚪ not_started | `active` | — | 4 | `complete` |
| [自动 Coin 奖励](../automatic-coin-rewards) | ⚪ not_started | `active` | — | 4 | `complete` |

## 本领域分层状态计数（六层交付层）

| 层 | 状态计数 |
| --- | --- |
| 数据库 | `not_evidenced` 3 |
| Backend | `not_evidenced` 3 |
| Admin | `not_evidenced` 3 |
| Mobile | `not_evidenced` 3 |
| Integration | `not_evidenced` 3 |
| Acceptance | `not_evidenced` 3 |

## 状态说明

- `portfolio_status` 直接来自各页面 front matter；`active` 只表示进入产品组合，不代表实现完成。
- 六层交付状态使用[文档契约](../../DOCUMENT_CONTRACT)定义的受控枚举，默认 `not_evidenced`。
- 分层状态摘要只列出偏离默认值的层；显示 `—` 表示六层全部 `not_evidenced`，尚待独立核验。
