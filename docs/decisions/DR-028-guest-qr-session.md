# DR-028 — Guest QR session (opaque token, DB-backed, Redis throttles)

| | |
|---|---|
| **Status** | Approved |
| **Raised by** | Cowork · 2026-10-29 (customer-QR interview, before BRIEF-047 C1) |
| **Brief** | BRIEF-047 (C1 — QR session + public menu) · used by C2–C6 |
| **Category** | Sensitive (auth) · Data (schema) · Flow/Architecture (new `/customer` surface) |

## Context
The customer QR web (CD-06/07) has no login: the guest scans the table QR and orders. Today every API needs a staff JWT (BRIEF-007) and there is no `/customer/*` surface. CD-06 parked R3 (nickname), R4 ("ของฉัน" needs a per-phone id, not a name match) and R5 (customer API contract) until the session model is decided. FRD §3 already fixes the shape: session belongs to the table, the shared QR lets friends join the same visit, the visit opens on the first order, staff always close.

**Interview (2026-10-29) — Selected (by KJ):**

| Q | Selected (by KJ) |
|---|---|
| Token type | Opaque random token, row in DB (after explanation vs JWT) |
| Storage of the session | **DB only** — Redis only for throttles (Option A, after Redis discussion) |
| Visit created | On first order (FRD §3) |
| Cookie | HttpOnly `guest_session`, path `/api/customer` |
| "ของฉัน" (CD-06 R4) | `guest_session_id` on `order_record`, in this DR |
| Pre-order lifetime | 2 h sliding |
| Second phone on an open visit | Joins the same visit (FRD §3 shared) |
| QR regenerate | Deferred to the tables/QR admin brief; this DR only states its effect |
| Abuse guard (S1) | Redis throttles + POS visibility of new QR orders |
| Nickname (CD-06 R3) | Welcome (optional) + cart "เปลี่ยนชื่อ"; stored on the session, snapshot at send |

## Options

**A) Opaque token, `guest_session` row in Postgres, Redis for throttles only** *(recommended — selected)*
1. Scan → page `/t/:qrToken` → `POST /customer/sessions { qrToken }` → seat active? → insert `guest_session {token_hash, table_seat_id, visit_id = current open visit or NULL, expires_at = now + 2 h}` → `Set-Cookie guest_session` (HttpOnly, Secure, SameSite=Lax, path `/api/customer`).
2. Every `/customer` request → `GuestSessionGuard`: hash cookie → PK lookup joined with visit → reject if expired, seat inactive, or bound visit closed. Seat-only sessions slide `expires_at` (+2 h).
3. First order → **one DB transaction:** lock seat → attach to open visit or open one (`opened_via = 'qr'`, first-write-wins with the POS, BRIEF-011) → set `guest_session.visit_id` → insert order with `guest_session_id` + `ordered_by_name` snapshot. Idempotency-Key as BRIEF-012.
4. Staff close the visit → every session bound to it fails step 2 at once (no revoke list, no TTL wait).
- **Outside the transaction:** Redis throttles (below), WS emit after commit.
- **Failure → what's left → who cleans:** transaction fails → no visit, no order, session stays seat-only → guest retries with the same key. Sessions that never ordered expire; a nightly job deletes rows with `expires_at < now() AND visit_id IS NULL`. Redis down → throttles fail open (log), ordering still works.
- New pattern for KJ (opaque session as primary auth), same idea as hashed refresh tokens.

**B) Redis for pre-order sessions, DB row from the first order**
- No cleanup job (TTL). Two stores: the first order must create the DB row and rewrite the Redis value; visit close must delete keys via a `visit:{id}:sessions` set. A Redis flush (e2e `flushdb`, see Carry over) signs out every guest.

**C) Signed JWT (baseline)**
- Familiar, no table. Binding changes at the first order (seat → seat + visit) → token re-issue; close cannot revoke, so every request checks the visit in the DB anyway; "ของฉัน" still needs a stable id stored somewhere.

## Recommendation
**A.** One source of truth, instant cut-off on close, a stable id for "ของฉัน", and a PK lookup is trivial at bar scale (20–50 guests). Redis holds only data that is fine to lose (throttles). The guest-session repository hides storage, so B stays possible later without touching controllers/services.

## Abuse guard (S1)
- Redis `SET NX EX`, no new dependency: order ≤ 1 per 10 s per session · call-staff 60 s lock per session (CD-06) · `POST /customer/sessions` ≤ 30 / min per IP. Over limit → `429 RATE_LIMITED` (DR-021 shape).
- New QR orders already reach the POS live (sound/badge = C6); staff cancel a fake order (cancel flow, BRIEF-017).
- Optional "staff must open the table first" venue setting: **not in S1**.

## QR regenerate (effect only — button in the tables/QR admin brief)
- Old `qr_token` → `POST /customer/sessions` → 404 `QR_INVALID` → CD-06 welcome·4 "QR ไม่ถูกต้อง".
- Seat-only sessions on that seat are deleted; sessions bound to an open visit live until staff close it.
- Seat deactivated → its sessions fail the guard (CD-13 R5: a seat with guests can't be deactivated).

## If Approved — Locks
- New table `guest_session (id, token_hash UNIQUE, table_seat_id FK, visit_id FK NULL, display_name VARCHAR(30) NULL, expires_at, created_at, updated_at + trigger DR-023)`; token = 32 random bytes, only SHA-256 stored.
- `order_record.guest_session_id UUID NULL REFERENCES guest_session(id)` — NULL = staff order. Order line keeps `ordered_by_name` as a snapshot (rename never rewrites old orders).
- Guest auth = cookie `guest_session` (HttpOnly, Secure, SameSite=Lax, path `/api/customer`) checked by `GuestSessionGuard`; `/customer/*` routes never accept the staff JWT and staff routes never accept the guest cookie.
- Session life: 2 h sliding while seat-only; after the first order = life of the visit.
- Second phone on an open visit joins it (FRD §3 shared); no per-phone approval.
- Redis: throttles only — never the session itself.
- CD-06 R3, R4 unparked by this DR; R5 contract is written in BRIEF-047/048.

---

## Decision — Field only
**Decision:** Approved: A (opaque token, `guest_session` row in Postgres, Redis for throttles only)
**Why:** One source of truth, instant cut-off on visit close, stable per-phone id for "ของฉัน"; Redis only for data that is fine to lose.
**Amended 2026-10-29 (Field, BRIEF-047 interview):** route prefix `/customer` (was `/public`, CD-06 action table) — matches DR-009 surface name and the WS `/customer` room; cookie path `/api/customer`. Code lives in a new `CustomerModule` (BRIEF-047). Session start is `POST /customer/sessions { qrToken }` (not a GET — it creates a row and sets a cookie; link previews / prefetch must not create sessions).
**Amended 2026-10-30 (Field, BRIEF-050 audit Finding 3 → B):** a seat-only session (not yet bound to a visit) also ends 60 min after creation, whatever its 2 h sliding expiry — so a phone left open on the menu can never join a later group's visit on that seat (bind on read / at first order). Visit-bound sessions unchanged.
**Date:** 2026-10-29 · recorded by Cowork on Field's explicit instruction (session: "approve DR-028 A")
