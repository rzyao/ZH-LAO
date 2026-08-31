---
feature_id: gift-catalog
title: 礼物目录
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
    - /domains/commerce/gifting
    - /domains/commerce/database
---

# 礼物目录

## 功能概览

Portfolio Status：`active`。

`gift-catalog` 向用户提供当前可消费的虚拟礼物目录。权威礼物定义属于 Commerce：Gift 使用 Coins 消费，当前价格由服务端的 `coin_cost` 决定；Gift 与使用真钱购买的 Product / ProductPrice 是两个不同模型。礼物目录也不代表奖励发放：`reward_delivery` 与 `gift_send` 是两种不同的 Wallet Ledger 业务来源。

## 设计

状态：done

范围：定义可展示 Gift 的当前目录语义，包括 `code / name / description / coin_cost / image_asset_id / status / sort_order`，并明确客户端不能提交一个可被信任的最终礼物价格。目录只表达“现在可选什么”，历史送礼价格由 GiftSend Snapshot 保留，不能用当前 Catalog 回算历史交易。

Stage / 工件：[礼物 canonical](/domains/commerce/gifting) 与 [Commerce 16 表最终模型](/domains/commerce/database) 已冻结；`commerce_gifts` 是 Gift 当前定义，Gift 不经 `product_id` 依赖真钱商品。

Gate / Evidence：当前仓库没有独立 `COMMERCE_DESIGN_GATE` 文件；设计完成证据使用上述 frozen canonical 与 [设计决策台账](/governance/design-register) 中 D-068 / D-069 / D-076。与此同时 [开发进度](/development/DEVELOPMENT_PROGRESS) 仍记录 Commerce Phase=`NOT_STARTED`、Gate=`—`，因此这里的 `done` 只表示该 Feature 的领域设计事实已定稿，不代表 Commerce Implementation 已开始或通过 Gate。

下一步：Commerce Backend 启动时，基于该 frozen Catalog 语义定义只返回可消费 Gift 的查询 Use Case / API，并保持服务端价格权威。

## Backend

状态：todo

范围：提供 Gift Catalog 的读取能力，至少执行 Gift 状态过滤、稳定排序、Coin 价格与 Asset logical ID 输出；不得把 Product / ProductPrice 当成 Gift 的价格来源。

Stage / 工件 / Gate：数据库基线已有 `database/v2/migrations/0900_commerce.sql` 中的 `commerce_gifts`，PostgreSQL Baseline 已 PASS；但 [开发进度](/development/DEVELOPMENT_PROGRESS) 仍为 Commerce=`NOT_STARTED`，`apps/backend/src/modules/` 当前没有 Commerce module，也没有 Gift Catalog Backend Stage / API / Gate。数据库表存在不是 Backend 完成证据。

下一步：在正式 Commerce Implementation Stage 中建立 Commerce module、Catalog query service / repository / HTTP contract 与测试，再产生对应 Backend Gate 证据。

## Admin

状态：na

不适用：本 Feature 是用户侧礼物目录消费能力。礼物定义的运营维护属于独立 `gift-admin`，不在这里复用或伪造 Admin Lane；因此 `admin_pages` 保持空。

## Mobile

状态：todo

范围：展示可用礼物、Coin 价格与图片，并把用户选择交给发送礼物流程；Mobile 不自行决定权威价格或礼物可用性。

Stage / 工件 / Gate：当前 `mobile_pages: []`，仓库没有该 Feature 的正式 Mobile 页面 / Stage / Gate；Mobile Foundation 的 PASS 仅是客户端基础设施完成，不是 Gift Catalog 交付证据。

下一步：待 Commerce Catalog API 冻结后创建真实 Mobile 页面与 API 集成，并登记稳定 `mobile_pages` ID。

## 集成

状态：todo

范围：连接 Commerce Gift Catalog 与 Asset 展示、Identity 用户上下文及后续 GiftSend 入口；跨域只消费公开 logical/public contract，不复制他域事实。

Stage / 工件 / Gate：当前没有 `gift-catalog` 集成 Stage / Gate。Gift 的 `image_asset_id` 仅是 Asset logical UUID；不存在以 Rewards Delivery 替代 Gift Catalog / GiftSend 的契约。

下一步：Backend 与 Mobile 均形成可执行契约后，再建立 Catalog 读取与发送入口之间的集成测试和错误传播约定。

## 验收

状态：todo

范围：验证只返回可消费礼物、排序与展示字段正确、Coin 价格来自服务端权威数据、Product/Gift 边界不被破坏，并验证下架或改价不会回算历史 GiftSend Snapshot。

Stage / 工件 / Gate：当前没有 Feature Acceptance Stage / Gate；Commerce Implementation 尚未开始。

下一步：待 Backend、Mobile、Integration 形成真实完成证据后编写端到端验收用例并执行 Gate。
