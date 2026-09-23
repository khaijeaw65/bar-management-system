-- ============================================================
-- Bar Management System — Initial Schema
-- Generated: 2026-09-13  |  Updated: 2026-09-22  |  9 domains, 32 tables
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Enums ────────────────────────────────────────────────────
CREATE TYPE identity_provider   AS ENUM ('line', 'phone_otp');
CREATE TYPE visit_state         AS ENUM ('open', 'active', 'idle', 'closed', 'abandoned');
CREATE TYPE item_type           AS ENUM ('simple', 'recipe', 'charge');
CREATE TYPE order_status        AS ENUM ('pending', 'accepted', 'ready', 'sent', 'issue');
CREATE TYPE order_item_status   AS ENUM ('pending', 'preparing', 'ready', 'cancelled');
CREATE TYPE payment_method      AS ENUM ('promptpay', 'cash');
CREATE TYPE payment_status      AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE bottle_keep_status  AS ENUM ('active', 'finished', 'expired');
CREATE TYPE inv_category        AS ENUM ('A', 'B', 'C');
CREATE TYPE inv_tx_type         AS ENUM ('purchase', 'usage', 'adjustment', 'void');
CREATE TYPE audit_action        AS ENUM ('CREATE', 'UPDATE');
CREATE TYPE actor_type          AS ENUM ('user', 'system');

-- ============================================================
-- 1. VENUE & TABLES
-- ============================================================

CREATE TABLE venue (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                     VARCHAR(200) NOT NULL,
  slug                     VARCHAR(100) NOT NULL UNIQUE,
  kitchen_display_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by               UUID,   -- FK added after staff_user
  updated_by               UUID    -- FK added after staff_user
);

CREATE TABLE table_seat (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label       VARCHAR(50) NOT NULL,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  qr_code     VARCHAR(500),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by  UUID,
  updated_by  UUID
);

-- ============================================================
-- 2. GUEST & IDENTITY
-- ============================================================

CREATE TABLE customer (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  display_name    VARCHAR(200),
  notes           TEXT,
  avatar_url      VARCHAR(500),
  anonymized_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE customer_identity (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id  UUID NOT NULL REFERENCES customer(id),
  provider     identity_provider NOT NULL,
  external_id  VARCHAR(300),           -- nullable for anonymization (PDPA forget-me)
  display_name VARCHAR(200),
  avatar_url   VARCHAR(500),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, external_id)
);

CREATE TABLE visit (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_seat_id  UUID NOT NULL REFERENCES table_seat(id),
  customer_id    UUID REFERENCES customer(id),   -- nullable — linked post-hoc
  state          visit_state NOT NULL DEFAULT 'open',
  opened_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE customer_consent (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id        UUID NOT NULL REFERENCES customer(id),
  data_consent       BOOLEAN NOT NULL DEFAULT FALSE,   -- save preferences & bottle-keep (required for feature)
  marketing_consent  BOOLEAN NOT NULL DEFAULT FALSE,   -- receive LINE promotions (optional)
  consented_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (customer_id)
);

-- ============================================================
-- 3. STAFF IAM
-- ============================================================

CREATE TABLE staff_user (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  display_name  VARCHAR(200) NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Back-fill FK now that staff_user exists
ALTER TABLE venue        ADD CONSTRAINT venue_created_by_fk  FOREIGN KEY (created_by)  REFERENCES staff_user(id);
ALTER TABLE venue        ADD CONSTRAINT venue_updated_by_fk  FOREIGN KEY (updated_by)  REFERENCES staff_user(id);
ALTER TABLE table_seat   ADD CONSTRAINT seat_created_by_fk   FOREIGN KEY (created_by)  REFERENCES staff_user(id);
ALTER TABLE table_seat   ADD CONSTRAINT seat_updated_by_fk   FOREIGN KEY (updated_by)  REFERENCES staff_user(id);

CREATE TABLE staff_user_identity (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES staff_user(id),
  provider     identity_provider NOT NULL,
  external_id  VARCHAR(300),           -- nullable for anonymization (PDPA forget-me)
  display_name VARCHAR(200),
  avatar_url   VARCHAR(500),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, external_id)
);

CREATE TABLE staff_group (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(100) NOT NULL,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by   UUID REFERENCES staff_user(id),
  updated_by   UUID REFERENCES staff_user(id)
);

CREATE TABLE user_group_membership (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES staff_user(id),
  group_id    UUID NOT NULL REFERENCES staff_group(id),
  valid_from  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,   -- NULL = permanent
  UNIQUE (user_id, group_id)
);

CREATE TABLE policy (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(100) NOT NULL,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by   UUID REFERENCES staff_user(id),
  updated_by   UUID REFERENCES staff_user(id)
);

CREATE TABLE permission (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource  VARCHAR(100) NOT NULL,
  action    VARCHAR(100) NOT NULL,
  UNIQUE (resource, action)
);

CREATE TABLE policy_permission (
  policy_id     UUID NOT NULL REFERENCES policy(id),
  permission_id UUID NOT NULL REFERENCES permission(id),
  PRIMARY KEY (policy_id, permission_id)
);

CREATE TABLE group_policy (
  group_id   UUID NOT NULL REFERENCES staff_group(id),
  policy_id  UUID NOT NULL REFERENCES policy(id),
  PRIMARY KEY (group_id, policy_id)
);

CREATE TABLE user_policy (
  user_id    UUID NOT NULL REFERENCES staff_user(id),
  policy_id  UUID NOT NULL REFERENCES policy(id),
  PRIMARY KEY (user_id, policy_id)
);

-- ============================================================
-- 4. MENU
-- ============================================================

CREATE TABLE menu_category (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(200) NOT NULL,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by  UUID REFERENCES staff_user(id),
  updated_by  UUID REFERENCES staff_user(id)
);

CREATE TABLE menu_item (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id  UUID NOT NULL REFERENCES menu_category(id),
  name         VARCHAR(200) NOT NULL,
  description  TEXT,
  base_price   NUMERIC(10,2) NOT NULL DEFAULT 0,
  item_type    item_type NOT NULL DEFAULT 'simple',
  kitchen_tag  VARCHAR(50),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order   SMALLINT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by   UUID REFERENCES staff_user(id),
  updated_by   UUID REFERENCES staff_user(id)
);

CREATE TABLE menu_item_variant (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id  UUID NOT NULL REFERENCES menu_item(id),
  name          VARCHAR(200) NOT NULL,
  price         NUMERIC(10,2) NOT NULL,
  is_available  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by    UUID REFERENCES staff_user(id),
  updated_by    UUID REFERENCES staff_user(id)
);

CREATE TABLE modifier_group (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(200) NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  min_select  SMALLINT NOT NULL DEFAULT 0,
  max_select  SMALLINT NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by  UUID REFERENCES staff_user(id),
  updated_by  UUID REFERENCES staff_user(id)
);

CREATE TABLE modifier_option (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id     UUID NOT NULL REFERENCES modifier_group(id),
  name         VARCHAR(200) NOT NULL,
  price_delta  NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE menu_variant_modifier_group (
  menu_item_variant_id  UUID NOT NULL REFERENCES menu_item_variant(id),
  modifier_group_id     UUID NOT NULL REFERENCES modifier_group(id),
  PRIMARY KEY (menu_item_variant_id, modifier_group_id)
);

-- ============================================================
-- 5. INVENTORY
-- ============================================================

CREATE TABLE inventory_item (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                 VARCHAR(200) NOT NULL,
  category             inv_category NOT NULL DEFAULT 'C',
  unit_type            VARCHAR(50),            -- e.g. 'bottle', 'keg', 'ml'
  quantity_on_hand     NUMERIC(12,3) NOT NULL DEFAULT 0,
  unit                 VARCHAR(50),
  low_stock_threshold  NUMERIC(12,3),
  cost_per_unit        NUMERIC(12,2),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by           UUID REFERENCES staff_user(id),
  updated_by           UUID REFERENCES staff_user(id)
);

-- Recipe link: many variants → one inventory item
CREATE TABLE menu_variant_ingredient (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_variant_id  UUID NOT NULL REFERENCES menu_item_variant(id),
  inventory_item_id     UUID NOT NULL REFERENCES inventory_item(id),
  quantity_used         NUMERIC(12,3) NOT NULL
);

CREATE TABLE inventory_transaction (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_item_id  UUID NOT NULL REFERENCES inventory_item(id),
  tx_type            inv_tx_type NOT NULL,
  delta_quantity     NUMERIC(12,3) NOT NULL,
  reference_type     VARCHAR(100),   -- e.g. 'order_item', 'manual'
  reference_id       UUID,
  notes              TEXT,
  created_by         UUID REFERENCES staff_user(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE restock_request (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_item_id  UUID NOT NULL REFERENCES inventory_item(id),
  notes              TEXT,
  status             VARCHAR(50) NOT NULL DEFAULT 'pending',   -- pending | acknowledged | fulfilled
  created_by         UUID REFERENCES staff_user(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by         UUID REFERENCES staff_user(id)
);

-- ============================================================
-- 6. ORDER
-- ============================================================

CREATE TABLE order_record (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id    UUID NOT NULL REFERENCES visit(id),
  status      order_status NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by  UUID REFERENCES staff_user(id),
  updated_by  UUID REFERENCES staff_user(id)
);

CREATE TABLE order_item (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id              UUID NOT NULL REFERENCES order_record(id),
  menu_item_variant_id  UUID NOT NULL REFERENCES menu_item_variant(id),
  quantity              SMALLINT NOT NULL DEFAULT 1,
  unit_price_snapshot   NUMERIC(10,2) NOT NULL,   -- frozen at order time
  ordered_by_name       VARCHAR(100),           -- e.g. 'Filippo' — label shown on order card
  notes                 TEXT,
  status                order_item_status NOT NULL DEFAULT 'pending',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by            UUID REFERENCES staff_user(id)
);

CREATE TABLE order_item_modifier (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id        UUID NOT NULL REFERENCES order_item(id),
  modifier_option_id   UUID NOT NULL REFERENCES modifier_option(id),
  price_delta_snapshot NUMERIC(10,2) NOT NULL     -- frozen at order time
);

-- ============================================================
-- 7. PAYMENT
-- ============================================================

CREATE TABLE payment (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id        UUID NOT NULL REFERENCES visit(id),
  amount          NUMERIC(12,2) NOT NULL,
  method          payment_method NOT NULL DEFAULT 'promptpay',
  status          payment_status NOT NULL DEFAULT 'pending',
  gateway_tx_id   VARCHAR(300) UNIQUE,   -- idempotency key
  qr_payload      TEXT,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      UUID REFERENCES staff_user(id),
  updated_by      UUID REFERENCES staff_user(id)
);

-- Which orders does this payment cover?
CREATE TABLE payment_order (
  payment_id  UUID NOT NULL REFERENCES payment(id),
  order_id    UUID NOT NULL REFERENCES order_record(id),
  PRIMARY KEY (payment_id, order_id)
);

-- ============================================================
-- 8. BOTTLE KEEP
-- ============================================================

CREATE TABLE bottle_keep (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id         UUID NOT NULL REFERENCES customer(id),
  inventory_item_id   UUID NOT NULL REFERENCES inventory_item(id),
  quantity_registered SMALLINT NOT NULL DEFAULT 1,
  remaining_quantity  SMALLINT NOT NULL DEFAULT 1,
  remaining_note      TEXT,           -- e.g. 'ครึ่งขวด', '2 bottles left'
  opened_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at          TIMESTAMPTZ,                    -- bar policy expiry date (e.g. opened_at + 90 days)
  last_used_at        TIMESTAMPTZ,
  location_note       TEXT,
  status              bottle_keep_status NOT NULL DEFAULT 'active',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID REFERENCES staff_user(id),
  updated_by          UUID REFERENCES staff_user(id)
);


-- ============================================================
-- 9. AUDIT LOG  (append-only — never UPDATE or DELETE)
-- ============================================================

CREATE TABLE audit_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity          VARCHAR(100) NOT NULL,
  entity_id       UUID NOT NULL,
  action          audit_action NOT NULL,
  changed_fields  JSONB,          -- { field: { from, to } } — null on CREATE
  changed_by      UUID,           -- staff_user id from CLS (no FK — user may be deleted)
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Visit lookups
CREATE INDEX idx_visit_table_seat   ON visit(table_seat_id);
CREATE INDEX idx_visit_customer      ON visit(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_visit_state         ON visit(state);

-- Order lookups
CREATE INDEX idx_order_visit         ON order_record(visit_id);
CREATE INDEX idx_order_item_order    ON order_item(order_id);
CREATE INDEX idx_order_item_status   ON order_item(status);

-- Payment lookups
CREATE INDEX idx_payment_visit       ON payment(visit_id);
CREATE INDEX idx_payment_status      ON payment(status);
CREATE INDEX idx_payment_order_pay   ON payment_order(payment_id);
CREATE INDEX idx_payment_order_ord   ON payment_order(order_id);

-- IAM lookups
CREATE INDEX idx_membership_user     ON user_group_membership(user_id);
CREATE INDEX idx_membership_group    ON user_group_membership(group_id);
CREATE INDEX idx_membership_valid    ON user_group_membership(valid_until) WHERE valid_until IS NOT NULL;

-- Audit log lookups
CREATE INDEX idx_audit_entity        ON audit_log(entity, entity_id);
CREATE INDEX idx_audit_changed_by    ON audit_log(changed_by);
CREATE INDEX idx_audit_changed_at    ON audit_log(changed_at DESC);

-- Inventory
CREATE INDEX idx_inv_tx_item         ON inventory_transaction(inventory_item_id);
CREATE INDEX idx_restock_item        ON restock_request(inventory_item_id);
CREATE INDEX idx_restock_status      ON restock_request(status);

-- Bottle keep
CREATE INDEX idx_bottle_customer     ON bottle_keep(customer_id);
CREATE INDEX idx_bottle_status       ON bottle_keep(status);

-- Customer identity
CREATE INDEX idx_cust_identity_cust  ON customer_identity(customer_id);
CREATE INDEX idx_consent_customer    ON customer_consent(customer_id);

-- ============================================================
-- SEED — permissions (atomic strings, seeded at boot)
-- ============================================================

INSERT INTO permission (resource, action) VALUES
  ('orders',    'create'),
  ('orders',    'void'),
  ('orders',    'view'),
  ('menu',      'manage'),
  ('inventory', 'manage'),
  ('payments',  'view'),
  ('payments',  'process'),
  ('guests',    'view'),
  ('guests',    'manage'),
  ('bottle_keep','manage'),
  ('iam',       'manage'),
  ('venue',     'manage'),
  ('reports',   'view');
