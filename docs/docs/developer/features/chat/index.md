---
status: active
last_updated: 2026-09-02
source: scripts/build_developer_feature_catalog.py
---

# 聊天（Chat）

> 返回 [全量功能目录](../) ｜ 本领域共 **15** 个功能（Portfolio：`active` 8、`deferred` 4、`pending_decision` 3）。

## 领域导航

[音频（Audio）](../audio/) · **聊天（Chat）** · [商业（Commerce）](../commerce/) · [内容（Content）](../content/) · [身份（Identity）](../identity/) · [学习（Learning）](../learning/) · [运营（Operations）](../operations/) · [平台（Platform）](../platform/) · [奖励（Rewards）](../rewards/) · [社交（Social）](../social/) · [信任与安全（Trust & Safety）](../trust/) · [unassigned](../unassigned/)

## 功能

> 开发状态由[六层交付状态](../../DOCUMENT_CONTRACT)推导：`completed` 需 Integration 与 Acceptance 均 `verified`；任一层有证据为 `in_progress`；无证据为 `not_started`。

| 功能 | 开发状态 | Portfolio | 分层状态摘要 | 证据条目 | 来源迁移 |
| --- | --- | --- | --- | ---: | --- |
| [会话已读与未读](../chat-read-state) | ⚪ not_started | `active` | — | 2 | `complete` |
| [单条消息仅自己删除](../chat-own-delete) | ⚪ not_started | `deferred` | — | 0 | `complete` |
| [发起 / 打开一对一会话](../direct-conversation) | ⚪ not_started | `active` | — | 2 | `complete` |
| [图片消息](../chat-image) | ⚪ not_started | `active` | — | 0 | `complete` |
| [实时消息传输与重连](../chat-realtime) | ⚪ not_started | `active` | — | 0 | `complete` |
| [文字与 Emoji 消息](../chat-text) | ⚪ not_started | `active` | — | 0 | `complete` |
| [消息 Reaction](../chat-reactions) | ⚪ not_started | `deferred` | — | 0 | `complete` |
| [消息撤回](../chat-recall) | ⚪ not_started | `active` | — | 0 | `complete` |
| [置顶 / 免打扰 / 隐藏 / 清空历史](../conversation-settings) | ⚪ not_started | `active` | — | 3 | `complete` |
| [群聊](../group-chat) | ⚪ not_started | `deferred` | — | 0 | `complete` |
| [聊天会话列表](../conversation-list) | ⚪ not_started | `active` | — | 3 | `complete` |
| [聊天翻译](../chat-translation) | ⚪ not_started | `pending_decision` | — | 0 | `complete` |
| [语音消息](../chat-voice-message) | ⚪ not_started | `pending_decision` | — | 0 | `complete` |
| [语音转文字](../chat-speech-to-text) | ⚪ not_started | `pending_decision` | — | 0 | `complete` |
| [逐消息送达 / 已读回执](../chat-message-receipts) | ⚪ not_started | `deferred` | — | 0 | `complete` |

## 本领域分层状态计数（六层交付层）

| 层 | 状态计数 |
| --- | --- |
| 数据库 | `not_evidenced` 15 |
| Backend | `not_evidenced` 15 |
| Admin | `not_evidenced` 15 |
| Mobile | `not_evidenced` 15 |
| Integration | `not_evidenced` 15 |
| Acceptance | `not_evidenced` 15 |

## 状态说明

- `portfolio_status` 直接来自各页面 front matter；`active` 只表示进入产品组合，不代表实现完成。
- 六层交付状态使用[文档契约](../../DOCUMENT_CONTRACT)定义的受控枚举，默认 `not_evidenced`。
- 分层状态摘要只列出偏离默认值的层；显示 `—` 表示六层全部 `not_evidenced`，尚待独立核验。
