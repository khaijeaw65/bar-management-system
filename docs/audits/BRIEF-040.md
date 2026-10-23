# Audit — BRIEF-040 Web POS: menu management — item list + editor (no photo) + live menu

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-23 |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-23 |
| **Branch / commit** | `feat/BRIEF-040-menu-editor-ui` · **S = `3df722b`** (work) · handoff `8dde1cf` → `81b691a` (run proof) · seeds `cb174f7` / `9fd4c49` / Ready `2ee875c` |
| **Depth** | Compact (UI; rules enforced server-side) — one data-integrity path checked in full |
| **Brief revision** | 1 |
| **Recommendation** | **CHANGES REQUIRED** (1 Must fix) ← Field makes the final call |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1 | ✅ | `useMenuList` reads `?includeHidden=true` under its own keys (`["menu","items","admin"]`, `["menu","categories","admin"]`) — no clash with order entry's `["menu","items"]` · `filter.ts` search + chip · "ซ่อนอยู่" chip · row `onAction` vs Switch · `MenuList.test.tsx` | Switch on hidden-category items: Finding 2 |
| AC-2 | ✅ | `useMenuSave`: `POST` with one `Idempotency-Key` per payload (same body → same key, edited body → new key) · toast + `?highlight=` · test + e2e + run proof 1 | |
| AC-3 | ⚠️ | `PATCH` with the loaded `updatedAt`; 409 `MENU_ITEM_STALE` → `details` parsed with `MenuItemSchema`, Alert, typed values kept, reload · run proof 2 (two tabs) — **but the loaded draft includes switched-off price options**: Finding 1 | |
| AC-4 | ✅ | `renamesOf`: item name or an existing option (`id` match) name changed → `RenameDialog`; cancel sends nothing; new options / prices don't trigger it · test + run proof 3 | |
| AC-5 | ✅ | `validate()` = contracts `Create` / `UpdateMenuItemSchema` + local checks (category, station unless charge, price) → inline + summary, no request; `normalizePrice` accepts "220" / "220.5" | |
| AC-6 | ✅ | shared `LeaveDialog` / `useLeaveGuard` moved to `components/ui` / `hooks` (settings import updated) · test | |
| AC-7 | ✅ | `useMenuLive`: `menu.changed` + `menu.availability_changed` → invalidate `["menu"]` (prefix covers list, editor, order entry) · used by the list and `useOrderMenu` · hook test + run proof 4 (third tab, no reload) | |
| AC-8 | ✅ | Handoff: lint, typecheck, test 151, e2e 17, build · run proof on the real API (4 steps) · Cowork re-ran `tsc --noEmit` (frontend) and `eslint` on the touched folders on `81b691a` (exit 0) | |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope | ✅ | no photo, categories / add-on screens, phone layout or permission gating |
| Routes (Pre-decided) | ✅ | `/pos/menu`, `/pos/menu/new`, `/pos/menu/[id]`; shared editor in `menu/_components/editor/` (sibling routes can't import each other's `_components`) |
| Dependencies | ✅ | none added (no form library — plain state + Zod) |
| Contracts | ✅ | unchanged; client validates with the API's schemas |
| Rename confirm (DR-022) | ✅ | |
| สูตร → `simple`, charge → `station: null` | ✅ | `payloadOf` |
| Sonar | ✅ | 2 S6819 fixed (`fieldset` / `legend`); none left in this brief's files |
| Size | ⚠️ | ~1,535 net app lines vs 700–850 (≈ 2×) |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | **Must fix** | High | **Current:** `draftOf(item)` (`_lib/draft.ts`) copies **every** `item.variants` entry into the form — including price options switched off by an earlier save (BRIEF-038 keeps them in reads with `isAvailable: false`) — and collects `modifierGroupIds` from all of them. `payloadOf` then sends their `id`s back. BRIEF-038 treats a listed id as "keep + re-activate", so **any later edit of that item (even a price change) silently brings removed price options back on sale**, at their old price, on every POS. A link left on a switched-off option to a since-archived add-on group (DR-024 amendment) would also be sent and fail the save with 400. Same path on "โหลดฉบับล่าสุด" (stale reload uses `draftOf(details)`). **Updated:** `draftOf` keeps only `variant.isAvailable` rows, and takes `modifierGroupIds` from those rows only. Test: an item with one active + one switched-off option → the editor shows one row; saving a price change sends only the active id (MSW asserts the body); the stale reload path the same. |
| 2 | Suggestion | Low | **Current:** the list Switch reads `available = unavailableReason !== "sold_out"`. For an item in a hidden category the API reports `sold_out` (category inactive), so the Switch shows "หมด" and toggling it can't change that. **Updated:** for items whose category is hidden, show the Switch disabled with the "ซ่อนอยู่" chip explaining why (or leave as is until the categories screen in BRIEF-045). |
| 3 | Info | — | Server 400s carry no field paths (DR-021), so they surface in the failure Alert, not under a field — accepted. |
| 4 | Info | — | The branch's base predates `main`'s docs merges (#88, #89); merge `main` before the PASS commit / PR (docs only). `.env.local` lacks `NEXT_PUBLIC_API_MOCKING` (setup gap, name only). |

## Recommendation to Field
CHANGES REQUIRED — one small fix with a real cost if missed: today, editing any item that once had a price option removed would quietly put that option back on sale. Filter switched-off options out when loading the form (~5 lines + one test). Everything else — stale handling, rename confirm, idempotent create, live refresh across tabs — is in place and proven on the real API.

**Next command:** `execute BRIEF-040` (fix Must fix #1; report the new S for a compact re-check).

## Evidence Coverage
- Reviewed work SHA: `3df722b` (handoff `81b691a`; `git diff main...HEAD`)
- Sources inspected independently: `_lib/draft.ts` (draft ↔ payload, validation, renames), `_hooks/useMenuSave.ts`, `_hooks/useMenuList.ts`, `_hooks/useAvailabilityToggle.ts`, `hooks/useMenuLive.ts`, `useOrderMenu.ts`, `lib/api/menu.ts`, query keys across `app/pos/menu`; BRIEF-038 variant semantics (listed id re-activates) and DR-024 amendment
- Tests: Cowork re-ran frontend `tsc --noEmit` and `eslint` on touched files (exit 0); Vitest / Playwright / build not re-run (macOS-built binaries) → handoff exits + `ci` on H.
- Run proof: read from the handoff (screenshots kept in that session only).
- Written uncommitted; the executor commits it unchanged at PASS.

## Re-audit — 2026-10-23 (Cowork) · S = `fbaee5b`
**Change since `3df722b`:** one fix commit — `_lib/draft.ts` (+4 / −2) and `MenuEditor.test.tsx` (+35). No other file.

| Finding | Result | Evidence |
|---|---|---|
| 1 (Must fix) | ✅ Fixed | `draftOf` keeps only `variant.isAvailable` rows and takes `modifierGroupIds` from those rows only. Test 1: an item with one active + one switched-off option → one row in the form; saving a price change sends exactly `[{ id: <active>, name: "ปกติ", price: "190.00" }]` (MSW body). Test 2: after a 409, "โหลดฉบับล่าสุด" with the same item also shows one row. |

- Cowork re-ran frontend `tsc --noEmit` and `eslint` on `app/pos/menu` at `fbaee5b` (exit 0); Vitest / e2e → executor's run + `ci` on H.
- Findings 2–4 unchanged (Suggestion / Info). Merge `main` (docs #88, #89) before the PASS commit.

**Result: PASS** — zero Must fix. Audited S = `fbaee5b`.

**Next command:** `execute BRIEF-040` (merge `main`, then PASS commit: this audit unchanged + handoff + state, then PR; Field's own PR — merge once `ci` is green on H and S..H is evidence-only).
