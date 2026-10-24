# BRIEF-025 — PromptPay slip verification (EasySlip) — API + POS live scan with photo backup

| | |
|---|---|
| **Status** | Draft |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | backend · contracts · frontend |
| **Revision** | 1 |
| **Depends on** | BRIEF-013 ✅ (payments core, lock, expiry job, `payment.status_changed`) · BRIEF-024 ✅ (venue PromptPay ID) · BRIEF-033 ✅ (POS checkout modal, `PromptPayPending`, `ManualConfirm`) |
| **References** | **DR-026 (Pending — web QR scanner package)** · **DR-027 (Pending — slip check on the staff app; not built here)** · DR-014 #6 (own-PromptPay mode, slip verify, manual fallback) · CD-03 boards `promptpay-slip` (1–4), `promptpay-slip-errors` (5–8), Q1 (POS tablet camera), Q2 (receiver) · FRD §7 · `docs/schema.sql` §7 `payment` (`slip_trans_ref` UNIQUE, `slip_amount`, `confirmed_via = slip_verify`) · EasySlip API v2 `POST /verify/bank` (payload / base64) |
| **Audit depth** | Full (payment confirmation path; external service; new dependency) |
| **Size** | ~2.5 days · est. **~1.2k** net-new lines incl. tests (backend ~500, frontend ~700) — **above the ~500 target by Field's choice (one brief, see Selected 3)**. Suggested commits: 1) backend + contracts · 2) POS scan UI |

---

## Selected (by KJ) — interview 2026-10-24

| # | Question | Selected |
|---|---|---|
| 1 | How the POS reads the slip | **Live QR scan in the POS page, photo as backup** — no switching to the camera app while holding the iPad |
| 2 | Who checks "money went to our account" | **EasySlip `matchAccount`** (bar's account registered in the EasySlip portal) |
| 3 | Split API / UI | **One brief** |
| 4 | EasySlip account + key | **Not yet — Field signs up (Start ฿99 / 250 checks)**; run proof waits for the key, tests use a fake adapter |
| 5 | Staff app | **Wanted on both POS and staff app** → **DR-027 now, mobile brief later** (Metee, after BRIEF-010) |
| 6 | Web scanner package | **`barcode-detector`** (standard `BarcodeDetector` API polyfill) → DR-026 |
| 7 | Photo backup source | **Frame from the live view ("ถ่ายรูปแทน") + pick an image ("เลือกรูป")** — never the native camera app |
| 8 | Permission | **`payments:create`** (cashier, CD-03 §4) |
| 9 | Evidence | **Existing columns + `audit_log`** — verified: `slip_trans_ref`, `slip_amount`, `confirmed_via`; rejected tries logged; no guest name stored (PDPA) |
| 10 | Slip amount above the bill | **Accept, show "โอนเกิน ฿n"**; short amount rejected (CD-03 slip·7) |
| 11 | QR expired / cancelled | **Verify against a pending payment only** — staff start a new payment for the same bill and scan the same slip |

## 1. Goal
At checkout in own-PromptPay mode, the cashier points the POS tablet at the guest's slip; the bank confirms it through EasySlip, and the payment completes as **verified** (`slip_verify`) — a fake, reused, short or wrong-account slip is refused with a clear reason, and manual confirm stays one tap away.

## 2. Scope
### In
**Backend (`modules/payment`)**
- **Port** `SlipVerifier` (`domain/ports/slip-verifier.port.ts`) → `verify({ payload } | { image }, { expectedAmount })` → `{ kind: 'verified', transRef, amount, receiverMatch: 'matched' | 'not_matched' | 'unknown' } | { kind: 'invalid' } | { kind: 'pending' } | { kind: 'unavailable' }`. **Adapter** `infrastructure/easyslip/easyslip-slip-verifier.ts` using Node `fetch` (no package): `POST {EASYSLIP_BASE_URL}/verify/bank` with `{ payload }` or `{ base64 }`, `matchAccount: true`, `matchAmount: <bill>`, `checkDuplicate: false` (our DB is the duplicate referee), bearer `EASYSLIP_API_KEY`, 10 s timeout. Response parsed with Zod; unknown shapes → `unavailable`. A fake adapter for tests.
- **Config** `providers/config/easyslip/` (pattern of `line/`): `EASYSLIP_API_KEY` (required only when a verify is attempted — missing key → `unavailable`, app still boots), `EASYSLIP_BASE_URL` (default `https://api.easyslip.com/v2`). Both added to `app/backend/.env.example` with comments.
- **Endpoint** `POST /payments/:id/verify-slip` (`payments:create`) body = exactly one of `{ payload: string 1–128 }` | `{ image: base64 JPEG/PNG, ≤ 1 MB decoded }` → `Payment`.
- **Rules** (in order): payment exists → own-PromptPay `promptpay` method and **pending** (else 409 `INVALID_STATE_TRANSITION`); provider result → `invalid` 422 `SLIP_INVALID` · `pending` 409 `SLIP_PENDING` ("สลิปกรุงเทพฯ ยังไม่พร้อม — รอ 5 นาทีแล้วสแกนใหม่") · `unavailable` 503 `SLIP_SERVICE_UNAVAILABLE`; receiver `not_matched` → 422 `SLIP_WRONG_RECEIVER` · `unknown` → 422 `SLIP_RECEIVER_UNCLEAR`; `slip amount < payment.amount` → 422 `SLIP_AMOUNT_SHORT`; reused `transRef` → 409 `SLIP_ALREADY_USED` (UNIQUE `slip_trans_ref`, `23505` mapped like DR-025). Success → `completed`, `confirmed_via = 'slip_verify'`, `slip_trans_ref`, `slip_amount`, `paid_at = now()`; expiry job removed; `payment.status_changed` emitted (same as `markPaid`).
- **Rejected tries** → one `audit_log` row each (entity `payment`, the payment id; fields: reason, `transRef` / amount when known — **no sender or receiver name**), written in its **own** transaction so the rejection's rollback doesn't remove it — see Q1 for the action value.
- JSON body limit raised to **1 MB** (`configure-app`, proposed) — the client resizes photos to ~150 KB; the API rejects a larger image with 400.
- Contracts: `VerifySlipSchema`, `PaymentSchema.slipAmount: MoneySchema.nullable()` (additive), error codes above; OpenAPI; `docs/api/README.md` Payments table.

**Frontend (POS checkout — `pos/tables/_components/checkout/`)**
- `PromptPayPending`: primary **"สแกนสลิป"** (CD-03 slip·1) → in-modal **SlipScanner** panel (slip·2): live camera (`getUserMedia`, rear camera) + `BarcodeDetector({ formats: ['qr_code'] })` from `barcode-detector` (DR-026) polling the video frame; first decoded QR → `verify-slip { payload }`; camera stops on result / close / unmount.
- Backup in the same panel (Selected 7): **"ถ่ายรูปแทน"** = current video frame → canvas → JPEG (long side ≤ 1280 px, q 0.8) → `verify-slip { image }`; **"เลือกรูป"** = file input (no `capture`) → same resize → `{ image }`. Camera denied / no camera → panel opens with only the two photo buttons + note.
- States per CD-03: verifying (slip·3) → verified (slip·4: "ยืนยันสลิปแล้ว", bank ref, amount; **"โอนเกิน ฿n"** when `slipAmount > amount`) → existing done step · errors slip·5 used / ·6 wrong account / ·7 short / ·8 service down + `SLIP_INVALID` ("อ่านสลิปไม่ได้ — สแกนใหม่หรือถ่ายรูป") + `SLIP_PENDING` + `SLIP_RECEIVER_UNCLEAR` — every error offers **"สแกนใหม่"** and **"ยืนยันด้วยตนเอง"** (existing `ManualConfirm`, flagged).
- The `.wasm` decoder is **served from our own origin** (DR-026 lock), never a CDN.
- `lib/api/payments.ts` `verifySlip()`; MSW handlers for every result.

### Out (do NOT build here)
- **Staff-app slip check** → mobile brief after BRIEF-010 (DR-027) · gateway mode / webhook (BRIEF-026) · TrueMoney slips · storing the slip image or raw EasySlip JSON (Selected 9) · registering the bar's account in EasySlip (Field, in their portal) · verifying expired / cancelled payments (Selected 11) · any change to split / cash / manual-confirm paths.

## 3. Contract
| Method | Path | Request → Response | Permission |
|---|---|---|---|
| POST | `/payments/:id/verify-slip` | `{ payload }` \| `{ image }` → `Payment` (+ `slipAmount`) | `payments:create` |
- **WS events:** `payment.status_changed` (existing payload) on success.
- **Contracts changes:** `VerifySlipSchema` · `PaymentSchema.slipAmount` (nullable money) · error codes `SLIP_INVALID`, `SLIP_PENDING`, `SLIP_SERVICE_UNAVAILABLE`, `SLIP_WRONG_RECEIVER`, `SLIP_RECEIVER_UNCLEAR`, `SLIP_AMOUNT_SHORT`, `SLIP_ALREADY_USED`.
- **Business rules:**
  - Verified slip completes the payment as `slip_verify`; manual confirm stays the fallback → DR-014 #6, CD-03 slip·8.
  - A slip pays once: `slip_trans_ref` UNIQUE → DR-014 #6 + `schema.sql`.
  - Receiver = the bar's account, decided by EasySlip `matchAccount` → Selected 2 (supersedes CD-03 Q2's name + digits rule; amend CD-03 handoff after merge).
  - Amount ≥ bill; above → accepted and shown → CD-03 slip·7 + Selected 10.
  - Pending payments only → Selected 11.
  - No guest name stored → Selected 9 (PDPA).
- **OpenAPI:** endpoint in `docs/api/openapi.json` (`openapi:export`), committed in this PR.

## 3b. Under the hood (proposed — skill section)
- **When:** cashier taps "สแกนสลิป" on a pending own-PromptPay payment.
- **Where:** `modules/payment` (service, port, EasySlip adapter, controller) · POS `checkout/SlipScanner*` + `useSlipScanner` hook.
- **How (scan, the new pattern):** open `getUserMedia({ video: { facingMode: 'environment' } })` → `<video>` plays → every ~250 ms `detector.detect(video)` → first QR text → stop tracks → POST. Backup: `canvas.drawImage(video)` → `toBlob('image/jpeg', 0.8)` → base64 → POST.
- **How (server):**
  1. Read the payment (no lock) → must be pending `promptpay` → else 409.
  2. **Outside any transaction:** `SlipVerifier.verify(...)` (≤ 10 s) — a slow network call never holds row locks.
  3. Map `invalid` / `pending` / `unavailable` → error (+ audit row, own tx).
  4. **Transaction start:** lock the payment `FOR UPDATE` (`requirePending` — it may have expired during step 2 → 409) → receiver match → amount ≥ bill → `save()` completed with `slip_trans_ref` / `slip_amount` → `23505` on `slip_trans_ref` → `SLIP_ALREADY_USED` → **commit**.
  5. After commit: remove expiry job, emit `payment.status_changed`.
- **Data:** `payment.confirmed_via`, `slip_trans_ref`, `slip_amount`, `paid_at`, `status` · `audit_log` for rejects · no new column.
- **Failure:** EasySlip down / timeout / quota → nothing written, payment still pending → staff retry or manual confirm. Payment expired mid-check → 409, slip still unused → new payment, rescan (one more check). Two tablets scan the same slip → the UNIQUE index lets one win; the other gets `SLIP_ALREADY_USED`.
- **Why:** the bank (via EasySlip) is the only source that knows a slip is real; our DB is the only race-free referee for "used once".

## 4. Acceptance Criteria
- **AC-1** — Given a pending PromptPay payment of ฿1,305 and a fake verifier answering verified ฿1,305 / matched, when `POST verify-slip { payload }`, then 200, payment `completed`, `confirmedVia: 'slip_verify'`, `slipAmount: '1305.00'`, expiry job gone, one `payment.status_changed`.
- **AC-2** — Same with `{ image }` (base64 JPEG) → same result; image > 1 MB or not JPEG/PNG → 400; both or neither field → 400.
- **AC-3** — Verifier answers ฿1,400 → completed, `slipAmount: '1400.00'`; ฿1,200 → 422 `SLIP_AMOUNT_SHORT`, payment still pending.
- **AC-4** — A `transRef` already on another completed payment → 409 `SLIP_ALREADY_USED`; two concurrent verifies with the same slip on two pending payments → exactly one completes.
- **AC-5** — Receiver `not_matched` → 422 `SLIP_WRONG_RECEIVER`; `unknown` → 422 `SLIP_RECEIVER_UNCLEAR`; `invalid` → 422 `SLIP_INVALID`; `pending` → 409 `SLIP_PENDING`; `unavailable` / timeout / missing key → 503 `SLIP_SERVICE_UNAVAILABLE` — each leaves the payment pending and writes one `audit_log` row without names.
- **AC-6** — Payment completed / cancelled / expired, or method cash → 409 `INVALID_STATE_TRANSITION`; no verifier call.
- **AC-7** — EasySlip adapter: maps a recorded v2 success JSON (fixture) to `verified`, `matchedAccount` absent / null → `unknown`, 404 `SLIP_NOT_FOUND` → `invalid`, `SLIP_PENDING` → `pending`, 401 / 403 / 429 / 5xx / timeout → `unavailable`; sends `matchAmount`, `matchAccount: true`, `checkDuplicate: false`, bearer key.
- **AC-8** — POS: "สแกนสลิป" opens the live scanner; a decoded QR sends `{ payload }` once and stops the camera; "ถ่ายรูปแทน" and "เลือกรูป" send a resized `{ image }`; camera denied → photo buttons only.
- **AC-9** — POS states: verified (with "โอนเกิน ฿n" when over) → done; each error code shows its CD-03 copy with "สแกนใหม่" + "ยืนยันด้วยตนเอง".
- **AC-10** — The decoder `.wasm` loads from our origin (network request host = the web app), not a CDN.
- **AC-11** — Gates + run proof; OpenAPI + `openapi:check`; README; `.env.example`.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1 – AC-6 | e2e (real Postgres + Redis, fake verifier) | `app/backend/test/payment-slip.e2e-spec.ts` |
| AC-5, AC-6 | unit | `payment.service.spec.ts` (verify path) |
| AC-7 | unit (mocked `fetch`, fixtures) | `infrastructure/easyslip/easyslip-slip-verifier.spec.ts` |
| AC-2 | unit | contracts `payments.test.ts` (`VerifySlipSchema`) |
| AC-8, AC-9 | component (stubbed `BarcodeDetector` + `getUserMedia`, MSW) | `checkout/SlipScanner.test.tsx` |
| AC-9 | e2e (MSW, photo path via "เลือกรูป" fixture) | `app/frontend/e2e/payment-slip.spec.ts` |
| AC-10 | run proof (network panel) | handoff |

Gate commands (all must pass):
```bash
pnpm --filter @bar/contracts build
pnpm --filter @bar/contracts lint && pnpm --filter @bar/contracts typecheck && pnpm --filter @bar/contracts test
pnpm --filter @bar/backend lint && pnpm --filter @bar/backend typecheck && pnpm --filter @bar/backend test && pnpm --filter @bar/backend test:e2e
pnpm --filter @bar/backend openapi:check
pnpm --filter @bar/frontend lint && pnpm --filter @bar/frontend typecheck && pnpm --filter @bar/frontend test && pnpm --filter @bar/frontend test:e2e && pnpm --filter @bar/frontend build
```
Run proof (fresh on the work SHA; stop the dev backend before `test:e2e`):
```bash
docker compose -f infra/docker-compose.yml up -d postgres redis
pnpm --filter @bar/backend migration:run
pnpm --filter @bar/backend start:dev   # separate shell, EASYSLIP_API_KEY set
curl -fsS localhost:3001/api/health
```
UI (real API + real EasySlip key, Field signed in, iPad or tablet over the tunnel): T1 → ชำระเงิน → PromptPay → Field transfers the exact amount from his bank app → **สแกนสลิป** on the phone screen → verified → done; scan the **same slip** on a new payment → "สลิปนี้ใช้แล้ว"; "ถ่ายรูปแทน" path once; one slip to another account (if available) → wrong receiver or unclear (records what `matchAccount` really returns for a PromptPay-phone receiver — DR-027 / Q2). **This also covers BRIEF-013 AC-12's manual half (real bank scan of our QR).** Network panel: wasm from our origin.
**BLOCKED until** Field's EasySlip key exists and the bar's account is registered in the EasySlip portal — gates and component / e2e tests do not need it.

### Local Sonar scan
- **Required for this brief: yes.**

## 6. Constraints
- No new backend package (Node `fetch`); one new frontend package (DR-026) — nothing else.
- The EasySlip call is never inside a DB transaction; the key is never logged or returned; no guest names in logs or `audit_log`.
- `save()` on `payment`; `PermissionsGuard` only; `.js` import extensions; Thai copy hardcoded.
- Camera stream always stopped (tracks `stop()`) on result, close and unmount.

## 7. Decision Points (Field Guard)
- **Pre-decided (exact, once DR-026 is Approved):** `barcode-detector@^3.2.3` in `app/frontend/package.json` (lockfile updated) · endpoint `POST /payments/:id/verify-slip` · error codes listed in §3 · `PaymentSchema.slipAmount` · env `EASYSLIP_API_KEY`, `EASYSLIP_BASE_URL` (default `https://api.easyslip.com/v2`) · EasySlip v2 `POST /verify/bank` with `matchAccount: true`, `matchAmount`, `checkDuplicate: false` · JSON body limit 1 MB (proposed) · no slip image / raw JSON / names stored.
- **Q1 — `audit_log.action` for a rejected slip?** `audit_action` is `('CREATE','UPDATE')`; a rejection changes nothing. *Cowork recommends:* **A — add enum value `REJECT`** (one migration `<timestamp>-AuditRejectAction.ts`, `docs/schema.sql` unlocked, schema change approved by this Pre-decided item once you pick it) — honest meaning, filterable for owner insight. *Alternatives:* **B — `UPDATE` with `changed_fields { slipCheck: { from: null, to: '<reason>' } }`** (no schema change; misleading "update" rows) · **C — no log** (owner insight can't count failed / reused slips — DR-014 core 2).
- **Q2 — `matchAccount` with a PromptPay-phone receiver.** EasySlip's docs don't say whether a registered bank account matches a slip paid to the bar's **PromptPay phone / ID**. *Cowork recommends:* build as Selected 2 with `unknown` → `SLIP_RECEIVER_UNCLEAR` (manual confirm); the run proof records the real answer; if it never matches, a follow-up adds our own name + visible-digits check (CD-03 Q2) as the `unknown` fallback.
- **Likely DRs:** a backend HTTP package (not expected — `fetch`) · storing slip images (out).

## 8. Unlocked Protected Files
- `docs/schema.sql` — only if Q1 = A
- `none` otherwise

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [ ] Exact gates (incl. run proof) and evidence; dependencies have completion conditions — run proof BLOCKED on Field's EasySlip key + account registration
- [ ] Size within workflow §2 — ~1.2k vs ~500; Field chose one brief (Selected 3) — confirm at Ready
- [ ] No unresolved decision blocking the main outcome — DR-026 Pending, Q1 open
- [ ] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-24 | Initial Draft (Cowork) — interview Selected 1–11; DR-026 (scanner) + DR-027 (staff app) raised |
