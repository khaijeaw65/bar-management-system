# Handoff — BRIEF-025 PromptPay slip verification (EasySlip + POS scan)

| | |
|---|---|
| **Implementer** | kj (Cursor) |
| **Date** | 2026-10-24 |
| **Brief revision** | 2 (wording committed in `eb5755b`; Field confirmation of that commit is audit Finding 10) |
| **Branch** | `feat/BRIEF-025-promptpay-slip-verify` (seed `82244be`, merged `origin/main` at `3725ee1`) |
| **Commit** | Work SHA `259b81f` (API `dc5da44`, POS `29c5c48`, receiver + static wasm `4ffa344`, scanner `259b81f`) |
| **Assigned auditor** | Cowork |
| **Status** | Implemented — no PR until audit PASS. EasySlip-key half of the run proof is still blocked |

## Summary
- **`POST /api/payments/:id/verify-slip`** (`payments:create`). Body is exactly one of `{ payload }` (1–128) or `{ image }` (base64 JPEG/PNG, decoded ≤ 1 MB). Pending own-PromptPay only. EasySlip v2 `POST /verify/bank` runs **outside** any DB transaction (`fetch`, no new backend package). Then one transaction locks the payment `FOR UPDATE`, checks receiver and amount, and `save()`s `completed` / `confirmed_via = slip_verify` / `slip_trans_ref` / `slip_amount` / `paid_at`. Expiry job removed; `payment.status_changed` uses the existing payload.
- **Rejections** leave the payment pending and append one `audit_log` row with action `REJECT` (`reason`, plus `transRef` and `amount` when known). No slip image, raw JSON, or names. `23505` on `payment_slip_trans_ref_key` → `SLIP_ALREADY_USED`. A payment that is not a pending PromptPay returns `409 INVALID_STATE_TRANSITION` and does not call EasySlip.
- **Rev 2 receiver:** EasySlip `matchedAccount` object → `matched`; **null → `not_matched` (`SLIP_WRONG_RECEIVER`)**; field absent → `unknown`. EasySlip 400 codes `VALIDATION_ERROR`, `INVALID_IMAGE_FORMAT`, `IMAGE_SIZE_TOO_LARGE`, `INVALID_IMAGE_TYPE` → `invalid` / `SLIP_INVALID`.
- **Migration** `1762800000000-AuditRejectAction.ts`: `ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'REJECT'`. Down is a no-op. `docs/schema.sql` enum line only. No new payment column. Already applied on dev `bar` (this round: `migration:run` reported no pending migrations).
- **POS:** PromptPay pending gets **สแกนสลิป**. Live rear camera + `barcode-detector` (`^3.2.3`). One decode at a time. First QR posts `{ payload }` once and stops the tracks. **ถ่ายรูปแทน** and **เลือกรูป** (no `capture`) post `{ image }`; a frame that cannot be resized shows the unreadable-slip copy. The scan warning appears when the reader module fails to load, or after five missed frames in a row, and clears when a frame decodes. Wasm is a static file: `predev` / `prebuild` copy `zxing_reader.wasm` into `public/zxing/` (gitignored). `locateFile` returns `/zxing/${file}` and never a CDN. There is no `/zxing` route. Camera tracks stop on result, close, and unmount.
- **Config:** `EASYSLIP_API_KEY` (empty is allowed — the app boots, verify returns 503) and `EASYSLIP_BASE_URL` (default `https://api.easyslip.com/v2`) in `app/backend/.env.example`. Key is not logged.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | e2e "completes a matched slip…" — completed, `slip_verify`, expiry job gone, `payment.status_changed` |
| AC-2 | ✅ | contracts `payments.test.ts` "accepts one slip field…" · e2e oversized decoded image → 400 `VALIDATION_ERROR` |
| AC-3 | ✅ | e2e overpayment completed; short amount → 422 `SLIP_AMOUNT_SHORT`, still pending |
| AC-4 | ✅ | e2e reused reference → 409 `SLIP_ALREADY_USED`; two concurrent verifies, exactly one completes |
| AC-5 | ✅ | e2e rejection rows + service spec — payment stays pending, one `REJECT` row, no names |
| AC-6 | ✅ | e2e cash / cancelled / completed / expired do not call EasySlip |
| AC-7 | ✅ | `easyslip-slip-verifier.spec.ts` — object → `matched`; **null → `not_matched`**; field absent → `unknown`; the four 400 codes → `invalid`; 401/403/429/5xx/timeout/weird body/missing key (no fetch) |
| AC-8 | ✅ | `SlipScanner.test.tsx` (5) — one `{ payload }`, tracks stopped, wasm URL `/zxing/zxing_reader.wasm` (no jsDelivr); one miss stays quiet and five misses keep the photo buttons; a failed resize shows `SLIP_INVALID`; denied camera has no `capture` |
| AC-9 | ✅ | same component test (each error code + **โอนเกิน**) · e2e `payment-slip.spec.ts` photo path → ยืนยันสลิปแล้ว, REF-E2E, โอนเกิน |
| AC-10 | ⏸ | `next start` on :3101 served `GET /zxing/zxing_reader.wasm` HTTP 200, 946860 bytes, WebAssembly module. Not an iPad network panel |
| AC-11 | ⏸ | Gates and the key-less half below are on `259b81f`. The EasySlip-key half (real bank scan, second scan, photo buttons on a signed-in iPad, Q2 phone match) was not run |

## Gate Evidence (G1)
Re-run on work SHA `259b81f` (2026-10-24). Postgres, Redis, and SonarQube were already up. Backend e2e used `bar_test`. Frontend e2e used the machine Playwright browser cache. Dev ports :3001 and :3101 were free before the run proof and free again after it.

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/contracts build` / `lint` / `typecheck` | 0 | pass |
| `pnpm --filter @bar/contracts test` | 0 | 80 passed (10 files) |
| `pnpm --filter @bar/backend lint` | 0 | oxlint + class-files |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 148 passed (39 files) |
| `pnpm --filter @bar/backend test:e2e` | 0 | 175 passed (26 files) |
| `pnpm --filter @bar/backend openapi:check` | 0 | export matches the committed `docs/api/openapi.json` |
| `pnpm --filter @bar/frontend lint` / `typecheck` | 0 | pass |
| `pnpm --filter @bar/frontend test` | 0 | 182 passed (37 files) |
| `pnpm --filter @bar/frontend test:e2e` | 0 | 22 passed, including `payment-slip.spec.ts` |
| `pnpm --filter @bar/frontend build` | 0 | pass; route table has no `/zxing` route |

## Run proof (key-less half, SHA `259b81f`)
`EASYSLIP_API_KEY` was forced empty for the process. No key was printed or written. `migration:run`: no migrations pending (`AuditRejectAction1762800000000` was already applied). `GET /api/health` → 200, `db: up`. `POST /api/payments/:id/verify-slip` was mapped.

Venue `promptpay_id` and `promptpay_id_type` were NULL (`payment_mode` `own_promptpay`), so a create would have returned `PROMPTPAY_NOT_SET`. The fixture id `0812345678` / `mobile` was set for the proof and both columns were set back to NULL afterwards (verified).

Active visit T1 `12dbfa1b-329e-4738-bcc7-719fb357e6ab`. Created pending PromptPay `099bdace-3c2e-4b75-ab14-efe78933efcb`, amount `1065.00` (201).

| Call | Result |
|---|---|
| verify `{ payload: "00020101021229370016A000000677010111" }` | 503 `SLIP_SERVICE_UNAVAILABLE` — ตรวจสลิปไม่ได้ชั่วคราว |
| verify `{ image }` of JPEG bytes `ff d8 ff d9` | 503 `SLIP_SERVICE_UNAVAILABLE` — same message |
| `GET` that payment | 200, `pending`, `confirmedVia` null, `slipTransRef` null, `slipAmount` null, `paidAt` null |
| `audit_log` for that payment | two `REJECT` rows, `changed_fields` exactly `{"reason":{"to":"SLIP_SERVICE_UNAVAILABLE","from":null}}` — no names, no transRef |

The payment was then cancelled (200, `cancelled`, `staff_cancel`). The staff session file was deleted. Both proof servers were stopped; :3001 and :3101 are free.

Not done, and not claimed: an iPad or tunnel camera scan, **ถ่ายรูปแทน** / **เลือกรูป** as UI gestures against this API, a browser network panel, a real EasySlip response, or a second scan of the same bank slip.

## Sonar (local scan)
- Last scan is still commit `29c5c48`. This fix round did not rescan. Quality Gate on that scan: **ERROR** — `new_coverage` 0.0 % (no coverage path, known) and `new_violations` 22.
- Issues by severity on that scan: BLOCKER 0 · HIGH 5 · MEDIUM 7 · LOW 10 · INFO 1. Top 10 were the pre-existing set. `typescript:S6772` on the file label in `SlipScanner.tsx` was fixed before that scan. No exclusions, won't-fix, or gate change.
- Who fixed: Cursor (Field, reviewer mode).

## Decisions Raised
- None. Pre-decided items used: `barcode-detector@^3.2.3`, `POST /payments/:id/verify-slip`, the seven slip error codes, `PaymentSchema.slipAmount` and `slipTransRef`, `EASYSLIP_API_KEY` / `EASYSLIP_BASE_URL`, EasySlip v2 body flags, no slip image / raw JSON / names stored, `audit_action` `REJECT` (Q1 = A). DR-027 B: the staff app is not built here.

## Deviations from Brief
- None needing a DR. Interpretations (auditor please check):
  - **JSON parser limit is 2 MB** (Rev 2). `VerifySlipSchema` still rejects a decoded image over 1,048,576 bytes with 400 `VALIDATION_ERROR`. Comment in `configure-app.ts`.
  - **`PaymentSchema.slipTransRef`** is in the Rev 2 pre-decided list. No new column.
  - **`matchedAccount` null is `not_matched`** (Rev 2). A missing field stays `unknown`. If the bar account is not registered in EasySlip, a real slip can say wrong receiver; **ยืนยันด้วยตนเอง** remains. No name or digit fallback.

## Known Gaps / Follow-ups
- EasySlip-key half of the run proof, plus BRIEF-013 AC-12's manual half and CD-03 Q2, still wait on Field's key and account registration.
- Audit Finding 10: the Rev 2 brief text is already `eb5755b`. This round did not edit the brief. Field still confirms that commit for Cowork to record.
- Suggestions 6, 7, and 11 are in `259b81f` (in-flight detect, resize failures show the unreadable-slip copy, scan warning after five misses or a failed module load).
- **Dev server:** :3001 and :3101 are free. The proof processes were stopped after the checks above.
- **Local data:** T1 is still `active`. The proof payment is `cancelled` / `staff_cancel`. The two `REJECT` rows stay (append-only). Venue PromptPay id and type are NULL again.
- **Setup gap (names only):** `app/frontend/.env.local` has no `NEXT_PUBLIC_API_MOCKING`. Playwright sets it for e2e.
- Staff-app slip check stays a later mobile brief (DR-027 B).

## AI Usage
**High** — Cursor wrote the code, tests, and this handoff (Field 0 % coding, reviewer mode).

## Review Routing
- Assigned auditor: Cowork
- Next command: `audit BRIEF-025`
- Work SHA: `259b81f` · self-check: brief Rev 2 ↔ DR-026 / DR-027 B ↔ `1762800000000-AuditRejectAction.ts` ↔ `schema.sql` `audit_action` ↔ contracts `payments.ts` / `errors.ts` / `enums.ts` ↔ EasySlip adapter (null → `not_matched`) ↔ POS `SlipScanner` / `useSlipScanner` ↔ static wasm copy ↔ no new backend dependency
