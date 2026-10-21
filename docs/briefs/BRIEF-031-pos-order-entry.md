# BRIEF-031 — Web POS: order for a table (menu → cart → send)

| | |
|---|---|
| **Status** | Ready |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | frontend |
| **Revision** | 1 |
| **Depends on** | **BRIEF-030 merged ✅ (#71)** (drawer — this brief adds its "สั่งแทนลูกค้า" button) · BRIEF-012 ✅ (`POST /visits/:visitId/orders`, `Idempotency-Key`, `409 ITEM_UNAVAILABLE`) · BRIEF-016 ✅ (menu with variants, modifier groups, `availableNow`) · BRIEF-028 ✅ (menu wrappers on contracts) |
| **References** | CD-04 handoff (order · item-sheet · order-states · send · send-conflicts · leave-confirm · §9) · CD-02 R8 (entry in the panel meta row) · DR-010 (promo windows) · DR-012 (server splits by station) · DR-017 (idempotency request hash) · `docs/api/README.md` §1 Idempotency, Money |
| **Audit depth** | Full (core flow — order placement) |
| **Size** | ~1–1.5 days · est. ~650–800 net-new lines (Q2) |

---

## 1. Goal
The cashier puts a table's order in from menu tiles in a few taps and sends it once; a retry never duplicates, and sold-out / out-of-window items are caught before they reach the bar.

## 2. Scope
### In
- **Entry:** drawer (030) gets **"สั่งแทนลูกค้า"** — secondary sm in the meta row when the table has orders, and the main action in the "ยังไม่มีออเดอร์" state → `/pos/tables/[visitId]/order`.
- **Screen (CD-04 order·1–2):** left = menu, right = cart (360). Header: back button · "โต๊ะ {label}" chip.
- **Menu:** `GET /menu/categories` + `GET /menu/items` (`itemType` `charge` hidden — see Out). Tabs ทั้งหมด + categories (sorted); SearchField (trim, substring, per category; no-result state menu·3). Tile = name (2-line clamp) · price (`basePrice`; "เริ่ม ฿x" when variant prices differ) · in-cart count Badge. `availableNow = false` → greyed, not pressable, label "หมด" (`sold_out`) or "โปร · เริ่ม HH:MM" from the next `windows` entry (`out_of_window`). Refetch every 60 s and on `menu.availability_changed` (DR-010 rule 12; the event exists after BRIEF-027).
- **Quick add (CD-04 R2):** one available variant and no required modifier group → +1 line, Toast "เพิ่ม {name} แล้ว" with "เลิกทำ".
- **Item sheet (item-sheet·1–3):** variant radio "ตัวเลือก" (unavailable variants disabled) · modifier groups (required / `minSelect` / `maxSelect`; unavailable options disabled; "เลือกได้สูงสุด n" at max) · "สั่งโดย" chips (names used in this cart + "+ ชื่อใหม่" popover, ≤ 30 chars) · note (≤ 500) · qty stepper (1–99) · "เพิ่มลงตะกร้า · ฿{preview}" disabled until required groups are met.
- **Cart:** lines (name · variant · modifiers · สั่งโดย) · qty stepper · ✕ remove (no confirm) · footer **preview** total + item count (Q1) · "ส่งออเดอร์" primary lg. Cart state lives in a page hook (`useReducer`), not Zustand.
- **Send:** one `POST /visits/:visitId/orders { items: [{ variantId, quantity, modifierOptionIds, orderedByName, notes }] }` with header `Idempotency-Key` = UUID made when the cart is created, **reused on every retry**, renewed only after success. Cart locked while pending.
  - `201` → `/pos/tables?visit=<id>`, Toast "ส่งออเดอร์ {label} แล้ว · n รายการ", new groups on top (030 refetches on `order.created`).
  - `409 ITEM_UNAVAILABLE` (`data.details: UnavailableLine[]`) → those lines move to the top, struck, Badge "หมด" / "หมดเวลาโปร", excluded from the preview, Alert "ลบออกก่อนจึงจะส่งได้", send disabled until removed (conflicts·4, ·7). Same UI when a tile flips to unavailable live (conflicts·5).
  - `409 INVALID_STATE_TRANSITION` (visit closed) → Alert "ออเดอร์ไม่ถูกส่ง — กลับไปที่โต๊ะแล้วเลือกใหม่", cart locked, back discards (conflicts·6).
  - `409 IDEMPOTENCY_KEY_REUSED` (cart edited after a failed send) → new key, Alert "ส่งอีกครั้งได้" (DR-017).
  - `403` → Alert (conflicts·8), cart kept · network → Alert "ตะกร้ายังอยู่ครบ — ส่งซ้ำจะไม่เกิดออเดอร์ซ้ำ", retry same key.
- **Money helper reuse (BRIEF-028 S4, BRIEF-030 S3):** once `lib/utils/money.ts` exists, `MenuItemRow.priceLabel` and `session-groups.hasMoney` compare through it instead of `Number()` (two one-line swaps).
- **Leave:** empty cart → back; items → AlertDialog "ทิ้งตะกร้า?" (อยู่ต่อ / ทิ้งตะกร้า).
- **States:** menu loading / error+retry / no result · cart empty · disconnected → Alert "สถานะเมนูอาจไม่ล่าสุด — ยังสั่งได้ ระบบตรวจของหมด / โปรหมดเวลาอีกครั้งตอนส่ง" (menu·5).
- MSW: `/visits/:id/orders` (201, 409 details, network) + menu with variants/modifiers.

### Out (do NOT build here)
- Charge items ("คิดกับใคร?", Badge ค่าบริการ — CD-04 charge·1–3) — not needed for the demo; next order-entry pass.
- Promo tab "โปรโมชั่น" as its own category (promos show inside their category with the window label) · swipe-to-remove · bottle keep · replace-after-void banner (BRIEF-018) · staff-app ordering (CD-14).

## 3. Contract
- **Endpoints used (all exist):** `GET /menu/categories` · `GET /menu/items` · `GET /visits/:id` (header label) · `POST /visits/:visitId/orders` (`PlaceOrderRequestSchema` → `Order`, 201).
- **WS events:** `menu.availability_changed` (after BRIEF-027; until then the 60 s refetch covers it).
- **Contracts changes:** none.
- **Permissions:** `menu:read`, `orders:create` (server-side).
- **Business rules:**
  - Quick add only for 1 variant + no required group; otherwise the sheet → CD-04 R2.
  - One send = one POST with one key per cart; retry never duplicates → api README D3 · DR-017.
  - Unavailable lines are never auto-removed; the user removes them → CD-04 §9.
  - Server splits the placement per station and reprices (`unit_price_snapshot`); the cart total is a preview only → DR-012 · DR-010 · Q1.
  - Failures keep the cart; visit closed locks it → CD-04 §9.

### 3b. Under the hood
- **Where:** `app/pos/tables/[visitId]/order/page.tsx` · `_components/{MenuPanel,MenuTile,ItemSheet,CartPanel,CartLine,LeaveDialog}.tsx` · `_hooks/useCart.ts` (reducer + idempotency key) · `lib/api/orders.ts` · `lib/utils/money.ts` (`sumMoney`, satang integers).
- **How:** tiles → `useCart` actions → send → `apiPost('/visits/:id/orders', body, OrderSchema, { idempotencyKey })` → branch on status/code.
- **Data:** cart only in memory; lost on reload or session expiry (CD-04 session-expired rule).
- **Why:** a reducer keeps cart rules (merge identical lines, lock, flag unavailable) testable without the UI.

## 4. Acceptance Criteria
- **AC-1** — Tapping a 1-variant, no-required-group item twice gives one line ×2 and a Toast with "เลิกทำ" that removes the last add; an item with a required group opens the sheet and "เพิ่มลงตะกร้า" stays disabled until it is satisfied; `maxSelect` stops further choices.
- **AC-2** — An item with `availableNow = false` is not pressable and reads "หมด" or "โปร · เริ่ม HH:MM".
- **AC-3** — "ส่งออเดอร์" sends exactly one POST with the cart's `Idempotency-Key`; a network failure then retry sends the **same** key and body; after `201` the screen returns to the table drawer with the Toast.
- **AC-4** — `409 ITEM_UNAVAILABLE` with two `details` flags exactly those lines (struck, top, excluded from the preview), shows the Alert and disables send until both are removed.
- **AC-5** — `409 INVALID_STATE_TRANSITION` locks the cart with its Alert; back discards without the leave dialog.
- **AC-6** — Back with items opens the leave dialog; "อยู่ต่อ" keeps the cart, "ทิ้งตะกร้า" returns to the drawer.
- **AC-7** — The cart preview equals the sum of `(variant price + option deltas) × qty` in satang (e.g. 3 × ฿33.33 = ฿99.99, no float drift).
- **AC-8** — Menu loading / error+retry / no-result / disconnected states per §2.
- **AC-9** — Gates pass; run proof done.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1, AC-7 | unit | `src/app/pos/tables/[visitId]/order/_hooks/useCart.test.ts` · `src/lib/utils/money.test.ts` |
| AC-1, AC-2 | component | `_components/ItemSheet.test.tsx` · `_components/MenuPanel.test.tsx` |
| AC-3–AC-6 | component | `_components/CartPanel.test.tsx` (MSW) |
| AC-3, AC-4 | e2e | `e2e/order-entry.spec.ts` (MSW: 201 path + 409 path) |

Gate commands (all must pass):
```bash
pnpm --filter @bar/frontend lint
pnpm --filter @bar/frontend typecheck
pnpm --filter @bar/frontend test
pnpm --filter @bar/frontend test:e2e
pnpm --filter @bar/frontend build
```
Run proof: BRIEF-028 run proof + `seed:menu`. UI change: open T1 → สั่งแทนลูกค้า → quick-add a drink ×2 + one item through the sheet → ส่งออเดอร์ → drawer shows the new group and the server total. Then mark a menu item sold out in the DB (or via BRIEF-027 if merged), add it from a stale tab → send → 409 flags the line. Screenshots in the handoff.

### Local Sonar scan
- Optional — Field's brief.

## 6. Constraints
- Idempotency key from `crypto.randomUUID()`; never regenerated on retry.
- Money: preview via `sumMoney()` on satang integers only; display via `formatTHB()`; server values win after send.
- `frontend.md` Hard Limits (item sheet will need a hook for its selection state); tokens only; Thai strings from CD-04 §6.
- Touch only: targets ≥ 44, primary 52.

## 7. Decision Points (Field Guard)
- **Q1 — Cart total on the client. ✅ Decided (Field, 2026-10-21): A.** api README / DR-002 #11: "Frontend formats, never calculates"; CD-04 shows a cart total before any order exists.
  - **A (chosen):** allow a **preview** total in the cart only — satang-integer helper, labelled by position (footer), never sent to the server; every saved total stays server-made. *Why:* the cashier needs the number while the guest stands there; the server reprices on send anyway. *Trade-off:* one small exception to a rule — record it as a DR-002 amendment line at seed.
  - **B:** no cart total; show item count only. *Why not:* CD-04 J1 and the counter use case read the total aloud.
- **Q2 — Size. ✅ Decided (Field, 2026-10-21): one brief** at est. ~650–800 lines. *Why:* cart, sheet and send share one reducer and fixture; BRIEF-017 / 027 precedent; a split would leave the demo without options.
- **DR-002 Amendment 1 (Field-approved text, 2026-10-21 — added to `docs/decisions/DR-002-frontend-stack.md` in this seed):**
  > **Amendment 1 — Cart preview total · 2026-10-21 (BRIEF-031 Q1)**
  > #11 exception: the POS cart may show a **preview** total before an order exists — `(variant price + modifier deltas) × qty`, computed in integer satang by one helper (`lib/utils/money.ts`), display only, never sent to the server. Every stored or charged amount stays server-made; after send the UI shows the server total. Also allowed: the cash "รับเงินมา" change helper (CD-03, display only).
  > **Decision:** Approved — Field, 2026-10-21 (session)
- **Pre-decided:** route `/pos/tables/[visitId]/order` · header `Idempotency-Key` · paths above · no new packages.
- **Likely DRs:** none expected.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates (incl. run proof) and evidence; dependencies have completion conditions
- [x] Size — over target, Field-accepted (Q2)
- [x] No unresolved decision blocking the main outcome (Q1 decided)
- [x] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-21 | Initial Draft (Cowork) — 10 Nov UI slice #4 |
| 1 | 2026-10-21 | Field in session: Q1 A (cart preview total in satang, never sent; DR-002 amendment at seed); Q2 one brief; DR-002 Amendment 1 text approved — recorded by Cowork on Field's explicit instruction |
| 1 | 2026-10-22 | 030 merged (#71); + money-helper reuse (028 S4, 030 S3). Field: "seed it" (session) → Ready — recorded by Cowork on Field's explicit instruction |
