---
feature_id: order-payment-history
title: 订单与支付历史
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
    - /domains/commerce/database
---

# 订单与支付历史

## 功能概览

Portfolio Status：`active`。

向用户展示自己的购买历史，但不把 Order 与 Payment 合并成一个“交易状态”。Order 表达购买意图、商品 / 金额快照与订单生命周期；Payment 表达真钱支付生命周期；Fulfillment 表达已购虚拟资产是否交付。Wallet / Wallet Ledger 属于资产余额与资产变动事实，不是订单 / 支付历史的替代来源。

## 设计

状态：done

**Scope**

定义用户侧订单与支付历史的事实边界。订单记录来自 `commerce_orders + commerce_order_items`；支付记录来自 `commerce_payments`，必要时以 PaymentEvent 支撑追踪但不直接把 Provider 原始事件暴露成用户交易模型。历史展示必须保留 OrderItem Snapshot，不能用当前目录价格回算历史。

**Stage / Artifact**

当前有效设计工件为 [Commerce](/domains/commerce/)、[购买、支付与退款](/domains/commerce/purchase-and-payment) 与 [数据设计](/domains/commerce/database)。16-table canonical 已冻结，`database/v2/migrations/0900_commerce.sql` 已包含 Order / OrderItem / Payment / PaymentEvent / Fulfillment 的物理结构。

**Gate / Evidence**

设计证据明确区分 `Order.status`、`Payment.status` 与 `Fulfillment.status`，并规定 `Order = paid` 不等于虚拟资产已履约。Stage Registry 仍是较早 `source_head` 快照，本页不生成不存在的 `COMMERCE_DESIGN_GATE` PASS，只记录最新 frozen canonical 已形成的 Feature 设计事实。

**Next Action**

Backend 查询模型必须保留 Order 与 Payment 的独立状态，并明确何时展示履约结果；不得创造万能 transaction 状态覆盖三个生命周期。

## Backend

状态：todo

**Scope**

实现按当前用户过滤的订单列表 / 详情与支付历史查询，组合 OrderItem Snapshot 和必要的 Payment / Fulfillment 状态，避免跨用户读取和 N+1 式无约束查询。

**Stage / Artifact**

当前 `apps/backend/src/modules` 没有 Commerce 模块，未发现订单历史 Route、Service、Repository 或测试。现有 schema / migration 只提供持久化契约。

**Gate / Evidence**

没有 `COMMERCE_BACKEND_GATE` PASS、用户订单查询 API 或自动化测试证据，因此保持 `todo`。存在订单表与支付表不等于历史查询 Feature 已实现。

**Next Action**

实现用户隔离的分页查询与详情读取，定义 Order / Payment / Fulfillment 的响应结构，并补状态组合、历史快照与授权测试。

## Admin

状态：na

**Scope**

本 Feature 只负责用户查看自己的订单 / 支付历史，不包含运营侧订单监控或退款处置。

**Stage / Artifact**

`admin_pages: []`；F16 不产生 Admin 页面或 Admin Stage 工件。

**Gate / Evidence**

运营侧交易查询属于独立 Commerce Admin Feature，不在本 F16 范围，因此本 Lane 为 `na`。

**Next Action**

无；不要把 Admin 订单监控能力回填到用户订单历史页面。

## Mobile

状态：todo

**Scope**

展示当前用户的订单列表 / 详情、真钱金额与币种、订单状态、支付状态以及需要时的履约状态；不能把 Wallet Ledger 条目伪装成 Order，也不能用当前商品价格覆盖历史快照。

**Stage / Artifact**

当前 `mobile_pages: []`，没有订单 / 支付历史 Mobile 页面、ViewModel 或 Commerce API 调用工件。

**Gate / Evidence**

没有 Mobile 实现或用户路径证据，保持 `todo`。

**Next Action**

Backend 查询契约稳定后实现分页、状态展示、空态 / 错误态与详情页，并对“支付成功但履约未完成”等状态做明确区分。

## 集成

状态：todo

**Scope**

联通订单历史 Backend 与 Mobile，并验证真实购买写入后的 Order / Payment / Fulfillment 能被一致读取。支付 Provider 数据只能通过 Commerce 的稳定 Payment 语义进入用户历史，客户端不直接消费 Provider canonical 状态。

**Stage / Artifact**

当前没有 Commerce Runtime、真实支付 Provider 集成或 Mobile 历史查询链路。

**Gate / Evidence**

没有跨层集成证据，保持 `todo`。Provider 未实现也意味着目前无法用真实支付事件证明历史链路端到端正确。

**Next Action**

购买 Runtime 与历史查询 API 完成后，以真实状态转换数据联调列表 / 详情，并验证重放 Provider Event 不产生重复用户交易事实。

## 验收

状态：todo

**Scope**

验收用户只能看到自己的历史，历史金额 / 商品信息保持下单时快照，并能正确区分 Order、Payment 与 Fulfillment 的状态；Wallet Balance / Ledger 不作为订单状态的替代字段。

**Stage / Artifact**

当前只有 frozen canonical 和 migration，没有查询 API、Mobile 页面或 E2E 工件。

**Gate / Evidence**

没有 Order / Payment History acceptance PASS。

**Next Action**

在 Backend + Mobile + Integration 完成后覆盖分页、用户隔离、历史快照、失败 / 取消 / 已支付未履约 / 已履约等组合状态的端到端验收。
