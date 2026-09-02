---
status: active
last_updated: 2026-09-02
source: scripts/build_developer_feature_catalog.py
---

# 身份（Identity）

> 返回 [全量功能目录](../) ｜ 本领域共 **6** 个功能（Portfolio：`active` 5、`deferred` 1）。

## 领域导航

[音频（Audio）](../audio/) · [聊天（Chat）](../chat/) · [商业（Commerce）](../commerce/) · [内容（Content）](../content/) · **身份（Identity）** · [学习（Learning）](../learning/) · [运营（Operations）](../operations/) · [平台（Platform）](../platform/) · [奖励（Rewards）](../rewards/) · [社交（Social）](../social/) · [信任与安全（Trust & Safety）](../trust/) · [unassigned](../unassigned/)

## 功能

> 开发状态由[六层交付状态](../../DOCUMENT_CONTRACT)推导：`completed` 需 Integration 与 Acceptance 均 `verified`；任一层有证据为 `in_progress`；无证据为 `not_started`。

| 功能 | 开发状态 | Portfolio | 分层状态摘要 | 证据条目 | 来源迁移 |
| --- | --- | --- | --- | ---: | --- |
| [游客云同步与注册数据迁移](../guest-cloud-sync) | ⚪ not_started | `deferred` | — | 0 | `complete` |
| [用户登录与会话](../login) | 🟡 in_progress | `active` | 数据库: evidenced; Backend: evidenced; Admin: not_applicable; Mobile: evidenced_limited | 4 | `manual` |
| [用户账户查询与状态管理](../identity-user-admin) | ⚪ not_started | `active` | — | 0 | `complete` |
| [登录设备与会话管理](../login-devices) | ⚪ not_started | `active` | — | 0 | `complete` |
| [账户基础资料与学习方向](../account-profile) | ⚪ not_started | `active` | — | 0 | `complete` |
| [账户禁用 / 关闭与会话撤销](../account-lifecycle) | ⚪ not_started | `active` | — | 0 | `complete` |

## 本领域分层状态计数（六层交付层）

| 层 | 状态计数 |
| --- | --- |
| 数据库 | `evidenced` 1, `not_evidenced` 5 |
| Backend | `evidenced` 1, `not_evidenced` 5 |
| Admin | `not_applicable` 1, `not_evidenced` 5 |
| Mobile | `evidenced_limited` 1, `not_evidenced` 5 |
| Integration | `not_evidenced` 6 |
| Acceptance | `not_evidenced` 6 |

## 状态说明

- `portfolio_status` 直接来自各页面 front matter；`active` 只表示进入产品组合，不代表实现完成。
- 六层交付状态使用[文档契约](../../DOCUMENT_CONTRACT)定义的受控枚举，默认 `not_evidenced`。
- 分层状态摘要只列出偏离默认值的层；显示 `—` 表示六层全部 `not_evidenced`，尚待独立核验。
