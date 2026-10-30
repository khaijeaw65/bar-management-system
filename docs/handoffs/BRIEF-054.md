# Handoff — BRIEF-054 Backend: IAM staff API (I2)

| | |
|---|---|
| **Implementer** | kj (Claude Code) |
| **Date** | 2026-10-31 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-054-iam-staff-api` (no PR until audit PASS) |
| **Work SHA** | `8c0b250` |
| **Status** | Implemented — assigned auditor Cowork: `audit BRIEF-054` |

## Summary
- **Contracts:** `schemas/staff.ts` (AccessRequest, StaffMember, MembershipInput, Approve/Update/Replace bodies, EffectivePermissions, IamLockoutData) + error codes `ACCESS_REQUEST_DECIDED`, `IAM_LOCKOUT`, `SELF_DEACTIVATE`; `ApiErrorData` accepts `{ reason: 'last_manager' }`.
- **API:** the 9 routes in brief §3, all `staff:manage`. `StaffAdminService` (+ `StaffAdminTypeormRepository`, port in `domain/`) in `modules/iam`.
- **Lockout:** every membership replace / deactivation runs in one transaction under `pg_advisory_xact_lock`, applies the write, re-reads the DB (never Redis) for an active staff member holding `staff:manage` through a no-end-date membership or a direct user policy, else rolls back → 409 `IAM_LOCKOUT`.
- **Sessions:** `TokenService.revokeAllForUser` + Redis set `user-families:{userId}` (filled at session create and rotation, Lua). Deactivation revokes every family; refresh and access both fail.
- **end_of_night:** `nextCutoff(now, venue cut-off)`, real wall-clock (audit 053 F4).
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
| backend test:e2e (dev backends stopped) | 0 | 36 files · 251 passed |
| backend openapi:check | 0 | no diff |
| frontend typecheck | 0 | pass |

**Run proof — PARTIAL.** Dev `bar`: `migration:run` (nothing pending — no schema change), fresh `node dist/main.js` on :3021 → `/api/health` 200, `GET /api/staff` unauthenticated 401. **Not done:** the real-LINE sequence (second LINE account refused → approve until `end_of_night` → 403 on mark-paid → deactivate → 401 → self-deactivate 409 → lockout 409). I cannot sign in with a real LINE account; the same flow is covered by e2e with LINE stubbed. Field/Metee to run it with a second account if the auditor requires it.

## Sonar
Not run (agent session ended at the limit). Run `pnpm sonar` before PASS.

## Decisions Raised / deviations
1. **New `iam/staff-admin.module.ts`** (imports IamModule, AuthModule, VenueModule): IamModule can't import them (both import IamModule → ES-module cycle). Keeps auth/venue module files untouched. Auditor to confirm this is acceptable under Field Guard "new module".
2. **Lockout check scope:** only on PUT memberships and `isActive: false`. Approve / reject / reopen / rename / reactivate skip it, so a fresh DB with no owner can't deadlock its first approval. Narrower than the literal "every write".
3. Reject / reopen also bump `iam:version` (AC-9 literal).
4. Sessions created before this change are not in the family index → deactivation cannot end them (dev only).

## Size
≈ 1.4k net-new lines incl. tests (est. 0.9–1.2k).

## AI Usage
**High** — Claude Code wrote code and tests (Field's brief, full agent mode).
