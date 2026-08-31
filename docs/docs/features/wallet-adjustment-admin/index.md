---
feature_id: wallet-adjustment-admin
title: 钱包 Adjustment / Reversal 后台
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

# 钱包 Adjustment / Reversal 后台

## 功能概览

Portfolio Status：`active`。

`wallet-adjustment-admin` 是运营侧账务纠错能力。Adjustment 用于没有自然业务来源的主动纠正；Reversal 用于对一笔既有 Wallet Ledger Entry 做严格反向冲正。它们都不能变成“直接改余额”的后门，也不能替代 GiftSend、RewardDelivery、Order Fulfillment 或 RefundRecovery 等有自然业务来源的资产变化。

## 设计

状态：todo

范围：未来管理能力必须保持 Adjustment 与 Reversal 两套语义：Adjustment 可正可负但必须产生独立成功事实与 Ledger；Reversal 金额必须为原 Ledger 的相反数、同一原 Ledger 最多一次、不允许冲正 Reversal、V1 不支持部分冲正。所有动作均经统一 Wallet Service 执行。

Stage / 工件 / Gate：[钱包与账本](/domains/commerce/wallet) 与 [Commerce 数据库最终模型](/domains/commerce/database) 已冻结 `commerce_wallet_adjustments`、`commerce_wallet_reversals` 及 Ledger 不变量；[设计决策台账](/governance/design-register) D-064 / D-065 / D-066 也冻结了统一 Wallet 入口与 business_type。但 Admin 用例、原因/备注输入规范、审批边界、API 与 exact permission 尚未定义。[开发进度](/development/DEVELOPMENT_PROGRESS) 中 Commerce=`NOT_STARTED`、Gate=`—`，因此本 Feature Design 仍为 `todo`。

下一步：Commerce Owner Domain 先冻结 Adjustment / Reversal 管理 Use Case、输入/校验、操作权限与 Audit context，再进入实现；不得根据表结构自行发明管理 API。

## Backend

状态：todo

范围：实现受控 Adjustment / Reversal application service、Wallet row lock、Ledger append、余额不变量、原 Ledger 校验、幂等与并发保护；管理员没有任何直接 `UPDATE commerce_wallets.balance` 的接口。

Stage / 工件 / Gate：`database/v2/migrations/0900_commerce.sql` 已有 Wallet、Ledger、Adjustment、Reversal 物理表与约束，但当前 Backend 没有 Commerce module、Wallet Service 实现或管理 API；[开发进度](/development/DEVELOPMENT_PROGRESS) 没有 Commerce Implementation Report / Gate。

下一步：在 Commerce Backend Stage 中实现统一 Wallet mutation service 与 Adjustment/Reversal 用例，并用 PostgreSQL integration / race tests 证明一次冲正、余额锁定与 append-only 规则。

## Admin

状态：todo

范围：未来页面应允许授权 Operator 检索 Wallet/Ledger，并通过明确的 Adjustment 或 Reversal 操作提交账务纠正；UI 必须展示操作影响和目标 Ledger，不提供任意余额编辑框。

Stage / 工件 / Gate：[Admin 页面清单](/admin/pages) 当前没有 Wallet Adjustment / Reversal 正式页面，`/commerce` 仅是 DomainPlaceholder；`admin_pages` 保持空，也不存在该 Feature Admin Stage / Gate。[Operations RBAC Contracts](/development/04-operations/OPERATIONS_RBAC_CONTRACTS) 禁止提前发明 Future Domain permission，当前 Operations code catalog 没有 `commerce.*` key。

下一步：Commerce 冻结 exact management permissions 与 API 后，再更新 Operations catalog、建立真实 Admin Page / `page_id`、确认高风险操作 UX 与 Operator Audit，并形成 Admin Gate。

## Mobile

状态：na

不适用：Adjustment / Reversal 是运营账务控制面，不是用户 Mobile 功能。

## 集成

状态：todo

范围：连接 Admin → Operations authorization → Commerce Wallet Service → Commerce Ledger / Adjustment / Reversal → Operations Audit；Owner Domain 决定账务语义，Operations 只决定谁可执行并记录谁执行了成功动作。

Stage / 工件 / Gate：Operations 通用 RBAC/Audit 已完成，但没有 Commerce exact permission 与 Wallet management contract；Commerce Implementation 未开始，所以不存在本 Feature Integration Stage / Gate。

下一步：实现后联调授权、Wallet transaction、Ledger append 与成功 Audit，并验证权限拒绝或业务失败不会产生伪成功账务 / 审计结果。

## 验收

状态：todo

范围：验证 Adjustment 与 Reversal 不混用、所有余额变化都有 Ledger、原 Ledger 不修改/删除、Reversal 严格一次且全额反向、并发不会重复冲正、余额不变式成立；同时验证 `reward_delivery`、`gift_send`、`refund_recovery` 等自然业务来源不会被错误包装为 `wallet_adjustment`。

Stage / 工件 / Gate：当前没有 Feature Acceptance Stage / Gate。

下一步：Backend、Admin、Integration 完成后执行数据库约束、并发、权限、Audit 与端到端账务验收。
