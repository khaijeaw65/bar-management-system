# DR-### — <Plain-Language Title>

| | |
|---|---|
| **Status** | Pending · Approved · Rejected · Superseded by DR-### |
| **Raised by** | <person / agent> · YYYY-MM-DD |
| **Brief / Feature** | <`BRIEF-###` / `docs/features/<f>/design.md`, or `none`> |
| **Category** | Dependency · Brief deviation · Flow/Architecture · Data · Sensitive |

> Write headlines in plain words (explain any error code, acronym, or library term inline on first use). If an option introduces a pattern **new to Field**, flag it `"new to Field"` and include the familiar baseline option so the trade-off is concrete.

## Context
<What was hit and why it needs a decision. Neutral, technical — describe the problem, not who caused it.>

## Options

### Option A — <Plain name> *(flag `[new to Field]` or `[familiar baseline]` if applicable)*
- **Pros / Cons:** <pros> / <cons>
- **Under the hood:**
  1. <numbered call sequence>
  - **Transaction boundary:** <what is inside vs. outside the DB transaction>
  - **Failure & cleanup:** <if step N fails → what state/files are left behind → what cleans it up>

### Option B — <Plain name>
- **Pros / Cons:** <pros> / <cons>
- **Under the hood:**
  1. <numbered call sequence>
  - **Transaction boundary:** <what is inside vs. outside the DB transaction>
  - **Failure & cleanup:** <if step N fails → what state/files are left behind → what cleans it up>

## Recommendation
<Option A or B, and why — one short paragraph with the concrete trade-off. Required.>

## If Approved — Locks
<What this freezes and where it applies (modules, files, `design.md` contracts, or `CLAUDE.md → Architecture (LOCKED)`), written as the exact one-line bullet. `none` if nothing is locked.>

---

## Decision — Field only
**Decision:** <Approved: A · Rejected · Approved with change: …>
**Why:** <one or two lines>
**Date:** YYYY-MM-DD
