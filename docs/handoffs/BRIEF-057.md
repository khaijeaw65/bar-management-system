# Handoff — BRIEF-057 Settings shell + staff & access requests UI (U1)

| | |
|---|---|
| **Implementer** | kj (Claude Code) |
| **Date** | 2026-10-31 |
| **Brief revision** | 2 |
| **Branch** | `feat/BRIEF-057-staff-access-ui` (PR opens after audit PASS) |
| **Commit** | `f9d6a35` (work SHA S; `33eb048` + Sonar fix) |
| **Status** | Audit PASS (Cowork, S `f9d6a35`) — merged PR determines Done |

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
| AC-11 | ✅ | gates ✅; real-stack run proof below (Field's own LINE as the new hire) |
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

**Real-stack run proof** (dev DB `bar`, backend 3011 + frontend 3010 on `f9d6a35`; Field's own LINE as the new hire instead of Metee; owner actions as "Field (demo)" with a hand-signed 2 h dev token + Redis session):
1. Field's `staff_user_identity` backed up (scratchpad, not repo); `external_id` suffixed `-parked`.
2. Field's LINE login refused; a pending request exists for his real sub (row dated 23 Oct — the refusal reused the old pending row).
3. Owner at 1280: tab "พนักงาน (1)" on load; approved as พนักงาน · ถาวร → toast, highlighted row (`real-1`, `real-2`). The 60 s poll itself is covered by the unit test, not seen live.
4. Field logged in: live session, effective permissions = the 12-code พนักงาน set (no `payments:mark_paid`) via the owner's `effective-permissions` — `/api/me/permissions` with his own cookie not called; his pane showed rail โต๊ะ/ออเดอร์/เมนู only and "ไม่มีสิทธิ์" on `/pos/settings/staff` (`real-3`). Staff checkout (no manual confirm) not captured live — covered by `e2e/pos-permissions.spec.ts`.
5. Owner at 390 (headless): ผู้จัดการ · ถึงสิ้นกะคืนนี้ → chip "ผู้จัดการ · ถึง 06:00", `valid_until` 23:00 UTC (`real-4`). Field reloaded: rail gained รายงาน + ตั้งค่า (`real-6`), T1 checkout shows "ยืนยันด้วยตนเอง" on PromptPay (`real-5`); cancelled, no payment created.
6. Owner deactivated the new user → his `/api/me/permissions` and `/api/auth/me` both 401.
7. Restore: reactivated, `seed:roster` ("Field → เจ้าของ"), memberships trimmed to เจ้าของ only, old parked user deactivated (not deleted — history FKs), Field logged in once → owner view OK.

Lockout alert not captured on the real stack (covered by tests).

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
- UI nit seen in the real run: in the approve modal the unticked group checkbox box is almost invisible on the dark theme (works; contrast). Not changed.
- Dev DB now has two "Field" staff rows: the active one (his LINE) and the deactivated `-parked` one.
- `PUT /staff/:id/memberships` takes only `until`, so a rebuild keeps live/future rows as `validUntil ?? permanent` and **drops expired rows** (a past time is a 400). Removing one row therefore also clears other expired rows. A future row's start is reset by the server on rewrite — check in audit whether BRIEF-054 preserves `validFrom`.
- Mock `ROLE_CODES` export added to `mocks/permissions.ts` for the effective-permissions mock.
- Env gaps (names only): frontend `NEXT_PUBLIC_API_MOCKING`; backend `EASYSLIP_BASE_URL`.

## AI Usage
**High** — Claude Code wrote the implementation and tests (Field's own brief, full reviewer mode).

## Review Routing
- Assigned auditor: Cowork
- Audit: PASS, zero Must fix (`docs/audits/BRIEF-057.md`) · next: Field merge once `ci` is green on H
- Work SHA: f9d6a35 · self-check: brief ↔ BRIEF-054 controller/contracts ↔ UI compared (endpoints, `until` values, error codes)

## Notes for Reviewer
- Start at `pos-routes.ts` (order), `SettingsNav.tsx`, `membership.ts`, `MembershipsPanel.tsx`, `mocks/staff.ts`.
- `main` was merged into the branch at start (seed predated BRIEF-056).
