---
feature_id: commerce-catalog-admin
title: 商品与价格后台管理
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

# 商品与价格后台管理

## 功能概览

Portfolio Status：`active`。

`commerce-catalog-admin` 负责运营侧维护真钱商品与价格，即 Commerce 的 Product / ProductPrice（V1 实际购买商品主要是 Coin Pack）。它不维护 Gift：Gift 是用 Coins 消费的独立目录，礼物定义由 `gift-admin` 负责。

## 设计

状态：todo

范围：未来管理能力应围绕 Product 的 code/type/name/description/status/sort、ProductPrice 的 channel/currency/amount/provider product/status/有效期，以及 Coin Pack 对应的 coin / bonus coin 配置展开；历史 OrderItem Snapshot 不得被当前 Catalog 修改回算。

Stage / 工件 / Gate：[购买、支付与退款](/domains/commerce/purchase-and-payment) 与 [Commerce 数据库最终模型](/domains/commerce/database) 已冻结 Product / ProductPrice / CoinPack 业务事实，但它们没有定义完整的运营管理 Use Case、Admin API 或 exact permission keys。[开发进度](/development/DEVELOPMENT_PROGRESS) 记录 Commerce=`NOT_STARTED`、Gate=`—`，当前没有 `commerce-catalog-admin` Design Stage / Gate。

下一步：由 Commerce Owner Domain 先冻结商品 / 价格管理动作、校验、并发与 API contract，再按 Operations 规范注册 exact Commerce permissions；在这些事实形成前不把领域表设计写成 Admin Feature 设计完成。

## Backend

状态：todo

范围：实现 Product / ProductPrice / CoinPack 的管理查询与 mutation service、Repository、校验、审计所需 target/result context，并确保价格变更只影响未来交易。

Stage / 工件 / Gate：`database/migrations/0900_commerce.sql` 已包含 `commerce_products`、`commerce_product_prices`、`commerce_coin_packs`，但 `apps/backend/src/modules/` 当前没有 Commerce module；[开发进度](/development/DEVELOPMENT_PROGRESS) 没有 Commerce Implementation Stage / Report / Gate。物理表存在只是数据库基线，不是 Backend 管理 API 证据。

下一步：在 Commerce Design/Implementation 授权后实现 owner-domain management API 与测试，并产生真实 Backend Gate。

## Admin

状态：todo

范围：未来页面用于商品 / 价格检索、查看与受控变更，所有 mutation 必须先通过 Operations exact permission authorization，再由 Commerce 解释业务动作并在成功后记录 Operator audit。

Stage / 工件 / Gate：[Admin 页面清单](/admin/pages) 当前没有商品 / 价格正式页面，只记录 `/commerce` 为 Domain 占位页；因此 `admin_pages` 保持空，也没有可链接的该 Feature Admin Stage / Gate。[Operations RBAC Contracts](/development/04-operations/OPERATIONS_RBAC_CONTRACTS) 明确 Future Domain 的 Commerce exact keys 不得提前发明，当前代码 permission catalog 也没有 `commerce.*` key。

下一步：Commerce 先冻结 management capability/API 与 exact permission requirement；随后更新 Operations catalog / super_admin permission set，再创建真实 Admin Page、登记稳定 `page_id` 并建立对应 Admin Stage / Gate。

## Mobile

状态：na

不适用：商品与价格后台管理是运营控制面能力，不是 Mobile 用户端交付。

## 集成

状态：todo

范围：连接 Admin UI → Operations authorization → Commerce owner-domain management API → Operations audit；不得让 Operations 复制或直接修改 Commerce canonical state。

Stage / 工件 / Gate：Operations 已有通用 RBAC/Audit 能力，但没有 Commerce permission / API contract；Commerce 自身仍为 `NOT_STARTED`，所以不存在本 Feature 的 Integration Stage / Gate。

下一步：待 Commerce management contract 与 Admin 页面真实落地后，验证 permission deny/allow、mutation 成功审计、价格历史不回写等跨模块行为。

## 验收

状态：todo

范围：验证商品 / 价格 CRUD 边界、Coin Pack 配置校验、价格时间 / 渠道规则、历史订单 Snapshot 不变、Operations exact permission 与 Audit 生效，并验证 Gift 不被误当成 Product 管理。

Stage / 工件 / Gate：当前没有 Feature Acceptance Stage / Gate。

下一步：Backend、Admin、Integration 完成后建立并执行验收 Gate。
