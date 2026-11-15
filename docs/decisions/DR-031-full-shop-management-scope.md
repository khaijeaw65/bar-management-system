# DR-031 — Full shop management scope (bar-specific)

| | |
|---|---|
| **Status** | Approved |
| **Raised by** | Field via Cowork · 2026-11-07/08 (session, after advisor review) · updated 2026-11-08 with the 8-topic feature interview |
| **Brief / Feature** | none yet → one `docs/features/<f>/` spec per module below, just-in-time |
| **Category** | Scope · Data · Sensitive (staff pay, guest data) |

## Context
Advisor review (Nov 2026): the feature set is too thin compared with last year's café POS project. A bar runs a different business from a café, so the added scope should be bar-specific rather than a copy of café features:

| | Café | Bar |
|---|---|---|
| Payment | pay first, one bill at a time | open tab, pay at the end, large bills |
| Stay | short, much takeaway | hours |
| Stock risk | cheap items | expensive liquor lost per pour (over-pour, free drinks, missing bottles) |
| Regulars | stamp card | bottle keep, "what do they drink" |
| Law | little | alcohol sale hours + no-sale days |
| Extra revenue | rare | event tickets, whole-bar private bookings |

Field's field visits listed "no inventory tracking" as a key pain point. `docs/schema.sql` has inventory and `shift` tables, but none are migrated or coded yet. Stock, shift and event history are also the training data for DR-032's ML models.

The functional decisions for every module come from Field's feature interview (2026-11-08). Full answers: `docs/research/2026-11-08-feature-interview-notes.md` — that file becomes each module's `requirements.md`.

## Options

### Option A — Bar shop management in three tiers, built in order *(recommended)*

**Must** (the Semester 2 promise to the advisor)
| # | Module | Key decisions (interview) | Size |
|---|---|---|---|
| 1 | **Stock** — items → sale deduction → loss | Stock items with unit, container + yield, category A/B/C, opening stock. Optional recipe per menu item (no recipe = not tracked; food by portion / unit, not grams). Deduct **when the order is placed**; cancelled before made → stock returns; void after served → stays deducted, recorded as waste. **Auto-86** at 0 (warn at threshold) blocks **new** orders only, one-tap "ยังมีของ" override + override log. **Loss = "เปิดของใหม่" tap** per container (bottle, keg, food pack): sold since last open vs yield → missing portions, flag above a threshold. Adjustments with reason; optional periodic full count | L |
| 2 | **Purchasing** | Owner / manager only. PO flow for distributors (order → receive) + quick "ซื้อหน้าร้าน" cash buy without PO (optional receipt photo). No approval, no backorder (PO closes with shortfall noted). Paid / unpaid + due date per receipt. Purchase unit + conversion (case → bottles). **Weighted average cost.** Send PO = copy / share a Thai message | M |
| 3 | **Shift & cash close** (DR-014 #7) | One open shift per venue, sequential. Pay-in / pay-out with reason (cash buy "paid from drawer" creates the pay-out). Close: open-tab warning → blind cash count → PromptPay / transfer totals → low-stock checklist → summary → manager review. Open tabs carry over | S |
| 4 | **Expenses + P&L** | Editable categories, recurring fixed costs, performer fees + supplier bills flow in. Cost sold = recipe × weighted average cost. P&L = revenue − cost sold − comps (at cost) − waste − loss → gross − expenses → net; vs last month; margin per menu item | M |
| 5 | **Compliance lock + no-alcohol day mode** | Sale hours = venue setting (default current law), no-sale calendar preset + owner edits. Outside hours: alcohol hidden on guest QR, greyed on POS / staff app, **no override**, bottle-keep serving locked; already-placed orders still served and paid. No-sale day → restaurant mode banner + optional mocktail menu + ban-day report. Required alcohol flag on menu items **and** modifier options. **Legal rules confirmed with the advisor before building** | S |
| 6 | **Events + reservations** | Event types: ticketed concert / live-DJ night / private (auto from whole-bar booking). Form-based CMS + public event page (no login). Table / seat bookings by staff: **no deposit, no minimum spend**, held until a release time; **no auto-release** — two warnings, staff extend or cancel. Whole-bar booking = booking fee (ค่าเหมาร้าน) via amount-locked PromptPay, separate revenue; blocks overlapping bookings + ticket sales. Event report vs same weekday without an event, minus performer fee | M |
| 7 | **Bottle keep from the bill** (DR-014 #9) | "ฝากขวด?" at checkout → record linked to the order line. No level tracking. Staff serving from a kept bottle = ฿0, no stock deduction, mixers charged. No expiry; "ไม่ได้แตะนาน" filter | S |
| 8 | **ML + guest intelligence** | DR-032 (forecast, anomaly, ML health, recommendation) | L + M |

**Should** (build if Must is on time)
| # | Module | Key decisions | Size |
|---|---|---|---|
| 9 | **Ticketing** | Web-first: event page → name + phone + qty → PromptPay → slip verify → e-ticket QR. 15-min hold, capacity, early-bird, refunds manual. Anti-bot: Turnstile (**DR-034**, new dependency) + Redis rate limit + caps per order / phone + hold expiry + payment gate. Door check-in by staff-app scan, one use | M |
| 10 | **Staff schedule + check-in + payroll lite** | Weekly roster + push reminder. Check-in by scanning a rotating QR (~30 s) on the POS; manager fallback logged. Attendance = facts for pay only (no scores, no ranking). Pay run = days × rate (or salary) + bonus − advances → owner marks paid → wages expense. Owner-only | M |
| 11 | **Reorder list → PO** | Default supplier per item; one tap → one PO per supplier; ML forecast hint later | S |

**Later** (not promised): LINE OA (guest features + supplier auto-send, venue opt-in; copy / share stays the fallback) · guest self-booking from the public page · private-party packages.

- **Pros / Cons:** answers "full shop management" with features a café project cannot show; every module feeds ML (loss / overrides → anomaly, events / no-sale days → forecast) / ~25 new tables, 11 feature specs, Semester 2 time. If time runs short, cut the Should tier first, then Must from the bottom (8 stays — it is the AI grade).
- **Under the hood (recipe deduction — the main cross-module write):**
  1. Order line is placed (`POST` order).
  2. Same DB transaction: insert the order line + `inventory_transaction(usage, −qty, reference = order_item)` per recipe ingredient + update `quantity_on_hand`.
  3. Line cancelled before made → reversing `inventory_transaction(cancel, +qty)`. Void after served → no reversal; a `waste` record instead.
  4. After commit: stock at / below threshold → low-stock notification; stock = 0 and the item's auto-86 switch on → item 86'd for **new** orders (WebSocket event).
  - **Transaction boundary:** order line + stock transactions in one transaction; notifications and auto-86 after commit.
  - **Failure & cleanup:** transaction fails → no order line, no stock change (caller retries). Auto-86 event lost → next order re-checks stock on read. Stock may go negative (override path) — shown as loss, never blocks an overridden sale.

### Option B — Stock only [familiar baseline]
- **Pros / Cons:** smallest scope / does not answer the advisor; no bar-specific story against the café project.

## Recommendation
Option A in the tier order above. Stock first because purchasing, P&L, loss and the ML models read from it. Present the café-vs-bar table plus a one-page feature map (existing + Must + Should + ML) to the advisor on 10 Nov, and ask the advisor about the alcohol-law rules (module 5) there.

**Timeline (proposed — confirm before FRD v2):** AWS 9–20 Nov · exams 3 / 4 / 8 Dec · **Semester 1 final 14 Dec** shows the core slice on AWS + these docs + ML proof on synthetic data (+ stock / purchasing if done) · Dec–Jan stock deduction + loss, shift close, compliance, bottle keep · Feb P&L, events + reservations, forecast + anomaly live · 1–15 Mar guest intelligence + Should tier · **15 Mar feature freeze** · final Apr 2027.

**Cut:** payroll beyond lite (tax withholding, social security, OT rules, payslips, tip pooling), VAT, full accounting / general ledger, multi-branch, e-Tax invoice, customer credit tab (แปะไว้ — debt risk), staff performance analytics (unchanged). **Rejected in interview:** PO approval, backorder tracking, cover charge, table deposit / minimum spend, auto-release of bookings, zones, open-bar / per-head packages, bottle sets as a module (they are menu items), bottle-keep level tracking, GPS check-in, per-guest no-show count. **Parked:** bucket / buy-N-get-M promos.

## If Approved — Locks
- FRD v2.0: §5 / §8 / §9 / §11 / §12 / §14 rewritten to the modules above; new sections Purchasing, Events + reservations, Compliance, Staff & payroll lite. FRD §5 food rule → "optional recipe, portion / unit, category C untracked".
- **Superseded rule:** "negative stock never blocks a sale" → **"a stock-driven 86 is always one tap to override and never cancels sent orders."**
- Stock deducts **on order placed**; void after served = waste, not a reversal.
- Cost method = **weighted average cost**.
- Compliance lock has **no override**; it never cancels orders placed before the lock.
- Bookings: no deposit, no minimum spend, no auto-release. Event attribution = `business_date` + event time window (orders are not tagged).
- Attendance is for pay only — no staff scores or rankings (FRD cut stays).
- LINE OA = venue opt-in setting; every LINE-OA feature has a copy / share fallback.
- New IAM permissions: `purchasing`, `payroll`, `event:manage` (owner / manager), `reservation:write` (staff default).
- New schema (tentative names; exact columns in each feature `design.md`, each needs Field's OK): `supplier`, `purchase_order`, `purchase_order_line`, `stock_receipt` (+ line), `container_open`, `stock_override`, `stock_adjustment`, `stock_count` (+ line), `cash_movement`, `expense`, `expense_category`, `recurring_expense`, `event`, `ticket_order`, `ticket`, `reservation`, `alcohol_no_sale_day`, `staff_pay_profile`, `roster_shift`, `attendance`, `pay_run` (+ line) + `venue` sale-hour / opt-in settings + `is_alcohol` on menu item and modifier option + `bottle_keep.order_item_id` (inventory / `shift` tables already in `schema.sql`).
- New dependency Cloudflare Turnstile → separate **DR-034** when ticketing starts.

---

## Decision — Field only
**Decision:** Approved: A (Must / Should / Later tiers as written; P&L subtracts loss)
**Why:** Bar-specific scope answers the advisor's "too thin vs the café project" review; every module feeds the DR-032 models. Should tier is cut first if time runs short.
**Date:** 2026-11-08 (Field, in session — recorded by Cowork)
