# BRIEF-044 — Backend: add-on groups and options (modifier CRUD)

| | |
|---|---|
| **Status** | Ready — Rev 2 approved by Field 2026-10-23 |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | backend · contracts |
| **Revision** | 2 |
| **Depends on** | BRIEF-038 ✅ (#80) · BRIEF-042 ✅ (#83 — option names snapshotted, so renames are safe) · BRIEF-043 merged (queue order; DB-owned `updated_at`) |
| **References** | CD-12 R6 (modifiers·2 delete disabled), R7-3 (`409 MODIFIER_GROUP_IN_USE`), R7-4 (`max_select ≤ option count`, `is_required ⇒ min_select ≥ 1`), §4 "Groups CRUD", §9 Modifier groups, `modifiers` board · BRIEF-039 Q1 (split from 039) · DR-022 · **DR-024 (archive, not delete)** · `docs/schema.sql` §4 `modifier_group`, `modifier_option`, `menu_variant_modifier_group` · `order-lines.ts` (`findChoices` / `locate`) |
| **Audit depth** | Full (feeds order pricing and validation; migration) |
| **Size** | ~1 day · est. ~700–800 net-new lines incl. tests (tests counted) — above the ~500 target, see Ready checklist |

---

## 1. Goal
The manager can create and edit add-on groups (rules + options with prices), see how many menu items use each group, and remove a group no menu uses (archived — past orders keep pointing at it, DR-024) — and a switched-off option can no longer be ordered.

## 2. Scope
### In
- **Migration** `app/backend/src/providers/database/migrations/<timestamp>-ModifierGroupArchive.ts`: `modifier_group.is_active BOOLEAN NOT NULL DEFAULT TRUE` (DR-024); entity + `docs/schema.sql` §4 (unlocked below).
- **`GET /menu/modifier-groups`** → `{ items: ModifierGroupAdmin[] }`: every **active** group with its options (active and inactive, `isAvailable` on each, ordered `created_at, id`) and `usedByItems` = number of menu items whose active variants link the group (CD-12 "ใช้กับ n เมนู"). Ordered by name.
- **`POST /menu/modifier-groups`** `{ name, isRequired, minSelect, maxSelect, options: [{ name, priceDelta }] (≥ 1) }` → `ModifierGroupAdmin`.
- **`PATCH /menu/modifier-groups/:id`** whole form, `options: [{ id?, name, priceDelta }]` = the new active set — same rule as BRIEF-038 variants: listed ids updated + re-activated, new inserted, dropped ones **deactivated** (`is_available = false`), never deleted (`order_item_modifier` references them). A foreign option id → 400.
- **`DELETE /menu/modifier-groups/:id`** → `{ ok: true }` = **archive** (`is_active = false`) when no variant links the group, whether or not it was ever ordered; still linked → 409 `MODIFIER_GROUP_IN_USE`; archived or unknown → 404. Never a hard delete (DR-024).
- **Linking guard (BRIEF-038 item writes):** `POST` / `PATCH /menu/items` with an archived group id → 400 (same as unknown); item writes hold the listed groups `FOR KEY SHARE` and require `is_active`, archive holds the group `FOR UPDATE` before counting links — no link can slip in during an archive.
- **Rules (CD-12 R7-4, contracts `superRefine` + service on the active set):** `isRequired ⇒ minSelect ≥ 1`; `!isRequired ⇒ minSelect = 0`; `maxSelect ≥ minSelect`, `maxSelect ≥ 1`; `maxSelect ≤ number of active options`; `priceDelta` money string ≥ 0.00 (`MenuPriceSchema`); names 1–200 chars; no duplicate option ids.
- **Order side (Rev 2):** no change — the existing `blockReason` in `order-lines.ts` already answers a chosen switched-off option with 409 `ITEM_UNAVAILABLE` (`sold_out`), which the web POS cart handles; a required group with fewer active options than `minSelect` blocks the item through the existing count check.
- **Reads unchanged in shape:** item reads keep listing inactive options with `isAvailable: false` (the POS sheet already disables them).
- **Event:** every write emits one `menu.changed` `{ itemIds }` = items linked to the group (empty array for a new / unused group) — no contract change to the payload.
- Writes in a `MenuWriteService`-style service in `modules/menu` (name free), one transaction per request, `save()` on `modifier_group` / `modifier_option`, the group row `FOR UPDATE` on PATCH / DELETE.
- Contracts (`ModifierGroupAdminSchema`, list, create / update schemas, `MODIFIER_GROUP_IN_USE`), OpenAPI, `docs/api/README.md` Menu table.

### Out (do NOT build here)
- Group / option sort order (no column — S2) · per-option availability toggle outside the group form · restoring or listing archived groups (DR-024: create a new one) · stale-edit check on groups (CD-12 R7-1 covers items only — last write wins under the row lock) · UI (BRIEF-040).

## 3. Contract
| Method | Path | Request → Response | Permission |
|---|---|---|---|
| GET | `/menu/modifier-groups` | → `{ items: ModifierGroupAdmin[] }` | `menu:read` |
| POST | `/menu/modifier-groups` | `CreateModifierGroup` → `ModifierGroupAdmin` | `menu:write` |
| PATCH | `/menu/modifier-groups/:id` | `UpdateModifierGroup` → `ModifierGroupAdmin` | `menu:write` |
| DELETE | `/menu/modifier-groups/:id` | → `{ ok: true }` | `menu:write` |
- **WS events:** `menu.changed` (existing payload).
- **Errors:** 400 `VALIDATION_ERROR` · 404 · 409 `MODIFIER_GROUP_IN_USE` ("ใช้อยู่ใน n เมนู — ถอดออกจากเมนูก่อน").
- **Business rules:** option prices on past orders never change (`price_delta_snapshot`) and names neither (DR-022) · deactivated options are not orderable.

## 4. Acceptance Criteria
- **AC-1** — Create a required group "ระดับน้ำแข็ง" (min 1, max 1, 3 options) → 201, in `GET /menu/modifier-groups` with `usedByItems: 0`; link it to an item via BRIEF-038 PATCH → `usedByItems: 1`.
- **AC-2** — Rule violations → 400: required with min 0, not-required with min 1, max < min, max > active options, negative price, no options, foreign / duplicate option id.
- **AC-3** — PATCH drops an option that an open order used → option `isAvailable: false`, the old order line still shows its name + price (snapshots); ordering it again → 409 `ITEM_UNAVAILABLE`; ordering another option of the group → 201 at the new price.
- **AC-4** — DELETE a linked group → 409 `MODIFIER_GROUP_IN_USE`; unlink it → DELETE 200 → gone from `GET /menu/modifier-groups`, rows kept (`is_active = false`), an old order line with its option still reads correctly; again → 404; linking it in an item `PATCH` → 400. A never-ordered group archives the same way.
- **AC-5** — Each write emits exactly one `menu.changed` with the linked item ids.
- **AC-6** — Gates + run proof; OpenAPI + `openapi:check`; README.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1, AC-3–AC-5 | e2e (real Postgres) | `app/backend/test/modifier-groups.e2e-spec.ts` |
| AC-2 | unit | contracts `menu-write.test.ts` + service spec |

Gate commands (all must pass):
```bash
pnpm --filter @bar/contracts build
pnpm --filter @bar/contracts lint && pnpm --filter @bar/contracts typecheck && pnpm --filter @bar/contracts test
pnpm --filter @bar/backend lint && pnpm --filter @bar/backend typecheck && pnpm --filter @bar/backend test && pnpm --filter @bar/backend test:e2e
pnpm --filter @bar/backend openapi:check
```
Run proof: `curl` as Field — create "ท็อปปิ้ง" (not required, max 2, 3 options) → link to an item → order it on the POS with one option → PATCH: rename that option + drop another → POS drawer still shows the old option name / price on the old line, the sheet greys the dropped one → DELETE the group → 409 → unlink → DELETE 200 → gone from the list, the old order line unchanged → link it in an item PATCH → 400.

### Local Sonar scan
- **Required for this brief: yes.**

## 6. Constraints
- One schema change only: `modifier_group.is_active` (DR-024). Anything else → stop, raise a DR.
- No order module change (Rev 2).
- `save()`; no inline permission checks.

## 7. Decision Points (Field Guard)
- **Pre-decided (exact):** the four endpoints and paths above · error code `MODIFIER_GROUP_IN_USE` · options deactivate, never delete · DR-024 locks (column, archive-only DELETE, linking guard + locks, no restore in S1) · migration file name `<timestamp>-ModifierGroupArchive.ts` · **a deactivated option keeps the existing 409 `ITEM_UNAVAILABLE` (`sold_out`) — no change to `order-lines.ts` (Rev 2)** · `menu.changed` payload unchanged · no stale check on groups.
- **Q1 — group no menu uses but past orders reference. ✅ Decided (Field, 2026-10-23): B — archive (DR-024).**
- **Likely DRs:** none beyond DR-024.

## 8. Unlocked Protected Files
- `docs/schema.sql`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates (incl. run proof) and evidence; dependencies have completion conditions
- [x] Size within workflow §2 (≤ ~3 working days, ~500 net-new lines); otherwise split
- [x] No unresolved decision blocking the main outcome
- [x] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-23 | Initial Draft (Cowork) — modifier CRUD split from BRIEF-039 (Q1 = A there); Q1 here = B → DR-024 archive (Field) |
| 1 | 2026-10-23 | Ready — Field in session: "approve DR-024, approve BRIEF-044 Rev 1 Ready" |
| 2 | 2026-10-23 | keep 409 `ITEM_UNAVAILABLE` for switched-off options (Draft premise corrected, BRIEF-044 audit F1) — Field-approved ("approve BRIEF-044 Rev 2") |
