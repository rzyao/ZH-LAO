---
feature_id: wallet-balance
title: Coin 钱包余额
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

# Coin 钱包余额

## 功能概览

Portfolio Status：`active`。

向用户提供当前 Coin 余额。Commerce canonical 中 `Wallet.balance` 是当前余额的高效读取快照；它不是唯一账务事实。为什么余额发生变化必须由 append-only `Wallet Ledger` 解释，因此 Wallet 与 Wallet Ledger 必须保持职责分离。
