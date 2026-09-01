---
feature_id: wallet-history
title: 钱包账本 / 资产变动历史
portfolio_status: active
domain:
- commerce
- identity
mobile_pages: []
admin_pages: []
delivery_evidence:
- /domains/commerce/
- /domains/commerce/wallet
- /domains/commerce/database
---

# 钱包账本 / 资产变动历史

## 功能概览

Portfolio Status：`active`。

本 Feature 面向用户展示 Coin 资产变动历史。`Wallet` 与 `Wallet Ledger` 不是同一个事实：Wallet 保存当前余额快照；`commerce_wallet_ledger` 是解释每次资产变化的 append-only canonical fact。Order / Payment 则分别属于购买意图和真钱支付事实，不应被账本替代。
