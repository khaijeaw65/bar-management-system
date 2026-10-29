# Handoff — BRIEF-047 Backend: customer QR session + customer menu (C1)

| | |
|---|---|
| **Implementer** | kj (Claude Code) |
| **Date** | 2026-10-29 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-047-customer-qr-session` (PR opens after audit PASS) |
| **Commit** | Work SHA `70ee421` (seed `7c747d9`) |
| **Status** | Audit PASS (Cowork, S `70ee421`) — PR opened at the PASS commit; merged PR determines Done |

> Created at `Implemented`. Updated once in the PASS commit. Frozen at merge.

## Summary
A guest scans a table QR and gets an HttpOnly `guest_session` cookie (opaque token, only its SHA-256 stored in the new `guest_session` table), can set a nickname, and can load the customer menu. New `CustomerModule` (imports `VenueModule`, `MenuModule` only).

- **Routes:** `POST /customer/sessions` (scan; 201 created / 200 reused; 30 / min / IP) · `GET` / `PATCH /customer/session` · `GET /customer/menu`.
- **Guard:** `GuestSessionGuard` (cookie → hash → seat + visit join). 401 `GUEST_SESSION_INVALID` on missing / unknown / expired seat-only / inactive seat / non-live visit; seat-only sessions slide +2 h. Class-level `@Public()` + `@UseGuards` on `CustomerSessionController` and `CustomerMenuController`; the scan lives in its own `CustomerScanController` (`@Public()` only) so no method opts in per route.
- **Throttle:** `CustomerThrottle` on `RedisService` (`SET NX EX` + `INCR` in one MULTI); Redis error → allow + `warn`.
- **Menu:** `CustomerMenuService` maps `MenuCatalogService.listCategories` / `listItems` to the strict slim contract; charge items dropped.
- **Venue:** `TableSeatService.findActiveSeatByQrToken` (+ live visit id), exported.
- **Contracts:** `schemas/customer.ts`, error codes `QR_INVALID`, `GUEST_SESSION_INVALID`. OpenAPI regenerated (new `customer` tag, `guest_session` cookie auth) + README Customer section and auth row.
- ~1.9k net-new lines incl. tests, ~850 of them the regenerated `openapi.json` (excluded from the size target).

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | e2e `creates a seat-only session with a hardened cookie…`; unit `stores only the hash…` |
| AC-2 | ✅ | e2e `gives each phone on an open visit its own session…` (incl. `GET /customer/sessions` → 404) |
| AC-3 | ✅ | e2e `rejects a bad body, an unknown QR and the 31st scan…` |
| AC-4 | ✅ | e2e `guard (AC-4)` ×5 (missing / garbage / expired / closed visit / deactivated seat / staff token / guest cookie on `/menu/items`) |
| AC-5 | ✅ | unit `slides a seat-only session by 2 h from now`; e2e `slides…` |
| AC-6 | ✅ | contracts `trims the nickname…`; e2e `trims, clears and bounds the nickname` |
| AC-7 | ✅ | contracts strict parse; e2e `lists the customer menu without hidden, charge or POS-only data` |
| AC-8 | ✅ | e2e `purges expired seat-only rows on a scan…` |
| AC-9 | ✅ | unit `customer-throttle.spec.ts` (failing Redis); e2e `keeps scanning when Redis fails` |
| AC-10 | ✅ | Gates + run proof below; OpenAPI + README done; `docs/schema.sql` `guest_session` block added at PASS (Field-approved edit, audit Finding 1); `docs/erd.html` goes with BRIEF-048's schema change |

## Gate Evidence (G1)
Run on work SHA `70ee421` (e2e on `bar_test`).

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/contracts build` / `test` | 0 | 90 passed (11 files) |
| `pnpm --filter @bar/backend lint` / `typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 166 passed (41 files) |
| `pnpm --filter @bar/backend test:e2e` | 0 on re-run | 189 passed (27 files). **Flaky, not caused by this brief:** across 5 full runs `payment.e2e-spec.ts › cancels an untouched payment from the delayed job` failed 3×, `menu.e2e › getOrderable` and `auth-mobile.e2e` once each. Same payment test on clean `main` (stashed): failed 2 of 3 runs. Cause: three `nest start --watch` dev backends are running on this machine and share Redis / the BullMQ queue (Carry over: "stop the dev backend before test:e2e"). Not stopped — they are Field's processes. |
| `pnpm --filter @bar/backend openapi:check` | 0 | regenerated spec committed in the work SHA |
| run proof (below) | 0 | |

Run proof, fresh build on the work SHA: `migration:run` applied `GuestSession1762900000000` on dev `bar`; backend started with `PORT=3021` (a dev backend already held :3011) and stopped afterwards. Trimmed:
```
GET  /api/health                                  → 200
POST /api/customer/sessions {qrToken: T3}         → 201  Set-Cookie: guest_session=…; Path=/api/customer; HttpOnly; SameSite=Lax
     data: {seat:{label:"T3",kind:"table"},visitId:null,displayName:null,expiresAt:…}
PATCH /api/customer/session {"displayName":"ต้น"} → 200  displayName "ต้น"
GET  /api/customer/menu (cookie)                  → 200  {categories:[…],items:[…]}
GET  /api/customer/menu (no cookie)               → 401
POST /api/customer/sessions {qrToken:"x"}         → 404 QR_INVALID "QR ไม่ถูกต้อง กรุณาติดต่อพนักงาน"
```
UI change: n/a.

## Sonar (local scan)
- Not run — optional for this brief ("if time allows"); no result to record.

## Decisions Raised
- none

## Deviations from Brief
- **`docs/schema.sql`** was not edited at Implemented (§8 unlocks nothing). Resolved: Field approved Cowork's edit in session; committed in the PASS commit with `Approved-by: Field (session)`. ERD page → BRIEF-048.
- **Scan is its own controller** (`CustomerScanController`) beside the brief's `CustomerSessionController` / `CustomerMenuController`, so the §6 rule "guard on the class, never per method" holds for the other two.
- **Contracts:** `UpdateCustomerSessionSchema` trims and caps at 30 but does not turn `''` into `null` — a Zod transform cannot be converted to OpenAPI (`zodToOpenApi` throws), so the controller applies `blankToNull`. Wire behaviour matches AC-6.
- **Throttle** is `SET key 0 EX n NX` + `INCR` in one MULTI (a counter), not a bare `SET NX EX` (which only gives 1 hit per window).
- Test helper `clearStaffAndVenue` now deletes `guest_session` first; `updated-at-trigger.e2e-spec.ts` lists `guest_session` (15 tables) and its revert test drops / restores the GuestSession migration around the function drop.

## Known Gaps / Follow-ups
- `order_record.guest_session_id` → BRIEF-048.
- Behind a proxy `req.ip` needs Express `trust proxy` (before AWS, Carry over) or all guests share one throttle bucket.
- The scan reuses a session on the same seat but does not re-bind a seat-only session to a visit opened later; BRIEF-048 binds at first order (DR-028 step 3).
- Dev `bar` now holds one proof `guest_session` row (T3, expires in 2 h; purged lazily).
- Env gap (names only): none checked beyond those in 046.

## AI Usage
**High** — Claude Code implemented the whole brief (Field's own brief; learning-mode cap applies to Metee only).

## Review Routing
- Assigned auditor: Cowork · Audit depth: Full (auth)
- Work SHA: `70ee421` · self-check: brief §2 ↔ contracts ↔ controllers ↔ tests; migration ↔ entity columns compared; AC-4 isolation tested both ways.

## Notes for Reviewer
- Start with `guest-session.service.ts` (start / resolve), then `guest-session.guard.ts`, the migration, and `customer-session.e2e-spec.ts`.
- Audit suggestions 2–4 (visit-bound `expiresAt`, unavailable variants, slide write rate) are notes for BRIEF-049 / later; not in this PR.
