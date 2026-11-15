# DR-030 — Retire learning mode for Metee

| | |
|---|---|
| **Status** | Approved |
| **Raised by** | Field · 2026-11-05 (session) |
| **Brief / Feature** | BRIEF-010, 022, 059, 060, 062, 065 (Ready) · Drafts 074–077 |
| **Category** | Flow/Architecture (process) |

## Context
Since 2026-10-09 Metee worked in learning mode (workflow §8): agents ≤ 20 %, he writes the tests, `start BRIEF-###` copilot only, G3 walkthrough. With the mobile queue at 6 Ready briefs plus 4 Drafts and ~1 brief/week capacity, Field wants Metee's briefs built at executor speed and checked by audit instead.

## Options
**A) Keep learning mode (baseline)** — mobile lands ~mid-Jan at the current pace.
**B) Retire learning mode; quality comes from audit** *(chosen)* — Metee runs executor agents like Field; Cowork audits, Field reviews and approves the merge.

## Decision — Field only
**Decision:** Approved: B.
- Metee = executor like KJ: agents may write 100 % of app code and unit tests; Metee uses `execute BRIEF-###` (`start` stays available for anyone who wants to hand-code).
- Retired: agent ≤ 20 % cap, "the learner writes the tests", G3 walkthrough, AI-usage Low / Medium / High line in handoffs.
- Kept: Cowork audit (default auditor) + Field review of every Metee branch · Metee's PRs still need Field's `อนุมัติ merge BRIEF-###` for the exact head `H` · local Sonar scan still required (an agent may fix the findings).
- **Overrides** every learning-mode line in BRIEF-010 / 022 / 059 / 060 / 062 / 065 (Implementer note, "Learning mode" constraints, G3 walkthrough topic, AI-usage line) without a brief revision (DR > brief, workflow §2 Authority Precedence).
**Why:** speed up the staff app while keeping an independent check on every branch.
**Date:** 2026-11-05 · recorded by Cowork on Field's explicit instruction (session: "approve ลุยได้เลย")
