---
feature_id: wallet-balance
title: Coin 钱包余额
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

# Coin 钱包余额

## 功能概览

Portfolio Status：`active`。

向用户提供当前 Coin 余额。Commerce canonical 中 `Wallet.balance` 是当前余额的高效读取快照；它不是唯一账务事实。为什么余额发生变化必须由 append-only `Wallet Ledger` 解释，因此 Wallet 与 Wallet Ledger 必须保持职责分离。

## 设计

状态：done

**Scope**

定义 V1 单资产 Coin Wallet 的读取与余额不变量：一个用户一个 Wallet，`balance >= 0`；所有 Coin 增减必须经过统一 Wallet Service，并在同一事务中产生对应 Ledger Entry。当前不包含多资产、available / locked / bonus / paid 分桶、冻结余额或提现余额。

**Stage / Artifact**

当前有效设计工件为 [Commerce](/domains/commerce/)、[钱包与账本](/domains/commerce/wallet) 与 [数据设计](/domains/commerce/database)。16-table canonical 已冻结，`commerce_wallets` 定义 `user_id / balance / version`；`database/v2/migrations/0900_commerce.sql` 已包含对应物理迁移。

**Gate / Evidence**

设计完成证据是 frozen Wallet contract 与 migration 定义；canonical 明确要求正常业务不得只修改 `wallets.balance` 而不写 Ledger。Stage Registry 仍是较早快照，本页不伪造新的 `COMMERCE_DESIGN_GATE` PASS。

**Next Action**

Backend 必须先建立统一 Wallet Service 和事务规则，再开放余额读取 API；任何购买、赠礼、奖励、退款回收路径都不得绕过 Wallet Service 直接更新余额。

## Backend

状态：todo

**Scope**

实现当前用户 Wallet 的创建 / 获取、余额读取及统一 Wallet mutation 内核所需的锁、幂等、余额校验和版本 / 并发控制；对外余额读取只返回 Wallet 当前快照，不将 Ledger 聚合结果临时当作替代实现。

**Stage / Artifact**

当前 `apps/backend/src/modules` 没有 Commerce 模块，也未发现 Wallet Service、Wallet Repository、余额 API 或相关测试。现有 `commerce_wallets` migration 只是持久化结构。

**Gate / Evidence**

没有 `COMMERCE_BACKEND_GATE` PASS 或 Wallet runtime 证据，保持 `todo`。schema 已存在不等于 Wallet Service 或余额读取 Feature 已完成。

**Next Action**

实现一个用户一个 Wallet 的获取 / 初始化策略、事务锁定与余额读取 API，并用并发 / 幂等测试证明所有 mutation 同时写 Wallet + Ledger。

## Admin

状态：na

**Scope**

本 Feature 只提供用户自己的 Coin 余额，不包含运营侧 Wallet Adjustment、人工加减币或用户钱包后台查询。

**Stage / Artifact**

`admin_pages: []`；F16 不产生 Admin 页面或 Admin Stage 工件。

**Gate / Evidence**

钱包运营操作属于独立 Commerce Admin Feature，本 F16 不借用其权限或审计证据，因此本 Lane 为 `na`。

**Next Action**

无；任何未来后台余额纠正都必须走独立 Adjustment / Reversal 事实，不能在本 Feature 增加“直接改余额”能力。

## Mobile

状态：todo

**Scope**

读取并展示服务端 canonical Wallet Balance，并在购买 / 赠礼等资产变化后通过受控刷新获得新余额；客户端不得自行累加本地交易推导 canonical balance。

**Stage / Artifact**

当前 `mobile_pages: []`，没有本 Feature 的 Mobile 钱包页面、余额组件或 Commerce API 接入工件。

**Gate / Evidence**

没有 Mobile 实现或真实余额读取证据，保持 `todo`。

**Next Action**

余额 API 稳定后实现加载 / 空态 / 错误态、刷新策略与资产变化后的重新获取，避免用本地 optimistic 数值覆盖服务端 canonical balance。

## 集成

状态：todo

**Scope**

联通 Wallet Backend 与 Mobile，并验证所有资产来源通过统一 Wallet Service 改变余额。对 Coin 购买而言，必须由成功 Order Fulfillment 产生 Wallet Credit + Ledger，而不是 Payment 直接修改余额。

**Stage / Artifact**

当前只有 frozen Wallet schema / migration，没有 Commerce Runtime、Wallet Service、购买 Fulfillment 或 Mobile 读取链路。

**Gate / Evidence**

没有跨层集成证据，保持 `todo`；支付 Provider 与购买 Runtime 尚未实现，也不能据此证明购买后的余额更新闭环。

**Next Action**

Wallet Service、余额 API 和至少一个真实资产来源完成后联调，验证事务失败不会出现“余额变了但无 Ledger”或“有 Ledger 但余额未变”。

## 验收

状态：todo

**Scope**

验收一个用户只有一个 Coin Wallet、余额永不因正常业务路径变为非法负数，并且每次可观察的余额变化都有唯一 Ledger 事实解释；购买到账必须以 Fulfillment + Wallet/Ledger 为准。

**Stage / Artifact**

当前只有设计与 migration，没有 Wallet runtime、并发测试或 E2E 工件。

**Gate / Evidence**

没有 Wallet Balance acceptance PASS；不能把 `commerce_wallets` 表存在当作余额 Feature 验收完成。

**Next Action**

完成 Backend + Integration 后补余额读取、并发扣 / 加币、幂等重放、事务回滚与购买履约到账场景验收。
