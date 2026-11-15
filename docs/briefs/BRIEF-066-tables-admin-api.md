# BRIEF-066 — Backend: set up seats (add, edit, order, retire) for the back office

| | |
|---|---|
| **Status** | Ready — Rev 1 approved by Field 2026-10-31 (in session) |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **PR** | <executor fills> |
| **Affected apps** | backend, contracts |
| **Revision** | 1 |
| **Depends on** | none (BRIEF-011 seats + BRIEF-047 QR session merged) |
| **References** | `docs/design/CD-13-handoff.md` (tables·1–10, print·1–3, R5) · DR-009 (back office: tables/seats setup S1) · BRIEF-011 (`table_seat`, QR regenerate) · BRIEF-047 / DR-028 (inactive seat → QR stops) · `common/audit` |
| **Audit depth** | Full (QR access for guests) |
| **Size** | ~½ day · ~500 lines incl. tests |

---

## 1. Goal
The owner sets up the bar's real seats — add T7, rename C3, put counter seats in order, retire a broken table — and gets each seat's QR to print, without touching the database. Retired seats stop working for guests immediately.

## 2. Scope
### In (all `tables:manage`)
- `GET /tables/manage` → every seat incl. inactive: `{ id, label, kind, sortOrder, isActive, qrToken, hasLiveVisit }`, sections by `kind`, `sortOrder`. (`GET /tables` for the POS grid is unchanged — active only, no token.)
- `POST /tables { label, kind }` → new seat at the end of its section (`sortOrder = max + 1`), fresh opaque `qr_token` (same generator as regenerate).
- `PATCH /tables/:id { label?, kind? }` — rename / move section (moving → end of the new section).
- `PUT /tables/order { kind, ids: [] }` — full order for one section; ids must be exactly that section's seats (else 400).
- `POST /tables/:id/deactivate` — blocked while a live visit exists → `409 SEAT_IN_USE` "มีแขกอยู่ที่โต๊ะนี้ ปิดโต๊ะก่อน" (tables·7); deactivated → guest QR sessions for this seat fail at next use (DR-028 check already reads `is_active`), bell cleared.
- `POST /tables/:id/activate` — keeps the same `qr_token` (printed codes work again).
- Labels: trimmed, 1–20 chars; unique among **active** seats, case-insensitive → `409 SEAT_LABEL_TAKEN` "มีชื่อนี้แล้ว" (tables·5).
- One `audit_log` row per create / update / reorder / (de)activate (`entity='table_seat'`).
- Event `tables.changed` (no payload body beyond `{ seatIds }`) to the staff namespace → POS grid and staff app refetch.
### Out
- Back-office tables UI + QR print layout (KJ's web brief after this) · hard delete (seats have history) · per-seat capacity / floor map.

## 3. Contract
| Call | Permission | Body / returns |
|---|---|---|
| `GET /tables/manage` | `tables:manage` | `SeatAdminList { items: SeatAdmin[] }` |
| `POST /tables` | `tables:manage` | `CreateSeatRequest { label, kind }` → `SeatAdmin` |
| `PATCH /tables/:id` | `tables:manage` | `UpdateSeatRequest { label?, kind? }` → `SeatAdmin` |
| `PUT /tables/order` | `tables:manage` | `ReorderSeatsRequest { kind, ids }` → `SeatAdminList` |
| `POST /tables/:id/deactivate` · `/activate` | `tables:manage` | → `SeatAdmin` · 409 `SEAT_IN_USE` |
- **Contracts:** the schemas above, error codes `SEAT_IN_USE`, `SEAT_LABEL_TAKEN`, event `TABLES_CHANGED = 'tables.changed'` + payload. **Schema:** none (`table_seat.is_active` exists); a partial unique index `uq_table_seat_label_active ON table_seat (lower(trim(label))) WHERE is_active` via migration + schema docs edit in the seed.

## 4. Acceptance Criteria
- **AC-1** — `POST /tables { 'T7', 'table' }` → seat last in โต๊ะ, 43+-char opaque token, appears in `GET /tables` and `/tables/manage`; one audit row; `tables.changed` emitted.
- **AC-2** — Duplicate label (`' t7 '` vs `T7`) among active seats → 409 `SEAT_LABEL_TAKEN`; the same label as an **inactive** seat → allowed.
- **AC-3** — `PUT /tables/order` with the section's ids reordered → `sortOrder` 0..n-1 in that order; missing / extra / other-section id → 400, nothing changed.
- **AC-4** — Deactivate a seat with a live visit → 409 `SEAT_IN_USE`; without → `isActive false`, gone from `GET /tables`, its QR `POST /customer/sessions` → the existing "QR ใช้ไม่ได้" error; an open guest session on it is refused at its next call.
- **AC-5** — Activate → back in `GET /tables` with the **same** `qrToken`; the printed QR starts a session again.
- **AC-6** — Without `tables:manage` → 403 on every route; `GET /tables` (tables:read) never exposes `qrToken`.
- **AC-7** — Gates pass; migration up/down clean.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1–AC-6 | backend e2e | `app/backend/test/tables-admin.e2e-spec.ts` |
| AC-7 | command | gates + migration run / revert |

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
- Controller → service → repository; deactivate checks the live visit inside the same transaction (no race with open-table).
- QR token generator shared with regenerate (one function).

## 7. Decision Points (Field Guard)
- **Pre-decided:** activate keeps the token · label unique among active seats only · reorder per section with a full id list · `tables.changed` event · no new dependency.
- **Likely DRs:** none.

## 8. Unlocked Protected Files
- `none` (index added to schema docs by Cowork in the seed, Field-approved)

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates and evidence; no blocking dependency
- [x] No unresolved decision blocking the main outcome
- [x] Field explicitly approved this revision (2026-10-31, in session)

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-31 | Initial Draft (Cowork) — Phase A backend (Field's plan 31 Oct) |
| 1 | 2026-10-31 | Ready — Rev 1 approved by Field in session ("approve BRIEF-018 Rev 1, BRIEF-066 Rev 1, DR-016, schema docs edit") |
