# DR-034 — Fix the flaky CartPanel "quick add" test that blocks CI

| | |
|---|---|
| **Status** | Approved |
| **Raised by** | Claude Code (for KJ) · 2026-11-15 |
| **Brief / Feature** | none (found on PR #131, `docs/sync-field-kit-0.1.0`; test added in BRIEF-049) |
| **Category** | Brief deviation (edits a test file outside the PR's scope) |

## Context
CI check `checks` on PR #131 failed twice (run 43727365771, original + rerun) on one frontend test:
`app/frontend/src/app/pos/tables/[visitId]/order/_components/CartPanel.test.tsx` › "quick add merges a line and undo removes the last tap".
Error: `Unable to find role="button" and name /สิงห์/` at the first `await screen.findByRole(...)` (line 86).
`findByRole` waits only 1 second by default for the menu tile to render after the mocked menu request. When the full frontend suite runs under load (CI, or the local pre-push hook) the tile sometimes appears later than that. The same test also failed once in a local full-suite run and passed alone and on a retry.
Other PRs stayed green only because docs-only PRs do not run the frontend suite; PR #131 touches `ci.yml`, hooks and gates, so everything counts as "affected". Any future PR that runs the frontend suite can hit the same flake.
Fixing it edits a test file, which is outside PR #131's docs-sync scope, so it needs a decision (Field Guard: work outside the brief).

## Options

### Option A — Give the first lookup a longer wait, in a separate small PR *(familiar baseline)*
- **Pros / Cons:** One-line change (`findByRole(..., { timeout: 5000 })`), no new dependency, test logic unchanged. / Treats the symptom; other tests in the file with the same pattern (e.g. line 111) may flake later and need the same fix.
- **Under the hood:**
  1. Test renders `CartPanel` with a mocked menu API (MSW, a library that fakes HTTP responses in tests).
  2. React Query fetches the menu; the tile renders after the response resolves.
  3. `findByRole` polls until the tile exists or the timeout (now 5 s instead of 1 s) expires.
  - **Transaction boundary:** none — no database involved.
  - **Failure & cleanup:** if the tile never appears, the test still fails after 5 s with the same error; nothing is left behind.

### Option B — Raise the default `asyncUtilTimeout` for the whole frontend test setup
- **Pros / Cons:** Fixes every similar lookup at once. / Touches shared test setup, slows down real failures across the whole suite, and may hide genuine slow renders.
- **Under the hood:**
  1. Set `configure({ asyncUtilTimeout: 5000 })` in the frontend test setup file.
  2. All `findBy*` / `waitFor` calls use the new default.
  - **Transaction boundary:** none.
  - **Failure & cleanup:** none; genuine failures take up to 5 s longer each.

### Option C — Rerun CI until it passes, change nothing
- **Pros / Cons:** No code change. / Not a fix: CI failed 2 of 2 on this PR, every future run stays a coin flip, and the "not run is never pass" rule is bent in practice.
- **Under the hood:**
  1. Re-run the failed job.
  - **Transaction boundary:** none.
  - **Failure & cleanup:** none.

## Recommendation
Option A in its own small `fix/` PR merged before PR #131, so #131 stays docs-only and CI-green. It is the smallest change that removes the observed failure; if more tests show the same pattern, widen it to Option B in a follow-up DR.

## If Approved — Locks
none

---

## Decision — Field only
**Decision:** Approved: A
**Why:** Field stated "Approve A" in session — smallest change, separate PR merged before #131.
**Date:** 2026-11-15
