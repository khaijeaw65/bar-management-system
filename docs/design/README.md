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

## Canvases — index, build recipe, gotchas

> Moved from `docs/state/kj/PLANNING.md` (removed in workflow Rev 19 — state is the only planning file). Status columns are as of 2026-10-17; each CD's handoff (`docs/design/CD-##-handoff.md`) is authoritative.

Read first: `docs/design/cd-template.md` (what a CD contains) · `docs/design/board-convention.md` (how boards look) · **`docs/design/CD-14-handoff.md` = reference example (rev 3, passed pilot)** · canvas https://claude.ai/artifact/VXJCDCG4BLQrXvXMaBFPTW.

### Design canvases (claude.ai Artifacts, type Design, DS "The Loft Bar Design System")
| CD | Canvas | Status |
|---|---|---|
| CD-01 POS login/shell/menu | https://claude.ai/artifact/GDCe3opjPBQ7YxAZ6RwEBo | Field OK (rev 1) · retrofit pending |
| CD-02 POS tables + session | https://claude.ai/artifact/WEfv8fV7z1FMAu8tFSqCRG | Field OK (rev 1) · retrofit pending (+ join confirm) |
| CD-03 POS payment | https://claude.ai/artifact/1NiEZaPhKTRsKtHh4WcqZb | rev 2 retrofit done 10 Oct (review: R1, R3–R5 pending; R3 = first screen review) |
| CD-04 POS order entry | https://claude.ai/artifact/8xBUgRiM4ZmQoNvinbVSsz | rev 2 retrofit done 10 Oct (review: R1, R6–R8 pending) |
| CD-06 customer QR order | https://claude.ai/artifact/6f5CBjGzpN4zYFotFQauGi | rev 1 built 10 Oct · Field 11 Oct: R1 R6 ✓, R2 drawn (pending), R3–R5 parked |
| CD-07 customer payment | https://claude.ai/artifact/JDoXZyWWF2tLybdY9dufQe | rev 1 built 11 Oct (review: R1–R3, R5; R4 parked with CD-06 session) |
| CD-15 POS orders + issues | https://claude.ai/artifact/QvCcTKGEBD77NqW4ZarhcL | rev 1 built 11 Oct (review: R1, R3, R5, R6; R2 + R4 parked) |
| CD-12 back-office menu | https://claude.ai/artifact/DXNTpCExFkMNmJodR9CpZJ | rev 1 built 11 Oct (review: R1–R8; R5 = S1 promo creation decision) |
| CD-13 back-office tables/staff/IAM | https://claude.ai/artifact/PF5pdKMY4b2w1oaunrHJH3 | rev 1 built 11 Oct (review: R1–R8; R3 06:00 cut-off, R4 rejected re-login = decisions) |
| CD-05 dashboard | https://claude.ai/artifact/WiY9xummEw5w2rPdnRqBdf | rev 1 built 11 Oct (review: R1–R6; R2 = chart tokens into DS) |
| CD-11 journeys + notifications (presentation) | https://claude.ai/artifact/PpcMLoSNUudmcQU3kiYDsG | rev 1 built 11 Oct (review: R1–R4; R3 = DR-009 amendment; re-copy sources after other approvals) |
| CD-08 staff app core | https://claude.ai/artifact/E1EzrLh3piE3esih4VyRwB | Field OK (R1–R5) · retrofit pending (+ สั่งออเดอร์) |
| CD-14 staff new order | https://claude.ai/artifact/VXJCDCG4BLQrXvXMaBFPTW | **rev 3 approved 10 Oct — template reference** (images in docs/design/assets/CD-14/) |
Handoffs: `docs/design/CD-##-handoff.md`. DS: https://claude.ai/artifact/AXVdDV921SWCiAxGJxD78D (version 1791561405-c72e). CD-14 Lucide blob `/_blob/55621ac7d8cfe40fb69092b2ed520365` (CD-14 only).

### How to build a canvas (proven recipe)
1. `Artifact publish type_url=https://claude.ai/artifact/QKN21svewxgyPb6SYRqWnd title="CD-## …" auto_open=after_first_write`.
2. Upload Lucide UMD as an asset on that canvas (`npm pack lucide@0.468.0` → `package/dist/umd/lucide.min.js`; scratchpad doesn't survive sessions) → `/_blob/<id>`; blobs are per canvas.
3. Write `project/canvas.json` (all boards pre-declared, 80 px row gap / 120 px between rows, `designSystems` record) + Main + shared children; publish in ONE call with DS server copies: `project/ds/theloftbardesignsystem_99bbff/{styles.css,_ds_bundle.js,tokens/{fonts,colors,typography,spacing,radius,elevation,motion,heroui,base}.css,assets/fonts/NotoSansThai-{Regular,SemiBold,Bold}.ttf}` ← `{"artifact": DS url, "path": "project/<same>"}` (DS has no tokens.json).
4. Then one board per write → publish. Don't verify/render unless Field asks.
5. Head per board: `support.js` · `ds/…/styles.css` · lucide blob · `ds/…/_ds_bundle.js`. Mount DS via `<x-import component-from-global-scope="TheLoftBarDesignSystem_99bbff.<Comp>">`. Theme: root `data-theme="{{theme}}"` + enum tweak dark/light, pass `theme="{{theme}}"` to every `dc-import`.
6. Board pattern (phone boards: see CD-14 — 390×844 frames, radius 36, gap 40; Journey arrows 136 px wide, margin-top 440): 40 px padding, `--bg-sunken`, h1 `--text-heading` + one-line note, frames 1280×800 side by side (gap 40): PosFrame (inset 0) + content child (left 88, top 56) + optional scrim/drawer (right 0, top 56, 400×744) + modal overlay (`--scrim` + `--blur-overlay`).
7. Write/refresh `docs/design/CD-##-handoff.md` to the template, commit (with delete permission granted, git cleans its own locks).

### Canvas gotchas (each one cost a fix)
- Shared child roots need `position: relative; isolation: isolate` or DS badges (`z-index: var(--z-raised)`) leak over modals.
- `style="…"` on `x-import` is ignored → wrap in a `<div style>`.
- Numeric props must be holes (`width="{{w84}}"`), not strings (`width="84"` renders wrong).
- Toast body = children (no `description`); `action={{ {label} }}`. Input/Select error = `error="text"` (no `error-message`); Select supports `is-open`, `options=[{value,label}]`. PromptPayPanel: `amount` string, `qr-src`, `qr-size`, `status` (completed/cancelled/expired), `expires-in`.
- DS Badge tones: neutral · accent · new · making · served · void · bottle (no `info`). StatusChip `kind="menu" status="soldout"` exists.
- DS `Dialog` takes JSX `actions` → can't set from markup; draw alert dialogs from tokens + DS Buttons.
- To stretch a DS component (e.g. SearchField) the `x-import` host must be the flex item: wrapper `class="sf"` + helmet `.sf > *{flex:1 1 auto;display:flex;min-width:0}`.
- Journey phones must match the state boards exactly (same chips/header) — no simplified copies.
- Never name a DC prop `name` (selects the component) — CD-04 uses `who`.
- If a publish is refused (Field edited the canvas): `read` the files, re-apply, republish. Field sometimes edits defaults (e.g. Grid default mode) — keep them.
- Bundle source for prop lookups: `read` any canvas's `project/ds/theloftbardesignsystem_99bbff/_ds_bundle.js` (scratchpad does not survive sessions); grep `function <Comp>(` for props.
- Row tap ring = overlay span (`left/right -12px, top/bottom 6px`, 2.5 px accent border, radius 12) — not `outline` on the full row.
- Protected files (incl. `docs/rules/**`): edit only with Field's explicit OK on the exact change in the session (agent-boundaries rev 11 Oct); trailer `Approved-by: Field (session)`. Snapshots under `docs/design/source/**` and `docs/handoff.md` are never edited. Validate schema changes by running the whole file on a throwaway Postgres (binaries are in the cloud container: /usr/lib/postgresql/*/bin, run as user postgres in /var/tmp).

### Retrofit checklist (per canvas, from cd-template.md)
1. `read` the canvas `project/canvas.json` + boards (Field may have edited — keep his edits). Re-upload Lucide only if adding boards that need it (blob ids are per canvas; existing boards already reference their own blob).
2. **Overview board** (leftmost, x = −1840, 1760×1100): goal, pain point (field research — ask Field, never invent; mark "สมมติฐาน" if unknown), user + context line, outcome, entry/exit, journeys index, out of scope, key decisions, status badge.
3. **1–2 Journey boards** (main path + highest-risk alternate): one subject followed, E# arrows, overlay tap rings (12 px side / 6 px vertical inset), legend box, success phone last; phones copied exactly from the States boards. Existing boards → add `STATES · ไม่ใช่ลำดับ` pill; flow board → `FLOW MAP` pill; section `title1` notes Journeys / States / Flow map.
4. **State coverage**: fill the template §3 matrix per screen; draw missing states (typical gaps found in CD-14: loading/error of sheets, permission denied, disconnected, long Thai text, smallest size, keyboard open). POS smallest = 1024×768; phone = 360×780.
5. **Action table**: real endpoints from briefs only (BRIEF-011 available; orders = BRIEF-012 planned; payment = BRIEF-013 planned; menu = menu-management brief planned); every failure reason drawn. **Check API semantics against the brief** — CD-14 had attach drawn as a 409 but BRIEF-011 returns `200 attached:true`.
6. Handoff rewritten to the template (YAML header, §0–§10, revision bump, status `review`); R# open items as sticky notes on the canvas (orange → green when accepted).
7. Brief gets a "Revisions" table if decisions changed it.
8. After Field approves: source snapshot (cd-template §6) → handoff §11 (inventory + SHA-256 verified, dependencies, repo drift D# items). PNG export optional (presentation only). Answer the standard behaviour questions (§5) in §9.

Known retrofit items per canvas:
- **CD-02 POS tables:** seat-open collision must **ask before joining** (same dialog as CD-14 J2 4b: opener/time/guest, "สั่งเข้าโต๊ะเดิม" / "เลือกโต๊ะอื่น"; uses BRIEF-011 Q3 `openedBy`/`openedVia`).
- **CD-04 POS order entry:** keeps quick add (Field 10 Oct); "ค่าบริการ" badge → tone `neutral` (CD-14 R5); add DR-010 promo states (category, greyed out-of-window, expired promo cart line = `409 ITEM_UNAVAILABLE reason out_of_window`).
- **CD-03 POS payment + CD-04:** still awaiting Field review of rev-1 content — get that review during the retrofit.
- **CD-08 staff app core:** table summary sheet gets primary "สั่งออเดอร์" (CD-14 R4).
- **CD-01:** P1 copy item still open.
