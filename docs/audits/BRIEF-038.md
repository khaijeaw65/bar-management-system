# Audit — BRIEF-038 Backend: menu write API (items, variants, categories)

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-23 |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-23 |
| **Branch / commit** | `feat/BRIEF-038-menu-write-api` · **S = `5e29d80`** (work) · handoff `50295c0` · `main` merged at `8d642f9` (after #78 / #79) · seed `3c8be95` |
| **Depth** | Full (prices feed orders and payments) |
| **Brief revision** | 1 |
| **Recommendation** | **PASS** ← Field makes the final call |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1 | ✅ | `MenuItemWriteController.create`: parse → `idempotency.begin` (scope `menu-item`) → replay returns stored body, else `createItem` → `finish` / `cancel` on error — same gate as orders / payments · e2e: 201, listed in `GET /menu/items`, replay = identical body, 1 row · run proof 1 | |
| AC-2 | ✅ | `checkItemShape` (contracts `superRefine`): recipe → 400, charge + station → 400, simple without station → 400, `variants.min(1)`, duplicate variant / group ids; mirrors `chk_menu_item_station` (DR-012) · unit `menu-write.test.ts` + e2e 400 ×5, unknown category 404, charge without station 201 | |
| AC-3 | ✅ | `saveItem`: `lockItem` = `SELECT … FOR UPDATE` → `Date.parse(input.updatedAt) < stored` → 409 `MENU_ITEM_STALE` with `details` = current item (Q1 = A) · PATCH sets `updated_at` explicitly, so variant-only / link-only edits also move the stamp · e2e fresh 200, stale 409 + `details`, variant-only edit then stale 409, unknown 404 · run proof 4 | ms precision checked: driver and API both truncate to ms → no false 409 on a fresh load (e2e covers create → PATCH) |
| AC-4 | ✅ | `saveVariantSet`: listed ids updated + active, new inserted, dropped → `is_available = false`, never deleted · own-variant check (foreign id → 400) · order API already rejects `!variant.isAvailable` (`menu-catalog.service` `availableNow`) · e2e: 3 rows kept, old lines keep `ดับเบิล ฿260.00`, new order on it → 409 `ITEM_UNAVAILABLE` | Variant `is_available` is written by no other code (sold-out = item level, BRIEF-027) → no clash with 86 |
| AC-5 | ✅ | no write path touches `order_item`; `unit_price_snapshot` untouched · e2e bill unchanged, old 180 / 260, new 200 · run proof 2–3, 5–6 (POS web order at the new price, drawer keeps ฿180, DB snapshots 180 / 200 / 200) | |
| AC-6 | ✅ | create (last in order), rename, reorder (all visible ids once; hidden may be omitted and go last; unknown 404; missing visible 400), hide → catalog reads filter `isActive` (items + category gone from POS), delete: count under `FOR UPDATE` → 409 `CATEGORY_NOT_EMPTY`, empty → `{ ok: true }`, again 404 · item writes hold the category `FOR KEY SHARE`, so a concurrent delete waits and sees the item | |
| AC-7 | ✅ | `changed()` called once in each public method **after** the `@Transactional` private method returns → no event on rollback or replay · e2e: create + replay = 1 event; 6 category writes = 6 payloads in order | PATCH emit shares the same path but has no event assertion — not worth a fix round |
| AC-8 | ✅ | Handoff gates on `5e29d80`: contracts build / lint / typecheck / test (58), backend lint, typecheck, test (102), test:e2e (126, new 6), `openapi:check` exit 0 · README Menu table + WS events · Cowork re-ran `tsc --noEmit` for contracts and backend (exit 0) and `check-class-files` (exit 0) on `50295c0` | Frontend unit tests (not a brief gate) flaky under machine load — Finding 4 |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Writes only through `MenuWriteService`, transaction per request | ✅ | controllers parse + delegate; one `@Transactional` method per write; repository on `txHost.tx` |
| `save()` on audited entities | ✅ | `menu_item`, `menu_item_variant`, `menu_category` via `save()`; `insert` / `delete` only on `menu_variant_modifier_group` (no audit columns) and the empty-category delete |
| No schema change / migration | ✅ | none; all columns exist |
| Permissions | ✅ | `@RequirePermissions('menu:write')` on all six handlers (e2e reflector test); no inline checks |
| Module boundaries | ✅ | `NotificationsService` from the `@Global` module (no gateway import); `IdempotencyService` + `RedisModule` provided like Order / Payment; no other module's repositories |
| Contracts | ✅ | new `menu-write.ts`, `MENU_CHANGED` + payload, 2 error codes, `ApiErrorData` gains `{ details: MenuItem }`; `MenuItem.updatedAt` added — implied by Q1 = A ("client sends the `updatedAt` it loaded"), not a deviation |
| Money (DR-004) | ✅ | `MenuPriceSchema` `^\d{1,8}\.\d{2}$` (fits `NUMERIC(10,2)`, ≥ 0.00); `basePrice` min computed in satang |
| Out of scope respected | ✅ | no modifier-group CRUD, photos, item delete, promo windows, sort-in-category, UI |
| Dependencies / protected files | ✅ | no `package.json` change; none touched |
| Sonar | ✅ | none in files this brief adds; 2 pre-existing in untouched files |
| Size | ⚠️ | ~1,180 net app lines vs 550–650 estimate (~1.9×) — same pattern as BRIEF-037 Finding 4 |

## Interpretations (handoff) — all accepted
PATCH = whole form (omitted `description` → null; omitted `modifierGroupIds` keeps links) · `variants[].id` on PATCH (re-sending a deactivated id re-activates it) · deactivated variants stay in reads with `isAvailable: false` · reorder may omit hidden categories · unknown category → 404, unknown group / foreign variant → 400 · 86 moves `updatedAt` too (open editor gets 409 → reload; documented). All stay inside the brief wording and Q1 = A.

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Field decision (no change in this PR) | Medium | **Current:** `order_item` snapshots the price but not the item / variant **name**; order reads join the live `menu_item` / `menu_item_variant` names. A rename (item or variant, e.g. "แก้ว" → "แก้วใหญ่") changes how past orders and bills read; amounts stay correct. **Updated:** either accept for S1 (bills are numerically right) or plan a name snapshot on `order_item` — a schema change → its own DR, after 8 Nov. Cowork recommends: accept for S1, DR after the demo. |
| 2 | Suggestion | Low | **Current:** `menu_item.updated_at` comes from two clocks — DB `CURRENT_TIMESTAMP` (`@UpdateDateColumn` on create and on 86) and app `clock.now()` on PATCH. Same host today; with ECS + RDS, a few ms of skew could let a save that should be stale through in a very narrow window. **Updated:** stamp PATCH from the same source, e.g. `GREATEST(now(), updated_at + interval '1 millisecond')` in SQL. Fold into a later menu brief or before AWS (9 Nov); not blocking. |
| 3 | Info (next brief) | — | `GET /menu/categories` lists active only, so a hidden category can't be found to un-hide. **Updated:** the menu UI brief (040 / 041) needs a manager read (e.g. `?includeHidden=true`, `menu:write`) — Cowork adds it to that Draft. Also the POS doesn't listen to `menu.changed` yet (UI briefs). |
| 4 | Info (CI) | — | Frontend unit tests (not in this brief's gates; only fixtures changed) timed out 5 / 138 under heavy machine load, different tests each run, all pass when re-run. `ci` on H is the check; if `ci` fails on frontend timeouts, re-run once and report — a repeat needs its own follow-up. |
| 5 | Info (planning) | — | ~1.9× size again (tests ≈ 38 %). Same note as BRIEF-037 F4: next Drafts count tests in the estimate. |

## Recommendation to Field
PASS. Concurrency is handled where it matters — the item row lock plus the `updatedAt` check, the category key-share lock against delete, and events only after commit. Variants are never deleted, and both the e2e and a real POS order prove old lines keep their snapshot price. The one product question is Finding 1 (renames change how past bills read): accept for S1 or DR after 8 Nov — it doesn't block this PR.

**Next command:** `execute BRIEF-038` (PASS commit: this audit + handoff + state, then PR; Field's own PR — merge once `ci` is green on H and S..H is evidence-only).

## Evidence Coverage
- Reviewed work SHA: `5e29d80` (handoff `50295c0`; `git diff main...50295c0`)
- Sources inspected independently: `menu-write.service.ts`, `menu-write.repository.ts`, `menu-write.typeorm-repository.ts` (all SQL + `saveVariantSet` / `replaceLinks`), `menu-item-write.controller.ts`, `menu.controller.ts` diff, `menu.module.ts` diff, catalog repo / service diffs, `menu-availability.ts` + catalog `isActive` filters, contracts `menu-write.ts`, `menu.ts`, `api-error.ts`, `errors.ts`, `events/menu.ts`, `http-exception.types.ts`, `base.entity.ts` (`@UpdateDateColumn`), `docs/schema.sql` §4 (variant / link tables, FKs), full `menu-write.e2e-spec.ts`
- Tests: Cowork re-ran contracts + backend `tsc --noEmit` (exit 0) and `check-class-files` (exit 0). oxlint, Vitest, Jest, e2e and `openapi:check` not re-run (Cowork's Linux shell can't load the macOS-built native binaries) → handoff exits for G1, GitHub `ci` on H for G2.
- Run proof: read from the handoff (curl + POS web, DB snapshot query); screenshots not opened.
- Written uncommitted; the executor commits it unchanged at PASS.

## Field, 2026-10-23 (session): Findings 1–3 decided
Recorded by Cowork on Field's explicit instruction. All three are **new work outside BRIEF-038's scope** — nothing changes on this branch; result unchanged: **PASS**.

| # | Field's decision | Where it goes |
|---|---|---|
| 1 | **Option B** — snapshot item / variant / modifier-option **names** on order lines at order time (schema change), **plus a UI guard**: renaming an item or price option asks the manager to confirm before saving. | Schema + order API → DR-022 (Cowork drafts, Field approves) + its own backend brief. UI confirm → Pre-decided item in the menu UI brief. |
| 2 | **Schema change: `menu_item.updated_at` set by the database on every update** (DB time, never the app clock), replacing the app-side `clock.now()` stamp on PATCH. | DR-023 (Cowork drafts, Field approves) + the next menu backend brief (BRIEF-039). |
| 3 | **Option A** — `?includeHidden=true` on `GET /menu/categories` and `GET /menu/items` (`menu:write`), `isActive` added to the category response. | Pre-decided item in BRIEF-039 (contract change, no DR needed). |

Timing (Field, same session): F1 name snapshot runs **before 8 Nov**, right after BRIEF-039. F2 table scope: open (pros / cons sent to Field).
F2 table scope (Field, same session): **Option 2 — all audited tables.** One shared `BEFORE UPDATE` trigger on every table with `updated_at`, monotonic: `GREATEST(now(), OLD.updated_at + interval '1 millisecond')`; the app-side `clock.now()` stamp in the menu PATCH is removed. Services that return `updatedAt` from a saved entity must re-read it. → DR-023.
