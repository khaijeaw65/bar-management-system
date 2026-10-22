# DR-019 — Defer split-equal bill (BRIEF-023) out of Phase 1 core

| | |
|---|---|
| **Status** | Approved |
| **Raised by** | Cowork · 2026-10-22 |
| **Brief** | BRIEF-023 (Q1 was open) |
| **Category** | Scope · Flow change (FRD §7) |

## Context
FRD §7 offers merge bill or split-equal (one QR per person), with charge lines assigned to a specific tab. BRIEF-013 shipped merge checkout only and kept `mode` in the API so split could be added later; BRIEF-033 hides the split option. BRIEF-023 (split-equal + charge-line assignment) still had Q1 open: what happens to charge lines added while a split is pending.

## Options
**A) Defer split-equal to the backlog** — counter seats already pay separately by design (own QR, own session, own bill — FRD §3); Thai groups at a table usually settle informally (one person pays, friends transfer). Removes locked shares, per-share QR/expiry/cancel and the charge-line question from the 10 Nov path. / One fewer differentiator in the demo; CD-03 / CD-07 split screens stay unbuilt for now.
**B) Build BRIEF-023 now** — full FRD §7 / ~1 day+ of money-path code and tests for a rarely used flow, plus Q1 to decide.

## Recommendation
A — the counter-seat model already covers the common case; table split adds money-path edge cases with little operational value in a counter bar.

## If Approved — Locks
- Checkout = merge only (one payment per remaining bill, cash or PromptPay) until a later DR reopens split.
- BRIEF-023 → Deferred (not executed). `mode: 'merge'` stays in the contract; no schema change (`payment_charge_item` stays unused).
- FRD §7 split-equal marked deferred. CD-03 / CD-07 split screens are reference only.

---

## Decision — Field only
**Decision:** Approved: A — "defer split bill"
**Why:** Too complex for the bar environment right now; counter seats already split by design.
**Date:** 2026-10-22 · recorded by Cowork on Field's explicit instruction (session)
