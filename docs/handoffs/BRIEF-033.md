# Handoff — BRIEF-033 Web POS: checkout

| | |
|---|---|
| **Implementer** | kj (Cursor started, Claude Code finished) |
| **Date** | 2026-10-22 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-033-pos-payment-checkout` (no PR until audit PASS) |
| **Status** | Implemented — **run proof pending** (needs Field's LINE sign-in) |

## Summary
Drawer footer "ชำระเงิน" and the close-confirm "ไปที่ชำระเงิน" open the checkout modal (`?pay=1`). PromptPay QR (rendered from `qrPayload` with `qrcode.react`, DR-018) and cash. Pending view with countdown, cancel, manual confirm; result by `payment.status_changed` or a 5 s poll when the socket is down. Drawer shows the in-flight state, "ดู QR", and the divider for orders placed after the QR. BRIEF-030 S1: ปิดโต๊ะ "paying" comes from `bill.locked` only.

## AC evidence
| AC | Test |
|---|---|
| AC-1, AC-2, AC-7 | `checkout/CheckoutModal.test.tsx` — one create + key + double tap · network retry same key · `PAYMENT_IN_FLIGHT` · `PROMPTPAY_NOT_SET` · cash short/empty/change |
| AC-3 | `CheckoutModal.test.tsx` — completed event · socket-down 5 s poll · `e2e/payment.spec.ts` |
| AC-4 | `CheckoutModal.test.tsx` — expired + new key |
| AC-5 | `CheckoutModal.test.tsx` — cancel, cancel 409 |
| AC-6 | `CheckoutModal.test.tsx` — manual confirm reason / other note / body · `e2e/payment.spec.ts` |
| AC-8 | `SessionDrawer.test.tsx` — "an order placed after the QR sits under the divider" |
| AC-9 | below; run proof **not done** |

Deviation from §5 file layout: manual-confirm, pending-view and status-poll tests live in `CheckoutModal.test.tsx` (the modal drives them); no separate `ManualConfirmModal.test.tsx` / `usePaymentStatus.test.ts` / `PromptPayPending.test.tsx`. Component is `ManualConfirm.tsx`.

## Gate Evidence (G1)
Node v24, pnpm 10. Run on the tree after the last fix commit.

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/frontend lint` | 0 | pass |
| `pnpm --filter @bar/frontend typecheck` | 0 | pass |
| `pnpm --filter @bar/frontend test` | 0 | 93 passed (21 files) |
| `pnpm --filter @bar/frontend test:e2e` | 0 | 10 passed. One earlier full run had `login.spec.ts` fail once (flaky, passed on re-run, untouched file). |
| `pnpm --filter @bar/frontend build` | 0 | pass |
| run proof | **not done** | `migration:run` → no migrations pending; `/api/health` → 200, but against a backend left running from earlier, so it is **not** valid evidence. The UI walk (T1 → ชำระเงิน → QR → manual confirm → close; then cash) needs Field to sign in with LINE and a test PromptPay ID via `PATCH /venue/payment-settings`. Screenshots to be added. |

Playwright chromium 1243 was downloaded locally (Field-approved) to run e2e.

## Sonar (local scan)
Scanned `5a2b7b8`. Gate **ERROR**: `new_coverage` 0 % (no coverage report path configured — known, see state) and `new_violations` 17. Fixed in this brief's files: checkout reducer complexity (S3776), mock payments handler complexity (S3776), nested ternary in `SessionDrawer.tsx` (S3358). Remaining in a file this brief changed: `SessionDrawer.tsx:33` S6819 (`role="dialog"` on `<aside>`) — deliberate, see the existing `ponytail` comment (modal `<dialog>` would block the floor). The other 16 are pre-existing (`test/setup.ts`, backend order/payment/menu/seed, `globals.css`, `lib/api/auth.ts`). No exclusions or "won't fix" set.

## Dependency / DR
`qrcode.react@^4.2.0` (`app/frontend` only) — Pre-decided in the brief, DR-018.

## AI usage
n/a (Field's own brief).

## Limits
Real-bank scan not part of this brief. Orders/PromptPay ID in the local DB unchanged by me.
