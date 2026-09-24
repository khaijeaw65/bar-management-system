# State — KJ
Updated: 2026-09-25 · Agent: Cowork (planning)
> Tracked branch snapshot; brief/DR/PR evidence is authoritative.

## Resume
Next Cowork session: **design work** — (1) update `docs/design-system.md`, (2) web UX/UI, (3) mobile UX/UI. BRIEF-007 waits for Field's D1–D4 answers.

## Active
- Brief: BRIEF-007 backend auth · Rev 1 · **Draft** (D1–D4 open) · file `docs/briefs/BRIEF-007-backend-auth.md`
- Stage: planning
- Branch: docs/brief-007-auth (from main `04d6bb5`)
- Work commit: none (docs only) · PR: not opened
- Done: BRIEF-001, 003, 004, 005, 006 (PRs #10 #13 #16 #17 #20) · Draft: BRIEF-002 (Expo)

## Next session — design tasks (inputs → output)
1. **Design system update** — `docs/design-system.md` (dark + light tokens, HeroUI v3 mapping in `app/frontend/src/app/globals.css`) → decide: typography scale in rem, spacing, component states (focus/disabled/loading), status colors for order/payment/bottle-keep, Expo token parity (HeroUI Native + Uniwind). Output: updated design-system.md + token table both apps copy.
2. **Web UX/UI** — `docs/briefs/ui/pos-desktop.md`, `customer-qr.md`, `/pos/menu` reference screen → screen list + flows for Sprint 2–3 (login + not-registered page for BRIEF-008, POS shell, menu, table/session board). Output: UI briefs updated + Design mockups (Claude Design / artifact).
3. **Mobile UX/UI** — `docs/briefs/ui/staff-mobile.md`, CLAUDE.md mobile scope (7 features), DR-005 login → screen list + flows. Output: UI brief updated + mockups. Unblocks `docs/rules/mobile.md` and BRIEF-002 Ready.
- Rule: UI briefs are design inputs, not executable briefs; Thai-primary strings; tokens only.

## Blockers / Coordination
- BRIEF-007 D1 staff provisioning (seed CLI) · D2 refresh tokens in Redis · D3 JWT `{ sub }` only · D4 drop passport — Field to approve/change
- Still pending docs: schema.sql + erd (+ `notification`, `staff_push_token`), FRD §13, `docs/rules/mobile.md`
- Shared files: none · Review queue: this docs branch (not pushed)

## Queue (planning)
1. Field answers D1–D4 → BRIEF-007 Ready → execute (backend auth, web)
2. BRIEF-008 frontend login + axios/401 refresh (DR-007)
3. BRIEF-009 IAM groups/policies + PermissionsGuard + Redis ACL cache
4. Design tasks above (can run in parallel — docs only)
5. BRIEF-002 Expo scaffold after mobile UX/UI + mobile.md
