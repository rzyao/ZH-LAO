---
feature_id: wallet-history
title: 钱包账本 / 资产变动历史
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
    - /domains/commerce/wallet
    - /domains/commerce/database
---

# 钱包账本 / 资产变动历史

## 功能概览

Portfolio Status：`active`。

本 Feature 面向用户展示 Coin 资产变动历史。`Wallet` 与 `Wallet Ledger` 不是同一个事实：Wallet 保存当前余额快照；`commerce_wallet_ledger` 是解释每次资产变化的 append-only canonical fact。Order / Payment 则分别属于购买意图和真钱支付事实，不应被账本替代。

## 设计

状态：done

**Scope**

定义 Wallet Ledger 的用户历史语义：每个 Entry 记录 `amount`、`balance_before`、`balance_after`、`business_type`、`business_id`、`idempotency_key` 与时间。Ledger 正常业务只 INSERT，不 UPDATE / DELETE；业务来源可包括 `order_fulfillment`、`reward_delivery`、`gift_send`、`wallet_adjustment`、`wallet_reversal`、`refund_recovery`。

**Stage / Artifact**

当前有效设计工件为 [Commerce](/domains/commerce/)、[钱包与账本](/domains/commerce/wallet) 与 [数据设计](/domains/commerce/database)。16-table canonical 已冻结，`commerce_wallet_ledger` 的余额连续性、业务唯一性与幂等约束已定义；`database/migrations/0900_commerce.sql` 已包含对应物理迁移。

**Gate / Evidence**

设计证据明确规定 Ledger 是 append-only 资产变化事实，`balance_after = balance_before + amount`，且同一 Wallet 的业务来源 / 幂等键不能重复。Stage Registry 仍是较早 `source_head` 快照，本页不伪造新的 `COMMERCE_DESIGN_GATE` PASS，以最新 frozen canonical 作为 Feature 设计事实。

**Next Action**

Backend 实现统一 Wallet mutation 与 Ledger 查询时，必须保持 Ledger 不可变性、来源可追踪性与分页顺序稳定；不要引入万能 transaction 表或通过修改旧 Entry“纠错”。

## Backend

状态：todo

**Scope**

实现 Wallet Ledger 写入内核与当前用户账本列表 / 详情读取。写入只能由统一 Wallet Service 在同一事务中伴随 Wallet Balance 变化完成；读取应按稳定时间 / ID 顺序分页，并安全映射业务来源供客户端展示。

**Stage / Artifact**

当前 `apps/backend/src/modules` 没有 Commerce 模块，也未发现 Wallet Service、Ledger Repository、账本查询 API 或测试。现有 `commerce_wallet_ledger` schema / migration 仅提供持久化与约束输入。

**Gate / Evidence**

没有 `COMMERCE_BACKEND_GATE` PASS、Ledger runtime 或 append-only 行为测试证据，因此保持 `todo`。数据库约束存在不等于账本写入 / 查询 Feature 已实现。

**Next Action**

先实现 Wallet Service 的原子 `credit / debit / reverse / applyEntry` 路径，再实现用户账本分页读取；补重复业务来源、重复幂等键、余额连续性、并发与禁止直接余额修改的测试。

## Admin

状态：na

**Scope**

本 Feature 只负责用户查看自己的资产变动历史，不包含运营侧 Wallet Adjustment / Reversal 操作、审计后台或人工账务处理。

**Stage / Artifact**

`admin_pages: []`；F16 不产生 Admin 页面或 Admin Stage 工件。

**Gate / Evidence**

运营账务操作属于独立 Commerce Admin Feature，本 F16 不借用其权限、审计或操作页面证据，因此本 Lane 为 `na`。

**Next Action**

无；后台纠错能力应通过独立 Adjustment / Reversal 事实推进，不能允许后台直接 UPDATE Ledger 或 Wallet Balance。

## Mobile

状态：todo

**Scope**

展示当前用户的 Coin 资产变动列表，包括增减方向、数量、余额结果、时间与可安全呈现的业务来源。Mobile 只消费服务端账本视图，不在本地生成 canonical Ledger。

**Stage / Artifact**

当前 `mobile_pages: []`，没有本 Feature 的 Mobile 账本页面、分页状态或 Commerce API 接入工件。

**Gate / Evidence**

没有 Mobile 实现或用户账本读取证据，保持 `todo`。

**Next Action**

Ledger Query API 稳定后实现分页 / 刷新 / 空态 / 错误态和业务来源文案映射，并避免把 Order / Payment 状态混进 Ledger Entry 模型。

## 集成

状态：todo

**Scope**

验证所有真实资产来源最终都经 Wallet Service 生成唯一 Ledger Entry，并联通账本查询与 Mobile。Coin 购买只在 Order Fulfillment 成功后产生 `order_fulfillment` Credit；Payment 本身不是 Ledger Entry。

**Stage / Artifact**

当前只有 frozen Wallet/Ledger schema 与 migration，没有 Commerce Runtime、Wallet mutation producer、真实支付 Provider 或 Mobile 账本链路。

**Gate / Evidence**

没有跨层集成证据，保持 `todo`。尤其支付设计 / 表结构完成不能证明购买已经产生真实 `order_fulfillment` Ledger。

**Next Action**

至少完成购买 Fulfillment 或其他真实 Wallet mutation producer 后联调，证明重放不会重复记账，事务失败不会产生半完成的 Wallet / Ledger 状态。

## 验收

状态：todo

**Scope**

验收账本历史按用户隔离、不可篡改、顺序稳定、余额连续，且每次资产变化可追溯到唯一业务来源；Wallet 当前余额应与最后一笔有效 Ledger 的资产演进一致。

**Stage / Artifact**

当前只有设计与 migration，没有 Ledger Runtime、查询 API、Mobile 页面或 E2E 工件。

**Gate / Evidence**

没有 Wallet Ledger / History acceptance PASS；append-only DDL 约束与 canonical 文档不能替代运行时验收。

**Next Action**

Backend + Integration 完成后覆盖 credit/debit、重复幂等请求、并发 mutation、reversal、退款回收、购买履约入账与分页读取的端到端验收。
