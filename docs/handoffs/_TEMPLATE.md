# Handoff — BRIEF-### <Title>

| | |
|---|---|
| **Implementer** | <id> (<tool>) · **Brief revision** <n> · **Date** YYYY-MM-DD |
| **Branch** | `feat/BRIEF-###-<slug>` (worktree `.worktrees/BRIEF-###`) |
| **Status** | Implemented — awaiting audit · Changes requested · Audit PASS · BLOCKED |

> Committed as S. After the push, append **Work commit** and **CI run** below (uncommitted — they land in the ship commit H).

**Work commit:** `<S>` · **CI run:** <url>

## Gates
| Gate | Command | Exit | Result |
|---|---|---|---|
| Lint | `<cmd>` | 0 | |
| Typecheck | `<cmd>` | 0 | |
| Unit | `<cmd>` | 0 | <n> passed |
| e2e | `<cmd>` | 0 | <n> passed |
Not run → say why; status is `BLOCKED`, not Implemented. `--no-verify` used → say so here.

## Acceptance lock
Lock commit `<sha>` (pushed right after Step 0) · CI run on it: <url> — red output (assertion, not import error):
```text
<failing assertion excerpt>
```

## Owner approvals
One row per commit carrying `Approved-by:` (`session` · `e2e-change`), written when the OK is given. None → `none`.

| Trailer | Commit | What the owner OK'd (file + change) | Date |
|---|---|---|---|
| | | | |

## Builder's choices
One row per item the brief left to the executor under *Builder's choice*. None → `none`.

| Item | Chosen | Why (inside the bound) |
|---|---|---|
| | | |

## Questions the brief did not answer
Anything you had to stop and work out that the brief or its Read list should have told you (the next brief's Dry Run asks these first). None → `none`.

## Read beyond the Read list
Sections read outside the brief's Read list, and why (planners use this to write better Read lists). None → `none`.

## Run proof
<What ran (stack, migrations, health), the request on the changed path and its result in words. UI / defect: what was exercised. Screenshots in `.field-kit/proof/` (untracked): `<file>` — <what it shows>.>

## AC check
| AC | Met? | Evidence (test / step) | Screenshot *(screen ACs — mandatory)* |
|---|---|---|---|
| 1 | ✅ / ❌ | | `.field-kit/proof/AC1-<screen>-<state>.png` — <what it shows> · or `n/a (no screen)` |

A screen AC without a screenshot of its result from the running build → status `BLOCKED`, not Implemented.

## Disclosures
- **Spec vs reality gaps:** <…>
- **Compromises:** <…>
- **Callers affected** (shared service / repository / transaction boundary changed → caller tests re-run): <…>
- **Out-of-scope defects found:** <none · or `DEFECT-###` logged>
- **Living docs updated / env keys / migrations to run:** <…>

<!-- Fix rounds append here:
### Fix round <N> — <new S>
- `#<n> [<row>] ✓ <reproduced failing → proof passing>` — one line per FIX item
- Found, not fixed (outside the FIX list): <… or none>
- Gates re-run: <commands + results> · Run proof: <…> · Caller tests: <…>
-->
