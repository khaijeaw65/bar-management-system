# SH-001 — CI Gate (G2): affected-only checks on every PR

| | |
|---|---|
| **Status** | Draft |
| **Implementer** | Field (Cursor primary) |
| **Revision** | 1 |
| **Depends on** | none |
| **References** | `docs/rules/workflow.md` §6 (gates), §7 (branching) · Codex audit findings #1, R2-5 |
| **Audit depth** | Full — this is the enforcement layer |

---

## 1. Goal
Every PR to `main` runs lint + typecheck + test on **only the packages it affects** (plus their dependents), as one required status check that Field can make mandatory in branch protection.

## 2. Scope
### In
- `.github/workflows/ci.yml` — single workflow `ci`, single job `ci`, trigger `pull_request` → `main`
- Turborepo affected filter: `pnpm turbo run lint typecheck test --filter="...[origin/main]"`
- Add `typecheck` script (`tsc --noEmit`) to `app/backend/package.json` and `app/frontend/package.json` — script only, no new dependency
- Backend e2e in CI (`test:e2e`) with a Postgres service container
- A short note in the PR description listing which packages ran (paste turbo summary)

### Out (do NOT build here)
- Deploy / CD of any kind (separate brief, late November)
- Frontend Vitest setup (`FE-000`) — frontend runs lint + typecheck only for now
- Fixing config drift in `core.md` (`SH-003`)
- Caching tuning, matrix builds, SonarQube

## 3. Contract
- **Check name:** `ci` — must stay stable; it becomes the required status check.
- **Trigger:** `pull_request` with `branches: [main]` (+ `workflow_dispatch` for manual reruns).
- **Contracts changes:** none.

## 4. Acceptance Criteria
- **AC-1** — Given a PR to `main`, when it is opened or updated, then the `ci` check runs and reports pass/fail.
- **AC-2** — Given a PR that changes only `app/backend/**`, then only `@bar/backend` tasks run.
- **AC-3** — Given a PR that changes `app/packages/contracts/**`, then contracts **and** backend **and** frontend tasks run.
- **AC-4** — Given a PR that changes only `docs/**`, then `ci` passes without running package tasks.
- **AC-5** — Given a lint, typecheck, or unit-test failure in an affected package, then `ci` fails.
- **AC-6** — Given a backend change, then `test:e2e` runs against a Postgres service container and passes.
- **AC-7** — `typecheck` exists and passes for backend and frontend.

## 5. Test Gate
Manual evidence is allowed — this brief is CI configuration, not application code.

| AC | Evidence |
|---|---|
| AC-1 | Link to a green `ci` run on this PR |
| AC-2, AC-3, AC-4 | `pnpm turbo run lint typecheck test --filter="...[origin/main]" --dry=json` output for each case (or throwaway PR runs) — list the packages |
| AC-5 | Throwaway commit with a deliberate type error → red run link → revert |
| AC-6 | Green `ci` run log showing `test:e2e` with Postgres |
| AC-7 | Local run output |

Gate commands (all must pass locally before `Implemented`):
```bash
pnpm --filter @bar/backend lint
pnpm --filter @bar/backend typecheck
pnpm --filter @bar/backend test
pnpm --filter @bar/backend test:e2e
pnpm --filter @bar/frontend lint
pnpm --filter @bar/frontend typecheck
pnpm --filter @bar/contracts typecheck
```
Package-specific gates (justified): contracts = typecheck only (enums/types, nothing to unit test). Frontend `test` = **BLOCKED until FE-000** — report it, don't fake it.

## 6. Constraints
- Turbo silently skips a package that has no script for a task — the handoff must list which packages actually ran each task.
- `fetch-depth: 0` on checkout — the affected filter needs `origin/main` history.
- Use `pnpm install --frozen-lockfile` — CI must never modify the lockfile.
- No secrets needed for this brief.

## 7. Decision Points (Field Guard)
- **Pre-decided (exact only):** `actions/checkout@v4` · `pnpm/action-setup@v4` · `actions/setup-node@v4` with `node-version: 22`, `cache: pnpm` · runner `ubuntu-latest`
- **Field to decide before Ready:**
  - Postgres image for the e2e service container (proposal: `postgres:16-alpine` — confirm it matches the planned RDS version)
  - pnpm version: root `packageManager` is `pnpm@10.0.0` but `app/frontend` declares `pnpm@11.21.0` — pick one (likely DR, overlaps `SH-003`)
- **Likely DRs:** any new devDependency; any change to `turbo.json` task definitions

## 8. Unlocked Protected Files
- `.github/workflows/ci.yml`

## After merge — Field manual steps (not agent tasks)
1. Settings → Branches → `main` rule → ☑ Require status checks → add `ci`.
2. Record in `docs/state/kj.md`.

---

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-09-23 | Initial draft (Cowork) |
