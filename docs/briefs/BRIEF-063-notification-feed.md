# BRIEF-063 — Backend: notification feed + live per-person delivery (DR-003)

| | |
|---|---|
| **Status** | Ready — Rev 1 approved by Field 2026-10-31 (in session) |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **PR** | <executor fills> |
| **Affected apps** | backend, contracts |
| **Revision** | 1 |
| **Depends on** | **schema docs edit** (Cowork, Field-approved) adding `notification_type` + `notification` to `docs/schema.sql` / `docs/erd.html` — done in this brief's seed |
| **References** | **DR-003** (+ Amendment 1, **Amendment 2**) · DR-014 #11 · DR-009 Notifications table · IAM (BRIEF-053 effective permissions) · `modules/notifications/*` |
| **Audit depth** | Full (new table, recipients from IAM) |
| **Size** | ~0.5 day · ~500–700 lines incl. tests |

---

## 1. Goal
Every new order, staff call and ready ticket becomes a stored notification for exactly the right people, delivered live to each person's open screens and readable later — the base that push (BRIEF-064) sends from.

## 2. Scope
### In
- **Migration** `notification_type` enum + `notification` table exactly as DR-003 (with `order_new` replacing `qr_order_new` — Amendment 2) and its two indexes.
- **`NotificationsService.notify(type, recipients, { title, body, refType, refId })`**: insert one row per recipient (one transaction), then emit `notification:new` to each recipient's room `user:{staffId}`; returns the rows (BRIEF-064 enqueues push from here).
- **Recipients resolver** `NotificationRecipients` (Amendment 2 rules) on top of the IAM effective-permission query: active staff only, memberships valid now; `order_new` excludes the placer.
- **Gateway:** on admit, also `socket.join('user:' + user.id)` (rooms `pos`, `staff` unchanged).
- **Triggers** (domain services call `NotificationsService`, never the gateway — DR-003 rule):
  - `order_new` — `OrderService` after an order is placed (POS or QR): title "ออเดอร์ใหม่ · {seat}", body "{n} รายการ", ref `order`/orderId.
  - `call_staff` — `TableSeatService.callStaff` (reasons `bill` / `other`; **not** `transfer`): title "{seat} เรียกพนักงาน", body reason text (no guest note — PDPA), ref `table_seat`/seatId.
  - `food_ready` — `TicketService.ready` (only exists when the kitchen screen is on): title "ออเดอร์ #{n} พร้อมเสิร์ฟ", body "{seat}", ref `order`/orderId.
- **Endpoints** (any staff, own rows only): `GET /notifications?cursor=` (20 per page, newest first) · `GET /notifications/unread-count` · `PATCH /notifications/:id/read` · `PATCH /notifications/read-all`.
- **Contracts:** `NotificationTypeSchema`, `NotificationSchema`, `NotificationPageSchema`, `UnreadCountSchema`, event `NOTIFICATION_NEW = 'notification:new'` + payload = `NotificationSchema`.
### Out
- Push tokens, Expo, BullMQ push job → BRIEF-064 · any web or phone feed UI · retention purge · other enum types (idle, restock, …).

## 3. Contract
| Call | Permission | Returns |
|---|---|---|
| `GET /notifications?cursor=` | any staff (`@AnyStaff`) | `NotificationPage { items, nextCursor }` |
| `GET /notifications/unread-count` | any staff | `{ count }` |
| `PATCH /notifications/:id/read` | any staff, own row (else 404) | `Notification` · idempotent |
| `PATCH /notifications/read-all` | any staff | `{ updated }` |
| WS `/staff` → room `user:{id}` | — | `notification:new` (`Notification`) |
- **Schema:** +1 enum, +1 table (DR-003). **Permissions:** none new.

## 4. Acceptance Criteria
- **AC-1** — Given a POS order by staff P with 3 active staff holding `orders:update_status` (incl. P), then exactly 2 `order_new` rows (not P) and each recipient's socket gets one `notification:new`; no other socket gets it.
- **AC-2** — Given a guest `call-staff` with reason `bill`, then one `call_staff` row per active `tables:read` holder; body contains no guest note. Given `transfer`, then **no** rows.
- **AC-3** — Given kitchen screen on and `/tickets/:id/ready`, then `food_ready` goes to the order's creator (holds `orders:read`); given a QR order (no creator), then to `orders:update_status` holders.
- **AC-4** — Given a deactivated staff or an expired membership, then they get no rows.
- **AC-5** — `GET /notifications` returns only the caller's rows, newest first, cursor pages of 20; `unread-count` matches; `PATCH :id/read` on another person's row → 404; `read-all` sets `read_at` once (second call `updated: 0`).
- **AC-6** — A failure inside `notify` never fails the order / call / ready request (logged, caller succeeds) — notifications are best effort.
- **AC-7** — Gates pass; migration up/down clean; `docs/schema.sql` matches the migration.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1–AC-6 | backend e2e (real DB + socket client) | `app/backend/test/notifications.e2e-spec.ts` |
| AC-1–AC-4 | unit (resolver) | `app/backend/src/modules/notifications/**/notification-recipients.spec.ts` |
| AC-7 | command | gates + `migration:run` / `migration:revert` |

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
- Layering: controller → service → repository; Order / Venue modules import `NotificationsModule`, not the gateway.
- AC-6: `notify` runs **after** the triggering transaction commits (post-commit hook or after the service call returns); never inside it.
- Copy is PDPA-safe (DR-003 Amendment 1): seat, order number, item count only.
- Not an audited entity (DR-003).

## 7. Decision Points (Field Guard)
- **Pre-decided:** DR-003 + Amendment 2 (Field 2026-10-31) · schema as DR-003 with `order_new` · room name `user:{staffId}` · page size 20 · no new dependency.
- **Likely DRs:** IAM has no "who holds code X now" query that fits → add one in the IAM module (no DR); anything changing IAM tables → DR.

## 8. Unlocked Protected Files
- `none` (schema docs edited by Cowork in the seed, Field-approved)

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates and evidence; dependency = schema docs edit in the seed
- [x] No unresolved decision blocking the main outcome (DR-003 Am. 2)
- [x] Field explicitly approved this revision (2026-10-31, in session)

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-31 | Initial Draft (Cowork) — Field: push + feed table, recipients by permission |
| 1 | 2026-10-31 | Ready — Rev 1 approved by Field in session ("approve 061–065 Rev 1, DR-003 Am. 2, schema docs + .env.example edit") |
