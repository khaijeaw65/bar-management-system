# State — KJ
Updated: 2026-10-04 17:50 · Agent: Cowork (planning)
> Tracked branch snapshot; brief/DR/PR evidence is authoritative.

## Resume
**Re-plan (Field, 2026-10-04): build restarts 12 Oct; 70% co-op gate fixed 8 Nov = core slice order → pay → close.** Week 0 (5–11 Oct) = midterms + task clearing; Metee starts on mobile (DR-008). Next for Cowork: CD-03 Q1–Q3 → Ready; Metee's next brief must be Ready by each Sunday.

## Plan (to 8 Nov) — DR-008: Metee = Expo mobile, KJ = backend + web, reviews mobile
| Week | KJ | Metee (mobile, after 20:00, ~1 brief/wk ≤10 h, contracts fixtures) |
|---|---|---|
| 0 · 5–11 Oct | push branch, BRIEF-002 PR, briefs | merge BRIEF-002 → app shell + mocked login |
| 1 · 12–18 Oct | BRIEF-009 → BRIEF-007 auth → guard · BRIEF-008 POS shell | table list (mocks) |
| 2 · 19–25 Oct | tables/visits/orders API + WS · menu list + grid (web) | new-order flow (mocks) |
| 3 · 26 Oct–1 Nov | payment + webhook + close · drawer + checkout (web) | wire to real API + realtime |
| 4 · 2–8 Nov | integration, seed, demo — no new features | fixes; demo: phone order → POS live |
| 9–20 Nov | AWS deploy · bottle keep if time | polish |
Checkpoint 25 Oct: if orders API not live, cut web checkout polish, not the core slice. If ahead: bottle keep → dashboard → customer QR. LINE OA → Sem 2.
DR-009 surfaces: gate = POS full slice (incl. order for customer) + mobile login + order queue (bonus). No CD-08 — mobile uses HeroUI Native + CD-02 content. Seeded menu/tables/staff for the gate.

## Active
- Stage: planning — briefs for the gate (session 2026-10-04)
- Branch: `docs/ui-design-cd03` (from main @ 42a7afd) · **not pushed** — Field: `git push -u origin docs/ui-design-cd03` + PR
- Decisions today: DR-008 (Metee = mobile), DR-009 (surfaces), DR-005 A1 (`sid` session check), CD-03 Q1–Q3, CD-04 Q1, BRIEF-007 D1–D4, BRIEF-011 Q1–Q2, `payment_status += cancelled`
- **Ready:** CD-03 payment · CD-04 POS order entry · BRIEF-007 auth Rev 2 (after 009) · BRIEF-008 POS shell (→ kj) · BRIEF-009 · **BRIEF-010 mobile shell/queue (Metee)** · BRIEF-011 tables + visits + realtime · `docs/rules/mobile.md`
- **Next briefs (not written):** BRIEF-012 backend orders (place, queue, state machine, totals, `open→active`, WS) · BRIEF-013 backend payment + GB Prime Pay webhook + 409 in-flight · IAM brief (groups/policies/PermissionsGuard — ID by Field) · web briefs after CD runs (grid+panel, order entry, checkout) · Metee Week 1 (status actions + order detail)
- Engineering: BRIEF-002 implemented on `feat/BRIEF-002-expo-scaffold` (0a95185) — **no PR, needs audit; blocks BRIEF-010**
- Done briefs: 001, 003, 004, 005, 006

## Field to-do (small, any order)
1. Edit CLAUDE.md / AGENTS.md (Methee→Metee, mobile owner, drop web `/staff`) + `frontend.md` Target Surfaces (`/staff` row) + `.cursor/.agents` wrappers for `mobile.md` — protected.
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

## Blockers / Coordination
- Pending docs: erd.html (`notification`, `staff_push_token`, `payment_status.cancelled`, `visit.guest_label`, live-visit index), FRD §13, `docs/rules/mobile.md`
- Stale remote branches to clean up (Field): `docs/brief-006-sonar`, `docs/brief-007-auth`, `docs/ui-design-screens`, `feat/BRIEF-006-local-sonar`
