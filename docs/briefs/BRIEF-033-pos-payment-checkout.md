# BRIEF-033 — Web POS: checkout (PromptPay QR · cash · manual confirm)

| | |
|---|---|
| **Status** | Ready |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | frontend |
| **Revision** | 1 |
| **Depends on** | **BRIEF-030 merged ✅ (#71)** (drawer, close confirm, `useSession`) · **BRIEF-031 merged ✅ (#72)** (`lib/utils/money.ts` for the change helper) · BRIEF-013 ✅ (payments API, lock, expiry, `payment.status_changed`) · BRIEF-024 ✅ (venue PromptPay ID — a test ID is enough for the demo) |
| **References** | CD-03 handoff (checkout·1, ·3–5 · promptpay·1–5, ·7 · cash · manual-confirm · in-flight · done · §9) · FRD §7 · DR-014 #6 (venue PromptPay mode; gate = manual confirm) · DR-002 #12 (QR rendering — Q1) · `docs/api/README.md` (Payments, Idempotency) |
| **Audit depth** | Full (payment) |
| **Size** | ~1–1.5 days · est. ~550–650 net-new lines |

---

## 1. Goal
The cashier collects the whole bill by PromptPay QR or cash; the amount is locked while waiting, a stuck QR can be cancelled or confirmed by hand (flagged), and settling never closes the table by itself. Completes order → pay → close on screen for 10 Nov.

## 2. Scope
### In
- **Entry:** drawer footer gets **"ชำระเงิน"** (primary lg; disabled when `bill.remaining = 0`). Close confirm's outstanding state gets **"ไปชำระเงิน"** (030 left it disabled). Both open the checkout modal (`?visit=<id>&pay=1`).
- **Checkout (CD-03 checkout·1, ·3, ·4):** modal 600 — summary (โต๊ะ, รายการ, ยอดรวม · ชำระแล้ว · **คงเหลือ** from `bill`) · method radio cards: **PromptPay QR** (chip "ยืนยันด้วยตนเอง" — venue mode, DR-014 #6) · **เงินสด** · primary "สร้าง QR" / "รับเงินสด" · ยกเลิก. One `Idempotency-Key` per checkout open, reused on retry (CD-03 §9).
- **Create:** `POST /visits/:visitId/payments { method, mode: 'merge' }` → `PaymentAttempt` (one part).
  - PromptPay → **pending view (promptpay·1):** QR rendered from `qrPayload` (Q1) at 240 px on white with accent border · amount · countdown to `expiresAt` (mm:ss; announced each minute) · chip รอชำระ · actions **ยกเลิก QR** (secondary) and **ยืนยันด้วยตนเอง** (link).
  - Cash → completed at once → done view. Optional "รับเงินมา" helper shows change; confirm disabled only when it is filled and short (CD-03 cash rule). Only the bill amount is stored.
  - Errors: `409 PAYMENT_IN_FLIGHT` → show the existing pending attempt (the error `data.details` is that `PaymentAttempt`) · `409 PROMPTPAY_NOT_SET` → Alert "ยังไม่ได้ตั้งพร้อมเพย์ — ใช้เงินสด หรือตั้งค่าก่อน" · `409 NOTHING_TO_PAY` → close modal, refetch · network → checkout·5 Alert "สร้าง QR ไม่สำเร็จ ลองอีกครั้ง / ยังไม่ได้ล็อกยอด — กดสร้าง QR อีกครั้งได้ ระบบไม่สร้างซ้ำ".
- **Pending → result:** `payment.status_changed` for this payment (room `staff`) → update; socket down → poll `GET /payments/:id` every 5 s (promptpay·5 Alert warning). Results:
  - `completed` → "ชำระแล้ว ฿{amount}" (promptpay·2), auto-advance to done after 3 s or "ไปที่สรุป".
  - `cancelled` + `statusReason = expired` → "QR หมดเวลา" (promptpay·4) + "สร้าง QR ใหม่" (new key) · `cancelled` + `staff_cancel` → back to checkout.
- **Cancel QR:** `POST /payments/:id/cancel` → checkout, bill unlocked; `409` (already completed) → done.
- **Manual confirm (CD-03 manual-confirm, J2):** modal — Alert warning · Select reason (`direct_transfer` "ลูกค้าโอนเข้าบัญชีร้านโดยตรง" · `webhook_missing` "ระบบไม่ได้รับการยืนยัน" · `other` "อื่นๆ") · note (required for อื่นๆ, ≤ 500) · "ยืนยันว่าชำระแล้ว" → `POST /payments/:id/mark-paid { via: 'manual', reason, note }` → completed with Badge "ยืนยันด้วยตนเอง" + Toast "ยืนยันด้วยตนเอง · บันทึกให้เจ้าของตรวจสอบแล้ว". `409` → refetch, show the real state.
- **Done (CD-03 done·1):** back in the drawer: Alert success "ชำระครบแล้ว" when `remaining = 0`; table **stays open**; ปิดโต๊ะ goes through 030's confirm.
- **In-flight in the drawer (in-flight·1–2):** while `bill.locked`, the drawer shows "มีการชำระเงินค้างอยู่" with a "ดู QR" button reopening the pending view; orders added after the QR appear under a divider "ออเดอร์ใหม่หลังสร้าง QR — ไม่รวมในยอดนี้" (orders with `createdAt` after the pending payment's `createdAt`).
- **BRIEF-030 audit S1:** in `useSession.ts`, ปิดโต๊ะ's "paying" state comes from `bill.locked` only (drop the sticky `blocked` flag set on `409 PAYMENT_IN_FLIGHT`), so after a payment completes the button re-enables on the refetch.
- MSW: create (pending / cash / 409s), get, cancel, mark-paid, status event fixture.

### Out (do NOT build here)
- Split equal (BRIEF-023) — radio hidden · slip scan (BRIEF-025) · gateway webhook mode (BRIEF-026) · receipt print · refunds · charge items.
- Venue payment settings screen (PromptPay ID is set via the BRIEF-024 API).
- The real-bank scan check (Field, week of 26 Oct).

## 3. Contract
- **Endpoints used (all exist):** `POST /visits/:visitId/payments` (`CreatePaymentSchema` → `PaymentAttempt`) · `GET /payments/:id` → `Payment` · `POST /payments/:id/cancel` → `Payment` · `POST /payments/:id/mark-paid` (`MarkPaidSchema`) → `Payment` · `GET /visits/:id` → `VisitDetail`.
- **WS events:** `payment.status_changed` (room `staff`, `PaymentStatusChangedPayloadSchema`).
- **Contracts changes:** none.
- **Permissions:** `payments:create`, `payments:read`, `payments:mark_paid` (server-side).
- **Business rules:**
  - Creating a payment locks the remaining amount; the whole bill stays locked while any part is pending → FRD §7 · CD-03 F2.
  - In venue PromptPay mode only manual confirm completes a QR (no bank callback) → DR-014 #6 · CD-03 §9.
  - Manual confirm needs a reason; "อื่นๆ" needs a note; it is flagged for the owner → CD-03 Q3 · `MarkPaidSchema`.
  - Expiry 15 min = `cancelled` + `statusReason expired` → CD-03 Q1 · BRIEF-013.
  - Settlement never closes the table → CD-03 §9.
  - One key per checkout attempt; retry reuses it; a new QR after failure / expiry uses a new key → CD-03 §9 · DR-017.

### 3b. Under the hood
- **Where:** `app/pos/tables/_components/checkout/{CheckoutModal,MethodCards,PromptPayPending,CashPanel,ManualConfirmModal,PaymentResult}.tsx` · `_hooks/usePaymentStatus.ts` (socket + 5 s poll fallback) · `lib/api/payments.ts`.
- **How:** open → key = `randomUUID()` → create → render by `method`/`status` → event or poll updates `['payments', id]` → on completed invalidate `['visits', visitId]` + `['tables']`.
- **Failure:** each 409 code branches as §2; anything else = Alert + retry with the same key.
- **Why:** the server owns status; the modal only renders it, so a webhook / slip mode later (025 / 026) reuses the same pending view.

## 4. Acceptance Criteria
- **AC-1** — Given remaining ฿1,240.00, "สร้าง QR" sends exactly one POST with an `Idempotency-Key`; the pending view shows a scannable QR encoding `qrPayload`, ฿1,240.00 and a countdown to `expiresAt`; a double tap sends one request.
- **AC-2** — A network failure then retry reuses the same key; `409 PAYMENT_IN_FLIGHT` shows the existing pending QR instead of an error; `409 PROMPTPAY_NOT_SET` shows its Alert with cash still selectable.
- **AC-3** — A `payment.status_changed completed` event shows "ชำระแล้ว", then the drawer with "ชำระครบแล้ว" and the table still open; with the socket down the same result arrives through the 5 s poll.
- **AC-4** — Expired (`cancelled` + `expired`) shows "QR หมดเวลา"; "สร้าง QR ใหม่" sends a POST with a **new** key.
- **AC-5** — "ยกเลิก QR" → `POST /payments/:id/cancel` → checkout with the bill unlocked; a 409 on cancel shows the real (completed) state.
- **AC-6** — Manual confirm is disabled until a reason is chosen; "อื่นๆ" also needs a note; confirm sends `{ via: 'manual', reason, note? }` and shows the "ยืนยันด้วยตนเอง" Badge and Toast.
- **AC-7** — Cash: "รับเงินสด" completes in one POST; with "รับเงินมา" ฿1,000 on ฿1,240.00 the confirm is disabled; empty helper → allowed.
- **AC-8** — While locked, the drawer's ปิดโต๊ะ is disabled (030) and an order added after the QR shows under the divider, outside the locked amount.
- **AC-9** — Gates pass; run proof done.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1, AC-2, AC-4, AC-7 | component | `src/app/pos/tables/_components/checkout/CheckoutModal.test.tsx` (MSW) |
| AC-3, AC-5 | unit + component | `_hooks/usePaymentStatus.test.ts` (fake socket + fake timers) · `PromptPayPending.test.tsx` |
| AC-6 | component | `ManualConfirmModal.test.tsx` |
| AC-8 | component | `SessionDrawer.test.tsx` (extend) |
| AC-1, AC-3, AC-6 | e2e | `e2e/payment.spec.ts` (MSW: create → manual confirm → done) |

Gate commands (all must pass):
```bash
pnpm --filter @bar/frontend lint
pnpm --filter @bar/frontend typecheck
pnpm --filter @bar/frontend test
pnpm --filter @bar/frontend test:e2e
pnpm --filter @bar/frontend build
```
Run proof: BRIEF-028 run proof + a test PromptPay ID set via `PATCH /venue/payment-settings`. UI change: T1 with an order → ชำระเงิน → สร้าง QR (QR + countdown visible) → ยืนยันด้วยตนเอง (reason ลูกค้าโอนเข้าบัญชีร้านโดยตรง) → "ชำระครบแล้ว" → ปิดโต๊ะ → card free. Second run with เงินสด. Screenshots in the handoff. Scanning with a real bank app is **not** part of this proof (Field, week of 26 Oct).

### Local Sonar scan
- **Required for this brief: yes** (Field, 2026-10-22 — scan every UI brief from 031 on). Follow `docs/quality/README.md`: `docker compose -f infra/docker-compose.yml --profile sonar up -d` → `pnpm sonar` → fix every issue in files this brief adds or changes → re-scan until the Quality Gate passes, or each remaining issue has a written reason → `pnpm sonar:report` output in the handoff's Sonar section.
- Approved exclusions / "won't fix": none — any exclusion, "won't fix", "false positive" or gate change needs Field's approval first.

## 6. Constraints
- Money from the server only; the change helper is the one client calculation, display only, satang integers (`sumMoney` from 031).
- Never mark a PromptPay payment completed client-side; only server status (event / poll) changes the view.
- Countdown from `expiresAt` vs the device clock; the server expiry is authoritative.
- `frontend.md` Hard Limits; tokens only (QR colours = existing `bg-qr-bg` / `text-qr-ink` tokens — `globals.css` "QR must scan"); Thai strings from CD-03 §6.

## 7. Decision Points (Field Guard)
- **Q1 — How the QR is drawn. ✅ Decided (Field, 2026-10-21): A.** DR-002 #12 says "backend returns a base64 PNG, no QR library on the frontend"; BRIEF-013 shipped `qrPayload` (the EMVCo string) only.
  - **A (chosen):** frontend renders `qrPayload` with **`qrcode.react@^4.2.0`** (SVG) + a DR-018 amending DR-002 #12. *Why:* no backend change, the contract already carries the payload, SVG stays sharp on any screen; the customer QR page (CD-07) and the staff app can reuse it. *Trade-off:* one small frontend dependency (~15 kB).
  - **B:** backend adds `qrImage` (base64 PNG) to `Payment` — needs a backend brief + a backend QR dependency + a contract change before this brief can start. *Why not:* adds a dependency on the critical path for the weekend.
- **Backend impact:** none — BRIEF-013 already returns `qrPayload` (`promptpay-payload.ts`, EMVCo + CRC16); no base64 PNG was ever built.
- **Printing later (Field, 2026-10-21):** a printed bill with QR (ใบแจ้งยอด) uses the same payload — thermal printers draw QR from the string (ESC/POS `GS ( k`). Flow (print = create payment → lock; expiry for printed bills; re-print after new orders) → own CD + brief after 8 Nov.
- **Pre-decided:** `qrcode.react@^4.2.0` · URL param `pay=1` · paths above.
- **DR-018 (Field-approved text, 2026-10-21 — created in this seed as `docs/decisions/DR-018-frontend-qr-from-payload.md`):**
  > **DR-018 — Frontend renders the PromptPay QR from `qrPayload`** · Category: Dependency / brief deviation
  > Context: DR-002 #12 planned a backend PNG; BRIEF-013 shipped `qrPayload` (EMVCo string) only.
  > Decision: frontend renders `qrPayload` as SVG with `qrcode.react@^4.2.0` (`app/frontend` only). DR-002 #12 superseded. Colours from `qr-bg` / `qr-ink` tokens. Backend unchanged.
  > **Decision:** Approved — Field, 2026-10-21 (session)
- **Protected-file edits at seed (Field-approved text, 2026-10-21):** `docs/decisions/DR-002-frontend-stack.md` #12 → marked "superseded by DR-018" · `docs/rules/frontend.md` L147 → `- PromptPay QR: render Payment.qrPayload (EMVCo string) as SVG with qrcode.react, colours from qr-bg / qr-ink tokens (DR-018, supersedes DR-002 #12)`

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates (incl. run proof) and evidence; dependencies have completion conditions
- [x] Size within workflow §2
- [x] No unresolved decision blocking the main outcome (Q1 decided)
- [x] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-21 | Initial Draft (Cowork) — 10 Nov UI slice #5 |
| 1 | 2026-10-22 | + BRIEF-030 audit S1 fix in scope; local Sonar scan required (Field) |
| 1 | 2026-10-21 | Field in session: Q1 A (`qrcode.react`, DR-018 text, `frontend.md` L147 text approved) — recorded by Cowork on Field's explicit instruction |
| 1 | 2026-10-22 | Field approved Rev 1 → Ready ("approve BRIEF-033 Rev 1 Ready") — recorded by Cowork on Field's explicit instruction |
