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

### Amendment (2026-09-23) — push delivery to the Expo app
DR-002 #1 makes the Expo app the only background-push channel. The feed table above stores notifications, but there is nowhere to store each phone's push token. Added here so all notification decisions stay in one DR.

```sql
CREATE TABLE staff_push_token (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_user_id   UUID NOT NULL REFERENCES staff_user(id) ON DELETE CASCADE,
  expo_push_token VARCHAR(255) NOT NULL UNIQUE,   -- 'ExponentPushToken[…]'
  platform        VARCHAR(10) NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_staff_push_token_user ON staff_push_token(staff_user_id);
```

- **Not an audited entity** — device registration data, same exception as `notification`.
- **Flow (extends the one above):** insert `notification` rows → WebSocket `notification:new` → enqueue BullMQ job `notification.push` → send to every token of each recipient via the **Expo Push API** (`https://exp.host/--/api/v2/push/send`, plain `fetch`, no SDK dependency). The app decides what to show in the foreground.
- **Why Expo Push:** one HTTP call covers iOS + Android; no FCM/APNs server code. Free.
- **Token hygiene:** `DeviceNotRegistered` in the push receipt → delete that token. `last_seen_at` updated on every app start.
- **Shared phones:** `PUT` with a token that belongs to another staff user → reassign it to the caller (UNIQUE on the token).
- **Endpoints (sketch):** `PUT /notifications/push-tokens` body `{ token, platform }` (upsert) · `DELETE /notifications/push-tokens/:token` (logout — see DR-005).
- **PDPA:** push title/body never contain guest notes or personal data — lock screens are visible to others. Use `title` + a short neutral `body` (e.g. "โต๊ะ 3 · ออเดอร์ใหม่").
- **iOS:** needs an Apple Developer account ($99/yr). Demo target is Android (EAS free tier); iOS only if the advisor asks.
- **Table count:** 32 + `notification` + `staff_push_token` = **34**.

**Follow-ups (Field, manual — protected):** `docs/schema.sql` (+2 tables `notification` + `staff_push_token`, +1 enum → **34 tables**), `docs/erd.html`, CLAUDE.md table count, FRD §13.

---

## Decision — Field only
**Decision:** <Approved: A · Rejected · Approved with change: …>
**Why:**
**Date:**
