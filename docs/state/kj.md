# State — Field
**Updated:** 2026-09-23 · **By:** Field via Cowork (planning session)

> INDEX only — briefs and DRs are authoritative. Overwrite each session. ≤ 40 lines.

## Active
- **Phase:** High-level / workflow setup week — no application code this week
- **Work:** Agent workflow system Rev 4 (Codex audit + re-audit applied) — uncommitted, pending Field review
- **Checkout:** branch `main` · last commit `9a869b7` (2026-09-19) · uncommitted: large — prior setup work (rules, .cursor/.agents, app/packages move, backend common/) + workflow system
- **Next step:** Field reviews `docs/rules/workflow.md` Rev 4 + both Disposition sections in `docs/audits/WORKFLOW-codex.md` → commit

## Awaiting Field
- Commit plan: (1) prior setup work, (2) workflow system — separate commits
- GitHub (manual): branch protection on `main` per workflow §7 → record here when verified

## Queue
1. `SH-001` CI gate G2 (unlock: `.github/workflows/ci.yml`) + missing scripts (backend typecheck, frontend all, contracts lint/test)
2. `SH-002` contracts enum reconciliation (stale vs schema)
3. `SH-003` config truth: core.md claims vs actual (TS version, module resolution, contracts build, `dev` script)
4. `BE-000` module scaffold · `FE-000` route scaffold + Vitest · `MB-000` Expo scaffold (unlock: `pnpm-workspace.yaml`, `turbo.json`)
5. `BE-001` review/harden `app/backend/src/common/` partial scaffold
6. Pilot: run ONE small brief end-to-end, then cut workflow steps that produced no useful evidence

## Review Queue (PRs waiting for Field)
- (none)

## Notes for next session
- Confirmed 2026-09-23: executors mark `Implemented` (เสร็จแล้ว), Field sets `Done` · R2-2 admin bypass for Field's PRs, เมธี's PRs blocked until Field approves
- Cursor = primary executor for Field, Claude Code = fallback when Cursor hits limit
- DR backfill from `docs/handoff.md`: only when a brief needs the decision
