---
status: frozen
last_updated: 2026-08-30
schema: commerce
source: 设计 Commerce Domain
source_conversation_id: 6a933931-27f8-83ea-9df3-b054d2bca5fe
---

# Commerce 数据库 · Schema V1

Commerce Schema V1 正式定稿为 **16 张业务表**。会话要求：表级与字段级设计一并冻结，后续除非新需求，不再随意加字段或万能表，进入文档 + PostgreSQL migration 阶段。

## 状态：逻辑模型 `frozen`，部分物理约定 `designing`

| 层面 | 状态 | 说明 |
| --- | --- | --- |
| 表清单、字段语义、可空性、默认值、CHECK/UNIQUE、索引意图、状态枚举、业务规则、删除策略 | `frozen` | 可直接作为实现依据 |
| **主键类型（UUID vs `bigint identity`）** | `designing` | 会话用 `uuid`，与全局规范第 3 条及 D-055/ADR-015 冲突，提交主会话裁决 |
| **跨域引用是否建 FK** | `designing` | 会话主张「跨域只存 ID 不建 FK」，与全局规范第 11/12 条及 Chat 复合 FK 现状冲突，提交主会话裁决 |
| `business_id` / `user_id` / `conversation_id` / `image_asset_id` 的物理类型 | `designing` | 依赖上两项裁决（若定 bigint 则这些跨域列需相应改型） |

> 本文下方 DDL 忠实保留会话 V1 原稿（UUID 主键、跨域不建 FK）。**在主会话就上述物理约定裁决前，不得直接把本 DDL 复制执行**，也不得据此改动全局规范或其他四个已用 `bigint identity` 的域。裁决方向参照 [Chat 的 ADR-015](../../adr/ADR-015-chat-naming-and-sql-adjudication.md)「物理偏差回归全局规范」。

## 统一数据库原则（会话版）

```text
主键            uuid（与全局规范冲突，见上表 designing）
时间            timestamptz
真钱金额        bigint amount_minor + currency varchar(3)
Coins           bigint，不使用 currency='COIN'
状态            varchar + CHECK，不使用 PostgreSQL ENUM（与全局规范一致）
扩展字段        jsonb，仅用于非核心扩展
域内关联        FK
跨域关联        会话用「只存 UUID，不建 FK」（与全局规范冲突，见上表 designing）
交易事实        原则上不物理删除
Ledger          append-only
历史价格/权益    Snapshot
所有资产变化    必须经过 Wallet + Ledger
```

## 模块与表清单

```text
Catalog   : commerce_products, commerce_product_prices, commerce_coin_packs, commerce_gifts
Ordering  : commerce_orders, commerce_order_items, commerce_order_fulfillments
Payment   : commerce_payments, commerce_payment_events
Wallet    : commerce_wallets, commerce_wallet_ledger, commerce_wallet_adjustments, commerce_wallet_reversals
Gifting   : commerce_gift_sends
Refund    : commerce_refunds, commerce_refund_recoveries
```

---

## 三、Catalog

### 1. `commerce_products`

```sql
CREATE TABLE commerce_products (
    id              uuid PRIMARY KEY,
    code            varchar(64) NOT NULL,
    product_type    varchar(32) NOT NULL,
    name            varchar(128) NOT NULL,
    description     text NULL,
    status          varchar(24) NOT NULL DEFAULT 'draft',
    sort_order      integer NOT NULL DEFAULT 0,
    metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT uq_commerce_products_code UNIQUE (code),
    CONSTRAINT ck_commerce_products_code CHECK (btrim(code) <> ''),
    CONSTRAINT ck_commerce_products_name CHECK (btrim(name) <> ''),
    CONSTRAINT ck_commerce_products_type
        CHECK (product_type IN ('coin_pack','subscription','boost','consumable')),
    CONSTRAINT ck_commerce_products_status
        CHECK (status IN ('draft','active','inactive','archived')),
    CONSTRAINT ck_commerce_products_metadata CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX idx_commerce_products_active_sort
ON commerce_products (sort_order, id) WHERE status = 'active';
```

V1 实际只用 `product_type = coin_pack`；其余为轻量预留。Gift 不属于 Product。

### 2. `commerce_product_prices`

```sql
CREATE TABLE commerce_product_prices (
    id                  uuid PRIMARY KEY,
    product_id          uuid NOT NULL,
    sales_channel       varchar(32) NOT NULL,
    currency            varchar(3) NOT NULL,
    amount_minor        bigint NOT NULL,
    provider_product_id varchar(191) NULL,
    status              varchar(24) NOT NULL DEFAULT 'inactive',
    starts_at           timestamptz NULL,
    ends_at             timestamptz NULL,
    metadata            jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT fk_commerce_prices_product FOREIGN KEY (product_id)
        REFERENCES commerce_products(id) ON DELETE RESTRICT,
    CONSTRAINT ck_commerce_prices_amount CHECK (amount_minor > 0),
    CONSTRAINT ck_commerce_prices_currency CHECK (currency ~ '^[A-Z]{3}$'),
    CONSTRAINT ck_commerce_prices_channel CHECK (sales_channel IN ('ios','android','web')),
    CONSTRAINT ck_commerce_prices_status CHECK (status IN ('active','inactive','archived')),
    CONSTRAINT ck_commerce_prices_period CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at),
    CONSTRAINT ck_commerce_prices_metadata CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX idx_commerce_prices_lookup
ON commerce_product_prices (product_id, sales_channel, currency, status);
CREATE UNIQUE INDEX uq_commerce_prices_provider_product
ON commerce_product_prices (sales_channel, provider_product_id)
WHERE provider_product_id IS NOT NULL;
```

同一 `product + channel + currency` 同一时间最多一个有效价；**V1 由 Catalog Service 保证时间区间不重叠，不加 EXCLUDE constraint**。

### 3. `commerce_coin_packs`

```sql
CREATE TABLE commerce_coin_packs (
    product_id          uuid PRIMARY KEY,
    coin_amount         bigint NOT NULL,
    bonus_coin_amount   bigint NOT NULL DEFAULT 0,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT fk_commerce_coin_packs_product FOREIGN KEY (product_id)
        REFERENCES commerce_products(id) ON DELETE RESTRICT,
    CONSTRAINT ck_commerce_coin_packs_amount CHECK (coin_amount > 0),
    CONSTRAINT ck_commerce_coin_packs_bonus  CHECK (bonus_coin_amount >= 0)
);
```

不存 `total_coin_amount`（`total = coin_amount + bonus_coin_amount`，下单时再冻结总额）；应用层保证对应 Product 为 `coin_pack`。

### 4. `commerce_gifts`

```sql
CREATE TABLE commerce_gifts (
    id                  uuid PRIMARY KEY,
    code                varchar(64) NOT NULL,
    name                varchar(128) NOT NULL,
    description         text NULL,
    coin_cost           bigint NOT NULL,
    image_asset_id      uuid NULL,
    status              varchar(24) NOT NULL DEFAULT 'draft',
    sort_order          integer NOT NULL DEFAULT 0,
    metadata            jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT uq_commerce_gifts_code UNIQUE (code),
    CONSTRAINT ck_commerce_gifts_code CHECK (btrim(code) <> ''),
    CONSTRAINT ck_commerce_gifts_name CHECK (btrim(name) <> ''),
    CONSTRAINT ck_commerce_gifts_coin_cost CHECK (coin_cost > 0),
    CONSTRAINT ck_commerce_gifts_status CHECK (status IN ('draft','active','inactive','archived')),
    CONSTRAINT ck_commerce_gifts_metadata CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX idx_commerce_gifts_active_sort
ON commerce_gifts (sort_order, id) WHERE status = 'active';
```

`image_asset_id` 是 Media/Asset 域的逻辑引用（是否建 FK 取决于上表 `designing` 裁决）。

---

## 四、Ordering

### 5. `commerce_orders`

```sql
CREATE TABLE commerce_orders (
    id              uuid PRIMARY KEY,
    order_no        varchar(32) NOT NULL,
    user_id         uuid NOT NULL,
    status          varchar(24) NOT NULL DEFAULT 'pending_payment',
    currency        varchar(3) NOT NULL,
    subtotal_minor  bigint NOT NULL,
    discount_minor  bigint NOT NULL DEFAULT 0,
    total_minor     bigint NOT NULL,
    sales_channel   varchar(32) NOT NULL,
    idempotency_key varchar(128) NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    expires_at      timestamptz NULL,
    paid_at         timestamptz NULL,
    cancelled_at    timestamptz NULL,
    refunded_at     timestamptz NULL,

    CONSTRAINT uq_commerce_orders_no UNIQUE (order_no),
    CONSTRAINT uq_commerce_orders_idempotency UNIQUE (user_id, idempotency_key),
    CONSTRAINT ck_commerce_orders_no CHECK (btrim(order_no) <> ''),
    CONSTRAINT ck_commerce_orders_status
        CHECK (status IN ('pending_payment','paid','cancelled','expired','refunded')),
    CONSTRAINT ck_commerce_orders_currency CHECK (currency ~ '^[A-Z]{3}$'),
    CONSTRAINT ck_commerce_orders_subtotal CHECK (subtotal_minor > 0),
    CONSTRAINT ck_commerce_orders_discount CHECK (discount_minor >= 0),
    CONSTRAINT ck_commerce_orders_total    CHECK (total_minor > 0),
    CONSTRAINT ck_commerce_orders_amounts
        CHECK (discount_minor <= subtotal_minor AND total_minor = subtotal_minor - discount_minor),
    CONSTRAINT ck_commerce_orders_channel CHECK (sales_channel IN ('ios','android','web')),
    CONSTRAINT ck_commerce_orders_expiry CHECK (expires_at IS NULL OR expires_at > created_at)
);

CREATE INDEX idx_commerce_orders_user_created ON commerce_orders (user_id, created_at DESC, id DESC);
CREATE INDEX idx_commerce_orders_status_created ON commerce_orders (status, created_at);
CREATE INDEX idx_commerce_orders_pending_expiry ON commerce_orders (expires_at)
    WHERE status = 'pending_payment' AND expires_at IS NOT NULL;
```

`user_id` 是用户域逻辑引用（会话不建跨域 FK，见 `designing`）。

### 6. `commerce_order_items`

```sql
CREATE TABLE commerce_order_items (
    id                      uuid PRIMARY KEY,
    order_id                uuid NOT NULL,
    product_id              uuid NOT NULL,
    product_price_id        uuid NOT NULL,
    product_code_snapshot   varchar(64) NOT NULL,
    product_name_snapshot   varchar(128) NOT NULL,
    product_type_snapshot   varchar(32) NOT NULL,
    quantity                integer NOT NULL,
    unit_price_minor        bigint NOT NULL,
    subtotal_minor          bigint NOT NULL,
    fulfillment_payload     jsonb NOT NULL,
    created_at              timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT fk_commerce_order_items_order FOREIGN KEY (order_id)
        REFERENCES commerce_orders(id) ON DELETE RESTRICT,
    CONSTRAINT fk_commerce_order_items_product FOREIGN KEY (product_id)
        REFERENCES commerce_products(id) ON DELETE RESTRICT,
    CONSTRAINT fk_commerce_order_items_price FOREIGN KEY (product_price_id)
        REFERENCES commerce_product_prices(id) ON DELETE RESTRICT,
    CONSTRAINT ck_commerce_order_items_code CHECK (btrim(product_code_snapshot) <> ''),
    CONSTRAINT ck_commerce_order_items_name CHECK (btrim(product_name_snapshot) <> ''),
    CONSTRAINT ck_commerce_order_items_type
        CHECK (product_type_snapshot IN ('coin_pack','subscription','boost','consumable')),
    CONSTRAINT ck_commerce_order_items_quantity CHECK (quantity > 0),
    CONSTRAINT ck_commerce_order_items_price_amount CHECK (unit_price_minor > 0),
    CONSTRAINT ck_commerce_order_items_subtotal CHECK (subtotal_minor = unit_price_minor * quantity),
    CONSTRAINT ck_commerce_order_items_payload CHECK (jsonb_typeof(fulfillment_payload) = 'object')
);

CREATE INDEX idx_commerce_order_items_order ON commerce_order_items (order_id, id);
CREATE INDEX idx_commerce_order_items_product ON commerce_order_items (product_id, created_at DESC);
```

Coin Pack 示例 payload：`{"coin_amount":300,"bonus_coin_amount":50,"total_coin_amount":350}`（示例值为 illustrative）。OrderItem 创建后原则上不修改。

### 7. `commerce_order_fulfillments`

```sql
CREATE TABLE commerce_order_fulfillments (
    id                  uuid PRIMARY KEY,
    order_id            uuid NOT NULL,
    order_item_id       uuid NOT NULL,
    user_id             uuid NOT NULL,
    fulfillment_type    varchar(32) NOT NULL,
    status              varchar(24) NOT NULL DEFAULT 'pending',
    quantity            bigint NOT NULL,
    fulfillment_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    idempotency_key     varchar(128) NOT NULL,
    attempt_count       integer NOT NULL DEFAULT 0,
    failure_code        varchar(64) NULL,
    failure_message     text NULL,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    started_at          timestamptz NULL,
    succeeded_at        timestamptz NULL,
    failed_at           timestamptz NULL,

    CONSTRAINT fk_commerce_fulfillments_order FOREIGN KEY (order_id)
        REFERENCES commerce_orders(id) ON DELETE RESTRICT,
    CONSTRAINT fk_commerce_fulfillments_item FOREIGN KEY (order_item_id)
        REFERENCES commerce_order_items(id) ON DELETE RESTRICT,
    CONSTRAINT uq_commerce_fulfillments_idempotency UNIQUE (idempotency_key),
    CONSTRAINT ck_commerce_fulfillments_type
        CHECK (fulfillment_type IN ('wallet_credit','subscription_grant','boost_grant','entitlement_grant')),
    CONSTRAINT ck_commerce_fulfillments_status
        CHECK (status IN ('pending','processing','succeeded','failed','cancelled')),
    CONSTRAINT ck_commerce_fulfillments_quantity CHECK (quantity > 0),
    CONSTRAINT ck_commerce_fulfillments_attempts CHECK (attempt_count >= 0),
    CONSTRAINT ck_commerce_fulfillments_payload CHECK (jsonb_typeof(fulfillment_payload) = 'object')
);

CREATE INDEX idx_commerce_fulfillments_order ON commerce_order_fulfillments (order_id, id);
CREATE INDEX idx_commerce_fulfillments_item ON commerce_order_fulfillments (order_item_id, id);
CREATE INDEX idx_commerce_fulfillments_status ON commerce_order_fulfillments (status, created_at);
```

当前 Coin Pack：`fulfillment_type = wallet_credit`，`quantity = 实际发放 Coin 数`（如 350），以便 Refund 准确回收。

---

## 五、Payment

### 8. `commerce_payments`

```sql
CREATE TABLE commerce_payments (
    id                      uuid PRIMARY KEY,
    order_id                uuid NOT NULL,
    user_id                 uuid NOT NULL,
    provider                varchar(32) NOT NULL,
    payment_method          varchar(32) NULL,
    status                  varchar(24) NOT NULL DEFAULT 'pending',
    currency                varchar(3) NOT NULL,
    amount_minor            bigint NOT NULL,
    provider_payment_id     varchar(191) NULL,
    provider_transaction_id varchar(191) NULL,
    idempotency_key         varchar(128) NOT NULL,
    failure_code            varchar(64) NULL,
    failure_message         text NULL,
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now(),
    succeeded_at            timestamptz NULL,
    failed_at               timestamptz NULL,
    cancelled_at            timestamptz NULL,

    CONSTRAINT fk_commerce_payments_order FOREIGN KEY (order_id)
        REFERENCES commerce_orders(id) ON DELETE RESTRICT,
    CONSTRAINT uq_commerce_payments_idempotency UNIQUE (user_id, idempotency_key),
    CONSTRAINT ck_commerce_payments_provider
        CHECK (provider IN ('apple','google','wechat','alipay','stripe','manual')),
    CONSTRAINT ck_commerce_payments_status
        CHECK (status IN ('pending','processing','succeeded','failed','cancelled','partially_refunded','refunded')),
    CONSTRAINT ck_commerce_payments_currency CHECK (currency ~ '^[A-Z]{3}$'),
    CONSTRAINT ck_commerce_payments_amount CHECK (amount_minor > 0)
);

CREATE INDEX idx_commerce_payments_order ON commerce_payments (order_id, created_at DESC);
CREATE INDEX idx_commerce_payments_user ON commerce_payments (user_id, created_at DESC);
CREATE UNIQUE INDEX uq_commerce_payments_provider_payment
ON commerce_payments (provider, provider_payment_id) WHERE provider_payment_id IS NOT NULL;
CREATE UNIQUE INDEX uq_commerce_payments_provider_transaction
ON commerce_payments (provider, provider_transaction_id) WHERE provider_transaction_id IS NOT NULL;
```

应用层必须验证 `Payment.currency = Order.currency` 且 `Payment.amount_minor = Order.total_minor`；成功支付只能来自服务端可信 Provider 验证。Provider 取值集合是否等价于「支付渠道已定」另见未决——具体接入渠道仍 `deferred`。

### 9. `commerce_payment_events`

```sql
CREATE TABLE commerce_payment_events (
    id                      uuid PRIMARY KEY,
    provider                varchar(32) NOT NULL,
    provider_event_id       varchar(191) NULL,
    event_type              varchar(64) NOT NULL,
    payment_id              uuid NULL,
    order_id                uuid NULL,
    provider_payment_id     varchar(191) NULL,
    provider_transaction_id varchar(191) NULL,
    payload                 jsonb NOT NULL,
    status                  varchar(24) NOT NULL DEFAULT 'received',
    processing_error        text NULL,
    received_at             timestamptz NOT NULL DEFAULT now(),
    processed_at            timestamptz NULL,

    CONSTRAINT fk_commerce_payment_events_payment FOREIGN KEY (payment_id)
        REFERENCES commerce_payments(id) ON DELETE RESTRICT,
    CONSTRAINT fk_commerce_payment_events_order FOREIGN KEY (order_id)
        REFERENCES commerce_orders(id) ON DELETE RESTRICT,
    CONSTRAINT ck_commerce_payment_events_provider
        CHECK (provider IN ('apple','google','wechat','alipay','stripe','manual')),
    CONSTRAINT ck_commerce_payment_events_type CHECK (btrim(event_type) <> ''),
    CONSTRAINT ck_commerce_payment_events_status
        CHECK (status IN ('received','processing','processed','ignored','failed')),
    CONSTRAINT ck_commerce_payment_events_payload CHECK (jsonb_typeof(payload) = 'object')
);

CREATE UNIQUE INDEX uq_commerce_payment_events_provider_event
ON commerce_payment_events (provider, provider_event_id) WHERE provider_event_id IS NOT NULL;
CREATE INDEX idx_commerce_payment_events_payment ON commerce_payment_events (payment_id, received_at DESC);
CREATE INDEX idx_commerce_payment_events_transaction
ON commerce_payment_events (provider, provider_transaction_id) WHERE provider_transaction_id IS NOT NULL;
CREATE INDEX idx_commerce_payment_events_status ON commerce_payment_events (status, received_at);
```

保存 Provider 原始通知事实；Webhook 必须支持重复投递与幂等处理。`payload` 存 Provider 原始响应，符合全局规范「JSONB 只存真正动态数据」。

---

## 六、Wallet

### 10. `commerce_wallets`

```sql
CREATE TABLE commerce_wallets (
    id          uuid PRIMARY KEY,
    user_id     uuid NOT NULL,
    balance     bigint NOT NULL DEFAULT 0,
    version     bigint NOT NULL DEFAULT 0,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT uq_commerce_wallets_user UNIQUE (user_id),
    CONSTRAINT ck_commerce_wallets_balance CHECK (balance >= 0),
    CONSTRAINT ck_commerce_wallets_version CHECK (version >= 0)
);
```

V1：一个用户 = 一个 Coin Wallet；不做多资产、不做冻结余额、不做 paid/free 分桶。`version` 用于乐观并发。

### 11. `commerce_wallet_ledger`

Commerce 最核心的账本表。

```sql
CREATE TABLE commerce_wallet_ledger (
    id              uuid PRIMARY KEY,
    wallet_id       uuid NOT NULL,
    user_id         uuid NOT NULL,
    amount          bigint NOT NULL,
    balance_before  bigint NOT NULL,
    balance_after   bigint NOT NULL,
    business_type   varchar(32) NOT NULL,
    business_id     uuid NOT NULL,
    idempotency_key varchar(128) NOT NULL,
    description     varchar(255) NULL,
    metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at      timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT fk_commerce_wallet_ledger_wallet FOREIGN KEY (wallet_id)
        REFERENCES commerce_wallets(id) ON DELETE RESTRICT,
    CONSTRAINT uq_commerce_wallet_ledger_idempotency UNIQUE (wallet_id, idempotency_key),
    CONSTRAINT uq_commerce_wallet_ledger_business UNIQUE (wallet_id, business_type, business_id),
    CONSTRAINT ck_commerce_wallet_ledger_amount CHECK (amount <> 0),
    CONSTRAINT ck_commerce_wallet_ledger_before CHECK (balance_before >= 0),
    CONSTRAINT ck_commerce_wallet_ledger_after CHECK (balance_after >= 0),
    CONSTRAINT ck_commerce_wallet_ledger_balance CHECK (balance_after = balance_before + amount),
    CONSTRAINT ck_commerce_wallet_ledger_business_type
        CHECK (business_type IN ('order_fulfillment','reward_grant','gift_send','wallet_adjustment','wallet_reversal','refund_recovery')),
    CONSTRAINT ck_commerce_wallet_ledger_metadata CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX idx_commerce_wallet_ledger_wallet ON commerce_wallet_ledger (wallet_id, created_at DESC, id DESC);
CREATE INDEX idx_commerce_wallet_ledger_user ON commerce_wallet_ledger (user_id, created_at DESC, id DESC);
```

正式原则：只 `INSERT`，正常业务不 `UPDATE`、不 `DELETE`。`reward_grant.business_id` 引用 Reward 域 UUID（是否建 FK 与 `business_id` 物理类型取决于 `designing` 裁决）。会话曾考虑用 `business_ref varchar(128)` 替代 `business_id uuid` 以避免依赖他域主键类型，最终倾向保留 `business_id uuid` 并「全项目统一 UUID」——该前提与全局基线冲突，见「与全局 SQL 规范的关系」。

### 12. `commerce_wallet_adjustments`

```sql
CREATE TABLE commerce_wallet_adjustments (
    id              uuid PRIMARY KEY,
    wallet_id       uuid NOT NULL,
    user_id         uuid NOT NULL,
    amount          bigint NOT NULL,
    reason_code     varchar(64) NOT NULL,
    remark          text NULL,
    operator_type   varchar(32) NOT NULL,
    operator_id     uuid NULL,
    idempotency_key varchar(128) NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT fk_commerce_wallet_adjustments_wallet FOREIGN KEY (wallet_id)
        REFERENCES commerce_wallets(id) ON DELETE RESTRICT,
    CONSTRAINT uq_commerce_wallet_adjustments_idempotency UNIQUE (idempotency_key),
    CONSTRAINT ck_commerce_wallet_adjustments_amount CHECK (amount <> 0),
    CONSTRAINT ck_commerce_wallet_adjustments_reason CHECK (btrim(reason_code) <> ''),
    CONSTRAINT ck_commerce_wallet_adjustments_operator CHECK (operator_type IN ('admin','system'))
);

CREATE INDEX idx_commerce_wallet_adjustments_wallet ON commerce_wallet_adjustments (wallet_id, created_at DESC);
```

成功 Adjustment 必须同事务产生 `Adjustment + Ledger + Wallet balance change`；不允许管理员直接 UPDATE Wallet。

### 13. `commerce_wallet_reversals`

```sql
CREATE TABLE commerce_wallet_reversals (
    id                       uuid PRIMARY KEY,
    wallet_id                uuid NOT NULL,
    user_id                  uuid NOT NULL,
    original_ledger_entry_id uuid NOT NULL,
    amount                   bigint NOT NULL,
    reason_code              varchar(64) NOT NULL,
    remark                   text NULL,
    operator_type            varchar(32) NOT NULL,
    operator_id              uuid NULL,
    idempotency_key          varchar(128) NOT NULL,
    created_at               timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT fk_commerce_wallet_reversals_wallet FOREIGN KEY (wallet_id)
        REFERENCES commerce_wallets(id) ON DELETE RESTRICT,
    CONSTRAINT fk_commerce_wallet_reversals_original FOREIGN KEY (original_ledger_entry_id)
        REFERENCES commerce_wallet_ledger(id) ON DELETE RESTRICT,
    CONSTRAINT uq_commerce_wallet_reversals_original UNIQUE (original_ledger_entry_id),
    CONSTRAINT uq_commerce_wallet_reversals_idempotency UNIQUE (idempotency_key),
    CONSTRAINT ck_commerce_wallet_reversals_amount CHECK (amount <> 0),
    CONSTRAINT ck_commerce_wallet_reversals_reason CHECK (btrim(reason_code) <> ''),
    CONSTRAINT ck_commerce_wallet_reversals_operator CHECK (operator_type IN ('admin','system'))
);

CREATE INDEX idx_commerce_wallet_reversals_wallet ON commerce_wallet_reversals (wallet_id, created_at DESC);
```

应用层严格保证 `reversal.amount = -original_ledger.amount`；不能 Reversal 一个 Reversal，一笔原 Ledger 最多冲正一次，V1 不支持 Partial Reversal。

---

## 七、Gifting

### 14. `commerce_gift_sends`

只保存真实成功赠礼，不落 `pending/failed` 垃圾交易。

```sql
CREATE TABLE commerce_gift_sends (
    id                              uuid PRIMARY KEY,
    sender_user_id                  uuid NOT NULL,
    receiver_user_id                uuid NOT NULL,
    gift_id                         uuid NOT NULL,
    conversation_id                 uuid NULL,
    status                          varchar(24) NOT NULL DEFAULT 'succeeded',
    quantity                        integer NOT NULL,
    unit_coin_cost                  bigint NOT NULL,
    total_coin_cost                 bigint NOT NULL,
    gift_code_snapshot              varchar(64) NOT NULL,
    gift_name_snapshot              varchar(128) NOT NULL,
    gift_image_asset_id_snapshot    uuid NULL,
    idempotency_key                 varchar(128) NOT NULL,
    created_at                      timestamptz NOT NULL DEFAULT now(),
    updated_at                      timestamptz NOT NULL DEFAULT now(),
    succeeded_at                    timestamptz NOT NULL DEFAULT now(),
    reversed_at                     timestamptz NULL,

    CONSTRAINT fk_commerce_gift_sends_gift FOREIGN KEY (gift_id)
        REFERENCES commerce_gifts(id) ON DELETE RESTRICT,
    CONSTRAINT uq_commerce_gift_sends_idempotency UNIQUE (sender_user_id, idempotency_key),
    CONSTRAINT ck_commerce_gift_sends_users CHECK (sender_user_id <> receiver_user_id),
    CONSTRAINT ck_commerce_gift_sends_status CHECK (status IN ('succeeded','reversed')),
    CONSTRAINT ck_commerce_gift_sends_quantity CHECK (quantity > 0),
    CONSTRAINT ck_commerce_gift_sends_unit_cost CHECK (unit_coin_cost > 0),
    CONSTRAINT ck_commerce_gift_sends_total_cost CHECK (total_coin_cost = unit_coin_cost * quantity),
    CONSTRAINT ck_commerce_gift_sends_code CHECK (btrim(gift_code_snapshot) <> ''),
    CONSTRAINT ck_commerce_gift_sends_name CHECK (btrim(gift_name_snapshot) <> '')
);

CREATE INDEX idx_commerce_gift_sends_sender ON commerce_gift_sends (sender_user_id, created_at DESC);
CREATE INDEX idx_commerce_gift_sends_receiver ON commerce_gift_sends (receiver_user_id, created_at DESC);
CREATE INDEX idx_commerce_gift_sends_conversation ON commerce_gift_sends (conversation_id, created_at DESC)
    WHERE conversation_id IS NOT NULL;
CREATE INDEX idx_commerce_gift_sends_gift ON commerce_gift_sends (gift_id, created_at DESC);
```

`conversation_id`、`sender_user_id`、`receiver_user_id`、`gift_image_asset_id_snapshot` 均为跨域/基础设施逻辑引用（是否建 FK 取决于 `designing` 裁决）。赠礼事务必须一次提交：`GiftSend + Wallet debit + Ledger + Outbox GiftSent`。

---

## 八、Refund

### 15. `commerce_refunds`

```sql
CREATE TABLE commerce_refunds (
    id                      uuid PRIMARY KEY,
    payment_id              uuid NOT NULL,
    order_id                uuid NOT NULL,
    user_id                 uuid NOT NULL,
    provider                varchar(32) NOT NULL,
    status                  varchar(24) NOT NULL DEFAULT 'pending',
    currency                varchar(3) NOT NULL,
    amount_minor            bigint NOT NULL,
    provider_refund_id      varchar(191) NULL,
    provider_transaction_id varchar(191) NULL,
    reason_code             varchar(64) NULL,
    reason_detail           text NULL,
    requested_by_type       varchar(32) NOT NULL,
    requested_by_id         uuid NULL,
    idempotency_key         varchar(128) NOT NULL,
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now(),
    succeeded_at            timestamptz NULL,
    failed_at               timestamptz NULL,

    CONSTRAINT fk_commerce_refunds_payment FOREIGN KEY (payment_id)
        REFERENCES commerce_payments(id) ON DELETE RESTRICT,
    CONSTRAINT fk_commerce_refunds_order FOREIGN KEY (order_id)
        REFERENCES commerce_orders(id) ON DELETE RESTRICT,
    CONSTRAINT uq_commerce_refunds_idempotency UNIQUE (idempotency_key),
    CONSTRAINT ck_commerce_refunds_provider
        CHECK (provider IN ('apple','google','wechat','alipay','stripe','manual')),
    CONSTRAINT ck_commerce_refunds_status
        CHECK (status IN ('pending','processing','succeeded','failed','cancelled')),
    CONSTRAINT ck_commerce_refunds_currency CHECK (currency ~ '^[A-Z]{3}$'),
    CONSTRAINT ck_commerce_refunds_amount CHECK (amount_minor > 0),
    CONSTRAINT ck_commerce_refunds_requested_by
        CHECK (requested_by_type IN ('admin','system','provider'))
);

CREATE UNIQUE INDEX uq_commerce_refunds_provider_refund
ON commerce_refunds (provider, provider_refund_id) WHERE provider_refund_id IS NOT NULL;
CREATE INDEX idx_commerce_refunds_payment ON commerce_refunds (payment_id, created_at DESC);
CREATE INDEX idx_commerce_refunds_user ON commerce_refunds (user_id, created_at DESC);
CREATE INDEX idx_commerce_refunds_status ON commerce_refunds (status, created_at);
```

V1 产品规则：Coin Pack 只支持全额退款，但表结构允许未来部分退款；Service 保证 `SUM(successful refunds) <= payment.amount_minor`。

### 16. `commerce_refund_recoveries`

```sql
CREATE TABLE commerce_refund_recoveries (
    id              uuid PRIMARY KEY,
    refund_id       uuid NOT NULL,
    fulfillment_id  uuid NOT NULL,
    wallet_id       uuid NOT NULL,
    user_id         uuid NOT NULL,
    status          varchar(24) NOT NULL DEFAULT 'pending',
    coin_amount     bigint NOT NULL,
    idempotency_key varchar(128) NOT NULL,
    attempt_count   integer NOT NULL DEFAULT 0,
    failure_code    varchar(64) NULL,
    failure_message text NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    succeeded_at    timestamptz NULL,
    failed_at       timestamptz NULL,

    CONSTRAINT fk_commerce_refund_recoveries_refund FOREIGN KEY (refund_id)
        REFERENCES commerce_refunds(id) ON DELETE RESTRICT,
    CONSTRAINT fk_commerce_refund_recoveries_fulfillment FOREIGN KEY (fulfillment_id)
        REFERENCES commerce_order_fulfillments(id) ON DELETE RESTRICT,
    CONSTRAINT fk_commerce_refund_recoveries_wallet FOREIGN KEY (wallet_id)
        REFERENCES commerce_wallets(id) ON DELETE RESTRICT,
    CONSTRAINT uq_commerce_refund_recoveries_source UNIQUE (refund_id, fulfillment_id),
    CONSTRAINT uq_commerce_refund_recoveries_idempotency UNIQUE (idempotency_key),
    CONSTRAINT ck_commerce_refund_recoveries_status
        CHECK (status IN ('pending','processing','succeeded','failed')),
    CONSTRAINT ck_commerce_refund_recoveries_amount CHECK (coin_amount > 0),
    CONSTRAINT ck_commerce_refund_recoveries_attempts CHECK (attempt_count >= 0)
);

CREATE INDEX idx_commerce_refund_recoveries_status ON commerce_refund_recoveries (status, created_at);
CREATE INDEX idx_commerce_refund_recoveries_wallet ON commerce_refund_recoveries (wallet_id, created_at DESC);
```

全额 Coin Pack Refund：`coin_amount = 原 successful fulfillment.quantity`（包括购买 Bonus）。RefundRecovery 仅在 Refund succeeded 后执行。

---

## 最终关系图

```text
commerce_products
    ├──< commerce_product_prices
    └──1 commerce_coin_packs
commerce_orders >── commerce_order_items >── commerce_order_fulfillments
    └──< commerce_payments ──< commerce_payment_events
                     └──< commerce_refunds ──< commerce_refund_recoveries ──→ fulfillment / wallet
commerce_wallets 1── commerce_wallet_ledger (append-only)
commerce_gifts   >── commerce_gift_sends ──→ Wallet / Ledger
commerce_wallet_adjustments / _reversals ──→ Wallet / Ledger
```

## 明确不建的表

```text
❌ commerce_transactions（万能表）      ❌ commerce_wallet_transactions（万能表）
❌ commerce_reward*（Reward 属独立域）   ❌ commerce_subscriptions（延后）
❌ commerce_promotions / _coupons        ❌ commerce_gift_prices / _gift_inventory
❌ commerce_wallet_debt / _asset_accounts / _frozen_balances
❌ commerce_creator_earnings / _withdrawals / _settlements
```

## 与全局 SQL 规范的关系

| 项 | 全局规范（D-007）/ 已冻结域 | Commerce V1 会话版 | 结论 |
| --- | --- | --- | --- |
| 表名 | 复数 | `commerce_*` 复数 | 一致 |
| 状态/枚举 | `varchar + CHECK`，不用 ENUM | `varchar + CHECK` | 一致 |
| 金额 | `amount_minor bigint`，禁 float | 真钱 `amount_minor`，Coins `bigint` 且不用 `currency='COIN'` | 一致（且更严格地区分法币/虚拟币） |
| JSONB | 仅存动态数据 | metadata / payload / fulfillment_payload | 一致 |
| **主键** | `bigint generated always as identity`（第 3 条）；Chat 经 ADR-015 已回归 identity | 会话用 `uuid PRIMARY KEY`，并假设「全项目一直用 UUID」 | **冲突，`designing`，提交主会话裁决**（该前提与 D-007/D-055/ADR-015 及四域实际基线不符） |
| **跨域外键** | 第 11/12 条保留并允许跨 Schema FK；Chat 已用 `(conversation_id,user_id)` 复合 FK | 会话主张「跨域只存 ID 不建 FK」 | **冲突，`designing`，提交主会话裁决** |
| 域内 FK | 保留 | 域内 FK 完整保留 | 一致 |
| 物理删除 | 按业务决定 | 交易表不物理删除；Ledger/Adjustment/Reversal 不可改删 | 一致 |

**上述两项物理冲突不影响已 `frozen` 的表清单、字段语义、约束意图、状态枚举与业务规则；不得据此把 16 表模型整体降级为 `designing`，也不得在未裁决前把本 DDL 直接落成 migration。** 裁决记录见 [ADR-016](../../adr/ADR-016-commerce-money-and-append-only-ledger.md)、[未决事项](../../governance/open-questions.md)。
