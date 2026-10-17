# Audit — BRIEF-016 Backend: venue settings + menu read + seed

| | |
|---|---|
| **Auditor** | Cowork (Claude, Cowork session 2026-10-17) |
| **Assignment** | Brief: Cowork (default) |
| **Date** | 2026-10-17 |
| **Branch / commit** | `feat/BRIEF-016-venue-menu-read` · `7be2120eb66e7eb70258093e95b725a0fb3cc3b7` (work) · head `b8d8eff` (docs only: handoff + state; app tree identical to work SHA) · no PR (audit before PR) |
| **Depth** | Full (core-flow input: prices + availability feed orders) |
| **Brief revision** | 2 (Ready 2026-10-17) |
| **Recommendation** | **PASS** (re-audit on `8c523b1`) — Finding 1 fixed; S2, S3 open, not blocking ← Field makes the final call |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence (test / file) | Note |
|---|---|---|---|
| AC-1 | ✅ | `test/menu-seed.e2e-spec.ts` "creates one venue and the menu, and a second run does not duplicate them" | Seed = CD-04 menu, 11 items; charge has no station; natural keys as brief. |
| AC-2 | ✅ | `test/menu.e2e-spec.ts` "lists categories and the full menu in sort order" | `?available=true` drops ยำหมูยอ and the closed promo. |
| AC-3 | ✅ | `menu-availability.spec.ts` | Fri 16 / Sat 17 / Thu 15 / Sun 18 Oct 2026 cases incl. Sat 01:00 in, Sat 02:00 out, Sun 01:00 in; 20:59 in / 21:00 out. |
| AC-4 | ⚠️ | `menu-catalog.service.spec.ts`, `menu.e2e-spec.ts` "reports a missing variant…" | Missing id reported without throwing ✅. Availability per variant not correct → Finding 1. |
| AC-5 | ✅ | `menu.e2e-spec.ts` "reads venue settings without payment fields" | Keys asserted. |
| AC-6 | ✅ | `menu.e2e-spec.ts` "returns 404 … and 400 …" | `available=false` → 400 is a deliberate choice (OpenAPI enum `['true']`); fine. |
| AC-7 | ✅ | `docs/api/openapi.json`, `openapi:check` per handoff | 4 endpoints, `Permission:` in each description. |
| AC-8 | ✅ (handoff) | handoff gate table on `7be2120` | Not re-run by Cowork — the linked shell has no pnpm / Linux `node_modules`. |
| AC-9 | ✅ | `app/backend/README.md` | Seed order + re-run note. |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope — nothing outside the brief | ✅ | No 86, no cache, no writes. |
| No unapproved deviations / deps | ✅ | No new package; `package.json` change = exactly the Q3 `seed:menu` line. |
| Schema = `schema.sql` §1 + §4 | ✅ | Columns, enums, FKs, CHECKs, `idx_menu_item_avail_item` match. Migration timestamp `1762000000000` sorts after `1761187200000`. |
| `PermissionsGuard` only, no inline checks | ✅ | `@RequirePermissions` metadata (enforcement = IAM brief). |
| `save()` not `update()` on audited entities | ✅ | Seeds use repository `save()`. |
| One availability rule (BRIEF-016 §6) | ✅ | List, detail and `getOrderable` all call `menuAvailability`. |
| `getOrderable` reads the DB, never a cache | ✅ | Comment + no cache exists. |
| Fixed query count (no N+1) | ✅ | List = categories, items, windows ∥ variants, modifiers (5). |
| Server clock only · injected clock | ✅ | `CLOCK` token; `Intl` for Asia/Bangkok, no new date library. |
| Hexagonal layering · ports + tokens | ✅ | |
| Thai `message`, English `code` | ✅ | |

## Test Quality
- Availability spec is precise and pins the DR-010 rule 10 edge cases with real dates.
- No test covers a variant with `is_available = false`, or `getOrderable` on an item in an inactive category (Finding 1).
- Seed e2e checks idempotency by ids — good.

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | **Must fix** | **Med** | **`getOrderable` (and item `availableNow`) ignore `menu_item_variant.is_available`; an inactive category gives `availableNow: false` with `unavailableReason: null`.** `menu-catalog.service.ts` → `toOrderable` / `toItem` take the decision from `menuAvailability(availabilityInput(record))`, which reads only `categoryActive`, `isAvailable` (item) and `windows`. A variant set unavailable stays `availableNow: true` in `getOrderable`, so BRIEF-012 would accept it and charge for it. For an item whose category is inactive, `getItem` / `getOrderable` return `availableNow: false, unavailableReason: null`, so BRIEF-012 cannot build the DR-010 rule 11 `reason` (contract allows only `sold_out` / `out_of_window`). Seed data has every variant available, so the demo is not affected today — but BRIEF-012 builds on this contract. **Current →** item-level decision only, reason may be null when unavailable. **Updated →** (a) `getOrderable`: per-variant `availableNow = itemDecision.availableNow && variant.isAvailable`; variant off → `unavailableReason: 'sold_out'`. (b) Invariant everywhere: `availableNow === false ⇒ unavailableReason !== null`; inactive category → `'sold_out'` (hidden from the list already; closest DR-010 reason, same client pattern). (c) Tests: unit — variant off → `sold_out`; inactive category → `sold_out`; e2e — `getOrderable` on a variant flipped to unavailable. |
| 2 | Suggestion | Low | **`seed:venue` resets venue settings on every run.** `seed-venue.ts` → `upsertVenue` overwrites `name`, `kitchenDisplayEnabled = false`, `businessDayCutoff = '06:00:00'` on an existing row. Re-seeding seats after switching the kitchen screen on for a demo (CD-15 board·4) silently switches it off. **Current →** update three settings on re-run. **Updated →** set settings only on insert; on re-run leave the row as it is (idempotent = "exists", not "reset"). |
| 3 | Suggestion | Low | **`VenueSettingsSchema` lives in contracts `schemas/menu.ts`.** Next to menu schemas, while the venue owns it. **Updated →** move to `schemas/venue.ts` (re-export from `index.ts`) when convenient — before BRIEF-013 adds payment settings there. |

## Summary
Clean, well-scoped implementation: schema match, one availability rule with solid edge-case tests, fixed query count, no new packages, seeds idempotent. One contract gap must close before BRIEF-012 relies on it: variant-level availability and a non-null reason whenever an item is not orderable.

**Next:** executor fixes Finding 1 (fix commit only — no handoff/state commit), reports the new S → `ตรวจ BRIEF-016` re-audit appends here.

---

## Re-audit — 2026-10-17 · fix commit `8c523b19303e47c49f58dda1738fefdc3c3580bd`
- Scope: `8c523b1` changes 5 files — `menu-availability.ts` (+ spec), `menu-catalog.service.ts` (+ spec), `test/menu.e2e-spec.ts`. No other app, docs or dependency change. Fix commit only (no handoff / state commit) ✅.

| # | Status | Evidence |
|---|---|---|
| 1 | ✅ | (a) `toOrderable`: `availableNow = decision.availableNow && variant.isAvailable`; variant off → `'sold_out'` (also when the item is outside its window — sold out wins, consistent with item-level rule). (b) `menuAvailability`: `!categoryActive || !isAvailable → 'sold_out'`, so `availableNow === false ⇒ unavailableReason !== null` holds for every input (inside window + active + available is the only `null` path). (c) Unit: "reports a turned-off variant as sold out", "reports an inactive category as sold out", inactive-category decision asserted with `toEqual`. E2e: "treats a turned-off variant as sold out in getOrderable" flips ช้างดราฟต์'s variant on real rows; `beforeEach` re-runs `seedMenu`, which resets `is_available = true`, so later tests are isolated. |

- **AC-4** now ✅.
- **Open suggestions (not blocking):** S2 (`seed:venue` resets settings on re-run), S3 (`VenueSettingsSchema` → `schemas/venue.ts`). New, informational: list-level `availableNow` is item-level — an item whose every variant is off still shows `availableNow: true` with all `variants[].isAvailable: false`; POS greys the variants (D4). Revisit with BRIEF-017 if a toggle per variant is added.
- **Evidence:** gates not re-run by Cowork (no pnpm / Linux `node_modules` in the linked shell); executor's gate results for `8c523b1` go in the final handoff at PASS.

**Next (§3 step 5):** executor makes one `docs(BRIEF-016): audit PASS, handoff, state` commit — this report unchanged + final handoff (gate evidence on `8c523b1`) + state — pushes, and the git hand opens the PR (ready for review). Field's own PR → merge pre-approved once CI is green on that head (§7).
