---
status: active
last_updated: 2026-09-02
source: scripts/build_developer_feature_catalog.py
---

# 商业（Commerce）

> 返回 [全量功能目录](../) ｜ 本领域共 **15** 个功能（Portfolio：`active` 12、`deferred` 3）。

## 领域导航

[音频（Audio）](../audio/) · [聊天（Chat）](../chat/) · **商业（Commerce）** · [内容（Content）](../content/) · [身份（Identity）](../identity/) · [学习（Learning）](../learning/) · [运营（Operations）](../operations/) · [平台（Platform）](../platform/) · [奖励（Rewards）](../rewards/) · [社交（Social）](../social/) · [信任与安全（Trust & Safety）](../trust/) · [unassigned](../unassigned/)

## 功能

> 开发状态由[六层交付状态](../../DOCUMENT_CONTRACT)推导：`completed` 需 Integration 与 Acceptance 均 `verified`；任一层有证据为 `in_progress`；无证据为 `not_started`。

| 功能 | 开发状态 | Portfolio | 分层状态摘要 | 证据条目 | 来源迁移 |
| --- | --- | --- | --- | ---: | --- |
| [Coin Pack 商品目录](../coin-pack-catalog) | ⚪ not_started | `active` | — | 3 | `complete` |
| [Coin 钱包余额](../wallet-balance) | ⚪ not_started | `active` | — | 3 | `complete` |
| [促销与优惠券](../promotions-coupons) | ⚪ not_started | `deferred` | — | 0 | `complete` |
| [发送虚拟礼物](../send-gift) | ⚪ not_started | `active` | — | 3 | `complete` |
| [商品与价格后台管理](../commerce-catalog-admin) | ⚪ not_started | `active` | — | 0 | `complete` |
| [礼物后台管理](../gift-admin) | ⚪ not_started | `active` | — | 0 | `complete` |
| [礼物收益、提现与结算](../creator-earnings) | ⚪ not_started | `deferred` | — | 0 | `complete` |
| [礼物目录](../gift-catalog) | ⚪ not_started | `active` | — | 2 | `complete` |
| [社交会员与高级权益](../social-membership-entitlements) | ⚪ not_started | `deferred` | — | 0 | `complete` |
| [订单 / 支付 / 履约后台监控](../commerce-transaction-admin) | ⚪ not_started | `active` | — | 0 | `complete` |
| [订单与支付历史](../order-payment-history) | ⚪ not_started | `active` | — | 3 | `complete` |
| [购买 Coins：下单、支付与履约](../buy-coins) | ⚪ not_started | `active` | — | 4 | `complete` |
| [退款与资产回收后台](../commerce-refund-admin) | ⚪ not_started | `active` | — | 0 | `complete` |
| [钱包 Adjustment / Reversal 后台](../wallet-adjustment-admin) | ⚪ not_started | `active` | — | 0 | `complete` |
| [钱包账本 / 资产变动历史](../wallet-history) | ⚪ not_started | `active` | — | 3 | `complete` |

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
