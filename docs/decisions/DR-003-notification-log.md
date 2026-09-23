# DR-003 — Notification log table (in-app notification feed)

| | |
|---|---|
| **Status** | Pending |
| **Raised by** | Field via Cowork · 2026-09-23 |
| **Brief** | none (future BE notifications brief) |
| **Category** | Data |

## Context
DR-002 removes the PWA, which means no Web Push on the web. Real-time delivery is WebSocket only, so any notification sent while a tab is closed is lost. Field wants a stored log shown the way Facebook's web app shows notifications: a bell, an unread count, a list, click-through to the source, and mark as read. The Expo app will read the same feed. `docs/schema.sql` has no table for this (32 tables today).

## Options
**A) One row per recipient staff user** — trivial queries (`WHERE recipient = me`), per-person read state / fan-out writes (one event → N rows; N = on-shift staff, small for a single bar).
**B) One row per event + a `notification_read` join table** — no fan-out / every "unread" query needs an anti-join; harder for a first implementation.
**C) No table — WebSocket only** — zero work / nothing survives a closed tab; fails the requirement.

## Recommendation
**A.** A single bar has a handful of staff, so fan-out cost is negligible and the queries stay simple. `read_at` is a timestamp, not a boolean, so we also get "when was it read" for free.

### SQL sketch
```sql
CREATE TYPE notification_type AS ENUM (
  'table_idle', 'table_opened', 'restock_request', 'low_stock',
  'payment_confirmed', 'qr_order_new', 'food_ready', 'call_staff'
);  -- mirrors FRD §13 triggers; enum also exported from @bar/contracts

CREATE TABLE notification (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id  UUID NOT NULL REFERENCES staff_user(id),
  type          notification_type NOT NULL,
  title         VARCHAR(200) NOT NULL,       -- Thai UI text, rendered as-is
  body          VARCHAR(500),
  ref_type      VARCHAR(50),                 -- 'order' | 'visit' | 'payment' | 'inventory_item' …
  ref_id        UUID,                        -- click-through target (no FK: polymorphic)
  read_at       TIMESTAMPTZ,                 -- NULL = unread
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notification_feed ON notification(recipient_id, created_at DESC);
CREATE INDEX idx_notification_unread ON notification(recipient_id) WHERE read_at IS NULL;
```

### Rules
- **Not an audited entity.** The system writes it and staff only set `read_at`, so there is no `created_by`/`updated_by`. It's an explicit exception to the "all mutable tables" rule, like `audit_log`.
- **Flow:** domain service → `NotificationsModule.notify(recipients, payload)` → insert rows → emit WebSocket `notification:new` to each recipient. Order and Payment modules call `NotificationsModule`, never the gateway (matches CLAUDE.md).
- **Recipients** are resolved at creation time from permissions (e.g. everyone with `orders:read` whose group membership is valid now).
- **Endpoints (sketch):** `GET /notifications?cursor=` · `GET /notifications/unread-count` · `PATCH /notifications/:id/read` · `PATCH /notifications/read-all`.
- **Retention:** decide later (e.g. purge > 30 days via a BullMQ repeatable job). Not needed for Sprint 7.

**Follow-ups (Field, manual — protected):** `docs/schema.sql` (+1 table, +1 enum → 33 tables), `docs/erd.html`, CLAUDE.md table count, FRD §13.

---

## Decision — Field only
**Decision:** <Approved: A · Rejected · Approved with change: …>
**Why:**
**Date:**
