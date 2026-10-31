# Handoff — BRIEF-063 Backend: notification feed + live per-person delivery (DR-003)

| | |
|---|---|
| **Implementer** | kj |
| **Date** | 2026-11-01 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-063-notification-feed` |
| **Commit** | `f3c4292` |
| **Status** | Implemented — awaiting audit |

> Created at `Implemented` (one docs commit). Updated once in the PASS commit. Frozen at merge.

## Summary
Built the stored notification feed and live per-person WebSocket delivery layer:
- `notification_type` enum, `notification` table, and indexes (feed and unread)
- `NotificationRecipients` resolver querying IAM effective permissions (active staff with valid memberships at `now`)
- `NotificationsService` persistence (`notify`, `feed`, `unreadCount`, `markAsRead`, `markAllAsRead`) and live socket room `user:{staffId}` emit
- Domain triggers for `order_new` (in `OrderService`), `call_staff` (in `TableSeatService`), and `food_ready` (in `TicketService`)
- REST endpoints under `/notifications` with cursor-based pagination and staff authorization

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `app/backend/test/notifications.e2e-spec.ts` :: AC-1: POS order by staff P creates notification for other holders of orders:update_status, not P, and delivers live on socket |
| AC-2 | ✅ | `app/backend/test/notifications.e2e-spec.ts` :: AC-2: call-staff with reason bill creates rows without guest note; reason transfer creates zero rows |
| AC-3 | ✅ | `app/backend/test/notifications.e2e-spec.ts` :: AC-3: kitchen screen on and /tickets/:id/ready sends food_ready to creator; QR order sends to orders:update_status holders |
| AC-4 | ✅ | `app/backend/test/notifications.e2e-spec.ts` :: AC-4: deactivated staff or expired membership receives no rows |
| AC-5 | ✅ | `app/backend/test/notifications.e2e-spec.ts` :: AC-5: feed pagination, unread-count, PATCH read (own vs foreign), and PATCH read-all |
| AC-6 | ✅ | `app/backend/test/notifications.e2e-spec.ts` :: AC-6: failure inside notify never fails the trigger request (best effort) |
| AC-7 | ✅ | `1763300000000-NotificationFeed.ts` clean migration:run + migration:revert; schema.sql match |

## Gate Evidence (G1)
One row per gate command from the brief. Exact command, run on the commit above.

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/contracts test` | 0 | 16 passed · 123 passed |
| `pnpm --filter @bar/backend lint` | 0 | pass (0 warnings, 0 errors) |
| `pnpm --filter @bar/backend typecheck` | 0 | pass (0 errors) |
| `pnpm --filter @bar/backend test` | 0 | 49 passed · 223 passed |
| `pnpm --filter @bar/backend test:e2e` | 0 | 38 passed (11 in notifications.e2e-spec.ts) |
| migration revert/run: `pnpm --filter @bar/backend migration:revert` && `pnpm --filter @bar/backend migration:run` | 0 | Clean revert & execution of `NotificationFeed1763300000000` |

UI exercised: n/a (backend + events only, feed UI scheduled for subsequent brief)

## Sonar (local scan)
- Scanned commit: `f3c4292` · Quality Gate: n/a (SonarQube stopped; oxlint & check-class-files clean: 0 warnings, 0 errors)
- Remaining issues: none

## Decisions Raised
- None (DR-003 Am. 2 pre-decided in brief)

## Deviations from Brief
- None

## Known Gaps / Follow-ups
- Push tokens, Expo, BullMQ push job → BRIEF-064

## AI Usage
- Agent: Antigravity (Gemini 3.8 Flash)
