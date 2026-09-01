---
feature_id: creator-earnings
title: 礼物收益、提现与结算
portfolio_status: deferred
domain:
- commerce
- social
mobile_pages: []
admin_pages: []
---

# 礼物收益、提现与结算

## 功能概览

- Portfolio Status：`deferred`。
- `portfolio_status` 只表达 Portfolio / 生命周期决策，不代表执行或完成状态。
- 当前证据只支持将该 Feature 保留在 Future / Deferred；不据此设计 Creator payout、可提现余额、提现审核或 Settlement architecture。

## 现有证据

- [Commerce canonical](../../domains/commerce/index.md)：领域职责明确不负责 Creator Economy / 提现 / 结算（V1），V1 范围同时明确延后 `Creator earnings` 与 `Withdrawal / Settlement`，且当前不建表。
- `FEATURE_PAGE_INDEX.json`：记录 canonical title、`portfolio_status: deferred`、领域归属与证据线索。
