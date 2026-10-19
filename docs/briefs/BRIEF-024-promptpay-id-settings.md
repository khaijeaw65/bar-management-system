# BRIEF-024 — Backend: venue PromptPay ID management

| | |
|---|---|
| **Status** | Draft |
| **Implementer** | kj (executor agent — Cursor) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | backend · contracts |
| **Revision** | 1 |
| **Depends on** | **BRIEF-016 merged ✅ PR #49** (`venue` row, `VenueSettingsService`). Independent of BRIEF-013; both needed for the 8 Nov demo. |
| **References** | FRD §7 (own PromptPay mode) · `docs/schema.sql` (`venue.promptpay_id`, `promptpay_id_type`, `payment_mode`) · BRIEF-016 Q2 (ID never in `GET /venue`) + audit S2 · BRIEF-013 Q5 · CD-12 / CD-13 (back-office, later screen) |
| **Audit depth** | Full (payment destination — changing it redirects money) |
| **Size** | ~1 day |

---

## 1. Goal
The owner can set and change the venue's PromptPay ID (the account every QR pays into) through the API; staff see only a masked value; every change is audited. Replaces "put it in an env var".

## 2. Scope
### In
- `GET /venue/payment-settings` → `{ paymentMode, promptpayIdType, promptpayIdMasked }` (e.g. `XXX-XXX-5678`; `null` when not set). The full ID is never returned.
- `PATCH /venue/payment-settings` `{ promptpayId, promptpayIdType }` → same shape.
  - Validation: `mobile` = 10 digits starting `0`; `national_id` = 13 digits with a valid check digit; `ewallet` = 15 digits. Input may contain spaces or dashes, stored digits only.
  - Writes an `audit_log` row (entity `venue`, action `UPDATE`, `changed_fields.promptpay_id` = **masked** from/to, `changed_by` = staff). If the global `AuditSubscriber` already writes venue updates, it masks `promptpay_id` there — the full ID must never land in `audit_log`.
  - While the venue has any `pending` payment → 409 `PAYMENT_IN_FLIGHT` (open QRs carry the old ID) — only once BRIEF-013 has merged; before that, no check.
- `seed:venue` (BRIEF-016 audit S2): settings set on insert only, a re-run never overwrites edited settings. No PromptPay env key.
- Contracts, OpenAPI, `docs/api/README.md` Venue table.

### Out (do NOT build here)
- Web settings screen (back-office CD-12 / CD-13 era — Metee brief) · `payment_mode = gateway` switching (BRIEF-026) · re-auth / PIN before the change (see Q2).

## 3. Contract
| Method | Path | Request → Response | Permission |
|---|---|---|---|
| GET | `/venue/payment-settings` | → `VenuePaymentSettings` | `venue:read_payment` |
| PATCH | `/venue/payment-settings` | `{ promptpayId, promptpayIdType }` → `VenuePaymentSettings` | `venue:update_payment` |
- **Business rules:** ID never logged or returned in full → BRIEF-016 Q2 · audited change → this brief Q1 · no change while a QR is open → this brief Q3.

## 4. Acceptance Criteria
- **AC-1** — PATCH with a valid mobile number → stored digits only; GET shows `XXX-XXX-5678`; `GET /venue` still has no payment fields.
- **AC-2** — Invalid format / bad national-ID check digit / type mismatch → 400.
- **AC-3** — Each change writes exactly one `audit_log` row with masked from/to; the full ID appears in no `audit_log` row and no log line (test greps both).
- **AC-4** — With a pending payment (after BRIEF-013) → 409 `PAYMENT_IN_FLIGHT`.
- **AC-5** — `seed:venue` re-run keeps an edited ID and settings.
- **AC-6** — Gates + run proof pass.

## 5. Test Gate
e2e `test/venue-payment-settings.e2e-spec.ts` · unit `promptpay-id.spec.ts` (validation + mask). Gate commands and run proof as BRIEF-013 §5. Local Sonar scan: **Required** (payment destination).

## 6. Constraints
Thai `message`, English `code`; `save()` on the audited entity; changes only through `VenueSettingsService`.

## 7. Decision Points (Field Guard)
- **Q1 — Audit trail.** *Cowork recommends:* `audit_log` row with masked values (changing the payout account is the top fraud path for a bar). *Alternative:* `updated_by` only.
- **Q2 — Extra protection on change.** *Cowork recommends:* none now — owner-only permission is enough for Phase 1; PIN re-auth arrives with BRIEF-018. *Alternative:* require the PIN flow here (depends on BRIEF-018).
- **Q3 — Order vs BRIEF-013.** *Cowork recommends:* build after BRIEF-013 so AC-4 is real. *Alternative:* build first and add the check in BRIEF-013.
- **Pre-decided:** none yet (permissions `venue:read_payment`, `venue:update_payment` once approved).

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates (incl. run proof) and evidence; dependencies have completion conditions
- [x] Size within workflow §2 (≤ ~3 working days, ~500 net-new lines); otherwise split
- [ ] No unresolved decision blocking the main outcome (Q1–Q3 open)
- [ ] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-19 | Initial Draft (Cowork) — from Field's BRIEF-013 Q5 decision "add PromptPay ID management" |
