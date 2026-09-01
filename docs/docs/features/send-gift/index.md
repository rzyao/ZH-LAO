---
feature_id: send-gift
title: 发送虚拟礼物
portfolio_status: active
domain:
- commerce
- identity
- social
- chat
mobile_pages: []
admin_pages: []
delivery_evidence:
- /domains/commerce/gifting
- /domains/commerce/wallet
- /governance/design-register
---

# 发送虚拟礼物

## 功能概览

Portfolio Status：`active`。

`send-gift` 是一次以 Coins 支付的虚拟礼物消费 / 转移。Commerce 的 `commerce_gift_sends` 是唯一 authoritative GiftSend business fact；Chat / Social 可以成为触发入口或展示上下文，但不能复制交易事实、扣余额或自行计算权威礼物价格。

必须保持：`Rewards delivery ≠ Commerce gift send`。两者都可能经过 Commerce Wallet，但 Ledger 分别使用 `reward_delivery` 与 `gift_send`，业务事实所有权不同。
