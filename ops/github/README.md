# GitHub rulesets for `main` (Field, 2026-10-17)

Two rulesets instead of classic branch protection, so admin bypass skips **only** the review, never CI.

| Ruleset | Rules | Bypass |
|---|---|---|
| `main-review` | PR required (1 approval, CODEOWNERS), no direct push, no force-push, no delete | Repository admin (Field) — **pull requests only** |
| `main-ci` | required status check `ci` | **nobody** |

- Field's own / agent-opened PRs (authored as Field — GitHub forbids self-approval): `gh pr merge <n> --merge --admin` → bypasses review only; GitHub still blocks until `ci` is green.
- Metee's PRs: need Field's approval; Metee cannot bypass.
- Nobody pushes directly to `main`.

Apply (git hand, after Field's OK): create both rulesets, verify, then delete classic protection:

```bash
R=khaijeaw65/bar-management-system
gh api -X POST repos/$R/rulesets --input ops/github/ruleset-main-review.json
gh api -X POST repos/$R/rulesets --input ops/github/ruleset-main-ci.json
gh api repos/$R/rulesets --jq '.[] | {id,name,enforcement}'
gh api -X DELETE repos/$R/branches/main/protection
```

Rollback: `gh api -X DELETE repos/$R/rulesets/<id>` for each; classic protection can be re-added in Settings → Branches.
