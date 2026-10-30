# BRIEF-049 — Web: customer QR — check-in, menu, item sheet, cart, send (C3)

| | |
|---|---|
| **Status** | Ready — Rev 1 approved by Field 2026-10-29 |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | frontend |
| **Revision** | 1 |
| **Depends on** | **BRIEF-047 merged** (session + menu API) · **BRIEF-048 merged** (`POST /customer/orders`) · BRIEF-031 ✅ (POS order entry — cart logic moved here) |
| **References** | CD-06 handoff (boards `welcome`, `menu`, `item`, `cart`, J1, J2; §3 states, §7 layout, §8 components, §9 rules; R2 sheet-before-add, R3 nickname) · canvas https://claude.ai/artifact/6f5CBjGzpN4zYFotFQauGi · DR-028 (session) · DR-010 / DR-014 #10 (promo windows, no "was" price) · DR-020 (photos) · `docs/rules/frontend.md` |
| **Audit depth** | Full (customer-facing order path) |
| **Size** | ~1.5 days · est. ~900–1,100 net-new lines incl. tests |

---

## Interview — Selected (by KJ), 2026-10-29
| Q | Selected (by KJ) |
|---|---|
| Routes | Full words: `/scan/[qrToken]` → `/customer/menu`, `/customer/cart` (`/customer/tab` = C4) |
| Cart storage | `localStorage` per guest session (try/catch, memory fallback), cleared after send |
| Reuse POS code | Share pure logic (move `cart.ts`, `item-draft.ts` to `lib/order/`), own phone UI components |
| C3 / C4 split | C3 = order path + invalid QR / session expired · C4 = tab, call staff, WS live, table closed |
| *(proposed)* After send | Go to `/customer/tab` when C4 exists; until then stay on menu with a success Toast "ส่งออเดอร์แล้ว · #001" |
| *(proposed)* Menu freshness | Refetch `/customer/menu` every 60 s + on window focus (DR-010); live sold-out over WS comes with C4 |

## 1. Goal
A guest scans the table QR, optionally types a nickname, browses the menu with photos, adds items through a sheet, and sends the cart as one order — sold-out / expired-promo lines are caught at send and retries never duplicate.

## 2. Scope
### In
- **Shared order logic (refactor, no behaviour change):** move `app/pos/tables/[visitId]/order/cart.ts` and `item-draft.ts` to `src/lib/order/` (`cart.ts`, `item-draft.ts`). Type them against a small structural interface (`OrderableItem`: id, name, isPromo, variants with id/name/price/isAvailable/modifierGroups, availableNow, unavailableReason) that both `MenuItem` (POS) and `CustomerMenuItem` satisfy. POS imports updated; POS tests unchanged and green.
- **API client:** `src/lib/api/customer.ts` — `startSession(qrToken)`, `getSession()`, `updateSession(displayName)`, `getMenu()`, `placeOrder(items, idempotencyKey)` with the contracts schemas (same axios client, `withCredentials`).
- **`/scan/[qrToken]` (welcome):** on load `POST /customer/sessions` → welcome·1 "โต๊ะ T3" + optional nickname field (≤ 30, trimmed) + "ดูเมนู" (PATCH session when a name was typed) → `router.replace('/customer/menu')`. States welcome·2–5: typing + keyboard, loading, invalid QR (404 `QR_INVALID` → "QR ไม่ถูกต้อง กรุณาติดต่อพนักงาน"), 360×780. 429 → retry message.
- **`/customer` layout:** loads `GET /customer/session`; 401 `GUEST_SESSION_INVALID` anywhere → "เซสชันหมดอายุ กรุณาสแกน QR ที่โต๊ะอีกครั้ง" screen (no redirect loop). Header (blurred bar, table label). Cart bar (count + total + "ดูตะกร้า") on menu.
- **`/customer/menu`:** 2-column grid, photo 4:3 (`imageUrl`) or category-icon fallback, name 2-line clamp, price, "+" 44×44, in-cart count pill; category chips (single select, ทั้งหมด default); search (trimmed Thai substring, ✕ clears query only); promo category — promo price as-is, no crossed-out price; out-of-window greyed with "เริ่ม 17:00" / "ถึง 21:00", no "+"; sold-out "หมด", no "+". States menu·1–5, ·7, ·9–11 (·6 live sold-out and ·8 disconnected → C4).
- **Item sheet (R2 sheet-before-add):** "+" or card tap always opens a sheet. No-option item → half sheet qty + note; already in cart → opens at current qty, "อัปเดตตะกร้า", qty 0 → danger "ลบออกจากตะกร้า". Item with options → full sheet (photo 16:9, variants RadioGroup, modifier groups with required / max rules, note, qty), always a new line. States item·1–8.
- **`/customer/cart`:** lines with qty stepper + remove, modifier labels, line totals, total; "สั่งในชื่อ ต้น · เปลี่ยนชื่อ" (R3 — opens the nickname field, PATCH session); "สั่งเลย" → one `POST /customer/orders` with an `Idempotency-Key` generated per cart send and kept until success (retry reuses it); cart locked while pending. States cart·1–5, ·7, ·8: sending, 409 sold out → line voided with "ลบออก" (J2), 409 out_of_window → same, network error → retry keeps the key, empty cart. cart·6 table closed → C4.
- **Cart persistence:** `localStorage` key `bar.customer.cart.<sessionId>`; every read/write in try/catch; corrupt/blocked → memory only; cleared on 201.
- **Tests:** unit (logic in `lib/order` incl. moved tests, customer cart storage), component (menu card states, item sheet rules, cart send/409), Playwright e2e of J1 + J2 against MSW or the real API (executor picks; real API preferred if `test:e2e` already runs the backend).

### Out (do NOT build here)
- Running tab, call staff, WS `/customer`, live sold-out, disconnected banner, table-closed state (C4) · payment (C5) · POS bell/badge (C6) · QR printing (tables/QR admin) · LINE login / PDPA · multi-language · install / PWA.

## 3. Contract
- **Uses:** `POST /customer/sessions`, `GET` / `PATCH /customer/session`, `GET /customer/menu` (BRIEF-047) · `POST /customer/orders` (BRIEF-048). No new endpoints.
- **Contracts changes:** none (consumes 047 / 048 schemas).
- **Permissions:** none (guest cookie).
- **Business rules:** sheet before add (CD-06 R2) · promo shown as-is, out-of-window greyed not hidden (DR-010, DR-014 #10) · server decides availability; client only displays · one POST per cart with one Idempotency-Key (DR-017) · nickname is the session's, not per line (DR-028).

## 4. Acceptance Criteria
- **AC-1** — Scan `/scan/<valid>` → welcome shows the table label; type "ต้น" → ดูเมนู → session nickname = "ต้น", URL is `/customer/menu` (token gone); reload stays on the menu (cookie).
- **AC-2** — `/scan/<unknown>` → invalid-QR screen; an expired session on `/customer/menu` → session-expired screen, no loop.
- **AC-3** — J1: ช้าง via half sheet ×2, โอลด์แฟชั่น via full sheet with a required option (send blocked until chosen), ถั่วทอด → cart shows 3 lines + correct total → สั่งเลย → one POST, 201, cart cleared + success Toast.
- **AC-4** — J2: sold-out line at send → 409 → line marked, "ลบออก" removes it → send again → 201; out-of-window promo behaves the same.
- **AC-5** — Network failure on send → retry → same `Idempotency-Key` (no duplicate order on the server).
- **AC-6** — Menu: promo price without strikethrough; out-of-window item greyed with its window time and no "+"; sold-out shows "หมด"; search + category chips filter; 360×780 has no horizontal scroll.
- **AC-7** — Cart survives a full page reload; blocked `localStorage` (throwing stub) → app still works with a memory cart.
- **AC-8** — POS order entry still passes all its existing tests after the `lib/order` move; no POS UI change.
- **AC-9** — Gates + run proof pass.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1 – AC-5 | e2e (Playwright, phone viewport 390×844) | `app/frontend/e2e/customer-order.spec.ts` |
| AC-3, AC-4, AC-6 | component (Vitest + Testing Library) | `app/frontend/src/app/customer/**/_components/*.test.tsx` |
| AC-7 | unit | `app/frontend/src/app/customer/_lib/cart-storage.test.ts` |
| AC-8 | existing POS tests + moved logic tests | `app/frontend/src/lib/order/*.test.ts`, POS `*.test.tsx` |

Gate commands (all must pass):
```bash
pnpm --filter @bar/frontend lint
pnpm --filter @bar/frontend typecheck
pnpm --filter @bar/frontend test
pnpm --filter @bar/frontend test:e2e
pnpm --filter @bar/frontend build
```
Run proof (real API, ports BRIEF-046; no `next dev` during frontend e2e): phone viewport (DevTools 390×844 or a real phone on the LAN) → scan T3's URL → nickname → J1 → POS (`/pos/tables`, second window) shows T3 active and the order with "สั่งโดย ต้น" → mark one item sold out on the POS → J2 from the phone. Screenshots in the handoff (welcome, menu, item full sheet, cart, 409 line).

### Local Sonar scan
- **Required for this brief: yes** (new surface).
- Approved exclusions: none.

## 6. Constraints
- `docs/rules/frontend.md` Hard Limits; DS tokens only (no arbitrary values — lint test); HeroUI v3 per CD-06 §8 (Card, Image, Tabs/Tag chips, SearchField, Modal full, Drawer bottom, RadioGroup, CheckboxGroup, TextField, NumberField, Toast, Alert, Skeleton, EmptyState).
- Targets ≥ 44 px (primary 52) in thumb reach; Toast at top on phones (CD-06 §7).
- Thai strings hard-coded (no i18n), copy from CD-06 §6.
- No new dependency. No `localStorage` outside the cart storage helper.

## 7. Decision Points (Field Guard)
- **Pre-decided (exact):** routes `src/app/scan/[qrToken]/page.tsx`, `src/app/customer/layout.tsx`, `src/app/customer/menu/page.tsx`, `src/app/customer/cart/page.tsx` · shared logic at `src/lib/order/cart.ts`, `src/lib/order/item-draft.ts` · client `src/lib/api/customer.ts` · storage key `bar.customer.cart.<sessionId>` · the two *(proposed)* rows once Field approves.
- **Note:** BRIEF-047 §2 mentions the page as `/t/:qrToken` — superseded by `/scan/[qrToken]` here (Field 2026-10-29); printed QR URL = `<web origin>/scan/<qr_token>`.
- **Likely DRs:** none. If the shared-logic move needs a POS behaviour change → stop, raise a DR.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates (incl. run proof) and evidence; dependencies have completion conditions
- [x] Size within workflow §2 (≤ 3 working days)
- [x] No unresolved decision blocking the main outcome
- [x] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-29 | Initial Draft (Cowork) — customer side C3 (order path UI) |
| 1 | 2026-10-29 | Ready — Field in session: "approve BRIEF-049 Rev 1 Ready" (incl. the two *(proposed)* rows) |
