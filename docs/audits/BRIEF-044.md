# Audit — BRIEF-044 Backend: add-on groups and options (modifier CRUD)

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-23 |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-23 |
| **Branch / commit** | `feat/BRIEF-044-modifier-groups-api` · **S = `8956838`** (work) · handoff `06bf5db` · seed `10f801f` (on `main` `b083e38`) |
| **Depth** | Full (feeds order pricing and validation; migration) |
| **Brief revision** | 1 |
| **Recommendation** | **BLOCKED** — two Field decisions (Findings 1, 2); with Cowork's recommendations it becomes CHANGES REQUIRED (one small revert) ← Field makes the final call |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1 | ✅ | `ModifierGroupService` / `ModifierGroupTypeormRepository`: create saves group + options in one transaction; `listActive` by name; options `created_at, id`; `usedByItems` = distinct items via **active** variants (`USED_BY`) · e2e 0 → 1 after linking | |
| AC-2 | ✅ | contracts `checkGroupShape`: required ⇒ min ≥ 1, not required ⇒ min 0, max ≥ min, max ≥ 1, max ≤ options (= the active set), duplicate ids; `MenuPriceSchema` ≥ 0; names 1–200 · service: foreign option id → 400 under the group lock · e2e 6 violations + foreign + unknown | |
| AC-3 | ⚠️ | PATCH: listed options updated + re-activated, new inserted, dropped `is_available = false`, never deleted · old line keeps ชีส ฿20 / เบคอน ฿15 (DR-022 snapshots) · ordering the dropped option → **400** — see Finding 1 | |
| AC-4 | ⚠️ | `archiveGroup`: `LOCK_GROUP` (`… AND is_active FOR UPDATE`) → count linked items → 409 / archive; archived / unknown → 404 · linking guard `HOLD_GROUPS` (`… AND is_active FOR KEY SHARE`) in `missingModifierGroups` → archived id = 400 on item POST / PATCH · lock modes conflict, so no link slips in during an archive (e2e race test, 5 rounds) · **"linked" counts active variants only** — see Finding 2 | |
| AC-5 | ✅ | one `changed()` per public write, after the `@Transactional` private method; create / archive `{ itemIds: [] }`, PATCH the linked items · e2e exactly 3 events | |
| AC-6 | ✅ | Handoff on `8956838`: contracts 79, backend unit 138, e2e 166 (first run hit the known watcher / BullMQ steal, green after stopping it), `openapi:check` 0 · run proof (curl, real dev DB) · Cowork re-ran backend + contracts `tsc --noEmit` and `check-class-files` on `06bf5db` (exit 0) | |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| DR-024 locks | ⚠️ | column, archive-only DELETE, 404s, linking guard + lock modes, no restore ✅ — "linked to **any** variant" read as "through an **active** variant" (Finding 2) |
| Migration / unlocked file | ✅ | `1762600000000-ModifierGroupArchive.ts` adds the column only (no `updated_at` write — trigger already on `modifier_group`), reversible, registered; `schema.sql` §4 one line |
| Permissions | ✅ | `GET` `menu:read`; `POST` / `PATCH` / `DELETE` `menu:write` |
| Options never deleted | ✅ | `saveOptions` deactivates dropped rows |
| `save()` | ✅ | groups and options via `save()`; raw SQL only for locks and counts |
| Contracts | ✅ | additive: schemas, `MODIFIER_GROUP_IN_USE`; `menu.changed` payload unchanged |
| `scripts/create-openapi-document.ts` | ✅ | not protected; needed so `openapi.json` lists the paths |
| Sonar | ✅ | none in files this brief adds or changes (two S4782 fixed before commit) |
| Size | ⚠️ | ~954 net app lines (tests ≈ 535) vs ~700–800 |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | **Field decision → Must fix (revert)** · cause: **brief error (Cowork)** | High | **Current:** BRIEF-044 Pre-decided "deactivated options rejected by the order API (400 `VALIDATION_ERROR`)" on the premise that the order path did not check option availability. That premise was wrong: before this brief, `blockReason()` already returned **409 `ITEM_UNAVAILABLE` (`sold_out`)** for a chosen switched-off option. The implementation followed the brief and turned that into a 400. The web POS cart (`app/frontend/…/order/cart.ts` `sendFailure`) maps `ITEM_UNAVAILABLE` to "unavailable" (line marked, menu refreshed) but **any other code to `{ type: "network" }`** — so a cart holding an add-on that was just switched off now shows a network error and fails the same way on retry. **Updated:** BRIEF-044 **Rev 2** replaces that Pre-decided item with "a switched-off option keeps the existing 409 `ITEM_UNAVAILABLE` (`sold_out`) — no change to `order-lines.ts`"; AC-3 "ordering it again → 409 `ITEM_UNAVAILABLE`". The executor reverts the `order-lines.ts` diff and its two unit-test changes, and updates the AC-3 e2e assertion. ~20 lines. |
| 2 | **Field decision** (DR-024 wording) | Medium | **Current:** DR-024 locks "still linked to **any** variant → 409". The code counts only links through **active** variants (`USED_BY`, `LINKED_ITEMS`). Verified the reason: BRIEF-038's item PATCH deactivates a dropped variant but `replaceLinks` only rewrites links of active variants, so a dropped variant keeps its links forever — read literally, such a group could never be archived without re-activating a price option the manager removed. Side effect: an archived group can still appear under an inactive variant in item reads (not orderable; re-activating that variant through PATCH rewrites its links). **Updated (Cowork recommends approving):** amend DR-024 — "linked = linked through an active variant (`menu_item_variant.is_available`); links on deactivated variants are ignored and kept". Cowork writes the amendment into DR-024 in the checkout; the executor commits it unchanged with the PASS commit. |
| 3 | Info | — | Option read order uses `created_at = Date.now() + index` written by the app for new options (rows in one transaction share `now()`). Only `updated_at` is DB-owned (DR-023), so this is allowed; across requests the order is DB time vs app time — skew is far below the gap between two saves. A real sort column stays S2. |
| 4 | Info (Cowork, after merge) | — | `docs/erd.html`: `modifier_group.is_active` (DR-024) — diff for Field after merge. |
| 5 | Info (dev machine) | — | The run proof stopped both `nest start --watch` processes and left a plain backend of `8956838` on :3001; the migration is applied on dev `bar`; T1 has two more orders (bill ฿1,305.00). |

## Recommendation to Field
The CRUD, the archive rule and the lock pairing are solid, and the race is covered. Two things need you — both caused or worded by Cowork, not the implementation:
1. **Approve BRIEF-044 Rev 2** so the order API keeps answering a switched-off add-on with 409 `ITEM_UNAVAILABLE` (the POS already handles it); the executor reverts ~20 lines.
2. **Approve the DR-024 amendment** "linked = through an active variant" — the literal wording would leave groups un-archivable.

**Next command** (after both approvals): `execute BRIEF-044` (fix Must fix #1 per Rev 2; commit the Rev 2 brief and the DR-024 amendment exactly as Cowork wrote them; report the new S for a compact re-check).

## Evidence Coverage
- Reviewed work SHA: `8956838` (handoff `06bf5db`; `git diff main...HEAD`)
- Sources inspected independently: migration, `modifier-group.service.ts`, `modifier-group.typeorm-repository.ts` (all SQL, `saveOptions`), controller permissions, `menu-write.typeorm-repository.ts` (`HOLD_GROUPS`), `order-lines.ts` diff (removed `blockReason` option branch), contracts `menu-write.ts` additions, BRIEF-038 `replaceLinks` (dead-end check), web POS `cart.ts` `sendFailure` (error mapping)
- Tests: Cowork re-ran backend + contracts `tsc --noEmit` and `check-class-files` (exit 0); oxlint / unit / e2e not re-run (macOS-built binaries) → handoff exits + `ci` on H.
- Run proof: read from the handoff.
- Written uncommitted; the executor commits it unchanged at PASS.

## Field, 2026-10-23 (session): Findings 1–2 decided
Recorded by Cowork on Field's explicit instruction ("approve BRIEF-044 Rev 2, approve DR-024 amendment").
- **F1:** BRIEF-044 **Rev 2** approved — a switched-off option keeps 409 `ITEM_UNAVAILABLE`; no `order-lines.ts` change. Written into `docs/briefs/BRIEF-044-modifier-groups-api.md` (uncommitted).
- **F2:** DR-024 **amended** — "linked" = through an active variant. Written into `docs/decisions/DR-024-modifier-group-archive.md` (uncommitted).
- Result now: **CHANGES REQUIRED** — Must fix #1: revert the `order-lines.ts` diff and its unit-test changes; AC-3 e2e asserts 409 `ITEM_UNAVAILABLE`. The executor commits the two documents above exactly as written (`docs(BRIEF-044): Rev 2 + DR-024 amendment — Field-approved`).

## Re-audit — 2026-10-23 (Cowork) · S = `b000e4e`
| Check | Result |
|---|---|
| `3c04990` | the Rev 2 brief and the DR-024 amendment committed exactly as Cowork wrote them (same diff: brief +7 / −7, DR +2 / −1) |
| `b000e4e` · `order-lines.ts` + `order.service.spec.ts` | **identical to `main`** (`git diff main b000e4e -- app/backend/src/modules/order` empty) — the pre-044 409 `ITEM_UNAVAILABLE` (`sold_out`) path is back; the web POS cart handles it |
| `b000e4e` · `modifier-groups.e2e-spec.ts` | AC-3: ordering the dropped option → `409` / `ITEM_UNAVAILABLE` (was 400) |
| `b000e4e` · `docs/api/README.md` | PATCH row says switched-off options answer 409 `ITEM_UNAVAILABLE` |
| Finding 2 | resolved by the DR-024 amendment — code already counts active-variant links |
| Typecheck | Cowork re-ran backend `tsc --noEmit` + `check-class-files` on `b000e4e` (exit 0); unit / e2e → executor's run + `ci` on H |

**Result: PASS** — zero Must fix. Audited S = `b000e4e`. Findings 3–5 stay Info.

**Next command:** `execute BRIEF-044` (PASS commit: this audit unchanged + handoff + state, then PR; Field's own PR — merge once `ci` is green on H and S..H is evidence-only).
