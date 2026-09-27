# State — KJ
Updated: 2026-09-27 · Agent: Cowork (planning)
> Tracked branch snapshot; brief/DR/PR evidence is authoritative.

## Resume
**Design session (priority):** produce the designs + one Ready brief Methee can start on **2026-09-28**. BRIEF-007 is ON HOLD.

## Active
- Stage: planning — UX/UI design
- Branch: docs/brief-007-auth (holds BRIEF-007 Draft + this state) · push + merge as docs
- ON HOLD: BRIEF-007 backend auth (Draft, D1–D4 open: staff seed CLI · refresh tokens in Redis · JWT `{ sub }` · drop passport)
- Done: BRIEF-001, 003, 004, 005, 006 · Draft: BRIEF-002 (Expo)

## Design session — tasks (inputs → output)
- **CD brief series:** `docs/design/README.md` (CD-00…CD-11). Written: CD-00 design system + feedback kit, CD-01 POS login/shell/menu. One CD brief = one Claude Design session.
1. **Design system** — `docs/design-system.md`, HeroUI mapping in `app/frontend/src/app/globals.css` → type scale (rem), spacing, component states (focus/disabled/loading/error), status colors (order/payment/bottle-keep), Expo token parity (HeroUI Native + Uniwind). Output: updated `design-system.md`.
2. **Web UX/UI** — `docs/briefs/ui/pos-desktop.md`, `customer-qr.md`, `/pos/menu` screen → screen list + flows for Sprint 2–3 (login + not-registered, POS shell, menu, table/session board). Output: updated UI briefs + mockups (Design artifact).
3. **Mobile UX/UI** — `docs/briefs/ui/staff-mobile.md`, CLAUDE.md mobile scope (7 features), DR-005 login → screen list + flows. Output: updated UI brief + mockups; then `docs/rules/mobile.md`.
4. **Methee's first brief (must be Ready by 09-28):** a frontend brief he can build with **MSW mocks only** (no backend auth needed yet) — e.g. POS shell + one Sprint-2 screen from task 2. Implementer `methee`, auditor Cowork, learning mode, local Sonar scan required. Next free ID: **BRIEF-008**.
- Rules: UI briefs are design inputs, not executable briefs · Thai-primary strings · tokens only (no hex, no `dark:` colors).

## Methee onboarding (before he executes)
- `onboard methee` in his own clone → sets `.agent-local.json`, reads `docs/state/methee/SESSION_STATE.md` (placeholder)
- Needs: Docker (SonarQube), `pnpm install`, `docs/quality/README.md` one-time Sonar setup

## Blockers / Coordination
- Pending docs: schema.sql + erd (+ `notification`, `staff_push_token`), FRD §13, `docs/rules/mobile.md`
- Review queue: this docs branch (not pushed)

## Queue (planning)
1. Design tasks 1–3 + Methee's BRIEF-008 (Ready by 09-28)
2. Resume BRIEF-007 (Field answers D1–D4)
3. Frontend login + axios (DR-007) · IAM (groups/policies/PermissionsGuard) — IDs allocated when drafted
4. BRIEF-002 Expo scaffold after mobile UX/UI + mobile.md
