---
status: active
last_updated: 2026-09-02
source: scripts/build_developer_feature_catalog.py
---

# 功能目录

本目录由 `scripts/build_developer_feature_catalog.py` 从 canonical manifest 与新目录页面的 front matter 生成。它不读取已退役的旧目录、不手工复制旧索引，也不把 `active` 推断为 implemented。

当前目录包含 **103 个 Feature detail 页面**（含 P2 手工核验页）。103 个页面已完成来源迁移；旧 102 个详情页已登记在退役清单中，不再是运行时来源。

## 覆盖摘要

- Portfolio：`active` 80、`deferred` 17、`pending_decision` 6。
- 证据条目：有 frontmatter evidence 的 55 页、无 evidence 的 48 页，共 163 条。
- 来源迁移：`complete` 100 页、`manual` 3 页；旧 102 页已按退役清单处理。
- 人工分层核验：`manual` 页 3 页（[login](login)、[lao-alphabet-management](lao-alphabet-management)），其余 100 页六层交付状态默认 `not_evidenced`，待按[文档契约](../DOCUMENT_CONTRACT)增量补录。
- 主领域规模：audio 1、chat 15、commerce 15、content 7、identity 6、learning 17、operations 7、platform 7、rewards 3、social 14、trust 7、unassigned 4。

### 分层状态计数（六层交付层）

| 层 | 当前页面状态计数 |
| --- | --- |
| 数据库 | `evidenced` 2, `evidenced_limited` 1, `not_evidenced` 100 |
| Backend | `evidenced` 1, `evidenced_limited` 1, `not_evidenced` 100, `verified` 1 |
| Admin | `evidenced` 1, `not_applicable` 1, `not_evidenced` 100, `verified` 1 |
| Mobile | `evidenced` 1, `evidenced_limited` 1, `not_applicable` 1, `not_evidenced` 100 |
| Integration | `evidenced_limited` 1, `not_evidenced` 101, `verified` 1 |
| Acceptance | `not_evidenced` 102, `verified` 1 |

## 状态说明

- `portfolio_status` 直接来自各页面 front matter；`active` 只表示进入产品组合，不代表实现完成。
- 六层交付状态使用[文档契约](../DOCUMENT_CONTRACT)定义的受控枚举，默认 `not_evidenced`，来自各页 front matter `delivery_layers`。
- 分层状态摘要只列出偏离默认值的层；显示 `—` 表示六层全部 `not_evidenced`，尚待独立核验。
- `evidence` 是页面声明的证据条目数量，不是 Gate 结论。

## 领域分组

| 领域 | 功能数 | 开发状态分布 | Portfolio 分布 |
| --- | ---: | --- | --- |
| [音频（Audio）](audio/) | 1 | ⚪ not_started 1 | `active` 1 |
| [聊天（Chat）](chat/) | 15 | ⚪ not_started 15 | `active` 8、`deferred` 4、`pending_decision` 3 |
| [商业（Commerce）](commerce/) | 15 | ⚪ not_started 15 | `active` 12、`deferred` 3 |
| [内容（Content）](content/) | 7 | ⚪ not_started 6、🟡 in_progress 1 | `active` 7 |
| [身份（Identity）](identity/) | 6 | ⚪ not_started 5、🟡 in_progress 1 | `active` 5、`deferred` 1 |
| [学习（Learning）](learning/) | 17 | ⚪ not_started 17 | `active` 14、`deferred` 3 |
| [运营（Operations）](operations/) | 7 | ⚪ not_started 6、🟢 completed 1 | `active` 6、`deferred` 1 |
| [平台（Platform）](platform/) | 7 | ⚪ not_started 7 | `active` 5、`deferred` 2 |
| [奖励（Rewards）](rewards/) | 3 | ⚪ not_started 3 | `active` 2、`deferred` 1 |
| [社交（Social）](social/) | 14 | ⚪ not_started 14 | `active` 13、`pending_decision` 1 |
| [信任与安全（Trust & Safety）](trust/) | 7 | ⚪ not_started 7 | `active` 5、`pending_decision` 2 |
| [unassigned](unassigned/) | 4 | ⚪ not_started 4 | `active` 2、`deferred` 2 |
