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
- **CD brief series:** `docs/design/README.md` (CD-00…CD-11). Written: CD-00 gap-fill (light theme, HeroUI alignment, feedback kit, notifications), CD-01 POS login/shell/menu (88 px rail). One CD brief = one Claude Design session.
- **Design system v2 done (2026-09-27):** `docs/design-system.md` rewritten from the CD export with Field decisions A–G (Noto Sans Thai + Sarabun fallback, CD token names, schema statuses, CD colours, light theme required, 88 px POS rail, staff app = Expo). HeroUI v3 / HeroUI Native mandated in every CD brief. Light values + new tokens come back from CD-00 → Cowork merges into `design-system.md`.
- **2026-09-27:** CD-01 done dark-first → `docs/design/CD-01-handoff.md` (strings, specs, HeroUI map, accepted deviations §5). Screenshots pending in `docs/design/assets/CD-01/` (10 listed in handoff §6). **BRIEF-008 drafted** (Methee: v2 tokens + Noto Sans Thai + POS shell top bar/88 px rail) — awaiting Field Ready approval. Queue: BRIEF-009 contracts + OpenAPI foundation (kj) → BRIEF-010 menu-list redesign (Methee, search/chips/no-result on contracts mock) · CD-00 · BRIEF-007 resume.
- **2026-09-28 (end of day):** Standard envelope = `{ status, code, message, data }` on every response, `code: ''` on success (Field); no `?.`/`!` on envelope fields. BRIEF-010 must add `code: ''` to the MSW menu mocks. Branch pushed/merged by Field tonight.
- **2026-09-28 (latest):** D1–D4 decided (error `code` yes · no URL version · Idempotency-Key yes on order/payment create · menu `basePrice`+`variants[]`). `docs/api/README.md` v1, `backend.md` envelope gets `code` (D1 consequence). **BRIEF-009 Ready** (kj, parallel with BRIEF-008). Next: push/merge docs branch → Methee `execute BRIEF-008`, Field `execute BRIEF-009` → then BRIEF-010 draft (menu-list redesign on contracts).
- **2026-09-28 (later):** Field approved Cowork editing protected `backend.md` (OpenAPI section) + `_TEMPLATE.md` (OpenAPI AC) this once. Drafted `docs/api/README.md` (conventions + Phase-1 catalog, open D1–D4) and **BRIEF-009 contracts + OpenAPI foundation** (Draft, kj, parallel with BRIEF-008). Menu-list redesign renumbered → BRIEF-010.
- **2026-09-28:** DR-004 Amendment 1 — backend publishes OpenAPI via Swagger, generated from contracts Zod (UI `/api/docs` non-prod, committed `docs/api/openapi.json` + CI drift check, no FE codegen). Follow-up for Field (manual): `backend.md` OpenAPI section.
- **2026-09-28:** BRIEF-008 **Ready** (Field approved). Gap found: no API contract design — `@bar/contracts` enums stale vs `schema.sql` (OrderStatus/SessionState), menu mock shape provisional (`category`/`price` vs `category_id`/`base_price`). Proposed: `docs/api/` conventions + Phase-1 endpoint catalog, then a small contracts-foundation brief before BRIEF-009.
- **CD-00 done (2026-09-27):** `docs/design/tokens-v2.css` (final dark + light + HeroUI mapping, names verified vs @heroui/styles 3.2.6) + `docs/design/CD-00-handoff.md` (component map, status chips → schema enums, states, deviations accepted by default). `design-system.md` → v2.1. BRIEF-008 now copies `tokens-v2.css` (no temporary light values). Field to eyeball CD-00 boards for blank cards.
- **Earlier plan:** Field runs CD-00 then CD-01 in the base CD project → pastes Result back → Cowork writes BRIEF-008 (Methee). Frontend token migration (`globals.css` → v2 names + Noto Sans Thai) = part of BRIEF-008 or a small separate brief — decide when writing it.
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
