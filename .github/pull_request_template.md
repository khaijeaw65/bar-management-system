## What & why
<2–3 lines a reader outside the team understands: what changed for whom, and why.>

## How it was verified
- Tests: <unit / e2e counts, key cases>
- Run proof: <what was exercised on the running app>

<details>
<summary>Process gates</summary>

- Brief: `BRIEF-###` rev <n> · Link: <Feature / Defect / standalone>
- DRs: <DR-### (status) or none>
- Audit: PASS · `docs/audits/BRIEF-###.md` · audited S `<sha>` · head H `<sha>` · S..H = audit + handoff only
- Handoff: `docs/handoffs/BRIEF-###.md` · CI `ci` green on H
- Dependencies: <none · `pkg@range` approved by brief Pre-decided / DR-###>
</details>
