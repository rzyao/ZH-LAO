---
feature_id: advanced-reward-types
title: 会员天数 / POINT / BADGE 等新奖励类型
portfolio_status: deferred
domain:
- rewards
- commerce
mobile_pages: []
admin_pages: []
---

# 会员天数 / POINT / BADGE 等新奖励类型

## 功能概览

Portfolio Status：`deferred`。

本 Feature 只代表未来扩展奖励类型的开发入口，不表示这些类型已经进入当前 Rewards canonical。当前冻结的 Rewards V1 **只支持 Coin**；`ADR-017` 明确把会员天数、POINT / EXP / BADGE / GIFT / COUPON 等奖励形态延后。

因此本 Feature 不提前设计统一的“新奖励资产模型”，也不假设所有奖励最终都由 Commerce Wallet 承接。未来每种奖励类型都必须先明确事实归属、目标 Domain、交付语义与幂等契约，再决定是否复用现有 Reward Grant / Delivery 模式。
