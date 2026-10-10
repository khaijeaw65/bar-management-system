# DR-010 — Promotions as time-windowed menu items (Phase 1 shape)

| | |
|---|---|
| **Status** | Approved |
| **Raised by** | Field via Cowork · 2026-10-10 |
| **Brief** | none — found during UI design (customer web / POS menu) |
| **Category** | Data · Flow/Architecture |

## Context
FRD §9 lists Happy Hour and a Promotion Engine (time-based, bundle, event-based, manual discount with reason code), and DR-009 places "happy hour / promotions" in back office for **S2**. `schema.sql` has no structure for any of it: `menu_item` has only `is_available`, and `order_item` has only `unit_price_snapshot`.

The most common Thai bar promo is a **time-limited bundle**: "before 21:00 — Leo ×4 for 390฿". UI design for the menu (customer web, POS) needs to know how a promo appears, and the schema needs a slot for it before menu management (back office, S1) is built. Otherwise it gets retrofitted.

**Field research (Field, 2026-10-10):** the bars visited run promos as a **separate time-based menu**, e.g. "Leo ×4 + ice bucket for X฿ before 21:00". Each promo is its own menu entry, not a variant or price change of the regular item. No same-item happy-hour price override was observed.

## Options
**A) Promo = a normal menu item + availability window**
A bundle is a `menu_item` (`item_type = 'recipe'`) whose variant has the promo price, and its `menu_variant_ingredient` rows deduct the bundle contents (e.g. 4 × Leo bottle). The only new piece is a schedule table:
```sql
-- §4 MENU — menu_item: add one column
  is_promo     BOOLEAN NOT NULL DEFAULT FALSE,   -- promo analytics split (DR-010)

-- §4 MENU — new table, after menu_item
-- Time windows for an item (DR-010). No rows = always available (subject to is_available).
CREATE TABLE menu_item_availability (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id  UUID NOT NULL REFERENCES menu_item(id) ON DELETE CASCADE,
  days_of_week  SMALLINT[] NOT NULL,          -- ISO 1=Mon … 7=Sun
  start_time    TIME NOT NULL,                -- venue local time (Asia/Bangkok)
  end_time      TIME NOT NULL,                -- end < start = crosses midnight
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by    UUID REFERENCES staff_user(id),
  updated_by    UUID REFERENCES staff_user(id),
  CONSTRAINT chk_avail_time CHECK (start_time <> end_time),
  CONSTRAINT chk_avail_days CHECK (days_of_week <@ ARRAY[1,2,3,4,5,6,7]::SMALLINT[]
                                   AND cardinality(days_of_week) > 0)
);

-- indexes section
CREATE INDEX idx_menu_item_avail_item ON menu_item_availability(menu_item_id);
```
Why: several rows per item allow e.g. "Mon–Thu all night" + "Fri–Sat before 21:00" · `is_promo` is a flag, not derived from "has a window" (an all-day promo exists; a regular item can be time-limited, e.g. kitchen closes 22:00) · audit columns keep `AuditSubscriber` working · `order_item` unchanged (snapshot already freezes price).
Pros: order → pay → close untouched (price frozen by the existing `unit_price_snapshot`) · stock deduction reuses the recipe path · no discount math or stacking rules · covers bucket, "before X o'clock" and set-menu promos.
Cons: no percentage-off across many items · no mix-and-match bundles (any 4 of Leo/Singha/Chang) · no stacking.

**B) Full promotion engine** (`promotion` + rules + targets + discount lines on the bill)
Pros: covers all FRD §9 types. / Cons: touches order total, payment amount lock, bill rendering and analytics. Larger scope than the remaining S1/S2 time supports, and it risks the core slice.

**C) Do nothing until S2**
Pros: zero work now. / Cons: menu UI and menu-management CRUD are designed without the slot, so they need rework later.

## Recommendation
**A.** It matches how small Thai bars actually run promos, and it plugs into existing tables. The core slice (order → pay → close) stays unchanged. Option B is deferred to a later phase and only built if a real need appears (percentage-off, mix-and-match).

## Pre-decided rules (if A is approved)
1. **Server clock only.** The backend decides whether an item is in its window (venue timezone Asia/Bangkok). The client clock is never trusted.
2. **Eligibility is checked at order submit.** An order submitted at 20:59 keeps the promo price even if accepted after 21:00. This is consistent with `unit_price_snapshot` and FRD §8 "freeze what must be frozen".
3. **Outside the window: greyed out on every surface that shows the menu** (customer web, POS, staff app). The item shows its window ("เริ่ม 17:00" / "ถึง 21:00") and cannot be added to the cart. It stays visible as marketing; it is not hidden.
4. **Re-validate on submit.** If a cart holds a promo item and the window closes before submit, the API rejects that line with a clear error, and the UI asks the guest to remove it or replace it with the regular item.
5. **Windows crossing midnight** (e.g. 22:00–02:00) are supported via `end_time < start_time`. The venue business day is not considered here.
6. **Mix-and-match bundles are out of scope.** The bundle contents are fixed per variant.
7. **Promo items live in their own `menu_category`** (e.g. "โปรโมชั่น"), which mirrors the separate promo menu seen in the field. The category itself has no schedule; each item carries its own window.
8. **Bundle extras such as an ice bucket** are part of the item name and description. Add them as a `menu_variant_ingredient` only if that stock is actually tracked (e.g. ice). No special handling.
9. **No same-item price override.** Plain-price happy hour is modelled as a separate promo item. Revisit only if a venue needs it.
10. **`days_of_week` = the day the window starts.** "Fri 22:00–02:00" covers Friday 22:00 → Saturday 02:00; Saturday 01:00 is in that window because it started on Friday. Tests must cover this case.
11. **Error for an expired promo line = `409 ITEM_UNAVAILABLE` with `reason: "out_of_window"`** (sold out uses `reason: "sold_out"`). Every surface reuses the sold-out cart-line pattern (void card + remove), copy "หมดเวลาโปร — ลบออกเพื่อส่งต่อ". No new error code.
12. **Live state:** menu API returns `available_now` + the window per item; clients refetch the menu every 60 s while a menu screen is open (plus on `menu.availability_changed`). A scheduled backend job pushing window edges is a later improvement, not S1.

## Known limitation (accepted)
- A bundle stays orderable when its contents are 86'd (e.g. Leo out of stock), same as every recipe item today. Staff mark the promo unavailable by hand. Auto-derived availability is not in scope.

## Phasing
- **Schema + seed:** add with the menu-management brief (back office, S1), so the CRUD is built once.
- **Customer web / POS display (badge, countdown, greyed state):** S1 if menu work has buffer, otherwise S2. This does not block the 8 Nov gate.
- **Back-office promo form** (window editor): S2, per DR-009.
- **Promotion engine (Option B), manual discount with reason code:** unchanged, FRD §9 / later phase.

## Follow-ups
- [x] `docs/FRD.md` §9 — Phase 1 shape = this DR (done 2026-10-10)
- [x] `docs/schema.sql` — `menu_item_availability` + `menu_item.is_promo` added 2026-10-10 (Cowork, Field-approved edit; executed clean on Postgres)
- [x] `docs/erd.html` — table + column added 2026-10-10
- [x] CLAUDE.md table count → 34 (also counts `staff_access_request`, previously missing) 2026-10-10
- [x] DR-009 back-office line refined to point here (2026-10-10)

---

## Decision — Field only
**Decision:** Approved: A — with rule 3 changed: out-of-window promo items are greyed out (not hidden) on customer web as well as POS.
**Amendment (Field, 2026-10-10, after Cowork review):** rule 3 covers the staff app too; rules 10–12 and the known limitation added.
**Why:** Field research (2026-10-10): Thai bars run promos as a separate time-based menu of standalone items, which matches A. Showing upcoming promos greyed out works as marketing.
**Date:** 2026-10-10 (recorded by Cowork from Field's explicit decision in session)
