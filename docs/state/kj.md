# State — Field
**Updated:** 2026-09-23 · **By:** Field via Cowork (planning session)

> INDEX only — briefs and DRs are authoritative. Overwrite each session. ≤ 40 lines.

## Active
- **Phase:** High-level / workflow setup week — no application code this week
- **Work:** Workflow Rev 4 merged (PR #1). Rev 5 (trunk-based branching + tag deploy) + `SH-001` Draft on branch `docs/branching-and-sh001` — uncommitted
- **Checkout:** branch `docs/branching-and-sh001` · base `4775aa6` (PR #1 merge) · uncommitted: `docs/rules/workflow.md`, `docs/briefs/SH-001-ci-gate.md`, `docs/state/kj.md`
- **Next step:** commit + PR #2 → set branch protection → merge PR #2 via admin bypass (first bypass test)

## Awaiting Field
- SH-001: decide Postgres image + pnpm version → set Status: Ready
- GitHub (manual): branch protection on `main` per workflow §7 → record here when verified

## Queue
1. `SH-001` CI gate G2 (Draft written) (unlock: `.github/workflows/ci.yml`) + missing scripts (backend typecheck, frontend all, contracts lint/test)
2. `SH-002` contracts enum reconciliation (stale vs schema)
3. `SH-003` config truth: core.md claims vs actual (TS version, module resolution, contracts build, `dev` script)
4. `BE-000` module scaffold · `FE-000` route scaffold + Vitest · `MB-000` Expo scaffold (unlock: `pnpm-workspace.yaml`, `turbo.json`)
5. `BE-001` review/harden `app/backend/src/common/` partial scaffold
6. Pilot: run ONE small brief end-to-end, then cut workflow steps that produced no useful evidence

## Review Queue (PRs waiting for Field)
- (none)

## Notes for next session
- Decided 2026-09-23: trunk-based (`main` only, no dev / per-app branches) · merge never deploys · deploy on Field's `vX.Y.Z` tag
- Both pptx files were committed in PR #1 — delete the duplicate in a later chore if unwanted
- Confirmed 2026-09-23: executors mark `Implemented` (เสร็จแล้ว), Field sets `Done` · R2-2 admin bypass for Field's PRs, เมธี's PRs blocked until Field approves
- Cursor = primary executor for Field, Claude Code = fallback when Cursor hits limit
- DR backfill from `docs/handoff.md`: only when a brief needs the decision
