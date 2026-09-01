---
feature_id: buy-coins
title: 购买 Coins：下单、支付与履约
portfolio_status: active
domain:
- commerce
- identity
mobile_pages: []
admin_pages: []
delivery_evidence:
- /domains/commerce/
- /domains/commerce/purchase-and-payment
- /domains/commerce/wallet
- /domains/commerce/database
---

# 购买 Coins：下单、支付与履约

## 功能概览

Portfolio Status：`active`。

本 Feature 描述“选择 Coin Pack → Order / OrderItem → Payment / PaymentEvent → Order Fulfillment → Wallet Credit + Wallet Ledger”的购买链路。四类事实必须分开理解：Order 是购买意图与金额快照，Payment 是真钱支付事实，Wallet 是当前 Coin 余额快照，Wallet Ledger 是 Coin 资产变化的 append-only canonical fact。
