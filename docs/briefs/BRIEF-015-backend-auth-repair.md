# BRIEF-015 — Backend auth repair: revocation-safe refresh rotation + Clean Code lint

| | |
|---|---|
| **Status** | Ready — Rev 1 approved by Field 2026-10-17 |
| **Implementer** | kj (executor: Cursor; Git via the git hand per workflow §4 until Cursor's `gh` is verified) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | Field, 2026-10-17 — default, no fallback |
| **PR** | <executor fills> |
| **Affected apps** | backend |
| **Revision** | 1 |
| **Depends on** | BRIEF-007 merged (PR #35, `7436119`) · `backend.md` Clean Code section merged (Field-approved 2026-10-17) |
| **References** | `docs/audits/BRIEF-007.md` — Finding 1, Re-audit C1–C5, Post-merge C6 · BRIEF-007 AC-6 / AC-7 · `docs/rules/backend.md` → Clean Code · `docs/rules/ponytail.md` |
| **Audit depth** | Full — auth |

---

## 1. Goal
Close the open BRIEF-007 audit findings before BRIEF-009-dependent work builds on auth: a logout can never be undone by a refresh that is in flight, and the auth code (plus the rest of the backend) meets the new Clean Code rule, with the measurable parts enforced by oxlint in CI.

## 2. Scope
### In
- **C1 + C5 — refresh rotation and revocation (`token.service.ts`):**
  - Rotation runs as **one Redis Lua script** (`EVAL`): read the record → reject if used/missing → check the family is still live → write the used marker (still pointing to the family) → write the new token, family pointer and extended session. There is no step between consuming the old token and publishing the new one.
  - Revocation (logout and reuse detection) runs as **one Lua script**: resolves the family from either a live record or a used marker, deletes every token of the family + family pointer + `session:<sid>`, and leaves the family marked revoked so a rotation can never publish into it.
  - Remove the `if (redis.client.eval)` branch and the weaker multi-command path. Production has one implementation.
- **C2, C3, C4, C6, C7 — auth module readability** (`auth.service.ts`, `token.service.ts`, `auth.controller.ts`, `auth-cookies.ts`, `jwt.strategy.ts`, `line-client.http.ts`, and the IAM services/repositories the audit lists):
  - `handleLineCallback` becomes a short sequence of steps; details move to private helpers, e.g. `verifyLineProfile`, `createStaffLoginSession`, `rejectInactiveStaff`, `handleUnregisteredIdentity`, `createNotRegisteredRedirect`, `createLoginFailedRedirect` (C2).
  - Callback guard (C7): consume the OAuth state once at the top, with a WHY comment (single use, even on failure), then one combined failure check — no nested `if (input.state)`, no second `consumeNonce` call.
  - Inactive vs unknown staff use guard clauses (`if (!user)`, `if (!user.isActive)`); the duplicated `not_registered` redirect becomes one helper.
  - Rename per C3 (`refreshTtlSeconds`, `getCurrentStaffUser`, `lineClient`, `tokenService`, `staffUserService`, `frontendBaseUrl`, `createLoginFailedRedirect`, `BASE_COOKIE_OPTIONS`). HTTP route `/auth/me` unchanged.
  - Explicit `public` / `private` on every class member; `Promise<AuthMe>` on `AuthController.me` (C4).
  - Named `LineLoginCallbackInput` (module-local); reuse `LineProfile` from `domain/line-client.ts` instead of the inline profile shape (C6).
- **Lint enforcement — `app/backend/oxlint.json`:** add the Clean Code rules as `error` for `src/**`:
  - `max-lines-per-function` (max 20, skip blank lines and comments)
  - `max-depth` (max 2)
  - `typescript/explicit-member-accessibility`
  - a return-type rule for public methods (`typescript/explicit-function-return-type` or `typescript/explicit-module-boundary-types` — whichever matches "public methods declare their return type" with less noise; state the choice in the handoff)
  - `max-params` stays off — the ≤ 3 limit is a review rule and constructor injection is exempt (Field, 2026-10-17, option A).
  - Overrides: size rules (`max-lines-per-function`, `max-depth`) off for `test/**`, `**/*.spec.ts` and `src/providers/database/migrations/**`.
  - Verify every rule name exists in the installed oxlint (`oxlint --rules`). Missing rule → report in the handoff; do not substitute a different tool.
- **Fix every lint violation across `app/backend`** that the new rules raise — same rule, same pass. No `oxlint-disable` comments.

### Out (do NOT build here)
- Any change to HTTP paths, status codes, response/redirect shapes, cookies, env vars, Redis key names visible to other modules, or `@bar/contracts`.
- New features (mobile auth, IAM groups/policies, rate limiting, PIN).
- Frontend / mobile linters.
- New dependencies, pre-commit hooks, editor config.

## 3. Contract
- **Endpoints:** unchanged from BRIEF-007. `docs/api/openapi.json` must not change; if `openapi:export` produces a diff, stop and report.
- **Contracts changes:** none.
- **Permissions:** none.

## 4. Acceptance Criteria
- **AC-1 (C1)** — Given a live refresh token, when `rotate(t)` and `logout(t)` run concurrently (`Promise.all`, ≥ 50 iterations against real Redis), then after both settle: `session:<sid>` does not exist and no token of that family can rotate.
- **AC-2 (C1)** — Given a revoked family, when a rotation for that family completes later, then it publishes nothing (no new token, no family pointer, no session).
- **AC-3 (Finding 1 regression)** — `Promise.all([rotate(t), rotate(t)])` → exactly one `ok`; the loser gets the reuse/invalid result; after logout no token of the family rotates.
- **AC-4 (C5)** — `token.service.ts` has no runtime branch on Redis client capabilities; rotation and revocation each call one `EVAL` script. Atomicity tests (AC-1 to AC-3) run against real Redis (e2e, CI Redis service), not a fake.
- **AC-5 (behaviour preserved)** — All BRIEF-007 e2e tests pass unchanged, including AC-4, AC-5, AC-5b (inactive = no access request; unknown = one request row), AC-6, AC-7. Existing assertions are not weakened or deleted.
- **AC-6 (C2/C7)** — `handleLineCallback` reads as a sequence of named steps, uses guard clauses, and calls `consumeNonce` once.
- **AC-7 (C3/C4/C6)** — Names, access modifiers, return types and types as listed in §2.
- **AC-8 (lint)** — `oxlint.json` contains the rules in §2; `pnpm --filter @bar/backend lint` exits 0 with zero warnings and zero `oxlint-disable` comments in `app/backend`.
- **AC-9** — `openapi:export` produces no diff; lint / typecheck / test / test:e2e / build exit 0; `ci` green on the PR head.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1, AC-2, AC-3 | e2e (real Redis) | `app/backend/test/auth-token-concurrency.e2e-spec.ts` |
| AC-4 | review + grep | `token.service.ts` |
| AC-5 | e2e (existing) | `app/backend/test/auth.e2e-spec.ts` |
| AC-6, AC-7 | review (Clean Code checklist) | auth module |
| AC-8 | lint | `app/backend/oxlint.json` |

Gate commands (all must pass):
```bash
pnpm --filter @bar/backend lint
pnpm --filter @bar/backend typecheck
pnpm --filter @bar/backend test
pnpm --filter @bar/backend test:e2e
pnpm --filter @bar/backend build
pnpm --filter @bar/backend openapi:export && git diff --exit-code docs/api/openapi.json
```
A required script that doesn't exist yet = **BLOCKED** — report it, never skip silently.

### Local Sonar scan
- Optional (Field brief). If run, paste `pnpm sonar:report` in the handoff.

## 6. Constraints
- Refactor = same behaviour. If a readability change would alter behaviour, stop and raise it in the handoff.
- Follow `backend.md` → Clean Code. Extract private helpers inside the same class; no new classes, files or interfaces just to meet size limits (ponytail).
- Never log tokens, codes, secrets or ID tokens (BRIEF-007 AC-9 still applies).
- OAuth state stays single use. Do not broaden exception handling while extracting helpers.
- Start from current `main` in a worktree (`git worktree add ../bar-BRIEF-015`); the primary checkout holds stale auth stubs (audit post-merge note 2).

## 7. Decision Points (Field Guard)
- **Pre-decided (exact):**
  - Rotation and revocation each as one Redis Lua script via `EVAL` on the existing `ioredis` client.
  - Atomicity tests on real Redis in e2e.
  - oxlint rules and overrides exactly as §2.
- **Likely DRs:** an oxlint rule from §2 doesn't exist in the installed version · fixing a lint violation outside `modules/auth` would change behaviour · Redis key layout must change in a way other modules can see.

## 8. Unlocked Protected Files
- `none` (`app/backend/oxlint.json` is not protected)

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates and evidence; dependencies have completion conditions
- [x] No unresolved decision blocking the main outcome
- [x] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-17 | Initial draft (Cowork) — carries BRIEF-007 audit C1–C6 + C7 (Field review of the callback guard) + Clean Code lint |
| 1 | 2026-10-17 | Ready — approved by Field ("approve ready"); auditor Cowork, executor Cursor. Recorded by Cowork on Field's explicit instruction. No content change. |
