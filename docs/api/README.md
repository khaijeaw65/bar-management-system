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
- Event names `domain.event_name`: `order.created`, `ticket.status_changed`, `ticket.issue_escalated`, `order_item.status_changed`, `visit.opened`, `visit.state_changed`, `staff.called`, `payment.status_changed`, `menu.availability_changed`, `menu.changed`, `notification.created`. `order.created`, `ticket.status_changed`, `ticket.issue_escalated`, and `menu.changed` (`{ itemIds?, categoryIds? }`, once per menu write — refetch the menu) go to room `staff`. `visit.*` stays on room `pos`.
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

### Venue
| Method | Path | Purpose | Permission |
|---|---|---|---|
| GET | `/api/venue` | name, slug, kitchen display, business-day cut-off, counter QR — no payment fields | `venue:read` |
| PATCH | `/api/venue/settings` | partial `{ name?, businessDayCutoff?, kitchenDisplayEnabled?, counterQrEnabled? }` → `VenueSettings`. One audit row per real change (only changed fields); same values → 200, no row. Applies to data created afterwards; a cut-off change applies from the next business day. Emits WS `venue.settings_changed` `{ settings, updatedAt }` to `staff` | `venue:update` |
| GET | `/api/venue/payment-settings` | payment mode + masked PromptPay ID (`XXX-XXX-` + last 4). Full ID is never returned | `venue:read_payment` |
| PATCH | `/api/venue/payment-settings` | set PromptPay ID `{ promptpayId, promptpayIdType }`. 409 `PAYMENT_IN_FLIGHT` while any QR is pending | `venue:update_payment` |

### Menu
| Method | Path | Purpose | Permission |
|---|---|---|---|
| GET | `/api/menu/categories` | active categories, sorted; each has `isActive`. `?includeHidden=true` also returns hidden ones (`isActive: false`) for the back office | `menu:read` |
| GET | `/api/menu/items` | list for POS/staff (`?categoryId`, `?available`, `?includeHidden=true` — items of hidden categories too, `availableNow: false`). `imageUrl` = presigned GET (1 h) or `null` | `menu:read` |
| GET | `/api/menu/items/:id` | detail incl. variants + modifier groups | `menu:read` |
| POST | `/api/menu/items/:id/mark-unavailable` · `/mark-available` | 86 / un-86. Unavailable auto-voids that item's lines on `pending` tickets (`ของหมด`, system), skips a visit with a pending payment and any ticket already started, and cancels a ticket left with no active line. Already in that state is a no-op. Available only flips the flag. | `menu:toggle_availability` |
| POST | `/api/menu/items/image-upload-url` | `{ contentType: image/jpeg \| image/png \| image/webp }` → `{ url, fields, key, expiresAt }` (200). Presigned POST, 5 min: `POST` the multipart form (`fields` first, the file last) to `url`; S3 itself rejects another `Content-Type` and files outside 1 byte … 5 MB. `key` = `tmp/<uuid>.<ext>`; no DB write. Bucket stays private (DR-020) | `menu:write` |
| POST | `/api/menu/items` | create `{ categoryId, name, description?, itemType: simple \| charge, station: bar \| food \| null, isPromo, variants: [{ name, price }] (≥ 1), modifierGroupIds?, imageKey? }` → `MenuItem` (201). `imageKey`: omitted / `null` = no photo; a `tmp/…` key from image-upload-url attaches it (re-checked with HeadObject, copied to `menu/<itemId>/…`; missing / expired / oversized / wrong type / any other key → 400 `VALIDATION_ERROR`). `station` required unless `charge`, null for `charge` (DR-012); `recipe` → 400 in S1. Price = money string ≥ `0.00`. The same groups link to every variant. `basePrice` = lowest variant price. Optional `Idempotency-Key` (DR-017) | `menu:write` |
| PATCH | `/api/menu/items/:id` | whole form + `updatedAt` from the item you loaded → `MenuItem`. Older `updatedAt` → 409 `MENU_ITEM_STALE`, `data.details` = the item as stored now. `variants: [{ id?, name, price }]` is the new active set: listed ids updated (and re-activated), new ones added, missing ones deactivated (`isAvailable: false`, never deleted — old order lines keep them; new orders get `ITEM_UNAVAILABLE`). `modifierGroupIds` omitted → current links kept. `imageKey` omitted → photo kept, `null` → removed, `tmp/…` → replaced, the current key → kept, any other value → 400; the replaced / removed object is deleted after the save. Order lines keep `unit_price_snapshot`. A mark-(un)available also moves `updatedAt` | `menu:write` |
| POST | `/api/menu/categories` | `{ name }` → `MenuCategory` (201), last in order | `menu:write` |
| PATCH | `/api/menu/categories/:id` | `{ name?, isActive? }` → `MenuCategory`. `isActive: false` hides the category and its items on every menu surface | `menu:write` |
| PUT | `/api/menu/categories/order` | `{ ids }` — every visible category once (hidden ones may be left out and go last) → `MenuCategoryList` | `menu:write` |
| DELETE | `/api/menu/categories/:id` | → `{ ok: true }`. 409 `CATEGORY_NOT_EMPTY` while it holds any item (hide it instead) | `menu:write` |
| GET | `/api/menu/modifier-groups` | → `{ items: ModifierGroupAdmin[] }`: active groups by name, `{ id, name, isRequired, minSelect, maxSelect, usedByItems, options: [{ id, name, priceDelta, isAvailable }] }`. Options include switched-off ones (`isAvailable: false`), in the order they were added. `usedByItems` = menu items whose active variants link the group | `menu:read` |
| POST | `/api/menu/modifier-groups` | `{ name, isRequired, minSelect, maxSelect, options: [{ name, priceDelta }] (≥ 1) }` → `ModifierGroupAdmin` (201). Rules (400 otherwise): `isRequired` ⇒ `minSelect ≥ 1`, not required ⇒ `minSelect = 0`; `maxSelect ≥ max(minSelect, 1)` and `≤` the option count; `priceDelta` money string ≥ `0.00` | `menu:write` |
| PATCH | `/api/menu/modifier-groups/:id` | whole form, `options: [{ id?, name, priceDelta }]` = the new active set: listed ids updated (and re-activated), new ones added, missing ones switched off (`isAvailable: false`, never deleted). An option id of another group → 400; archived / unknown group → 404. A switched-off option can't be ordered (`POST …/orders` → 400 `VALIDATION_ERROR`); existing order lines keep their option name and price. Last write wins (no stale check) | `menu:write` |
| DELETE | `/api/menu/modifier-groups/:id` | → `{ ok: true }`. **Archives** the group (DR-024: `is_active = false`; rows stay for old orders; no restore — create a new one). 409 `MODIFIER_GROUP_IN_USE` while any menu item links it (unlink it via `PATCH /menu/items/:id` first); archived / unknown → 404. An archived group can't be linked: `POST` / `PATCH /menu/items` with its id → 400 | `menu:write` |
| GET | `/api/public/menu` | customer QR menu (available only) | visit session |

**Photo storage env (DR-020):** `AWS_REGION` and `S3_BUCKET` are required to boot; `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` are for local dev only — leave them unset on ECS (task role). The `tmp/` prefix needs a 1-day lifecycle rule (abandoned uploads); the bucket CORS must allow `POST` from the web origin. The key / task role needs `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on `<bucket>/*` and `s3:ListBucket` on the bucket (without `ListBucket` S3 answers 403, not 404, for a missing object, and attaching a photo fails with 500). Values are never logged.

### Tables & visits
| Method | Path | Purpose | Permission |
|---|---|---|---|
| GET | `/api/tables` | floor: seats (`kind`: table \| counter) + current visit summary (state, total, `paymentPending`) | `tables:read` |
| POST | `/api/tables/:id/qr/regenerate` | new signed QR token, old one invalid (FRD §3); reprint = same token, client-only | `tables:manage` |
| POST | `/api/visits` | open visit `{ tableSeatId }` — first write wins, second attaches (FRD §3) | `visits:open` |
| GET | `/api/visits/:id` | visit detail: orders, `bill` (`total`, `paid`, `remaining`, `locked`), `payments[]` grouped by attempt | `visits:read` |
| POST | `/api/visits/:id/close` | close (409 if payment in flight) | `visits:close` |
| GET | `/api/public/qr/:token` | resolve table QR → table + visit session | public, rate-limited |
| POST | `/api/public/visits/:id/call-staff` | customer bell | visit session |

### Orders
| Method | Path | Purpose | Permission |
|---|---|---|---|
| POST | `/api/visits/:visitId/orders` | place order (items, variants, modifiers, `orderedByName`, notes). Optional `Idempotency-Key`. | `orders:create` |
| GET | `/api/orders/:id` | one order and all of its tickets, including the charge ticket | `orders:read` |
| GET | `/api/tickets` | station queue (`?status`, `?visitId`, `?escalated=true`). Default `pending,accepted,ready`. `escalated=true` returns only `issue` tickets already sent to the POS. Charge tickets excluded. | `orders:read` |
| POST | `/api/tickets/:id/accept` · `/ready` · `/send` | ticket transitions (DR-013). `ready` only when the kitchen screen is on and the seat is a table. | `orders:update_status` |
| POST | `/api/tickets/:id/flag-issue` | `{ reason: out_of_stock \| equipment \| other, itemId?, note? }` from `pending`, `accepted`, or `ready` → `issue`. `other` requires `note`. `itemId` must be an active line of this ticket. Emits `ticket.status_changed`. | `orders:update_status` |
| POST | `/api/tickets/:id/resolve` | `{ resolution: substitute \| escalate, note? }`. `escalate` keeps `issue` and emits `ticket.issue_escalated` once. `substitute` returns to `accepted` and clears the issue. | `orders:update_status` |
| POST | `/api/order-items/:id/cancel` | cancel item (stays visible, struck through) — BRIEF-018 | `orders:void` |
| POST | `/api/public/visits/:id/orders` | customer QR order | visit session |

### Payments
| Method | Path | Purpose | Permission |
|---|---|---|---|
| POST | `/api/visits/:visitId/payments` | create one merged attempt `{ method: promptpay \| cash, mode: merge }` + optional `Idempotency-Key`. Locks the current remaining amount. `split_equal` → BRIEF-023 | `payments:create` |
| GET | `/api/payments/:id` | one payment (poll fallback to `payment.status_changed`) | `payments:read` |
| POST | `/api/payments/:id/cancel` | pending → cancelled, `statusReason: staff_cancel` | `payments:create` |
| POST | `/api/payments/:id/mark-paid` | `{ via: manual \| cash, reason?, note? }`. `manual` requires `webhook_missing` \| `direct_transfer` \| `other`; `other` requires `note`. `cash` needs no reason | `payments:mark_paid` |
| POST | `/api/webhooks/payments/:provider` | gateway confirm — BRIEF-026. Slip scan — BRIEF-025 | signature |

### Reports (owner dashboard, CD-05 — BRIEF-036)
`from` / `to` are **business dates** `YYYY-MM-DD` (venue cut-off, Asia/Bangkok — DR-014 #4), inclusive, `from ≤ to`, at most 92 days. A bad query → 400 `VALIDATION_ERROR` (no field paths — DR-021 B; the shared `ReportsPeriodQuerySchema` / `ReportItemsQuerySchema` give them to the UI). No per-person fields (CD-05 D3).

| Method | Path | Purpose | Permission |
|---|---|---|---|
| GET | `/api/reports/summary?from&to` | `revenue` (completed payments by `paidAt`), `bills` (visits closed), `averageBill` (revenue ÷ bills, ฿0 bills left out), `payments.{promptpay,cash}.{amount,count}`, `manualConfirmations`, `previous` = same length right before | `reports:read` |
| GET | `/api/reports/daily?from&to` | `items[{ date, revenue, bills }]` — every date, zeros filled, ascending | `reports:read` |
| GET | `/api/reports/items?from&to&sort=top\|bottom&limit=5` | `items[{ menuItemId, name, quantity, revenue }]`, limit 1–20. Active lines of orders in the period, revenue = `unitPriceSnapshot × quantity`, charge items excluded. `top` by revenue; `bottom` by quantity, includes 0 sales, skips unavailable items and items added < 7 days ago | `reports:read` |
| GET | `/api/reports/today` | `businessDate`, `revenue`, `bills`, `hourly[24]` (first bucket = cut-off hour), `openSeats[{ seatLabel, openedAt, total }]` oldest first, `pendingTickets` (station queue), `escalatedIssues`, `generatedAt`. No WS event — refetch | `reports:read` |

Comps / voids (`/api/reports/comps-voids`) → with BRIEF-018.

### Later in Phase 1 (catalogued when their CD/brief starts)
Notifications feed (`/api/notifications`, DR-003) · guest profile + AI summary · bottle keep · restock requests · IAM admin.

---

## 3. Decisions (Field, 2026-09-28)
| # | Decision |
|---|---|
| D1 | **Approved** — machine-readable `code` is part of the **standard envelope** on every response: `''` on success, UPPER_SNAKE on error (§1 Envelope). |
| D2 | **No** URL versioning in Phase 1. |
| D3 | **Yes** — `Idempotency-Key` on order + payment creation only (§1 Idempotency). |
| D4 | **Yes** — menu list returns `basePrice` + `variants[]` (id, name, price, isAvailable); POS shows "from ฿x" when variant prices differ. Seed rule: every orderable item has ≥ 1 variant. |
