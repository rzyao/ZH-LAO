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
- 证据条目：有 frontmatter evidence 的 55 页、无 evidence 的 48 页，共 154 条。
- 来源迁移：`complete` 101 页、`manual` 2 页；旧 102 页已按退役清单处理。
- 主领域规模：audio 1、chat 15、commerce 15、content 7、identity 6、learning 17、operations 7、platform 7、rewards 3、social 14、trust 7、unassigned 4。

### 分层状态计数

| 层 | 当前页面状态计数 |
| --- | --- |
| 产品 | `active` 78, `deferred` 17, `defined / spec draft` 2, `pending_decision` 6 |
| 数据库 | `baseline present` 1, `baseline present; alignment pending` 1, `not evidenced` 101 |
| Backend | `implemented at migration baseline` 1, `implemented at migration baseline; targeted tests limited` 1, `not evidenced` 101 |
| Admin | `implemented at migration baseline; acceptance pending` 1, `not applicable` 1, `not evidenced` 101 |
| Mobile | `implemented at migration baseline; acceptance pending` 1, `implemented in code; UI acceptance pending` 1, `not evidenced` 101 |
| Integration | `not evidenced` 103 |
| Acceptance | `not evidenced` 103 |

## 状态说明

- `portfolio_status` 直接来自各页面 front matter；`active` 只表示进入产品组合，不代表实现完成。
- 分层状态默认是 `not evidenced`；P2 手工核验页在其页面内记录了代码/测试证据，其余页面仍需独立验证。
- `evidence` 是页面声明的证据条目数量，不是 Gate 结论。

## 音频（Audio）

| 功能 | Portfolio | 分层状态摘要 | 证据条目 | 来源迁移 |
| --- | --- | --- | ---: | --- |
| [音频生产](audio-production) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 4 | `complete` |

## 聊天（Chat）

| 功能 | Portfolio | 分层状态摘要 | 证据条目 | 来源迁移 |
| --- | --- | --- | ---: | --- |
| [会话已读与未读](chat-read-state) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 2 | `complete` |
| [单条消息仅自己删除](chat-own-delete) | `deferred` | 产品: deferred; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [发起 / 打开一对一会话](direct-conversation) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 2 | `complete` |
| [图片消息](chat-image) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [实时消息传输与重连](chat-realtime) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [文字与 Emoji 消息](chat-text) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [消息 Reaction](chat-reactions) | `deferred` | 产品: deferred; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [消息撤回](chat-recall) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [置顶 / 免打扰 / 隐藏 / 清空历史](conversation-settings) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 3 | `complete` |
| [群聊](group-chat) | `deferred` | 产品: deferred; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [聊天会话列表](conversation-list) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 3 | `complete` |
| [聊天翻译](chat-translation) | `pending_decision` | 产品: pending_decision; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [语音消息](chat-voice-message) | `pending_decision` | 产品: pending_decision; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [语音转文字](chat-speech-to-text) | `pending_decision` | 产品: pending_decision; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [逐消息送达 / 已读回执](chat-message-receipts) | `deferred` | 产品: deferred; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |

## 商业（Commerce）

| 功能 | Portfolio | 分层状态摘要 | 证据条目 | 来源迁移 |
| --- | --- | --- | ---: | --- |
| [Coin Pack 商品目录](coin-pack-catalog) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 3 | `complete` |
| [Coin 钱包余额](wallet-balance) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 3 | `complete` |
| [促销与优惠券](promotions-coupons) | `deferred` | 产品: deferred; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [发送虚拟礼物](send-gift) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 3 | `complete` |
| [商品与价格后台管理](commerce-catalog-admin) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [礼物后台管理](gift-admin) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [礼物收益、提现与结算](creator-earnings) | `deferred` | 产品: deferred; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [礼物目录](gift-catalog) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 2 | `complete` |
| [社交会员与高级权益](social-membership-entitlements) | `deferred` | 产品: deferred; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [订单 / 支付 / 履约后台监控](commerce-transaction-admin) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [订单与支付历史](order-payment-history) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 3 | `complete` |
| [购买 Coins：下单、支付与履约](buy-coins) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 4 | `complete` |
| [退款与资产回收后台](commerce-refund-admin) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [钱包 Adjustment / Reversal 后台](wallet-adjustment-admin) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [钱包账本 / 资产变动历史](wallet-history) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 3 | `complete` |

## 内容（Content）

| 功能 | Portfolio | 分层状态摘要 | 证据条目 | 来源迁移 |
| --- | --- | --- | ---: | --- |
| [内容 Revision 与发布治理](content-revision-publishing) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 1 | `complete` |
| [用户首页与双侧入口](mobile-home) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [知识内容管理](knowledge-content-management) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 1 | `complete` |
| [练习与题库管理](practice-content-management) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 1 | `complete` |
| [老挝语字母管理](lao-alphabet-management) | `active` | 产品: defined / spec draft; 数据库: baseline present; alignment pending; Backend: implemented at migration baseline; targeted tests limited; Admin: implemented at migration baseline; acceptance pending; Mobile: implemented at migration baseline; acceptance pending; Integration: not evidenced; Acceptance: not evidenced | 4 | `manual` |
| [词典内容管理](dictionary-content-management) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 1 | `complete` |
| [课程编排与发布](curriculum-management) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 1 | `complete` |

## 身份（Identity）

| 功能 | Portfolio | 分层状态摘要 | 证据条目 | 来源迁移 |
| --- | --- | --- | ---: | --- |
| [游客云同步与注册数据迁移](guest-cloud-sync) | `deferred` | 产品: deferred; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [用户登录与会话](login) | `active` | 产品: defined / spec draft; 数据库: baseline present; Backend: implemented at migration baseline; Admin: not applicable; Mobile: implemented in code; UI acceptance pending; Integration: not evidenced; Acceptance: not evidenced | 4 | `manual` |
| [用户账户查询与状态管理](identity-user-admin) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [登录设备与会话管理](login-devices) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [账户基础资料与学习方向](account-profile) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [账户禁用 / 关闭与会话撤销](account-lifecycle) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |

## 学习（Learning）

| 功能 | Portfolio | 分层状态摘要 | 证据条目 | 来源迁移 |
| --- | --- | --- | ---: | --- |
| [Lesson 学习流程](lesson-learning) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 2 | `complete` |
| [即时中老翻译](instant-translation) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 3 | `complete` |
| [学习内容收藏](learning-bookmarks) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 4 | `complete` |
| [学习活动历史](learning-activity-history) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 4 | `complete` |
| [广告变现](ads-monetization) | `deferred` | 产品: deferred; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [掌握度与复习](mastery-review) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 4 | `complete` |
| [标准发音与音频播放](pronunciation-playback) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 4 | `complete` |
| [游客浏览学习内容](guest-learning-browse) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 2 | `complete` |
| [练习与作答](practice-exercises) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 2 | `complete` |
| [翻译历史](translation-history) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [词典搜索](dictionary-search) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 2 | `complete` |
| [词典搜索历史](dictionary-history) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 3 | `complete` |
| [词汇 / 句子 / 知识学习](knowledge-learning) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 2 | `complete` |
| [课程与 Lesson 进度](learning-progress) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 2 | `complete` |
| [课程列表与课程详情](course-catalog) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 2 | `complete` |
| [错题本](wrong-answer-notebook) | `deferred` | 产品: deferred; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [高级学习权益](advanced-learning-entitlements) | `deferred` | 产品: deferred; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |

## 运营（Operations）

| 功能 | Portfolio | 分层状态摘要 | 证据条目 | 来源迁移 |
| --- | --- | --- | ---: | --- |
| [后台 MFA / 邀请 / 登录失败保护](admin-auth-hardening) | `deferred` | 产品: deferred; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [后台操作审计查询](operator-audit-log) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 5 | `complete` |
| [后台登录与操作员认证](admin-login) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 6 | `complete` |
| [操作员管理](operator-management) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 5 | `complete` |
| [角色权限分配](permission-assignment) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 5 | `complete` |
| [角色管理](role-management) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 5 | `complete` |
| [首个管理员 Bootstrap](first-admin-bootstrap) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 5 | `complete` |

## 平台（Platform）

| 功能 | Portfolio | 分层状态摘要 | 证据条目 | 来源迁移 |
| --- | --- | --- | ---: | --- |
| [产品支持地区管理](region-management) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 2 | `complete` |
| [功能开关与范围灰度管理](feature-rollout-control) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 2 | `complete` |
| [客户端版本检查与强制升级](app-version-governance) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 2 | `complete` |
| [平台公告发布与展示](platform-announcements) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 2 | `complete` |
| [运行参数管理](runtime-config-management) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 2 | `complete` |
| [运行配置版本与回滚](runtime-config-history) | `deferred` | 产品: deferred; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [高级灰度发布](advanced-feature-rollout) | `deferred` | 产品: deferred; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |

## 奖励（Rewards）

| 功能 | Portfolio | 分层状态摘要 | 证据条目 | 来源迁移 |
| --- | --- | --- | ---: | --- |
| [会员天数 / POINT / BADGE 等新奖励类型](advanced-reward-types) | `deferred` | 产品: deferred; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [奖励计划 / 规则 / 发放监控后台](reward-operations) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 4 | `complete` |
| [自动 Coin 奖励](automatic-coin-rewards) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 4 | `complete` |

## 社交（Social）

| 功能 | Portfolio | 分层状态摘要 | 证据条目 | 来源迁移 |
| --- | --- | --- | ---: | --- |
| [互关 Match 与聊天资格](social-match) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 2 | `complete` |
| [公开社交资料查看](social-profile-view) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [关注 Feed 与动态浏览](social-feed) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 3 | `complete` |
| [关注与取消关注](social-follow) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 2 | `complete` |
| [关注我的 / 我关注的 / 已匹配列表](social-relationships) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 2 | `complete` |
| [动态点赞、评论与回复](social-post-interactions) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 3 | `complete` |
| [发布 / 删除文字图片动态](social-posting) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 3 | `complete` |
| [发现、筛选与推荐](social-discovery) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [发现偏好设置](social-discovery-preferences) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [暂停 / 关闭社交资料](social-lifecycle) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 2 | `complete` |
| [用户 Block / Unblock](social-block) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 2 | `complete` |
| [社交照片 / 兴趣 / 语言 / Prompt](social-profile-media) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [社交资料创建与编辑](social-profile) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [距离筛选与模糊距离展示](social-distance) | `pending_decision` | 产品: pending_decision; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |

## 信任与安全（Trust & Safety）

| 功能 | Portfolio | 分层状态摘要 | 证据条目 | 来源迁移 |
| --- | --- | --- | ---: | --- |
| [审核案件 / 证据 / 决定工作台](moderation-workbench) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [平台处罚与能力限制](enforcement-management) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [用户举报提交](user-reporting) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [用户申诉](user-appeal) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [申诉复核后台](appeal-review) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [真人认证审核](verification-review) | `pending_decision` | 产品: pending_decision; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [真人认证提交](real-person-verification) | `pending_decision` | 产品: pending_decision; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |

## unassigned

| 功能 | Portfolio | 分层状态摘要 | 证据条目 | 来源迁移 |
| --- | --- | --- | ---: | --- |
| [主题设置](theme-settings) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 1 | `complete` |
| [后台数据总览](admin-dashboard) | `deferred` | 产品: deferred; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
| [界面语言切换](interface-language) | `active` | 产品: active; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 1 | `complete` |
| [系统与互动推送通知](push-notifications) | `deferred` | 产品: deferred; 数据库: not evidenced; Backend: not evidenced; Admin: not evidenced; Mobile: not evidenced; Integration: not evidenced; Acceptance: not evidenced | 0 | `complete` |
