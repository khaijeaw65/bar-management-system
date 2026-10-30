# Handoff — BRIEF-054 Backend: IAM staff API (I2)

| | |
|---|---|
| **Implementer** | kj (Claude Code) |
| **Date** | 2026-10-31 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-054-iam-staff-api` (PR opened at PASS) |
| **Work SHA** | `1ae5fd2` (audited S) |
| **Status** | Audit PASS (Cowork, re-audit 1, S = `1ae5fd2`) — PR open |

## Summary
- **Contracts:** `schemas/staff.ts` (AccessRequest, StaffMember, MembershipInput, Approve/Update/Replace bodies, EffectivePermissions, IamLockoutData) + error codes `ACCESS_REQUEST_DECIDED`, `IAM_LOCKOUT`, `SELF_DEACTIVATE`; `ApiErrorData` accepts `{ reason: 'last_manager' }`.
- **API:** the 9 routes in brief §3, all `staff:manage`. `StaffAdminService` (+ `StaffAdminTypeormRepository`, port in `domain/`) in `modules/iam`.
- **Lockout:** every membership replace / deactivation runs in one transaction under `pg_advisory_xact_lock`, applies the write, re-reads the DB (never Redis) for an active staff member holding `staff:manage` through a no-end-date membership or a direct user policy, else rolls back → 409 `IAM_LOCKOUT`.
- **Sessions:** `TokenService.revokeAllForUser` + Redis set `user-families:{userId}` (filled at session create and rotation, Lua). Deactivation revokes every family; refresh and access both fail.
- **end_of_night:** `nextCutoff(now, venue cut-off)`, real wall-clock (audit 053 F4).
- **Inactive = logged out (audit Must fix 1, `1ae5fd2`):** `StaffActivity.isActive` (cache `staff-active:{id}:v{iamVersion}`, 300 s, DB fallback); `TokenService.authenticateClaims` returns null for inactive staff (web, mobile, `/staff` WS), `rotate` refuses them and revokes the family. Works for sessions issued before the index. `iam-guard` AC-7 now expects 401.
- **Docs:** `docs/api/README.md` Staff section; OpenAPI regenerated (the export script lists controllers by hand — added the two staff controllers + service stub).

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1, AC-2 | ✅ | `test/iam-staff.e2e-spec.ts` (LINE stubbed) |
| AC-3 | ✅ | `membership-until.spec.ts` + e2e (cut-off 06:00 → 05:00, past ISO 400) |
| AC-4 | ✅ | e2e (membership ends in 1.5 s → permissions `[]`, state `expired`, PUT removes) |
| AC-5 | ✅ | e2e (4 refused paths; second owner / user policy lets each pass) |
| AC-6 | ✅ | e2e (self 409; web + mobile 401, refresh invalid, LINE refused; reactivate; rotated family) |
| AC-7, AC-8, AC-9 | ✅ | e2e |
| AC-10 | ⚠️ | gates below; run proof partial |

## Gate evidence (G1) — on work SHA `8c0b250`
| Command | Exit | Result |
|---|---|---|
| contracts build / test | 0 | 111 passed (+13) |
| backend lint / typecheck | 0 | pass |
| backend test | 0 | 46 files · 208 passed |
| backend test:e2e (dev backends stopped) | 0 | 36 files · **252 passed** (on `1ae5fd2`) |
| backend openapi:check | 0 | no diff |
| frontend typecheck | 0 | pass |

**Run proof (dev `bar`, fresh backend on :3021, `1ae5fd2`, minted tokens — no LINE):** `/api/health` 200 · inserted pending request listed · approved as พนักงาน `end_of_night` at ~00:55 +07 → `valid_until` 2026-10-30T23:00Z = 06:00 Bangkok · new staff token: mark-paid 403 `payments:mark_paid` → after deactivation 401 · Field's token self-deactivate 409 `SELF_DEACTIVATE` · scratch rows removed. `IAM_LOCKOUT` not run on dev (two owners) — e2e AC-5. Real LINE login of an approved account → IAM UI brief's run proof (audit-accepted).

## Sonar (local scan)
- Scanned `1ae5fd2` · Quality Gate ERROR (known: `new_coverage` 0 %, 22 pre-existing issues; BLOCKER 0 · HIGH 6 · MEDIUM 8 · LOW 8) · **0 issues in files this brief authored.** Who fixed: n/a.

## Decisions Raised / deviations (1–2 accepted by Field 2026-10-31)
1. **New `iam/staff-admin.module.ts`** (imports IamModule, AuthModule, VenueModule): IamModule can't import them (both import IamModule → ES-module cycle). Keeps auth/venue module files untouched. Auditor to confirm this is acceptable under Field Guard "new module".
2. **Lockout check scope:** only on PUT memberships and `isActive: false`. Approve / reject / reopen / rename / reactivate skip it, so a fresh DB with no owner can't deadlock its first approval. Narrower than the literal "every write".
3. Reject / reopen also bump `iam:version` (AC-9 literal).
4. Sessions older than the family index are ended by the active check instead; a reactivated person's pre-change session works again (audit: acceptable).

## Size
≈ 1.4k net-new lines incl. tests (est. 0.9–1.2k).

## AI Usage
**High** — Claude Code wrote code and tests (Field's brief, full agent mode).
