# State — KJ
Updated: 2026-11-15 19:35 · Agent: Cowork (CD session 1 — CD-18 built)
> Tracked branch snapshot, ≤ 40 lines — the only planning/progress file (workflow §2). Brief/DR/PR evidence is authoritative.

## Resume
CD session 1 continues: CD-16 **approved rev 2** (15 Nov) · CD-17 **approved rev 2** · CD-18 rev 1 = **question** (R1–R7 open → answer in the purchasing brief session; canvas https://claude.ai/artifact/TFr5arFaRwatUC4rPnkgSB) → design docs pushed by CC → session 2 = CD-19 · CD-20 · CD-21 (needed by 7 Dec). CD-16 + CD-17 source snapshots before the stock brief. Advisor answers (10 Nov) first if given.
## Active
- Mode: Planning (re-scope → design) · Brief: none · Branch: `docs/dr-031-033-rescope` (fe81359, PR → merge) · BRIEF-071 merged (#123)
- Uncommitted to read on `/resume`: `docs/design/CD-18-handoff.md` · `docs/design/CD-18-purchasing.md` · notes "CD plan" rows CD-17/18 in `docs/research/2026-11-08-feature-interview-notes.md` (also uncommitted: README canvas row)
- Deck: `docs/bar_management_v5.pptx` (27 slides, screenshots in `docs/deck/screens/`, rebuild source `docs/deck/build/`; local only)
## Session checkpoint (written by `/checkpoint` — do not re-ask in next session)
- **Locked:** DR-031/032/033 Approved 8 Nov · then Field 8–9 Nov: no tiers (all 14 modules) · LINE OA + self-booking via event page in · party packages cut · staff app S2 = own module · new timeline (stock + purchasing 1 week from 30 Nov) · 15 CDs in 5 sessions × 3 (CD-16…29 + CD-00/11) — all in notes "Amendments"
- **Rejected:** LLM anywhere · LINE OA chatbot now (idea only) · deposit / min spend / auto-release · cover charge · EKS / Route 53 now · party packages
- **CD-16 (9 Nov):** D2 base unit + container ✓ · D5 recipe on menu editor per variant ✓ · pain point (R1) ✓ · R2–R7 all accepted 15 Nov → approved
- **CD-17 (15 Nov):** Q1 เปิดของใหม่ also on POS ✓ · R2–R6 accepted → approved
- **CD-18 (15 Nov):** pain point = สมมติฐาน (Field refines in the purchasing brief session)
- **Paused at:** CD session 1 done (CD-16 ✓ · CD-17 ✓ · CD-18 question) → next = session 2 (CD-19 · CD-20 · CD-21) · open: Metee takes Events web track from ~Jan? (only if he drafts specs) · checks: not run (docs / deck only)
## Next steps
1. 10 Nov advisor: K1 alcohol law · 14-module scope · ML on synthetic data → write answers into notes
2. DR-031 amendment (A1–A6 in notes) → Field OK → ship with or after `docs/dr-031-033-rescope`
3. CD sessions 1–5 (session 1 = CD-16 ✓ approved · CD-17 ✓ approved · CD-18 built, before 21 Nov) · AWS 9–20 Nov (DR-033) · FRD v2 + schema / ERD
## Blockers / Coordination
- K1 legal rules → advisor · CLAUDE.md / AGENTS.md / infra.md / DR-002 per DR-031–033 locks (protected — Field OKs diff) · BRIEF-074–077 (Metee) + `docs/audits/BRIEF-010.md` untouched

## Carry over (executors keep unchanged — Cowork/Field edit)
- Port naming (Field 1 Nov): rule = `abstract class I<Name>`; 21 ports in code are unprefixed (BRIEF-067) → cleanup brief after backend phase (rename + `domain/ports/*.port.ts` + 067 S6/S7/S9). Until then: new ports use `I<Name>` — say so in each backend brief
- Milestones: gate 8 Nov (order → pay → close) · advisor 2nd update 10 Nov · AWS 9–20 Nov (ECS split, DR-033) · exam prep 21–29 Nov · exams 3 / 4 / 8 Dec · **S1 project final exam 14 Dec** · feature freeze 15 Mar (proposed) · final Apr 2027 · build order + tiers → `docs/research/2026-11-08-feature-interview-notes.md` · Metee ~1 mobile brief/wk (≤ 10 h)
- Parked: customer session CD-06 R3–R5 + CD-07 R4 (after 8 Nov) · CD-15 R4 DS StatusChip (Field edits DS) · structure review F5/F6 order read model + F7 venue↔order↔payment cycle (after 8 Nov; BRIEF-013 S3) · menu Redis cache (ex-017, after 8 Nov — Field 20 Oct)
- Field to-do: advisor heads-up AI → owner insight (DR-014) · DS `--chart-1/2` (CD-05 R2) · decide: drop web `/staff` from CLAUDE.md + `frontend.md` (open since 10 Oct) · delete branches: merged (#45, #46, #48–#52, #54–#72 + `feat/BRIEF-017-void-comp-issues`, `feat/BRIEF-027-sold-out-auto-void`, `feat/BRIEF-028-web-login-real-api`, `feat/BRIEF-029-pos-floor-open-table`, `feat/BRIEF-030-pos-session-panel-close`, `feat/BRIEF-031-pos-order-entry` + local `docs/workflow-rev19`, `docs/rules-class-helpers`) and stale `docs/state-1018` (#53 closed), `docs/planning-1017-evening`, `docs/schema-38-tables`; optional auto-delete head branches
- Dev env isolation (Field 23 Oct — after 036–038): e2e still shares Redis with the dev backend (BullMQ payments queue steals test expiry jobs; e2e flushdb signs out dev sessions) → own Redis DB index / queue prefix for tests, together with BRIEF-013 S2 (BullMQ drops the DB index) · until then stop the dev backend before backend test:e2e · after any e2e/seed reset: re-run seed:staff with Field's LINE sub (dev DB staff is "Field (demo)" / U-demo-owner since BRIEF-036) · demo menu needs created_at ≥ 7 days for "ขายน้อย" (BRIEF-036 run proof backdated it by hand)
- Before AWS (9 Nov): BRIEF-013 S2 — BullMQ connection drops `rediss://` TLS + DB index
- Before >1 backend task: BRIEF-013 S1 — expiry job that fires early is a silent no-op → re-schedule
- Follow-ups: BRIEF-066 audit S3–S6 (raw-row boolean typing · reorder audit `from` · `auditLogService`/`notificationsService` names + unused `TableAdminService` export · sort order inside insert tx) — fix when venue admin is next touched · before a real-bar pilot → IAM brief (incl. `venue:update_payment` owner-only, `PermissionsGuard` as APP_GUARD — BRIEF-027 AC-6) · BRIEF-027 S2 (`runAsSystem` CLS helper when a 2nd system job appears) · BRIEF-028 S4 (menu "from" price → satang helper in 031) · BRIEF-029 S1 (`guestLabel` field parse) · BRIEF-030 S2 (group chip from the station ticket once charge items exist) · Sonar: add a coverage report path to `sonar-project.properties` (gate shows 0 %) + 18 pre-existing issues (setup.ts, SessionDrawer, backend order / payment / menu / seed) — cleanup brief or fix when each module is next touched (BRIEF-031) · S2 tooling: `migration:run` / `start:dev` build `@bar/contracts` first + BRIEF-018 PIN on PromptPay ID change · BRIEF-011 audit S3 · BRIEF-021 S1 + auth rate limiting · BRIEF-011 S1/S4 + `FRONTEND_URL` note + old IAM names · BRIEF-015 S3/S4 · BRIEF-016 S3 · BRIEF-019 S2 · BRIEF-024 S1 (shared exception instance), S2 (table-wide `hasPending`) · stale docs: FRD §13/§15 PWA, `docs/briefs/ui/*.md` tokens · DR-005 follow-ups (protected, Field): `backend.md` Auth + CLAUDE.md Auth row "Bearer for mobile" · BRIEF-038: `menu:write` for `?includeHidden` with IAM · DR-023 rule line "new tables with `updated_at` attach the trigger" → `backend.md` / CLAUDE.md (Field)
- Payment brief IDs (Field, 19 Oct): 013 core ✅ · 023 split · 024 PromptPay ID ✅ · 025 slip → EasySlip (CD-03 Q2 real slip) · 026 gateway + webhook (Xendit vs Omise DR; webhook URL = tunnel) · 027 sold-out auto-void ✅
- Sizing: BRIEF-013 ~2.2k vs ~500 · BRIEF-027 ~1.2k vs ~700 · BRIEF-028 ~860 vs ~500 · 036 ~1.8k · 037 ~1.5k · 038 ~1.2k — race-heavy backend ≈ 1.7×, UI ≈ 1.6× (tests ≈ 40 %) → estimates now count tests
- Design: CD-11 re-copy (R1 + R5) before the 8 Nov export · CD-02 "แจ้งโอนแล้ว" alert variant next revision · canvas index/recipe → `docs/design/README.md`
- BRIEF-018 (void/comp + PIN, after IAM): DR-016 draft text in commit `0406c18` (was `e9e8c88` before the 20 Oct rebase) · add AC: void after a completed payment (`paid > total`, BRIEF-013 S5)
- Printed bill with PromptPay QR (ใบแจ้งยอด, field visit — Field 21 Oct): print = create payment (lock); decide expiry for printed bills + re-print after new orders; QR from `qrPayload` (ESC/POS) → own CD + brief after 8 Nov
- Before AWS (9 Nov): web + API under one domain (`pos.` / `api.` via Cloudflare) — `lax` host-only cookies need same site; no `proxy.ts` gate until then (BRIEF-028 Q1) · Before a real-bar pilot: slip scan on the bar's actual tablet / phone browser over HTTPS (BRIEF-025 device check — Field 29 Oct)

## Queue
1. BRIEF-065 (Metee) → AWS (DR-033) → stock + purchasing (30 Nov) · later: BRIEF-023 split (Deferred, DR-019) · BRIEF-026 gateway · staff-app slip verify (DR-027, Metee, after BRIEF-010)
