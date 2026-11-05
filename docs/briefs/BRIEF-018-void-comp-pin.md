# BRIEF-018 — Backend: void / comp an item with manager PIN (DR-016)

| | |
|---|---|
| **Status** | Ready — Rev 1 approved by Field 2026-10-31 (in session) |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **PR** | <executor fills> |
| **Affected apps** | backend, contracts |
| **Revision** | 1 |
| **Depends on** | **schema docs edit** (Cowork, Field-approved) — `item_adjustment` enum + `order_item.cancel_kind` / `approved_by` in `docs/schema.sql` + `docs/erd.html`, in this brief's seed |
| **References** | **DR-016** (Approved A + session decisions) · FRD §8 (comps & voids), §6 (cancelled items stay visible) · CD-02 void-comp modal (reasons, PIN, self-approve copy) · CD-15 (void from an issue) · DR-014 #8 (one 4-digit POS PIN per person) · BRIEF-013 (`PAYMENT_IN_FLIGHT`) · BRIEF-027 (system void) · BRIEF-053 (catalog) |
| **Audit depth** | Full (money, fraud control, auth) |
| **Size** | ~1 day · ~800–1,000 lines incl. tests |

---

## 1. Goal
A staff member can take an item off the bill (void) or give it free (comp) with a reason, approved on the spot by a manager's 4-digit PIN — or, when a manager is alone, self-approved and flagged for the owner. Totals, the guest's tab, reports and the queue all stay correct, and nothing can be adjusted once money has moved.

## 2. Scope
### In
- **Migration:** `item_adjustment` enum (`void`, `comp`); `order_item.cancel_kind item_adjustment NULL`, `order_item.approved_by UUID NULL REFERENCES staff_user(id)`; backfill existing cancelled rows → `cancel_kind='void'`; CHECK `(cancel_kind IS NULL) = (cancelled_at IS NULL)`.
- **Catalog:** + `orders:void`, `orders:comp` (22 codes). ทั้งหมด picks them up on start (BRIEF-055); migration adds both to the **จัดการร้าน** policy.
- **PIN** (`staff_user.pos_pin_hash`, already migrated):
  - `PUT /me/pin { pin, currentPin? }` — 4 digits; `currentPin` required when a PIN exists; hash = Node `crypto.scrypt` + random salt (no dependency), compare with `timingSafeEqual`.
  - PINs are **unique among active staff** (CD-02: the PIN alone identifies the approver) → `409 PIN_UNAVAILABLE` "ใช้ PIN อื่น" (never says whose).
  - `DELETE /staff/:id/pin` (`staff:manage`) — owner reset; audited.
- **Void / comp** `POST /order-items/:id/void` · `POST /order-items/:id/comp` body `{ reason, note?, pin? }`:
  - Caller needs `orders:update_status`.
  - `pin` given → approver = the active staff whose PIN matches **and** who holds `orders:void` (void) / `orders:comp` (comp) → `approved_by = approver`. No match / no code → `422 PIN_INVALID` "PIN ไม่ถูกต้อง". 5 wrong PINs per caller in 5 min → `429 PIN_LOCKED` (Redis counter; fail open like DR-028 throttles).
  - `pin` omitted → **self-approve**: caller must hold the code, `approved_by = NULL` (flagged); otherwise 403.
  - A PIN that matches the caller → treated as self-approve (`approved_by = NULL`).
  - Reasons (CD-02, order kept): `out_of_stock` ของหมด · `wrong_order` สั่งผิด · `guest_changed` ลูกค้าเปลี่ยนใจ · `spoiled` ของเสีย · `special_service` บริการพิเศษ · `other` อื่นๆ (note required).
  - Blocked: item already adjusted → 409 `INVALID_STATE_TRANSITION`; visit not live → 409; a **pending** payment on the visit → 409 `PAYMENT_IN_FLIGHT`; a **completed** payment on the visit → 409 `VISIT_PAID` "ชำระเงินแล้ว ยกเลิก/Comp ไม่ได้".
  - **Void:** `cancelled_at/by`, `cancel_reason`, `cancel_note`, `cancel_kind='void'`, `approved_by`; every item on the ticket void → ticket `cancelled` (existing rule).
  - **Comp:** same columns with `cancel_kind='comp'`; the line stays on the ticket and is served normally; ticket status unchanged.
  - One `audit_log` row per adjustment (`entity='order_item'`, `changed_fields` incl. kind, reason, approvedBy, selfApproved).
  - Events: `ticket.status_changed` when the ticket status changes; `tab.changed` for the visit (customer tab); POS refreshes via the events it already listens to.
- **Totals everywhere:** void → excluded; comp → ฿0. Update every place that sums lines (`cancelled_at IS NULL` filters in order bills, payment amount, reports SQL, customer tab) to use `cancel_kind` (`void` excluded, `comp` = 0).
- **API shape (no client breakage):**
  - void → existing `cancelledAt` + `cancellation` (+ `approvedBy: StaffRef | null`, `selfApproved: boolean`).
  - comp → `cancelledAt: null`, `cancellation: null`, new `comp: { at, by, approvedBy, selfApproved, reason, note } | null`, `lineTotal: '0.00'`.
  - Customer contract: comp line shows at ฿0 with label "ฟรี" field `isComp: true` (built field by field — no staff names).
### Out
- POS UI (void-comp modal, PIN keypad, self-approve alert, settings PIN screen) → KJ's POS UI brief after this.
- Staff switch on a shared POS with PIN (DR-014 #8) · refunds · fraud / owner review screen (AI insight / S2) · mobile.

## 3. Contract
| Call | Permission | Body / returns |
|---|---|---|
| `PUT /me/pin` | any staff | `{ pin: /^\d{4}$/, currentPin? }` → `{ ok: true }` · 409 `PIN_UNAVAILABLE` · 422 `PIN_INVALID` (wrong current) |
| `DELETE /staff/:id/pin` | `staff:manage` | 204 |
| `POST /order-items/:id/void` · `/comp` | `orders:update_status` (+ code or PIN, §2) | `AdjustItemRequestSchema` → `Order` |
| errors | — | `PIN_INVALID` 422 · `PIN_LOCKED` 429 · `PAYMENT_IN_FLIGHT` 409 · `VISIT_PAID` 409 · `INVALID_STATE_TRANSITION` 409 |
- **Contracts:** `AdjustmentReasonSchema`, `AdjustItemRequestSchema` (note required for `other`), `SetPinRequestSchema`, `LineCompSchema`, `LineCancellation` += `approvedBy`, `selfApproved`; `OrderLine` += `comp`; customer line += `isComp`; error codes += `PIN_INVALID`, `PIN_LOCKED`, `PIN_UNAVAILABLE`, `VISIT_PAID`; permissions += 2.
- **Schema:** +1 enum, +2 columns (DR-016 A).

## 4. Acceptance Criteria
- **AC-1 (approved void)** — Staff S (no `orders:void`) voids a line with manager M's PIN → line `cancelled_at` set, `cancel_kind='void'`, `cancelled_by=S`, `approved_by=M`; bill total drops by the line; one audit row; `tab.changed` emitted.
- **AC-2 (comp)** — Same with comp → line stays, `lineTotal '0.00'`, `comp.approvedBy = M`, bill total drops by the line, ticket status unchanged; customer tab shows the line at ฿0 with `isComp: true`.
- **AC-3 (self-approve)** — M voids with no PIN → `approved_by NULL`, `selfApproved: true`; S (no code) with no PIN → 403, nothing changed.
- **AC-4 (wrong PIN)** — A PIN that matches nobody, or a staff without the code → 422 `PIN_INVALID`, nothing changed; the 6th wrong try within 5 min → 429 `PIN_LOCKED`.
- **AC-5 (money moved)** — Pending payment on the visit → 409 `PAYMENT_IN_FLIGHT`; completed payment → 409 `VISIT_PAID`; nothing changed in either case.
- **AC-6 (last item)** — Voiding the last active item of a ticket → ticket `cancelled`, `ticket.status_changed` emitted; comping the last item → ticket unchanged.
- **AC-7 (twice)** — Void or comp on an already adjusted line → 409; two concurrent voids on one line → exactly one succeeds.
- **AC-8 (PIN)** — `PUT /me/pin` first time without `currentPin` → ok; change without the right `currentPin` → 422; a PIN another active staff uses → 409 `PIN_UNAVAILABLE`; owner reset → `pos_pin_hash` NULL + audit row; the hash is never returned by any endpoint.
- **AC-9 (totals)** — With one void and one comp on a visit: bill, payment amount, customer tab total and the reports day total all exclude the void and count the comp as ฿0 (one e2e asserting each source).
- **AC-10 (catalog)** — `orders:void`, `orders:comp` exist; ทั้งหมด and จัดการร้าน hold them; งานพนักงาน does not.
- **AC-11** — Gates pass; migration up/down clean (backfill reversible); `docs/schema.sql` matches.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1–AC-7, AC-9 | backend e2e | `app/backend/test/void-comp.e2e-spec.ts` |
| AC-8 | backend e2e | `app/backend/test/staff-pin.e2e-spec.ts` |
| AC-10 | backend e2e / unit | `iam-catalog` spec |
| — | unit | approval resolver (`resolveApproval(caller, pin, kind)`) · scrypt PIN hasher |
| AC-11 | command | gates + migration run / revert |

Gate commands:
```bash
pnpm --filter @bar/contracts test
pnpm --filter @bar/backend lint
pnpm --filter @bar/backend typecheck
pnpm --filter @bar/backend test
pnpm --filter @bar/backend test:e2e
```
### Local Sonar scan
- Required: yes.

## 6. Constraints
- Adjustment = one transaction: payment check (`FOR UPDATE` on the visit's payments or the existing payment lock), line update, ticket status, audit row; events after commit.
- PIN compare: scrypt per candidate (small staff count); never log a PIN or hash; constant-time compare.
- Approval resolution in one pure-ish service (`ApprovalService`) used by void and comp.
- Copy for errors in Thai as §2.

## 7. Decision Points (Field Guard)
- **Pre-decided:** DR-016 A + session decisions (Field 2026-10-31) · scrypt from `node:crypto` (no dependency) · PIN unique among active staff · lock 5 tries / 5 min · reasons list from CD-02 · comp exposed as `comp` (void keeps `cancellation`) so existing clients don't strike comped lines.
- **Likely DRs:** a totals path that can't be switched to `cancel_kind` without changing a report's meaning → stop, tell Field.

## 8. Unlocked Protected Files
- `none` (schema docs edited by Cowork in the seed, Field-approved)

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates and evidence; dependency = schema docs edit in the seed
- [x] No unresolved decision blocking the main outcome (DR-016 Approved)
- [x] Field explicitly approved this revision (2026-10-31, in session)

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-31 | Initial Draft (Cowork) — from DR-016 (drafted 17 Oct, approved 31 Oct with session decisions) |
| 1 | 2026-10-31 | Ready — Rev 1 approved by Field in session ("approve BRIEF-018 Rev 1, BRIEF-066 Rev 1, DR-016, schema docs edit") |
