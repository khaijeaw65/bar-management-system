# State — KJ
Updated: 2026-09-28 · Agent: Cowork (planning)
> Tracked branch snapshot; brief/DR/PR evidence is authoritative.

## Resume
**Next session = UI design briefs (CD-02 → CD-11).** Field wants as many screens finished as possible so Methee can see the whole app flow and how UX/UI behaves. Cowork writes **one CD brief per Claude Design session**, Field runs it, pastes the handoff back, Cowork records it. Start with CD-02.

## Active
- Stage: planning — UI design (Claude Design series)
- Branch: `docs/ui-design-screens` (from main after PR #23) · state + CD briefs go here · push + merge as docs
- In progress (engineering, not this session): **BRIEF-008** Methee (POS shell + tokens v2, Ready) · **BRIEF-009** kj agent (contracts + OpenAPI foundation, Ready) — run in parallel
- ON HOLD: BRIEF-007 backend auth (Draft, D1–D4 open)
- Done: BRIEF-001, 003, 004, 005, 006 · Draft: BRIEF-002 (Expo)

## UI design session — how to run it
**Goal:** screens + flows + states for every Phase-1 surface, usable for (1) Methee's development and (2) the advisor presentation.

**Series & order** (`docs/design/README.md`): CD-02 POS table grid + session panel + open-table · CD-03 POS payment (PromptPay, cash, split, in-flight collision) · CD-04 POS menu mgmt / 86'd / restock · CD-05 dashboard · CD-06 customer QR name → menu → item → cart → status · CD-07 customer payment / split / PDPA consent · CD-08 staff app login / queue / order detail / new order · CD-09 staff app guest profile + AI summary / bottle keep / payment handoff · CD-10 notifications end-to-end · CD-11 journey boards (presentation).
Done: **CD-00** (design system, light theme) · **CD-01** (POS login, not-registered, shell, menu list, session expired).

**Per CD brief — pattern that worked (copy CD-01):**
1. File `docs/design/CD-##-<slug>.md`: Status · Surface · Used by · Attach (base project link) · "Paste into Claude Design" block · Acceptance · Result.
2. Prompt must say: work **inside The Loft Bar Design System project** (Design systems tab → The Loft Bar Design System — *not* the home "What should we create?" box, that makes a new project) · **dark + light** · HeroUI v3 (web) / HeroUI Native (Expo) components, label each part · tokens only · Noto Sans Thai · status chips keyed by **schema enums** (CD-00 handoff §2) · artboards `CD-##/<id>` · **static state boards** (all states side by side, no clickable switchers) · a flow board with arrows · every preview card must render standalone (Lucide loaded in-card / explicit 1280×800 or 390×844 size).
3. After the run, Field asks CD for the handoff summary (prompt below) and saves screenshots to `docs/design/assets/CD-##/`.
4. Cowork writes `docs/design/CD-##-handoff.md` (strings, layout specs, HeroUI map, accepted deviations, design bugs) — reads screenshots, flags contradictions (e.g. CD-01 error state also showed the empty state → recorded as a design bug).

**Handoff-summary prompt for Field (reuse):**
```
Summarise CD-## for a developer handoff, as plain text:
1. Per artboard: every state shown + a table of every Thai/English string exactly as drawn.
2. Layout specs (sizes, spacing/radius tokens, column widths, breakpoints).
3. Components per artboard with HeroUI v3 / HeroUI Native name + variant/size.
4. New components or tokens created, with values.
5. Deviations from the prompt, and why.
```

**Inputs per brief:** `docs/FRD.md` (§3 tables/visits, §6 orders, §7 payment, §10 guest intelligence, §11 bottle keep, §12 analytics, §13 notifications) · `docs/schema.sql` · `docs/api/README.md` (endpoint catalog → which data each screen has) · `docs/design/CD-00-handoff.md` (components, chips) · `docs/design/CD-01-handoff.md` (shell) · `docs/briefs/ui/{pos-desktop,customer-qr,staff-mobile}.md` (older screen content).

**Known stale inputs — fix while writing the CD briefs (don't trust blindly):**
- `docs/briefs/ui/*.md` reference the old token names / `Colors.dc.html`; `staff-mobile.md` says PWA (staff app = **Expo**, DR-002/G); `pos-desktop.md` table states predate `visit_state` enums.
- FRD §13/§15 still say PWA / Web Push → staff push = Expo push (DR-003 `staff_push_token`).
- UI briefs are design inputs, not executable briefs.

**Scope discipline:** Phase-1 features only; cut items (offline, member QR, staff performance analytics, item-level split) never appear. Phase-2 (LINE OA, loyalty) not drawn.

## Engineering queue (after design)
1. BRIEF-010 menu-list redesign (Methee) — after BRIEF-009 merges; MSW mock on contracts shape incl. `code: ''`; CD-01 menu states (error state = Alert + retry only).
2. Resume BRIEF-007 (Field answers D1–D4) — auth endpoints use the OpenAPI helper from BRIEF-009.
3. Frontend login + axios (DR-007) · IAM (groups/policies/PermissionsGuard) — IDs allocated when drafted.
4. BRIEF-002 Expo scaffold after CD-08 + `docs/rules/mobile.md`.

## Decisions to remember (2026-09-27/28)
- Design system v2.1: values in `docs/design/tokens-v2.css`; Field A–G (Noto Sans Thai, CD token names, schema statuses, CD colours, light theme, 88 px rail, staff = Expo).
- API: standard envelope `{ status, code, message, data }` on every response, `code: ''` on success; D1 error codes · D2 no URL version · D3 Idempotency-Key on order/payment create · D4 menu `basePrice` + `variants[]`. OpenAPI via Swagger generated from contracts Zod (DR-004 A1).

## Blockers / Coordination
- Pending docs: schema.sql + erd (+ `notification`, `staff_push_token`), FRD §13, `docs/rules/mobile.md`
- Stale remote branches to clean up (Field)
