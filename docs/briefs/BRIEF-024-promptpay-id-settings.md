# BRIEF-024 — Backend: venue PromptPay ID management

| | |
|---|---|
| **Status** | Draft |
| **Implementer** | kj (executor agent — Cursor) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | backend · contracts |
| **Revision** | 2 |
| **Depends on** | **BRIEF-016 merged ✅ PR #49** (`venue` row, `VenueSettingsService`) · **BRIEF-013 merged (PR #64)** — payment table + module for AC-4 (Q3). Start: merge `main` into this branch (workflow Rev 21). |
| **References** | FRD §7 (own PromptPay mode) · `docs/schema.sql` (`venue.promptpay_id`, `promptpay_id_type`, `payment_mode`; §9 `audit_log`, `audit_action`) · `docs/rules/backend.md` (audit_log append-only, not a BaseEntity) · BRIEF-016 Q2 (ID never in `GET /venue`) + audit S2 · BRIEF-013 Q5 · CD-12 / CD-13 (back-office, later screen) |
| **Audit depth** | Full (payment destination — changing it redirects money) |
| **Size** | ~1 day · ~400 net-new lines incl. tests (first `audit_log` use adds the table + a small writer) |

---

## 1. Goal
The owner can set and change the venue's PromptPay ID (the account every QR pays into) through the API; staff see only a masked value; every change leaves an append-only audit row. Replaces "put it in an env var".

## 2. Scope
### In
- **Migration:** `audit_action` enum + `audit_log` table exactly as `schema.sql` §9 (first use — the table is in `schema.sql` but not yet migrated). No schema change.
- **Audit writer** `common/audit/` (or per `docs/rules/backend.md` src tree): `AuditLogService.record({ entity, entityId, action, changedFields })` — insert only, `changed_by` from CLS, runs inside the caller's transaction. No update/delete methods. Not wired into `AuditSubscriber` (that stays stamp-only).
- `GET /venue/payment-settings` → `{ paymentMode, promptpayIdType, promptpayIdMasked }` (e.g. `XXX-XXX-5678`; `null` when not set). The full ID is never returned.
- `PATCH /venue/payment-settings` `{ promptpayId, promptpayIdType }` → same shape, through `VenueSettingsService` only:
  - Validation: `mobile` = 10 digits starting `0`; `national_id` = 13 digits with a valid check digit; `ewallet` = 15 digits. Input may contain spaces or dashes; stored digits only.
  - One transaction: venue row locked → any `pending` payment in the venue → 409 `PAYMENT_IN_FLIGHT` (open QRs carry the old ID) → `save()` → `AuditLogService.record` with entity `venue`, action `UPDATE`, `changed_fields = { promptpay_id: { from: <masked>, to: <masked> }, promptpay_id_type: { from, to } }`.
  - Same value as stored → 200, no audit row.
- `PaymentGuard` gains `assertNoPaymentInFlightForVenue()` (venue-wide pending check) — the only change to the payment module.
- `seed:venue` (BRIEF-016 audit S2): settings set on insert only; a re-run never overwrites edited settings. No PromptPay env key.
- Contracts (`VenuePaymentSettingsSchema`, `UpdateVenuePaymentSettingsSchema`), OpenAPI, `docs/api/README.md` Venue table.

### Out (do NOT build here)
- Web settings screen (back-office CD-12 / CD-13 era — Metee brief) · `payment_mode = gateway` switching (BRIEF-026) · PIN / re-auth before the change (Q2 → BRIEF-018 follow-up) · owner-only enforcement (`PermissionsGuard` = IAM brief) · auditing any other entity · an audit-log read API.

## 3. Contract
| Method | Path | Request → Response | Permission |
|---|---|---|---|
| GET | `/venue/payment-settings` | → `VenuePaymentSettings` | `venue:read_payment` |
| PATCH | `/venue/payment-settings` | `{ promptpayId, promptpayIdType }` → `VenuePaymentSettings` | `venue:update_payment` |
- **WS events:** none.
- **Contracts changes:** 2 schemas above; `PromptpayIdType` reused; no new error codes (`PAYMENT_IN_FLIGHT`, `VALIDATION_ERROR` exist).
- **Permissions:** `venue:read_payment`, `venue:update_payment` (declared; enforcement → IAM brief).
- **Business rules:**
  - ID never logged or returned in full → BRIEF-016 Q2
  - Every change audited with masked values; `audit_log` append-only → Field Q1 A (2026-10-19) · `docs/rules/backend.md`
  - No PIN in Phase 1; owner-only + PIN before a real-bar pilot → Field Q2 A (2026-10-19)
  - No change while a QR is pending → Field Q3 A (2026-10-19)
- **OpenAPI:** both endpoints.

## 4. Acceptance Criteria
- **AC-1** — PATCH with a valid mobile number (`081-234-5678`) → stored `0812345678`; GET shows `XXX-XXX-5678`; `GET /venue` still has no payment fields.
- **AC-2** — Invalid format / bad national-ID check digit / type mismatch → 400 `VALIDATION_ERROR`.
- **AC-3** — Each real change writes exactly one `audit_log` row (entity `venue`, action `UPDATE`, masked from/to, `changed_by` = staff); same value → no row; the full ID appears in no `audit_log` row and no captured log line.
- **AC-4** — With a pending payment on any visit → 409 `PAYMENT_IN_FLIGHT`, ID unchanged, no audit row; after the payment settles → PATCH succeeds.
- **AC-5** — `seed:venue` re-run keeps an edited ID and edited settings.
- **AC-6** — A BRIEF-013 `promptpay` payment created after a PATCH carries the new ID in its EMVCo payload (e2e).
- **AC-7** — Gates + run proof pass; OpenAPI + `openapi:check`; README updated.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1, AC-3, AC-4, AC-6 | e2e | `test/venue-payment-settings.e2e-spec.ts` (real Postgres + Redis) |
| AC-2 | unit | `src/modules/venue/application/promptpay-id.spec.ts` (validation + mask) |
| AC-5 | e2e | `test/venue-payment-settings.e2e-spec.ts` → `describe('seed')` |

Gate commands (all must pass):
```bash
pnpm --filter @bar/contracts test
pnpm --filter @bar/backend lint
pnpm --filter @bar/backend typecheck
pnpm --filter @bar/backend test
pnpm --filter @bar/backend test:e2e
pnpm --filter @bar/backend build
pnpm --filter @bar/backend openapi:check
```
Run proof (backend change):
```bash
docker compose -f infra/docker-compose.yml up -d postgres redis
pnpm --filter @bar/backend migration:run
pnpm --filter @bar/backend start:dev   # separate shell, started on the work SHA
curl -fsS localhost:3001/api/health
```
Plus: on that server, PATCH a test ID and show the `audit_log` row. UI change: n/a.

A required script that doesn't exist yet = **BLOCKED** — report it, never skip silently.

### Local Sonar scan
- **Required** — payment destination (n/a until BRIEF-006 merges; state so in the handoff).

## 6. Constraints
- Thai `message`, English `code`; `save()` on the audited entity; changes only through `VenueSettingsService`.
- `audit_log`: insert only — no UPDATE / DELETE anywhere, no `BaseEntity`.
- The full PromptPay ID never in logs, errors, `audit_log`, or any response.

## 7. Decision Points (Field Guard)
- **Q1 — Audit trail. ✅ Decided (Field, 2026-10-19): A** — `audit_log` row with masked values. Found while writing Rev 2: `audit_log` is in `schema.sql` but not migrated, and `AuditSubscriber` only stamps `created_by` / `updated_by`. So this brief adds the table (exactly `schema.sql` §9) and a small insert-only writer; the full-ID-in-subscriber risk from Rev 1 does not exist.
- **Q2 — Extra protection on change. ✅ Decided (Field, 2026-10-19): A** — none now; permission + audit trail only. Follow-up: IAM brief makes `venue:update_payment` owner-only; BRIEF-018 adds PIN to this action — both before a real-bar pilot.
- **Q3 — Order vs BRIEF-013. ✅ Decided (Field, 2026-10-19): A** — after BRIEF-013 (#64), so AC-4 runs against real payments.
- **Pre-decided:** permissions `venue:read_payment`, `venue:update_payment` · no new packages · `audit_log` + `audit_action` migration exactly as `schema.sql` §9 · `AuditLogService` insert-only · mask format `XXX-XXX-` + last 4 digits for every ID type · same-value PATCH = no audit row.
- **Likely DRs:** none.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates (incl. run proof) and evidence; dependencies have completion conditions
- [x] Size within workflow §2 (≤ ~3 working days, ~500 net-new lines); otherwise split
- [x] No unresolved decision blocking the main outcome (Q1–Q3 decided)
- [ ] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-19 | Initial Draft (Cowork) — from Field's BRIEF-013 Q5 decision "add PromptPay ID management" |
| 2 | 2026-10-19 | Field in session: Q1 A, Q2 A, Q3 A — recorded by Cowork on Field's explicit instruction. Q1 scope: `audit_log` table is not migrated yet → migration + insert-only writer added; AC-6 (new ID reaches the QR) added; Workflow Rev 20 template sections |
