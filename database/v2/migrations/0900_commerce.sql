-- Generated mechanically from the frozen documentation named below.
-- Source: docs/docs/domains/commerce/database.md
-- Do not edit an applied migration; add a new migration instead.
SET LOCAL search_path = commerce, public;

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
        CHECK (business_type IN ('order_fulfillment','reward_delivery','gift_send','wallet_adjustment','wallet_reversal','refund_recovery')),
    CONSTRAINT ck_commerce_wallet_ledger_metadata CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX idx_commerce_wallet_ledger_wallet ON commerce_wallet_ledger (wallet_id, created_at DESC, id DESC);
CREATE INDEX idx_commerce_wallet_ledger_user ON commerce_wallet_ledger (user_id, created_at DESC, id DESC);

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
