# Audit — BRIEF-052 Customer QR: pay the table bill (PromptPay merge), แจ้งโอนแล้ว (C5)

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-30 |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-30 |
| **Branch / commit** | `feat/BRIEF-052-customer-pay` · **S = `655eb58`** (backend `b6e394c`, UI `96db122`, fixes `8676379`, `655eb58`) · handoff `c6f9598` · merge `origin/main` (051) `6f70b65` · seed `630d8b9` |
| **Depth** | Full (payment + guest auth) |
| **Brief revision** | 1 |
| **Recommendation** | **CHANGES REQUIRED** — Must fix 1 (cash-pending leaks into the guest view), Must fix 2 (staff-side run proof + screenshots). Schema docs → Field-approved Cowork edit. |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Trial #36 — planner AC tests
- `git diff 630d8b9 c6f9598 -- app/backend/test/customer-payment.e2e-spec.ts app/frontend/e2e/customer-pay.spec.ts` → **empty**: both planner files are byte-identical to the seed; 9 + 5 pass per handoff. No selector or helper had to be touched.
- Harness wiring the executor added (allowed by §5): `posPending / markPaid / expirePending` mock controls; customer mock "server" kept in `sessionStorage` (AC-13 reloads `/customer/pay`); `expirePending` before the create lands returns it already cancelled.
- **Gap the planner tests missed** (found in review, not by the tests): a `cash` pending payment from the POS — Must fix 1. Lesson for #36: write one negative AC per "the X only" phrase in §3 ("the visit's pending **PromptPay** payment").

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1 – AC-9 | ✅ | planner API e2e unchanged + green; `CustomerPaymentService` (all writes through `PaymentService`), `pendingView` field-by-field, cancel = 404 off-visit → 403 not-yours → existing 409; notify checks state before the 60 s throttle; `PaymentService.emitChanged` → `tab.changed` + `clearTransferCall` (only a `transfer` bell) once not pending | Must fix 1 on `pending` |
| AC-10 – AC-14 | ✅ | planner UI e2e unchanged + green; `role="timer"`, `promptpay-{seat}.png`, `CallStaffSheet initialReason`, POS `callReasonText` | |
| AC-15 | ⚠️ | gates green on `655eb58` (contracts 95, backend 179 / e2e 214, openapi:check, frontend 240 / e2e 41, build); Sonar run, this brief's file fixed | run proof partial → Must fix 2 |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| One payment writer | ✅ | guest create/cancel call `PaymentService` (`create` takes `guestSessionId`); same lock / idempotency / expiry |
| No new dependency | ✅ | `qrcode.react` already used by the POS checkout (`PromptPayQr.tsx`) |
| Module boundaries | ✅ | `PaymentModule` ↔ `VenueModule` was already a `forwardRef` pair (structure review F7); `TableSeatService` injected inside it, no new cycle |
| Guest isolation | ✅ | class-level `@Public()` + guard; staff token / guest cookie crossing → 401 (AC-9) |
| Migration ↔ entity | ✅ | `payment.guest_session_id` + partial index, CHECK += `transfer`; entities and records carry both |
| Protected docs | ✅ | `docs/schema.sql` / ERD untouched (§8 none) → Finding 3 |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | **Must fix** | Medium | **Current:** §3 — "`pending` = the visit's `pending` **PromptPay** payment". `CustomerPaymentService.get` uses `PaymentService.findPendingRecord` → `findPendingByVisit` (`status = 'pending'`, any method). When the cashier starts a **cash** checkout on the POS, every phone gets `pending` with `qrPayload: ''` → the guest sees "ดู QR" and an empty QR. **Updated:** (a) `get` returns `pending` only when the pending payment's `method = 'promptpay'`; a cash pending → `pending: null` with `bill.locked: true` (guest `POST` still 409 `PAYMENT_IN_FLIGHT`); (b) intent screen: `locked && !pending` → text "พนักงานกำลังเช็คบิลให้โต๊ะนี้" and no "สร้าง QR พร้อมเพย์"; (c) tests: one API e2e (POS cash pending → `GET` `pending: null, locked: true`, `POST` 409) and one component test for (b). Add them as executor tests (unit/e2e) — the planner files stay unchanged. |
| 2 | **Must fix (evidence)** | Low | **Current:** run proof stops at the phone (QR, แจ้งโอนแล้ว, เปลี่ยนวิธีจ่าย, bell cleared); no POS side on the real stack, no screenshots saved. **Updated:** with Field's LINE login (as BRIEF-051): POS T3 card "แจ้งโอนแล้ว ฿…" + chime → POS checkout marks paid (manual · direct_transfer) → phone flips to "ชำระเรียบร้อย", POS bell gone. Save the 5 screenshots in `docs/handoffs/assets/BRIEF-052/` (intent, QR view, notified, POS card with transfer chip, paid). **Real banking-app scan: waived** — the guest QR uses the same `qrPayload` builder as the POS checkout already proven on a device (BRIEF-025 run proof). |
| 3 | Field-approved edit (docs) | Low | **Current:** `docs/schema.sql` / `docs/erd.html` lack `payment.guest_session_id` and the `transfer` reason. **Updated:** Cowork writes both on Field's OK (diff in session); executor commits them in the PASS commit with `Approved-by: Field (session)`. |
| 4 | Suggestion | Medium (for AI insight) | **Current:** a guest's "เปลี่ยนวิธีจ่าย" records `status_reason = staff_cancel` (no guest reason in the enum). Owner reports / the fraud view (DR-014: "voids after a payment attempt", cancelled payments by reason) will count guest cancels as staff cancels. **Updated:** add `guest_cancel` to `PaymentStatusReasonSchema` + DB enum in the AI-insight backend brief (or a small follow-up before it). |
| 5 | Suggestion | Low | `CustomerOrderController` (BRIEF-048) is still missing from the OpenAPI export script — next backend brief adds it (handoff follow-up). |
| 6 | Info | — | Expired-on-phone but job not yet run → "สร้าง QR ใหม่" gets 409 for a few seconds (handoff). Acceptable; the UI retries on the next ping. |
| 7 | Info (BRIEF-051 head check) | — | BRIEF-051 merged at `e3fdca2`, a fix commit **after** its PASS commit `8c20438` (Must fix 1 + Suggestions 2–3) without a re-audit. Cowork reviewed it here: `SeatSection` counts only seats with `currentVisit` + component test with a stale pending ticket on free T6; `usePosAlerts` re-arms the unlock listener whenever `locked`; `__staffSocket` gated by `NODE_ENV !== 'production'`. **Correct — 051 Must fix 1 closed.** Process note: the uncommitted "Field decision" lines in `docs/audits/BRIEF-051.md` never reached `main`; the merged report still reads plain PASS. Order for next time: fix commit → re-audit → PASS commit. |

## Recommendation to Field
Strong result for trial #36: the executor built to the planner's tests without touching one assertion. Review found one real gap the tests didn't express (cash pending shown as an empty QR) — small fix, plus the staff-side proof you'll demo anyway. Approve the schema docs diff when you're ready.

**Field decision (2026-10-30, in session): accept Suggestions 4 and 5** → they become **Must fix 3** and **Must fix 4** in this brief:
- **Must fix 3 — `guest_cancel` reason.** `PaymentStatusReasonSchema` += `guest_cancel` (contracts; `payment.status_reason` is `VARCHAR(30)`, no migration); `PaymentService.cancel` takes the reason (staff routes keep `staff_cancel`, the guest route passes `guest_cancel`); POS shows it as "ลูกค้ายกเลิก" wherever a status reason is rendered; MSW mocks updated; tests: the API e2e for guest cancel asserts `status_reason = 'guest_cancel'` (executor's own test — planner files unchanged), staff cancel still `staff_cancel`. `docs/schema.sql` comment updated through the Field-approved docs edit (Finding 3).
- **Must fix 4 — OpenAPI export.** Add `CustomerOrderController` (BRIEF-048) to `scripts/create-openapi-document.ts`; regenerate `docs/api/openapi.json`; `openapi:check` green.

**Field approved the schema docs edit in session (2026-10-30, "approve schema docs edit")** — `docs/schema.sql` (+ `payment.guest_session_id`, index, CHECK += `transfer`, `guest_cancel` comment) and `docs/erd.html` (payment field + relation, notes) written to the BRIEF-052 worktree by Cowork, uncommitted; commit them in the PASS commit with `Approved-by: Field (session)`.

**Next command:** `execute BRIEF-052` (Must fix #1 cash pending, #2 staff-side run proof + screenshots, #3 `guest_cancel`, #4 OpenAPI export), then `audit BRIEF-052`.

---

## Re-audit 1 — 2026-10-30 (Cowork)
| | |
|---|---|
| **Reviewed** | **S = `f281329`** (fix for Must fix 1, 3, 4) |
| **Result** | **CHANGES REQUIRED** — only Must fix 2 (evidence) open |

- ✅ **Must fix 1.** `CustomerPaymentService.get` shows `pending` only when `method = 'promptpay'`; any other pending keeps `bill.locked: true`. `IntentView`: `locked && !pending` → "พนักงานกำลังเช็คบิลให้โต๊ะนี้", no create button. Tests: `customer-payment-follow-ups.e2e-spec.ts` (POS cash pending → `pending: null`, `locked: true`, guest `POST` 409 `PAYMENT_IN_FLIGHT`) + `PayScreen.test`.
- ✅ **Must fix 3.** `PaymentService.cancel(id, reason = 'staff_cancel')`; guest route passes `guest_cancel`; contracts enum += `guest_cancel`; e2e asserts `guest_cancel` (phone) and `staff_cancel` (POS). The POS renders no status-reason text today (only `expired` drives a phase), so the "ลูกค้ายกเลิก" label has no place to show yet — nothing to change; note for the reports / AI-insight UI.
- ✅ **Must fix 4.** `CustomerOrderController` added to `create-openapi-document.ts`; `openapi.json` regenerated.
- ✅ **Planner files (trial #36)** still byte-identical to the seed (`git diff 630d8b9 f281329` on both files: empty); the new checks live in the executor's own files.
- ⚠️ **Must fix 2 — still open:** no staff-side run proof on the real stack (POS card "แจ้งโอนแล้ว ฿…" + chime → POS marks paid → phone "ชำระเรียบร้อย", bell gone) and no screenshots under `docs/handoffs/assets/BRIEF-052/` (5 listed in Must fix 2). This needs your LINE login on the POS, as in BRIEF-051.

**Next command:** `execute BRIEF-052` (Must fix #2 only — staff-side run proof + 5 screenshots; no code change expected).

---

## Re-audit 2 — 2026-10-30 (Cowork)
| | |
|---|---|
| **Reviewed** | S = `f281329` (no new commit) + executor's written staff-side run proof (relayed by Field in session) |
| **Result** | **PASS** — no Must fix open |

- ✅ **Must fix 2 closed on written evidence.** Real stack, Field signed in on the POS: phone "แจ้งโอนแล้ว" → T3 card "แจ้งโอนแล้ว ฿380.00" + Toast → POS mark paid (`direct_transfer`) → DB payment `completed` / `manual` / `direct_transfer`, transfer bell cleared → phone "ชำระเรียบร้อย" live. Together with the earlier phone-side proof (QR, countdown, แจ้งโอนแล้ว, เปลี่ยนวิธีจ่าย → bell cleared) this covers the full flow.
- **Screenshots waived** (auditor decision): the executor's browser pane can't write image files this session and `screencapture` failed; mock-mode screenshots would not prove the real stack; workflow Rev 20 avoids manual tasks for Field. The **final handoff must carry the proof lines above verbatim** (amounts, DB values, the waiver reason). Demo screenshots for the 8 Nov deck can be taken during the rehearsal instead.
- Trial #36 closes clean: planner tests untouched through every round; one real gap found by review, not by tests (cash pending).

**Packaging for the PASS commit:** this report + final handoff (written run proof, Sonar, deviations incl. harness wiring, waiver) + state + `docs/schema.sql` + `docs/erd.html` with `Approved-by: Field (session)`.

**Next command:** `execute BRIEF-052` (PASS commit + PR).
