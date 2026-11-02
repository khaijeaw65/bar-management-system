# BRIEF-071 — Web POS & Customer Touch Polish & Defect Fixes

| | |
|---|---|
| **Owner** | Field |
| **Implementer** | kj / Antigravity |
| **Assigned auditor** | Antigravity (different session) — Field instruction 2026-11-02 |
| **Affected apps** | frontend |
| **Feature** | `standalone — single-slice brief` |
| **References** | `docs/defects/DEF-01.md`, `DEF-03.md`, `DEF-04.md`, `DEF-05.md`, `DEF-06.md`, `DEF-09.md`, `DEF-10.md`, `DEF-11.md`, `DEF-12.md`, `DEF-14.md` |
| **Status** | Ready — Field approved 2026-11-02 |
| **Revision** | 2 |
| **Depends on** | none · **Unblocks** demo rehearsal |
| **Size** | ACs 8 (≤8) · flows 1 (≤1) · files 8 (≤10) · migrations 0 (≤1) · new patterns 0 (≤1) → OK |
| **Audit depth** | Compact (UI polish & interaction fixes) |

---

## 1. Goal
Fix critical UI defects and touchscreen ergonomic issues discovered during hands-on testing across customer ordering and POS interfaces, ensuring a seamless, flicker-free presentation for demo day.

## 2. Scope
### In
- **DEF-01:** Toast "ดูออเดอร์" on orders board opens the specific ticket detail drawer/sidebar directly.
- **DEF-03:** Staff call toast features an inline "รับทราบ" button to acknowledge without opening notifications drawer.
- **DEF-04:** Customer screen listens for staff call acknowledgment event and updates banner with confirmation feedback.
- **DEF-05:** Customer staff call modal "อื่นๆ" textarea formatted with fixed 4 rows and `resize-none`.
- **DEF-06:** POS toast close button is always visible (`opacity-100`, touch target ≥ 44px) instead of hover-only for tablet use.
- **DEF-09:** Cart screen eliminates the brief empty-cart ("ตะกร้ายังว่าง") flicker while redirecting to `/customer/tab`.
- **DEF-10 & DEF-11:** Settings page "QR ที่เคาน์เตอร์" switch responsiveness and payment radio button alignment (horizontal label).
- **DEF-12:** Toast action button ("ดูออเดอร์") adds margin clearance (`mr-8`) so close button does not overlap it.
- **DEF-14:** Void/Comp modal wraps item details and action chips with standard vertical gap (`gap-4`).

### Out
- Backend void/comp & cancellation logic (`BRIEF-018` / `BRIEF-070`).
- Customer cancellation endpoint (`DEF-02` — requires backend order state machine update).

---

## 3. Standalone Design & Contract

- **Decisions (`Decision | Why | Instead of`):**
  - Toast direct drawer navigation | Cashiers on tablet need 1 tap to inspect an incoming order | Navigating to `/pos/orders` without focusing the ticket.
  - Cart redirect transition state | Prevent layout jumping and jarring empty-state flashes before Next.js completes route transition | Resetting cart lines before navigation completes.
  - Radio alignment | Align label beside the radio indicator with `flex items-center gap-2` | Default vertical stack.

- **Code Map (`File | Owns`):**
  - `app/frontend/src/app/pos/orders/_components/OrdersBoard.tsx` — Handles order selection when triggered by toast.
  - `app/frontend/src/app/customer/cart/_components/CartScreen.tsx` & `useSendOrder.ts` — Defer cart reset / show submitting state during redirect.
  - `app/frontend/src/app/customer/_components/CustomerShell.tsx` — Listens for call acknowledgment socket event and displays confirmation banner.
  - `app/frontend/src/app/customer/_components/CallStaffSheet.tsx` — `rows={4}` & `resize-none` for "อื่นๆ" note textarea.
  - `app/frontend/src/app/pos/settings/_components/PaymentSection.tsx` — Horizontal radio button layout.
  - `app/frontend/src/app/pos/settings/_components/SettingSwitch.tsx` — Switch click & toggle event binding.
  - `app/frontend/src/app/providers.tsx` or Toast component — Always-visible close button styling.

---

## 4. Acceptance Criteria

| AC | When | Then |
|---|---|---|
| 1 | Staff clicks "ดูออเดอร์" on an order arrival toast | The order drawer for that specific order opens immediately on the orders board. |
| 2 | Staff clicks "รับทราบ" directly on a staff call toast | The call is acknowledged, the toast dismisses, and the notification updates. |
| 3 | Staff acknowledges a call on POS | The customer's mobile banner transitions to "พนักงานรับทราบแล้ว กำลังมาที่โต๊ะของคุณ". |
| 4 | Customer submits cart order | Cart displays submitting state and smoothly transitions to `/customer/tab` without flashing "ตะกร้ายังว่าง". |
| 5 | Staff toggles "QR ที่เคาน์เตอร์" on POS Settings | The switch toggles state reliably and enables the "บันทึก" button. |
| 6 | Staff views payment section in POS Settings | Radio button labels sit horizontally to the right of the radio circle. |
| 7 | An alert toast renders an action button | The action button maintains clear right-margin (`mr-8`) and does not overlap with the close button. |
| 8 | Staff opens the Void/Comp dialog | The selected item card has a clean `gap-4` spacing separating it from the adjustment radio options. |

---

## 5. Tests & Verification

| ACs | Kind | File |
|---|---|---|
| 1–3 | unit (`*.test.tsx`) | `app/frontend/src/app/pos/orders/_components/OrdersBoard.test.tsx` |
| 4 | unit (`*.test.tsx`) | `app/frontend/src/app/customer/cart/_components/CartScreen.test.tsx` |
| 5–6 | unit (`*.test.tsx`) | `app/frontend/src/app/pos/settings/_components/VenueSettingsScreen.test.tsx` |

- Gate commands:
  ```bash
  pnpm --filter @bar/frontend lint
  pnpm --filter @bar/frontend typecheck
  pnpm --filter @bar/frontend test
  ```

---

## 6. Planner Dry Run
1. [x] Scope fits single frontend slice (7 files touched, zero backend migrations).
2. [x] No protected files touched.
3. [x] Directly addresses recorded defect logs `DEF-01`, `03`, `04`, `05`, `06`, `09`, `10`, `11`.
4. [x] Existing frontend test suite green.
