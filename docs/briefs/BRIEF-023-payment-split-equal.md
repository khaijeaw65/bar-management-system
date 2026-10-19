# BRIEF-023 — Backend: split-equal checkout + charge-line assignment

| | |
|---|---|
| **Status** | Draft |
| **Implementer** | kj (executor agent — Cursor) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | backend · contracts |
| **Revision** | 1 |
| **Depends on** | **BRIEF-013 merged** (payment module, `mode` field, `payment_charge_item` table, lock, expiry job) |
| **References** | FRD §7 (split) · CD-03 Q2, §9 rules · `docs/schema.sql` §7 (`payment`, `payment_charge_item`) · BRIEF-013 Q2, Q6 |
| **Audit depth** | Full (money) |
| **Size** | ~1 day · well under 500 net-new lines |

---

## 1. Goal
The cashier can split a table's bill equally into 2–10 parts, each its own PromptPay QR, with each charge line (e.g. ค่าเปิดขวด) carried by exactly one part.

## 2. Scope
### In
- `POST /visits/:visitId/payments` accepts `mode: 'split_equal'`, `parts: 2–10`, `chargeAssignments?: [{ orderItemId, part }]`.
- Split math: non-charge total split `floor(x×100/n)/100` per part, last part takes the remainder (integer satang); each charge line added to its assigned part, default part 1 (CD-03 Q2, §9). Writes `payment_charge_item`.
- `promptpay` only: every part `pending`, own QR + own expiry job (BRIEF-013 mechanism). `cash` + `split_equal` → 400; a part can still be settled by mark-paid `{ via: cash }`.
- Bill / `payments[]` show parts 1/n; lock holds while **any** part is pending.
- Contracts, OpenAPI, `docs/api/README.md` update.

### Out (do NOT build here)
- Split by item / custom amounts · per-part receipts (later) · any change to BRIEF-013 behaviour for `merge`.

## 3. Contract
- **Endpoints:** `POST /visits/:visitId/payments` — `{ method: 'promptpay', mode: 'split_equal', parts, chargeAssignments? }` → 201 `PaymentAttempt` (n parts).
- **Contracts changes:** `CreatePaymentSchema` gains the `split_equal` branch.
- **Permissions:** `payments:create`.
- **Business rules:** split rounding + charge default part 1 → CD-03 Q2 / §9 · split = PromptPay only → Field Q6 (2026-10-19).
- **OpenAPI:** changed create endpoint.

## 4. Acceptance Criteria
- **AC-1** — ฿1,240.00 non-charge + ค่าเปิดขวด ฿300.00 assigned to part 2, n=3 → parts ฿413.33 / ฿713.33 / ฿413.34 (sum ฿1,540.00); `payment_charge_item` row on part 2.
- **AC-2** — Unassigned charge → part 1; n outside 2–10 → 400; assignment to a part > n or a non-charge line → 400.
- **AC-3** — `cash` + `split_equal` → 400; mark-paid `{ via: cash }` settles one part; the visit stays locked until no part is pending.
- **AC-4** — Each part has its own expiry job; one part expiring does not touch the others.
- **AC-5** — Gates + run proof pass.

## 5. Test Gate
Unit `src/modules/payment/application/split.spec.ts` (AC-1, AC-2 math) · e2e `test/payment.e2e-spec.ts` → `describe('split')`. Gate commands and run proof as BRIEF-013 §5. Local Sonar scan: **Required** (money).

## 6. Constraints
Same as BRIEF-013 §6.

## 7. Decision Points (Field Guard)
- **Q1 — Charge lines added after the split attempt.** *Cowork recommends:* they are outside the lock and stay due (same rule as new orders, BRIEF-013). *Alternative:* block new charge lines while a split is pending.
- **Pre-decided:** none yet.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates (incl. run proof) and evidence; dependencies have completion conditions
- [x] Size within workflow §2 (≤ ~3 working days, ~500 net-new lines); otherwise split
- [ ] No unresolved decision blocking the main outcome (Q1 open)
- [ ] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-19 | Initial Draft (Cowork) — split out of BRIEF-013 Rev 2 on Field's Q6 decision |
