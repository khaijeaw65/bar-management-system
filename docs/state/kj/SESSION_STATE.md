# State — KJ
Updated: 2026-10-04 · Agent: Cowork (planning)
> Tracked branch snapshot; brief/DR/PR evidence is authoritative.

## Resume
**Re-plan (Field, 2026-10-04): build restarts 12 Oct; 70% co-op gate fixed 8 Nov = core slice order → pay → close.** Week 0 (5–11 Oct) = midterms + task clearing; Methee starts on mobile (DR-008). Next for Cowork: CD-03 Q1–Q3 → Ready; Methee's next brief must be Ready by each Sunday.

## Plan (to 8 Nov) — DR-008: Methee = Expo mobile, KJ = backend + web, reviews mobile
| Week | KJ | Methee (mobile, after 20:00, ~1 brief/wk ≤10 h, contracts fixtures) |
|---|---|---|
| 0 · 5–11 Oct | push branch, BRIEF-002 PR, briefs | merge BRIEF-002 → app shell + mocked login |
| 1 · 12–18 Oct | BRIEF-009 → BRIEF-007 auth → guard · BRIEF-008 POS shell | table list (mocks) |
| 2 · 19–25 Oct | tables/visits/orders API + WS · menu list + grid (web) | new-order flow (mocks) |
| 3 · 26 Oct–1 Nov | payment + webhook + close · drawer + checkout (web) | wire to real API + realtime |
| 4 · 2–8 Nov | integration, seed, demo — no new features | fixes; demo: phone order → POS live |
| 9–20 Nov | AWS deploy · bottle keep if time | polish |
Checkpoint 25 Oct: if orders API not live, cut web checkout polish, not the core slice. If ahead: bottle keep → dashboard → customer QR. LINE OA → Sem 2.
**Open (Field):** mobile gate slice = login → table list → take order? · CD-08 small run or HeroUI Native defaults?

## Active
- Stage: planning — UI design series (CD-02 → CD-11)
- Branch: `docs/ui-design-cd03` (from main @ 42a7afd) · PR open, docs only
- Done: CD-00, CD-01, **CD-02** (handoff + F1–F4 decided, 2026-09-28) · CD-03 **Draft**
- Engineering: BRIEF-002 Expo scaffold implemented on `feat/BRIEF-002-expo-scaffold` (0a95185) — **no PR yet, needs audit** · BRIEF-008 (Methee) / BRIEF-009 (kj agent) Ready, not started per evidence · BRIEF-007 ON HOLD (D1–D4 now decided → can resume)
- Done briefs: 001, 003, 004, 005, 006

## Field to-do (small, any order)
1. Answer CD-03 Q1 (`cancelled` payment status), Q2 (charge items in split), Q3 (manual confirm, PIN or not).
2. Export CD-02 screenshots → `docs/design/assets/CD-02/` (list in handoff §7) — not blocking.
3. Open PR for BRIEF-002 + assign auditor.
4. Re-plan sprint dates after midterms.

## UI design session — how to run it
Pattern (copy CD-02): brief file `docs/design/CD-##-<slug>.md` (Status · Attach · Data · Decisions · Paste block · Acceptance · Result). Prompt rules: inside The Loft Bar Design System project · dark + light · HeroUI v3 / HeroUI Native, label parts · tokens only · Noto Sans Thai · chips by schema enum · `CD-##/<id>` · static state boards · flow board · standalone preview cards. After a run Field pastes the handoff summary (prompt below) + saves screenshots; Cowork writes the handoff and flags contradictions.
```
Summarise CD-## for a developer handoff, as plain text:
1. Per artboard: every state shown + a table of every Thai/English string exactly as drawn.
2. Layout specs (sizes, spacing/radius tokens, column widths, breakpoints).
3. Components per artboard with HeroUI v3 / HeroUI Native name + variant/size.
4. New components or tokens created, with values.
5. Deviations from the prompt, and why.
```
Remaining order: CD-03 payment · CD-04 menu mgmt · CD-05 dashboard · CD-06/07 customer QR · CD-08/09 staff app · CD-10 notifications · CD-11 journeys. Stale inputs: `docs/briefs/ui/*.md` (old tokens, PWA), FRD §13/§15 PWA wording.

## Engineering queue (after design)
1. BRIEF-010 menu-list redesign (Methee) after BRIEF-009 · 2. Resume BRIEF-007 auth · 3. Frontend login + axios, IAM · 4. `docs/rules/mobile.md` after BRIEF-002 Done · 5. TableCard build replaces TableTile (CD-02 F4).

## Blockers / Coordination
- Pending docs: schema.sql + erd (`notification`, `staff_push_token`, Q1 outcome), FRD §13, `docs/rules/mobile.md`
- Stale remote branches to clean up (Field): `docs/brief-006-sonar`, `docs/brief-007-auth`, `docs/ui-design-screens`, `feat/BRIEF-006-local-sonar`
