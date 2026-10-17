# GitHub rulesets for `main` (Field, 2026-10-17)

Two rulesets instead of classic branch protection, so admin bypass skips **only** the review, never CI.

| Ruleset | Rules | Bypass |
|---|---|---|
| `main-review` | PR required (1 approval, CODEOWNERS), no direct push, no force-push, no delete | Repository admin (Field) — **pull requests only** |
| `main-ci` | required status check `ci` | **nobody** |

- Field's own / agent-opened PRs (authored as Field — GitHub forbids self-approval): `gh pr merge <n> --merge --admin` → bypasses review only; GitHub still blocks until `ci` is green.
- Metee's PRs: need Field's approval; Metee cannot bypass.
- Nobody pushes directly to `main`.
- An approval covers the exact head: a new push dismisses it (stale-review dismissal + last-push approval, as the old classic rule had).
- Branches need not be up to date before merge (`strict: false`) — fewer forced rebases for a 2-person team; accepted risk: two green PRs that conflict logically.
- Why: the old classic protection had an **empty required-checks list** and `enforce_admins: false`, so `ci` was never actually enforced. The check name `ci` = job `name: ci` in `.github/workflows/ci.yml`, which runs on every PR to `main` (no path filters), so docs PRs get it too.

Apply (git hand, after Field's OK): create both rulesets, verify, then delete classic protection:

```bash
R=khaijeaw65/bar-management-system
gh api -X POST repos/$R/rulesets --input ops/github/ruleset-main-review.json
gh api -X POST repos/$R/rulesets --input ops/github/ruleset-main-ci.json
gh api repos/$R/rulesets --jq '.[] | {id,name,enforcement}'
gh api -X DELETE repos/$R/branches/main/protection
```

Rollback: `gh api -X DELETE repos/$R/rulesets/<id>` for each; classic protection can be re-added in Settings → Branches.
