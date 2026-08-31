---
feature_id: commerce-refund-admin
title: 退款与资产回收后台
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

# 退款与资产回收后台

## 功能概览

Portfolio Status：`active`。

`commerce-refund-admin` 面向运营侧处理与观察真钱 Refund 及其后续虚拟资产 RefundRecovery。两者是两个不同的 canonical facts：Refund 只回答外部真钱是否已退回；RefundRecovery 只回答此前发放的 Coins 是否已安全回收。允许真实出现 `Refund=succeeded` 但 `RefundRecovery=failed`。

## 设计

状态：todo

范围：未来管理能力需要分别表达 Refund 的创建/提交/Provider 结果与 RefundRecovery 的触发/处理/失败原因，保持 V1 Coin Pack 全额退款产品规则，并禁止通过修改 Payment 状态或直接调 Wallet balance 掩盖回收失败。

Stage / 工件 / Gate：[购买、支付与退款](/domains/commerce/purchase-and-payment) 已冻结 Refund 语义，[钱包与账本](/domains/commerce/wallet) 已冻结 RefundRecovery 与 Wallet debit 规则，[Commerce 数据库最终模型](/domains/commerce/database) 已冻结两张独立表；但运营 Use Case、Admin API、Provider 操作边界和 exact permission 尚未形成正式设计。[开发进度](/development/DEVELOPMENT_PROGRESS) 中 Commerce=`NOT_STARTED`、Gate=`—`，没有本 Feature Design Stage / Gate。

下一步：由 Commerce Owner Domain 冻结退款管理命令/查询、Provider adapter 边界、Recovery 重试/处置能力与 exact permission requirement，再进入 Backend/Admin 实现。

## Backend

状态：todo

范围：实现 Refund 与 RefundRecovery 的管理 application service、Provider 结果处理、幂等、状态转换、Recovery Wallet debit 与失败保留；不得使用 Wallet Adjustment 代替正常 RefundRecovery。

Stage / 工件 / Gate：`database/v2/migrations/0900_commerce.sql` 已有 `commerce_refunds` 与 `commerce_refund_recoveries`，并有 Wallet/Ledger 物理约束；但当前没有 Commerce backend module、退款管理 API、Provider adapter 实现报告或 Backend Gate。[开发进度](/development/DEVELOPMENT_PROGRESS) 仍为 Commerce `NOT_STARTED`。

下一步：正式 Commerce Implementation 中实现 Refund/Recovery service、Provider/Wallet 协作与失败/重放测试，再形成真实 Backend Gate。

## Admin

状态：todo

范围：未来页面应分开展示 Refund 与 RefundRecovery 的状态、金额、Provider/Payment 关联、失败原因和受控操作，不能把“退款成功”显示成“Coins 必然已经回收”。

Stage / 工件 / Gate：[Admin 页面清单](/admin/pages) 当前没有 Refund / Recovery 正式页面，`/commerce` 只是 DomainPlaceholder；`admin_pages` 因此保持空，也不存在本 Feature Admin Stage / Gate。[Operations RBAC Contracts](/development/04-operations/OPERATIONS_RBAC_CONTRACTS) 明确 Commerce 权限必须由 Owner Domain 后续注册，当前没有任何 `commerce.*` permission。

下一步：先冻结 Commerce refund management API + exact permission，再建立真实 Admin 页面、稳定 `page_id`、权限 guard、确认 UX 与 Audit，并创建对应 Stage / Gate。

## Mobile

状态：na

不适用：本 Feature 是运营侧退款 / 回收控制面；用户侧订单或退款状态展示属于另外的用户 Feature，不在本页伪造 Mobile 交付。

## 集成

状态：todo

范围：连接 Operations authorization / audit、Commerce Refund service、外部 Payment Provider adapter 与 Commerce Wallet RefundRecovery；所有 canonical transaction facts 仍由 Commerce 拥有。

Stage / 工件 / Gate：当前 Provider management contract、Commerce management permission、Backend API 与 Admin 页面均未形成，因此没有本 Feature Integration Stage / Gate。

下一步：实现后验证 Provider refund succeeded → Refund succeeded → Recovery 独立执行的完整链路，以及 Recovery failed 时真实异常不被覆盖。

## 验收

状态：todo

范围：验证退款金额与原 Payment 约束、V1 全额退款规则、Provider 幂等、Refund / RefundRecovery 独立状态、余额不足时 Recovery failure 事实保留、Ledger `refund_recovery` 正确且不与 `wallet_adjustment` 混用。

Stage / 工件 / Gate：当前没有 Feature Acceptance Stage / Gate。

下一步：Backend、Admin 与 Provider/Wallet Integration 完成后执行状态机、幂等、失败恢复、权限和端到端验收。
