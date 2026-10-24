# Handoff — BRIEF-025 PromptPay slip verification (EasySlip + POS scan)

| | |
|---|---|
| **Implementer** | kj (Cursor) |
| **Date** | 2026-10-24 |
| **Brief revision** | 1 (Field-approved 2026-10-24) |
| **Branch** | `feat/BRIEF-025-promptpay-slip-verify` (seed `82244be`, merged `origin/main` at `3725ee1`) |
| **Commit** | Work SHA `29c5c48` (API `dc5da44`, POS `29c5c48`) |
| **Assigned auditor** | Cowork |
| **Status** | Implemented — no PR until audit PASS |

## Summary
- **`POST /api/payments/:id/verify-slip`** (`payments:create`). Body is exactly one of `{ payload }` (1–128) or `{ image }` (base64 JPEG/PNG, decoded ≤ 1 MB). Pending own-PromptPay only. EasySlip v2 `POST /verify/bank` runs **outside** any DB transaction (`fetch`, no new backend package). Then one transaction locks the payment `FOR UPDATE`, checks receiver and amount, and `save()`s `completed` / `confirmed_via = slip_verify` / `slip_trans_ref` / `slip_amount` / `paid_at`. Expiry job removed; `payment.status_changed` uses the existing payload.
- **Rejections** leave the payment pending and append one `audit_log` row with action `REJECT` (`reason`, plus `transRef` and `amount` when known). No slip image, raw JSON, or names. `23505` on `payment_slip_trans_ref_key` → `SLIP_ALREADY_USED`. A payment that is not a pending PromptPay returns `409 INVALID_STATE_TRANSITION` and does not call EasySlip.
- **Migration** `1762800000000-AuditRejectAction.ts`: `ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'REJECT'`. Down is a no-op (Postgres cannot drop an enum value). `docs/schema.sql` enum line only. No new payment column — `slip_trans_ref` and `slip_amount` were already in the payments migration.
- **POS:** PromptPay pending gets **สแกนสลิป**. Live rear camera + `barcode-detector` (`^3.2.3`). First QR posts `{ payload }` once and stops the tracks. **ถ่ายรูปแทน** (frame, long side ≤ 1280, JPEG q 0.8) and **เลือกรูป** (no `capture`) post `{ image }`. Wasm is `GET /zxing/zxing_reader.wasm` from this app (`locateFile` never a CDN). Camera tracks stop on result, close, and unmount. Every error shows its copy plus **สแกนใหม่** and **ยืนยันด้วยตนเอง**. Verified shows **ยืนยันสลิปแล้ว**, the bank ref, the slip amount, and **โอนเกิน** when the slip is above the bill.
- **Config:** `EASYSLIP_API_KEY` (empty is allowed — the app boots, verify returns 503) and `EASYSLIP_BASE_URL` (default `https://api.easyslip.com/v2`) in `app/backend/.env.example`. Key is not logged.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | e2e "completes a matched slip…" — completed, `slip_verify`, expiry job gone, `payment.status_changed` |
| AC-2 | ✅ | contracts `payments.test.ts` "accepts one slip field…" · e2e "accepts a jpeg image and rejects a bad body" (oversized decoded image → 400 `VALIDATION_ERROR`) |
| AC-3 | ✅ | e2e "accepts an overpayment and rejects a short one" — ฿1,400 completed `slipAmount: '1400.00'`; ฿1,200 → 422 `SLIP_AMOUNT_SHORT`, still pending |
| AC-4 | ✅ | e2e "rejects a reused reference…" — 409 `SLIP_ALREADY_USED`; two concurrent verifies, exactly one completes |
| AC-5 | ✅ | e2e "records a rejection with no names…" + service spec — each failure code, payment stays pending, one `REJECT` row, no names |
| AC-6 | ✅ | e2e "does not call the verifier unless…" — cash / cancelled / completed / expired do not call EasySlip |
| AC-7 | ✅ | `easyslip-slip-verifier.spec.ts` — fixture success, flags and bearer, null/absent `matchedAccount` → `unknown`, 404 codes, 401/403/429/5xx/timeout/weird body/missing key (no fetch) |
| AC-8 | ✅ | `SlipScanner.test.tsx` — one `{ payload }`, tracks stopped, wasm URL `/zxing/zxing_reader.wasm` (no jsDelivr); photo buttons send `{ image }`; denied camera shows the note and the file input has no `capture` |
| AC-9 | ✅ | same component test (each error code + **โอนเกิน**) · e2e `payment-slip.spec.ts` photo path → ยืนยันสลิปแล้ว, REF-E2E, โอนเกิน |
| AC-10 | ⏸ | Network panel not observed. Substitute is the component assertion on `locateFile`. Real host check is part of the blocked run proof |
| AC-11 | ⏸ | Gates below pass. Run proof not run — no EasySlip key and the bar account is not registered |

## Gate Evidence (G1)
Dev ports :3000 / :3001 / :3100 were free. Postgres, Redis, and SonarQube were already up. Backend e2e used `bar_test`.

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/contracts build` / `lint` / `typecheck` | 0 | pass |
| `pnpm --filter @bar/contracts test` | 0 | 80 passed (10 files) |
| `pnpm --filter @bar/backend lint` | 0 | oxlint + class-files |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 147 passed (39 files) |
| `pnpm --filter @bar/backend test:e2e` | 0 | 175 passed (26 files) |
| `pnpm --filter @bar/backend openapi:check` | 0 | re-checked on `29c5c48`; export matches the committed file |
| `pnpm --filter @bar/frontend lint` / `typecheck` | 0 | pass |
| `pnpm --filter @bar/frontend test` | 0 | 180 passed (37 files) |
| `pnpm --filter @bar/frontend test:e2e` | 0 | 22 passed, including `payment-slip.spec.ts` |
| `pnpm --filter @bar/frontend build` | 0 | pass |
| run proof | — | not run (blocked) |

## Run proof
Not run. The brief stops here until Field signs up EasySlip (Start) and registers the bar account. No key was invented and none was written into `.env`. `migration:run` was not applied to dev `bar`. `/api/health` was not curled. A real bank scan, the second scan of the same slip, **ถ่ายรูปแทน**, the PromptPay-phone `matchAccount` result (Q2), and the wasm network panel are all still open.

## Sonar (local scan)
- Scanned commit: `29c5c48`. Quality Gate: **ERROR** — `new_coverage` 0.0 % (no coverage path, known) and `new_violations` 22.
- Issues by severity: BLOCKER 0 · HIGH 5 · MEDIUM 7 · LOW 10 · INFO 1 (`pnpm sonar:report`). Top 10 are the pre-existing set (setup.ts, order query, request-hash, menu img role, promptpay-payload, seed, menu-availability). One new finding in this brief, `typescript:S6772` on the file label in `SlipScanner.tsx`, was fixed before this scan (text wrapped in `<span>`). No exclusions, won't-fix, or gate change.
- Who fixed: Cursor (Field, reviewer mode).

## Decisions Raised
- None. Pre-decided items used: `barcode-detector@^3.2.3`, `POST /payments/:id/verify-slip`, the seven slip error codes, `PaymentSchema.slipAmount`, `EASYSLIP_API_KEY` / `EASYSLIP_BASE_URL`, EasySlip v2 body flags, no slip image / raw JSON / names stored, `audit_action` `REJECT` (Q1 = A). DR-027 B: the staff app is not built here.

## Deviations from Brief
- None needing a DR. Interpretations (auditor please check):
  - **JSON parser limit is 2mb, not 1mb.** A 1mb JSON body cannot carry a decoded image of 1 MB (base64 is about 4/3). `VerifySlipSchema` still rejects a decoded image over 1,048,576 bytes with 400 `VALIDATION_ERROR`. The 2mb parser is what lets that request reach the schema. Comment in `configure-app.ts`.
  - **`PaymentSchema.slipTransRef`** (nullable string) is returned as well as `slipAmount`. The pre-decided list names only `slipAmount`. AC-9 has to show the bank ref, and the column already exists. No new column.
  - **EasySlip `matchedAccount` null or absent → `unknown`**, never `not_matched` (AC-7). `not_matched` is only produced by the test double, so the service path is covered. A real PromptPay-phone miss becomes `SLIP_RECEIVER_UNCLEAR` and manual confirm (Q2, recorded at the run proof). No name or digit fallback in this brief.
  - **AC-10** is not a network-panel observation. The component test checks the URL the hook asks `locateFile` to return.

## Known Gaps / Follow-ups
- **Run proof** blocked on Field's EasySlip key and account registration. That proof also covers BRIEF-013 AC-12's manual half and CD-03 Q2.
- **Size:** 2,057 / 34 vs `3725ee1` (46 files). `openapi.json` is about 368 of those lines. Brief accepted ~1.2k vs ~500.
- **Dev server:** nothing was listening on :3001 or :3000 at the end of this session. The previous plain `node dist/main` of `b000e4e` was already gone and was not restarted. After this migration, a restarted backend must include `AuditRejectAction`.
- **Setup gap (names only):** `app/frontend/.env.local` has no `NEXT_PUBLIC_API_MOCKING`. Playwright sets it for e2e. Root and backend env examples have no missing key names.
- Staff-app slip check stays a later mobile brief (DR-027 B).

## AI Usage
**High** — Cursor wrote the code, tests, and this handoff (Field 0 % coding, reviewer mode).

## Review Routing
- Assigned auditor: Cowork
- Next command: `audit BRIEF-025`
- Work SHA: `29c5c48` · self-check: brief Rev 1 §2–§4 ↔ DR-026 / DR-027 B ↔ `1762800000000-AuditRejectAction.ts` ↔ `schema.sql` `audit_action` ↔ contracts `payments.ts` / `errors.ts` / `enums.ts` ↔ `payment.service.ts` ↔ EasySlip adapter ↔ POS `SlipScanner` ↔ no new backend dependency
