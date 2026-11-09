# Audit — BRIEF-066 Backend: set up seats (add, edit, order, retire) for the back office

| | |
|---|---|
| **Auditor** | Cowork (Claude) — independent session, did not implement/seed/pair on BRIEF-066 |
| **Assignment** | Brief *Assigned auditor*: Cowork (default) |
| **Date** | 2026-11-01 |
| **Branch / commit** | `feat/BRIEF-066-tables-admin-api` · `193c1a4` (audited `S`; `ce523e4` = handoff/state only) |
| **Depth** | Full |
| **Brief revision** | 1 |
| **Recommendation** | CHANGES REQUIRED  ← Field makes the final call |

> Findings describe code and documents, not people. Use "Current → Updated" framing.
> Hard rule: an agent session that implemented, seeded, fixed, or paired on this brief must never run or write this audit.

## Acceptance Criteria
| AC | Met? | Evidence (test / file) | Note |
|---|---|---|---|
| AC-1 | ✅ | `test/tables-admin.e2e-spec.ts` AC-1 — 201, `sortOrder` 7 (last), token ≥ 43, in `/tables` + `/tables/manage`, 1 `CREATE` audit row with `changed_by`, `tables.changed` received | Double-submit of the same create → 500 (see #2) |
| AC-2 | ✅ | e2e AC-2 — `'  t1  '` vs `T1` → 409 `SEAT_LABEL_TAKEN`; label reusable after deactivate | Sequential case only; concurrent case → 500 (#2) |
| AC-3 | ✅ | e2e AC-3 — reversed ids → 0..5; missing / unknown / cross-section → 400 | "nothing changed" after 400 not asserted (S2); holds by code (validate before write) |
| AC-4 | ⚠️ | e2e AC-4 — 409 `SEAT_IN_USE`; deactivate → bell cleared event, gone from `/tables`, scan → 404 `QR_INVALID`, open session → 401 `GUEST_SESSION_INVALID` | Sequential path ✅. Brief §6 "no race with open-table" not met (#1) |
| AC-5 | ✅ | e2e AC-5 — same `qrToken`, back in `/tables`, printed QR starts a session | |
| AC-6 | ✅ | e2e AC-6 — 403 on all 6 admin routes for `tables:read` staff; `/tables` items have no `qrToken` | |
| AC-7 | ⚠️ | Handoff G1: all gates exit 0, `migration:run → revert → run` clean | Not re-run by auditor (see Evidence Coverage) |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope — nothing outside the brief | ✅ | venue module, contracts, migration, OpenAPI script/spec, schema docs (seed) |
| Seeded `.e2e-spec.ts` untouched | n/a | Brief Ready 2026-10-31 under Rev 21 flow (workflow §2 L98) — no seeded e2e; executor-authored `tables-admin.e2e-spec.ts` is allowed |
| Feature `design.md` / `requirements.md` synced | ❌ | No feature folder; the living API doc `docs/api/README.md` not updated (#5) |
| No unapproved deviations / dependencies | ✅ | No manifest changes |
| Locked architecture rules (`CLAUDE.md`) respected | ⚠️ | Transaction boundary does not hold the brief's race constraint (#1) |
| `PermissionsGuard` only, no inline checks | ✅ | `@RequirePermissions('tables:manage')` on all 6 routes |
| `save()` not `update()` on audited entities | ✅ | repository `create`/`update`/`updateSortOrders` all use `repo.save` |
| ESM `.js` imports · `@bar/contracts` source of truth · OpenAPI regenerated | ✅ | `openapi:check` exit 0 per handoff; `ApiEnvelopedOk/Created` include `ApiStandardErrors` |
| Scoped rule file & coding style | ❌ | N+1 loop (#3), `?? ''` fallback (#4); minor style in Suggestions |
| Agent boundaries respected | ✅ | `docs/schema.sql` edit is in the Field-approved seed `b38c07a` |
| Runs in the real runtime — run proof from `S` | ✅ | Built from `193c1a4`, `migration:run`, `/api/health` 200, admin routes 401 unauthenticated — meets backend G1 letter (S1) |

## Test Quality
e2e is black-box against the real app (own `bar_test` DB, `listen(0)`), asserts DB state, audit rows and socket events — good. Gaps: no PATCH happy-path e2e (rename / move section → end of new section) — covered only by unit tests; no e2e for activate-with-taken-label (409); AC-3 doesn't assert the order is unchanged after each 400; no concurrency test for #1/#2. Unit spec mocks only ports (repo, audit, notifications) and checks emitted payloads — acceptable, though it leans on `toHaveBeenCalledWith` rather than return values.

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Must fix | Medium | `app/backend/src/modules/venue/application/table-admin.service.ts:179` + `visit.service.ts:38` + `visit.typeorm-repository.ts:41` · **Current:** deactivate reads `hasLiveVisit` with a plain SELECT (no row lock) then sets `is_active=false`; staff open-table checks `findActiveById` (no lock, outside the insert) and guest `OPEN_FOR_GUEST` never checks `is_active`. Under READ COMMITTED both can commit → inactive seat with a live visit (write skew). Brief §6: "deactivate checks the live visit inside the same transaction (no race with open-table)". **Updated:** serialize on the seat row — deactivate takes `SELECT … FROM table_seat WHERE id = $1 FOR UPDATE` before the live-visit read (new statement → fresh snapshot); visit open paths take `FOR SHARE` on the seat **and** require `is_active` in the same transaction as the insert (staff: lock-check inside `insertOrAttach`'s transaction; guest: `INSERT … SELECT … WHERE EXISTS (SELECT 1 FROM table_seat WHERE id=$1 AND is_active FOR SHARE)`, else existing 409/404). Add one unit/e2e proving open on an inactive seat is refused at insert time. |
| 2 | Must fix | Medium | `table-admin.service.ts:41`, `:116`, `:196` · **Current:** label uniqueness is a pre-check outside the write transaction; a concurrent create/rename/activate (incl. a double-clicked "add seat") hits `uq_table_seat_label_active` → raw `23505` → 500 `INTERNAL_ERROR`. **Updated:** keep the pre-check, and translate a `23505` on `uq_table_seat_label_active` in the repository (typed error, same pattern as `visit.typeorm-repository.ts` `isLiveVisitConflict`) → service maps to `409 SEAT_LABEL_TAKEN`. Unit test for the translation. |
| 3 | Must fix | Low | `persistence/table-seat.typeorm-repository.ts:199` + `domain/table-seat.repository.ts:29` · **Current:** `updateSortOrders` does `findOne` + `save` per id inside a `for` loop (N+1, backend.md "No N+1"); a missing id is silently skipped (`if (seat)`); port signature uses an inline object type (`Array<{ id; sortOrder }>`, rule 7). **Updated:** one `find({ where: { id: In(ids) } })`, set `sortOrder` per entity, one `save(entities)` (keeps AuditSubscriber); count mismatch → throw. Move the item type to `domain/table-seat.types.ts` and reuse it from `table-admin.types.ts`. |
| 4 | Must fix | Low | `table-seat.typeorm-repository.ts:220`, `:183` · contracts `schemas/tables-admin.ts:11` · **Current:** `qr_token` is nullable (`docs/schema.sql:58`, entity `string \| null`) but mapped with `?? ''` / `?? input.qrToken` — core.md anti-pattern #2; a token-less seat would ship `""` and print a dead QR. **Updated:** contract `qrToken: z.string().nullable()` (+ `SeatAdminRecord.qrToken: string \| null`) and map the value as stored; in `create` return `input.qrToken` directly. Regenerate `openapi.json`. |
| 5 | Must fix | Low | `docs/api/README.md` "Tables & visits" table (~L205) and event line L82 · **Current:** the 6 new routes, `SEAT_IN_USE` / `SEAT_LABEL_TAKEN`, and `tables.changed` `{ seatIds }` → room `staff` are not documented. **Updated:** add the rows (path, purpose, `tables:manage`, 409 codes) and the event to the line-82 list — same as BRIEF-063 audit #5. |
| S1 | Suggestion | Low | Handoff Run Proof · **Current:** proof stops at `/api/health` + 401. **Updated:** next time, one authed call (e.g. `GET /api/tables/manage` with a seeded owner cookie) — this brief guards guest QR access. |
| S2 | Suggestion | Low | `test/tables-admin.e2e-spec.ts` AC-3 · **Current:** 400 cases don't re-read the DB. **Updated:** assert order unchanged after the 400s; add a duplicate-id case and a PATCH move-section case. |
| S3 | Suggestion | Low | `table-seat.typeorm-repository.ts:222` · **Current:** `has_live_visit === true \|\| 'true' \|\| 1` + `Boolean(row.is_active)`. **Updated:** pg returns booleans for these expressions — type the row as `boolean` and read directly. |
| S4 | Suggestion | Low | `table-admin.service.ts` `buildReorderAudit` · **Current:** one row, `entityId` = first id, `sort_order.from: null`. **Updated:** put the previous order (ids joined) in `from` so the row is a real before/after. |
| S5 | Suggestion | Low | `venue.module.ts:48`, `table-admin.service.ts:31-32` · **Current:** `TableAdminService` exported but no module imports it; deps named `auditLog` / `notifications`. **Updated:** drop the export; rename to `auditLogService` / `notificationsService` (rule 9, matches `visit.service.ts`). |
| S6 | Suggestion | Low | `table-admin.service.ts:41-43` · **Current:** `calculateNextSortOrder` runs outside the insert transaction → two concurrent creates can share a `sortOrder` (ties break by label — cosmetic). **Updated:** compute it inside `insertSeat` once #1/#2 are touched anyway. Repository file is 287/300 lines — #3 fix should keep it under. |

## Recommendation to Field
The happy paths are solid: contracts match §3, all routes are guarded, audit + events fire after commit, migration guards existing duplicates, and the e2e suite proves AC-1..AC-6 sequentially against the real app. What blocks PASS: (#1) the brief's explicit "no race with open-table" constraint isn't actually enforced — low probability in a small bar, but it's the one constraint this Full-depth brief called out, and the fix is two row locks; (#2) a double-submit turns into a 500 instead of the designed 409; (#3–#5) rule/doc gaps (N+1 loop, `?? ''`, API README). All in scope, ~1–2 h. Field call: #1 touches `VisitService.open` / `OPEN_FOR_GUEST` — inside the brief's §6 intent, so no DR needed unless you prefer to accept the race and defer it (then record it in the brief changelog).

**Next → in Antigravity:** `fix BRIEF-066 (#1, #2, #3, #4, #5)`

## Evidence Coverage
- Reviewed work SHA: `193c1a4` (seed SHA: `b38c07a`; `ce523e4` = handoff + state only, verified `git diff 193c1a4 ce523e4 --stat`)
- Sources/diff inspected independently: full `git diff main...193c1a4` for app code + contracts + migration + schema docs; `table-admin.service.ts`, `table-seat.typeorm-repository.ts`, `tables.controller.ts`, port/types, `venue.module.ts`, migration; cross-checked callers `visit.service.ts` (`open`, `requireActiveSeat`), `visit.typeorm-repository.ts` (`OPEN_FOR_GUEST`, 23505 pattern), `common/openapi/api-enveloped.ts`, `docs/schema.sql:58`, `docs/api/README.md`; e2e + unit spec read in full / by case list.
- Tests run or inspected: **not re-run** — the audit shell on Field's Mac VM has no `pnpm`/Docker and host-arch `node_modules`; relied on handoff G1 (exit codes, counts, migration round-trip, Sonar on `193c1a4`). Executor must re-run all gates + `openapi:check` after the fix.
- Written uncommitted; the executor commits it unchanged at PASS (`H`). Pre-merge check (`/review`) verifies `S..H` contains evidence-only changes (workflow Section 7).

## Sonar (local scan)
- Handoff Sonar section present for the scanned commit = S: yes (`193c1a4`)
- Remaining issues have reasons; no unapproved "won't fix"/exclusions: yes — 18 pre-existing, 0 on touched files; gate ERROR is the known 0 % coverage config gap (tracked in state)
- Learning mode respected: n/a (Field's brief, agent-implemented)

## Re-audit — 2026-11-01 · 8976cad

| | |
|---|---|
| **Auditor** | Cowork (Claude) — same independent audit session; did not write the fix |
| **Audited** | `8976cad` (`fix(BRIEF-066): address audit findings #1–#5`), diff `ce523e4..8976cad` read in full |
| **Recommendation** | CHANGES REQUIRED (Low only, ~30 min) ← Field makes the final call |

### Original findings
| # | Result | Evidence |
|---|---|---|
| 1 | ✅ Fixed | `table-admin.service.ts` `performDeactivation` → `lockForUpdate` (`SELECT … FOR UPDATE`) before the live-visit read; `visit.service.ts` `insertOrAttach` now `@Transactional()` with `lockActiveForShare` (`FOR SHARE` + `is_active`) and the insert on `txHost.tx`; `OPEN_FOR_GUEST` = `INSERT … SELECT … WHERE EXISTS (… is_active … FOR SHARE)`; `LIVE_BY_SEAT` joins active seat. e2e: open on a deactivated seat → 404 at insert time. Lock order is seat-first on both sides → no deadlock path found. |
| 2 | ✅ Fixed | repository `isSeatLabelConflict` (23505 + `uq_table_seat_label_active`) → typed error → service → 409 `SEAT_LABEL_TAKEN` on create / update / activate; unit tests for translate + rethrow. |
| 3 | ✅ Fixed | `updateSortOrders` = one `find(In(ids))` + one `save(seats)`, count mismatch throws; port uses named `SeatSortOrderItem` (domain types). |
| 4 | ✅ Fixed | `SeatAdminSchema.qrToken` nullable; record `string \| null`; mapper reads as stored; `openapi.json` regenerated. |
| 5 | ✅ Fixed | `docs/api/README.md` — 6 rows in *Tables & visits* + `tables.changed { seatIds }` → room `staff`. |
| S2 | ✅ Taken | e2e AC-2/AC-3 now cover activate-with-taken-label 409, PATCH rename 409, PATCH move-section → end of counter, order unchanged after the 400s. |

### New findings (introduced by the fix)
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 6 | Must fix | Low | `persistence/table-seat.typeorm-repository.ts` `findAdminById`, `findActiveByLabel` · **Current:** `this.toAdminSeat(row as unknown as SeatAdminRow)` ×2 — banned by core.md anti-pattern #1. **Updated:** keep the earlier typed form (`const rows: SeatAdminRow[] = await this.txHost.tx.query(…); const row = rows[0]`) or read fields with `common/persistence/row-values.ts` readers. |
| 7 | Must fix | Low | same file, `create` · **Current:** `this.repo.create({ ...input, isActive: true })` — object spread across the domain → persistence boundary (backend.md rule 6). **Updated:** explicit fields (`label`, `kind`, `sortOrder`, `qrToken`, `isActive: true`) as in `193c1a4`. |
| 8 | Must fix | Low | same file, `lockActiveForShare` · **Current:** `kind: row.kind === 'counter' ? 'counter' : 'table'` — any unknown value silently becomes `table` (core.md #2). **Updated:** `TableSeatKindSchema.parse(row.kind)` (throws on bad data) or select the entity via `this.repo` with `lock: { mode: 'pessimistic_read' }` and reuse `toIdentity`. |
| 9 | Must fix | Low | `domain/table-seat.types.ts:43` · **Current:** `class DuplicateSeatLabelException extends Error` inside a `.types.ts` (rule 7: errors live in `{subject}.errors.ts`; lint misses it because `.types.ts` is exempt). **Updated:** move to `domain/table-seat.errors.ts` as `DuplicateSeatLabelError` (house naming for adapter errors, default message kept); update imports. |
| 10 | Must fix | Low | same repository, `CLEAR_STAFF_CALL` · **Current:** the WHY comment ("Lock the ringing row … a second clear waits on the lock, sees no bell, and changes nothing") was deleted while reformatting code outside the findings. **Updated:** restore the comment (fix rounds touch only the listed findings — workflow §3 step 5). |
| S7 | Suggestion | Med | `visit.service.ts` `insertOrAttach` + `visit.typeorm-repository.ts` `insert` · **Current:** the staff open now catches the live-visit `23505` *inside* `@Transactional()`. PostgreSQL aborts the transaction on that error; attach still works only because `findLiveBySeat` / `toView` read through non-transactional repositories (the concurrent-open test in `venue.e2e-spec.ts` relies on this). Any future tx-bound read on the attach path → "current transaction is aborted" 500. **Updated:** make the staff insert `ON CONFLICT … DO NOTHING RETURNING id` like `OPEN_FOR_GUEST`, then read the live visit in the same transaction. |
| S8 | Suggestion | Low | `table-admin.service.ts` (299 lines), repository (287) · **Current:** fix packed object literals / `if`s onto single lines and reformatted untouched SQL to stay under the 300-line limit. **Updated:** at the next touch, move the admin queries into `table-seat-admin.typeorm-repository.ts` and the 3 duplicate `catch (DuplicateSeatLabel…)` blocks into one private helper, instead of compressing. |

S1, S3–S6 from the first audit remain optional.

### Gates
No fix-round gate evidence for `8976cad` is in the repo (correct — fix rounds have no handoff commit, workflow §3 step 5), and the auditor's shell can't run them (see Evidence Coverage above). After #6–#10: executor re-runs all brief gates + `openapi:check`, **including `venue.e2e-spec.ts`** (concurrent open/attach — S7), and reports the new `S` in chat; the ship handoff must carry gate results + run proof from that SHA.

**Next → in Antigravity:** `fix BRIEF-066 (#6, #7, #8, #9, #10)`

## Re-audit — 2026-11-01 · 738f844

| | |
|---|---|
| **Auditor** | Cowork (Claude) — same independent audit session; did not write the fix |
| **Audited** | `738f844` (`fix(BRIEF-066): address audit findings #6–#10`), diff `8976cad..738f844` read in full (app code + specs; no test/docs changes) |
| **Recommendation** | PASS — conditional on the ship handoff's gates (below) ← Field makes the final call |

| # | Result | Evidence |
|---|---|---|
| 6 | ✅ Fixed | `findAdminById` / `findActiveByLabel` back to typed `const rows: SeatAdminRow[]`; no `as unknown as` left in the venue module. |
| 7 | ✅ Fixed | `create` maps `label`, `kind`, `sortOrder`, `qrToken`, `isActive` explicitly. |
| 8 | ✅ Fixed | `lockActiveForShare` → `kind: TableSeatKindSchema.parse(row.kind)` (throws on bad data). |
| 9 | ✅ Fixed | `domain/table-seat.errors.ts` → `DuplicateSeatLabelError` (default message); removed from `.types.ts`; service + repository + specs updated. |
| 10 | ✅ Fixed | WHY comment on `CLEAR_STAFF_CALL` restored. |

No new Must fix. Still open as Suggestions (optional, never block): S7 (staff open catches `23505` inside the transaction — switch to `ON CONFLICT DO NOTHING`), S8 (files at 298 / 296 of 300; `create`'s return literal packed 3 fields per line — split the admin queries into their own repository at the next touch), S1, S3–S6.

**PASS condition (G1 on the final `S`):** the auditor's shell can't run the gates (Evidence Coverage). The `ship` handoff must show, from `738f844` (or the ship SHA), exit 0 for every brief gate + `openapi:check`, with `test:e2e` covering **`tables-admin.e2e-spec.ts` and `venue.e2e-spec.ts`** (concurrent open/attach after the transaction change), `migration:run → revert → run`, Sonar on that SHA, and a rebuilt run proof. Any red → stop, report, re-audit; don't ship. CI (`G2`) on the PR head is checked at `approve merge`.

**Next → in Antigravity:** `ship BRIEF-066`

### Field decision — 2026-11-01 (in session): fix S7 + S8 before ship
Field promoted S7 and S8 to Must fix (#11, #12). Recommendation for `738f844` changes to **CHANGES REQUIRED**; the PASS condition above still applies to the next `S`. Both stay inside this brief: #11 is the transaction boundary that #1 introduced, #12 is structure of files this brief created. No behaviour or contract change → no DR.

| # | Must fix | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 11 | Must fix (was S7) | Med | `visit.typeorm-repository.ts` `insert` + `visit.service.ts` `insertOrAttach` / `attachedVisit` · **Current:** staff open saves the visit inside `@Transactional()` and catches the live-visit unique violation (`23505`); PostgreSQL has already aborted the transaction, and attach works only because `findLiveBySeat` / `toView` use non-transactional repositories. **Updated:** staff insert = raw `INSERT INTO visit (…) VALUES (…) ON CONFLICT (table_seat_id) WHERE state IN ('open','active','idle') DO NOTHING RETURNING <columns>` on `txHost.tx` (same pattern as `OPEN_FOR_GUEST`; `Visit` doesn't extend `BaseEntity`, so no AuditSubscriber stamp is lost). No row returned → `findLiveBySeat` read through `txHost.tx` in the same transaction (new statement → sees the committed winner). Remove the `23505` catch from this path (`isLiveVisitConflict` stays only if another caller uses it, else delete). Proof: `venue.e2e-spec.ts` concurrent open → one 201 + one 200 attached, same visit id; `tables-admin.e2e-spec.ts` open on a retired seat → 404. |
| 12 | Must fix (was S8) | Low | `table-seat.typeorm-repository.ts` (298 lines), `table-admin.service.ts` (296) · **Current:** both files kept under the 300-line limit by packing fields / `if`s onto single lines. **Updated:** (a) new port `domain/table-seat-admin.repository.ts` → `export abstract class ITableSeatAdminRepository` (Rev 22 port rule) with the admin methods: `listAdmin`, `findAdminById`, `findActiveByLabel`, `getMaxSortOrder`, `listByKind`, `create`, `update`, `updateSortOrders`, `lockForUpdate`; adapter `infrastructure/persistence/table-seat-admin.typeorm-repository.ts` takes those methods + `ADMIN_*` / `MAX_SORT_ORDER` SQL + `isSeatLabelConflict` + `toAdminSeat`; bind in `venue.module.ts` `{ provide: ITableSeatAdminRepository, useClass: TableSeatAdminTypeormRepository }`. `lockActiveForShare` and `clearStaffCall` stay on `TableSeatRepository` (used by `VisitService` / bell). (b) `TableAdminService` injects both ports (≤ 5 injections); the 3 duplicate `catch (DuplicateSeatLabelError)` blocks become one private helper. (c) one field / one statement per line again in both files, including the SQL reformatted in `8976cad`. No behaviour change: existing unit + e2e tests stay green with mocks retargeted to the new port. |

**Next → in Antigravity:** `fix BRIEF-066 (#11, #12)`

## Re-audit — 2026-11-01 · 8c67233

| | |
|---|---|
| **Auditor** | Cowork (Claude) — same independent audit session; did not write the fix |
| **Audited** | `8c67233` (`fix(BRIEF-066): address audit findings #11, #12`), diff `738f844..8c67233` read in full |
| **Recommendation** | CHANGES REQUIRED — one formatting item (#13, ~5 min); Field may waive it → `ship` ← Field makes the final call |

| # | Result | Evidence |
|---|---|---|
| 11 | ✅ Fixed | `visit.typeorm-repository.ts` `INSERT_STAFF_VISIT` = `INSERT … ON CONFLICT (table_seat_id) WHERE state IN (…) DO NOTHING RETURNING …`; no row → `{ kind: 'taken' }` → `findLiveBySeat` via `txHost.tx` (same transaction). `23505` catch + `isLiveVisitConflict` + `newRow` removed; all visit reads now go through `txHost.tx`. Owner-reported: `venue.e2e-spec.ts` 7/7 incl. concurrent open/attach. |
| 12 | ⚠️ Mostly fixed | (a) ✅ `ITableSeatAdminRepository` port + `TableSeatAdminTypeormRepository` (178 lines) bound with `useClass`; `lockActiveForShare` / `clearStaffCall` stay on `TableSeatRepository` (180 lines). (b) ✅ one `withDuplicateLabelGuard` helper replaces the 3 catches; service 289 lines, 4 injections. (c) ⚠️ object literals back to one field per line, but the SQL compressed in `8976cad` is still compressed — see #13. |

| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 13 | Must fix (rest of #12c) | Low | `table-seat.typeorm-repository.ts` `CLEAR_STAFF_CALL`, `ACTIVE_SEATS`; `table-seat-admin.typeorm-repository.ts` `ADMIN_SELECT`, `MAX_SORT_ORDER` · **Current:** `FROM … WHERE … AND …` / `SET a, b, c` / `FROM … LEFT JOIN … ON …` packed onto shared lines (as reformatted in `8976cad`). **Updated:** restore the `193c1a4` layout — one clause per line (`FROM`, `LEFT JOIN … ON`, `AND …`, `WHERE`, `FOR UPDATE`), one `SET` column per line. Files are now far from the limit, so nothing forces packing. |

Note (no action): `TableSeatTypeormRepository` / `VisitTypeormRepository` dropped `@InjectRepository` — every read now uses `txHost.tx`, so reads inside a transaction see its own writes. Correct, and why the full e2e suite matters below.

### Gates — owner-reported on `8c67233` (Field, in session, 2026-11-01)
contracts test 0 (138/138) · backend lint 0 (class files OK) · typecheck 0 · unit 0 (263/263) · e2e `venue` 0 (7/7) · e2e `tables-admin` 0 (6/6) · `openapi:check` 0 · migration run → revert → run 0 · run proof `dist/main.js` :3099 → `/api/health` 200, `/api/tables/manage` 401.

**Still needed in the ship handoff (from the final `S`):** the **full** `pnpm --filter @bar/backend test:e2e` (the brief gate — this round changed `VisitTypeormRepository` reads/inserts used by order, customer-session and payment flows, so two files aren't enough), local Sonar scan on that SHA, and a note that `dist/` was rebuilt from that SHA. One authed run-proof call (S1) is still recommended.

**Next → in Antigravity:** `fix BRIEF-066 (#13)` — or, if Field waives #13: `ship BRIEF-066`

## Re-audit — 2026-11-01 · 8446cc7

| | |
|---|---|
| **Auditor** | Cowork (Claude) — same independent audit session; did not write the fix |
| **Audited** | `8446cc7` (`fix(BRIEF-066): address audit finding #13`), diff `8c67233..8446cc7` read in full (2 files, whitespace inside SQL template strings only) |
| **Recommendation** | **PASS** — conditional on the ship handoff's gates (below) ← Field makes the final call |

| # | Result | Evidence |
|---|---|---|
| 13 | ✅ Fixed | `CLEAR_STAFF_CALL`, `ACTIVE_SEATS` (`table-seat.typeorm-repository.ts`) and `ADMIN_SELECT`, `MAX_SORT_ORDER` (`table-seat-admin.typeorm-repository.ts`) back to one clause / one `SET` column per line (`193c1a4` layout). No token changed — whitespace only. |

All Must fix #1–#13 resolved. Open Suggestions (optional, never block): S1 authed run-proof call, S3 raw-row boolean typing, S4 reorder audit `from`, S5 dependency names / unused module export, S6 sort order computed outside the insert transaction.

**Gate evidence grade for this PASS:** owner-relayed (Field, in session) for `8c67233`; none yet for `8446cc7` (whitespace-only on top). The PASS stands on the ship handoff, which must show from the ship SHA: every brief gate exit 0 incl. the **full** `pnpm --filter @bar/backend test:e2e` (not only `venue` + `tables-admin`), `openapi:check`, `migration:run → revert → run`, local Sonar on that SHA, and a run proof from a rebuilt `dist/` (SHA stated). Any red → stop and report; don't open the PR.

**Next → in Antigravity:** `ship BRIEF-066`
