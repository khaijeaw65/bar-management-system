# Handoff — BRIEF-016 Venue settings and menu read

| | |
|---|---|
| **Implementer** | kj |
| **Date** | 2026-10-17 |
| **Brief revision** | 2 |
| **Branch / PR** | `feat/BRIEF-016-venue-menu-read` · PR opens after this PASS commit |
| **Commit** | `8c523b19303e47c49f58dda1738fefdc3c3580bd` (audited work). Prior implementation `7be2120`. |
| **Status** | Audit PASS — merged PR determines Done |

> Gate evidence below was run on `8c523b1`. This handoff is the later PASS docs commit.

## Summary
The backend stores one venue and the CD-04 sample menu, and staff can read both. `menuAvailability` is the only clock rule: Asia/Bangkok, injected `now`, end instant exclusive, and a window that crosses midnight belongs to the day it starts. `MenuCatalogService.getOrderable` uses that same rule and always reads the database. `GET /venue` returns the five POS fields and nothing about payment.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `test/menu-seed.e2e-spec.ts` — seed twice, same ids, one venue, 11 items, charge has no station, every item has a variant |
| AC-2 | ✅ | `test/menu.e2e-spec.ts` — category and item order, `?categoryId`, `?available=true` drops ยำหมูยอ and the closed promo |
| AC-3 | ✅ | `src/modules/menu/application/menu-availability.spec.ts` — no window, sold out, 20:59 in / 21:00 out, Fri–Sat overnight including Sat 01:00 and Sun 01:00, inactive category not listed |
| AC-4 | ✅ | `menu-catalog.service.spec.ts` — missing id does not throw; variant off and inactive category are `sold_out` · `test/menu.e2e-spec.ts` checks price, station, sold out, and a variant flipped off on real rows |
| AC-5 | ✅ | `test/menu.e2e-spec.ts` — seeded settings, response keys have no payment fields |
| AC-6 | ✅ | `test/menu.e2e-spec.ts` — unknown item 404 `NOT_FOUND`; bad `categoryId` and `available=false` are 400 `VALIDATION_ERROR` |
| AC-7 | ✅ | `docs/api/openapi.json` lists the 4 endpoints; each description starts with `Permission:`. `openapi:check` exit 0 |
| AC-8 | ✅ | Gate table below |
| AC-9 | ✅ | `app/backend/README.md` seed order `seed:staff` → `seed:venue` → `seed:menu`, each safe to re-run |

## Gate Evidence (G1)
Run on the work tree that became `8c523b1`, before this docs commit. Node v24.14.0, pnpm 10.0.0. E2e used Postgres `bar` on localhost:5432 and Redis `redis://127.0.0.1:6379`.

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/contracts test` | 0 | 13 passed · 0 failed |
| `pnpm --filter @bar/backend lint` | 0 | pass |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 50 passed · 0 failed |
| `pnpm --filter @bar/backend test:e2e` | 0 | 39 passed · 0 failed |
| `pnpm --filter @bar/backend build` | 0 | pass |
| `pnpm --filter @bar/backend openapi:check` | 0 | pass (export produced no diff) |

## Sonar (local scan)
- Not run. The brief marks the local scan optional.

## Decisions Raised
- none. `SMALLINT[]` maps with TypeORM `array: true`. Bangkok time uses `Intl`. No new package.

## Deviations from Brief
- None.

## Known Gaps / Follow-ups
- `@RequirePermissions` is metadata only until the IAM brief, as the brief already records.
- `imageUrl` is always `null`. `image_key` exists and is unused.
- No menu or venue writes, no Redis menu cache, no 86 toggle. Those are BRIEF-017. `getOrderable` is a service method for BRIEF-012, not an HTTP route.
- Promo rows are `item_type = simple`. Recipe stock is out of this brief. The charge row is the only `charge`, and its `kitchen_tag` is null.
- Audit suggestions left open: `seed:venue` still overwrites name, kitchen display, and cut-off on re-run; `VenueSettingsSchema` still lives in `schemas/menu.ts`.
- List `availableNow` stays item-level. A variant that is off is `sold_out` in `getOrderable`. An item can still show `availableNow: true` while every variant is off.

## AI Usage
**High** — Cursor implemented the menu module, venue read, seeds, contracts, tests, and this handoff.

## Review Routing
- Assigned auditor: Cowork
- Audit: PASS on `8c523b19303e47c49f58dda1738fefdc3c3580bd` (re-audit appended). Must fix: 0.
- Next: open the PR from this PASS commit. Merge when `ci` is green on that head.

## Notes for Reviewer
- The venue row is `slug` `main`, name `The Loft Bar`, kitchen display off, cut-off `06:00`. Re-running the seed updates those three and does not clear a PromptPay id that a later brief may set.
- Sample promos follow the brief's two windows, named from CD-04 / CD-14: `ลีโอ 4 ขวด + ถังน้ำแข็ง` every day 17:00–21:00, and `ค็อกเทล 1 แถม 1` Friday–Saturday 22:00–02:00. The design also draws `ไฮบอลมะนาวโซดา 2 แก้ว` as a second daily tile; this seed keeps one daily item.
- โอลด์แฟชั่น is `ปกติ` ฿260 and `ดับเบิล` ฿360. Both variants link to `น้ำแข็ง` (required, 1 of ปกติ / ก้อนใหญ่) and `เพิ่ม` (optional, 0–1 เชอร์รี่ +฿20).
- Category `sort_order` follows the CD tab order, with โปรโมชั่น first.
- List, detail, and `getOrderable` call `menuAvailability`. The list omits an inactive category. Detail still returns that item, with `availableNow` false.
- The menu list is five queries (categories, items, windows, variants, modifier join). `getOrderable` is five as well. Nothing is cached.
