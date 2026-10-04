# DR-008 — Ownership split: Metee owns the Expo mobile app; Field owns backend + web

| | |
|---|---|
| **Status** | Approved |
| **Raised by** | Field via Cowork · 2026-10-04 |
| **Brief** | Re-plan 2026-10-04 (build restarts 12 Oct, 70% gate 8 Nov) |
| **Category** | Flow/Architecture (team ownership) |

## Context
Re-plan after timeline slip (work + midterms). Metee is available only after 20:00 (~10 h/week) and works in learning mode (codes 70–80% himself), so his throughput is below the critical path to the 8 Nov gate (order → pay → close, web POS). Splitting web frontend between two people also means shared files, merge conflicts and reviews of UI Field would write differently. The advisor requires a mobile app, and Metee already built the Expo scaffold (BRIEF-002).

## Options
**A) Split by surface** — Metee owns `app/mobile/` (Expo React Native); Field owns `app/backend/` + `app/frontend/` (web), and reviews mobile PRs / Metee keeps a separate surface with no file overlap, learns by owning it end to end; web is no longer gated on his pace / Field carries ~80% of the gate scope; mobile is outside the core slice unless given a gate slice.
**B) Keep Metee on web frontend** — no change / web critical path depends on ~10 h/week; shared-file conflicts.

## Recommendation
**A.** Clear boundaries, faster critical path, real ownership for Metee.

### Rules
- **Metee:** `app/mobile/` only. Consumes the backend through `@bar/contracts` — no new endpoints for mobile (CLAUDE.md: same backend API). Mocks via contracts fixtures until the real API is up. Mobile auth per DR-005.
- **Field:** backend, web frontend (POS, customer QR web), contracts, and **reviewer/approver of every mobile PR** (`อนุมัติ merge` as today).
- Changes Metee needs in backend/contracts → raised to Field (brief or DR), never edited from the mobile brief.
- Metee keeps ~1 brief/week ≤ 10 h; next brief Ready by Sunday.
- Web briefs previously assigned to Metee (BRIEF-008 POS shell, menu list redesign) move to Field.

**Follow-ups:** CLAUDE.md / AGENTS.md team + structure lines (Metee = Mobile Developer, `app/mobile/` exists) — Field edits (protected) · BRIEF-008 reassign to Field · `docs/rules/mobile.md` before the first mobile feature brief · mobile gate slice + CD-08 scope (open, see KJ state).

---

## Decision — Field only
**Decision:** Approved: A — Metee owns the React Native (Expo) app; Field owns backend + web frontend and reviews the mobile app.
**Why:** Separate surfaces remove the web critical path from Metee's evening-only capacity and give him full ownership of one surface.
**Date:** 2026-10-04 · recorded by Cowork on Field's explicit instruction (planning session); Field signs off by merging the PR
