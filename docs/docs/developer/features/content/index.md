---
status: active
last_updated: 2026-09-02
source: scripts/build_developer_feature_catalog.py
---

# 内容（Content）

> 返回 [全量功能目录](../) ｜ 本领域共 **7** 个功能（Portfolio：`active` 7）。

## 功能

> 开发状态由[六层交付状态](../../DOCUMENT_CONTRACT)推导：`completed` 需 Integration 与 Acceptance 均 `verified`；任一层有证据为 `in_progress`；无证据为 `not_started`。

| 功能 | 开发状态 | Portfolio | 分层状态摘要 | 证据条目 | 来源迁移 |
| --- | --- | --- | --- | ---: | --- |
| [内容 Revision 与发布治理](../content-revision-publishing) | ⚪ not_started | `active` | — | 1 | `complete` |
| [用户首页与双侧入口](../mobile-home) | ⚪ not_started | `active` | — | 0 | `complete` |
| [知识内容管理](../knowledge-content-management) | ⚪ not_started | `active` | — | 1 | `complete` |
| [练习与题库管理](../practice-content-management) | ⚪ not_started | `active` | — | 1 | `complete` |
| [老挝语字母管理](../lao-alphabet-management) | 🟡 in_progress | `active` | 数据库: evidenced_limited; Backend: evidenced_limited; Admin: evidenced; Mobile: evidenced | 4 | `manual` |
| [词典内容管理](../dictionary-content-management) | ⚪ not_started | `active` | — | 1 | `complete` |
| [课程编排与发布](../curriculum-management) | ⚪ not_started | `active` | — | 1 | `complete` |

## 本领域分层状态计数（六层交付层）

| 层 | 状态计数 |
| --- | --- |
| 数据库 | `evidenced_limited` 1, `not_evidenced` 6 |
| Backend | `evidenced_limited` 1, `not_evidenced` 6 |
| Admin | `evidenced` 1, `not_evidenced` 6 |
| Mobile | `evidenced` 1, `not_evidenced` 6 |
| Integration | `not_evidenced` 7 |
| Acceptance | `not_evidenced` 7 |

## 状态说明

- `portfolio_status` 直接来自各页面 front matter；`active` 只表示进入产品组合，不代表实现完成。
- 六层交付状态使用[文档契约](../../DOCUMENT_CONTRACT)定义的受控枚举，默认 `not_evidenced`。
- 分层状态摘要只列出偏离默认值的层；显示 `—` 表示六层全部 `not_evidenced`，尚待独立核验。
