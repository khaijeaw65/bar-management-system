# Protecting `main` — AI-Powered Bar Management System

Goal: nothing reaches `main` without a green `ci` check, and no agent can skip it.
`ci` = the aggregate job named `ci` in `.github/workflows/ci.yml` (it `needs:` every other job), run on every push to `feat/**`/`fix/**` and every PR to `main`.

## Layer 1 — process guard (always, free)

- Agents merge only via `pr-review` (`approve merge BRIEF-###`): it checks the gates on the exact head first.
- **Merge commits only** — never squash or rebase (the audit's `S..H` check needs the commits).
- Nobody pushes to `main`. Local safety net: `.githooks/pre-push` refuses any push to `refs/heads/main` (except creating `main` on a new, empty remote).

A hook can be skipped (`--no-verify`), so Layer 1 stops accidents, not a determined agent.

## This repo: Team profile (Field, 2026-10-17)

`main-review` + `main-ci` are applied; classic branch protection was deleted after the rulesets were verified.
- Metee's PRs need Field's approval (`อนุมัติ merge BRIEF-###`); Metee cannot bypass.
- An approval covers the exact head: a new push dismisses it (stale-review dismissal + last-push approval).
- Branches need not be up to date before merge (`strict: false`) — fewer forced rebases for a 2-person team; accepted risk: two green PRs that conflict logically.
- Why rulesets: the old classic protection had an empty required-checks list and `enforce_admins: false`, so `ci` was never enforced.

## Layer 2 — GitHub enforces it (pick one profile)

**Plan limit:** public repos — any plan. **Private repos need GitHub Pro, Team or Enterprise**; on GitHub Free a private repo has no branch protection at all → Layer 1 only. On Pro with a *personal* repo, test once that the ruleset is enforced (some users report a "requires a Team organization" warning).

| Profile | When | Files | Admin bypass |
|---|---|---|---|
| **Solo** | only Field + agents write code | `ruleset-main-solo.json` | none — 0 approvals needed, so nobody has to bypass |
| **Team** | another developer writes code | `ruleset-main-review.json` + `ruleset-main-ci.json` | Field bypasses the **review only** (can't self-approve); CI has no bypass |

Team profile merge for Field's own / agent-opened PRs: `gh pr merge <n> --merge --admin` → skips the review rule only; GitHub still blocks until `ci` is green. That is the only allowed `--admin`.

## Apply (git hand, only after Field's explicit OK)

```bash
R=khaijeaw65/bar-management-system
# solo
gh api -X POST repos/$R/rulesets --input ops/github/ruleset-main-solo.json
# team
gh api -X POST repos/$R/rulesets --input ops/github/ruleset-main-review.json
gh api -X POST repos/$R/rulesets --input ops/github/ruleset-main-ci.json
# verify
gh api repos/$R/rulesets --jq '.[] | {id,name,enforcement}'
```

Rollback: `gh api -X DELETE repos/$R/rulesets/<id>`.
