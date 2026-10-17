# Personal State and Multi-developer Coordination

Use `kj/SESSION_STATE.md` and `methee/SESSION_STATE.md` — **the only planning/progress files** (workflow §2; `kj/PLANNING.md` removed in Rev 19). Each developer (or their current agent) writes only their own state; Cowork writes KJ's under the rule below. The initial migration was explicitly authorized by Field; it does not grant ongoing cross-owner edits.

State = where work stands, ≤ 40 lines. The *Carry over* section (milestones, parked decisions, Field to-do, follow-up pointers) is copied unchanged by executors; only Cowork/Field edit it. Anything that doesn't fit is not state: a brief input goes in the brief, a decision in a DR, an audit follow-up stays in the audit (state keeps a one-line pointer), design reference in `docs/design/`.

State is tracked on the brief branch and committed only inside commits that already happen (workflow §3): the seed commit, the Implemented handoff commit, the PASS commit, or a `handoff` WIP commit when a session ends mid-brief. Never a state-only PR or a push to main. Failed/unrun tests are permitted on WIP pushes when disclosed. Implemented and merge still require gates. KJ reads Metee's pushed task branch to see his latest published progress.

Onboard sets the gitignored root `.agent-local.json` to `{"developer":"kj"}` or `{"developer":"methee"}`. This is a checkout preference, not authentication, authorization or progress. Explicit session identity wins; clarify conflicts. Never infer identity from Git author or tool account.

## KJ state writer (Cowork)

Cowork updates `docs/state/kj/SESSION_STATE.md` only in a brief's seed commit or on a docs branch — never on a task branch after the executor's first commit, never on `main`. Otherwise it reports the proposed change in chat for the next seed commit. Cowork never edits `docs/state/methee/`.

## Resume and publish
1. Read own state, brief/revision, linked DRs and PR; inspect actual branch/worktree and dirty files.
2. Reconcile stale branch snapshots from evidence. Never overwrite uncommitted work to match state.
3. Record Resume, AC progress, Work commit, actual checks, unfinished files and blockers. Work commit refers to tested implementation, not the state commit itself. Keep *Carry over* unchanged.
4. Inspect staged content for secrets, guest data and unrelated work; stage explicit paths (never `git add -A`); commit/push to the task branch. No PR before audit PASS.
5. After merge, the PR establishes Done. Closure reaches state in the next seed commit (KJ) or the first commit of the next task branch (Metee) — never a direct-main or status-only PR.

## Parallel work
Separate developers use separate clones. Field's two-brief exception puts the second brief in a worktree under `.worktrees/BRIEF-###` (excluded via `.git/info/exclude`) with its own agent and no shared implementation files except pnpm-lock.yaml. Each worktree holds its own state snapshot. On integration, reconcile KJ's state explicitly, preserve both briefs' blockers/progress and choose the still-active brief as Resume. Never blindly choose ours/theirs. The second PR reconciles the lockfile and reruns affected gates.

## Migration
Old ignored `docs/state/kj.md` / `methee.md` are legacy local files, not current state. Leave local originals intact during transition to avoid losing uncommitted history, but agents must read the tracked folders. This migration records a stale KJ snapshot as historical context; actual Git shows PR #17 merged. Metee's folder is an unverified onboarding placeholder because no local state existed here.

**Expect `main` to be one step behind.** The snapshot on `main` is the last pre-merge state (e.g. "awaiting audit"); closure rides the next seed commit. Treat merged PRs as the truth.

**Legacy cleanup:** delete the local `docs/state/kj.md` / `methee.md` after the tracked state has been used for one full brief (then drop their `.gitignore` lines).

No CLAIMS file, shared root session log or account-based auto-assignment is required. Brief Implementer and the task branch identify ownership; state holds resume details.
