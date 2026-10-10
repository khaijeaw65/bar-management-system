# BRIEF-011 — Backend: tables + visits (open / attach / close) + realtime foundation

| | |
|---|---|
| **Status** | Ready — Q1, Q2 decided + approved by Field 2026-10-04 |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **PR** | <executor fills> |
| **Affected apps** | backend · contracts |
| **Revision** | 1 |
| **Depends on** | **BRIEF-009 merged** (contracts enums, envelope `code`, OpenAPI helper) · **BRIEF-007 merged** (JwtAuthGuard, `{ sub, sid }`, Redis provider) |
| **References** | FRD §3 · `docs/schema.sql` (`table_seat`, `visit`, `visit_state`, `table_seat_kind`) · `docs/api/README.md` (Tables & visits, Realtime, D1 codes) · `docs/design/CD-02-handoff.md` (grid summary, open-table, close, QR regenerate) · DR-009 (POS = fixed station) · `docs/rules/backend.md` |
| **Audit depth** | Full (core flow, concurrency) |
| **Size** | ~2.5 days (Week 2) |

---

## 1. Goal
The POS can list all seats with their live visit, open a table (first write wins, a second open attaches), close it, regenerate a table QR, and receive `visit.*` events over socket.io. Orders (BRIEF-012) and payments (BRIEF-013) build on this.

## 2. Scope
### In
- **Migrations:** `table_seat`, `visit` exactly as `schema.sql` + Q1 + Q3 additions. Entities: `TableSeat` extends `BaseEntity`; `Visit` has **no audit columns** in schema → does not extend `BaseEntity` (same rule as BRIEF-007 identity tables).
- **Seed** `seed:venue` (idempotent): counter seats `C1`–`C8` (`kind=counter`), tables `T1`–`T6` (`kind=table`), `sort_order` by label, each with a QR token (Q1). Gate demo uses seeded seats — no seat CRUD here.
- **Module** (Q2): `modules/venue/` — `TableSeat` + `Visit` (domain ports, services, TypeORM adapters, controllers). `VisitService` owns **all** visit transitions (backend.md invariant) and is exported for BRIEF-012/013.
- **Endpoints** (`/api` prefix, envelope, OpenAPI via BRIEF-009 helper):
  | Method | Path | Behaviour | Permission |
  |---|---|---|---|
  | GET | `/tables` | active seats sorted by `kind` then `sort_order`, each with `currentVisit` (`id`, `state`, `openedAt`, `guestLabel`, `total: '0.00'`, `itemCount: 0`, `staffCalled: false`) or `null` | `tables:read` |
  | POST | `/tables/:id/qr/regenerate` | new token, old token invalid → `{ qrToken }` | `tables:manage` |
  | POST | `/visits` | `{ tableSeatId, guestLabel? }` → creates `open` visit; if a live visit exists → **200 with that visit + `attached: true`** (not an error); `201 attached: false` otherwise. Body may carry `via: 'pos' | 'app'` (default `pos`). Response visit includes `openedBy: { staffId, displayName } | null` and `openedVia` (Q3) so the losing client can show who opened it. `Idempotency-Key` not required (attach makes it idempotent) | `visits:open` |
  | GET | `/visits/:id` | header: seat label/kind, state, openedAt, closedAt, guestLabel (orders/payments added by 012/013) | `visits:read` |
  | POST | `/visits/:id/close` | `open|active|idle → closed` (`closed_at = now`); already `closed|abandoned` → `409 INVALID_STATE_TRANSITION`. Payment-in-flight check added by BRIEF-013 | `visits:close` |
- **Concurrency:** open race resolved by the DB (Q1 partial unique index): insert → on unique violation re-read the live visit and return it as attached. No app-level locks.
- **Realtime foundation** (`modules/notifications/`, infra-only per backend.md): `NotificationsGateway` on namespace `/staff`, handshake auth = same JWT + `session:<sid>` check as HTTP (BRIEF-007); room `pos`; `@socket.io/redis-adapter` on the Redis provider. `NotificationsService.emitToPos(event, payload)` — the only API domain modules use.
- **Events** (contracts `src/events/visit.ts`): `visit.opened` (payload = table summary of that seat) after open (not on attach) · `visit.state_changed` (`{ visitId, tableSeatId, state }`) after close.
- **Contracts:** `TableSummarySchema`, `TableListSchema`, `VisitSchema`, `OpenVisitRequestSchema`, `OpenVisitResponseSchema` (`visit` + `attached`), `RegenerateQrResponseSchema`, event schemas; error code `INVALID_STATE_TRANSITION` added to `ErrorCodeSchema`.
- `@RequirePermissions(...)` on every endpoint (metadata now; enforcement arrives with the IAM brief — see §7).

### Out (do NOT build here)
- Orders, totals, item counts (BRIEF-012 fills `total`/`itemCount` and moves `open → active` on first order) · payments + `409 PAYMENT_IN_FLIGHT` (BRIEF-013).
- Idle detection / auto-close / `abandoned` (scheduler — after gate) · call-staff + `staffCalled` (customer QR brief) · public QR resolve `GET /public/qr/:token`, customer join (customer QR brief).
- Seat CRUD / back-office tables screen (CD-12 era) · rooms `bar-display` / `kitchen-display` · Expo push.
- IAM groups/policies/`PermissionsGuard` enforcement.

## 3. Contract
- Money as string `"0.00"` (contracts money schema from BRIEF-009). Timestamps ISO strings. IDs UUID.
- `TableSummary`: `{ id, label, kind, sortOrder, currentVisit: { id, state, openedAt, guestLabel, total, itemCount, staffCalled } | null }`.
- WS: client connects `io('/staff', { auth: { token } })` (web may rely on the cookie — gateway reads cookie then `auth.token`, same order as HTTP).
- **OpenAPI:** all endpoints in `docs/api/openapi.json` (regenerated, committed).

## 4. Acceptance Criteria
- **AC-1** — `seed:venue` twice → 14 seats, no duplicates, every seat has a unique QR token.
- **AC-2** — `GET /tables` returns counters then tables in `sort_order`, `currentVisit` null for free seats and filled for live visits.
- **AC-3** — `POST /visits` on a free seat → 201, `attached: false`, state `open`, `visit.opened` emitted to room `pos`.
- **AC-4** — Two concurrent `POST /visits` on the same free seat (Promise.all, e2e) → exactly one visit row; one response `attached: false`, the other `attached: true` with the same id; exactly one `visit.opened` event. The attached response carries `openedBy` (the first caller's staff id + display name) and `openedVia` of the first call (Q3).
- **AC-5** — `POST /visits/:id/close` on open/active/idle → `closed`, `closed_at` set, `visit.state_changed` emitted; seat shows `currentVisit: null`; closing again → 409 `INVALID_STATE_TRANSITION`. A closed visit is never reopened; a new open creates a new visit.
- **AC-6** — `POST /tables/:id/qr/regenerate` → new token returned and stored; the old token no longer matches any seat.
- **AC-7** — Socket connect without a valid token, or with a token whose `session:<sid>` was revoked → connection refused.
- **AC-8** — Unknown seat/visit id → 404 `NOT_FOUND`; invalid body → 400 `VALIDATION_ERROR` (envelope `code` set).
- **AC-9** — OpenAPI lists the 5 endpoints with permission in the description; `openapi:check` passes.
- **AC-10** — lint / typecheck / test / test:e2e / build exit 0; contracts tests pass.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1 | e2e | `test/venue-seed.e2e-spec.ts` |
| AC-2, AC-3, AC-5, AC-6, AC-8 | e2e | `test/venue.e2e-spec.ts` (real Postgres + Redis) |
| AC-4 | e2e (concurrency) | `test/venue.e2e-spec.ts` → `describe('open race')` |
| AC-5 (transitions) | unit | `src/modules/venue/application/visit.service.spec.ts` |
| AC-7 | e2e | `test/notifications.e2e-spec.ts` (socket.io-client) |
| AC-9 | command | `openapi:check` |

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
A required script that doesn't exist yet = **BLOCKED** — report it, never skip silently.

### Local Sonar scan
- Optional — Field's brief; run if time allows.

## 6. Constraints
- Hexagonal module layout, ports + tokens, Zod DTOs, `save()` not `update()`, `@Transactional()` for multi-repo writes (backend.md).
- Domain modules inject `NotificationsService`, never the gateway. Events emitted **after commit**.
- No business rule in controllers; state transitions only in `VisitService`.
- Thai user-facing `message` strings in errors (e.g. "สถานะโต๊ะไม่ถูกต้อง"), English `code`.

## 7. Decision Points (Field Guard)
- **Q1 — Schema additions. ✅ Decided (Field, 2026-10-04): all three** (applied to `schema.sql`):
  1. `CREATE UNIQUE INDEX uq_visit_live_per_seat ON visit(table_seat_id) WHERE state IN ('open','active','idle');` — makes "first write wins, second attaches" a DB guarantee (FRD §3 concurrency) instead of app locking.
  2. `table_seat.qr_code` → rename **`qr_token VARCHAR(64) UNIQUE`** holding an opaque random token (base64url, 32 bytes); regenerate = replace. *Why:* lookup by token, old token dies by replacement — no signing keys to manage. (QR image encodes `<customer web URL>/q/<token>`.)
  3. `visit.guest_label VARCHAR(100) NULL` — CD-02 open-table has "ชื่อแขก (ไม่บังคับ)" and the card shows a name before any order; today there is no column for it.
- **Q2 — Where visits live. ✅ Decided (Field, 2026-10-04): `modules/venue/`** (seat + its visits = one aggregate; `GET /tables` joins them; avoids a venue↔visit cycle). *Alternative:* new `modules/visit/` (cleaner name, one more module, cross-module call for the summary).
- **Pre-decided packages (exact major, verify with `pnpm view` before install; different major → stop, DR):** `@nestjs/websockets` + `@nestjs/platform-socket.io` `^12` (= `@nestjs/core` major) · `socket.io` `^4` · `@socket.io/redis-adapter` `^8` · dev `socket.io-client` `^4` (e2e).
- **Q3 — Who opened the visit. ✅ Decided (Field, 2026-10-10, from CD-14 R9):** add to `visit`: `opened_by UUID REFERENCES staff_user(id)` (nullable — a guest QR open has no staff) and `opened_via visit_open_source NOT NULL DEFAULT 'pos'` with `CREATE TYPE visit_open_source AS ENUM ('pos','app','qr');`. Staff route sets `opened_by` from the authenticated staff and `opened_via` from body `via` (informational, not a permission); the customer QR route (later brief) sets `qr`. *Why:* on a collision the staff app (CD-14 J2) and POS (CD-02) must ask before joining — the dialog shows opener, time and guest label, because a different group may be at that seat. `schema.sql` is protected → **Field applies Q3 by hand before execution.**
- **Known gap (not blocking):** no IAM brief yet → `@RequirePermissions` is metadata only; any authenticated staff can call these endpoints until the IAM brief lands. Acceptable for the gate (seeded staff only); IAM brief must land before any real-bar pilot.
- **Likely DRs:** socket.io cookie auth across ports in dev · TypeORM partial index syntax in migration.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates and evidence; dependencies have completion conditions
- [x] No unresolved decision blocking the main outcome (Q1, Q2 decided)
- [x] Field explicitly approved this revision (2026-10-04)

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-04 | Initial draft (Cowork) — split from "tables/visits/orders": orders → BRIEF-012, payment → BRIEF-013 |
| 1 | 2026-10-04 | Ready — Q1 (3 schema additions), Q2 (venue module) decided by Field |
