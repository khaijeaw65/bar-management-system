# API — conventions + Phase 1 endpoint catalog

**Status:** v1 · 2026-09-28 · D1–D4 decided by Field (§3)
**Source of truth for shapes:** Zod schemas in `app/packages/contracts/src/schemas/<domain>.ts` (DR-004). **Generated spec:** `docs/api/openapi.json` + Swagger UI `/api/docs` (non-prod) — DR-004 Amendment 1, `docs/rules/backend.md` → OpenAPI.
This file holds the **rules every endpoint follows** and the **planned endpoint list**. Field-level shapes are written in the brief that builds each endpoint, as contracts schemas.

---

## 1. Conventions

### URLs
- Base path `/api` (global prefix). Plural nouns, kebab-case: `/api/menu/items`, `/api/order-items/:id`.
- Nested only one level, when the child can't exist without the parent: `POST /api/visits/:visitId/orders`.
- State transitions are **explicit sub-resources**, not generic PATCH of a status field: `POST /api/visits/:id/close`, `POST /api/orders/:id/accept`. Each transition = one permission, one audit entry, one place to re-validate state (FRD §8).
- IDs are UUID v4 strings.

### Payloads
- JSON, **camelCase** keys. DB snake_case never leaks (mappers in backend).
- **Money:** decimal string with 2 places, `"120.00"` (regex `^\d+\.\d{2}$`). Never numbers. Frontend formats, never calculates (DR-002 #11).
- **Dates:** ISO 8601 with offset, UTC from the server (`2026-09-28T11:04:00.000Z`). Frontend shows Asia/Bangkok.
- **Enums:** lowercase snake values **exactly as `docs/schema.sql`** (`pending`, `accepted`, `completed`, …). UI labels live in the frontend.
- Nullable = present with `null`; optional fields only in requests.

### Envelope (already decided — `backend.md` → API Response)
```jsonc
// success
{ "status": 200, "code": "", "message": "success", "data": { /* resource */ } }
// list
{ "status": 200, "code": "", "message": "success", "data": { "items": [ /* … */ ], "nextCursor": null } }
// error
{ "status": 409, "code": "PAYMENT_IN_FLIGHT", "message": "โต๊ะนี้มีการชำระเงินค้างอยู่", "data": null }
```
- **Standard envelope:** every response has exactly `status`, `code`, `message`, `data`. `code` = `''` on success, non-empty on error. Types make all four required — client code reads `res.code` / `res.data` with no `?.` or `!` on envelope fields.
- Lists are always `data.items` (+ `nextCursor` only on paged lists).
- Validation errors: `400`, `code: "VALIDATION_ERROR"`, `message` = string array (one per issue).
- **Error `code` (D1):** UPPER_SNAKE, machine-readable, always present. Generic codes from the status: `VALIDATION_ERROR` 400 · `UNAUTHORIZED` 401 · `FORBIDDEN` 403 · `NOT_FOUND` 404 · `CONFLICT` 409 · `RATE_LIMITED` 429 · `INTERNAL_ERROR` 5xx. Domain codes (e.g. `PAYMENT_IN_FLIGHT`, `INVALID_STATE_TRANSITION`, `NOT_REGISTERED`, `ITEM_UNAVAILABLE`) are added to `ErrorCodeSchema` in contracts by the brief that first throws them. The UI branches on `code`, shows `message`.

### Status codes
| Code | When |
|---|---|
| 200 | read / update / transition OK (body = updated resource) |
| 201 | created (body = created resource) |
| 400 | request fails the Zod schema |
| 401 | no / expired access token |
| 403 | authenticated but missing permission |
| 404 | resource not found (or not visible to this caller) |
| 409 | **state conflict** — wrong state for the transition, concurrent change, payment in flight (FRD §7, §8) |
| 429 | rate limited (public QR endpoints) |
| 5xx | server / gateway failure |
No `204` — deletes and empty results still return the envelope (`data: null`).

### Paging
Phase-1 lists are small (menu, tables, active orders) → **unpaged**. History-type lists (orders history, audit, payments report) use cursor paging: `?limit=50&cursor=<opaque>` → `data.nextCursor` (`null` at the end). No offset paging.

### Filtering / sorting
Query params, camelCase: `GET /api/orders?status=pending,accepted&visitId=…`. Comma = OR within one field. Server-defined default sort per list; `?sort=` only when a screen needs it.

### Auth
| Caller | How | Notes |
|---|---|---|
| Staff web (POS) | HttpOnly `access_token` cookie + refresh cookie | BRIEF-007 |
| Staff app (Expo) | `Authorization: Bearer <access>` | DR-005 (one-time code + PKCE) |
| Customer (QR) | signed table QR token → short-lived visit session | designed in the customer-QR brief |
| Payment gateway | webhook signature | `/api/webhooks/payments/:provider`, exempt from envelope |
Permissions are `resource:action` (`menu:read`, `orders:create`, `payments:mark_paid`) via `@RequirePermissions` + `PermissionsGuard`. Each endpoint's permission is listed in its OpenAPI description.

### Realtime (socket.io)
- Namespaces: `/staff` (auth = same access token), `/customer` (visit session).
- Event names `domain.event_name`: `order.created`, `order.status_changed`, `order_item.status_changed`, `visit.opened`, `visit.state_changed`, `staff.called`, `payment.status_changed`, `menu.availability_changed`, `notification.created`.
- Payload = the **same contracts schema** as the REST resource (or a documented slice). Events notify; clients refetch via React Query when unsure (no event-sourced client state).
- Event schemas live in `contracts/src/events/<domain>.ts`.

### Concurrency
Server re-validates state on every transition and returns `409` with a `code` + Thai message; the client refetches. No ETags in Phase 1.

### Idempotency (D3)
`POST /api/visits/:visitId/orders`, `POST /api/public/visits/:id/orders` and `POST /api/visits/:visitId/payments` accept an `Idempotency-Key` header (UUID, generated per user action on the client). Same key + same body within 24 h → the original response is replayed; same key + different body → `409 IDEMPOTENCY_KEY_REUSED`. Stored in Redis. Other endpoints ignore the header.

### Versioning (D2)
No URL version in Phase 1 (`/api/...`). Breaking changes go through a DR; add `/api/v2` only once real installs depend on the old shape.

---

## 2. Phase 1 endpoint catalog (planned)
Order = build order for the core vertical slice (**order → pay → close**). "Brief" = where the shape gets defined.

### Health
| Method | Path | Auth | Brief |
|---|---|---|---|
| GET | `/api/health` | public | BRIEF-004 ✓ |

### Auth (staff)
| Method | Path | Purpose | Brief |
|---|---|---|---|
| GET | `/api/auth/line/login` | redirect to LINE (state + nonce) | BRIEF-007 |
| GET | `/api/auth/line/callback` | LINE callback → cookies → redirect | BRIEF-007 |
| POST | `/api/auth/refresh` | rotate refresh token | BRIEF-007 |
| POST | `/api/auth/logout` | revoke family, clear cookies | BRIEF-007 |
| GET | `/api/auth/me` | current staff + effective permissions | BRIEF-007 |
| POST | `/api/auth/mobile/token` | Expo: exchange one-time code (PKCE) → tokens | mobile auth (DR-005) |

### Menu
| Method | Path | Purpose | Permission |
|---|---|---|---|
| GET | `/api/menu/categories` | active categories, sorted | `menu:read` |
| GET | `/api/menu/items` | list for POS/staff (`?categoryId`, `?available`) | `menu:read` |
| GET | `/api/menu/items/:id` | detail incl. variants + modifier groups | `menu:read` |
| POST | `/api/menu/items/:id/mark-unavailable` · `/mark-available` | 86 / un-86 | `menu:toggle_availability` |
| POST/PATCH | `/api/menu/items` · `/api/menu/items/:id` | create / edit (CD-04) | `menu:write` |
| GET | `/api/public/menu` | customer QR menu (available only) | visit session |

### Tables & visits
| Method | Path | Purpose | Permission |
|---|---|---|---|
| GET | `/api/tables` | floor: seats (`kind`: table \| counter) + current visit summary (state, total, since) | `tables:read` |
| POST | `/api/tables/:id/qr/regenerate` | new signed QR token, old one invalid (FRD §3); reprint = same token, client-only | `tables:manage` |
| POST | `/api/visits` | open visit `{ tableSeatId }` — first write wins, second attaches (FRD §3) | `visits:open` |
| GET | `/api/visits/:id` | visit detail: orders, items, totals, payments | `visits:read` |
| POST | `/api/visits/:id/close` | close (409 if payment in flight) | `visits:close` |
| GET | `/api/public/qr/:token` | resolve table QR → table + visit session | public, rate-limited |
| POST | `/api/public/visits/:id/call-staff` | customer bell | visit session |

### Orders
| Method | Path | Purpose | Permission |
|---|---|---|---|
| POST | `/api/visits/:visitId/orders` | place order (items, variants, modifiers, `orderedByName`, notes) | `orders:create` |
| GET | `/api/orders` | queue (`?status`, `?visitId`) | `orders:read` |
| POST | `/api/orders/:id/accept` · `/ready` · `/send` · `/flag-issue` · `/resolve` | state machine FRD §6 | `orders:update_status` |
| POST | `/api/order-items/:id/cancel` | cancel item (stays visible, struck through) | `orders:void` |
| POST | `/api/public/visits/:id/orders` | customer QR order | visit session |

### Payments
| Method | Path | Purpose | Permission |
|---|---|---|---|
| POST | `/api/visits/:visitId/payments` | create attempt: `{ method, mode: merge \| split_equal, parts? }` → locks amount, PromptPay QR payload | `payments:create` |
| GET | `/api/payments/:id` | status (polling fallback to WS) | `payments:read` |
| POST | `/api/payments/:id/mark-paid` | manual / cash confirm (+ reason) | `payments:mark_paid` |
| POST | `/api/payments/:id/cancel` | cancel attempt (unlocks bill) | `payments:create` |
| POST | `/api/webhooks/payments/:provider` | gateway confirm (idempotent on `gateway_tx_id`; late webhook after manual = ignored + logged) | signature |

### Later in Phase 1 (catalogued when their CD/brief starts)
Notifications feed (`/api/notifications`, DR-003) · guest profile + AI summary · bottle keep · restock requests · dashboard · IAM admin.

---

## 3. Decisions (Field, 2026-09-28)
| # | Decision |
|---|---|
| D1 | **Approved** — machine-readable `code` is part of the **standard envelope** on every response: `''` on success, UPPER_SNAKE on error (§1 Envelope). |
| D2 | **No** URL versioning in Phase 1. |
| D3 | **Yes** — `Idempotency-Key` on order + payment creation only (§1 Idempotency). |
| D4 | **Yes** — menu list returns `basePrice` + `variants[]` (id, name, price, isAvailable); POS shows "from ฿x" when variant prices differ. Seed rule: every orderable item has ≥ 1 variant. |
