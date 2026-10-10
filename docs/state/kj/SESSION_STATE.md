# State — KJ
Updated: 2026-10-10 16:10 · Agent: Cowork (design) — session end
> Tracked branch snapshot; brief/DR/PR evidence is authoritative.

## Parked decisions (Field 10 Oct — "park, finish CDs first")
- Order display number per placement (BRIEF-012; Cowork: one number shared by a placement's tickets).
- CD-08 R8–R11 (summary "เสิร์ฟแล้ว" section, served Toast/no undo, API gaps list, filter rule) — drawn as proposed, orange on canvas.
- DS StatusChip label `accepted` = "กำลังเตรียม" (Field to change in the DS; canvases pass `label` meanwhile).
- CD-14: success state for a cart that splits into 2 tickets (DR-012).

## Resume (start here)
**Field = full reviewer mode: 0% hand-coding; agents execute every kj brief, Field reviews/approves/merges.**
**Current goal: finish ALL Semester-1 UI design before dev (build restarts 12 Oct; gate 8 Nov = order → pay → close).**
**Next action: retrofit CD-01, CD-02, CD-03, CD-04, CD-08 to `docs/design/cd-template.md`** (one batch, ~1 long session). Template is now **v2**: each retrofitted canvas also gets a **source snapshot** (`docs/design/source/CD-##/`, handoff §11, cd-template §6); CD-14 needs its snapshot too. Then CD-06 → CD-07 → CD-15 → CD-12 → CD-13 → CD-05 → CD-11 (last) built to the template from the start. CD-09 = S2.
Read first: `docs/design/cd-template.md` (what a CD contains) · `docs/design/board-convention.md` (how boards look) · **`docs/design/CD-14-handoff.md` = reference example (rev 3, passed pilot)** · canvas https://claude.ai/artifact/VXJCDCG4BLQrXvXMaBFPTW.
Session start: ask Field once for delete permission on the project folder (git locks), `git status`, branch **`docs/ui-retrofit`** (from main @ ed1ef8a, after PR #30).

## Retrofit checklist (per canvas, from cd-template.md)
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

## Design canvases (claude.ai Artifacts, type Design, DS "The Loft Bar Design System")
| CD | Canvas | Status |
|---|---|---|
| CD-01 POS login/shell/menu | https://claude.ai/artifact/GDCe3opjPBQ7YxAZ6RwEBo | Field OK (rev 1) · retrofit pending |
| CD-02 POS tables + session | https://claude.ai/artifact/WEfv8fV7z1FMAu8tFSqCRG | Field OK (rev 1) · retrofit pending (+ join confirm) |
| CD-03 POS payment | https://claude.ai/artifact/1NiEZaPhKTRsKtHh4WcqZb | awaiting Field review · retrofit pending |
| CD-04 POS order entry | https://claude.ai/artifact/8xBUgRiM4ZmQoNvinbVSsz | awaiting Field review · retrofit pending (+ promo, badge) |
| CD-08 staff app core | https://claude.ai/artifact/E1EzrLh3piE3esih4VyRwB | Field OK (R1–R5) · retrofit pending (+ สั่งออเดอร์) |
| CD-14 staff new order | https://claude.ai/artifact/VXJCDCG4BLQrXvXMaBFPTW | **rev 3 approved 10 Oct — template reference** (images in docs/design/assets/CD-14/) |
Handoffs: `docs/design/CD-##-handoff.md`. DS: https://claude.ai/artifact/AXVdDV921SWCiAxGJxD78D (version 1791561405-c72e). CD-14 Lucide blob `/_blob/55621ac7d8cfe40fb69092b2ed520365` (CD-14 only).

## How to build a canvas (proven recipe)
1. `Artifact publish type_url=https://claude.ai/artifact/QKN21svewxgyPb6SYRqWnd title="CD-## …" auto_open=after_first_write`.
2. Upload Lucide UMD as an asset on that canvas (`npm pack lucide@0.468.0` → `package/dist/umd/lucide.min.js`; scratchpad doesn't survive sessions) → `/_blob/<id>`; blobs are per canvas.
3. Write `project/canvas.json` (all boards pre-declared, 80 px row gap / 120 px between rows, `designSystems` record) + Main + shared children; publish in ONE call with DS server copies: `project/ds/theloftbardesignsystem_99bbff/{styles.css,_ds_bundle.js,tokens/{fonts,colors,typography,spacing,radius,elevation,motion,heroui,base}.css,assets/fonts/NotoSansThai-{Regular,SemiBold,Bold}.ttf}` ← `{"artifact": DS url, "path": "project/<same>"}` (DS has no tokens.json).
4. Then one board per write → publish. Don't verify/render unless Field asks.
5. Head per board: `support.js` · `ds/…/styles.css` · lucide blob · `ds/…/_ds_bundle.js`. Mount DS via `<x-import component-from-global-scope="TheLoftBarDesignSystem_99bbff.<Comp>">`. Theme: root `data-theme="{{theme}}"` + enum tweak dark/light, pass `theme="{{theme}}"` to every `dc-import`.
6. Board pattern (phone boards: see CD-14 — 390×844 frames, radius 36, gap 40; Journey arrows 136 px wide, margin-top 440): 40 px padding, `--bg-sunken`, h1 `--text-heading` + one-line note, frames 1280×800 side by side (gap 40): PosFrame (inset 0) + content child (left 88, top 56) + optional scrim/drawer (right 0, top 56, 400×744) + modal overlay (`--scrim` + `--blur-overlay`).
7. Write/refresh `docs/design/CD-##-handoff.md` to the template, commit (with delete permission granted, git cleans its own locks).

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
- Bundle source for prop lookups: `read` any canvas's `project/ds/theloftbardesignsystem_99bbff/_ds_bundle.js` (scratchpad does not survive sessions); grep `function <Comp>(` for props.
- Row tap ring = overlay span (`left/right -12px, top/bottom 6px`, 2.5 px accent border, radius 12) — not `outline` on the full row.
- Never write to `docs/rules/**` (protected — even new files). Exception (Field 10 Oct): Cowork/Codex may edit `docs/schema.sql`, `docs/erd.html`, `CLAUDE.md`, `AGENTS.md` with Field's explicit OK on the exact change; trailer `Approved-by: Field (session)`. Validate schema changes by running the whole file on a throwaway Postgres (binaries are in the cloud container: /usr/lib/postgresql/*/bin, run as user postgres in /var/tmp).

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
- Branch: **`docs/ui-retrofit`** from main @ `ed1ef8a` — holds only this state commit. `docs/ui-design-cd06` merged as **PR #30** (CD-14 rev 3, cd-template v2, POC example + BRIEF-900, BRIEF-014 rev 2, schema/erd 34 tables, agent-boundaries update, DR-009/010) — delete it.
- **main now has:** v2 tokens + Noto Sans Thai (BRIEF-008), DS type/radius/tracking/motion utilities + no-arbitrary-px lint (BRIEF-014, PR #29), frontend.md Styling rule, agent-boundaries with Field-approved edits + `docs/design/source/**` protection.
- Decided 10 Oct: CD template v1 (`docs/design/cd-template.md`, Cowork + Codex review) · CD-14 rev 3 approved (R6 cart in memory · R7 permission UI · R8 pain point = paper/verbal orders · R9 opener on visit) · seat-open collision asks before joining (CD-14 J2; apply to CD-02 POS in retrofit; BRIEF-011 Q3 added: `visit.opened_by` + `opened_via`) · board convention (`docs/design/board-convention.md`) · staff app no quick add, POS keeps quick add · DR-010 promo windows.
- Decided: DR-008, DR-009, DR-005 A1 (`sid` session check), CD-03 Q1–Q3 + F1–F4, CD-04 Q1 + F1–F4, BRIEF-007 D1–D4, BRIEF-011 Q1–Q2, `payment_status += cancelled`, schema `menu_item.image_key`, `staff_access_request`.
- **Ready briefs:** BRIEF-007 auth Rev 2 (after 009) · BRIEF-008 POS shell · BRIEF-009 · BRIEF-010 mobile shell/queue (Metee) · BRIEF-011 tables + visits + realtime · `docs/rules/mobile.md`.
- **Ready design briefs:** CD-05, 06, 07, 11, 12, 13, 14, 15 (CD-10 merged into CD-11).
- **Next impl briefs (not written):** BRIEF-012 orders (see DR-012 inputs below) · BRIEF-013 payment + GB Prime Pay webhook + 409 in-flight (include CD-03 F1 columns `confirmed_via`, `status_reason`, `status_note`; F2 split locks whole bill) · IAM brief (full policy editor) · web screen briefs after CDs · Metee Week 1.
- **DR-013 Pending (parked 10 Oct): order → ticket model, setting-based split, order number, issue/served/cancel columns — decide before writing BRIEF-012; overrides parts of the DR-012 inputs below.**
- **BRIEF-012 inputs from DR-012 (approved 10 Oct, before the gate):** status per order ticket, no per-item progress (`order_item.status` uses only `pending` / `cancelled`) · placement split by `menu_item.kitchen_tag` (`bar` | `food`, `both` dropped) → one `order_record` per station + shared `placement_id` · charge items → own ticket created `sent` · always split, no venue setting · `order_status += cancelled`, auto-set when every item on a ticket is cancelled · counter seats `accepted → sent` (DR-011) · label `accepted` = "กำลังเตรียม" · customer view = ticket steps + cancelled items struck · `POST /visits/:visitId/orders` returns all tickets of the placement (one Idempotency-Key per placement) · fix contracts drift: `app/packages/contracts/src/enums.ts` OrderStatus is CONFIRMED/PREPARING/SERVED, schema is pending/accepted/ready/sent/issue(+cancelled) · schema.sql + erd.html DR-012 diff approved by Field 10 Oct (option A, no number column) · **open: order display number** — `order_record` has no `number` column but cards show "#0041" (BRIEF-010 `number`); Cowork recommends one number per placement shared by its tickets ("#0041 · บาร์ / ครัว") → decide in BRIEF-012 (schema change).
- Engineering: BRIEF-002 on `feat/BRIEF-002-expo-scaffold` (0a95185) — no PR, needs audit; blocks BRIEF-010. Done briefs: 001, 003–006, 008, 014.

- **POC passed (10 Oct):** approved canvas → byte-copied source snapshot → Cursor implemented `/poc/menu` with no screenshots (BRIEF-900, PR #28 closed unmerged, kept as worked example in `docs/design/poc-source-handoff/`). Findings → cd-template v2 + **BRIEF-014 (merged PR #29)** (DS type/radius/tracking/motion as Tailwind utilities + lint gate against arbitrary px). Vault: `02 Learning/Design to Implement Pipeline.md`.

## Field to-do (any order)
0. (done 10 Oct) BRIEF-014 merged (PR #29) + frontend.md Styling line added by Field.
1. Open BRIEF-002 PR + auditor. (PR #26 design canvases merged 10 Oct.)
2. Review CD-03 + CD-04 content during the retrofit; CD-01 P1. (done 10 Oct: schema.sql DR-010 + BRIEF-011 Q3, erd.html synced incl. staff_access_request, CLAUDE.md 34 tables — Cowork Field-approved edits.) DR-009 line refined to DR-010. CD-14 images exported 10 Oct → docs/design/assets/CD-14/.
3. Protected edits: CLAUDE.md / AGENTS.md (Metee, mobile owner, drop web `/staff`), `frontend.md` `/staff` row, Project instructions AI-split line.
4. Branch protection; delete stale remote branches (`docs/brief-006-sonar`, `docs/brief-007-auth`, `docs/ui-design-screens`, `feat/BRIEF-006-local-sonar`).
5. (done 10 Oct) stale git locks cleared; delete permission granted per session — ask once at session start.
6. Delete merged branches: `docs/ui-design-cd06` (remote + local), `feat/BRIEF-014-design-tokens-tailwind` if still local.

## Blockers / Coordination
- Pending docs: FRD §13. (erd.html synced to 34 tables 10 Oct.)
- Stale inputs: `docs/briefs/ui/*.md` (old tokens, PWA), FRD §13/§15 PWA wording.
