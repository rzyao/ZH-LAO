---
feature_id: commerce-refund-admin
title: 退款与资产回收后台
portfolio_status: active
domain:
- commerce
- operations
mobile_pages: []
admin_pages: []
---

# 退款与资产回收后台

## 功能概览

Portfolio Status：`active`。

`commerce-refund-admin` 面向运营侧处理与观察真钱 Refund 及其后续虚拟资产 RefundRecovery。两者是两个不同的 canonical facts：Refund 只回答外部真钱是否已退回；RefundRecovery 只回答此前发放的 Coins 是否已安全回收。允许真实出现 `Refund=succeeded` 但 `RefundRecovery=failed`。
