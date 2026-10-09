# Claude Design (CD) briefs

One CD brief = one Claude Design session. Paste the brief's **"Paste into Claude Design"** block as the prompt; attach the files it lists. Each brief is self-contained so a session doesn't have to load everything.

**Purpose:** designs are used for (1) development — the executable briefs reference artboards by ID — and (2) the advisor presentation — flows, states, feedback and notifications must be shown, not only happy-path screens.

**Claude Design project (base):** https://claude.ai/design/p/99bbff1a-22a2-48d7-8dbc-3226d55e3457 — existing design system by Field. Every CD session works **inside this project**, extending it; never start a new one.

**Component libraries (all briefs):** web = **HeroUI v3** (`@heroui/react`), staff app = **HeroUI Native** (Expo + Uniwind). Designs must use components those libraries provide and map to their theme variables (`docs/design-system.md` §1, §5); only the bar-specific components in §6 are custom. Every CD prompt restates this.

**Sources of truth:** `docs/design-system.md` (tokens, type, spacing, components) · `docs/briefs/ui/*.md` (screen content per surface) · `docs/FRD.md` (behaviour). If a CD session changes a token or component, update `design-system.md` in the same PR.

**Output per brief:** artboards named `CD-##/<artboard-id>` in the Claude Design project, a link written back into the brief's **Result** section, and any design-system changes as a diff to `design-system.md`.

## Series (order = priority)
| ID | Brief | Surface | Why first |
|---|---|---|---|
| CD-00 | Design system gap-fill: **light theme**, HeroUI alignment, missing components/states, status chips, **feedback kit** + notifications | all | Every screen reuses it |
| CD-01 | POS: login, not-registered, app shell, **menu list** | web desktop | Metee's first brief (BRIEF-008) |
| CD-02 | POS: table grid + session detail panel + open-table dialog | web desktop | Sprint 3 core |
| CD-03 | POS: payment (PromptPay QR, cash, split, in-flight collision) — `CD-03-pos-payment.md` | web desktop | core vertical |
| CD-04 | POS: **order for customer** (menu tiles → variant/modifiers → cart → send) — `CD-04-pos-order-entry.md` | web desktop | gate: order entry on POS (DR-009) |
| CD-05 | Back office dashboard: owner money view, manager today, comps/voids — `CD-05-dashboard.md` | web responsive | S1 + presentation |
| CD-06 | Customer QR: welcome → menu (photos) → item → cart → table tab, call staff — `CD-06-customer-qr-order.md` | phone web | S1 |
| CD-07 | Customer payment: merge / split (no claiming) / cash via staff — `CD-07-customer-payment.md` (PDPA → S2) | phone web | S1 |
| CD-08 | Staff app: login, order queue, order detail + status/issue, tables (read-only), more, notifications — `CD-08-staff-app-core.md` | Expo mobile | Metee BRIEF-010 + next mobile briefs |
| CD-09 | Staff app: guest profile + AI summary, bottle keep, payment handoff | Expo mobile | **S2 — deferred** |
| CD-10 | ~~Notifications end-to-end~~ → **merged into CD-11** (Field, 2026-10-09) | all | — |
| CD-11 | Journey boards + notifications matrix (presentation) — `CD-11-journeys-notifications.md` — **run last** | all | gate demo + presentation |
| CD-12 | Back office: responsive shell + menu management (photos, variants, modifiers, categories, 86'd) — `CD-12-backoffice-menu.md` | web responsive | S1 |
| CD-13 | Back office: tables/QR, staff access requests, groups, full policy editor — `CD-13-backoffice-tables-staff.md` | web responsive | S1 (IAM) |
| CD-14 | Staff app: new order — `CD-14-staff-app-new-order.md` | Expo mobile | S1 |
| CD-15 | POS: orders board + issue resolution (escalations from the staff app) — `CD-15-pos-orders-issues.md` | web desktop | S1 |

Status per brief lives in its own file (`Status:` line).
