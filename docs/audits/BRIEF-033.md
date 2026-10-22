# Audit — BRIEF-033 Web POS: checkout (PromptPay QR · cash · manual confirm)

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-22 morning |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-22 |
| **Branch / commit** | `feat/BRIEF-033-pos-payment-checkout` · `5a2b7b8` (audited work commit, after `f9789e5` WIP; handoff `36c5f0a` / `d7e4435`) |
| **Depth** | Full (payment) |
| **Brief revision** | 1 |
| **Recommendation** | **PASS** (`5a2b7b8` + Suggestions 1–3 `f36352e`) ← Field makes the final call |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence (test / file) | Note |
|---|---|---|---|
| AC-1 | ✅ | `useCheckout.ts` `keyForAttempt` (one key per attempt, `busy` ref blocks double tap) · `PromptPayQr.tsx` `QRCodeSVG value={qrPayload}` 240 px, quiet zone 4, `qr-bg` / `qr-ink` · `useQrClock` countdown to `expiresAt` · `CheckoutModal.test.tsx` · run proof screenshot: ฿500.00 QR, 14:58, รอชำระ | QR in the screenshot is dark-on-cream with a full quiet zone — scannable shape; real bank scan stays Field's task (26 Oct) |
| AC-2 | ✅ | network → key kept, retry same key; `PAYMENT_IN_FLIGHT` → `readAttempt(error.data)` pending part → pending view; `PROMPTPAY_NOT_SET` → fault `promptpay`, cash still selectable; `NOTHING_TO_PAY` → refresh + close · tests | |
| AC-3 | ✅ | `usePaymentStatus` — `payment.status_changed` (contracts-parsed, filtered by `paymentId`) updates the cache; `refetchInterval: 5_000` while the socket is down; `completed` → `paid` → 3 s auto-advance → drawer "ชำระครบแล้ว", table open · tests + e2e · run proof T1 | |
| AC-4 | ✅ | `fromStatus`: `cancelled` + `expired` → `expired` phase; `newQr()` mints a **new** key · test | |
| AC-5 | ✅ | `cancel` → `sync` → choose (bill unlocked via refresh); 409 → `getPayment` → real state · tests | Not exercised live (handoff) |
| AC-6 | ✅ | `canConfirm` (reason required; `other` needs note ≤ 500); body `{ via: 'manual', reason, note? }`; Badge + Toast · test + e2e · run proof T1 (ลูกค้าโอนเข้าบัญชีร้านโดยตรง) | |
| AC-7 | ✅ | cash completes in one POST; `cashShort` / `changeAmount` in integer satang via `lib/utils/money.ts` (DR-002 Amendment 1) · tests · run proof C2 (empty helper → allowed) | |
| AC-8 | ✅ | `splitLate(groups, pending.createdAt)` → divider "ออเดอร์ใหม่หลังสร้าง QR"; close disabled while `bill.locked`; "ดู QR" reopens (screenshot) · `SessionDrawer.test.tsx` | |
| AC-9 | ✅ | lint / typecheck / test 93 / e2e 10 / build exit 0 · run proof on 3000 / 3001 as Field, test PromptPay ID, 4 screenshots | e2e `login.spec.ts` flaked once (untouched file) |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope | ✅ | split / slip / gateway / print untouched; settings screen not built |
| Deps | ✅ | `qrcode.react@^4.2.0` = Pre-decided + DR-018; lockfile +12 |
| Money from the server | ✅ | amounts are `Payment.amount` / `bill.*`; only the cash change helper calculates (allowed by DR-002 Amendment 1) |
| Never complete PromptPay client-side | ✅ | `paid` only from server status (create result, event, poll) or the `mark-paid` response |
| Idempotency (CD-03 §9 / DR-017) | ✅ | same key on retry; new key after success, method change, expiry / "สร้าง QR ใหม่"; a lost create response is recovered either by replay (same key) or by `boot` resuming the visit's pending part |
| BRIEF-030 S1 fix | ✅ | `useSession`: sticky `blocked` removed, `paying = bill.locked` only |
| Sonar (required) | ✅ | scanned `5a2b7b8`: fixed S3776 ×2, S3358; remaining S6819 on `SessionDrawer.tsx` (`role="dialog"` on `<aside>`) has a written reason (non-modal side panel — BRIEF-030 accepted deviation); 16 pre-existing elsewhere; coverage config known. No exclusions / "won't fix" |
| Run proof on the audited SHA | ✅ | `36c5f0a` = `5a2b7b8` + docs only |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Suggestion | Low | Run proof covered create → manual confirm → close and cash. **Current:** cancel QR, expiry and the 409 paths are proven by component tests only. **Updated:** include one live "ยกเลิก QR" in the Sunday demo run (30 s), since a stuck lock is what would hurt on stage. |
| 2 | Suggestion | Low | `login.spec.ts` failed once and passed on re-run. **Updated:** if it flakes again, look at the LINE-button `setTimeout` (250 ms) vs Playwright's navigation wait — not this brief. |
| 3 | Suggestion | Low | Sonar S6819 on `SessionDrawer.tsx` will keep showing. **Updated:** if you want a clean gate later, either accept it in Sonar with your approval or switch the panel to a labelled `<section>` + manual focus handling — your call, no action needed now. |

Note (not a finding): 1,580 insertions (incl. docs / screenshots) vs ~550–650 estimate — same ~2× pattern. "Cursor started, Claude Code finished" — handoff attributes both; fine.

## Field, 2026-10-22 (session): fix Suggestions 1–3 in this brief before the PASS commit
- **S1 → live evidence:** run proof adds (a) สร้าง QR → **ยกเลิก QR** → back to checkout, drawer unlocked (`bill.locked` false), ปิดโต๊ะ / ชำระเงิน usable again; (b) one live 409: with a QR pending on a table, try ปิดโต๊ะ (or `POST /visits/:id/close`) → "มีการชำระเงินค้างอยู่" shown, nothing closed. Screenshots in the handoff. Expiry (15 min) stays covered by the component test.
- **S2 → `e2e/login.spec.ts`:** find why it flaked (likely the 250 ms `setTimeout` before `location.assign` vs the test's navigation wait) and make the test wait on the observable result (request to `/auth/line/login` or the URL), not on timing. Run `test:e2e` 3× in a row — all green — and note it in the handoff. Test-only change; the login behaviour stays as BRIEF-028 shipped it.
- **S3 → Sonar S6819:** `SessionDrawer.tsx` drops `role="dialog"` from the `<aside>` (a non-modal side panel is a complementary region, not a dialog): keep `<aside aria-labelledby={titleId}>` (or `aria-label` while loading / error), keep Esc-to-close and the floor clickable. Update the tests that query `getByRole("dialog")` for the drawer to `getByRole("complementary", { name: … })`; the close-confirm and checkout modals stay real dialogs. Re-scan: no open issue left in files 033 changed.
- Gates + Sonar re-run on the new commit; Cowork re-checks that commit only.

## Recommendation to Field
PASS. Payment is the riskiest screen and it holds: one key per attempt, a lost response recovers without a second QR, PromptPay is only ever completed by the server, the bill lock drives the drawer, and the close button comes back as soon as the payment completes (030 S1 fixed). Your live run did the whole 10 Nov story: order → QR → manual confirm → ชำระครบแล้ว → ปิดโต๊ะ.

**Next command:** superseded by the re-check below.

## Evidence Coverage
- Reviewed work SHA: `5a2b7b8`
- Sources/diff inspected independently: `2355f19..5a2b7b8` — `useCheckout.ts`, `checkout-phase.ts`, `usePaymentStatus.ts`, `payment.ts`, `PromptPayQr.tsx`, `PaymentResult.tsx`, `CheckoutModal.tsx` (auto-advance), `lib/api/payments.ts`, `useSession.ts`, `session-groups.ts` (`splitLate`), `CloseConfirmModal.tsx`; contracts `PaymentSchema`, `PaymentAttemptSchema`, `MarkPaidSchema`, `PaymentStatusChangedPayloadSchema`; screenshots `qr-pending.jpg`, `drawer-paid.jpg`
- Tests run or independently inspected: **inspected, not re-run** (no pnpm on the Cowork shell). Independent gate evidence = GitHub `ci` on the PR head
- Written uncommitted; the executor commits it unchanged at PASS (H). Pre-merge summary must verify S..H contains evidence-only changes (§7).
- Repeated blocker: none

## Re-check — 2026-10-22 · `f36352e` (Suggestions 1–3, Field instruction)
| # | Result | Evidence |
|---|---|---|
| S1 | ✅ | Handoff (`96b449d`) live run on T6 ฿240.00: QR pending → `POST /visits/:id/close` → **409 `PAYMENT_IN_FLIGHT`**, T6 still `active`; drawer "มีการชำระเงินค้างอยู่" + "ดู QR", ปิดโต๊ะ disabled → ดู QR → **ยกเลิก QR** → checkout → drawer unlocked, ชำระเงิน / ปิดโต๊ะ usable. Screenshots `locked-close-blocked.jpg`, `cancel-unlocked.jpg`. Expiry stays test-covered (as agreed). |
| S2 | ✅ | `e2e/login.spec.ts`: the pending label is observed inside the page (`addInitScript` MutationObserver → `exposeFunction`), the test waits on the URL and then asserts it was seen — no polling race with the 250 ms navigation. `LoginCard` unchanged (BRIEF-028 behaviour kept). `test:e2e` 10 / 10 **three runs in a row**. |
| S3 | ✅ | `SessionDrawer.tsx`: `role="dialog"` removed → `<aside aria-labelledby>` = complementary landmark; Esc / clickable floor unchanged; drawer queries moved to `getByRole("complementary", { name })` in unit + e2e; checkout, close-confirm and open-table remain dialogs. Sonar re-scan of `f36352e`: no open issue in any file 033 added or changed (16 pre-existing elsewhere, coverage config known). |
| Extra | ✅ | `CheckoutModal.test.tsx` QR waits 1 s → 4 s after one load-related failure — test-only. |

Diff `d7e4435..f36352e` is tests, the drawer's ARIA role and one comment — no payment, money or idempotency code changed, so the original review stands. Gates: test 93 (×2), e2e 10 (×3), lint / typecheck / build exit 0 (handoff).

**Final result: PASS** — zero Must fix, zero open suggestions in this brief.

**Next command:** `execute BRIEF-033` (PASS commit + PR) — audit + handoff + state on the branch first, then PR, merge when `ci` is green.
