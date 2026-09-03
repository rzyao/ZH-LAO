---
status: active
last_updated: 2026-09-02
source: scripts/build_developer_feature_catalog.py
---

# 运营（Operations）

> 返回 [全量功能目录](../) ｜ 本领域共 **7** 个功能（Portfolio：`active` 6、`deferred` 1）。

## 功能

> 开发状态由[六层交付状态](../../DOCUMENT_CONTRACT)推导：`completed` 需 Integration 与 Acceptance 均 `verified`；任一层有证据为 `in_progress`；无证据为 `not_started`。

| 功能 | 开发状态 | Portfolio | 分层状态摘要 | 证据条目 | 来源迁移 |
| --- | --- | --- | --- | ---: | --- |
| [后台 MFA / 邀请 / 登录失败保护](../admin-auth-hardening) | ⚪ not_started | `deferred` | — | 0 | `complete` |
| [后台操作审计查询](../operator-audit-log) | ⚪ not_started | `active` | — | 5 | `complete` |
| [后台登录与操作员认证](../admin-login) | 🟢 completed | `active` | 数据库: evidenced; Backend: verified; Admin: verified; Mobile: not_applicable; Integration: verified; Acceptance: verified | 15 | `complete` |
| [操作员管理](../operator-management) | ⚪ not_started | `active` | — | 5 | `complete` |
| [角色权限分配](../permission-assignment) | ⚪ not_started | `active` | — | 5 | `complete` |
| [角色管理](../role-management) | ⚪ not_started | `active` | — | 5 | `complete` |
| [首个管理员 Bootstrap](../first-admin-bootstrap) | ⚪ not_started | `active` | — | 5 | `complete` |

## 本领域分层状态计数（六层交付层）

| 层 | 状态计数 |
| --- | --- |
| 数据库 | `evidenced` 1, `not_evidenced` 6 |
| Backend | `not_evidenced` 6, `verified` 1 |
| Admin | `not_evidenced` 6, `verified` 1 |
| Mobile | `not_applicable` 1, `not_evidenced` 6 |
| Integration | `not_evidenced` 6, `verified` 1 |
| Acceptance | `not_evidenced` 6, `verified` 1 |

## 状态说明

- `portfolio_status` 直接来自各页面 front matter；`active` 只表示进入产品组合，不代表实现完成。
- 六层交付状态使用[文档契约](../../DOCUMENT_CONTRACT)定义的受控枚举，默认 `not_evidenced`。
- 分层状态摘要只列出偏离默认值的层；显示 `—` 表示六层全部 `not_evidenced`，尚待独立核验。
