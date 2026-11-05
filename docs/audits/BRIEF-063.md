# Audit — BRIEF-063 Backend: notification feed + live per-person delivery (DR-003)

| | |
|---|---|
| **Auditor** | Cowork (Claude, independent session — did not implement, seed-fix or pair on this brief's code) |
| **Assignment** | Brief default (Cowork); no reassignment |
| **Date** | 2026-11-01 |
| **Branch / commit** | `feat/BRIEF-063-notification-feed` · `f3c4292` (handoff commit `508f1aa` on top, docs only) |
| **Depth** | Full |
| **Brief revision** | 1 |
| **Recommendation** | CHANGES REQUIRED  ← Field makes the final call |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence (test / file) | Note |
|---|---|---|---|
| AC-1 | ✅ | `test/notifications.e2e-spec.ts` AC-1 · `order.service.ts:119` · `notification-recipients.ts` `orderNew` | 3 sockets; placer gets nothing; 2 rows. Runs post-commit inside the existing announce `try` |
| AC-2 | ✅ | e2e AC-2 · `table-seat.service.ts` `notifyStaffCall` | `bill` → 1 row, note absent from body; `transfer` → 0 rows |
| AC-3 | ✅ | e2e AC-3 · `ticket.service.ts` `notifyFoodReady` | Creator path + QR fallback; fallback for a creator without `orders:read` matches DR-003 Am. 2 |
| AC-4 | ✅ | e2e AC-4 · `permission-source.typeorm.ts:58-88` | `is_active` + `[valid_from, valid_until)` — same window as `activeGroups` (CD-13 D1) |
| AC-5 | ⚠️ | e2e AC-5 · `notifications.service.ts:150-170, 239-245` | Test passes, but the cursor loses sub-millisecond precision (Finding #3); test rows are 1 s apart so it can't surface |
| AC-6 | ✅ (partial test) | e2e AC-6 (call-staff only) · try/catch in all 3 triggers | Order and ready paths are guarded in code but not tested (S2) |
| AC-7 | ⚠️ | migration `1763300000000-NotificationFeed.ts` = `docs/schema.sql` §11 + indexes ✅ | Gates reported exit 0, but run proof + Sonar missing (#6, #7) and committed OpenAPI is stale → CI will fail (#1) |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope — nothing outside the brief | ✅ | IAM `staffHolding` = brief §7 "add one in the IAM module (no DR)" |
| No unapproved deviations / deps | ✅ | No new dependency; room `user:{id}`, page size 20, `order_new` as pre-decided |
| `PermissionsGuard` only, no inline checks | ✅ | `@AnyStaff()`; ownership via `WHERE recipient_id` (404 on foreign row) |
| `save()` not `update()` on audited entities | ✅ | `notification` is not audited (DR-003); query-builder update in `markAllAsRead` is fine |
| ESM `.js` imports · contracts as source of truth | ✅ | Contracts schemas + `schemaEnumBySqlName.notification_type` added |
| Agent boundaries respected | ✅ | No protected file touched by the executor (schema docs came from the seed) |
| Post-commit notify (brief §6) | ✅ | Verified callers: `place`/`placeAsGuest`, `ready`, `callStaff` all call `notify` outside `@Transactional()` |
| Clean Code (backend.md) | ❌ | Inline object types + `interface` in a class file (#4) |
| OpenAPI (DR-004 Am. 1) | ❌ | `docs/api/openapi.json` not regenerated (#1); params/query/auth description missing (#2) |
| Run proof on the audited SHA | ❌ | Not in handoff (#6) |

## Test Quality
- e2e uses a real DB + real socket clients; AC-1 asserts both delivery and non-delivery (placer socket) — good.
- AC-2 checks the PDPA note is absent — good.
- AC-5 inserts rows 1 s apart, so the cursor precision bug (#3) is invisible. Add a case with two rows inside the same millisecond.
- AC-6 only exercises call-staff. Order and ready paths rely on code reading (S2).
- `notifications.service.spec.ts` mocks the TypeORM repository heavily; acceptable as the e2e covers the real paths.

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Must fix | Med | `docs/api/openapi.json` (0 `/notifications` paths) · CI `.github/workflows` runs `openapi:export && git diff --exit-code docs/api/openapi.json` · **Current:** 4 new endpoints, committed copy stale → G2 will fail. **Updated:** run `pnpm --filter @bar/backend openapi:export`, commit the file. |
| 2 | Must fix | Low | `notifications.controller.ts` (all 4 handlers) · backend.md OpenAPI coverage · **Current:** no auth description, no `@ApiQuery('cursor')`, no `@ApiParam('id')` (UUID). **Updated:** add `description` like `me.controller.ts` ("any active staff; own rows only"), `@ApiQuery({ name: 'cursor', required: false })`, `@ApiParam({ name: 'id', schema: zodToOpenApi(UuidSchema) })` — same pattern as `tickets.controller.ts`. |
| 3 | Must fix | Med | `notifications.service.ts:164-166, 239-242` · **Current:** cursor stores `createdAt.toISOString()` (ms) while `created_at DEFAULT NOW()` is µs. Rows of the same recipient with `created_at` in `[T_ms, T)` of the last row on a page are silently skipped on the next page. **Updated:** keep the cursor as the last row's `id` only and compare against the stored value: `(n.created_at, n.id) < (SELECT created_at, id FROM notification WHERE id = :cursorId)` — exact, still uses `idx_notification_feed`. Add an e2e case with two rows in the same ms. |
| 4 | Must fix | Low | `notifications.service.ts:21, 71-76, 89, 119-124` · backend.md "Types & class API" · **Current:** `interface CursorData` in a class file; the `notify` payload object type is written inline twice; `feed` returns an inline `{ items; nextCursor }`. **Updated:** `notifications.types.ts` with `NotifyInput` (title/body/refType/refId); `feed` returns `NotificationPage` from contracts; `CursorData` goes away with #3. |
| 5 | Must fix | Low | `docs/api/README.md:82, 249` · **Current:** event line still says `notification.created`; notifications listed under "Later in Phase 1". **Updated:** add an endpoint table for the 4 routes (`@AnyStaff`, own rows, 404 on foreign id, page 20) + the event line `notification:new` → room `user:{staffId}` (DR-003 name); drop `notification.created` and the "Later" entry. |
| 6 | Must fix | High | `docs/handoffs/BRIEF-063.md` Gate Evidence · workflow.md §6 G1 · **Current:** no run proof — only migration revert/run. **Updated:** on a fresh start at the fix SHA: `migration:run` ok, backend starts, `GET /api/health` 200, then one real trigger end to end (e.g. guest `call-staff` with `bill` → `GET /api/notifications` shows the row → `unread-count` 1). Record commands + outputs. |
| 7 | Must fix | Med | handoff "Sonar: n/a (SonarQube stopped)" · brief §5 "Local Sonar scan: Required: yes" · **Current:** not run ("not run is never pass"). **Updated:** start SonarQube, `pnpm sonar` on the fix SHA, paste `pnpm sonar:report` (gate + counts + reasons for anything remaining). |
| S1 | Suggestion | Low | `notifications.service.ts:225-237` · malformed cursor is swallowed and returns page 1 → infinite-scroll clients get duplicates. Throw `VALIDATION_ERROR` 400 instead (moot if #3 makes the cursor a UUID — validate it with `requireUuid`). |
| S2 | Suggestion | Low | e2e AC-6 · add the same `notify` rejection spy for `POST /visits/:id/orders` (201) and `/tickets/:id/ready` (200). |
| S3 | Suggestion | Low | `notifications.service.ts:68-84` · `notify` returns `NotificationEntity[]` to other modules (BRIEF-064 will consume). Return the serialized `Notification[]` so no ORM entity crosses the module boundary. |
| S4 | Suggestion | Low | `order.service.ts:119` · `outcome` parameter unused in `notifyNewOrder` → drop it. |
| S5 | Suggestion | Low | `permission-source.typeorm.ts:58-88` · the membership window is now written twice (SQL here, `activeGroups` in TS). One-line WHY comment pointing to CD-13 D1 so both change together. |
| S6 | Suggestion | Low | `modules/notifications/entities/` · other modules keep entities under `infrastructure/persistence/`. Optional move for consistency. |

## Recommendation to Field
Behaviour is right: recipients follow DR-003 Am. 2 exactly, notify runs after commit and never fails the caller, PDPA copy is clean, and the migration matches `schema.sql`. What blocks PASS is (a) one real paging bug (#3 — sub-ms cursor), (b) the stale OpenAPI copy that will fail CI (#1) plus small doc/style gaps (#2, #4, #5), and (c) missing G1 run proof and Sonar evidence (#6, #7). All in scope, ~1–2 h of executor work. Note for Field: `docs/api/README.md` naming convention is `domain.event_name`, but DR-003 fixes `notification:new` — the executor correctly followed DR/brief; #5 just aligns the README.

**Next command:** `fix BRIEF-063 (#1, #2, #3, #4, #5, #6, #7)` in Antigravity

## Evidence Coverage
- Reviewed work SHA: `f3c4292` (seed `e7a07b3`, base `main` `04242b6`)
- Sources/diff inspected independently: full `git diff main...f3c4292` — IAM port/adapter/resolver, notifications module/service/gateway/controller/entity/recipients, order/ticket/table-seat triggers + all their callers (transaction boundaries), migration vs `docs/schema.sql`, contracts schemas/events, `test/notifications.e2e-spec.ts`, unit specs, DR-003 Am. 2, `docs/api/README.md`, CI workflow openapi step.
- Seeded `.e2e-spec.ts` lock: seed commit contains docs only — no seeded e2e to protect. Pre-existing gateway e2e cases in `notifications.e2e-spec.ts` unchanged (only the `describe` title renamed).
- Tests run or independently inspected: **not re-run by auditor** — the linked machine shell has no pnpm/Docker. Relied on handoff exit codes (contracts 123, backend unit 223, e2e 38 files / 11 in this spec) + reading the tests.
- `docs/features/` does not exist in this repo → design.md / INVARIANTS / ui.md checks n/a.
- Written uncommitted; the executor commits it unchanged at PASS (H). Pre-merge summary must verify S..H contains evidence-only changes (§7).
- Repeated blocker: none.

## Sonar (local scan)
- Handoff Sonar section present for the scanned commit = S (or later scan): no — "n/a (SonarQube stopped)" → #7
- Remaining issues have reasons; no unapproved "won't fix"/exclusions: n/a until scanned
- Learning mode respected (Metee fixed his own issues): n/a (KJ brief)

## Re-audit — 2026-11-01 · `b8a1ea3`

**Recommendation:** BLOCKED (evidence only — the code findings are resolved)

| # | Status | Evidence |
|---|---|---|
| 1 | ✅ Fixed | `docs/api/openapi.json` now has `/api/notifications`, `/unread-count`, `/{id}/read`, `/read-all`; `scripts/create-openapi-document.ts` registers `NotificationsController` with a stubbed `NotificationsService` (same pattern as the other controllers). CI's `git diff --exit-code` will confirm it on the PR head. |
| 2 | ✅ Fixed | `notifications.controller.ts` — `description` on all 4, `@ApiQuery('cursor')`, `@ApiParam('id', UuidSchema)`. |
| 3 | ✅ Fixed | `notifications.service.ts` `queryFeedPage` — cursor = last row `id`; `(n.created_at, n.id) < (SELECT sub.created_at, sub.id … WHERE sub.id = :cursorId)` matches the `created_at DESC, id DESC` order exactly. New e2e "AC-5 sub-ms cursor" uses `.500500` / `.500100` on the page boundary — it would fail on `f3c4292` and passes the new query by construction. Also closes S1 (bad cursor → 400 `VALIDATION_ERROR`, unit + e2e). |
| 4 | ✅ Fixed | `NotifyInput` in `notifications.types.ts`; `feed` / `buildFeedPage` return `NotificationPage`; `CursorData` removed. |
| 5 | ✅ Fixed | `docs/api/README.md` — event line lists `notification:new` → room `user:{staffId}` (stale `notification.created` gone); new Notifications endpoint table; removed from "Later". |
| 6 | ❌ Open | `docs/handoffs/BRIEF-063.md` unchanged since `508f1aa` (last touched before the fix). No run proof (fresh start, `migration:run`, `/api/health` 200, one real trigger → feed). The commit message lists #6 but nothing records it. |
| 7 | ❌ Open | Handoff Sonar still "Scanned commit `f3c4292` · n/a (SonarQube stopped)". |
| — | ❌ New (evidence) | Gate Evidence table still reports results for `f3c4292`. The work SHA is now `b8a1ea3` (service, controller, contracts, tests changed) → all 5 brief gates must be re-run and recorded on `b8a1ea3`. |

Suggestions S2–S6 from the first audit remain optional and unchanged. One new note, no action required: a cursor `id` that doesn't exist (or belongs to someone else) makes the subquery return NULL → empty page, no data leak (the outer query still filters `recipient_id`).

**What unblocks PASS:** update the handoff only — no code change — with, on `b8a1ea3`:
1. The 5 gate commands: exit codes + counts.
2. Run proof: fresh backend start → `migration:run` ok → `GET /api/health` 200 → guest `call-staff` (`bill`) → `GET /api/notifications` shows the `call_staff` row → `unread-count` = 1.
3. Sonar: `pnpm sonar` on `b8a1ea3`, with the `pnpm sonar:report` output (gate + counts + reason for anything remaining).

If all three are clean, the next re-audit is a quick evidence check.

**Next command:** `fix BRIEF-063 (#6, #7)` in Antigravity — handoff evidence on `b8a1ea3` only

### Evidence Coverage (re-audit)
- Reviewed work SHA: `b8a1ea3` · diff `f3c4292..b8a1ea3` read in full (app code, tests, contracts, OpenAPI script, README; spot-checked `openapi.json` paths).
- Tests: not re-run by the auditor (linked machine has no pnpm/Docker); the fixed tests were read and checked against the old code.

## Re-audit 2 — 2026-11-01 · `b8a1ea3` (handoff evidence, uncommitted)

**Recommendation:** PASS  ← Field makes the final call (see the note on timing below)

No code change since re-audit 1 (`git diff b8a1ea3 HEAD` empty; only `docs/handoffs/BRIEF-063.md` modified in the tree).

| # | Status | Evidence |
|---|---|---|
| 6 | ✅ Fixed | Handoff "Real-Runtime Run Proof": `migration:run` exit 0 · `node dist/main.js` → `GET /api/health` 200 `db: up` · guest `POST /api/customer/sessions` 201 → `call-staff` `bill` 201 → `GET /api/notifications` 1 × `call_staff` ("C1 เรียกพนักงาน" / "เช็คบิล", no guest note) → `unread-count` 0 → 1 → `PATCH :id/read` 200 → 0. A real trigger end to end, not just a 200. `dist` rebuild is implied: `openapi:check` = `nest build` + export, and it passes with the `b8a1ea3`-only controller decorators. |
| 7 | ✅ Accepted | Scan recorded: gate ERROR on `new_coverage` 0 % (known carry-over: no coverage report path in `sonar-project.properties`) and `new_violations` 23 (H 7 · M 8 · L 8), each given the written reason "pre-existing, outside notifications" with files named. That meets workflow §6 ("gate passes **or** every remaining issue has a written reason"). None of the files listed are ones this brief touched (`order.service.ts`, `ticket.service.ts`, `table-seat.service.ts`, `permission-source.typeorm.ts`, `modules/notifications/**`). |
| Gates | ✅ | All 5 brief gates + `openapi:check` + migration revert/run recorded for `b8a1ea3`. Counts match the fix diff: unit 223 → 225 (+2 service specs), e2e notifications 11 → 12 (+ sub-ms cursor). |

**Note for Field (timing — not blocking):** the scan's `.scannerwork/report-task.txt` is from 00:53 local, the run proof's timestamps are from 01:02, and `b8a1ea3` was committed at 01:06. So the evidence was produced on the working tree just before it became `b8a1ea3`, not on a fresh checkout of the SHA. The counts above match `b8a1ea3`'s content exactly, so I'm treating them as the same tree. If you want this to be strict, the executor can re-run `test:e2e` + the health check after `ship` and add one line.

**Not independently verified by the auditor:** SonarQube (`localhost:9000`) and pnpm/Docker can't be reached from the linked shell, so the issue list and gate exits rely on the handoff. Field reads the Sonar result in the PR (workflow §6).

**Suggestions still open (optional, no scope change):** S2 (AC-6 for the order + ready paths) · S3 (`notify` returns `Notification[]` before BRIEF-064 depends on it — cheapest to do now) · S4 (unused `outcome` param) · S5 (WHY comment on the duplicated membership window) · S6 (entity folder).

**Next command:** `ship BRIEF-063` in Antigravity

### Evidence Coverage (re-audit 2)
- Reviewed work SHA: `b8a1ea3` (unchanged) · read: the uncommitted handoff diff, `.scannerwork/report-task.txt` timestamp, `app/backend/package.json` `openapi:check` script, `sonar-project.properties`.
- Handoff + this audit stay uncommitted for the executor's PASS commit (H); the §7 pre-merge check verifies `S..H` = audit/handoff/state only.

## Field decision — 2026-11-01 01:13 · suggestions accepted

Field accepted **S2–S6** as required before ship (in session: "accept suggestion" → "All S2–S6"). They become Must fix #8–#12. Re-audit 2's PASS is superseded → **CHANGES REQUIRED**. No scope change: all five sit inside files this brief already touches.

| # | From | Current → Updated |
|---|---|---|
| 8 | S2 | `test/notifications.e2e-spec.ts` AC-6 covers call-staff only → add the same `notify` rejection spy for `POST /api/visits/:id/orders` (expect 201 + order saved) and `POST /api/tickets/:id/ready` (kitchen screen on; expect 200 + ticket `ready`). |
| 9 | S3 | `notifications.service.ts` `notify(): Promise<NotificationEntity[]>` → `Promise<Notification[]>` (return what `broadcastNotifications` already serializes), so no ORM entity leaves the module before BRIEF-064 builds on it. Update the unit spec. |
| 10 | S4 | `order.service.ts` `notifyNewOrder(outcome, order)` → `notifyNewOrder(order)`; `outcome` is unused. |
| 11 | S5 | `permission-source.typeorm.ts` `staffHolding` → one-line WHY comment: the `valid_from <= now < valid_until` window must match `activeGroups` in `domain/effective-access.ts` (CD-13 D1). |
| 12 | S6 | `modules/notifications/entities/notification.entity.ts` → `modules/notifications/infrastructure/persistence/notification.entity.ts` (same layout as other modules); update imports, `TypeOrmModule.forFeature`, and specs. |

Evidence after the fix (new work SHA): the 5 brief gates + `openapi:check` (should stay clean: no contract change), plus a short run proof (boot → `/api/health` 200 → one trigger → feed). Sonar re-scan on the new SHA, with the same written reasons for pre-existing issues. **Run the gates, the run proof and the Sonar scan after the commit, on that SHA** (this avoids the timing note from re-audit 2).

**Next command:** `fix BRIEF-063 (#8, #9, #10, #11, #12)` in Antigravity

## Re-audit 3 — 2026-11-01 · `d67200e`

**Recommendation:** PASS  ← Field makes the final call

`git diff b8a1ea3 d67200e` = 7 app files (+75 / −16). The app tree is clean; only the handoff (modified) and this audit (new) are uncommitted.

| # | Status | Evidence |
|---|---|---|
| 8 | ✅ Fixed | `test/notifications.e2e-spec.ts` AC-6: call-staff 201 → POS order 201 + `order_record` row exists → ticket ready 200 + `order_ticket.status = 'ready'`. One `mockRejectedValueOnce` per path, `toHaveBeenCalledTimes(1/2/3)` shows each path really hit the failing `notify`, and the spy is restored at the end. |
| 9 | ✅ Fixed | `notifications.service.ts` `notify(): Promise<Notification[]>`; `broadcastNotifications` serializes once and returns the same objects it emits. The unit spec asserts `createdAt` is an ISO string. |
| 10 | ✅ Fixed | `order.service.ts` `notifyNewOrder(order)`. |
| 11 | ✅ Fixed | `permission-source.typeorm.ts:58` — WHY comment ties the window to `activeGroups` (CD-13 D1). |
| 12 | ✅ Fixed | Entity moved to `notifications/infrastructure/persistence/` (git rename, 93 % similarity); no `entities/notification.entity` import left anywhere in `app/`. |
| Evidence | ✅ | Gates + `openapi:check` recorded for `d67200e`. Counts are unchanged and that is consistent with the diff: no new `it` blocks (AC-6 was extended, the unit spec gained an `expect`). Run proof timestamps are 01:35 local, and `.scannerwork/report-task.txt` is from 01:38 — **both after the 01:29 commit**, so the re-audit 2 timing note is closed. Sonar: same 23 pre-existing issues with written reasons, 0 in files this brief touched. |

Every Must fix (#1–#12) is closed. There are no open Suggestions.

**Limit (unchanged):** the auditor can't reach pnpm/Docker/SonarQube from the linked shell, so gate exits and the Sonar list rely on the handoff. Field reads the Sonar result in the PR.

**Next command:** `ship BRIEF-063` in Antigravity

### Evidence Coverage (re-audit 3)
- Reviewed work SHA: `d67200e` · full `b8a1ea3..d67200e` app diff, grep for stale entity imports, `order_record` table name vs `docs/schema.sql:381`, handoff diff, scanner timestamp vs commit time.
- At `ship`: the PASS commit H must contain only `docs/audits/BRIEF-063.md`, `docs/handoffs/BRIEF-063.md` and state (§7).
