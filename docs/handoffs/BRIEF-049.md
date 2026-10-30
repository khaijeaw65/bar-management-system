# Handoff — BRIEF-049 Web: customer QR — check-in, menu, item sheet, cart, send (C3)

| | |
|---|---|
| **Implementer** | kj (Claude Code) |
| **Date** | 2026-10-30 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-049-customer-order-ui` |
| **Commit** | Work SHA: see chat (not recorded here — no SHA-record commits) |
| **Status** | Audit PASS (Cowork, re-audit 3 on S = `ff7869c`) — PR open |

> Created at `Implemented`. Updated once in the PASS commit (this version). Frozen at merge.

## Summary
- **Shared logic → `src/lib/order/`:** `cart.ts`, `item-draft.ts` moved (git mv, POS imports updated); typed against a structural `OrderableItem` (`orderable.ts`). The line / selection helpers (`lineFrom`, `selectionReady`, `selectRadio`, `toggleOption`, `groupMinimum/Count`, `tilePrice`) moved to `lib/order/catalog.ts`; POS `catalog.ts` keeps its POS-only helpers. Cart tests moved to `lib/order/cart.test.ts`. One additive reducer action `reset` (new cart + new key after a 201). No POS UI change.
- **Client:** `lib/api/customer.ts` (start / get / update session, menu, placeOrder) + a guest-expired signal; `client.ts` `skipsRefresh` now also covers `/customer/*` so a guest 401 never calls the staff refresh.
- **`/scan/[qrToken]`:** one POST per scan (query key dedups strict mode), nickname ≤ 30 + skip, loading / invalid QR (no retry) / 429 / network states → `router.replace('/customer/menu')`.
- **`/customer` layout (`CustomerShell`):** session query, expired screen (no loop), header, `CartProvider` (reducer + localStorage + menu sync that flags sold-out lines).
- **`/customer/menu`:** 2-col grid, photo or icon, category chips, search, promo shown as-is, out-of-window greyed with its start, sold-out "หมด"; 60 s + focus refetch; item sheet (half `Drawer` for plain items incl. update / remove at qty 0, full `Modal` for items with options).
- **`/customer/cart`:** qty / remove, nickname change (PATCH), one `POST /customer/orders` with the cart's Idempotency-Key (kept until 201, retry reuses it), 409 lines flagged with "ลบออก", network notice, empty state; on 201 cart cleared + Toast "ส่งออเดอร์แล้ว · #001" → menu.
- **Item sheets:** both the full `Modal` and the half `Drawer` have a 44 px close button (`ปิด`, re-audit Must fix 2) + a component test.
- MSW: `src/mocks/customer.ts` (+ reset in test setup).
- ~2.1k lines incl. tests (tests ≈ 45 %) — over the ~900–1,100 estimate (UI ≈ 1.6× rule already noted).

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | e2e `AC-1` |
| AC-2 | ✅ | e2e `AC-2` (invalid QR) · component `CustomerShell.test` (expired, 1 call, 0 refresh) |
| AC-3 | ✅ | e2e `AC-3 J1` · `MenuScreen.test` · `CartScreen.test` |
| AC-4 | ✅ | e2e `AC-4 J2` · `CartScreen.test` |
| AC-5 | ✅ | e2e `AC-5` (two requests, same key) · `CartScreen.test` |
| AC-6 | ✅ | `MenuScreen.test` + e2e 360×780 no horizontal scroll |
| AC-7 | ✅ | `cart-storage.test` (incl. throwing stub) · e2e reload + blocked cart key |
| AC-8 | ✅ | all existing POS tests green after the move |
| AC-9 | ✅ | gates + run proof below |

## Gate Evidence (G1)
Frontend only; work SHA = the feat commit. e2e uses MSW (no backend in `test:e2e`).

| Command | Exit | Result |
|---|---|---|
| `@bar/frontend lint` | 0 | clean |
| `@bar/frontend typecheck` | 0 | |
| `@bar/frontend test` | 0 | 206 passed (one earlier run had 2 load timeouts — known flake; re-run all green) |
| `@bar/frontend test:e2e` | 0 | 29 passed (customer-order ×7) |
| `@bar/frontend build` | 0 | `/scan/[qrToken]`, `/customer/menu`, `/customer/cart` listed |

Run proof (real API, dev `bar`, backend :3011 + `next dev` :3010, T3 QR, phone 390×844, on S = `ff7869c`): scan → nickname "ต้น" → real menu → cart → send → 409 (variant marked sold out) → line flagged "หมดแล้ว — ลบออกเพื่อสั่งต่อ", send disabled → "ลบออก" → send → 201 (orders #2–#4 on T3, all `ordered_by_name = ต้น`, visit active) → POS `/pos/tables` T3 panel shows each line "สั่งโดย ต้น" and no ไฮบอล line. Sold-out variant restored afterwards. Dev `bar` keeps these test orders on T3.
Screenshots (`docs/handoffs/assets/BRIEF-049/`): `1-welcome`, `2-menu`, `3-item-full-sheet`, `3a-item-required-missing`, `4-cart`, `5-cart-409-line`, `6-pos-t3-order`, `7-after-remove-201`.

## Sonar (local scan)
- Gate: ERROR — `new_coverage` 0 % (no coverage report path configured — known follow-up) and 22 issues in BRIEF-048 backend / `setup.ts` code, not this brief.
- BRIEF-049 files: 3 issues found (S6819 group role, S3358 nested ternary, S6759 readonly props) → fixed, re-scan: **0** open in these files.

## Decisions Raised
- none

## Deviations from Brief
- **Cart key is `bar.customer.cart.<seatId>`, not `<sessionId>`:** `CustomerSession` (047 contract) has no session id; no contract change allowed here. Effect: a new guest session on the same seat on the same phone keeps its cart. One-line change if Field wants otherwise.
- **No synthetic "โปรโมชั่น" chip:** the real menu already has a promo category; the chip list is ทั้งหมด + API categories.
- **Charge category** (`ค่าบริการ`) appears as an empty chip on the real menu (server sends the category, no items) — shows "ยังไม่มีเมนูในหมวดนี้"; backend could hide empty categories (follow-up).
- Playwright can't see service-worker traffic, so e2e failure triggers are MSW notes (`หมดทดสอบ` = 409, `ล่มทดสอบ` = first send dropped), like the POS mock.

## Notes for the auditor / next briefs
- Open Suggestions carried (audit): #2 `RATE_LIMITED` notice (C4) · #4 hide empty guest categories (C4 backend touch) · #7 dark-theme unselected radio ring (DS, Field) · #8 dismiss Toasts on route change (C4).
- Next dev badge overlays the left edge of bottom CTAs in dev only (primary buttons are now full width).
- C4 will need: session `visitId` change after first order (tab), WS `/customer`, table-closed state (`state.closed` already maps `INVALID_STATE_TRANSITION`).
- AI usage: **High** — executor agent wrote the code; KJ is full reviewer (CLAUDE.md AI split).
