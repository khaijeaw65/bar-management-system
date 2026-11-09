# Audit — BRIEF-069 Web: back-office tables & counter seats management + QR sticker print

| | |
|---|---|
| **Auditor** | Antigravity (independent auditor session) |
| **Assignment** | Field explicit approval (split Antigravity into executor and auditor sessions for BRIEF-069 and BRIEF-070, 2026-11-01) |
| **Date** | 2026-11-01 |
| **Branch / commit** | `feat/BRIEF-069-web-tables-admin` · `6ad751f` (work commit S) |
| **Depth** | Compact (web admin UI + QR print layout) |
| **Brief revision** | 1 |
| **Recommendation** | PASS |

> Findings describe code and documents, not people. Use "Current → Updated" framing.
> Hard rule: an agent session that implemented, seeded, fixed, or paired on this brief must never run or write this audit without explicit Field authorization in a split session.

## Acceptance Criteria
| AC | Met? | Evidence (test / file) | Note |
|---|---|---|---|
| AC-1 | ✅ | `app/frontend/e2e/settings-tables.spec.ts:4` (J1) · `TablesAdminScreen.test.tsx:13` · `SettingsNav.test.tsx` | Tab "โต๊ะและ QR" active with `tables:manage`; renders counter & table sections with status chips ("ใช้งาน", "มีแขก", "ปิดอยู่") |
| AC-2 | ✅ | `app/frontend/e2e/settings-tables.spec.ts:17` (J2) · `SeatFormDialog.test.tsx:12` · `tables-admin.test.ts:23` | Form submits to `POST /tables`, appears at section end, shows toast feedback |
| AC-3 | ✅ | `app/frontend/e2e/settings-tables.spec.ts:32` (J2) · `SeatFormDialog.test.tsx:32` | 409 `SEAT_LABEL_TAKEN` displays inline error "มีชื่อนี้แล้ว" and keeps form open |
| AC-4 | ✅ | `TablesAdminScreen.test.tsx:55` · `tables-admin.test.ts:36` | Up/Down triggers call `PUT /tables/order` with reordered ID list; UI reflects order |
| AC-5 | ✅ | `app/frontend/e2e/settings-tables.spec.ts:43` (J3) · `TablesAdminScreen.test.tsx:37` · `tables-admin.test.ts:44` | Deactivating seat with live visit returns 409 `SEAT_IN_USE`, keeps switch active, and shows toast "มีแขกอยู่ที่โต๊ะนี้ ปิดโต๊ะก่อน" |
| AC-6 | ✅ | `app/frontend/e2e/settings-tables.spec.ts:58` (J4) · `QrPrintModal.test.tsx:23` · `tables-admin.test.ts:58` | Modal renders high-contrast SVG QR sticker with venue/table branding; regenerate prompts confirmation dialog before calling `POST /tables/:id/qr/regenerate` |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope — nothing outside the brief | ✅ | Only tables admin UI, API client, MSW mocks, permission routing, and tests touched |
| Seeded `.e2e-spec.ts` files untouched by executor (`git diff <seed>..<S> -- <e2e-files>` empty) | ✅ | `git diff c52d03f..6ad751f -- app/frontend/e2e/settings-tables.spec.ts` is completely empty |
| Feature `design.md` / `requirements.md` synced if code map or contracts changed (no spec drift) | ✅ | Standalone single-slice brief; inline design and contracts respected |
| No unapproved deviations / dependencies | ✅ | Uses pre-installed `qrcode.react`, `@heroui/react`, `lucide-react`; no extra packages added |
| Locked architecture rules (`CLAUDE.md`) respected | ✅ | Route guarded via `tables:manage` in `pos-routes.ts`; Next.js App Router conventions followed |
| `PermissionsGuard` only, no inline checks | ✅ | N/A (frontend brief; route checked via `permissionForPath`) |
| `save()` not `update()` on audited entities | ✅ | N/A (frontend brief) |
| ESM `.js` imports · `@bar/contracts` as source of truth · OpenAPI regenerated | ✅ | Frontend uses bundler imports without `.js` extension per `frontend.md`; schemas imported from `@bar/contracts` |
| Scoped rule file & coding style (`docs/rules/<kind>.md` + `core.md` anti-patterns) respected | ✅ | No `as any`, no `@ts-ignore`, tokens `--qr-bg` / `--qr-ink` used for QR print styling |
| Agent boundaries respected (only Section 7 *Unlocked protected files* touched) | ✅ | No protected files touched in implementation commits |
| Runs in the real runtime — run proof from the audited SHA `S` (rebuilt, not restarted; UI exercised on the real screen, not just a 200 or a green build) | ✅ | Real Playwright runner exercised against live Next.js dev server with MSW mocks (4/4 passed) |

## Test Quality
- Seeded acceptance test `app/frontend/e2e/settings-tables.spec.ts` (4 scenarios J1–J4) passes against live Playwright browser runner.
- Comprehensive unit and integration test coverage across all components:
  - `QrPrintModal.test.tsx`: verified SVG render, branding copy, confirmation dialog cancel/confirm flows.
  - `SeatFormDialog.test.tsx`: verified seat creation, empty label validation, duplicate label error display.
  - `TablesAdminScreen.test.tsx`: verified section rendering, status chips, occupied seat deactivation guard, and reordering.
  - `tables-admin.test.ts`: verified all 7 client API endpoints with typed contracts.
  - `pos-routes.test.ts`: verified `/pos/settings/tables` route permission gate.
- All 72 frontend test files (338 tests) pass green.

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Suggestion | Low | `app/frontend/src/app/pos/settings/tables/_components/QrPrintModal.tsx:63` · Venue title "The Loft Bar" is currently hardcoded for sticker preview. In a future venue-settings integration brief, read venue name dynamically from venue context or store. |

## Recommendation to Field
Implementation is clean, strictly adheres to BRIEF-069 Rev 1 and CD-13 specifications, has zero spec drift, passes all acceptance criteria, and leaves seeded acceptance tests untouched. All 4 quality gates are green. Recommended for merge.

**Next → in kj (Antigravity executor):** `ship BRIEF-069`

## Evidence Coverage
- Reviewed work SHA: `6ad751f` (seed SHA: `c52d03f`)
- Sources/diff inspected independently: `app/frontend/src/app/pos/settings/tables/**`, `app/frontend/src/lib/api/tables-admin.*`, `app/frontend/src/lib/permissions/pos-routes.*`, `app/frontend/src/mocks/tables-admin.*`, `app/frontend/e2e/settings-tables.spec.ts`
- Tests run independently:
  - `pnpm --filter @bar/frontend lint` (exit 0)
  - `pnpm --filter @bar/frontend typecheck` (exit 0)
  - `pnpm --filter @bar/frontend test` (exit 0, 72 test files / 338 tests passed)
  - `pnpm --filter @bar/frontend test:e2e e2e/settings-tables.spec.ts` (exit 0, 4 passed in 9.7s)
- Written uncommitted in checkout; executor commits unchanged at `ship BRIEF-069`.

## Sonar (local scan)
- Handoff Sonar section present for the scanned commit = S (`6ad751f`): yes
- Remaining issues have reasons; no unapproved "won't fix"/exclusions: yes (0 issues in touched files; 18 pre-existing across untouched codebase)
- Learning mode respected: n/a (kj session)
