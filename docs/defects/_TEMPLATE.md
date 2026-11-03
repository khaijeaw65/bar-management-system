# DEFECT-### — <Title>

| | |
|---|---|
| **ID** | DEFECT-### |
| **Severity** | P1 (Blocker) · P2 (Major) · P3 (Minor) |
| **Status** | Open · In Progress · Resolved (closed in `BRIEF-###` / PR #...) |
| **Found Date** | YYYY-MM-DD |
| **Reported By** | <person / agent> |
| **Found In** | `<commit-sha>` or `<version-tag>` |
| **Affected Invariant** | <ID from `docs/features/INVARIANTS.md` or `none`> |
| **Target Service / Flow** | `<module / service / screen>` |

---

## 1. Summary & Symptoms
<Clear 2–3 sentence description of the unexpected behavior vs. what was expected in plain language (no raw jargon).>

## 2. Reproduction Steps
1. <Step 1>
2. <Step 2>
3. <Trigger action / API call>
- **Actual outcome:** `<status code / error payload / visual defect>`
- **Expected outcome:** `<correct behavior>`

## 3. Root Cause Analysis
- **Suspected / Discovered Cause:** <Why this happens in the code (`path:line`)>
- **Offending Commit (if bisected):** `<sha> (found via git bisect, or n/a)`
- **Affected Callers / Boundaries:** <Which callers or services touch this same state/transaction boundary>

## 4. Reproduction Test Plan
- **Test File:** `<path-to-test>.spec.ts` or `<test-path>.e2e-spec.ts`
- **Test Case Label:** `it('Regression: [DEFECT-###] <description>', async () => { ... })`
- **Initial Verification:** Test fails RED on current code before fix.
- **Resolution Verification:** Test turns GREEN once fix is applied. Kept permanently as regression shield.

## 5. Resolution & Linked Brief
- **Execution Brief:** [`BRIEF-###`](../briefs/BRIEF-###-<slug>.md)
- **Closed in PR:** <PR link / #...>
