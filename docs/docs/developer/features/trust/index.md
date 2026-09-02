---
status: active
last_updated: 2026-09-02
source: scripts/build_developer_feature_catalog.py
---

# 信任与安全（Trust & Safety）

> 返回 [全量功能目录](../) ｜ 本领域共 **7** 个功能（Portfolio：`active` 5、`pending_decision` 2）。

## 领域导航

[音频（Audio）](../audio/) · [聊天（Chat）](../chat/) · [商业（Commerce）](../commerce/) · [内容（Content）](../content/) · [身份（Identity）](../identity/) · [学习（Learning）](../learning/) · [运营（Operations）](../operations/) · [平台（Platform）](../platform/) · [奖励（Rewards）](../rewards/) · [社交（Social）](../social/) · **信任与安全（Trust & Safety）** · [unassigned](../unassigned/)

## 功能

> 开发状态由[六层交付状态](../../DOCUMENT_CONTRACT)推导：`completed` 需 Integration 与 Acceptance 均 `verified`；任一层有证据为 `in_progress`；无证据为 `not_started`。

| 功能 | 开发状态 | Portfolio | 分层状态摘要 | 证据条目 | 来源迁移 |
| --- | --- | --- | --- | ---: | --- |
| [审核案件 / 证据 / 决定工作台](../moderation-workbench) | ⚪ not_started | `active` | — | 0 | `complete` |
| [平台处罚与能力限制](../enforcement-management) | ⚪ not_started | `active` | — | 0 | `complete` |
| [用户举报提交](../user-reporting) | ⚪ not_started | `active` | — | 0 | `complete` |
| [用户申诉](../user-appeal) | ⚪ not_started | `active` | — | 0 | `complete` |
| [申诉复核后台](../appeal-review) | ⚪ not_started | `active` | — | 0 | `complete` |
| [真人认证审核](../verification-review) | ⚪ not_started | `pending_decision` | — | 0 | `complete` |
| [真人认证提交](../real-person-verification) | ⚪ not_started | `pending_decision` | — | 0 | `complete` |

## 本领域分层状态计数（六层交付层）

| 层 | 状态计数 |
| --- | --- |
| 数据库 | `not_evidenced` 7 |
| Backend | `not_evidenced` 7 |
| Admin | `not_evidenced` 7 |
| Mobile | `not_evidenced` 7 |
| Integration | `not_evidenced` 7 |
| Acceptance | `not_evidenced` 7 |

## 状态说明

- `portfolio_status` 直接来自各页面 front matter；`active` 只表示进入产品组合，不代表实现完成。
- 六层交付状态使用[文档契约](../../DOCUMENT_CONTRACT)定义的受控枚举，默认 `not_evidenced`。
- 分层状态摘要只列出偏离默认值的层；显示 `—` 表示六层全部 `not_evidenced`，尚待独立核验。
