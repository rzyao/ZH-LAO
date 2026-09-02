---
status: active
last_updated: 2026-09-02
source: scripts/build_developer_feature_catalog.py
---

# 学习（Learning）

> 返回 [全量功能目录](../) ｜ 本领域共 **17** 个功能（Portfolio：`active` 14、`deferred` 3）。

## 领域导航

[音频（Audio）](../audio/) · [聊天（Chat）](../chat/) · [商业（Commerce）](../commerce/) · [内容（Content）](../content/) · [身份（Identity）](../identity/) · **学习（Learning）** · [运营（Operations）](../operations/) · [平台（Platform）](../platform/) · [奖励（Rewards）](../rewards/) · [社交（Social）](../social/) · [信任与安全（Trust & Safety）](../trust/) · [unassigned](../unassigned/)

## 功能

> 开发状态由[六层交付状态](../../DOCUMENT_CONTRACT)推导：`completed` 需 Integration 与 Acceptance 均 `verified`；任一层有证据为 `in_progress`；无证据为 `not_started`。

| 功能 | 开发状态 | Portfolio | 分层状态摘要 | 证据条目 | 来源迁移 |
| --- | --- | --- | --- | ---: | --- |
| [Lesson 学习流程](../lesson-learning) | ⚪ not_started | `active` | — | 2 | `complete` |
| [即时中老翻译](../instant-translation) | ⚪ not_started | `active` | — | 3 | `complete` |
| [学习内容收藏](../learning-bookmarks) | ⚪ not_started | `active` | — | 4 | `complete` |
| [学习活动历史](../learning-activity-history) | ⚪ not_started | `active` | — | 4 | `complete` |
| [广告变现](../ads-monetization) | ⚪ not_started | `deferred` | — | 0 | `complete` |
| [掌握度与复习](../mastery-review) | ⚪ not_started | `active` | — | 4 | `complete` |
| [标准发音与音频播放](../pronunciation-playback) | ⚪ not_started | `active` | — | 4 | `complete` |
| [游客浏览学习内容](../guest-learning-browse) | ⚪ not_started | `active` | — | 2 | `complete` |
| [练习与作答](../practice-exercises) | ⚪ not_started | `active` | — | 2 | `complete` |
| [翻译历史](../translation-history) | ⚪ not_started | `active` | — | 0 | `complete` |
| [词典搜索](../dictionary-search) | ⚪ not_started | `active` | — | 2 | `complete` |
| [词典搜索历史](../dictionary-history) | ⚪ not_started | `active` | — | 3 | `complete` |
| [词汇 / 句子 / 知识学习](../knowledge-learning) | ⚪ not_started | `active` | — | 2 | `complete` |
| [课程与 Lesson 进度](../learning-progress) | ⚪ not_started | `active` | — | 2 | `complete` |
| [课程列表与课程详情](../course-catalog) | ⚪ not_started | `active` | — | 2 | `complete` |
| [错题本](../wrong-answer-notebook) | ⚪ not_started | `deferred` | — | 0 | `complete` |
| [高级学习权益](../advanced-learning-entitlements) | ⚪ not_started | `deferred` | — | 0 | `complete` |

## 本领域分层状态计数（六层交付层）

| 层 | 状态计数 |
| --- | --- |
| 数据库 | `not_evidenced` 17 |
| Backend | `not_evidenced` 17 |
| Admin | `not_evidenced` 17 |
| Mobile | `not_evidenced` 17 |
| Integration | `not_evidenced` 17 |
| Acceptance | `not_evidenced` 17 |

## 状态说明

- `portfolio_status` 直接来自各页面 front matter；`active` 只表示进入产品组合，不代表实现完成。
- 六层交付状态使用[文档契约](../../DOCUMENT_CONTRACT)定义的受控枚举，默认 `not_evidenced`。
- 分层状态摘要只列出偏离默认值的层；显示 `—` 表示六层全部 `not_evidenced`，尚待独立核验。
