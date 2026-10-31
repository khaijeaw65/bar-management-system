# Handoff — BRIEF-057 Settings shell + staff & access requests UI (U1)

| | |
|---|---|
| **Implementer** | kj (Claude Code) |
| **Date** | 2026-10-31 |
| **Brief revision** | 2 |
| **Branch** | `feat/BRIEF-057-staff-access-ui` (PR opens after audit PASS) |
| **Commit** | `f9d6a35` (work SHA S; `33eb048` + Sonar fix) |
| **Status** | Implemented — awaiting audit |

## Summary
`/pos/settings` now has a shell (tabs ≥ md, drawer at 390) with ร้าน · พนักงาน, reading the same route map as the guard (`/pos/settings/staff*` → `staff:manage`, placed before the `venue:update` rule — DR-029). New `/pos/settings/staff` (requests + approve/reject/reopen + staff list + active switch) and `/pos/settings/staff/[staffId]` (rename, memberships as full-set PUT, effective permissions with sources). Request count on the tab + dot on the rail, polled every 60 s and on focus, only for `staff:manage`. No backend, contract or dependency change. MSW staff API with lockout / self-deactivate rules.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `StaffScreen.test.tsx::AC-1 approving ฝน…` · e2e `J1 (1280)` |
| AC-2 | ✅ | `StaffDetailScreen.test.tsx::AC-2…` · e2e `J2 (390)` |
| AC-3 | ✅ | `StaffScreen.test.tsx::AC-3 reject asks first…` |
| AC-4 | ✅ | `StaffScreen.test.tsx::AC-4…` (disabled, past time, server 400 inline) |
| AC-5 | ✅ | `StaffDetailScreen.test.tsx::AC-5…` · `StaffScreen.test.tsx::AC-5…` |
| AC-6 | ✅ | `StaffScreen.test.tsx::AC-6…` + SELF_DEACTIVATE test |
| AC-7 | ✅ | `StaffDetailScreen.test.tsx::AC-7…` + future "เริ่ม …" test |
| AC-8 | ✅ | `SettingsNav.test.tsx::AC-8…` (fake timers, 60 s) |
| AC-9 | ✅ | `SettingsNav.test.tsx::AC-8/9…` · route map test |
| AC-10 | ⚠️ partly | e2e checks the page area (`main`) has no horizontal overflow at 1280/1024/390; the **document** still overflows at 390 because of the existing POS top bar (642 px) — the queued "phone 390 shell". Targets use `min-h-11`. |
| AC-11 | ⚠️ partly | gates ✅; run proof partial (below) |
| AC-12 | ✅ | `SettingsNav.test.tsx::AC-12…` · `RequirePermission.test.tsx::AC-12…` · `pos-routes.test.ts` |

## Gate Evidence (G1)
| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/frontend lint` | 0 | pass |
| `pnpm --filter @bar/frontend typecheck` | 0 | pass |
| `pnpm --filter @bar/frontend test` | 0 | 293 passed · 0 failed · 0 skipped |
| `pnpm --filter @bar/frontend test:e2e` | 0 | 50 passed · 0 failed |
| `pnpm --filter @bar/frontend build` | 0 | pass (`/pos/settings/staff`, `/pos/settings/staff/[staffId]` built) |
| run proof: `migration:run` → `start:dev` → `curl /api/health` | 0 | migrations none pending; health 200 on `33eb048` (code identical for backend) |

UI exercised: headless Playwright against MSW (J1 1280, J2 390), screenshots in `docs/handoffs/assets/BRIEF-057/`.
**Not done — needs Field:** the real-LINE approval run proof (Metee logs in → refused → Field approves at 1280 → ผู้จัดการ until tonight on 390 → deactivate) needs a second LINE account and Field's LINE login; I could not drive it. Lockout alert screenshot also not captured (covered by tests).

## Sonar (local scan)
- Scanned commit: f9d6a35 · Quality Gate: ERROR (`new_coverage` 0 % — known: no coverage report path; `new_violations` 22, all pre-existing files)
- Issues: BLOCKER 0 · HIGH 6 · MEDIUM 8 · LOW 8 · INFO 0
- Remaining issues: none in BRIEF-057 files (7 found on first scan were fixed and rescanned); the rest are the known pre-existing set (setup.ts, backend order/gateway/idempotency)
- Who fixed: agent (Field's own brief)

## Decisions Raised
- none

## Deviations from Brief
- None. Two small choices inside scope: the group picker (add-group modal) is a RadioGroup rather than a Select (testable, same behaviour); "กำหนดเอง" uses HeroUI `Input type="datetime-local"` (R8).

## Known Gaps / Follow-ups
- `PUT /staff/:id/memberships` takes only `until`, so a rebuild keeps live/future rows as `validUntil ?? permanent` and **drops expired rows** (a past time is a 400). Removing one row therefore also clears other expired rows. A future row's start is reset by the server on rewrite — check in audit whether BRIEF-054 preserves `validFrom`.
- Mock `ROLE_CODES` export added to `mocks/permissions.ts` for the effective-permissions mock.
- Env gaps (names only): frontend `NEXT_PUBLIC_API_MOCKING`; backend `EASYSLIP_BASE_URL`.

## AI Usage
**High** — Claude Code wrote the implementation and tests (Field's own brief, full reviewer mode).

## Review Routing
- Assigned auditor: Cowork
- Next command: `audit BRIEF-057`
- Work SHA: f9d6a35 · self-check: brief ↔ BRIEF-054 controller/contracts ↔ UI compared (endpoints, `until` values, error codes)

## Notes for Reviewer
- Start at `pos-routes.ts` (order), `SettingsNav.tsx`, `membership.ts`, `MembershipsPanel.tsx`, `mocks/staff.ts`.
- `main` was merged into the branch at start (seed predated BRIEF-056).
