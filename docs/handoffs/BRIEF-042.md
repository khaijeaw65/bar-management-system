# Handoff — BRIEF-042 Backend: order lines keep their names + stable line order

| | |
|---|---|
| **Implementer** | kj (Claude Code) |
| **Date** | 2026-10-23 |
| **Brief revision** | 2 |
| **Branch** | `feat/BRIEF-042-order-name-snapshot` (seed `d25a4d0`, `main` merged `1007285`; PR opens after audit PASS) |
| **Commit** | Work SHA `ef1151d` |
| **Assigned auditor** | Cowork |
| **Status** | Audit PASS (Cowork, 2026-10-23, S = `ef1151d`) — PR opened with this commit |

## Summary
- **Migration** `1762400000000-OrderLineSnapshots.ts` (registered in `migrations.ts`): adds `order_item.item_name_snapshot`, `variant_name_snapshot` (VARCHAR 200), `line_no` (SMALLINT) and `order_item_modifier.option_name_snapshot` (VARCHAR 200) nullable → backfills in SQL (names from the live `menu_item` / `menu_item_variant` / `modifier_option`; `line_no` = `ROW_NUMBER()` per order by `created_at, id` through the ticket) → `SET NOT NULL`. `down` drops the four columns. Entities updated.
- **Create:** `priceLines` numbers each requested line `lineNo = index + 1` (so the number survives the split into tickets); the names were already on `PricedLine` from the share-locked menu lookup, i.e. the same transaction that reads the prices. `OrderTypeormRepository` writes `itemNameSnapshot`, `variantNameSnapshot`, `lineNo`, `optionNameSnapshot`.
- **Read:** `ORDER_ROWS_SQL` returns names from the snapshots and no longer joins `menu_item_variant` / `menu_item` / `modifier_option`. Order: `o.created_at, o.id, t.created_at, t.station, t.id, i.line_no, m.id` — tickets of one order tie-break on `station` (brief), then `id`; `m.id` makes the modifier order of a line stable too. Response shapes unchanged; reports untouched (live names, DR-022).
- **CLI:** `demo-history` loads the item / variant names with the catalog and writes the snapshots + `line_no` (position of the line in its order across stations).
- **Test stability:** the two full-seed tests in `demo-history-seed.e2e-spec.ts` take a per-test `120_000` ms timeout (`FULL_SEED_TIMEOUT_MS`); config defaults untouched.
- **Docs:** `docs/schema.sql` §6 (unlocked). `docs/erd.html` is Cowork's after merge.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `order-snapshots.e2e-spec.ts` "AC-1": double old-fashioned + add-on, then item / variant / option renamed → `GET /orders/:id`, `GET /visits/:id` (bill) and `GET /tickets` still show the old names; a new order shows the new ones. Run proof below confirms through `PATCH /menu/items/:id` and the POS drawer |
| AC-2 | ✅ | "AC-2": two orders on the DB → `down()`, rename an item, `up()`, `down()`, `up()` → all rows non-null, names = the names at `up()` time, `line_no` = {1,2} / {1}, option name filled. Run proof: migration on dev `bar` (2,326 lines) → 2,326 named, `line_no` 1…3, 0 mismatches vs live names |
| AC-3 | ✅ | "AC-3": 5 lines → `line_no` 1…5 in request order in the DB; 20 reads return byte-identical JSON; items in request order |
| AC-4 | ✅ | full e2e green (23 files / 148); `demo-history-seed` passes with the timeouts and a new "line numbers are exactly 1 … n per order" check; `reports.e2e-spec.ts` raw inserts now set the snapshots |
| AC-5 | ✅ | gates + run proof below |

## Gate Evidence (G1)
Run on `ef1151d` (clean tree). e2e used `bar_test`; the dev backend (see Run proof) was stopped first.

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/backend lint` (oxlint + class-files) | 0 | pass |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 130 passed (37 files) — new `priceLines` case for `lineNo` + names |
| `pnpm --filter @bar/backend test:e2e` | 0 | 148 passed (23 files) |
| `pnpm --filter @bar/backend openapi:check` | 0 | `docs/api/openapi.json` unchanged |
| run proof (below) | 0 | health 200 on the work SHA; rename + POS drawer ✅ |

## Run proof
`pnpm migration:run` (build on the work SHA) on dev DB `bar` → `OrderLineSnapshots1762400000000` executed. `SELECT`: 2,326 `order_item` rows, 2,326 with `item_name_snapshot`, `line_no` min 1 / max 3, 0 rows where a snapshot differs from the live name. Fresh `node --env-file=.env dist/main` on :3001 → `/api/health` **200**. Session for `Field (demo)` minted with a local script (no LINE).

| Step | Result |
|---|---|
| T1 before: 4 lines (ช้างดราฟต์ ฿120, จินโทนิค แก้ว ฿180 / ฿200 / ฿200) | names as ordered |
| `PATCH /menu/items/:id` → item "จินโทนิค (ใหม่)", variant "แก้วใหญ่" | 200; live names changed |
| `GET /visits/:id` for T1 | the three old lines still read **จินโทนิค · แก้ว** |
| `POST /visits/:id/orders` the renamed variant | line reads **จินโทนิค (ใหม่) · แก้วใหญ่** ฿220 |
| POS `/pos/tables` T1 drawer (screenshot in session) | #1–#3 "จินโทนิค", #4 "จินโทนิค (ใหม่)" ฿220, total ฿1,040 |

**Local data touched:** the renamed item / variant were renamed back and my test order #4 (1 order, 1 ticket, 1 line) deleted from dev `bar`; T1 is back to 4 lines (฿800 remaining as before the proof). The migration on `bar` stays applied. **Processes:** Field's `nest start --watch` (pid 10896, owned :3001 and respawned itself from `dist` — its respawn ran pre-migration code and returned a 500 on the first order) was stopped; a plain `node dist/main` of the work SHA now runs on :3001. SonarQube containers untouched.

## Sonar (local scan)
- Scanned commit: `ef1151d` · Quality Gate: **ERROR** — `new_coverage` 0.0 % (no coverage path, known) and `new_violations` 16.
- Issues by severity: BLOCKER 0 · HIGH 5 · MEDIUM 5 · LOW 6 · INFO 1 (`pnpm sonar:report`).
- **None of the 16 is in a file this brief adds or changes** (listed via the Sonar API: `setup.ts`, `order-query.service.ts`, `sold-out.service.ts`, `payment.service.ts`, `promptpay-payload.ts`, `http-input.ts`, `request-hash.ts`, `seed-menu-catalog.ts`, `menu-availability.ts`, `document.ts`, `auth.ts`, `globals.css`). No exclusions, won't-fix or gate change.
- Who fixed: n/a.

## Decisions Raised
- None. Pre-decided items used exactly: four columns / types / NOT NULL as DR-022 locks, file name `<timestamp>-OrderLineSnapshots.ts`, reports on live names.

## Deviations from Brief
- None needing a DR. Interpretations (auditor please check):
  - **Seed branch was based on `476cce3`, not `main`** (BRIEF-039 had merged since) → merged `main` into the branch (`1007285`) before starting; no conflicts.
  - **Registry:** the new migration is also listed in `providers/database/migrations.ts` (needed for `runMigrations`; the brief names only the file).
  - **`ORDER BY` adds `o.id`, `t.id`, `m.id`** after the brief's `created_at` / `station` tie-break so equal timestamps cannot interleave or reshuffle (modifiers of a line now come back in a stable but not meaningful order — they had no order before).
  - **Backfill inside one order is arbitrary for lines that share `created_at`** (written in one transaction) — the brief's own rule (`created_at, id`). Only "1 … n per order" is guaranteed for pre-migration orders; the AC-2 test asserts exactly that.
  - **`reports.e2e-spec.ts`** raw `INSERT`s gained the snapshot columns (NOT NULL); not named in the brief but required by AC-4.
  - **AC-1 test renames with SQL** (menu API cannot rename add-on options until BRIEF-044); the run proof used `PATCH /menu/items/:id` for item + variant.

## Known Gaps / Follow-ups
- **Size:** 313 net lines in `app/` (tests ≈ 200, incl. the new e2e file 193) vs ~400–500 estimated — under the target.
- `PENDING_ITEM_LINES_SQL` and reports still join live names / ids by design (DR-022).
- BRIEF-040 (rename confirm UI) and BRIEF-044 (add-on rename) are next in queue; `docs/erd.html` + the CLAUDE.md schema-rule line are Cowork / Field-approved edits after merge.

## AI Usage
**High** — Claude Code wrote all code, tests and docs (Field 0 % coding, reviewer mode).

## Review Routing
- Assigned auditor: Cowork
- Audit: **PASS** (`docs/audits/BRIEF-042.md`), zero Must fix; S = `ef1151d`, S..H = audit / handoff / state only. Finding 3 (Suggestion): the AC-2 test does not restore the columns if an assertion between `down()` and `up()` fails — `global-setup` rebuilds the test DB next run; no action here. Findings 1–2 info (restart the dev watch process; Cowork edits `erd.html` + the CLAUDE.md schema-rule line after merge)
- Next command: merge on green `ci` (Field's own PR, §7)
- Work SHA: `ef1151d` · self-check: brief §2–§4 ↔ DR-022 locks ↔ `1762400000000-OrderLineSnapshots.ts` ↔ `schema.sql` §6 ↔ entities ↔ `order.sql.ts` / repository ↔ `order-snapshots.e2e-spec.ts`; no API shape, contract or permission change

## Notes for Reviewer
- Start with the migration (`BACKFILL` statements) and `order.sql.ts` + the `ORDER BY` in `order.typeorm-repository.ts` `rows()`.
- Check that `priceLines` numbers lines before the bucket split (`order.service.ts` `groupTickets` keeps each `PricedLine`, so `lineNo` survives).
