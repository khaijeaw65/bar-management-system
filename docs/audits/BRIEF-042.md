# Audit — BRIEF-042 Backend: order lines keep their names + stable line order

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-23 |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-23 |
| **Branch / commit** | `feat/BRIEF-042-order-name-snapshot` · **S = `ef1151d`** (work) · handoff `d4043e1` · `main` merged at `1007285` (after #81) · seeds `02283dd` / `2726d52` / Rev 2 `d25a4d0` |
| **Depth** | Full (order path, migration with backfill) |
| **Brief revision** | 2 |
| **Recommendation** | **PASS** ← Field makes the final call |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1 | ✅ | Create: `priceLines` copies `itemName` / `variantName` / option `name` from the `OrderableVariant` lookup that already prices the line (same transaction, share-locked) → `OrderTypeormRepository` writes the three snapshots · Read: `ORDER_ROWS_SQL` selects `i.item_name_snapshot`, `i.variant_name_snapshot`, `m.option_name_snapshot` and no longer joins `menu_item_variant` / `menu_item` / `modifier_option` — order, bill and `/tickets` all come from it · e2e renames item, variant and option → old order / bill / tickets keep old names, new order shows new · run proof via `PATCH /menu/items/:id` + POS drawer | |
| AC-2 | ✅ | Migration: add nullable → backfill in SQL (names by join on the FK; `line_no` = `ROW_NUMBER() OVER (PARTITION BY t.order_id ORDER BY oi.created_at, oi.id)`) → `SET NOT NULL`; `down` drops all four · e2e: down → rename → up → down → up, names = names at `up()` time, `line_no` {1,2} / {1}, option filled · dev `bar`: 2,326 rows, 0 mismatches | Backfill order within one pre-migration order is arbitrary (shared `created_at`) — the DR's own rule; accepted |
| AC-3 | ✅ | `lineNo = index + 1` assigned in `priceLines` **before** the station split, so it spans the order · `ORDER BY o.created_at, o.id, t.created_at, t.station, t.id, i.line_no, m.id` — every tie broken · e2e: 5 lines stored 1 … 5, 20 reads byte-identical | `o.id` / `t.id` / `m.id` beyond the brief's tie-break — stricter, accepted |
| AC-4 | ✅ | `demo-history` writes names + `line_no` (new "1 … n per order" check) · the two full-seed tests carry `FULL_SEED_TIMEOUT_MS = 120_000` (Rev 2, test-only, config defaults untouched) · `reports.e2e-spec.ts` raw inserts updated · full e2e 148 / 23 files | |
| AC-5 | ✅ | Handoff on `ef1151d`: lint, typecheck, unit 130, e2e 148, `openapi:check` 0 (no API shape change) · run proof (migration on dev, health 200, rename + POS) · Cowork re-ran backend `tsc --noEmit` + `check-class-files` on `d4043e1` (exit 0) | |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| DR-022 locks | ✅ | four columns, types, NOT NULL exact; reports keep live names (`reports.sql.ts` untouched); `PENDING_ITEM_LINES_SQL` (86 auto-void) keeps live names by design |
| Unlocked protected file | ✅ | `docs/schema.sql` §6 only — three + one column lines with DR-022 comments, matching the migration |
| Migration | ✅ | one file `1762400000000-OrderLineSnapshots.ts`, registered in `migrations.ts` (required for `runMigrations`); reversible; e2e files run serially (`fileParallelism: false`), so the down / up test can't race other suites |
| No API / contract / permission change | ✅ | `openapi:check` clean; response fields unchanged, values now frozen |
| Entities / `save()` | ✅ | `OrderItem` + `OrderItemModifier` gain the columns; writes through existing `save()` paths |
| Sonar | ✅ | none in files this brief adds or changes |
| Size | ✅ | ~295 net app lines (tests ≈ 2/3) — within target |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Info (dev machine) | — | The run proof stopped Field's `nest start --watch` (it respawned from a stale `dist` and returned a 500 on the first order before the migration); a plain `node dist/main` of the work SHA now runs on :3001. Restart the watch process when you next develop; the dev DB keeps the migration applied. |
| 2 | Info (Cowork, after merge) | — | `docs/erd.html` (4 columns) and the CLAUDE.md schema-rule line ("`order_item` name + price snapshots frozen at order time", DR-022) are Field-approved edits — Cowork shows the exact diffs after merge. |
| 3 | Suggestion | Low | The AC-2 test's `finally` releases the runner but doesn't restore the columns if an assertion between `down()` and `up()` throws — later suites in the same run would then fail on NOT NULL / missing columns. Only matters when that test is already failing; `global-setup` rebuilds the test DB on the next run. Optional: `up()` in `finally` when the columns are missing. |

## Recommendation to Field
PASS. Names are captured where the price already is (same locked lookup), the read path no longer touches live menu names, the backfill is pure SQL and reversible, and line order is now fully deterministic — the flake class behind BRIEF-038 F6 is gone. Rev 2's seed-test timeout is in, test-only.

**Next command:** `execute BRIEF-042` (PASS commit: this audit + handoff + state, then PR; Field's own PR — merge once `ci` is green on H and S..H is evidence-only).

## Evidence Coverage
- Reviewed work SHA: `ef1151d` (handoff `d4043e1`; `git diff main...HEAD`)
- Sources inspected independently: migration file + registry, `order.sql.ts`, `order.typeorm-repository.ts` (write + `ORDER BY`), `order-lines.ts` / `order.types.ts`, both entities, `demo-history.ts` / `.types.ts`, `schema.sql` diff, `order-snapshots.e2e-spec.ts` (AC-1–3), `demo-history-seed.e2e-spec.ts` (timeouts), `vitest.config.e2e.ts`, `order.service.spec.ts` addition
- Tests: Cowork re-ran backend `tsc --noEmit` + `check-class-files` (exit 0); oxlint / unit / e2e not re-run (macOS-built binaries) → handoff exits + `ci` on H.
- Run proof: read from the handoff.
- Written uncommitted; the executor commits it unchanged at PASS.
