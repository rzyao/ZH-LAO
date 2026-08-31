---
feature_id: coin-pack-catalog
title: Coin Pack 商品目录
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

# Coin Pack 商品目录

## 功能概览

Portfolio Status：`active`。

面向用户展示当前可购买的 Coin Pack。Commerce canonical 将 Coin Pack 明确定义为 `Product + ProductPrice + CoinPack`：Product 表达真钱商品，ProductPrice 表达销售渠道、币种与真钱价格，CoinPack 表达基础 Coins 与赠送 Coins。Gift、优惠券 / Promotion、后台商品管理不属于本 Feature。

## 设计

状态：done

**Scope**

定义 Coin Pack 商品目录的 canonical 读取语义：只暴露可售 `coin_pack` Product、当前销售渠道 / 币种下有效 ProductPrice，以及 `coin_amount + bonus_coin_amount`。历史交易价格由 OrderItem Snapshot 固化，目录改价不得回写历史订单。

**Stage / Artifact**

当前有效设计工件为 [Commerce](/domains/commerce/)、[购买、支付与退款](/domains/commerce/purchase-and-payment) 与 [数据设计](/domains/commerce/database)。Commerce canonical 已标记 `frozen`，16-table 模型中目录事实由 `commerce_products`、`commerce_product_prices`、`commerce_coin_packs` 承载；仓库同时已有物理迁移工件 `database/v2/migrations/0900_commerce.sql`。

**Gate / Evidence**

设计完成证据是当前 frozen canonical + 已落库的迁移定义，不把迁移文件存在解释为 Backend API 已实现。`docs/docs/development/workflow/AI_STAGE_REGISTRY.json` 仍是较早 `source_head` 的快照，保留旧的 Commerce Domain 阻塞描述，因此本页不伪造新的 `COMMERCE_DESIGN_GATE` PASS 文案，以最新 canonical contract 作为 Feature 设计事实。

**Next Action**

进入 Backend 时实现只读 Catalog Query/API，并以渠道、币种、有效期和商品状态过滤可售 Coin Pack；不得把 Gift 或未来 Promotion 模型并入 Coin Pack 目录。

## Backend

状态：todo

**Scope**

实现 Coin Pack 列表 / 详情读取所需的 Repository、Service、API 与错误语义，仅组合 Product、ProductPrice、CoinPack 三类事实。

**Stage / Artifact**

当前没有 Commerce Backend 模块、Catalog Service、Route 或相关测试；`apps/backend/src/modules` 当前只包含已存在的其他领域模块。现阶段可执行输入是 frozen Commerce canonical 与 `0900_commerce.sql`，尚无 F16 Backend 实现工件。

**Gate / Evidence**

没有 `COMMERCE_BACKEND_GATE` PASS、Catalog API 测试或运行时代码证据，因此保持 `todo`。数据库 schema / migration 不等价于 Catalog Backend 完成。

**Next Action**

建立 Commerce Backend 边界后，优先实现 active Coin Pack 查询、价格有效期 / channel / currency 过滤与契约测试，再决定是否进入 Mobile 集成。

## Admin

状态：na

**Scope**

本 Feature 只描述用户侧 Coin Pack 目录消费，不承担商品 / 价格运营后台。

**Stage / Artifact**

`admin_pages: []`；F16 不产生 Admin 页面或 Admin Stage 工件。

**Gate / Evidence**

Admin 交付属于独立 Commerce Admin Feature，不在本 F16 范围，因此本 Lane 为 `na`，不借用其他 Feature 的 Admin 证据。

**Next Action**

无；如需商品 / 价格后台能力，在对应独立 Admin Feature 中推进。

## Mobile

状态：todo

**Scope**

展示 Coin Pack、真钱价格、基础 Coins / bonus Coins，并把用户选择传给后续购买流程；不在客户端决定商品是否有效或重算 canonical 价格。

**Stage / Artifact**

当前 `mobile_pages: []`，仓库没有本 Feature 的 Mobile 页面 / 状态管理 / API 接入工件。

**Gate / Evidence**

没有 Mobile 实现或验收证据，保持 `todo`；Mobile 不应仅凭本地静态列表宣称目录完成。

**Next Action**

等待 Catalog Backend 契约后实现真实 API 驱动的 Coin Pack 展示、加载 / 空态 / 错误态和渠道价格显示。

## 集成

状态：todo

**Scope**

联通 Commerce Catalog Backend 与 Mobile，验证销售渠道、币种、有效价格及 CoinPack 权益字段的一致性。`provider_product_id` 只是价格模型中的外部商品映射字段，不代表支付 Provider 已接入。

**Stage / Artifact**

当前只有 canonical schema / migration 级契约，没有运行时 Catalog API 与 Mobile 调用链。

**Gate / Evidence**

没有跨层集成测试或真实运行证据，保持 `todo`；本 Feature 也不以支付 Provider 是否接通作为“目录设计完成”的替代证据。

**Next Action**

Backend 与 Mobile 都具备后进行真实 channel/currency 场景联调，并验证目录改价不会污染历史 OrderItem Snapshot。

## 验收

状态：todo

**Scope**

验收用户能看到当前可售 Coin Pack 及正确真钱价格 / Coins 数量，并且下架、过期或错误渠道价格不会暴露。

**Stage / Artifact**

当前仅有设计与数据模型证据，没有用户路径 E2E 工件。

**Gate / Evidence**

没有 F16 Coin Pack Catalog acceptance PASS；frozen canonical 与 migration 只能证明设计 / 数据约束存在。

**Next Action**

在 Backend + Mobile + Integration 完成后补契约测试与端到端验收，覆盖 active/inactive、有效期、channel、currency 与价格变更场景。
