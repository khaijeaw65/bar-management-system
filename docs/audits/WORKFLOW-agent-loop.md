# Audit — Workflow Rev 14 (agent loop)

| | |
|---|---|
| **Auditor** | Cowork (planning session, 2026-09-24) |
| **Assignment** | Field asked Cowork to recheck Codex's workflow maintenance (default auditor) |
| **Date** | 2026-09-24 |
| **PR / commit** | **Working-tree review** on `docs/workflow-agent-loop`, base `c8e36bc` — changes uncommitted; the base does not contain this diff. Re-bind to the commit before approval (Rev 14 §7 S..H rule). |
| **Depth** | Full (rules + all templates + root instructions + state migration) |
| **Brief revision** | n/a — Field-authorized workflow maintenance |
| **Recommendation** | **CHANGES REQUIRED** (1 Must fix) ← Field makes the final call |

## Scope reviewed
`docs/rules/workflow.md` (full), `agent-boundaries.md`, `core.md`, `AGENTS.md`, `CLAUDE.md`, `.gitignore`, `.github/pull_request_template.md`, all `_TEMPLATE.md`, `docs/state/README.md`, `docs/state/{kj,methee}/SESSION_STATE.md`, `.agent-local.json`, Codex handoff. Compared against Rev 7–13 decisions recorded earlier today.

## Rev 7–13 carry-over check
| Earlier Field decision | Kept? | Where |
|---|---|---|
| Rev 7 Cowork records explicit DR decisions | ✅ | §5 Recording rule |
| Rev 9 BRIEF-### IDs, cross-app = one owner, rename map | ✅ | §2, §10 |
| Rev 10 Cowork sets Ready after explicit approval | ✅ | §1, §3 |
| Rev 11 routine Git pre-authorized, critical gated | ✅ | §4 Approval policy |
| Rev 12 bookkeeping rides along | ✅ (reworded) | §3 |
| Rev 13 Field 2-brief worktree exception | ✅ | §4 Concurrent work |
| Learning mode / เมธี walkthrough | ✅ | §6 G3, §8 |
| Branch protection settings (1 approval, CODEOWNERS = Field, admin bypass; `ci` required) | ⚠️ dropped | see S1 |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| M1 | **Must fix** | Med | **Current:** §1 Planning lets Cowork write "KJ state", §2 says state is tracked "one writer per developer" on the task branch, and the executor (Cursor) also writes `docs/state/kj/SESSION_STATE.md` on that same branch. Nothing says **which branch** Cowork writes KJ state on when no task branch is open, or how Cowork avoids writing it while an executor is mid-change → two writers on one file, or a direct write to `main`. → **Updated:** add to §2/§4: *"Cowork updates KJ state only on the currently open task/docs branch, at a clean point (same rule as bookkeeping, §3). With no open branch, Cowork reports the state change in chat and the next session records it. Cowork never edits `methee/`."* |
| S1 | Suggestion | Med | **Current:** the old §7 recorded Field's confirmed branch-protection settings (1 approval, CODEOWNERS = Field, admin bypass for Field; `ci` required since BRIEF-001). Rev 14 only says "verify actual remote protection". → **Updated:** keep one line listing the confirmed settings, so "verify" has something to verify against. |
| S2 | Suggestion | Low | **Current:** tracked state means `main` always ends with the last pre-merge snapshot (e.g. "awaiting audit"), because post-merge closure rides the *next* task commit. Every new branch starts from a stale snapshot. The reconcile-from-Git rule handles it, but agents will hit it every time. → **Updated:** state README: *"A snapshot on `main` is expected to be one step behind; treat merged PRs as the truth and refresh state as the first commit of the next task branch."* |
| S3 | Suggestion | Low | **Current:** §3 "Open a Draft PR after the first suitable commit" / §4 `handoff` "push … prepare review". Cursor's sandbox cannot reach `api.github.com` (seen on BRIEF-003/004), so PR creation often falls to Field. → **Updated:** "…or give Field the compare link when the tool cannot create PRs." |
| S4 | Suggestion | Low | **Current:** `agent-boundaries.md` header mentions the executor PR-link exception, but the ownership list line for `docs/briefs/**` still says "Field only. Cowork may…" → **Updated:** append "· executor may fill the PR field only" to that line so the list is self-contained. |
| S5 | Suggestion | Low | **Current:** §3 requires existing active briefs to get *Assigned auditor* metadata before audit. BRIEF-002 (Draft) has none. → **Updated:** Cowork adds `Assigned auditor: Cowork` when BRIEF-002 is next revised — no action now. |
| S6 | Suggestion | Low | **Current:** legacy local `docs/state/kj.md` is kept (ignored) "during transition" with no end. → **Updated:** state README: delete the legacy file once the tracked state has been used for one full brief. |

## Things checked and fine
- **Merged PR = Done**; no status-only PR — consistent across workflow §2/§3/§7, CLAUDE/AGENTS, brief/handoff/state templates. Historical Done/Ready statuses untouched (BRIEF-005 stays "Ready" in its file; the merged PR #17 is its Done evidence).
- **Audit S vs head H**: clear, avoids the self-referencing SHA loop; any code/test/dep/CI/schema/scope/rule change after audit → re-audit; exact-head approval + expected-head check before merge; merge ≠ release.
- **Codex fallback auditor**: only on Field's explicit assignment, never automatic; separate session if Codex implemented; recorded in brief + audit. Templates carry the fields.
- **Onboarding identity**: `.agent-local.json` is ignored, holds only `{"developer":"kj"}`, never inferred from Git author/tool account.
- **Execute idempotency**, bounded re-audit loop (stop and escalate on repeated failure), Must fix / Suggestion labels, source-grounding rules.
- **Protected-file edits** in this diff (`.gitignore`, PR template, rules, root instructions) fall under the new explicit "Field-authorized workflow maintenance" session — scoped, not a standing executor permission.
- **Methee placeholder state** is explicitly unverified; no invented progress. `git diff --check` clean.

## Recommendation to Field
**CHANGES REQUIRED — 1 Must fix (M1), small.** The Rev 14 loop is coherent and keeps every earlier decision except the branch-protection record (S1). Fix M1 (who writes KJ state on which branch), optionally S1–S4, then commit; I re-check the commit (bind S = that commit) and you approve the exact head. S5/S6 need no action now.

## Re-check — 2026-09-24 · working tree on base `c8e36bc` (still uncommitted)
| Item | Status | Evidence |
|---|---|---|
| M1 | ✅ fixed (Codex) | workflow §1 Planning row + §2, `docs/state/README.md`: Cowork writes KJ state only on the open task/docs branch at a coordinated clean point, never `main`, else reports in chat; never `methee/` |
| S1 | ✅ applied (Cowork, Field's decision) | §7 **Merge authority**: Field's own PRs pre-approved after audit PASS + zero Must fix + evidence-only S..H + green checks on H; Methee's PRs need `อนุมัติ merge` for the exact head + walkthrough; remote protection settings recorded; §3 lifecycle, §4 critical list and CLAUDE.md aligned |
| S2 | ✅ applied | `docs/state/README.md` — `main` one step behind |
| S3 | ✅ applied | §3 tool reality: Claude Code (authenticated `gh`) can open/merge; Cursor/Cowork hand over compare links |
| S4 | ✅ applied | `agent-boundaries.md` `docs/briefs/**` line lists the executor PR-field exception |
| S5 | no action now | BRIEF-002 gets `Assigned auditor` on its next revision |
| S6 | ✅ applied | README legacy cleanup rule |

**Recommendation: PASS** for the working tree as reviewed. Bind to the commit: after Codex/Field commits this, S = that commit; any further change to rules/templates before merge needs a re-check. This is a Field PR (workflow maintenance), so under the new §7 it may be merged once the commit is re-bound and `ci` is green.
