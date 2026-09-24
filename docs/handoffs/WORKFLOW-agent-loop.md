# Handoff — Workflow Agent Loop (Field-authorized maintenance)

- Author: Codex · 2026-09-24
- Branch: `docs/workflow-agent-loop`
- Base: `c8e36bc` (merged PR #17); changes are uncommitted for Cowork review.
- Authorization: Field confirmed the complete conversational draft and requested this docs branch and English file content.
- Status: Prepared for Cowork recheck; not independently audited, not approved for merge.

## Changes
- Workflow Rev 14: execute includes resume, explicit checkout identity, assigned auditor/fallback, source-grounding checks and bounded feedback loop.
- Cowork default; Codex fallback only on Field's explicit assignment when Cowork usage is exhausted. Actual reviewer and reviewed commit are recorded.
- PR merged is the authoritative Done signal. Field approves a concrete PR/head; agent may complete that authorized merge without additional routine questions.
- Defined audited implementation S vs evidence-only head H to avoid an audit referring to its own commit. All post-approval head changes need renewed approval.
- Tracked per-person state folders, onboarding identity (gitignored), Draft PR visibility, honest WIP pushes, and a PR-link-only bookkeeping exception for executors.
- Updated root instructions, boundaries, templates, PR checklist and ignore rules. Historical briefs/audits/DRs and app code are untouched.

## Migration and current facts
- Original ignored `docs/state/kj.md` remains locally preserved but is no longer authoritative. It referred to PR #17 as unmerged; actual base contains its merge. New state distinguishes historical test claims from observed Git facts.
- No Methee state existed in this checkout: initialized an explicit unverified onboarding placeholder, not invented progress.
- `.agent-local.json` contains only developer `kj`; it is ignored and must not be committed.
- Preserved Rev 13's Field-only two-worktree exception, with explicit reconciliation of the now-tracked shared KJ state.

## Verification
- `git diff --check`: passed.
- Checked tracked state paths are not ignored and local identity is ignored.
- Checked state files are within 40 lines; scanned active rules/root references for obsolete state paths and mandatory Cowork-only wording.
- No application tests run: documentation-only update. No runtime cross-tool automation, remote protection verification, push, PR creation, merge or deploy performed.

## Cowork recheck request
Review the working diff against the confirmed draft and current rules. Use actual files, not only this summary. Report Must fix vs Suggestion and PASS / CHANGES REQUIRED / BLOCKED. Do not self-approve or change historical audit records.

Focus on:
1. Roles/write permissions: onboarding identity, PR-link-only executor exception, assigned Codex fallback and independent review.
2. State migration/visibility, stale snapshots, parallel worktree reconciliation and preservation of historical data.
3. Execute idempotency, Ready checklist, Learning Mode and realistic cross-tool dispatch limits.
4. Audit S vs PR head H coverage; exact-head approval, re-approval after any head change, safe merge cleanup, no release implied.
5. PR merged = Done without a status-only PR; local closure state rides the next suitable commit.
6. Consistency across workflow, AGENTS/CLAUDE, boundaries and all templates.

Write the independent report to `docs/audits/WORKFLOW-agent-loop.md`. Until changes are committed, identify them as a working-tree review with base SHA; do not claim the base contains this diff. After commit, bind final review/approval to the actual commit. Field decides the merge.

## Follow-up — Cowork M1

Implemented M1 on Field's forwarded review: Planning permissions now reference the explicit KJ-state writer rule. Cowork writes only on the open task/docs branch, never main, at a coordinated clean point with no executor mid-change. Otherwise it reports the proposed update in chat. Methee state remains off-limits. README clarifies that clean Git status alone does not prove an idle executor. `git diff --check` passed. Cowork's report remains unchanged; this is a fix awaiting independent recheck, not an audit PASS. Suggestions S1–S6 were not applied in this M1-only follow-up.
