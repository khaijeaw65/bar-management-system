# Audit — BRIEF-067 Backend: enforce AST class-file check, oxlint config & full abstract-class port migration

| | |
|---|---|
| **Auditor** | Cowork (Claude, session 017KKu82neGELffHrtkENhnW) — did not implement, seed, fix or pair on this brief |
| **Assignment** | Brief §header: Assigned auditor = Cowork (default); fallback reason: none |
| **Date** | 2026-11-01 |
| **Branch / commit** | `feat/BRIEF-067-backend-rules-cleanup` · `ae3347b` (seed `6fce319`; `a39f968` = handoff/state only) |
| **Depth** | Full |
| **Brief revision** | 1 |
| **Recommendation** | CHANGES REQUIRED  ← Field makes the final call |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence (test / file) | Note |
|---|---|---|---|
| AC-1 | ✅ | `app/backend/package.json:17` now `oxlint -c oxlint.json src/ test/ && node scripts/check-class-files.mjs`; `oxlint.json` has max-lines 300 / per-function 40 / depth 2 / no-explicit-any / accessibility / boundary types = error. Auditor re-ran `pnpm lint` at S → exit 0, `class files OK` | |
| AC-2 | ⚠️ | AST checker re-run at S → 0 violations | Met by the checker, but 8 class files now carry `export type {…} from` re-exports (an `ExportDeclaration` the checker does not see) — see #1 |
| AC-3 | ✅ | `notifications.service.ts` injects `NotificationRepository` (`domain/ports/notification.repository.port.ts:25`), no TypeORM import; `git grep InjectRepository` outside `persistence/` → empty | Adapter quality → #4 |
| AC-4 | ✅ | `git grep "Symbol(" app/backend/src` → empty; `git grep "@Inject("` → empty; 20 migrated ports + new `NotificationRepository` are `export abstract class` with `public abstract` methods, bound `{ provide: Port, useClass/useExisting }` | Naming → #5 |
| AC-5 | ✅ (unit/openapi re-run) · handoff (e2e) | Auditor re-ran at S: unit 52 files / 236 tests pass (real Redis), typecheck 0, `openapi:export` → `docs/api/openapi.json` byte-identical. e2e 40 files / 281 tests from handoff (no Postgres in audit sandbox) | e2e diff is token-only (see Rule Check) |
| AC-6 | ✅ | `app/backend/pnpm-lock.yaml` deleted; handoff: `migration:run → revert → run` clean, `/api/health` 200 from rebuilt `dist/main.js` | |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope — nothing outside the brief | ✅ | Work commits touch only `app/backend/**` + handoff/state; no frontend/mobile |
| Seeded `.e2e-spec.ts` files untouched by executor | ✅ | No seeded e2e for this brief (pre-existing regression suite). `git diff 6fce319..ae3347b -- test/*.e2e-spec.ts` = 9 files, only import + `.overrideProvider(TOKEN)`/`app.get(TOKEN)` → class token; zero assertion changes — pre-approved in brief §6 row "E2e harness" |
| Feature `design.md` / `requirements.md` synced | n/a | Standalone brief; INVARIANTS index empty |
| No unapproved deviations / dependencies | ✅ | No manifest dependency change; `package.json` lint script only |
| Locked architecture rules (`CLAUDE.md`) respected | ✅ | |
| `PermissionsGuard` only, no inline checks | ✅ | Controller splits are moves; decorators unchanged (OpenAPI identical) |
| `save()` not `update()` on audited entities | ✅ | `markAllRead` uses QB `.update()` on `notification` — not a `BaseEntity` table, moved as-is |
| ESM `.js` imports · contracts · OpenAPI | ✅ | typecheck green; OpenAPI byte-identical |
| Scoped rule file & coding style | ❌ | #1 shims, #2 max-params, #3 invented fallback |
| Agent boundaries respected | ✅ | `docs/rules/backend.md` + `.field-kit.json` only in seed `6fce319` with `Approved-by: Field (session)`; work commits touch no protected file |
| Runs in the real runtime — run proof from S | ✅ | Handoff: rebuilt `dist/main.js`, `/api/health` 200 (`db: up`); backend-internal refactor, no UI |

## Test Quality
Unit suite green at S (re-run independently). `notifications.service.spec.ts` now mocks the port instead of TypeORM's `Repository` — a real improvement (`as unknown as` count 10 → 5) and it asserts returned data (`readAt`, `nextCursor`, length). Remaining `toHaveBeenCalledWith` checks are on the port boundary, acceptable. No new tests were needed for a behaviour-preserving refactor; the e2e regression suite carries AC-5.

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Must fix | Med | **Internal back-compat re-export shims (core.md anti-pattern #4).** Current: types were moved to `*.types.ts` but the class files re-export them so callers keep the old import path — `common/storage/storage.service.ts:16`, `iam/domain/permission-source.ts:4`, `menu/application/menu-catalog.service.ts:22`, `menu/application/menu-photo.service.ts:8`, `menu/domain/menu-write.repository.ts:5`, `menu/domain/modifier-group.repository.ts:4`, `notifications/notifications.service.ts:19`, `providers/config/storage/config.service.ts:5`, plus alias `notifications/domain/ports/notification.repository.port.ts:41` (`export { NotificationRepository as INotificationRepository }`). Three have zero consumers (notifications.service, storage config.service, the `INotificationRepository` alias). → Updated: delete all 9 re-exports; point each caller at the `*.types.ts` file (consumers: `test/fake-storage.ts`, `order/application/{order.service,order-lines,order.service.spec}.ts`, `iam/**` MembershipRow users ×7, `menu/application/menu-write.service.ts`, `menu/infrastructure/persistence/{menu-write,modifier-group}.typeorm-repository.ts`). Leave pre-existing `order/infrastructure/http/http-input.ts:5` alone (on `main`, out of scope) |
| 2 | Must fix | Low | **New helpers exceed max-params 3 (`backend.md` §8 `[audit]`).** Current: `order/application/sold-out.service.ts:110` `voidTicketGroup(group, now, autoVoided, notVoided, cancelled)` (5) and `cli/seed-menu-catalog.ts:251` `linkVariantGroups(dataSource, variantId, groupNames, groups)` (4), both introduced by this brief to fix `max-depth`. → Updated: `voidTicketGroup` takes `(group, now, outcome)` where `outcome` is a named type in `sold-out.types.ts` holding the three arrays (or returns a per-group result the loop pushes); `linkVariantGroups` takes one named input object |
| 3 | Must fix | Low | **Invented fallback (core.md anti-pattern #2).** Current: `cli/seed-menu-catalog.ts:310` `prices.reduce(…, prices[0] ?? '0')` — an empty price list now silently seeds `'0'` instead of failing (added for a Sonar issue). → Updated: guard `if (!prices[0]) throw new Error('item has no variant prices')` then `prices.reduce(…, prices[0])` |
| 4 | Suggestion | Med | **New adapter returns TypeORM entity instances as domain records** (`backend.md` Persistence: "never leaking TypeORM entity instances"). Current: `notification.typeorm-repository.ts:20,45,57,64` return `repo.save/findOne/getMany` results directly; `markRead` relies on that object being the entity. Behaviour moved verbatim, so not blocking. → Updated: map to `NotificationRecord` with explicit fields and make `markRead(id, recipientId, readAt)` re-read; `res.affected ?? 0` (line 74, moved from service) can stay with the existing behaviour |
| 5 | Suggestion | Low | **Port naming vs rule.** Current: ports are `NotificationRepository`, `Clock`, `OrderRepository`…; `backend.md` Port Pattern says `abstract class I<Name>`, brief §2 says `INotificationRepository`, brief AC-3 says `NotificationRepository`. → Updated: Field picks one convention (no prefix = matches AC-3 + pre-existing `CustomerTabGateway`; `I`-prefix = matches `backend.md`) and either amends `backend.md` or schedules a mechanical rename brief. Do not fix inside 067 |
| 6 | Suggestion | Low | **Port file location.** Current: 15 ports stay at `domain/<x>.repository.ts` / `common/clock.ts` / `application/ports/` instead of `domain/ports/*.port.ts` (brief §8 steps 2–3 mention `(*.port.ts)`). Allowed because those files hold only the class, but the layout is mixed. → Updated: fold the rename into the #5 follow-up |
| 7 | Suggestion | Low | `payment/application/present-payment.ts:64-101` now holds `verifiedRecord` / `completedRecord` / `providerRejection` (record builders + DomainException mapping) beside the presenters. → Updated: move to `payment/application/payment-records.ts` next time payment is touched |
| 8 | Suggestion | Low | `notifications.service.spec.ts:114,132,158` `as unknown as ReturnType<typeof vi.fn>` → `vi.mocked(repo.findPage).mockResolvedValue(rows)` (repo is already typed as the port) |
| 9 | Suggestion | Low | Pre-existing max-params debt (not this brief): ~20 functions with 4–5 params, e.g. `iam/domain/staff-admin.repository.ts:19,27`, `order/application/ticket.service.ts:163`, `order/infrastructure/http/orders.controller.ts:71`, `menu-catalog.mapper.ts:23` (moved verbatim). → Updated: add `max-params: ["error", 3]` to `oxlint.json` in a later cleanup brief so it becomes `[lint]` |

## Recommendation to Field
Solid, wide mechanical refactor: the lint gate is now real (config passed, AST checker), all 20 `Symbol()` ports are gone, `NotificationsService` is off TypeORM, OpenAPI is byte-identical and the unit suite re-runs green independently. It does not PASS yet because the type extraction was done with re-export shims that keep old import paths alive (#1) — exactly the pattern core.md bans and one the new checker cannot see — plus two new 4–5-parameter helpers (#2) and a silent `'0'` fallback in the seed (#3). All three are small, behaviour-free fixes. #5 needs a Field decision but should not block this brief.

**Next → in Antigravity:** `fix BRIEF-067 (#1, #2, #3, #4, #8)` — #4 and #8 added by Field 2026-11-01 (see *Field decisions*)

## Field decisions (2026-11-01, in session)
- **Fix round scope:** Must fix #1–#3 **plus Suggestions #4 and #8** (approved by Field). #4 = `NotificationTypeOrmRepository` maps to `NotificationRecord` with explicit fields (no entity instances returned; `markRead` re-reads by id + recipient). #8 = `vi.mocked(...)` in `notifications.service.spec.ts`. Both become required for PASS at re-audit.
- **Not in this brief:** #6, #7, #9 — stay Suggestions (follow-up / when module is next touched).
- **#5 port naming:** no `I`-prefix stands (matches AC-3 and the 21 ports in code). Executor renames nothing. `docs/rules/backend.md` gets a Field-approved amendment (protected file — exact diff shown to Field; lands with `Approved-by: Field (session)`).

## Evidence Coverage
- Reviewed work SHA: `ae3347b` (seed SHA: `6fce319`); `a39f968` checked = handoff + state only
- Sources/diff inspected independently: `git diff main...ae3347b` (125 files) — scripts/check-class-files.mjs, oxlint.json, package.json, create-openapi-document.ts, all port files, notifications module (port, adapter, service, spec, module), auth/mobile-login split, payment present-payment move, sold-out/order-query/menu-write depth fixes, seed CLI, controller splits + module registration, 9 e2e diffs; AST scans for re-exports and >3 params
- Tests run (auditor, Linux sandbox from a tarball of the checkout at S, `pnpm install --frozen-lockfile`): `pnpm lint` 0 · `typecheck` 0 · `test` 52/52 files, 236/236 (with local Redis) · `openapi:export` byte-identical to committed `docs/api/openapi.json` · contracts 123/123 (enums suite needs `docs/schema.sql`, not copied — env only). Not run: `test:e2e`, migrations, run proof (no Postgres in sandbox) → taken from handoff G1
- Written uncommitted; the executor commits it unchanged at PASS (`H`). Pre-merge check (`/review`) verifies `S..H` contains evidence-only changes (workflow Section 7).

## Sonar (local scan)
- Handoff Sonar section present for the scanned commit = S: yes (`ae3347b`)
- Remaining issues have reasons; no unapproved "won't fix"/exclusions: yes — 0 on touched files; Quality Gate ERROR is the known 0 % coverage config gap (carry-over)
- Learning mode respected: n/a (Field brief, agent executor)

## Re-audit — 2026-11-01 · `ba7f67a`

| | |
|---|---|
| **Auditor** | Cowork (same auditor session; did not write the fix) |
| **Audited commit** | `ba7f67a` (`fix(BRIEF-067): address audit findings #1, #2, #3, #4, #8`) — 29 files, all under `app/backend/` |
| **Recommendation** | CHANGES REQUIRED |

### Findings status
| # | Status | Evidence |
|---|---|---|
| 1 | ✅ Fixed | All 9 re-exports removed; scan for `export … from` in `src/` → only pre-existing `order/infrastructure/http/http-input.ts:5`. Callers now import from `*.types.ts` (`test/fake-storage.ts`, iam ×7, menu ×3, order ×3) |
| 2 | ✅ Fixed | `voidTicketGroup(group, now, outcome: VoidTicketsOutcome)` (`sold-out.service.ts:110`, type in `sold-out.types.ts:15`); `linkVariantGroups(input: LinkVariantGroupsInput)` (`seed-menu-catalog.ts:255`). AST param scan: no new >3-param functions |
| 3 | ✅ Fixed | `seed-menu-catalog.ts:315-316` throws `item has no variant prices` when empty; no `?? '0'` |
| 4 | ⚠️ Fixed with a new defect → #10 | `notification.mapper.ts` maps entity → `NotificationRecord` with explicit fields; all 5 read paths return mapped records |
| 8 | ✅ Fixed | `notifications.service.spec.ts:114,132,158` use `vi.mocked(...)` |

### New finding
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 10 | Must fix | Low | **Silent fake success in `markRead` (core.md anti-pattern #2).** Current: `notification.typeorm-repository.ts` `markRead` re-reads the row and, if it is gone, `return { ...item, readAt }` — the caller gets a "read" notification that was never saved (also an object spread across the persistence boundary). → Updated: port `markRead(...): Promise<NotificationRecord \| null>` returns `null` when the row is missing; `NotificationsService.persistReadTimestamp` throws the existing `DomainException('NOT_FOUND', 'ไม่พบการแจ้งเตือน', 404)` (same code/message as `findRecipientNotification`). Add one unit case for the `null` path |
| 11 | Must fix (evidence) | — | **G1 at the new S.** The fix changes runtime code on the PATCH `/notifications/:id/read` path (covered by `test/notifications.e2e-spec.ts` AC-5), but the only e2e / run-proof evidence is from `ae3347b`. → Updated: after #10, report in chat with the new S: `test:e2e` (files/tests/exit), `/api/health` 200 from a rebuild of that S. Executor still makes fix commits only (workflow §3 step 5); final handoff is written at `ship` |
| 12 | Suggestion | Low | `seed-menu-catalog.ts:255` declares `interface LinkVariantGroupsInput` inline in a function-only CLI file; fine for the checker, but `backend.md` §7 prefers named types in `.types.ts`. Optional |

### Gates re-run by auditor at `ba7f67a` (Linux sandbox, tarball of the checkout)
`@bar/contracts test` 16/16 files, 124/124 · `lint` 0 (`class files OK`) · `typecheck` 0 · `test` 52/52 files, 236/236 (local Redis) · `openapi:export` byte-identical to `docs/api/openapi.json`. Not run: `test:e2e`, migrations, run proof (no Postgres) → required by #11.

**Next → in Antigravity:** `fix BRIEF-067 (#10, #11)`

## Re-audit — 2026-11-01 · `0ff905d`

| | |
|---|---|
| **Auditor** | Cowork (same auditor session; did not write the fix) |
| **Audited commit** | `0ff905d` (`fix(BRIEF-067): address audit finding #10`) — 4 files, notifications module only |
| **Recommendation** | **PASS** |

### Findings status
| # | Status | Evidence |
|---|---|---|
| 10 | ✅ Fixed | `NotificationRepository.markRead` → `Promise<NotificationRecord \| null>` (`notification.repository.port.ts:37-40`); adapter returns `null` when the row is gone (no spread, no fake record); `NotificationsService.persistReadTimestamp` throws `DomainException('NOT_FOUND', 'ไม่พบการแจ้งเตือน', 404)` — same code/message as `findRecipientNotification`. New unit case `markAsRead throws 404 DomainException if markRead returns null` asserts the thrown outcome |
| 11 | ✅ Closed by auditor run | Independent G1 at `0ff905d` (below) — e2e, migration round-trip and run proof all from this SHA |
| 12 | Open — Suggestion | Optional; not required for PASS |
| 4–9 | as recorded | #4, #8 fixed (`ba7f67a`); #5 Field decision (no `I` prefix; `backend.md` amendment pending Field's OK on the shown diff — separate from this brief); #6, #7, #9 stay Suggestions |

### Gates re-run by auditor at `0ff905d` (Linux sandbox; checkout tarball + fix-commit files; local Postgres 17 + Redis)
| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/backend lint` | 0 | oxlint 0 errors · `class files OK` |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 52/52 files · 237/237 tests (+1 new) |
| `pnpm --filter @bar/backend test:e2e` | 0 | 40/40 files · 281/281 tests (incl. `notifications.e2e-spec.ts` AC-5 PATCH read own/foreign + read-all) |
| `openapi:export` vs committed `docs/api/openapi.json` | 0 | byte-identical (checked at `ba7f67a`; `0ff905d` touches no controller/contract) |
| `migration:run → revert → run` (fresh DB `bar_runproof`) | 0 | 18 executed · `StaffPushToken1763400000000` reverted · re-executed |
| Run proof: `nest build` from this SHA → `node dist/main.js` → `curl /api/health` | 0 | HTTP 200 `{"status":200,"code":"","message":"success","data":{"status":"ok","db":"up"}}` |

Seeded/regression e2e: `git diff ba7f67a..0ff905d -- app/backend/test` empty. No new dependencies or protected-file edits in either fix commit.

### Recommendation to Field
All Must fix items (#1–#4, #8, #10) are resolved and every gate is green from the audited SHA, including an independent e2e run and run proof. Remaining items are Suggestions or Field-owned follow-ups (#5 rule amendment, #6/#7/#9 later cleanup, #12 optional).

**Next → in Antigravity:** `ship BRIEF-067` (S = `0ff905d`; commit this report unchanged + final handoff with the `0ff905d` gate table + state)
