---
feature_id: commerce-transaction-admin
title: 订单 / 支付 / 履约后台监控
portfolio_status: active
domain:
  - commerce
  - operations
status:
  design: todo
  backend: todo
  admin: todo
  mobile: na
  integration: todo
  acceptance: todo
mobile_pages: []
admin_pages: []
---

# 订单 / 支付 / 履约后台监控

## 功能概览

Portfolio Status：`active`。

`commerce-transaction-admin` 面向运营人员观察真钱交易链路中的 Order、Payment、PaymentEvent 与 Fulfillment。`paid` 只表示支付成功，不等价于履约已经完成；退款属于独立 `commerce-refund-admin`，Wallet Adjustment 也不是订单监控动作。

## 设计

状态：todo

范围：未来监控能力应能按订单、用户、Provider 与状态定位 Order → Payment / PaymentEvent → Fulfillment 的真实链路，保留各对象独立状态与失败信息，不通过一个模糊“交易状态”覆盖多个 canonical facts。

Stage / 工件 / Gate：[购买、支付与退款](/domains/commerce/purchase-and-payment) 与 [Commerce 数据库最终模型](/domains/commerce/database) 已冻结 Order / Payment / Fulfillment 模型和状态机；但运营查询 Use Case、Admin read model/API、筛选字段与 exact permission 尚未冻结。[开发进度](/development/DEVELOPMENT_PROGRESS) 记录 Commerce=`NOT_STARTED`、Gate=`—`，没有本 Feature 的 Design Stage / Gate。

下一步：Commerce Owner Domain 先定义只读监控 API/read model、必要的敏感字段边界与 `commerce.*` exact permission，再进入实现。

## Backend

状态：todo

范围：实现订单、支付、Provider event、履约的运营查询服务和稳定 read model；监控接口不得把退款或 Wallet 调整伪造成 Payment / Fulfillment 状态。

Stage / 工件 / Gate：数据库 migration 已包含 `commerce_orders`、`commerce_order_items`、`commerce_payments`、`commerce_payment_events`、`commerce_order_fulfillments`，但当前 Backend 没有 Commerce module 或管理查询 API；[开发进度](/development/DEVELOPMENT_PROGRESS) 没有 Commerce Implementation Report / Gate。

下一步：在正式 Commerce Backend Stage 中实现查询 API、分页/过滤、权限所需 context 与测试，并产生真实 Backend Gate。

## Admin

状态：todo

范围：未来 Admin 页面提供订单 / 支付 / 履约链路的检索、详情与异常观察，默认是监控而不是隐式修改交易事实。

Stage / 工件 / Gate：[Admin 页面清单](/admin/pages) 没有订单 / 支付监控正式页面，`/commerce` 仅为 DomainPlaceholder；因此 `admin_pages` 保持空，也没有该 Feature 的 Admin Stage / Gate。[Operations RBAC Contracts](/development/04-operations/OPERATIONS_RBAC_CONTRACTS) 要求 Commerce 先冻结 exact permission，当前 permission catalog 尚无 `commerce.*`。

下一步：待 Commerce read API 与 permission requirement 冻结后创建真实页面、登记 `page_id`，再建立 Admin 实现与 Gate；不把 `/commerce` 占位页登记为本 Feature 页面。

## Mobile

状态：na

不适用：订单 / 支付 / 履约后台监控属于运营控制面，不是 Mobile 用户端交付。

## 集成

状态：todo

范围：连接 Admin UI、Operations authorization、Commerce read API 与必要的审计 / 请求上下文；只读取 Commerce canonical state，不在 Operations 建第二份交易事实。

Stage / 工件 / Gate：Operations 通用授权已可用，但 Commerce management/read contract 与 permission 尚不存在，因此当前无本 Feature Integration Stage / Gate。

下一步：Backend 与 Admin 页面形成后执行真实权限、查询一致性、Payment/Fulfillment 独立状态及异常链路联调。

## 验收

状态：todo

范围：验证订单、支付事件、支付状态、履约状态可以分别追踪；`paid` 不被展示成“已履约”；Refund、RefundRecovery 与 Wallet Adjustment 不混入本 Feature 的 canonical 状态；权限与敏感字段边界符合契约。

Stage / 工件 / Gate：当前没有 Feature Acceptance Stage / Gate。

下一步：实现完成后补查询正确性、权限、分页过滤、异常链路与端到端验收。
