---
status: baseline
date: 2026-08-30
---

# ADR-005：以 Entitlement 统一商业权益

## 决策

业务功能检查具体 UserEntitlement，不判断 `is_vip`。权益可以来自 Commerce 购买、Rewards 奖励或 Promotion。

## 后果

付费用户与贡献获奖用户可以得到相同能力，业务功能与权益来源解耦。Entitlement 的字段、有效期和消费模型仍待 Commerce 设计。
