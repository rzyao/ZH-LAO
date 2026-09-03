---
status: active
last_updated: 2026-09-02
source: scripts/build_developer_feature_catalog.py
---

# unassigned

> 返回 [全量功能目录](../) ｜ 本领域共 **4** 个功能（Portfolio：`active` 2、`deferred` 2）。

## 功能

> 开发状态由[六层交付状态](../../DOCUMENT_CONTRACT)推导：`completed` 需 Integration 与 Acceptance 均 `verified`；任一层有证据为 `in_progress`；无证据为 `not_started`。

| 功能 | 开发状态 | Portfolio | 分层状态摘要 | 证据条目 | 来源迁移 |
| --- | --- | --- | --- | ---: | --- |
| [主题设置](../theme-settings) | ⚪ not_started | `active` | — | 1 | `complete` |
| [后台数据总览](../admin-dashboard) | ⚪ not_started | `deferred` | — | 0 | `complete` |
| [界面语言切换](../interface-language) | ⚪ not_started | `active` | — | 1 | `complete` |
| [系统与互动推送通知](../push-notifications) | ⚪ not_started | `deferred` | — | 0 | `complete` |

## 本领域分层状态计数（六层交付层）

| 层 | 状态计数 |
| --- | --- |
| 数据库 | `not_evidenced` 4 |
| Backend | `not_evidenced` 4 |
| Admin | `not_evidenced` 4 |
| Mobile | `not_evidenced` 4 |
| Integration | `not_evidenced` 4 |
| Acceptance | `not_evidenced` 4 |

## 状态说明

- `portfolio_status` 直接来自各页面 front matter；`active` 只表示进入产品组合，不代表实现完成。
- 六层交付状态使用[文档契约](../../DOCUMENT_CONTRACT)定义的受控枚举，默认 `not_evidenced`。
- 分层状态摘要只列出偏离默认值的层；显示 `—` 表示六层全部 `not_evidenced`，尚待独立核验。
