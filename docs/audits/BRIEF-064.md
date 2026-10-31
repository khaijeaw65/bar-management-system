# Audit — BRIEF-064 Backend: push delivery to the staff app (Expo, port + adapter)

| | |
|---|---|
| **Auditor** | Cowork (Claude, Opus 5.5) — independent session; did not seed, implement, fix or pair on BRIEF-064 |
| **Assignment** | Brief → Assigned auditor: Cowork (default); Field `audit BRIEF-064`, 2026-11-01 |
| **Date** | 2026-11-01 |
| **Branch / commit** | `feat/BRIEF-064-push-delivery` · `98b5766` (S) |
| **Depth** | Full |
| **Brief revision** | 1 |
| **Recommendation** | CHANGES REQUIRED  ← Field makes the final call |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence (test / file) | Note |
|---|---|---|---|
| AC-1 | ✅ | `test/push-tokens.e2e-spec.ts` — register, reassign (1 row, new owner + platform), bad format → 400 `VALIDATION_ERROR`, no session → 401 | |
| AC-2 | ✅ | same file — foreign → 204 row stays; own → gone; repeat → 204 | |
| AC-3 | ✅ | `test/push-delivery.e2e-spec.ts` AC-3 — 2 recipients / 3 tokens → 1 send of 3 messages; title/body/`data.refId`/`data.type` asserted | |
| AC-4 | ✅ | same file AC-4 — error ticket deletes token 2 now; delayed `receipts` job exists with 2 ids; failed receipt deletes token 1 | see Finding #6 (test passes a rebuilt map) |
| AC-5 | ✅ | same file AC-5 — real `POST /orders` 201, fake throws → 3 attempts, notification row + token intact | |
| AC-6 | ✅ | `expo-push-sender.adapter.spec.ts` — 150 → 2 send calls, ticket/receipt mapping, access token, import-boundary grep | see Finding #7 |
| AC-7 | ⚠️ skipped with reason | handoff: no device / real Expo token yet | brief allows "skip with reason"; real run proof moves to BRIEF-065 |
| AC-8 | ✅ (reported) | handoff G1: gates exit 0; `migration:run → revert → run` clean | not re-run by auditor (see Evidence Coverage) |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope — nothing outside the brief | ✅ | Extra files are supporting only: `scripts/create-openapi-document.ts` stub, `docs/api/openapi.json`, `providers/config/expo/*` (backend.md config pattern) |
| Seeded `.e2e-spec.ts` files untouched | ✅ n/a | Seed `a9b3deb` contains only the brief + `.env.example`; no seeded e2e — both e2e files are executor-authored |
| Feature `design.md` / `requirements.md` synced | ✅ n/a | Standalone brief, no feature folder; INVARIANTS index empty |
| No unapproved deviations / dependencies | ✅ | `expo-server-sdk ^3.15.0` = brief §7 Pre-decided; lockfile has small unrelated re-resolution (Finding #11) |
| Locked architecture rules (`CLAUDE.md`) respected | ✅ | BullMQ on the existing connection; `NotificationsModule` stays the only emitter |
| `PermissionsGuard` only, no inline checks | ✅ | `@AnyStaff()` on both routes; ownership is a query filter, not a permission check |
| `save()` not `update()` on audited entities | ✅ n/a | `staff_push_token` is not audited (DR-003); `upsert`/`delete` acceptable |
| ESM `.js` imports · `@bar/contracts` · OpenAPI regenerated | ✅ | `RegisterPushTokenSchema` / `PushPlatform` in contracts; `openapi:check` exit 0 |
| Scoped rule file & coding style | ❌ | Finding #1 (application → infrastructure import), #2 (public method holds loop logic) |
| Agent boundaries respected | ✅ | No protected file touched; `.env.example` line is from the Field-approved seed |
| Runs in the real runtime — run proof from S | ✅ (backend scope) | `node dist/main` from the S build: `/api/health` 200, both routes mapped, `PUT` w/o session 401. Real push → BRIEF-065 (AC-7) |

Migration `1763400000000-StaffPushToken` matches `docs/schema.sql` §staff_push_token + `idx_staff_push_token_user` exactly; `down` drops the table (index goes with it).
All three `notify()` callers (`order.service.ts` publish, `ticket.service.ts` notifyFoodReady, `table-seat.service.ts` notifyStaffCall) call it **outside** `@Transactional()` and inside a logging `try/catch`, so an enqueue failure can never roll back an order — the handoff claim holds.

## Test Quality
Tests assert observable state (DB rows, sent messages, delayed jobs, HTTP status) through the real AppModule with only the `PUSH_SENDER` port faked — right boundary. AC-5 drives a real order request, which proves the "order already succeeded" half properly. Gaps are small: AC-4's receipt half bypasses the queued job data (#6), and the adapter's chunk test exercises the mocked chunk helper (#7). `notifications.service.spec.ts` adds one `toHaveBeenCalledWith(result)` on the port double — acceptable as a boundary check.

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Must fix | Med | `notifications/application/push-token.service.ts:2,7,14` — **Current:** an `application/` service imports `StaffPushTokenEntity` from `infrastructure/persistence` and injects a TypeORM `Repository` directly. It is the only `application/*.ts` file in the backend doing this; backend.md *Cardinal rule* + *DO NOT* ("Import `infrastructure/` from `application/`"). **Updated:** add `application/ports/staff-push-token.repository.port.ts` (interface + `STAFF_PUSH_TOKEN_REPOSITORY` Symbol, same shape as `PUSH_SENDER`) with `upsertForStaff`, `deleteOwn`, `findByStaffIds`, `deleteTokens`; implement `StaffPushTokenTypeOrmRepository` in `infrastructure/persistence/`; bind it in `notifications.module.ts`; `PushTokenService` injects the token. Behaviour and tests unchanged. |
| 2 | Must fix | Low | `push-delivery.service.ts:54–63` — **Current:** public `checkReceipts` contains the receipt loop, logging and the dead-token rule inline (backend.md Clean Code: public method = short list of steps; review checklist #1). **Updated:** `const receipts = await this.sender.receipts(...)` → `const dead = this.findDeadTokens(receipts, job.tokenByReceiptId)` (private, holds the loop + warn) → `await this.pushTokens.removeTokens(dead)`. |
| 3 | Must fix (Field, 2026-11-01) | Med | `push-delivery.service.ts:25–28` — **Current:** `RETRY` sets no `removeOnComplete`, so every `send` / `receipts` job (full notification payload + push tokens) stays in Redis forever; one job per notify call grows unbounded on ElastiCache. **Updated:** add `removeOnComplete: { age: 86_400 }` (keep failed jobs — backend.md BullMQ rule). |
| 4 | Suggestion | Low | `push-delivery.service.ts:51,88–100` — **Current:** if the post-send bookkeeping (`removeTokens` / `scheduleReceiptCheck`) throws after Expo accepted the messages, the retry re-sends the whole batch (up to 3× duplicate pushes). Handoff *Known gaps* mentions only the partial-chunk case. **Updated:** add this case to the handoff Known gaps (acceptable at bar scale), or revisit with BRIEF-013 S1/S2. |
| 5 | Must fix (Field, 2026-11-01) | Low | `notification-push.processor.ts:13` — **Current:** dispatch by payload shape (`'notifications' in job.data`). **Updated:** switch on `job.name` (`PUSH_SEND_JOB` / `PUSH_RECEIPTS_JOB`, the brief's named jobs) and throw on an unknown name, so a renamed field can't silently route a job to `checkReceipts`. |
| 6 | Must fix (Field, 2026-11-01) | Low | `test/push-delivery.e2e-spec.ts:105–118` — **Current:** reads the delayed job's ids, then passes a hand-rebuilt `tokenByReceiptId` to `checkReceipts`, so the queued receipt→token map itself is never asserted. **Updated:** `expect(queued.tokenByReceiptId).toEqual({ …: token(1), …: token(3) })` and pass `queued` straight to `checkReceipts`. |
| 7 | Suggestion | Low | `expo-push-sender.adapter.spec.ts:20–31` — **Current:** the SDK mock re-implements `chunkPushNotifications`, so "150 → 2 calls" checks the mock's chunking. **Updated:** keep the real chunk helpers via `vi.importActual('expo-server-sdk')` and mock only the two network methods. |
| 8 | Suggestion | Low | `application/ports/push-sender.port.ts:3–5` — **Current:** `PushData.type: string`, `refType: string \| null`. **Updated:** use the contracts' notification type / ref-type types so the push payload can't drift from the feed. |
| 9 | Suggestion | Low | `push-delivery.service.ts:46,69` (`n`, `t`), `expo-push-sender.adapter.ts:34` (`m`) — **Current:** single-letter lambda names (backend.md Naming). **Updated:** `notification`, `recipientToken`, `message`. |
| 10 | Suggestion | Low | `notifications.service.spec.ts:42` — **Current:** new `as unknown as PushDeliveryService` (core.md #1 lists `as unknown as`; same file already does it for the gateway, so this follows local precedent). **Updated:** Field call — accept as a test-double convention (then record it in `docs/style-notes.md` / core.md), or build the service via `Test.createTestingModule` with `useValue`. |
| 11 | Suggestion | Low | `pnpm-lock.yaml` — **Current:** besides `expo-server-sdk` + its 9 deps, ~6 unrelated lines re-resolve peers (`@vitest/coverage-v8` → `@types/node@24` / `typescript@6`, `eslint-import-resolver-typescript`). **Updated:** confirm CI `pnpm install --frozen-lockfile` is green on the PR; no action otherwise. |
| 12 | Suggestion | Low | `order.service.ts:42` → `publish` → `notify` → `queue.add` — **Current:** the enqueue is awaited before `POST /orders` responds; with Redis down, ioredis' offline queue can stall the response even though the error is caught. **Updated:** no change now; note on the BRIEF-013 S2 (BullMQ connection) follow-up. |

## Recommendation to Field
Solid slice: the port/adapter split is clean (only the adapter imports the SDK, enforced by a test), the migration matches the schema exactly, the queue reuses the BRIEF-013 connection, and the failure isolation from orders is real (callers are outside transactions and catch). Two style/architecture items block PASS: the application service reaching into an infrastructure entity (#1, the one layering break in the backend) and `checkReceipts` not reading as steps (#2). Both are mechanical with no behaviour change. #3 (unbounded completed jobs) is worth taking in the same fix pass — one line. AC-7 is skipped with a reason, which the brief allows; the real device proof is BRIEF-065's.

**Next → in Claude Code:** `fix BRIEF-064 (#1, #2, #3, #5, #6)` — Field added #3, #5, #6 to the fix list (2026-11-01)

## Evidence Coverage
- Reviewed work SHA: `98b5766` (seed SHA: `a9b3deb`; handoff commit `172d493` = handoff + state only)
- Sources/diff inspected independently: `git diff main...98b5766` (29 files) — all `app/backend/src` changes, both e2e files + `fake-push-sender.ts`, adapter spec, config spec, contracts schema + test, migration vs `docs/schema.sql`, `openapi` export script, `package.json`, lockfile; `notify()` callers in order / ticket / table-seat services; queue module
- Tests run or inspected: inspected only — gates, e2e (281 passed) and migration round-trip taken from the handoff G1 table at `98b5766`; not re-run by the auditor (e2e flushes the shared dev Redis; known shared-Redis issue in state Carry over)
- Written uncommitted; the executor commits it unchanged at PASS (`H`). Pre-merge check (`/review`) verifies `S..H` contains evidence-only changes (workflow Section 7).

## Sonar (local scan)
- Handoff Sonar section present for the scanned commit = S: yes (`98b5766`; gate failed on `new_coverage` 0 % — no coverage report configured, known follow-up)
- Remaining issues have reasons; no unapproved "won't fix"/exclusions: yes — 0 of 23 in BRIEF-064 files, all pre-existing (state Follow-ups)
- Learning mode respected: n/a (kj, full-reviewer mode)

## Re-audit — 2026-11-01 · `2d8175e`

| | |
|---|---|
| **Auditor** | Cowork (Claude, Opus 5.5) — same independent audit session; did not write the fix |
| **Fix commit** | `2d8175e` `fix(BRIEF-064): address audit findings #1, #2, #3, #5, #6` (pushed; = `origin/feat/BRIEF-064-push-delivery`) |
| **Scope of `172d493..2d8175e`** | 9 files, all under `app/backend/src/modules/notifications/**` + `test/push-delivery.e2e-spec.ts` — fix commit only, no handoff/state (workflow §3 step 5 ✅) |
| **Recommendation** | **PASS** |

### Findings
| # | Result | Evidence |
|---|---|---|
| 1 | ✅ Fixed | New `application/ports/staff-push-token.repository.port.ts` (interface + `STAFF_PUSH_TOKEN_REPOSITORY`) and `infrastructure/persistence/staff-push-token.typeorm-repository.ts` (matches the repo's `*.typeorm-repository.ts` naming); bound in `notifications.module.ts`. `PushTokenService` now injects the token only. `git grep "infrastructure/" 2d8175e -- 'app/backend/src/modules/*/application/*.ts'` → no hits. `RecipientToken` moved into the port file (types-in-port allowed). |
| 2 | ✅ Fixed | `push-delivery.service.ts` — `checkReceipts` is 3 steps (`receipts` → `findDeadTokens` → `removeTokens`); loop lives in private `findDeadTokens`, placed right after its caller (stepdown). |
| 3 | ✅ Fixed | `RETRY` adds `removeOnComplete: { age: COMPLETED_JOB_TTL_SECONDS }` (24 h, `push.types.ts`), failed jobs kept; AC-3 e2e now asserts the completed job's `opts.removeOnComplete` equals `{ age: 86_400 }`. |
| 5 | ✅ Fixed | `notification-push.processor.ts` routes on `job.name` (`PUSH_SEND_JOB` / `PUSH_RECEIPTS_JOB`) **and** payload shape, otherwise throws `unknown notification-push job: <name>` → BullMQ marks it failed. New `notification-push.processor.spec.ts` covers both routes and both mismatch cases. |
| 6 | ✅ Fixed | AC-4 e2e asserts `queued.tokenByReceiptId` equals `{ receipt-token1: token1, receipt-token3: token3 }` and passes the queued data straight to `checkReceipts`. |

### New observations (Suggestions — no action required for PASS)
| # | Severity | Evidence · Current → Updated |
|---|---|---|
| 13 | Low | `notification-push.processor.spec.ts:13,23–24,33–34` — **Current:** `as unknown as PushDeliveryService` and `toHaveBeenCalledTimes` / `not.toHaveBeenCalled` on the double. For a pure router the only observable outcome is which collaborator ran, so the call assertions are reasonable; the cast is the same convention as #10. **Updated:** fold into the Field decision on #10 (test-double cast convention). |
| 9 | Low (carried) | `push-delivery.service.ts:50,81` still use `n` / `t` — was a Suggestion, not in the fix list; fine to leave. |

Carried Suggestions #4, #7, #8, #10, #11, #12 unchanged (not in Field's fix list).

### Evidence Coverage (re-audit)
- Reviewed work SHA: `2d8175e` (previous S `98b5766`); diff `172d493..2d8175e` read in full.
- Tests: inspected only. The auditor could not run gates on this machine (the shell here is Linux/aarch64 with no `pnpm`, and `node_modules` was installed on macOS, so native tooling won't load); e2e was not run so the shared dev Redis is not flushed.
- **Condition for merge:** the final handoff written at `ship` reports the gate commands (contracts test, backend lint / typecheck / test / test:e2e, `openapi:check`) with exit codes **at `2d8175e`**, and PR CI `ci` is green on `H`. The fix touches no route or DTO, so the existing OpenAPI and run proof stay valid.

**Next → in Claude Code:** `ship BRIEF-064`
