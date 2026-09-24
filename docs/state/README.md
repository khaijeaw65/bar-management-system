# Personal State and Multi-developer Coordination

Use `kj/SESSION_STATE.md` and `methee/SESSION_STATE.md`. Each developer (or their current agent) writes only their own state. The initial migration was explicitly authorized by Field; it does not grant ongoing cross-owner edits.

State is tracked on the brief branch. Commit/push it with work or as a scoped state-only commit; do not open a separate state PR or push directly to main. Failed/unrun tests are permitted on Draft WIP when disclosed. Implemented and merge still require gates. KJ reads Methee's branch/Draft PR to see the latest published progress.

Onboard sets the gitignored root `.agent-local.json` to `{"developer":"kj"}` or `{"developer":"methee"}`. This is a checkout preference, not authentication, authorization or progress. Explicit session identity wins; clarify conflicts. Never infer identity from Git author or tool account.

## Planning writer handoff

Cowork updates `docs/state/kj/SESSION_STATE.md` only on the currently open task/docs branch (never `main`), at a coordinated clean point with no executor mid-change or writing that state. With no open branch or no safe handoff point, Cowork reports the proposed state change in chat for the next owning session to record. Cowork never edits `docs/state/methee/`. A clean Git status alone is not proof that another session is idle; coordinate the handoff before writing.

## Resume and publish
1. Read own state, brief/revision, linked DRs and PR; inspect actual branch/worktree and dirty files.
2. Reconcile stale branch snapshots from evidence. Never overwrite uncommitted work to match state.
3. Record Resume, AC progress, Work commit, actual checks, unfinished files and blockers. Work commit refers to tested implementation, not the state commit itself.
4. Inspect staged content for secrets, guest data and unrelated work; commit/push to the task branch. Keep the PR Draft until ready for audit.
5. After merge, PR state establishes Done; update local state and publish it with the next suitable task commit, not a direct-main/status-only PR.

## Parallel work
Separate developers use separate clones/worktrees. Field's existing two-brief exception requires separate worktrees/agents and no shared implementation files except pnpm-lock.yaml. Each worktree holds its own state snapshot. On integration, reconcile KJ's state explicitly, preserve both briefs' blockers/progress and choose the still-active brief as Resume. Never blindly choose ours/theirs. The second PR reconciles the lockfile and reruns affected gates.

## Migration
Old ignored `docs/state/kj.md` / `methee.md` are legacy local files, not current state. Leave local originals intact during transition to avoid losing uncommitted history, but agents must read the tracked folders. This migration records a stale KJ snapshot as historical context; actual Git shows PR #17 merged. Methee's folder is an unverified onboarding placeholder because no local state existed here.

**Expect `main` to be one step behind.** The snapshot on `main` is the last pre-merge state (e.g. "awaiting audit"); closure rides the next task commit. Treat merged PRs as the truth and refresh state as the first commit of the next task branch.

**Legacy cleanup:** delete the local `docs/state/kj.md` / `methee.md` after the tracked state has been used for one full brief (then drop their `.gitignore` lines).

No CLAIMS file, shared root session log or account-based auto-assignment is required. Brief Implementer and Draft PR identify ownership; state holds resume details. Keep state about 40 lines, with an optional planning Queue of at most six items.
