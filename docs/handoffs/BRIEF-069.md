# Handoff — BRIEF-069 Web: back-office tables & counter seats management + QR sticker print

| | |
|---|---|
| **Implementer** | kj (Antigravity) |
| **Date** | 2026-11-01 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-069-web-tables-admin` (PR opens after audit PASS) |
| **Commit** | `6ad751f` (work commit S) |
| **Status** | Audit PASS |

## Summary
Implemented the POS Settings back-office tables and counter seats management interface at `/pos/settings/tables`, guarded by `tables:manage` permission with new "โต๊ะและ QR" tab in `SettingsNav`. Features sectioned listing for "โต๊ะ" and "เคาน์เตอร์" with status chips ("ใช้งาน", "มีแขก", "ปิดอยู่"), active switches guarded against guest tabs with 409 `SEAT_IN_USE` toast feedback, sort order adjustment within sections calling `PUT /tables/order`, modal for adding and editing seats with 409 `SEAT_LABEL_TAKEN` duplicate label inline validation, and high-contrast printable table QR sticker preview with `qrcode.react` vector SVG and confirmation dialog for QR token regeneration.

## Acceptance Criteria
| AC | Result | Evidence |
|---|---|---|
| AC-1 | ✅ | Staff with `tables:manage` sees "โต๊ะและ QR" tab and sections for "โต๊ะ" and "เคาน์เตอร์" with status chips. Verified in `e2e/settings-tables.spec.ts` J1, `TablesAdminScreen.test.tsx` AC-1, and `SettingsNav.test.tsx`. |
| AC-2 | ✅ | Staff adds new seat ("T7", kind "table"), saved via `POST /tables` at end of section with fresh QR token and toast feedback. Verified in `e2e/settings-tables.spec.ts` J2, `SeatFormDialog.test.tsx` AC-2, and `tables-admin.test.ts`. |
| AC-3 | ✅ | Duplicate label on create/rename returns 409 `SEAT_LABEL_TAKEN` and displays inline error "มีชื่อนี้แล้ว". Verified in `e2e/settings-tables.spec.ts` J2 and `SeatFormDialog.test.tsx` AC-3. |
| AC-4 | ✅ | Up/Down reorder triggers call `PUT /tables/order` with new ID sequence and UI updates immediately. Verified in `TablesAdminScreen.test.tsx` AC-4 and `tables-admin.test.ts`. |
| AC-5 | ✅ | Deactivating seat with live visit returns 409 `SEAT_IN_USE`, keeps switch active, and displays toast "มีแขกอยู่ที่โต๊ะนี้ ปิดโต๊ะก่อน". Verified in `e2e/settings-tables.spec.ts` J3, `TablesAdminScreen.test.tsx` AC-5, and `tables-admin.test.ts`. |
| AC-6 | ✅ | QR modal renders high-contrast SVG sticker with venue title, table label, instructions, print action, and alertdialog confirmation for "สร้าง QR ใหม่". Verified in `e2e/settings-tables.spec.ts` J4, `QrPrintModal.test.tsx` AC-6, and `tables-admin.test.ts`. |

## Gate Evidence (G1)
| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/frontend lint` | 0 | pass (0 warnings, 0 errors) |
| `pnpm --filter @bar/frontend typecheck` | 0 | pass (`next typegen && tsc --noEmit` exit 0) |
| `pnpm --filter @bar/frontend test` | 0 | 72 test files passed · 338 tests passed · 0 failed |
| `pnpm --filter @bar/frontend test:e2e e2e/settings-tables.spec.ts` | 0 | 4 passed (7.7s) |

UI exercised: Live Next.js dev server tested via Playwright e2e runner exercising navigation, seat creation, duplicate validation, live-visit deactivation error handling, and QR print preview modal with QR regeneration alert dialog.

## Sonar (local scan)
- Scanned commit: `6ad751f` · Quality Gate: ERROR (coverage threshold 0.0% vs 80.0% required, pre-existing config limitation)
- Issues by severity: BLOCKER 0 · HIGH 6 · MEDIUM 7 · LOW 5 · INFO 0
- Remaining issues + reason: 18 pre-existing issues across frontend and untouched backend files; 0 issues on files touched by BRIEF-069.
- Who fixed: n/a (all files touched by BRIEF-069 are clean).

## Decisions Raised
- none (all implementations follow BRIEF-069 Rev 1, CD-13 IA, and DR-018 / DR-028 / DR-029).

## Deviations from Brief
- none

## Known Gaps / Follow-ups
- none

## AI Usage
**High** — Antigravity used for tables admin API client implementation, MSW handlers, route permissions and SettingsNav wiring, screen and modal component composition, comprehensive unit tests, and Playwright acceptance verification.
