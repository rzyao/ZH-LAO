---
feature_id: send-gift
title: 发送虚拟礼物
portfolio_status: active
domain:
  - commerce
  - identity
  - social
  - chat
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
    - /domains/commerce/gifting
    - /domains/commerce/wallet
    - /governance/design-register
---

# 发送虚拟礼物

## 功能概览

Portfolio Status：`active`。

`send-gift` 是一次以 Coins 支付的虚拟礼物消费 / 转移。Commerce 的 `commerce_gift_sends` 是唯一 authoritative GiftSend business fact；Chat / Social 可以成为触发入口或展示上下文，但不能复制交易事实、扣余额或自行计算权威礼物价格。

必须保持：`Rewards delivery ≠ Commerce gift send`。两者都可能经过 Commerce Wallet，但 Ledger 分别使用 `reward_delivery` 与 `gift_send`，业务事实所有权不同。

## 设计

状态：done

范围：覆盖 Gift 当前可用性与服务端价格校验、sender / receiver / 业务关系前置条件、Wallet 行锁与余额检查、GiftSend Snapshot、Ledger debit、Wallet balance 更新、可选 Outbox，以及成功后的 `succeeded -> reversed` 冲正语义。余额不足、Gift 不可用或关系不允许等失败请求不创建普通 `failed GiftSend`。

Stage / 工件：[礼物 canonical](/domains/commerce/gifting) 冻结了 GiftSend 权威事实与原子事务；[钱包与账本](/domains/commerce/wallet) 冻结了 Wallet / Ledger 不变量、`gift_send` business type 与 Reversal 规则；[设计决策台账](/governance/design-register) D-066 / D-067 / D-071 明确区分 `reward_delivery` 与 `gift_send`。

Gate / Evidence：仓库没有独立 `COMMERCE_DESIGN_GATE` 文件；上述 frozen canonical / design-register 是设计完成证据。[开发进度](/development/DEVELOPMENT_PROGRESS) 同时记录 Commerce Phase=`NOT_STARTED`、Gate=`—`，所以本 Lane `done` 不代表 Backend、Chat/Social 集成或端到端送礼已经实现。

下一步：在 Commerce Implementation Stage 中把该原子事务落实为 Wallet Service + GiftSend application use case，并单独冻结对 Mobile / Chat / Social 暴露的调用契约。

## Backend

状态：todo

范围：实现 GiftSend application service、Gift/Wallet/GiftSend/Ledger repositories、事务与并发控制、幂等 / 错误语义及必要 Outbox；禁止由 Chat、Social、Rewards 或管理员直接改 Wallet。

Stage / 工件 / Gate：`database/v2/migrations/0900_commerce.sql` 已有 `commerce_gifts`、`commerce_wallets`、`commerce_wallet_ledger`、`commerce_gift_sends` 等物理表，但 [开发进度](/development/DEVELOPMENT_PROGRESS) 的 Commerce 仍为 `NOT_STARTED`，`apps/backend/src/modules/` 没有 Commerce module，也没有 GiftSend Backend Stage / Report / Gate。数据库基线不能替代应用实现证据。

下一步：进入 Commerce Backend 后实现原子送礼事务与并发 / 重放测试，形成真实 Backend Gate。

## Admin

状态：na

不适用：用户发送礼物不是 Admin 交付端。礼物定义运营属于 `gift-admin`，账务纠错属于 `wallet-adjustment-admin`；两者都不得伪造成“管理员代替用户发送 GiftSend”。`admin_pages` 保持空。

## Mobile

状态：todo

范围：提供选择 Gift、确认接收者 / 数量并提交送礼意图的用户交互；客户端显示价格但不作为权威价格来源，也不在本地先行扣减余额。

Stage / 工件 / Gate：当前 `mobile_pages: []`，仓库没有 GiftSend 的正式 Mobile 页面 / Stage / Gate，也没有可消费的 Commerce GiftSend API。

下一步：待 Backend contract 冻结后创建真实送礼页面 / 入口，并对余额不足、礼物下架、关系不允许、重复请求等服务端结果实现明确 UX。

## 集成

状态：todo

范围：连接 Identity sender/receiver、必要的 Social 关系公开事实、可能的 Chat / Social 触发入口，以及 Commerce 成功事实的展示 / 通知；Commerce 始终拥有 GiftSend 与 Wallet Mutation。

Stage / 工件 / Gate：[设计决策台账](/governance/design-register) D-014 明确 Chat 与礼物的具体集成仍为 deferred，当前 Chat 不存在 Gift message canonical model；[开发进度](/development/DEVELOPMENT_PROGRESS) 中 Chat 与 Commerce 均未进入完成 Gate。因此当前没有可引用的 `send-gift` Integration Stage / Gate，不制造 Chat GiftMessage、Receipt、Rewards Delivery 等替代契约。

下一步：先完成 Commerce GiftSend Backend，再由 Owner Domains 明确触发 / 展示 contract，随后做跨域联调；任何 Rewards 集成继续使用 `reward_delivery`，不得复用 `gift_send`。

## 验收

状态：todo

范围：验证成功送礼的 GiftSend + Ledger debit + Wallet balance 在同一事务成立；验证并发不会双花、失败请求不落成功交易、Snapshot 不随 Catalog 改价回算、Reversal 不修改原 Ledger，并验证 Rewards Delivery 与 GiftSend 事实不会串用。

Stage / 工件 / Gate：当前没有 Feature Acceptance Stage / Gate；Commerce Backend、Mobile 与跨域集成都未形成可验收实现。

下一步：上述 Lane 完成后执行数据库不变量、API、并发、跨端 E2E 与跨域边界验收。
