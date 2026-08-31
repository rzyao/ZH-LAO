---
feature_id: gift-admin
title: 礼物后台管理
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

# 礼物后台管理

## 功能概览

Portfolio Status：`active`。

`gift-admin` 负责运营侧维护当前 Gift 定义，最终影响用户侧 `gift-catalog` 可看到什么。它管理的是用 Coins 消费的 Gift，不管理真钱 Product / ProductPrice，也不代表发送 GiftSend，更不包含 Creator Earnings、Withdrawal、Settlement 或 Rewards Delivery。

## 设计

状态：todo

范围：未来管理能力应围绕 `commerce_gifts` 的 code/name/description/coin_cost/image_asset_id/status/sort_order 等当前目录事实展开；任何改名、换图、改价只影响未来目录与交易，不能修改历史 `commerce_gift_sends` 的 Snapshot。

Stage / 工件 / Gate：[礼物 canonical](/domains/commerce/gifting) 与 [Commerce 数据库最终模型](/domains/commerce/database) 已冻结 Gift 当前定义与 GiftSend 历史边界；V1 明确没有 Gift Inventory、独立动态价格历史、Creator Earnings / Withdrawal / Settlement。但当前没有 Gift 管理 Use Case、Admin API、状态操作规则或 exact permission 的正式设计。[开发进度](/development/DEVELOPMENT_PROGRESS) 中 Commerce=`NOT_STARTED`、Gate=`—`，因此本 Feature Design 保持 `todo`。

下一步：由 Commerce Owner Domain 先冻结 Gift 管理命令/查询、状态变更、Asset 引用校验、价格修改语义与 exact permission requirement；不要把 `commerce_gifts` 表本身当成完整 Admin 设计。

## Backend

状态：todo

范围：实现 Gift 定义的运营查询和受控 mutation service / repository，包括唯一 code、正数 `coin_cost`、状态、排序与 Asset logical reference 校验；任何管理操作不得改写历史 GiftSend Snapshot。

Stage / 工件 / Gate：`database/migrations/0900_commerce.sql` 已有 `commerce_gifts` 及其约束，但当前 `apps/backend/src/modules/` 没有 Commerce module、Gift management service/API 或 Backend Gate。[开发进度](/development/DEVELOPMENT_PROGRESS) 仍记录 Commerce `NOT_STARTED`。

下一步：在 Commerce Implementation Stage 中实现 Gift management API 与测试，并形成真实 Backend Gate。

## Admin

状态：todo

范围：未来页面用于 Gift 列表、详情、创建/编辑、启停/归档、排序与图片 Asset 选择；页面必须明确当前 Coin cost 与状态，不允许修改历史 GiftSend 交易事实。

Stage / 工件 / Gate：[Admin 页面清单](/admin/pages) 当前没有 Gift 管理正式页面，实际 `/commerce` 仅为 DomainPlaceholder；所以 `admin_pages` 保持空，也没有可引用的该 Feature Admin Stage / Gate。[Operations RBAC Contracts](/development/04-operations/OPERATIONS_RBAC_CONTRACTS) 要求 Commerce Owner Domain 后续提供 exact permission，当前 Operations permission catalog 没有 `commerce.*`。

下一步：Commerce 冻结 Gift management API / exact permission 后，更新 Operations catalog，再创建真实 Admin 页面、稳定 `page_id`、权限 guard、mutation confirm 与 Audit，并建立对应 Stage / Gate。

## Mobile

状态：na

不适用：本 Feature 是运营端 Gift 定义管理；用户侧礼物浏览与发送分别属于 `gift-catalog` 与 `send-gift`。

## 集成

状态：todo

范围：连接 Admin UI、Operations authorization / audit、Commerce Gift management API 与 Asset logical reference；Gift Admin 只改变当前 Catalog，不触发 GiftSend，也不使用 Rewards Delivery 作为礼物交易事实。

Stage / 工件 / Gate：Commerce management API、exact permission 和真实 Admin 页面均不存在，当前没有本 Feature Integration Stage / Gate。

下一步：实现后验证 Gift 变更可被 Catalog 正确读取、历史 GiftSend Snapshot 不变、权限与 Audit 生效，并验证 Gift 与 Product / Rewards 边界没有串线。

## 验收

状态：todo

范围：验证 Gift code/price/status/sort/Asset 规则、启停后的 Catalog 可见性、改名改价不回写历史 GiftSend、无 Gift Inventory / Earnings / Settlement 越界，以及 Operations 权限与 Audit 正确。

Stage / 工件 / Gate：当前没有 Feature Acceptance Stage / Gate。

下一步：Backend、Admin 与 Integration 完成后建立并执行功能、权限、历史一致性与端到端验收。
