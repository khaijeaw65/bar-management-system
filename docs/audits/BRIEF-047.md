# Audit — BRIEF-047 Backend: customer QR session + customer menu (C1)

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-29 |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-29 |
| **Branch / commit** | `feat/BRIEF-047-customer-qr-session` · **S = `70ee421`** · handoff `5c21b49` · seed `7c747d9` |
| **Depth** | Full (auth — new guest session) |
| **Brief revision** | 1 |
| **Recommendation** | **PASS** — no Must fix. AC-10's `docs/schema.sql` item closes through a Field-approved edit in the PASS commit (Finding 1). |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1 | ✅ | `GuestSessionService.start` inserts `hashGuestToken(token)` only; cookie via `guestCookieOptions` (HttpOnly, Lax, `Path=/api/customer`, Secure in production); e2e checks 64-char hash and that the row JSON does not contain the cookie value | |
| AC-2 | ✅ | `findActiveSeatByQrToken` returns the live visit id → both phones bound to it; rescan with cookie → `token: null` → controller sets 200, no insert | |
| AC-3 | ✅ | `StartCustomerSessionSchema` (1–64) → 400; unknown / inactive seat → 404 `QR_INVALID`; throttle checked before the seat lookup (30 / 60 s per IP) | |
| AC-4 | ✅ | `isValid`: inactive seat, visit not in `open/active/idle`, expired seat-only → null → 401; controllers are class-level `@Public()` + `@UseGuards(GuestSessionGuard)`; guard reads only `cookies.guest_session`; e2e covers Bearer + `access_token` cookie on `/customer`, guest cookie on `/menu/items` | |
| AC-5 | ✅ | seat-only branch writes `now + 2 h` on every resolve; unit with fake clock + e2e | |
| AC-6 | ✅ | schema trims + max 30; controller `blankToNull` | see Deviations note — wire behaviour matches |
| AC-7 | ✅ | `CustomerMenuService`: active categories only, charge items dropped, explicit field pick → no `station` / `itemType` / `sortOrder` / `updatedAt` on items; strict contracts parse | Finding 3 on variants |
| AC-8 | ✅ | `PURGE_EXPIRED` deletes `visit_id IS NULL AND expires_at < now` with `LIMIT`; called after insert, wrapped in try/catch | |
| AC-9 | ✅ | `CustomerThrottle.allow` returns true on any Redis error + `warn` (no token in the log) | |
| AC-10 | ⚠️ | gates green per handoff; OpenAPI regenerated + README Customer section; **Cowork re-ran backend `tsc --noEmit` on `5c21b49` (exit 0)**; vitest / e2e not re-runnable in the Cowork shell (macOS binaries) → GitHub `ci` is the independent check | `docs/schema.sql` → Finding 1 |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope = brief §2 | ✅ | new `modules/customer`, migration, venue read method + export, contracts, OpenAPI, README, test helpers |
| DR-028 locks | ✅ | opaque token, SHA-256 only, DB-only session, Redis throttles only, prefix + cookie path, 2 h sliding then visit life, `/customer` never accepts the staff JWT and vice versa |
| Migration ↔ entity ↔ brief | ✅ | columns, `CHAR(64) UNIQUE`, both indexes, `trg_guest_session_updated_at` → `set_updated_at()` (DR-023); `down` drops the table (trigger goes with it) |
| Module boundaries | ✅ | `CustomerModule` imports only `VenueModule`, `MenuModule` (+ config); uses `TableSeatService` / `MenuCatalogService`, no cross-module repository |
| `save()` on the entity | ✅ | `mutate()` = findOne + save |
| No secrets / tokens logged | ✅ | |
| No new dependency | ✅ | |
| Protected files | ✅ | `docs/schema.sql` left untouched because §8 = none (correct call) |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Field-approved edit (docs) | Low | **Current:** brief §2 asks for `docs/schema.sql` + ERD note, §8 unlocks nothing, so the table is only in the migration. **Updated:** Cowork writes the `guest_session` block into `docs/schema.sql` (after `visit`, header 38 → 39 tables) as a Field-approved edit (agent-boundaries "Field-approved edits"); the executor commits it in the PASS commit with trailer `Approved-by: Field (session)`. `docs/erd.html` → with BRIEF-048's schema change (one ERD pass for both). |
| 2 | Suggestion | Low | **Current:** `CustomerSession.expiresAt` keeps the creation-time value once a session is bound to a visit (it no longer expires by time), so a visit-bound session can report a past `expiresAt`. **Updated (no change in 047):** BRIEF-049 / C4 UI must not use `expiresAt` to decide expiry — 401 `GUEST_SESSION_INVALID` is the only signal. If Field wants it explicit later: `expiresAt` nullable when `visitId` is set (contract change → a later brief). |
| 3 | Suggestion | Low | **Current:** customer menu passes `variants` through unchanged, including variants with `isAvailable: false` (deactivated by BRIEF-038). **Updated (no change in 047):** BRIEF-049 hides `isAvailable: false` variants in the item sheet (same as POS order entry); server-side filtering can come with any later menu touch. |
| 4 | Suggestion | Info | **Current:** every guarded request on a seat-only session does SELECT + findOne + save (sliding expiry). **Updated (later, only if it shows):** skip the write when the last slide was < 5 min ago. Trivial at bar scale. |
| 5 | Info (environment) | — | e2e flakiness (`payment.e2e › delayed job`, also on clean `main`) is the shared-Redis dev backend issue already in Carry over (dev env isolation). Stop dev backends before `test:e2e`; not caused by this brief. |
| 6 | Info | — | Deviations in the handoff (separate `CustomerScanController`, counter throttle via `SET NX` + `INCR`, `blankToNull` in the controller) are all improvements that keep the brief's rules; accepted. |

## Recommendation to Field
Solid, small and isolated: one guard, one table, hashes only, both auth directions tested. Approve the `docs/schema.sql` block (Finding 1) and the executor ships it with the PASS commit. Findings 2–3 are notes for BRIEF-049, already actionable there.

**Field approved the schema.sql block in session (2026-10-29, "approve schema.sql edit")** — written to the checkout by Cowork, uncommitted.

**Next command:** `execute BRIEF-047` (PASS commit + PR; include `docs/schema.sql` with `Approved-by: Field (session)`).
