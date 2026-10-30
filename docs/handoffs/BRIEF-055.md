# Handoff — BRIEF-055 Backend: IAM groups & policies API (I3)

| | |
|---|---|
| **Implementer** | kj (Claude Code) |
| **Date** | 2026-10-31 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-055-iam-groups-policies-api` (no PR until audit PASS) |
| **Work SHA** | `d04bf42` |
| **Status** | Implemented — waiting for `audit BRIEF-055` (Cowork) |

## Summary
- **Contracts:** new `schemas/iam-admin.ts` — `PERMISSION_CATALOG` (Thai labels, one place) + `PermissionCatalogSchema`, `StaffGroup`, `Policy` (`usage`), `DeleteImpact`, create / update / set bodies, `PolicyInUseData`. `StaffMember` gains `policyIds`. Error codes `SYSTEM_ROW`, `GROUP_NAME_TAKEN`, `POLICY_NAME_TAKEN`, `POLICY_IN_USE`.
- **API:** the 11 routes of brief §3 + `GET /permissions/catalog`, all `staff:manage`, in `modules/iam` (`IamAdminService`, `IamAdminTypeormRepository`, port in `domain/`), registered in `staff-admin.module.ts`. `PUT /staff/:id/policies` lives in `StaffAdminService` / `StaffAdminTypeormRepository` (it returns `StaffMember`).
- **Lockout, shared:** the BRIEF-054 transaction + advisory lock + `someoneCanManage` moved out of the staff repository into `IamWriteGuard` (`infrastructure/persistence/iam-write-guard.ts`); staff, group and policy writes all call it. A write that answers anything but `ok` now rolls back whole (so a refused create leaves no half-written rows). Lockout check runs on: group policies replace, group delete, policy matrix replace, personal policies replace (and the 054 paths).
- **System rows** by fixed ids (`DEFAULT_GROUP_IDS`, new `DEFAULT_POLICY_IDS`) — no schema change: เจ้าของ never edited / deleted / re-attached; ผู้จัดการ / พนักงาน keep their name (description + attached policies editable) and can't be deleted; ทั้งหมด can't be renamed / re-matrixed / deleted.
- **Delete impact:** pure `deleteImpact()` (`domain/delete-impact.ts`) over one query: codes a member holds through the deleted group vs. from any other live membership / personal policy.
- **ทั้งหมด complete:** `IamAdminService.onApplicationBootstrap` inserts missing `permission` rows and links every catalog code to ทั้งหมด, bumps `iam:version` when it added any; a database without the tables yet only logs a warning.
- **Docs:** `docs/api/README.md` (new "IAM groups & policies" section, staff rows), OpenAPI regenerated (export script lists controllers by hand — added the three new ones + service stub).
- **Test helper:** `clearStaffAndVenue` also removes custom groups / policies and clears `created_by` / `updated_by` on the seeded rows (IAM writes stamp the acting person).

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1, AC-2 | ✅ | `test/iam-admin.e2e-spec.ts` (mark-paid on an unknown id: 403 → 404 = guard passed → 403) |
| AC-3 | ✅ | e2e (9 refused edits, nothing changed; manager description / policies / จัดการร้าน still editable) |
| AC-4 | ✅ | e2e + `delete-impact.spec.ts` (`losing` math) |
| AC-5 | ✅ | e2e (`POLICY_IN_USE` names group + person; after detach → 200, then 404) |
| AC-6 | ✅ | e2e (only manager = custom group: matrix write, detach, group delete → 409 `IAM_LOCKOUT`, state unchanged; with a second holder it passes) |
| AC-7 | ✅ | e2e (catalog = every code once; a link removed from ทั้งหมด is restored by the bootstrap hook + version bump) + `iam-admin.test.ts` in contracts |
| AC-8 | ✅ | e2e (`Bar  Team` vs ` bar team `, Thai names, rename clash; unknown code 400; refused create leaves nothing) |
| AC-9 | ✅ | e2e (13 routes → 403 `missing: ['staff:manage']`) |
| AC-10 | ✅ | gates + run proof below |

## Gate evidence (G1) — work SHA `d04bf42`
| Command | Exit | Result |
|---|---|---|
| contracts build / test | 0 | 116 passed (+5) |
| backend lint / typecheck | 0 | pass |
| backend test | 0 | 47 files · 211 passed |
| backend test:e2e (dev backends stopped) | 0 | 37 files · **264 passed** (one `venue-payment-settings` race spec failed once in an earlier full run with a 404, passed on re-run and in the final run) |
| backend openapi:check | 0 | no diff (committed tree) |
| frontend typecheck | 0 | pass |

**Run proof (dev `bar`, fresh backend on :3021, `d04bf42`, minted tokens — no LINE):** `/api/health` 200 · Demo พนักงาน mark-paid 403 → Job 1 (policy "รับเงิน" + group with `[งานพนักงาน, รับเงิน]`, member added) 404 (guard passed) · `usage {groups 1, users 0, people 1}` · delete-impact `losing: ['payments:mark_paid']` · delete group → 403 again · Job 2 (personal policy) 404 · delete policy while attached → 409 `POLICY_IN_USE` `users: ['Demo พนักงาน']` · detach → 403 · delete policy 200 · delete เจ้าของ → 409 `SYSTEM_ROW` · catalog 8 rows · staff token on `/policies` → 403. Scratch rows removed (dev DB: 3 groups, 3 policies, 0 user policies).

## Sonar (local scan)
- Scanned `d04bf42` · Quality Gate ERROR (known: `new_coverage` 0 %; 22 pre-existing issues; BLOCKER 0 · HIGH 6 · MEDIUM 8 · LOW 8) · **0 issues in files this brief authored** (3 found on the first scan — sort comparator, unused import, `String.raw` — fixed in `d04bf42`). Who fixed: agent (Field's brief).

## Decisions Raised / deviations
1. **`IamWriteGuard` extraction** (refactors BRIEF-054's private helpers into a shared class) — what §6 "shared, never re-implemented" asks; behaviour of 054 writes unchanged except that a refused (non-`ok`) outcome now rolls back, which before wrote nothing anyway.
2. **`people` in `usage`** counts distinct staff with a direct attach or a membership that has not expired (future memberships included); `memberCount` counts membership rows of every state. Not specified in the brief.
3. **Startup completion also inserts missing `permission` rows** (not only the ทั้งหมด links), so a new contracts code works after restart without a hand-written migration; the table stays authoritative for the resolver.
4. Policy `PATCH` description / name on the two non-system seeded policies is allowed (brief only fixes ทั้งหมด).
5. `created_by` / `updated_by` are set explicitly in the raw SQL (as the actor), since these repositories use `query()` like 054's.

## Size
≈ 1.55k net-new app lines incl. ~40 % tests (est. 700–900) — race-heavy auth backend ≈ 1.7× as in earlier sizing notes.

## AI Usage
**High** — Claude Code wrote code and tests (Field's brief, full agent mode).
