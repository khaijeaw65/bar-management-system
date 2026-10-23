# Handoff — BRIEF-044 Backend: add-on groups and options (modifier CRUD)

| | |
|---|---|
| **Implementer** | kj (Claude Code) |
| **Date** | 2026-10-23 |
| **Brief revision** | 2 (Field-approved 2026-10-23, audit F1) |
| **Branch** | `feat/BRIEF-044-modifier-groups-api` (seed `10f801f`, on `main` `b083e38`) |
| **Commit** | Work SHA `b000e4e` (first Implemented `8956838`; fix round `b000e4e`) |
| **Assigned auditor** | Cowork |
| **Status** | Audit PASS (Cowork, 2026-10-23, S = `b000e4e`) — PR opened with this commit |

## Summary
- **Migration** `1762600000000-ModifierGroupArchive.ts` (registered in `migrations.ts`): `modifier_group.is_active BOOLEAN NOT NULL DEFAULT TRUE`; entity + `docs/schema.sql` §4. It adds a column only — no `updated_at` write (BRIEF-043 audit Finding 3).
- **Four endpoints** in a new `ModifierGroupController` / `ModifierGroupService` / `ModifierGroupRepository` (port + TypeORM) in `modules/menu`: `GET` / `POST` / `PATCH :id` / `DELETE :id` on `/menu/modifier-groups`. One transaction per write, `save()` on `modifier_group` / `modifier_option`, the group row `SELECT … FOR UPDATE` on PATCH / DELETE, `menu.changed` after the commit.
  - `GET`: active groups by name, options (active + switched off) ordered `created_at, id`, `usedByItems` = distinct items whose **active** variants link the group.
  - `PATCH`: `options` = the new active set — listed ids updated + re-activated, new inserted, dropped ones `is_available = false` (never deleted); an option id of another group → 400.
  - `DELETE`: group locked `FOR UPDATE`, then linked items counted → > 0 → 409 `MODIFIER_GROUP_IN_USE` ("ใช้อยู่ใน n เมนู — ถอดออกจากเมนูก่อน"); else `is_active = false`. Archived / unknown → 404.
- **Linking guard (DR-024):** `MenuWriteTypeormRepository.missingModifierGroups` is now `SELECT id … WHERE id = ANY($1) AND is_active FOR KEY SHARE` (name kept; doc says it holds the rows). An archived id is "missing" → the existing 400. Item writes (`FOR KEY SHARE`) and archive (`FOR UPDATE`) cannot interleave.
- **Contracts:** `CreateModifierGroupSchema`, `UpdateModifierGroupSchema` (`superRefine`: required ⇒ min ≥ 1, not required ⇒ min 0, max ≥ max(min, 1), max ≤ option count, duplicate option id), `ModifierGroupAdminSchema` (`MenuModifierGroup` + `usedByItems`), list schema, `ErrorCode` `MODIFIER_GROUP_IN_USE`. Prices use `MenuPriceSchema` (money string ≥ 0.00), names 1–200.
- **Order side (Rev 2): no change.** `order-lines.ts` and `order.service.spec.ts` are identical to `main`: a chosen switched-off option still gets 409 `ITEM_UNAVAILABLE` (`sold_out`) from the existing `blockReason`, which the web POS cart handles; a required group with too few active options is caught by the existing count check. (Rev 1 turned this into a 400 — wrong premise, audit F1, reverted in `b000e4e`.)
- **OpenAPI:** `scripts/create-openapi-document.ts` registers the new controller + a stub service so `openapi.json` lists the four paths. `docs/api/README.md` Menu table +4 rows.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `modifier-groups.e2e-spec.ts` "AC-1" — 201, options in input order, `usedByItems` 0 → 1 after an item links it, by-name order |
| AC-2 | ✅ | contracts `menu-write.test.ts` (required min 0, not required min 1, max < min, max > options, max 0, negative price, `"5"`, no options, blank names, active-set count, duplicate id, `id` stripped on create) · service spec (foreign option id → 400, nothing written) · e2e "AC-2" (6 rule violations 400, foreign id 400, unknown 404) |
| AC-3 | ✅ | e2e "AC-3" — PATCH renames ชีส → ชีสเยิ้ม ฿25 and drops เบคอน → `isAvailable: false`, 3 rows kept; the old line keeps ชีส ฿20 / เบคอน ฿15; item read lists เบคอน off; ordering เบคอน → **409 `ITEM_UNAVAILABLE`**; ordering ชีสเยิ้ม → 201 at ฿25 |
| AC-4 | ✅ | e2e "AC-4" — linked → 409 (message names 1), unlink via item PATCH → DELETE 200 → gone from list, `is_active = false`, 3 option rows kept, old line reads ชีส, again → 404, unknown → 404, link in item `PATCH` → 400, in item `POST` → 400; a never-ordered group archives the same way · race test: 5 rounds of `DELETE` ‖ link-PATCH → exactly (200, 400) or (409, 200), never an archived group still linked |
| AC-5 | ✅ | e2e: socket sees `[{itemIds:[item]}, {itemIds:[]}, …]` in order; "AC-5" create + patch + delete = exactly 3 events · service spec (one emit per write, none on failure) |
| AC-6 | ✅ | gates below · `openapi:check` exit 0 · README |

## Gate Evidence (G1)
Re-run on `b000e4e` after the fix round (the table is that run; backend only — contracts, schema and migration unchanged since `8956838`, contracts gates from that run: build / lint / typecheck 0, 79 tests). A first e2e rerun failed one payment-expiry test because my own run-proof backend was still alive on :3001; after stopping it: green. Before: run on `8956838` — the plain `node dist/main` (pid 89993) and the two `nest start --watch` processes in `app/backend` (pids 38196, 7445 — one had respawned the app on :3001 and stole a payment-expiry job in one e2e run) were stopped first; e2e used `bar_test`.

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/contracts build` / `lint` / `typecheck` | 0 | pass |
| `pnpm --filter @bar/contracts test` | 0 | 79 passed (10 files) |
| `pnpm --filter @bar/backend lint` (oxlint + class-files) | 0 | pass |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 137 passed (38 files) |
| `pnpm --filter @bar/backend test:e2e` | 0 | 166 passed (25 files) |
| `pnpm --filter @bar/backend openapi:check` | 0 | `docs/api/openapi.json` matches the committed file |
| run proof (below) | 0 | curl scenario ✅ on `8956838`; health 200 on `b000e4e` |

## Run proof
Run on `8956838`; after the Rev 2 fix only the order-side answer changed (400 → 409, see the "order เบคอน" row), covered by the e2e on `b000e4e`; a fresh backend of `b000e4e` was started on :3001 → `/api/health` 200. The curl scenario was not repeated.

`pnpm migration:run` on dev `bar` → `ModifierGroupArchive1762600000000` executed · `nest build` on `8956838` · fresh `node --enable-source-maps --env-file=.env dist/main` on :3001 → `/api/health` **200** `status=ok`, `db=up`. `curl` (Python) as `Field`: session from `TokenService.createSession` in a local script (no LINE). T1 (open visit `12dbfa1b…`), item จินโทนิค แก้ว ฿220.

| Step | Result |
|---|---|
| `POST /menu/modifier-groups` ท็อปปิ้ง (optional, max 2; ชีส 20 / เบคอน 15 / ไข่ 10) | **201** |
| `PATCH /menu/items/:id` `modifierGroupIds: [group]` → `GET /menu/modifier-groups` | 200 · `usedByItems: 1` |
| `POST /visits/T1/orders` แก้ว + ชีส | **201** · line ชีส ฿20, bill ฿1,060.00 |
| `PATCH` group: ชีส → ชีสเยิ้ม ฿25, drop เบคอน | **200** · options ชีสเยิ้ม 25.00 ✔ / เบคอน 15.00 ✘ / ไข่ 10.00 ✔ · T1 bill still ฿1,060.00, old line still ชีส ฿20 |
| item read (the POS sheet's data) | เบคอน `isAvailable: false` (sheet greys it) |
| order เบคอน | **400** `VALIDATION_ERROR` on `8956838`; **409 `ITEM_UNAVAILABLE`** on `b000e4e` (Rev 2) |
| order ชีสเยิ้ม | **201** · line ฿25 on แก้ว ฿220 (bill ฿1,305.00); old line unchanged |
| `DELETE` group (linked) | **409** `MODIFIER_GROUP_IN_USE` "ใช้อยู่ใน 1 เมนู — ถอดออกจากเมนูก่อน" |
| item `PATCH` `modifierGroupIds: []` → `DELETE` | 200 · 200 · not in `GET /menu/modifier-groups`; T1 lines unchanged (ชีส ฿20, ชีสเยิ้ม ฿25) |
| `DELETE` again | **404** |
| item `PATCH` linking the archived group | **400** `VALIDATION_ERROR` |

**Not exercised on screen:** the web POS needs a LINE sign-in (Field's) — the browser pane was not signed in. The brief changes no UI; the drawer / sheet read the same `GET /visits/:id` and `GET /menu/items` payloads checked above.

**Local data touched:** dev DB `bar` — migration applied; group ท็อปปิ้ง archived (rows kept); item จินโทนิค has no group again; T1 got 2 orders (ชีส ฿220 + ฿20, ชีสเยิ้ม ฿220 + ฿25), still open, bill ฿1,305.00. **Processes:** backend of `b000e4e` left running on :3001; the two `nest start --watch` and the old plain backend were stopped and **not** restarted (restart `pnpm --filter @bar/backend start:dev` if wanted — it takes :3001 and its BullMQ worker, so stop it again before `test:e2e`).

## Sonar (local scan)
- Scanned commit: `10f801f` + this brief's working tree at `8956838` (the fix round only reverts order-module files to `main`) (re-scanned after fixing two S4782 findings in my files) · Quality Gate: **ERROR** — `new_coverage` 0.0 % (no coverage path, known) and `new_violations` 16.
- Issues by severity: BLOCKER 0 · HIGH 5 · MEDIUM 5 · LOW 6 · INFO 1 (`pnpm sonar:report`) — the same 16 as in the BRIEF-043 handoff; none in a file this brief adds or edits. First scan showed 18: two `typescript:S4782` ("redundant `undefined`") in `modifier-group.repository.ts` and `menu-write.ts` — fixed by deriving the option type from the Zod schema. No exclusions, won't-fix or gate change.
- Who fixed: Claude Code (Field, reviewer mode).

## Decisions Raised
- None. Pre-decided items used exactly: the four paths, `MODIFIER_GROUP_IN_USE`, options deactivate / never delete, DR-024 locks (column, archive-only `DELETE`, linking guard with `FOR KEY SHARE` / `FOR UPDATE`, no restore), file name `<timestamp>-ModifierGroupArchive.ts`, deactivated options → 400 `VALIDATION_ERROR`, `menu.changed` payload unchanged, no stale check on groups.

## Deviations from Brief
- None needing a DR. Interpretations (auditor please check):
  - **"Linked" = active variants** (approved: DR-024 amended 2026-10-23, audit F2). `usedByItems` and the 409 count items whose *active* variants link the group (the brief's `usedByItems` definition, reused for DELETE). A link left on a **dropped (inactive) variant** is ignored and not deleted: otherwise a group whose only link sits on a deactivated variant could never be removed (item PATCH only rewrites links of active variants). The archived group then still shows on that inactive variant in item reads; re-activating the variant through PATCH rewrites its links. If you read DR-024 "any variant" literally, the count changes and that dead end appears.
  - **Archive emits `itemIds: []`** (no active item is linked at that point); create does too. PATCH emits the items linked at that moment.
  - **Option read order:** new options get `created_at = base + index ms` from the app clock in one request (one transaction shares one `NOW()`, so ties would fall back to random UUID order). Mixing app and DB clocks only matters across requests, where the gap is far larger than any skew here.
  - **`scripts/create-openapi-document.ts`** edited (controller + stub) — not in the brief's file list, not a protected path, required for AC-6.
  - **`missingModifierGroups`** keeps its name though it now also locks.
  - Group names are not unique (brief silent).
- The race test is probabilistic (5 rounds); the guarantee itself rests on the lock modes above.

## Known Gaps / Follow-ups
- **Size:** ≈ 940 net-new lines (tests ≈ 520) vs ~700–800 estimated — the e2e spec alone is ≈ 330 lines; `openapi.json` (+785) excluded.
- No frontend / mobile change: `ErrorCode` gains `MODIFIER_GROUP_IN_USE` (additive, the web client parses with `safeParse`). Back-office UI is BRIEF-040. Group / option sort order, restore, per-option toggle outside the form stay S2 (brief Out).
- `docs/erd.html` `modifier_group.is_active` → Cowork (Field-approved, DR-024). State Carry over already tracks `erd.html` after 042 / 043.
- Unchanged from earlier handoffs: e2e must run with no dev backend / watcher alive (shared Redis, BullMQ).

## AI Usage
**High** — Claude Code wrote all code, tests and docs (Field 0 % coding, reviewer mode).

## Review Routing
- Assigned auditor: Cowork
- Audit: **PASS** (`docs/audits/BRIEF-044.md`), zero Must fix; first review `8956838` → CHANGES REQUIRED (F1 order-side 409, F2 DR-024 wording — both decided by Field and committed in `3c04990`), re-audit S = `b000e4e` → PASS. S..H = audit / handoff / state only. Findings 3–5 Info (option order from app clock, `erd.html` after merge, dev machine state).
- Next command: merge on green `ci` (Field's own PR, §7)
- Work SHA: `b000e4e` · self-check: brief Rev 2 §2–§4 ↔ DR-024 locks ↔ `1762600000000-ModifierGroupArchive.ts` ↔ `modifier-group.entity.ts` ↔ `schema.sql` §4 ↔ contracts `menu-write.ts` ↔ service / repository ↔ `modifier-groups.e2e-spec.ts` (no `order` module diff vs `main`); no permission, WS-payload or other-table change
