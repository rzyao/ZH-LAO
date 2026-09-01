---
feature_id: enforcement-management
title: 平台处罚与能力限制
portfolio_status: active
domain:
- trust
- operations
- identity
- social
- chat
mobile_pages: []
admin_pages: []
---

# 平台处罚与能力限制

## 功能概览

Portfolio Status：`active`。

本 Feature 管理 canonical `Enforcement Action`：它必须由 Trust 的 Moderation Decision 派生并保留生命周期历史。`Enforcement Action` 是“平台处罚事实”，**不等于** Identity / Social / Chat 等 Owner Domain 已经完成实际状态变更；Owner Domain 只能通过公开契约/共享 Outbox 消费处罚结果后更新自己的事实。

Report、Case、Evidence、Decision 与 Appeal 均不是本 Feature 的替代数据模型。
