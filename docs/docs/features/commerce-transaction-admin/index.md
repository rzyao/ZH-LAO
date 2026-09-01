---
feature_id: commerce-transaction-admin
title: 订单 / 支付 / 履约后台监控
portfolio_status: active
domain:
- commerce
- operations
mobile_pages: []
admin_pages: []
---

# 订单 / 支付 / 履约后台监控

## 功能概览

Portfolio Status：`active`。

`commerce-transaction-admin` 面向运营人员观察真钱交易链路中的 Order、Payment、PaymentEvent 与 Fulfillment。`paid` 只表示支付成功，不等价于履约已经完成；退款属于独立 `commerce-refund-admin`，Wallet Adjustment 也不是订单监控动作。
