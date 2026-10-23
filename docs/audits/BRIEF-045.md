# Audit — BRIEF-045 Web POS: categories manager + add-on groups screen (+ category `itemCount`)

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-23 |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-23 |
| **Branch / commit** | `feat/BRIEF-045-menu-categories-addons-ui` · **S = `c99a1c2`** (work: backend `7431d97` + UI `c99a1c2`) · handoff `7c6cde5` · seed `64e82be` |
| **Depth** | Full for backend (migration + contract) · Compact for UI |
| **Brief revision** | 1 |
| **Recommendation** | **CHANGES REQUIRED** — Must fix 1 (UI run proof on the real API) + Findings 2, 3, 5 raised to Must fix by Field |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1 | ✅ | catalog read: one grouped `COUNT(*)` per category over all `menu_item` rows (same population as `LOCK_CATEGORY_ITEMS`); `insertCategory` → 0; `saveCategory` → count query after save; PUT path returns the list read → carries it · e2e covers hidden category + inactive items + POST / PATCH / PUT · contracts test −1 / 1.5 rejected | |
| AC-2 | ⚠️ | ↑ / ↓ and revert covered (`CategoriesModal.test.tsx`, `e2e/menu-backoffice.spec.ts`); `onReorder` builds the full id list with `movedIds` (hidden included); PUT → `onSettled` invalidates | **pointer drag never exercised** (jsdom) — run proof must show it (Must fix 1) |
| AC-3 | ✅ | optimistic `isActive` + revert + Toast; muted row + "ซ่อนจากเมนูลูกค้าและ POS" | |
| AC-4 | ✅ | add (Enter, schema-validated, empty → error, nothing sent); rename via the name button, Enter / blur saves, Esc cancels | Suggestion 2 |
| AC-5 | ✅ | delete disabled while `itemCount > 0` with the exact copy; 0 → DELETE; 409 `CATEGORY_NOT_EMPTY` → Toast + `["menu"]` refetch | 409 path untested (handoff discloses) |
| AC-6 | ✅ | list: rule chip, active option count, "ใช้กับ n เมนู"; Drawer create → POST in schema shape | |
| AC-7 | ✅ | `payloadOf` keeps only Switch-on rows, ids kept; test asserts the omitted id and its re-listing; max > Switch-on rows → inline error, no request | |
| AC-8 | ✅ | required + min 0, empty names, negative price, no options → inline + summary, no request; ต้องเลือก off forces min 0 (disabled); "ลูกค้าเห็น" line | max < min not tested in the UI (contracts covers it) — Suggestion 3 |
| AC-9 | ✅ | delete disabled + "ใช้อยู่ใน n เมนู — ถอดออกจากเมนูก่อน"; AlertDialog "ลบกลุ่ม {name}? / ลบแล้วกู้คืนไม่ได้"; 409 race → Toast + refetch | |
| AC-10 | ✅ | modifiers screen mounts `useMenuLive()`; new keys under `["menu", …]`; fake-socket test | |
| AC-11 | ✅ | migration fails listing duplicates, then `uq_menu_category_name` on `lower(trim(name))`; repo maps **only** `23505` + constraint `uq_menu_category_name` → 409, rethrows the rest; e2e: hidden name, spaces, Beer / beer, rename clash, rename-to-self 200, migration refusal; Modal keeps the typed value + "มีหมวดชื่อนี้แล้ว" | |
| AC-12 | ⚠️ | gates green per handoff; `openapi.json` carries `CATEGORY_NAME_TAKEN` + `itemCount`; backend run proof (`migration:run`, `/api/health` 200) done | **UI run proof not done** — Must fix 1 |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| DR-025 locks | ✅ | index name, expression, all rows, fail-loud migration, reversible `down`, 409 only for `23505` on that index, message "มีหมวดชื่อนี้แล้ว" |
| Unlocked file | ✅ | `docs/schema.sql` one line (index), nothing else |
| No new dependency | ✅ | `useDragAndDrop` / `GridList` / `Button` from existing `react-aria-components`; no `package.json` change |
| Permissions / `save()` | ✅ | routes unchanged; category writes via `save()` (wrapped in `saveNamed`) |
| Contracts | ✅ | additive: `itemCount` (required), `CATEGORY_NAME_TAKEN` |
| Scope | ✅ | no 390 layouts, no restore, no item-editor change; `MenuPanel.test.tsx` touched only to add `itemCount` to a fixture |
| Sonar | ✅ | no new issues in this brief's files (same 18 pre-existing) |
| Size | ⚠️ | ~1.55k added lines in `app/` (openapi excluded) vs est. ~1.4–1.5k — oversize accepted by Field (Selected 1) |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | **Must fix** (evidence only) | Medium | **Current:** handoff "Run proof" stops at `/api/health` 200; the brief §5 two-tab walkthrough on the real API is "Not done". Workflow §6 G1: a UI change must be exercised on the screen — a 200 is not proof. It matters here because the **pointer drag path is covered by no test** (jsdom has no drag events) and the real API's PUT returns active categories only (the UI relies on the refetch). **Updated:** run the brief §5 walkthrough as in BRIEF-041 (Field signs in via LINE in the in-app browser; the executor drives it): drag with the mouse **and** ↑ / ↓ with the keyboard → order entry tab shows the new order without reload · hide → gone from order entry · add "ทดสอบ" → add " ทดสอบ " → "มีหมวดชื่อนี้แล้ว" → delete · blocked delete · group create → link → switch an option off → POS sheet greys it → on → blocked delete → unlink → confirm delete. Record it in the handoff; no code change expected. If something fails, fix it and report a new S. |
| 2 | Suggestion | Low | **Current:** `CategoryNameInput` submits on Enter **and** on blur (rename); nothing marks a submit in flight, so Enter then clicking away before the response sends a second identical `PATCH` (harmless today — same row, same name — but a second error message can flash). **Updated:** a `submitting` ref that ignores blur / Enter while a save is pending. ~5 lines; fine to leave. |
| 3 | Suggestion | Low | **Current:** no UI test for "สูงสุดต้องไม่น้อยกว่าขั้นต่ำ" (CD-12 edge "max 1 < min 2"); the contracts test covers the rule. **Updated:** one assertion in `ModifierGroupEditor.test.tsx` if touched again. |
| 4 | Suggestion · cause: **brief wording (Cowork)** | Low | **Current:** brief §2 says server 400 field errors are "mapped the same way (BRIEF-040 helper)". No such helper exists — BRIEF-040's editor also shows a server 400 as one message (`useMenuSave` `failure`). The implementation matches the real 040 behaviour (summary line). **Updated:** no change; brief wording was wrong. A shared DR-021 field-path mapper can be its own small brief if wanted. |
| 5 | Suggestion | Low | **Current:** the migration e2e test calls `migration.down()` on the shared test DB and re-runs `up()` in `finally`; if the `DELETE` cleanup line is skipped by a failed assertion, `up()` throws in `finally` and leaves `bar_test` without the index for later runs. **Updated:** move the `DELETE` into `finally` before `up()`. ~2 lines. |
| 6 | Info | — | Two quick reorders: the second `onMutate` snapshots the first's optimistic list; if only the first PUT fails, its revert drops the second move until the `onSettled` refetch restores the server order. Self-heals in one round trip; no action. |
| 7 | Info (Cowork, after merge) | — | `docs/erd.html`: `uq_menu_category_name` (DR-025) — diff for Field after merge (KJ state Carry over). |
| 8 | Info (dev machine) | — | Migration `CategoryNameUnique1762700000000` is applied on dev `bar`; a plain `node dist/main` backend of `c99a1c2` is running on :3001 — stop it before `test:e2e`. |

## Recommendation to Field
Backend and DR-025 are exactly as decided, and the UI follows the brief closely, with good tests on the payload rules (Switch-on ids, revert, taken name). The one gap is evidence: nobody has used these screens against the real API yet, and drag-with-mouse has no test at all. The walkthrough needs your LINE sign-in in the in-app browser (as for 041); the executor drives the rest. Suggestions 2, 3 and 5 are a few lines each — worth folding in only if the executor touches those files anyway.

**Next command:** see *Field, 2026-10-23 (session)* below.

## Evidence Coverage
- Reviewed work SHA: `c99a1c2` (handoff `7c6cde5`; `git diff main...feat/BRIEF-045-menu-categories-addons-ui`)
- Sources inspected independently: migration + registration, `menu-write.typeorm-repository.ts` (`saveNamed`, counts), `menu-catalog.typeorm-repository.ts` (grouped count), contracts `menu.ts` / `errors.ts` / tests, `docs/schema.sql`, `openapi.json` (`CATEGORY_NAME_TAKEN`), `useCategories.ts`, `CategoriesModal.tsx`, `CategoryRow.tsx`, `CategoryNameInput.tsx`, `modifiers/**` (`_lib/group.ts`, hooks, `GroupEditor`, `OptionRows`, `RuleFields`, list, delete dialog), `MenuToolbar.tsx`, `lib/api/menu.ts` / `client.ts`, test assertions in `CategoriesModal.test.tsx` and `ModifierGroupEditor.test.tsx`, BRIEF-040 `useMenuSave.ts` (Finding 4)
- Tests: Cowork re-ran `tsc --noEmit` for contracts, backend and frontend + backend `check-class-files` on `7c6cde5` (all exit 0); lint / unit / e2e not re-run (macOS-built binaries) → handoff exits + `ci` on H.
- Run proof: read from the handoff (backend only).
- Written uncommitted; the executor commits it unchanged at PASS.

## Field, 2026-10-23 (session): Suggestions 2, 3, 5 → Must fix
Recorded by Cowork on Field's explicit instruction ("add suggestion fix also"). All three stay inside the brief's own files — no brief revision or DR needed. Finding 4 needs no code change; 6–8 stay Info.
- **Must fix 2:** `CategoryNameInput` — a `submitting` ref: Enter / blur do nothing while a save is pending; reset after success or error. Test: Enter then blur before the response → exactly one `PATCH`.
- **Must fix 3:** `ModifierGroupEditor.test.tsx` — ต้องเลือก on, ขั้นต่ำ 2, สูงสุด 1 → "เลือกสูงสุดต้องไม่น้อยกว่าขั้นต่ำ" (contracts copy), no request.
- **Must fix 4 (was Finding 5):** `menu-write.e2e-spec.ts` migration test — duplicate-row `DELETE` moves into `finally`, before `migration.up(runner)`.
- **Must fix 1** unchanged: real-API UI run proof per §5, done **on the new S** after these fixes (Field signs in via LINE in the in-app browser; the executor drives).

**Next command:** `execute BRIEF-045` (fix Must fix #1–#4: three code fixes above, gates, then the §5 real-API UI run proof on the new S, recorded in the handoff; report the new S for a compact re-check).

## Re-audit — 2026-10-23 (Cowork) · S = `419a159`
Reviewed `git diff 7c6cde5..528d6f7` (fixes `6d7b372`, `419a159`; handoff `528d6f7` — `app/` identical between `419a159` and `528d6f7`).

| Check | Result |
|---|---|
| Must fix 2 · `CategoryNameInput` | `submitting` ref set before `onSave`, cleared in `finally`; Enter / blur during a pending save return early · test: Enter then blur → exactly one `PATCH` ✅ |
| Must fix 3 · `ModifierGroupEditor.test.tsx` | required, min 2, max 1 → "เลือกสูงสุดต้องไม่น้อยกว่าขั้นต่ำ", `sent` empty ✅ |
| Must fix 4 · `menu-write.e2e-spec.ts` | duplicate-row `DELETE` now first in `finally`, before `migration.up` ✅ |
| Must fix 1 · run proof | §5 walkthrough on the real API with Field signed in: mouse drag + keyboard ↑ (order persisted after reload, order tab followed), hide → open order tab updated live, add / taken name / Esc / delete, group create → link → "ใช้กับ 1 เมนู" + delete blocked, option off → POS sheet disabled → on → enabled live, unlink → confirm delete ✅ |
| New in `419a159` · `MenuSwitch.tsx` | same track-click workaround as BRIEF-041 Rev 2 (`MenuItemRow`), now a shared component for `CategoryRow`, `OptionRows`, `RuleFields`; disabled respected; test clicks the visible track → one `PATCH` ✅ — needed for AC-3 / AC-7 on the real screen; inside the brief's files, no Guard trigger |
| New in `419a159` · `stopPropagation` removed | React Aria's keyboard handling already stops propagation; run proof confirms Esc cancels the input without closing the modal ✅ |
| `e2e/menu-backoffice.spec.ts` | URL wait raised to 20 s (navigation under load) — test-only ✅ |
| Gates | handoff: frontend lint · typecheck · build 0, unit 177, e2e 21 on `419a159`; backend lint · typecheck · `test:e2e` 169 on `6d7b372` (backend unchanged since, test move only) · Cowork re-ran frontend + backend `tsc --noEmit` on `528d6f7` (exit 0) · contracts / backend unit not re-run (no source change) → `ci` on H |

**Result: PASS** — zero Must fix. Audited S = `419a159`.

Info (no action in this brief):
- **I-1:** `MenuItemRow` (BRIEF-041) still carries its own inline track-click code; it could adopt `MenuSwitch` the next time that file is touched.
- **I-2:** handoff visual note — group drawer inputs show no border in an ~800 px pane → CD-12 polish / phone-shell brief.
- **I-3:** `MenuSwitch` assumes HeroUI keeps the track outside the `<label>`; if a HeroUI upgrade moves it inside, a track click would toggle twice — the track-click test would catch it.
- Findings 6–8 above stay Info (`docs/erd.html` for DR-025 after merge).

**Next command:** `execute BRIEF-045` (PASS commit: this audit unchanged + handoff + state, then open the PR; Field's own PR — merge once `ci` is green on H and S..H is evidence-only).
