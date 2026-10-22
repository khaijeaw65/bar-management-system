# BRIEF-035 — Venue settings: API + POS settings screen

| | |
|---|---|
| **Status** | Ready — Rev 1 approved by Field 2026-10-22 |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | backend · contracts · frontend |
| **Revision** | 1 |
| **Depends on** | BRIEF-024 ✅ (payment settings API, `AuditLogService`) · BRIEF-016 ✅ (`GET /venue`) · BRIEF-034 ✅ (POS shell) |
| **References** | CD-13 board `venue` (1 PromptPay ของร้าน · 2 Gateway · 3 saved) + §9 "Venue settings" + Q2 (owner only) · DR-013 · DR-014 #1 #4 #5 #6 · `docs/schema.sql` §1 `venue` |
| **Audit depth** | Full (payment destination + audited settings) |
| **Size** | ~1 day · est. ~450–550 net-new lines incl. tests |

---

## 1. Goal
The owner sets up the bar from the POS: name, business-day cut-off, kitchen screen, counter QR, and the PromptPay account every QR pays into — no database edits or seed scripts. Every change is audited.

## 2. Scope
### In
- **Backend — `PATCH /venue/settings`** (partial) `{ name?, businessDayCutoff?, kitchenDisplayEnabled?, counterQrEnabled? }` → `VenueSettings`, through `VenueSettingsService` only:
  - Validation: `name` 1–200 chars trimmed · `businessDayCutoff` `HH:MM` 00:00–23:59 · booleans. Empty body → 400 `VALIDATION_ERROR`.
  - One transaction: venue row `FOR UPDATE` → `save()` → one `AuditLogService.record` (entity `venue`, action `UPDATE`, `changed_fields` = only fields that changed, `{ from, to }`). Same values → 200, no audit row.
  - Changes apply to data created **afterwards** (new tickets, new order numbers, new reports) — no recompute of existing rows.
  - WS `venue.settings_changed` (room `staff`) with the new `VenueSettings` so every POS / board picks up kitchen mode without reload.
- **Contracts:** `UpdateVenueSettingsSchema`, `VenueSettingsChangedPayloadSchema`; OpenAPI; `docs/api/README.md` Venue table.
- **Frontend — `/pos/settings`** (rail "ตั้งค่า" gets `href`), CD-13 `venue` board, desktop / tablet (≥ 1024):
  - **ร้าน:** name (TextField).
  - **การชำระเงิน:** mode RadioGroup — "PromptPay ของร้าน" (selected) · "Gateway" disabled with "เร็วๆ นี้" (BRIEF-026) · PromptPay ID shown masked (`GET /venue/payment-settings`) + "เปลี่ยนบัญชี" → form (type Select มือถือ / เลขบัตรประชาชน / e-Wallet + ID field) → `PATCH /venue/payment-settings` (BRIEF-024: 409 `PAYMENT_IN_FLIGHT` → Alert "มี QR รอชำระอยู่ — ปิดหรือยกเลิกก่อนเปลี่ยนบัญชี").
  - **การทำงาน:** kitchen screen Switch (help text: off = ใบเดียวต่อออเดอร์, ไม่มีพร้อมเสิร์ฟ) · counter QR Switch (help: ปิด = พนักงานเปิดที่นั่งเคาน์เตอร์เอง) · cut-off TimeField (help: ใช้กับเลขออเดอร์ รายงาน และ "ถึงสิ้นกะคืนนี้").
  - Lock line "เฉพาะเจ้าของร้านแก้ไขได้" (CD-13 Q2; enforcement = IAM brief).
  - One "บันทึก" for ร้าน + การทำงาน (sends changed fields only) → Toast "บันทึกแล้ว" (venue·3); PromptPay change saves on its own form. Field errors from 400 shown under the field. Leave with unsaved changes → confirm dialog.
  - On `venue.settings_changed`: invalidate `['venue']` (board, tables, order entry already read it).
- States: loading skeleton · error + retry · saving (button pending) · saved Toast.
- MSW handlers for both PATCHes (200 / 400 / 409).

### Out (do NOT build here)
- Gateway mode switch + credentials (BRIEF-026) · owner-only enforcement / PIN before change (IAM brief, BRIEF-018) · shift close setting (`shift_close_enabled`, S2) · phone 390 layout (comes with the responsive shell in the menu UI brief) · tables & QR / staff / groups screens (CD-13 rest, after IAM).

## 3. Contract
| Method | Path | Request → Response | Permission |
|---|---|---|---|
| PATCH | `/venue/settings` | `UpdateVenueSettings` → `VenueSettings` | `venue:update` |
| GET / PATCH | `/venue/payment-settings` | unchanged (BRIEF-024) | `venue:read_payment` / `venue:update_payment` |
- **WS events:** `venue.settings_changed` `{ settings: VenueSettings, updatedAt }` (new).
- **Contracts changes:** 2 schemas above.
- **Permissions:** `venue:update` (declared; enforcement → IAM brief).
- **Business rules:**
  - Settings apply forward only → CD-13 §9 ("Changes apply to bills / QR created afterwards")
  - Every change audited, append-only → BRIEF-024 Q1 A
  - PromptPay ID never shown in full; no change while a QR is pending → BRIEF-024 Q3 A
  - Kitchen screen off mid-shift: existing tickets keep their station; `ready` tickets show under กำลังเตรียม (BRIEF-032 `columnOf`)

## 4. Acceptance Criteria
- **AC-1** — PATCH `{ kitchenDisplayEnabled: true }` → 200, `GET /venue` shows it, one audit row with only that field; same body again → 200, no new row.
- **AC-1b** — Cut-off changed from 06:00 to 05:00 at 23:00 → an order at 05:30 the same night still gets tonight's business date and continues tonight's numbering; from the next business day the 05:00 cut-off applies (unit test on `businessDate` with a fixed clock).
- **AC-2** — Invalid cut-off (`25:00`, `6:00`), empty name, empty body → 400 `VALIDATION_ERROR` with field paths.
- **AC-3** — A new order after switching the kitchen screen on gets split bar / food tickets; tickets created before keep theirs (e2e or integration).
- **AC-4** — `venue.settings_changed` is emitted once per real change; a second POS tab's orders board switches to 4 columns without reload.
- **AC-5** — Settings screen: edit name + cut-off → one PATCH with only those fields → Toast; 400 → field error; leave-with-changes dialog.
- **AC-6** — PromptPay: masked ID shown; change with a valid mobile number → masked value updates; with a pending QR → the 409 Alert, value unchanged.
- **AC-7** — Gateway option visible but disabled with "เร็วๆ นี้".
- **AC-8** — Gates + run proof pass; OpenAPI + `openapi:check`; README updated.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1, AC-2, AC-4 | integration | `app/backend/test/venue-settings.e2e-spec.ts` (or the module's existing e2e file) |
| AC-3 | integration | order creation spec with kitchen toggled |
| AC-5, AC-6, AC-7 | component | `app/frontend/src/app/pos/settings/_components/*.test.tsx` (MSW) |
| AC-5 | e2e | `app/frontend/e2e/settings.spec.ts` (MSW) |

Gate commands (all must pass):
```bash
pnpm --filter @bar/contracts build
pnpm --filter @bar/backend lint && pnpm --filter @bar/backend typecheck && pnpm --filter @bar/backend test && pnpm --filter @bar/backend test:e2e
pnpm --filter @bar/backend openapi:check
pnpm --filter @bar/frontend lint && pnpm --filter @bar/frontend typecheck && pnpm --filter @bar/frontend test && pnpm --filter @bar/frontend test:e2e && pnpm --filter @bar/frontend build
```
Run proof (real API, BRIEF-028 setup): open `/pos/settings` → turn the kitchen screen on → tab 2 `/pos/orders` shows 4 columns without reload → change cut-off → change PromptPay ID to the test value → create a QR on a table → try changing the ID again → 409 Alert. Screenshots in the handoff; `audit_log` rows (masked) pasted.

### Local Sonar scan
- **Required for this brief: yes.** Same procedure as BRIEF-032.

## 6. Constraints
- Backend: `save()` on audited entities; no inline permission checks; full PromptPay ID never logged.
- Frontend: `frontend.md` Hard Limits; tokens only; HeroUI v3 components directly where the DS has no wrapper (CD-12 R8).
- No new packages.

## 7. Decision Points (Field Guard)
- **Pre-decided (Field 22 Oct, session):** full venue settings this weekend (name, cut-off, kitchen screen, counter QR + PromptPay ID UI) · forward-only apply · new WS event `venue.settings_changed` · route `/pos/settings` · no new packages.
- **Q1 — Cut-off change mid business day. ✅ Decided (Field, 2026-10-22): A — saved now, applies from the next business day.** Implementation: store `business_day_cutoff` immediately; `businessDate()` for the **current** business day keeps using the cut-off in force when that day started (e.g. keep the previous value + its effective business date in memory/settings read — executor's choice, no schema change; if a column is truly needed → stop and raise a DR). AC-1b covers it. Order numbers restart at the cut-off; moving it while bars are open could restart or skip numbering tonight. *Cowork recommends:* **A — allow, applies from the next business day** (store it now; order numbering / reports read the new value only after the current business day ends). *Alternative:* **B — apply immediately** (simplest; numbering may jump once). *Alternative:* **C — block while any visit is open** (409 `VENUE_IN_SERVICE`).
- **Likely DRs:** none.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates (incl. run proof) and evidence; dependencies have completion conditions
- [x] Size within workflow §2
- [x] No unresolved decision blocking the main outcome
- [x] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-22 | Initial Draft (Cowork) — owner side S5 #1; Field: full venue settings, weekend push |
| 1 | 2026-10-22 | Ready — Field in session: "035 Q1 = A, approve BRIEF-035 Rev 1 Ready" (+ AC-1b for Q1) |
