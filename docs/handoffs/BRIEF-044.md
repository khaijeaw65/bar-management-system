# Handoff — BRIEF-044 Backend: add-on groups and options (modifier CRUD)

| | |
|---|---|
| **Implementer** | kj (Claude Code) |
| **Date** | 2026-10-23 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-044-modifier-groups-api` (seed `10f801f`, on `main` `b083e38`) |
| **Commit** | Work SHA `8956838` |
| **Assigned auditor** | Cowork |
| **Status** | Implemented — branch pushed, no PR (audit before PR, workflow §3) |

## Summary
- **Migration** `1762600000000-ModifierGroupArchive.ts` (registered in `migrations.ts`): `modifier_group.is_active BOOLEAN NOT NULL DEFAULT TRUE`; entity + `docs/schema.sql` §4. It adds a column only — no `updated_at` write (BRIEF-043 audit Finding 3).
- **Four endpoints** in a new `ModifierGroupController` / `ModifierGroupService` / `ModifierGroupRepository` (port + TypeORM) in `modules/menu`: `GET` / `POST` / `PATCH :id` / `DELETE :id` on `/menu/modifier-groups`. One transaction per write, `save()` on `modifier_group` / `modifier_option`, the group row `SELECT … FOR UPDATE` on PATCH / DELETE, `menu.changed` after the commit.
  - `GET`: active groups by name, options (active + switched off) ordered `created_at, id`, `usedByItems` = distinct items whose **active** variants link the group.
  - `PATCH`: `options` = the new active set — listed ids updated + re-activated, new inserted, dropped ones `is_available = false` (never deleted); an option id of another group → 400.
  - `DELETE`: group locked `FOR UPDATE`, then linked items counted → > 0 → 409 `MODIFIER_GROUP_IN_USE` ("ใช้อยู่ใน n เมนู — ถอดออกจากเมนูก่อน"); else `is_active = false`. Archived / unknown → 404.
- **Linking guard (DR-024):** `MenuWriteTypeormRepository.missingModifierGroups` is now `SELECT id … WHERE id = ANY($1) AND is_active FOR KEY SHARE` (name kept; doc says it holds the rows). An archived id is "missing" → the existing 400. Item writes (`FOR KEY SHARE`) and archive (`FOR UPDATE`) cannot interleave.
- **Contracts:** `CreateModifierGroupSchema`, `UpdateModifierGroupSchema` (`superRefine`: required ⇒ min ≥ 1, not required ⇒ min 0, max ≥ max(min, 1), max ≤ option count, duplicate option id), `ModifierGroupAdminSchema` (`MenuModifierGroup` + `usedByItems`), list schema, `ErrorCode` `MODIFIER_GROUP_IN_USE`. Prices use `MenuPriceSchema` (money string ≥ 0.00), names 1–200.
- **Order side:** `order-lines.ts` — `locate()` ignores an option with `isAvailable: false`, so it is "unknown" → `requireChoices` throws the existing `INVALID` (400 `VALIDATION_ERROR`). The old per-option `sold_out` branch in `blockReason` (409 `ITEM_UNAVAILABLE`) and the `available` flag are gone. A required group with fewer active options than `minSelect` blocks the item the same way (`assertCounts`).
- **OpenAPI:** `scripts/create-openapi-document.ts` registers the new controller + a stub service so `openapi.json` lists the four paths. `docs/api/README.md` Menu table +4 rows.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `modifier-groups.e2e-spec.ts` "AC-1" — 201, options in input order, `usedByItems` 0 → 1 after an item links it, by-name order |
| AC-2 | ✅ | contracts `menu-write.test.ts` (required min 0, not required min 1, max < min, max > options, max 0, negative price, `"5"`, no options, blank names, active-set count, duplicate id, `id` stripped on create) · service spec (foreign option id → 400, nothing written) · e2e "AC-2" (6 rule violations 400, foreign id 400, unknown 404) |
| AC-3 | ✅ | e2e "AC-3" — PATCH renames ชีส → ชีสเยิ้ม ฿25 and drops เบคอน → `isAvailable: false`, 3 rows kept; the old line keeps ชีส ฿20 / เบคอน ฿15; item read lists เบคอน off; ordering เบคอน → 400 `VALIDATION_ERROR`; ordering ชีสเยิ้ม → 201 at ฿25. Unit `order.service.spec.ts` ("switched-off option like an unknown one", "required group whose options are all off") |
| AC-4 | ✅ | e2e "AC-4" — linked → 409 (message names 1), unlink via item PATCH → DELETE 200 → gone from list, `is_active = false`, 3 option rows kept, old line reads ชีส, again → 404, unknown → 404, link in item `PATCH` → 400, in item `POST` → 400; a never-ordered group archives the same way · race test: 5 rounds of `DELETE` ‖ link-PATCH → exactly (200, 400) or (409, 200), never an archived group still linked |
| AC-5 | ✅ | e2e: socket sees `[{itemIds:[item]}, {itemIds:[]}, …]` in order; "AC-5" create + patch + delete = exactly 3 events · service spec (one emit per write, none on failure) |
| AC-6 | ✅ | gates below · `openapi:check` exit 0 · README |

## Gate Evidence (G1)
Run on `8956838` (clean tree after commit). The plain `node dist/main` (pid 89993) and the two `nest start --watch` processes in `app/backend` (pids 38196, 7445 — one had respawned the app on :3001 and stole a payment-expiry job in one e2e run) were stopped first; e2e used `bar_test`.

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/contracts build` / `lint` / `typecheck` | 0 | pass |
| `pnpm --filter @bar/contracts test` | 0 | 79 passed (10 files) |
| `pnpm --filter @bar/backend lint` (oxlint + class-files) | 0 | pass |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 138 passed (38 files) |
| `pnpm --filter @bar/backend test:e2e` | 0 | 166 passed (25 files) — first run on `8956838` had 1 failure (`payment.e2e-spec` expiry, the watcher stealing the BullMQ job, 036 handoff Limitations); re-run after stopping the watchers: green |
| `pnpm --filter @bar/backend openapi:check` | 0 | `docs/api/openapi.json` matches the committed file |
| run proof (below) | 0 | health 200 on the work SHA, curl scenario ✅ |

## Run proof
`pnpm migration:run` on dev `bar` → `ModifierGroupArchive1762600000000` executed · `nest build` on `8956838` · fresh `node --enable-source-maps --env-file=.env dist/main` on :3001 → `/api/health` **200** `status=ok`, `db=up`. `curl` (Python) as `Field`: session from `TokenService.createSession` in a local script (no LINE). T1 (open visit `12dbfa1b…`), item จินโทนิค แก้ว ฿220.

| Step | Result |
|---|---|
| `POST /menu/modifier-groups` ท็อปปิ้ง (optional, max 2; ชีส 20 / เบคอน 15 / ไข่ 10) | **201** |
| `PATCH /menu/items/:id` `modifierGroupIds: [group]` → `GET /menu/modifier-groups` | 200 · `usedByItems: 1` |
| `POST /visits/T1/orders` แก้ว + ชีส | **201** · line ชีส ฿20, bill ฿1,060.00 |
| `PATCH` group: ชีส → ชีสเยิ้ม ฿25, drop เบคอน | **200** · options ชีสเยิ้ม 25.00 ✔ / เบคอน 15.00 ✘ / ไข่ 10.00 ✔ · T1 bill still ฿1,060.00, old line still ชีส ฿20 |
| item read (the POS sheet's data) | เบคอน `isAvailable: false` (sheet greys it) |
| order เบคอน | **400** `VALIDATION_ERROR` |
| order ชีสเยิ้ม | **201** · line ฿25 on แก้ว ฿220 (bill ฿1,305.00); old line unchanged |
| `DELETE` group (linked) | **409** `MODIFIER_GROUP_IN_USE` "ใช้อยู่ใน 1 เมนู — ถอดออกจากเมนูก่อน" |
| item `PATCH` `modifierGroupIds: []` → `DELETE` | 200 · 200 · not in `GET /menu/modifier-groups`; T1 lines unchanged (ชีส ฿20, ชีสเยิ้ม ฿25) |
| `DELETE` again | **404** |
| item `PATCH` linking the archived group | **400** `VALIDATION_ERROR` |

**Not exercised on screen:** the web POS needs a LINE sign-in (Field's) — the browser pane was not signed in. The brief changes no UI; the drawer / sheet read the same `GET /visits/:id` and `GET /menu/items` payloads checked above.

**Local data touched:** dev DB `bar` — migration applied; group ท็อปปิ้ง archived (rows kept); item จินโทนิค has no group again; T1 got 2 orders (ชีส ฿220 + ฿20, ชีสเยิ้ม ฿220 + ฿25), still open, bill ฿1,305.00. **Processes:** backend of `8956838` left running on :3001; the two `nest start --watch` and the old plain backend were stopped and **not** restarted (restart `pnpm --filter @bar/backend start:dev` if wanted — it takes :3001 and its BullMQ worker, so stop it again before `test:e2e`).

## Sonar (local scan)
- Scanned commit: `10f801f` + this brief's working tree (re-scanned after fixing two S4782 findings in my files) · Quality Gate: **ERROR** — `new_coverage` 0.0 % (no coverage path, known) and `new_violations` 16.
- Issues by severity: BLOCKER 0 · HIGH 5 · MEDIUM 5 · LOW 6 · INFO 1 (`pnpm sonar:report`) — the same 16 as in the BRIEF-043 handoff; none in a file this brief adds or edits. First scan showed 18: two `typescript:S4782` ("redundant `undefined`") in `modifier-group.repository.ts` and `menu-write.ts` — fixed by deriving the option type from the Zod schema. No exclusions, won't-fix or gate change.
- Who fixed: Claude Code (Field, reviewer mode).

## Decisions Raised
- None. Pre-decided items used exactly: the four paths, `MODIFIER_GROUP_IN_USE`, options deactivate / never delete, DR-024 locks (column, archive-only `DELETE`, linking guard with `FOR KEY SHARE` / `FOR UPDATE`, no restore), file name `<timestamp>-ModifierGroupArchive.ts`, deactivated options → 400 `VALIDATION_ERROR`, `menu.changed` payload unchanged, no stale check on groups.

## Deviations from Brief
- None needing a DR. Interpretations (auditor please check):
  - **"Linked" = active variants.** `usedByItems` and the 409 count items whose *active* variants link the group (the brief's `usedByItems` definition, reused for DELETE). A link left on a **dropped (inactive) variant** is ignored and not deleted: otherwise a group whose only link sits on a deactivated variant could never be removed (item PATCH only rewrites links of active variants). The archived group then still shows on that inactive variant in item reads; re-activating the variant through PATCH rewrites its links. If you read DR-024 "any variant" literally, the count changes and that dead end appears.
  - **Archive emits `itemIds: []`** (no active item is linked at that point); create does too. PATCH emits the items linked at that moment.
  - **Option read order:** new options get `created_at = base + index ms` from the app clock in one request (one transaction shares one `NOW()`, so ties would fall back to random UUID order). Mixing app and DB clocks only matters across requests, where the gap is far larger than any skew here.
  - **`order-lines.ts`:** besides the brief's "treat as unknown", the old 409 `ITEM_UNAVAILABLE` / `sold_out` result for a switched-off option disappears (its unit test was rewritten). No e2e or frontend test relied on it (`grep ITEM_UNAVAILABLE`).
  - **`scripts/create-openapi-document.ts`** edited (controller + stub) — not in the brief's file list, not a protected path, required for AC-6.
  - **`missingModifierGroups`** keeps its name though it now also locks.
  - Group names are not unique (brief silent).
- The race test is probabilistic (5 rounds); the guarantee itself rests on the lock modes above.

## Known Gaps / Follow-ups
- **Size:** ≈ 975 net-new lines (tests ≈ 535) vs ~700–800 estimated — the e2e spec alone is ≈ 330 lines; `openapi.json` (+785) excluded.
- No frontend / mobile change: `ErrorCode` gains `MODIFIER_GROUP_IN_USE` (additive, the web client parses with `safeParse`). Back-office UI is BRIEF-040. Group / option sort order, restore, per-option toggle outside the form stay S2 (brief Out).
- `docs/erd.html` `modifier_group.is_active` → Cowork (Field-approved, DR-024). State Carry over already tracks `erd.html` after 042 / 043.
- Unchanged from earlier handoffs: e2e must run with no dev backend / watcher alive (shared Redis, BullMQ).

## AI Usage
**High** — Claude Code wrote all code, tests and docs (Field 0 % coding, reviewer mode).

## Review Routing
- Assigned auditor: Cowork
- Next command: `audit BRIEF-044` (Cowork; `git diff main...feat/BRIEF-044-modifier-groups-api`, `git show 8956838`)
- Work SHA: `8956838` · self-check: brief §2–§4 ↔ DR-024 locks ↔ `1762600000000-ModifierGroupArchive.ts` ↔ `modifier-group.entity.ts` ↔ `schema.sql` §4 ↔ contracts `menu-write.ts` ↔ service / repository ↔ `order-lines.ts` ↔ `modifier-groups.e2e-spec.ts`; no permission, WS-payload or other-table change
