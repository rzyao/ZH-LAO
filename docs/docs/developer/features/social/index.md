---
status: active
last_updated: 2026-09-02
source: scripts/build_developer_feature_catalog.py
---

# 社交（Social）

> 返回 [全量功能目录](../) ｜ 本领域共 **14** 个功能（Portfolio：`active` 13、`pending_decision` 1）。

## 领域导航

[音频（Audio）](../audio/) · [聊天（Chat）](../chat/) · [商业（Commerce）](../commerce/) · [内容（Content）](../content/) · [身份（Identity）](../identity/) · [学习（Learning）](../learning/) · [运营（Operations）](../operations/) · [平台（Platform）](../platform/) · [奖励（Rewards）](../rewards/) · **社交（Social）** · [信任与安全（Trust & Safety）](../trust/) · [unassigned](../unassigned/)

## 功能

> 开发状态由[六层交付状态](../../DOCUMENT_CONTRACT)推导：`completed` 需 Integration 与 Acceptance 均 `verified`；任一层有证据为 `in_progress`；无证据为 `not_started`。

| 功能 | 开发状态 | Portfolio | 分层状态摘要 | 证据条目 | 来源迁移 |
| --- | --- | --- | --- | ---: | --- |
| [互关 Match 与聊天资格](../social-match) | ⚪ not_started | `active` | — | 2 | `complete` |
| [公开社交资料查看](../social-profile-view) | ⚪ not_started | `active` | — | 0 | `complete` |
| [关注 Feed 与动态浏览](../social-feed) | ⚪ not_started | `active` | — | 3 | `complete` |
| [关注与取消关注](../social-follow) | ⚪ not_started | `active` | — | 2 | `complete` |
| [关注我的 / 我关注的 / 已匹配列表](../social-relationships) | ⚪ not_started | `active` | — | 2 | `complete` |
| [动态点赞、评论与回复](../social-post-interactions) | ⚪ not_started | `active` | — | 3 | `complete` |
| [发布 / 删除文字图片动态](../social-posting) | ⚪ not_started | `active` | — | 3 | `complete` |
| [发现、筛选与推荐](../social-discovery) | ⚪ not_started | `active` | — | 0 | `complete` |
| [发现偏好设置](../social-discovery-preferences) | ⚪ not_started | `active` | — | 0 | `complete` |
| [暂停 / 关闭社交资料](../social-lifecycle) | ⚪ not_started | `active` | — | 2 | `complete` |
| [用户 Block / Unblock](../social-block) | ⚪ not_started | `active` | — | 2 | `complete` |
| [社交照片 / 兴趣 / 语言 / Prompt](../social-profile-media) | ⚪ not_started | `active` | — | 0 | `complete` |
| [社交资料创建与编辑](../social-profile) | ⚪ not_started | `active` | — | 0 | `complete` |
| [距离筛选与模糊距离展示](../social-distance) | ⚪ not_started | `pending_decision` | — | 0 | `complete` |

## 本领域分层状态计数（六层交付层）

| 层 | 状态计数 |
| --- | --- |
| 数据库 | `not_evidenced` 14 |
| Backend | `not_evidenced` 14 |
| Admin | `not_evidenced` 14 |
| Mobile | `not_evidenced` 14 |
| Integration | `not_evidenced` 14 |
| Acceptance | `not_evidenced` 14 |

## 状态说明

- `portfolio_status` 直接来自各页面 front matter；`active` 只表示进入产品组合，不代表实现完成。
- 六层交付状态使用[文档契约](../../DOCUMENT_CONTRACT)定义的受控枚举，默认 `not_evidenced`。
- 分层状态摘要只列出偏离默认值的层；显示 `—` 表示六层全部 `not_evidenced`，尚待独立核验。
