---
feature_id: buy-coins
title: 购买 Coins：下单、支付与履约
portfolio_status: active
domain:
  - commerce
  - identity
status:
  design: done
  backend: todo
  admin: na
  mobile: todo
  integration: todo
  acceptance: todo
mobile_pages: []
admin_pages: []
evidence:
  design:
    - /domains/commerce/
    - /domains/commerce/purchase-and-payment
    - /domains/commerce/wallet
    - /domains/commerce/database
---

# 购买 Coins：下单、支付与履约

## 功能概览

Portfolio Status：`active`。

本 Feature 描述“选择 Coin Pack → Order / OrderItem → Payment / PaymentEvent → Order Fulfillment → Wallet Credit + Wallet Ledger”的购买链路。四类事实必须分开理解：Order 是购买意图与金额快照，Payment 是真钱支付事实，Wallet 是当前 Coin 余额快照，Wallet Ledger 是 Coin 资产变化的 append-only canonical fact。

## 设计

状态：done

**Scope**

定义 Coin Pack 购买的订单、支付、履约与入账边界。创建 Order 时冻结 OrderItem 商品 / 价格 / Coin 权益快照；只有服务端可信 Provider 结果才能把 Payment 判为成功；Payment 成功后仍必须独立完成 Fulfillment，Coin Pack Fulfillment 最终通过统一 Wallet Service 写入 Wallet Credit + Ledger Entry。

**Stage / Artifact**

当前有效设计工件为 [Commerce](/domains/commerce/)、[购买、支付与退款](/domains/commerce/purchase-and-payment)、[钱包与账本](/domains/commerce/wallet) 与 [数据设计](/domains/commerce/database)。16-table canonical 对应 `commerce_orders`、`commerce_order_items`、`commerce_order_fulfillments`、`commerce_payments`、`commerce_payment_events`、`commerce_wallets`、`commerce_wallet_ledger`，仓库已有 `database/migrations/0900_commerce.sql` 物理迁移工件。

**Gate / Evidence**

设计证据明确规定 `Order.status = paid` 只代表支付层成功，不代表 Coins 已履约到账；Payment 成功必须来自服务端可信 Provider 验证。当前 Stage Registry 仍是较早 `source_head` 快照，本页不伪造新的 `COMMERCE_DESIGN_GATE` PASS，而以最新 frozen canonical 记录 Feature 设计完成事实。

**Next Action**

Backend 实现必须按 Order → Payment → Fulfillment → Wallet/Ledger 分层落地，并把幂等、重复 Provider Event、重复 Fulfillment 与失败恢复作为购买主链的一部分。

## Backend

状态：todo

**Scope**

实现 Order 创建、OrderItem Snapshot、Payment 生命周期、PaymentEvent 幂等处理、Coin Pack Fulfillment，以及通过统一 Wallet Service 原子完成余额增加与 Ledger 写入。

**Stage / Artifact**

当前 `apps/backend/src/modules` 没有 Commerce 模块，也未发现 Payment Provider Adapter、Commerce Route/Service、Wallet Service 或 F16 购买测试。现有 `0900_commerce.sql` 是数据层实现输入，不是购买 Runtime。

**Gate / Evidence**

没有 `COMMERCE_BACKEND_GATE` PASS 或购买 Backend 测试证据，因此保持 `todo`。尤其不能把 16-table migration 落地写成“Coin 购买 Backend 已完成”。

**Next Action**

先建立 Commerce module 和事务边界，再实现 Order / Payment / Fulfillment / Wallet Service；为创建订单、Provider Event 幂等、支付金额一致性、一次性履约与 Ledger 原子性补测试。

## Admin

状态：na

**Scope**

本 Feature 是用户购买 Coins 的消费链路，不承担订单监控、退款管理、商品价格后台或钱包调整后台。

**Stage / Artifact**

`admin_pages: []`；F16 不产生 Admin 页面或 Admin Stage 工件。

**Gate / Evidence**

相关运营能力属于独立 Commerce Admin Feature，不在本 F16 范围，因此本 Lane 为 `na`。

**Next Action**

无；用户购买主链不依赖把 Admin 功能并入当前 Feature。

## Mobile

状态：todo

**Scope**

承载用户选择 Coin Pack、发起购买、展示等待 / 成功 / 失败 / 恢复状态以及最终 Coin 到账结果；客户端不得自行把 Provider 返回或本地支付结果写成 canonical Payment success。

**Stage / Artifact**

当前 `mobile_pages: []`，没有本 Feature 的 Mobile 购买页面、Provider SDK 接线或 Commerce API 调用证据。

**Gate / Evidence**

没有 Mobile 实现与真实购买路径证据，保持 `todo`。

**Next Action**

在 Backend 与具体支付 Provider Contract 明确后接入真实购买流程，并将“支付成功但履约处理中 / 失败”的状态与“Coins 已到账”分开呈现。

## 集成

状态：todo

**Scope**

连接客户端、Commerce Backend 与外部支付 Provider，验证 Provider 结果 / Webhook 进入 PaymentEvent 后驱动 Payment，再由成功 Payment 驱动 Fulfillment 与 Wallet/Ledger；任何一步失败都必须保留其独立事实。

**Stage / Artifact**

canonical 只定义稳定 Provider Adapter 边界；当前具体支付渠道仍 deferred，仓库也没有 Provider Adapter / Webhook runtime 证据。

**Gate / Evidence**

支付 Provider 尚未完整实现，没有真实 Provider 验证、Webhook 幂等、Fulfillment 到 Wallet 的端到端集成证据。因此购买闭环明确未完成，保持 `todo`。

**Next Action**

选定并实现具体 Provider Adapter 后，完成服务端验签 / 校验、事件幂等、Payment 状态转换、Fulfillment 重试与 Wallet Credit 原子联调。

## 验收

状态：todo

**Scope**

验收完整真钱购买链路，而不是只验收 schema：创建 Order、完成可信 Payment、只履约一次、Wallet 增加正确 Coin 数、Ledger 产生唯一 `order_fulfillment` 记录，并能正确处理重复通知与失败重试。

**Stage / Artifact**

当前只有 frozen design 与 migration，没有真实支付 Provider、Commerce Runtime、Mobile 购买路径或 E2E 工件。

**Gate / Evidence**

没有 Coin Purchase E2E / Acceptance PASS。尤其 `Payment = succeeded` 仍不能单独作为购买完成证据，必须同时确认对应 Fulfillment 与 Wallet/Ledger 结果。

**Next Action**

Provider + Backend + Mobile 集成完成后执行端到端验收，覆盖成功、失败、取消、重复 Provider Event、重复履约请求和支付成功但履约失败 / 重试场景。
