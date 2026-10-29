# BRIEF-047 — Backend: customer QR session + customer menu (C1)

| | |
|---|---|
| **Status** | Ready — Rev 1 approved by Field 2026-10-29 |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | backend · contracts |
| **Revision** | 1 |
| **Depends on** | BRIEF-011 ✅ (table seats, `qr_token`, visits) · BRIEF-016 ✅ / 038 ✅ / 039 ✅ / 044 ✅ (menu read, photos, modifier groups) · BRIEF-043 ✅ (`updated_at` trigger, DR-023) · **DR-028 Approved** (rides in this seed) |
| **References** | DR-028 (guest QR session) · CD-06 handoff §4 Action table (scan, load menu), §9 rules, R3/R4 · FRD §3 (QR, shared session), §9 (promo windows) · DR-009 (customer surface) · DR-010 / DR-014 #10 (promo shown as-is) · DR-020 (presigned photo URL) · DR-021 (error shape) · `docs/api/README.md` |
| **Audit depth** | Full (auth — new guest session) |
| **Size** | ~1 day · est. ~600–750 net-new lines incl. tests |

---

## Interview — Selected (by KJ), 2026-10-29
| Q | Selected (by KJ) |
|---|---|
| Session model | DR-028 A — opaque token, `guest_session` row in Postgres, Redis for throttles only |
| Route prefix | `/customer` (was `/public` in CD-06; DR-028 amended) |
| Code home | New `CustomerModule` |
| Cleanup of never-ordered sessions | Lazy delete on scan (no BullMQ job) |
| Menu response | Slim customer schemas in contracts (no POS-only fields) |
| Nickname endpoint | In this brief (C1) |
| *(proposed)* Menu in one call | `GET /customer/menu` → `{ categories, items }` (CD-06 "Load menu" is one call) |
| *(proposed)* Session read | `GET /customer/session` so a page reload restores seat + nickname without rescanning |

## 1. Goal
A guest scans a table QR and gets a guest session on that phone (HttpOnly cookie, no login), can set a nickname, and can load the customer menu. Ordering, the running tab and call-staff come in C2 (BRIEF-048).

## 2. Scope
### In
- **Schema (migration):** `guest_session (id UUID PK, token_hash CHAR(64) UNIQUE NOT NULL, table_seat_id UUID NOT NULL FK table_seat, visit_id UUID NULL FK visit, display_name VARCHAR(30) NULL, expires_at TIMESTAMPTZ NOT NULL, created_at, updated_at)` + `trg_guest_session_updated_at` (DR-023) + index `(table_seat_id)`, `(expires_at) WHERE visit_id IS NULL`. Update `docs/schema.sql` + ERD note. *(`order_record.guest_session_id` is added in BRIEF-048 with the order write.)*
- **`modules/customer` (new `CustomerModule`):**
  - `GuestSessionService` + repository port (DB only): `start(qrToken)`, `resolve(rawToken)`, `rename(id, displayName)`, `purgeExpired(limit)`.
  - `GuestSessionGuard`: reads cookie `guest_session` → SHA-256 → lookup joined with seat + visit → attaches `request.guestSession`. Rejects (401 `GUEST_SESSION_INVALID`) when missing, unknown, expired (seat-only), seat inactive, or bound visit not live. Seat-only session that passes → `expires_at = now() + 2 h` (sliding, DR-028).
  - Controllers: `CustomerSessionController`, `CustomerMenuController` — all routes `@Public()` (skip the staff `JwtAuthGuard`) **and** `@UseGuards(GuestSessionGuard)` except the scan.
  - `CustomerThrottle` helper on the existing `RedisService`: `SET key NX EX`; Redis error → allow + `warn` log (fail open, DR-028).
- **Scan (start session):** `POST /customer/sessions` `{ qrToken }` — POST because it creates a row and sets a cookie (link previews / prefetch / retries must not create sessions). The printed QR is a web page URL (`/t/:qrToken`, C3); the page calls this.
  1. Per-IP throttle 30 / min → 429 `RATE_LIMITED`.
  2. Seat by `qr_token` (active only) → none → 404 `QR_INVALID` (CD-06 welcome·4).
  3. Cookie present and resolves to a session on **this seat** → reuse it (no new row). Otherwise: new token (32 random bytes, base64url) → insert row `{ token_hash, table_seat_id, visit_id: live visit on the seat or NULL, expires_at: now + 2 h }` → `Set-Cookie`.
  4. `purgeExpired(100)` — `DELETE … WHERE visit_id IS NULL AND expires_at < now()` bounded by `LIMIT` via ctid/id subquery; failure is logged, never fails the scan.
  5. → `CustomerSession`.
- **Cookie:** `guest_session`, `HttpOnly`, `SameSite=Lax`, `Path=/api/customer`, `Secure` when `NODE_ENV=production`, no `Max-Age` (session cookie; server owns expiry).
- **Session:** `GET /customer/session` → `CustomerSession` · `PATCH /customer/session` `{ displayName: string | null }` (trimmed, 1–30 chars, empty → null) → `CustomerSession` (CD-06 R3: welcome + cart "เปลี่ยนชื่อ").
- **Menu:** `GET /customer/menu` → `{ categories, items }` from `MenuCatalogService` (active categories only, `itemType = 'charge'` excluded — CD-06 §9, promo items included with windows, sold-out/out-of-window included with `availableNow=false` + reason — greyed, not hidden, FRD §9).
- **Venue lookup:** `VenueModule` exports a read method `findActiveSeatByQrToken(qrToken)` (+ live visit id) used by `CustomerModule`.
- **Contracts:** `schemas/customer.ts` — `CustomerSessionSchema { seat: { id, label, kind }, visitId: uuid|null, displayName: string|null, expiresAt }` · `StartCustomerSessionSchema { qrToken: string 1–64 }` · `UpdateCustomerSessionSchema` · `CustomerMenuItemSchema` (id, categoryId, name, description, imageUrl, isPromo, basePrice, availableNow, unavailableReason, windows, variants: { id, name, price, isAvailable, modifierGroups }) · `CustomerMenuCategorySchema` (id, name, sortOrder) · `CustomerMenuSchema` · response wrappers · error codes `QR_INVALID`, `GUEST_SESSION_INVALID` in `ErrorCodeSchema`.
- OpenAPI for every route (cookie auth described) · `docs/api/README.md`: Customer section + auth row "Customer QR → cookie `guest_session` (DR-028)".

### Out (do NOT build here)
- Order, running tab, call-staff, WS `/customer`, `order_record.guest_session_id` (BRIEF-048 C2) · customer payment (C5) · any UI (C3/C4) · QR regenerate button + seat CRUD (tables/QR admin brief) · venue setting "staff must open table" (not S1, DR-028) · BullMQ cleanup job · PDPA consent / customer identity / LINE login for guests (S2).

## 3. Contract
| Method | Path | Auth | Request → Response |
|---|---|---|---|
| POST | `/customer/sessions` | none (throttled per IP) | `StartCustomerSession { qrToken }` → `CustomerSession` + `Set-Cookie guest_session` (200 when reused, 201 when created) |
| GET | `/customer/session` | `guest_session` cookie | → `CustomerSession` |
| PATCH | `/customer/session` | `guest_session` cookie | `UpdateCustomerSession` → `CustomerSession` |
| GET | `/customer/menu` | `guest_session` cookie | → `CustomerMenu` |
- **Errors:** 400 `VALIDATION_ERROR` · 401 `GUEST_SESSION_INVALID` · 404 `QR_INVALID` · 429 `RATE_LIMITED` — all in the standard envelope (DR-021).
- **WS events:** none.
- **Permissions:** none (guest surface — `PermissionsGuard` not involved; isolation is the prefix + guard, DR-028).
- **Business rules:** session life 2 h sliding while seat-only, then the visit's life (DR-028) · second phone on an open visit gets its own session on the same visit (FRD §3) · charge items never on the customer menu (CD-06 §9) · promo price shown as-is, no "was" price (DR-014 #10) · only the token hash is stored.

## 4. Acceptance Criteria
- **AC-1** — Active seat, no visit: `POST /customer/sessions` → 201 `CustomerSession` with `visitId: null`, `Set-Cookie` with HttpOnly / SameSite=Lax / Path=/api/customer; DB has one row with a 64-char hash and **no raw token** anywhere in the row.
- **AC-2** — Seat with a live visit: scan from phone A and phone B → two sessions, both `visitId` = that visit. Phone A rescans with its cookie → 200, same session id, no new row. `GET` on `/customer/sessions` → 404/405 (no GET creates a session).
- **AC-3** — Missing `qrToken` → 400; unknown or inactive-seat `qrToken` → 404 `QR_INVALID`; 31st scan in a minute from one IP → 429 `RATE_LIMITED`.
- **AC-4** — Guard: no cookie / garbage cookie / expired seat-only session / session on a closed visit / seat deactivated → 401 `GUEST_SESSION_INVALID`. A staff access-token cookie or `Bearer` on `/customer/*` does not authenticate; the `guest_session` cookie on a staff route (`GET /menu/items`) → 401 (staff auth unchanged).
- **AC-5** — Sliding expiry: seat-only session used at t + 1h50 → `expiresAt` moves to t + 3h50 (fake clock).
- **AC-6** — `PATCH /customer/session` `"  ต้น  "` → `"ต้น"`; `""` → `null`; 31 chars → 400.
- **AC-7** — `GET /customer/menu`: hidden category and its items absent; charge item absent; sold-out item present with `availableNow=false, unavailableReason='sold_out'`; out-of-window promo present with `out_of_window` + windows; response has **no** `station`, `itemType`, `sortOrder` on items, `updatedAt` (schema parse is strict).
- **AC-8** — Lazy purge: 3 expired seat-only rows + 1 expired row with a visit → after a scan, the 3 are gone, the visit-bound row stays.
- **AC-9** — Redis stopped: scan still 200 (throttle fails open, warning logged).
- **AC-10** — Gates + run proof pass; OpenAPI regenerated + `openapi:check`; README Customer section.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1 – AC-8 | integration (real Postgres + Redis) | `app/backend/test/customer-session.e2e-spec.ts` |
| AC-5, AC-6 | unit | `modules/customer/application/guest-session.service.spec.ts` |
| AC-9 | unit (throttle with a failing Redis stub) | `modules/customer/application/customer-throttle.spec.ts` |
| AC-7 | unit (contracts strict parse) | `packages/contracts/src/schemas/customer.test.ts` |

Gate commands (all must pass):
```bash
pnpm --filter @bar/contracts build && pnpm --filter @bar/contracts test
pnpm --filter @bar/backend lint && pnpm --filter @bar/backend typecheck && pnpm --filter @bar/backend test && pnpm --filter @bar/backend test:e2e
pnpm --filter @bar/backend openapi:check
```
Run proof (stop any dev backend before `test:e2e`; dev ports BRIEF-046):
```bash
docker compose -f infra/docker-compose.yml up -d postgres redis
pnpm --filter @bar/backend migration:run
pnpm --filter @bar/backend start:dev   # :3011
QR=$(psql … -tAc "select qr_token from table_seat where label='T3'")
curl -si -c jar -X POST -H 'content-type: application/json' -d "{\"qrToken\":\"$QR\"}" localhost:3011/api/customer/sessions | head -20   # 201 + Set-Cookie
curl -s -b jar -X PATCH -H 'content-type: application/json' -d '{"displayName":"ต้น"}' localhost:3011/api/customer/session
curl -s -b jar localhost:3011/api/customer/menu | head -c 600
curl -si localhost:3011/api/customer/menu | head -1                # 401
```
Output trimmed in the handoff. UI change: n/a.

### Local Sonar scan
- Required: optional — backend auth surface, run if time allows; record result in the handoff.
- Approved exclusions: none.

## 6. Constraints
- `/customer/*` routes: `@Public()` + `GuestSessionGuard` on the controller class — never per-method opt-in (one place to audit). No staff JWT read anywhere in `CustomerModule`.
- Never log the raw token or the cookie value; compare by hash lookup only.
- `save()` on the entity (audit subscriber — `created_by`/`updated_by` stay NULL for guests); `updated_at` from the trigger only (DR-023).
- `CustomerModule` imports only `VenueModule` (seat lookup) and `MenuModule` (`MenuCatalogService`) in this brief; `OrderModule` comes with BRIEF-048.
- Thai messages: `QR_INVALID` "QR ไม่ถูกต้อง กรุณาติดต่อพนักงาน" · `GUEST_SESSION_INVALID` "เซสชันหมดอายุ กรุณาสแกน QR ที่โต๊ะอีกครั้ง" · `RATE_LIMITED` existing.

## 7. Decision Points (Field Guard)
- **Pre-decided (exact):** DR-028 A (all locks) · prefix `/customer`, cookie path `/api/customer`, session start = `POST /customer/sessions` · new module `app/backend/src/modules/customer/` · imports `VenueModule`, `MenuModule` · new table `guest_session` (columns above) · no new dependency (`node:crypto`, existing `RedisService`, `cookie-parser` already used by auth) · lazy purge on scan · throttle 30 scans / min / IP.
- **Behind a proxy (note, not a DR):** IP for the throttle = `req.ip`; Express `trust proxy` is set when the AWS/Cloudflare front is built (before AWS, Carry over). Locally `req.ip` is the client.
- **Likely DRs:** none. If `MenuCatalogService` can't produce the customer view without a new repository query → allowed inside `modules/menu` (read-only); a schema change beyond `guest_session` → stop, raise a DR.

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
| 1 | 2026-10-29 | Initial Draft (Cowork) — customer side C1; DR-028 Approved A (+ `/customer` prefix amend) |
| 1 | 2026-10-29 | Draft edit (Field in session): scan `GET /customer/qr/:qrToken` → `POST /customer/sessions { qrToken }` |
| 1 | 2026-10-29 | Ready — Field in session: "approve BRIEF-047 Rev 1 Ready" |
