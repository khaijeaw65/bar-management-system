# State — KJ
Updated: 2026-10-10 11:20 · Agent: Cowork (design)
> Tracked branch snapshot; brief/DR/PR evidence is authoritative.

## Resume (start here)
**Field = full reviewer mode: 0% hand-coding; agents execute every kj brief, Field reviews/approves/merges.**
**Current goal: finish ALL Semester-1 UI design before dev (build restarts 12 Oct; gate 8 Nov = order → pay → close).**
Next action: build **CD-06 customer QR order** as a new Design canvas **using `docs/design/board-convention.md`** (Journey / States / Flow map), then CD-07 → CD-15 → CD-12 → CD-13 → CD-05 → CD-11 (last). CD-09 = S2.

## Design canvases (claude.ai Artifacts, type Design, DS "The Loft Bar Design System")
| CD | Canvas | Status |
|---|---|---|
| CD-01 POS login/shell/menu | https://claude.ai/artifact/GDCe3opjPBQ7YxAZ6RwEBo | ported · Field OK |
| CD-02 POS tables + session | https://claude.ai/artifact/WEfv8fV7z1FMAu8tFSqCRG | ported · Field OK (badge + loading fixes) |
| CD-03 POS payment | https://claude.ai/artifact/1NiEZaPhKTRsKtHh4WcqZb | ported · awaiting Field review |
| CD-04 POS order entry | https://claude.ai/artifact/8xBUgRiM4ZmQoNvinbVSsz | ported · awaiting Field review |
| CD-08 staff app core | https://claude.ai/artifact/E1EzrLh3piE3esih4VyRwB | built · Field OK (R1–R5 accepted 10 Oct) |
| CD-14 staff new order | https://claude.ai/artifact/VXJCDCG4BLQrXvXMaBFPTW | Field OK 10 Oct (R1–R5 accepted · no quick add · DR-010 promo states · Journey pilot) |
Handoffs: `docs/design/CD-0#-handoff.md` (each has a "Port to Design canvas" section). DS: https://claude.ai/artifact/AXVdDV921SWCiAxGJxD78D (version 1791561405-c72e).

## How to build a canvas (proven recipe)
1. `Artifact publish type_url=https://claude.ai/artifact/QKN21svewxgyPb6SYRqWnd title="CD-## …" auto_open=after_first_write`.
2. Upload Lucide UMD as an asset on that canvas (`npm pack lucide@0.468.0` → `package/dist/umd/lucide.min.js`; scratchpad doesn't survive sessions) → `/_blob/<id>`; blobs are per canvas.
3. Write `project/canvas.json` (all boards pre-declared, 80 px row gap / 120 px between rows, `designSystems` record) + Main + shared children; publish in ONE call with DS server copies: `project/ds/theloftbardesignsystem_99bbff/{styles.css,_ds_bundle.js,tokens/{fonts,colors,typography,spacing,radius,elevation,motion,heroui,base}.css,assets/fonts/NotoSansThai-{Regular,SemiBold,Bold}.ttf}` ← `{"artifact": DS url, "path": "project/<same>"}` (DS has no tokens.json).
4. Then one board per write → publish. Don't verify/render unless Field asks.
5. Head per board: `support.js` · `ds/…/styles.css` · lucide blob · `ds/…/_ds_bundle.js`. Mount DS via `<x-import component-from-global-scope="TheLoftBarDesignSystem_99bbff.<Comp>">`. Theme: root `data-theme="{{theme}}"` + enum tweak dark/light, pass `theme="{{theme}}"` to every `dc-import`.
6. Board pattern: 40 px padding, `--bg-sunken`, h1 `--text-heading` + one-line note, frames 1280×800 side by side (gap 40): PosFrame (inset 0) + content child (left 88, top 56) + optional scrim/drawer (right 0, top 56, 400×744) + modal overlay (`--scrim` + `--blur-overlay`).
7. Add a port/handoff note to `docs/design/CD-##-handoff.md`, commit, move `.git/*.lock` aside.

## Canvas gotchas (each one cost a fix)
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
- Bundle source for prop lookups: `scratchpad/artifact-files/4d243392-…/project/_ds_bundle.js` (re-read the DS `project/_ds_bundle.js` if missing).

## Plan (to 8 Nov) — DR-008: Metee = Expo mobile, KJ = backend + web, reviews mobile
| Week | KJ | Metee (mobile, after 20:00, ~1 brief/wk ≤10 h, contracts fixtures) |
|---|---|---|
| 0 · 5–11 Oct | push branch, BRIEF-002 PR, finish UI design | merge BRIEF-002 → app shell + mocked login |
| 1 · 12–18 Oct | BRIEF-009 → BRIEF-007 auth → guard · BRIEF-008 POS shell | table list (mocks) |
| 2 · 19–25 Oct | tables/visits/orders API + WS · menu list + grid (web) | new-order flow (mocks) |
| 3 · 26 Oct–1 Nov | payment + webhook + close · drawer + checkout (web) | wire to real API + realtime |
| 4 · 2–8 Nov | integration, seed, demo — no new features | fixes; demo: phone order → POS live |
| 9–20 Nov | AWS deploy · bottle keep if time | polish |
Checkpoint 25 Oct: if orders API not live, cut web checkout polish, not the core slice. If ahead: bottle keep → dashboard → customer QR. LINE OA → Sem 2.

## Active
- Branch: `docs/ui-design-cd06` (from main @ 1e301db, after PR #26 merged 10 Oct) · not pushed yet.
- Decided 10 Oct: board convention (`docs/design/board-convention.md`) · staff app no quick add, POS keeps quick add · DR-010 promo windows.
- Decided: DR-008, DR-009, DR-005 A1 (`sid` session check), CD-03 Q1–Q3 + F1–F4, CD-04 Q1 + F1–F4, BRIEF-007 D1–D4, BRIEF-011 Q1–Q2, `payment_status += cancelled`, schema `menu_item.image_key`, `staff_access_request`.
- **Ready briefs:** BRIEF-007 auth Rev 2 (after 009) · BRIEF-008 POS shell · BRIEF-009 · BRIEF-010 mobile shell/queue (Metee) · BRIEF-011 tables + visits + realtime · `docs/rules/mobile.md`.
- **Ready design briefs:** CD-05, 06, 07, 11, 12, 13, 14, 15 (CD-10 merged into CD-11).
- **Next impl briefs (not written):** BRIEF-012 orders · BRIEF-013 payment + GB Prime Pay webhook + 409 in-flight (include CD-03 F1 columns `confirmed_via`, `status_reason`, `status_note`; F2 split locks whole bill) · IAM brief (full policy editor) · web screen briefs after CDs · Metee Week 1.
- Engineering: BRIEF-002 on `feat/BRIEF-002-expo-scaffold` (0a95185) — no PR, needs audit; blocks BRIEF-010. Done briefs: 001, 003–006.

## Field to-do (any order)
1. Open BRIEF-002 PR + auditor. (PR #26 design canvases merged 10 Oct.)
2. Review CD-03 + CD-04 canvases; CD-01 P1. DR-010 protected follow-ups: schema.sql, erd.html, CLAUDE.md 33 tables, DR-009 line.
3. Protected edits: CLAUDE.md / AGENTS.md (Metee, mobile owner, drop web `/staff`), `frontend.md` `/staff` row, Project instructions AI-split line.
4. Branch protection; delete stale remote branches (`docs/brief-006-sonar`, `docs/brief-007-auth`, `docs/ui-design-screens`, `feat/BRIEF-006-local-sonar`).
5. (done 10 Oct) stale git locks cleared; delete permission granted per session — ask once at session start.

## Blockers / Coordination
- Pending docs: erd.html (`notification`, `staff_push_token`, `payment_status.cancelled`, `visit.guest_label`, live-visit index), FRD §13.
- Stale inputs: `docs/briefs/ui/*.md` (old tokens, PWA), FRD §13/§15 PWA wording.
