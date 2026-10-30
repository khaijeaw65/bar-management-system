-- ============================================================
-- Bar Management System — Initial Schema
-- Generated: 2026-09-13  |  Updated: 2026-10-29  |  10 domains, 39 tables
-- ============================================================
-- updated_at is owned by the database (DR-023): the trigger block above the seed data stamps every UPDATE.
-- A table created later with an updated_at column attaches the same trigger in its own migration.

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Enums ────────────────────────────────────────────────────
CREATE TYPE identity_provider   AS ENUM ('line', 'phone_otp');
CREATE TYPE table_seat_kind     AS ENUM ('table', 'counter');
CREATE TYPE visit_state         AS ENUM ('open', 'active', 'idle', 'closed', 'abandoned');
CREATE TYPE visit_open_source   AS ENUM ('pos', 'app', 'qr');  -- where a visit was opened (BRIEF-011 Q3, Field 2026-10-10)
CREATE TYPE item_type           AS ENUM ('simple', 'recipe', 'charge');
CREATE TYPE order_status        AS ENUM ('pending', 'accepted', 'ready', 'sent', 'issue', 'cancelled');  -- per station ticket; cancelled = every item on the ticket cancelled (DR-012, Field 2026-10-10)
CREATE TYPE kitchen_station     AS ENUM ('bar', 'food');  -- station ticket routing; 'both' dropped (DR-012)
CREATE TYPE payment_method      AS ENUM ('promptpay', 'cash');
CREATE TYPE payment_status      AS ENUM ('pending', 'completed', 'failed', 'refunded', 'cancelled');  -- cancelled = staff cancel or 15-min QR timeout (CD-03 Q1, Field 2026-10-04)
CREATE TYPE bottle_keep_status  AS ENUM ('active', 'finished');  -- simple record, no expiry (DR-014 #9)
CREATE TYPE venue_payment_mode  AS ENUM ('own_promptpay', 'gateway');  -- DR-014 #6
CREATE TYPE promptpay_id_type   AS ENUM ('mobile', 'national_id', 'ewallet');  -- DR-014 #6
CREATE TYPE payment_confirmed_via AS ENUM ('webhook', 'manual', 'cash', 'slip_verify');  -- CD-03 F1 + DR-014 #6
CREATE TYPE ai_insight_kind     AS ENUM ('sales_summary', 'anomaly', 'menu');  -- DR-014 #11
CREATE TYPE inv_category        AS ENUM ('A', 'B', 'C');
CREATE TYPE inv_tx_type         AS ENUM ('purchase', 'usage', 'adjustment', 'void');
CREATE TYPE audit_action        AS ENUM ('CREATE', 'UPDATE', 'REJECT');
CREATE TYPE actor_type          AS ENUM ('user', 'system');

-- ============================================================
-- 1. VENUE & TABLES
-- ============================================================

CREATE TABLE venue (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                     VARCHAR(200) NOT NULL,
  slug                     VARCHAR(100) NOT NULL UNIQUE,
  kitchen_display_enabled  BOOLEAN NOT NULL DEFAULT FALSE,   -- split bar/food tickets + READY step (DR-013, DR-014 #1)
  business_day_cutoff      TIME NOT NULL DEFAULT '06:00',    -- Asia/Bangkok; reports, order numbers, 'until tonight' (DR-014 #4)
  payment_mode             venue_payment_mode NOT NULL DEFAULT 'own_promptpay',  -- DR-014 #6
  promptpay_id             VARCHAR(20),                      -- owner/bar PromptPay for app-generated QR
  promptpay_id_type        promptpay_id_type,
  counter_qr_enabled       BOOLEAN NOT NULL DEFAULT FALSE,   -- DR-014 #5
  shift_close_enabled      BOOLEAN NOT NULL DEFAULT FALSE,   -- DR-014 #7
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by               UUID,   -- FK added after staff_user
  updated_by               UUID    -- FK added after staff_user
);

CREATE TABLE table_seat (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label       VARCHAR(50) NOT NULL,
  kind        table_seat_kind NOT NULL DEFAULT 'table',   -- POS grid section (CD-02 Q1)
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  qr_token    VARCHAR(64) UNIQUE,                         -- opaque random token; regenerate = replace (BRIEF-011 Q1, Field 2026-10-04)
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  staff_called_at   TIMESTAMPTZ,                         -- call-staff bell (BRIEF-048); NULL = no bell. Cleared on acknowledge / visit close
  staff_call_reason VARCHAR(10) CHECK (staff_call_reason IN ('bill', 'other', 'transfer')),  -- transfer = guest tapped แจ้งโอนแล้ว (BRIEF-052), cleared when the payment leaves pending
  staff_call_note   VARCHAR(100),
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
  guest_label    VARCHAR(100),                    -- optional name at open (CD-02 open-table; BRIEF-011 Q1)
  opened_by      UUID,                            -- staff who opened it; NULL = guest QR. FK added after staff_user (BRIEF-011 Q3)
  opened_via     visit_open_source NOT NULL DEFAULT 'pos',  -- shown in the join-confirm dialog (CD-14 J2, BRIEF-011 Q3)
  opened_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Guest QR session (DR-028, BRIEF-047). Opaque cookie token; only its SHA-256 is stored.
-- visit_id NULL = seat-only (expires 2 h sliding); bound to a visit = lives until the visit closes.
CREATE TABLE guest_session (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_hash     CHAR(64) NOT NULL UNIQUE,
  table_seat_id  UUID NOT NULL REFERENCES table_seat(id),
  visit_id       UUID REFERENCES visit(id),
  display_name   VARCHAR(30),                 -- guest nickname (CD-06 R3), snapshot to order lines at send
  expires_at     TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()   -- trg_guest_session_updated_at (DR-023)
);
CREATE INDEX idx_guest_session_seat ON guest_session(table_seat_id);
CREATE INDEX idx_guest_session_seat_only_expiry ON guest_session(expires_at) WHERE visit_id IS NULL;

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
  pos_pin_hash  VARCHAR(100),          -- hashed 4-digit PIN for switching on the shared POS (DR-014 #8)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Back-fill FK now that staff_user exists
ALTER TABLE venue        ADD CONSTRAINT venue_created_by_fk  FOREIGN KEY (created_by)  REFERENCES staff_user(id);
ALTER TABLE venue        ADD CONSTRAINT venue_updated_by_fk  FOREIGN KEY (updated_by)  REFERENCES staff_user(id);
ALTER TABLE table_seat   ADD CONSTRAINT seat_created_by_fk   FOREIGN KEY (created_by)  REFERENCES staff_user(id);
ALTER TABLE table_seat   ADD CONSTRAINT seat_updated_by_fk   FOREIGN KEY (updated_by)  REFERENCES staff_user(id);
ALTER TABLE visit        ADD CONSTRAINT visit_opened_by_fk   FOREIGN KEY (opened_by)   REFERENCES staff_user(id);  -- BRIEF-011 Q3

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

-- Pending sign-in requests from LINE accounts that are not registered yet (CD-13 Q1, Field 2026-10-09).
-- Owner/manager approves (creates staff_user + identity + memberships) or rejects.
CREATE TABLE staff_access_request (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider      identity_provider NOT NULL,
  external_id   VARCHAR(300) NOT NULL,
  display_name  VARCHAR(200),
  avatar_url    VARCHAR(500),
  status        VARCHAR(20) NOT NULL DEFAULT 'pending',   -- pending | approved | rejected
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at    TIMESTAMPTZ,
  decided_by    UUID REFERENCES staff_user(id),
  UNIQUE (provider, external_id)
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
  image_key    VARCHAR(500),            -- S3 object key of the menu photo, NULL = no photo (CD-06 Q1, Field 2026-10-09)
  base_price   NUMERIC(10,2) NOT NULL DEFAULT 0,
  item_type    item_type NOT NULL DEFAULT 'simple',
  kitchen_tag  kitchen_station,          -- NULL only for item_type = 'charge' (DR-012)
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  is_promo     BOOLEAN NOT NULL DEFAULT FALSE,   -- promo analytics split (DR-010)
  sort_order   SMALLINT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by   UUID REFERENCES staff_user(id),
  updated_by   UUID REFERENCES staff_user(id),
  CONSTRAINT chk_menu_item_station CHECK ((item_type = 'charge') = (kitchen_tag IS NULL))  -- DR-012
);

-- Time windows for an item (DR-010). No rows = always available (subject to is_available).
-- days_of_week = the day the window STARTS (DR-010 rule 10); end_time < start_time = crosses midnight.
CREATE TABLE menu_item_availability (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id  UUID NOT NULL REFERENCES menu_item(id) ON DELETE CASCADE,
  days_of_week  SMALLINT[] NOT NULL,          -- ISO 1=Mon … 7=Sun
  start_time    TIME NOT NULL,                -- venue local time (Asia/Bangkok)
  end_time      TIME NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by    UUID REFERENCES staff_user(id),
  updated_by    UUID REFERENCES staff_user(id),
  CONSTRAINT chk_avail_time CHECK (start_time <> end_time),
  CONSTRAINT chk_avail_days CHECK (days_of_week <@ ARRAY[1,2,3,4,5,6,7]::SMALLINT[]
                                   AND cardinality(days_of_week) > 0)
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
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,   -- DR-024: "delete group" archives; never a hard delete
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

-- One row = one order: what was sent in one go, shown as "#001" (DR-013).
-- An order has 1..3 tickets (bar / food / charge); each ticket has 1..n items.
CREATE TABLE order_record (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id       UUID NOT NULL REFERENCES visit(id),
  order_number   INT  NOT NULL,             -- daily sequence, shown "#001" (DR-013)
  business_date  DATE NOT NULL,             -- business day, 06:00 Asia/Bangkok cut-off (DR-013)
  guest_session_id UUID REFERENCES guest_session(id),  -- NULL = staff order; set = placed from a guest phone (DR-028, BRIEF-048 — "ของฉัน")
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by     UUID REFERENCES staff_user(id),   -- NULL = customer QR order
  updated_by     UUID REFERENCES staff_user(id),
  CONSTRAINT uq_order_number_per_day UNIQUE (business_date, order_number)
);
CREATE INDEX idx_order_guest_session ON order_record(guest_session_id) WHERE guest_session_id IS NOT NULL;

-- One row = one station's part of an order; owns the STATUS (DR-012, DR-013).
-- Split by station only when venue.kitchen_display_enabled; otherwise one 'bar' ticket (+ charge ticket).
CREATE TABLE order_ticket (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id            UUID NOT NULL REFERENCES order_record(id),
  station             kitchen_station,           -- NULL = charge-only ticket, created as 'sent'
  status              order_status NOT NULL DEFAULT 'pending',
  issue_reason        VARCHAR(30),               -- out_of_stock | equipment | other (shown while status = 'issue')
  issue_item_id       UUID,                      -- FK → order_item, added below (circular)
  issue_note          TEXT,                      -- required when issue_reason = 'other'
  issue_reported_by   UUID REFERENCES staff_user(id),
  issue_escalated_at  TIMESTAMPTZ,               -- "ส่งให้ POS" (NULL = not escalated)
  sent_at             TIMESTAMPTZ,               -- served time
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID REFERENCES staff_user(id),
  updated_by          UUID REFERENCES staff_user(id),   -- name in "กำลังเตรียม · ชื่อ" (CD-08 R14)
  CONSTRAINT uq_ticket_station_per_order UNIQUE NULLS NOT DISTINCT (order_id, station)
);

CREATE TABLE order_item (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id             UUID NOT NULL REFERENCES order_ticket(id),   -- order reached through the ticket (DR-013)
  menu_item_variant_id  UUID NOT NULL REFERENCES menu_item_variant(id),
  item_name_snapshot    VARCHAR(200) NOT NULL,   -- frozen at order time (DR-022) — a later rename never rewrites a past order
  variant_name_snapshot VARCHAR(200) NOT NULL,   -- frozen at order time (DR-022)
  line_no               SMALLINT NOT NULL,       -- 1 … n per order, request order (DR-022)
  quantity              SMALLINT NOT NULL DEFAULT 1,
  unit_price_snapshot   NUMERIC(10,2) NOT NULL,   -- frozen at order time
  ordered_by_name       VARCHAR(100),           -- e.g. 'Filippo' — label shown on order card
  notes                 TEXT,
  cancelled_at          TIMESTAMPTZ,            -- NULL = active; no per-item progress (DR-012, DR-013)
  cancelled_by          UUID REFERENCES staff_user(id),
  cancel_reason         VARCHAR(50),            -- ของหมด / สั่งผิด / ของเสีย … (CD-15 R3)
  cancel_note           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by            UUID REFERENCES staff_user(id),
  updated_by            UUID REFERENCES staff_user(id)
);

ALTER TABLE order_ticket ADD CONSTRAINT fk_ticket_issue_item
  FOREIGN KEY (issue_item_id) REFERENCES order_item(id);

CREATE TABLE order_item_modifier (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id        UUID NOT NULL REFERENCES order_item(id),
  modifier_option_id   UUID NOT NULL REFERENCES modifier_option(id),
  option_name_snapshot VARCHAR(200) NOT NULL,     -- frozen at order time (DR-022)
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
  qr_payload      TEXT,                  -- gateway QR, or app-generated amount-locked PromptPay payload (DR-014 #6)
  confirmed_via   payment_confirmed_via, -- NULL while pending
  slip_trans_ref  VARCHAR(100) UNIQUE,   -- bank reference from the verified slip — rejects reused slips (DR-014 #6)
  slip_amount     NUMERIC(12,2),         -- amount the bank reports for that slip
  paid_at         TIMESTAMPTZ,
  attempt_id      UUID NOT NULL,         -- groups the parts of one checkout; merge = 1 part (BRIEF-013 Q2)
  part_no         SMALLINT NOT NULL DEFAULT 1,
  part_count      SMALLINT NOT NULL DEFAULT 1,
  status_reason   VARCHAR(30),           -- staff_cancel | guest_cancel | expired | webhook_missing | direct_transfer | other (CD-03 F1; guest_cancel = BRIEF-052)
  status_note     TEXT,                  -- required when status_reason = 'other' (CD-03 F3)
  expires_at      TIMESTAMPTZ,           -- pending QR lifetime, 15 min (CD-03 Q1)
  guest_session_id UUID REFERENCES guest_session(id),  -- NULL = staff created; set = the guest phone that created it — only it may cancel (BRIEF-052)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      UUID REFERENCES staff_user(id),
  updated_by      UUID REFERENCES staff_user(id)
);

CREATE INDEX idx_payment_guest_session ON payment(guest_session_id) WHERE guest_session_id IS NOT NULL;

-- Which orders does this payment cover?
CREATE TABLE payment_order (
  payment_id  UUID NOT NULL REFERENCES payment(id),
  order_id    UUID NOT NULL REFERENCES order_record(id),
  PRIMARY KEY (payment_id, order_id)
);

-- Which split part carries a charge line (CD-03 Q2, BRIEF-013 Q2)
CREATE TABLE payment_charge_item (
  payment_id     UUID NOT NULL REFERENCES payment(id),
  order_item_id  UUID NOT NULL REFERENCES order_item(id),
  PRIMARY KEY (payment_id, order_item_id)
);

-- ============================================================
-- 8. BOTTLE KEEP
-- ============================================================

CREATE TABLE bottle_keep (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id         UUID REFERENCES customer(id),          -- optional: most regulars are not LINE-linked
  guest_label         VARCHAR(100),   -- name on the post-it, e.g. 'พี่เอก' (DR-014)
  inventory_item_id   UUID NOT NULL REFERENCES inventory_item(id),
  quantity_registered SMALLINT NOT NULL DEFAULT 1,
  remaining_quantity  SMALLINT NOT NULL DEFAULT 1,
  remaining_note      TEXT,           -- e.g. 'ครึ่งขวด', '2 bottles left'
  opened_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at        TIMESTAMPTZ,
  location_note       TEXT,
  status              bottle_keep_status NOT NULL DEFAULT 'active',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID REFERENCES staff_user(id),
  updated_by          UUID REFERENCES staff_user(id),
  CONSTRAINT bottle_keep_owner_chk CHECK (customer_id IS NOT NULL OR guest_label IS NOT NULL)
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
-- 10. SHIFT & AI INSIGHT (DR-014)
-- ============================================================

-- Cash count at close: opening float → counted vs expected → manager review (DR-014 #7)
CREATE TABLE shift (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_date   DATE NOT NULL,                 -- venue business day (cut-off)
  opened_by       UUID NOT NULL REFERENCES staff_user(id),
  opened_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  opening_float   NUMERIC(12,2) NOT NULL DEFAULT 0,
  closed_by       UUID REFERENCES staff_user(id),
  closed_at       TIMESTAMPTZ,
  counted_cash    NUMERIC(12,2),                 -- entered blind by staff
  expected_cash   NUMERIC(12,2),                 -- snapshot at close: float + cash payments
  reviewed_by     UUID REFERENCES staff_user(id),
  reviewed_at     TIMESTAMPTZ,
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      UUID REFERENCES staff_user(id),
  updated_by      UUID REFERENCES staff_user(id)
);

-- AI owner insight: SQL computes the figures, the model explains them (DR-014 #11).
-- Append-only history; totals only, staff as aliases — no guest data sent to the model.
CREATE TABLE ai_insight (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kind            ai_insight_kind NOT NULL,
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  input_snapshot  JSONB NOT NULL,                -- the aggregated numbers sent (source of every figure shown)
  output          JSONB NOT NULL,                -- structured summary / alerts / suggestions
  model           VARCHAR(100) NOT NULL,
  tokens_used     INT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      UUID REFERENCES staff_user(id) -- NULL = scheduled job
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Visit lookups
CREATE INDEX idx_visit_table_seat   ON visit(table_seat_id);
CREATE INDEX idx_visit_customer      ON visit(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_visit_state         ON visit(state);
CREATE UNIQUE INDEX uq_visit_live_per_seat ON visit(table_seat_id) WHERE state IN ('open','active','idle');  -- one live visit per seat (BRIEF-011 Q1)
CREATE UNIQUE INDEX uq_menu_category_name ON menu_category (lower(trim(name)));  -- category names unique, hidden included (DR-025)

-- Menu availability windows (DR-010)
CREATE INDEX idx_menu_item_avail_item ON menu_item_availability(menu_item_id);

-- Order lookups
CREATE INDEX idx_order_visit         ON order_record(visit_id);
CREATE INDEX idx_ticket_order        ON order_ticket(order_id);   -- DR-013
CREATE INDEX idx_ticket_status       ON order_ticket(status);
CREATE INDEX idx_shift_business_date ON shift(business_date);
CREATE INDEX idx_ai_insight_period   ON ai_insight(kind, period_end);
CREATE INDEX idx_order_item_ticket   ON order_item(ticket_id);

-- Payment lookups
CREATE INDEX idx_payment_visit       ON payment(visit_id);
CREATE INDEX idx_payment_status      ON payment(status);
CREATE INDEX idx_payment_order_pay   ON payment_order(payment_id);
CREATE INDEX idx_payment_order_ord   ON payment_order(order_id);
CREATE INDEX idx_payment_visit_status ON payment(visit_id, status);   -- BRIEF-013 Q2

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

-- ── updated_at trigger (DR-023, BRIEF-043) ───────────────────
-- The database sets updated_at on every UPDATE, whoever writes the row: monotonic per row, so a
-- transaction that started first but locks the row second still stamps later than the previous write.
CREATE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := GREATEST(now(), OLD.updated_at + interval '1 millisecond');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_venue_updated_at                  BEFORE UPDATE ON venue                  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_table_seat_updated_at             BEFORE UPDATE ON table_seat             FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_visit_updated_at                  BEFORE UPDATE ON visit                  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_staff_user_updated_at             BEFORE UPDATE ON staff_user             FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_menu_category_updated_at          BEFORE UPDATE ON menu_category          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_menu_item_updated_at              BEFORE UPDATE ON menu_item              FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_menu_item_availability_updated_at BEFORE UPDATE ON menu_item_availability FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_menu_item_variant_updated_at      BEFORE UPDATE ON menu_item_variant      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_modifier_group_updated_at         BEFORE UPDATE ON modifier_group         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_modifier_option_updated_at        BEFORE UPDATE ON modifier_option        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_order_record_updated_at           BEFORE UPDATE ON order_record           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_order_ticket_updated_at           BEFORE UPDATE ON order_ticket           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_order_item_updated_at             BEFORE UPDATE ON order_item             FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_payment_updated_at                BEFORE UPDATE ON payment                FOR EACH ROW EXECUTE FUNCTION set_updated_at();

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
