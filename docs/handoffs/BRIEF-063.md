# Handoff — BRIEF-063 Backend: notification feed + live per-person delivery (DR-003)

| | |
|---|---|
| **Implementer** | kj |
| **Date** | 2026-11-01 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-063-notification-feed` |
| **Commit** | `d67200e` |
| **Status** | Audit PASS |

> Created at `Implemented` (one docs commit). Updated once in the PASS commit. Frozen at merge.

## Summary
Built the stored notification feed and live per-person WebSocket delivery layer:
- `notification_type` enum, `notification` table, and indexes (feed and unread)
- `NotificationRecipients` resolver querying IAM effective permissions (active staff with valid memberships at `now`)
- `NotificationsService` persistence (`notify` returning serialized `Notification[]`, `feed`, `unreadCount`, `markAsRead`, `markAllAsRead`) and live socket room `user:{staffId}` emit
- Domain triggers for `order_new` (in `OrderService`), `call_staff` (in `TableSeatService`), and `food_ready` (in `TicketService`)
- REST endpoints under `/notifications` with cursor-based pagination and staff authorization
- OpenAPI schemas, operation descriptions, `@ApiQuery`/`@ApiParam` decorators, and contracts sync

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `app/backend/test/notifications.e2e-spec.ts` :: AC-1: POS order by staff P creates notification for other holders of orders:update_status, not P, and delivers live on socket |
| AC-2 | ✅ | `app/backend/test/notifications.e2e-spec.ts` :: AC-2: call-staff with reason bill creates rows without guest note; reason transfer creates zero rows |
| AC-3 | ✅ | `app/backend/test/notifications.e2e-spec.ts` :: AC-3: kitchen screen on and /tickets/:id/ready sends food_ready to creator; QR order sends to orders:update_status holders |
| AC-4 | ✅ | `app/backend/test/notifications.e2e-spec.ts` :: AC-4: deactivated staff or expired membership receives no rows |
| AC-5 | ✅ | `app/backend/test/notifications.e2e-spec.ts` :: AC-5: feed pagination, sub-ms cursor boundary, unread-count, PATCH read (own vs foreign), and PATCH read-all |
| AC-6 | ✅ | `app/backend/test/notifications.e2e-spec.ts` :: AC-6: failure inside notify never fails the trigger request (best effort: call-staff, POS order, ticket ready) |
| AC-7 | ✅ | `1763300000000-NotificationFeed.ts` clean migration:run + migration:revert; schema.sql match; openapi:check clean |

## Gate Evidence (G1)
One row per gate command from the brief. Exact command, run on the commit above (`d67200e`).

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/contracts test` | 0 | 16 passed · 123 passed |
| `pnpm --filter @bar/backend lint` | 0 | pass (0 warnings, 0 errors) |
| `pnpm --filter @bar/backend typecheck` | 0 | pass (0 errors) |
| `pnpm --filter @bar/backend test` | 0 | 49 passed · 225 passed |
| `pnpm --filter @bar/backend test:e2e` | 0 | 38 passed (12 in notifications.e2e-spec.ts) |
| `pnpm --filter @bar/backend openapi:check` | 0 | Clean (matches docs/api/openapi.json) |
| migration revert/run: `pnpm --filter @bar/backend migration:revert` && `pnpm --filter @bar/backend migration:run` | 0 | Clean revert & execution of `NotificationFeed1763300000000` |

### Real-Runtime Run Proof (G1)
Fresh start and real trigger end to end on dev DB (`bar`) at commit `d67200e`:
1. **Database Migration:**
   - Command: `pnpm --filter @bar/backend migration:run`
   - Result: Exit 0 (`No migrations are pending`)
2. **Backend Boot & Health:**
   - Server start: `PORT=3012 node --env-file=.env dist/main.js`
   - Health check: `curl -s http://localhost:3012/api/health`
   - Output: `HTTP 200` `{"status":200,"code":"","message":"success","data":{"status":"ok","db":"up"}}`
3. **Initial State:**
   - `GET /api/notifications/unread-count` (Bearer token for staff Field `a6655e92-365c-440e-8484-acbb9808f05b`): `{"count":0}`
4. **Guest Call-Staff Trigger:**
   - Guest scan: `POST /api/customer/sessions` `{ "qrToken": "Ch5Ry8EYXc13aIaEVXKOY_J2QEohPzzXam9fNGTROdQ" }` (Seat C1) → `HTTP 201`
   - Guest call: `POST /api/customer/call-staff` `{ "reason": "bill" }` with `guest_session` cookie → `HTTP 201` `{"calledAt":"2026-10-31T18:35:08.954Z"}`
5. **Feed & Unread Verification:**
   - `GET /api/notifications` → `HTTP 200`, 1 item:
     `{"id":"3a1264d8-0e56-40e5-b74c-f1d9e3772e8a","recipientId":"a6655e92-365c-440e-8484-acbb9808f05b","type":"call_staff","title":"C1 เรียกพนักงาน","body":"เช็คบิล","refType":"table_seat","refId":"806d7245-de5d-4454-aeaa-18c81a7e333a","readAt":null,"createdAt":"2026-10-31T18:35:08.965Z"}`
   - `GET /api/notifications/unread-count` → `HTTP 200` `{"count":1}`
6. **Mark as Read:**
   - `PATCH /api/notifications/3a1264d8-0e56-40e5-b74c-f1d9e3772e8a/read` → `HTTP 200` `readAt: 2026-10-31T18:35:08.988Z`
   - `GET /api/notifications/unread-count` → `HTTP 200` `{"count":0}`

UI exercised: n/a (backend + events only, feed UI scheduled for subsequent brief)

## Sonar (local scan)
- Scanned commit: `d67200e`
- Quality Gate: ERROR (overall project gate, due to pre-existing uncovered code)
- Failed conditions:
  - `new_coverage` LT 80 (actual 0.0) — ERROR (project-wide test coverage report path pending in `sonar-project.properties`)
  - `new_violations` GT 0 (actual 23) — ERROR
- Issues by severity: BLOCKER 0 · HIGH 7 · MEDIUM 8 · LOW 8 · INFO 0
- New issues in BRIEF-063 notification code: **0**
  - All 23 reported issues are pre-existing outside notifications (frontend `PolicyEditor.tsx`, `customer.gateway.ts`, `setup.ts`, `order-query.service.ts`, `request-hash.ts`, `IntentView.tsx`, `MenuSwitch.tsx`, etc., as catalogued in `SESSION_STATE.md`).
  - Oxlint & check-class-files: 0 warnings, 0 errors.

## Decisions Raised
- None (DR-003 Am. 2 pre-decided in brief)

## Deviations from Brief
- None

## Known Gaps / Follow-ups
- Push tokens, Expo, BullMQ push job → BRIEF-064

## AI Usage
- Agent: Antigravity (Gemini 3.8 Flash)
