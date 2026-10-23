# State — KJ
Updated: 2026-10-23 · Agent: Cowork (BRIEF-039 seed)
> Tracked branch snapshot, ≤ 40 lines — the only planning/progress file (workflow §2). Brief/DR/PR evidence is authoritative.

## Resume
BRIEF-039 **Draft** (menu photos, DR-020 + BRIEF-038 audit F3) on `feat/BRIEF-039-menu-photos-api` → Field review (Q1: modifier CRUD → BRIEF-044) → Ready → `execute BRIEF-039`. Also seeded (Draft, local): BRIEF-042 name snapshot + DR-022, BRIEF-043 DB `updated_at` trigger + DR-023 — both DRs Pending.

## Active
- Brief: BRIEF-039 Rev 1 · Stage: Draft · Branch: `feat/BRIEF-039-menu-photos-api` (seed)
- Done 21–23 Oct: BRIEF-038 (#80) · 037 (#79) · 036 (#78) · 035 (#77) · 034 (#76) · 032 (#75) · DR-019 (#74) · 033 (#73) · 031 (#72) · 030 (#71) · 029 (#70) · 028 (#69) · 027 (#68)

## Next steps
1. Field: review BRIEF-039 Q1 · approve DR-022 / DR-023 · review BRIEF-042 / 043 → Ready (each on its own seed branch)
2. Before 8 Nov (Field 23 Oct): 039 → 042 (DR-022) → 043 (DR-023) → 044 modifier CRUD → menu UI 040 (rename confirm + listen `menu.changed`) / 041 photo UI; Mon afternoon update
3. **Decide by 25 Oct:** CD-14 phone new-order — ClickUp plan has it in S6 (9–22 Nov, Metee); record when Field confirms · BRIEF-010 → `/tickets` mismatch left for Metee's revision (Field 22 Oct)
4. **Week of 26 Oct:** PromptPay bank scan (BRIEF-013 AC-12 manual half) · BRIEF-025 EasySlip

## Blockers / Coordination
- Shared files: none · Review queue: none · 039 run proof uses the dev bucket keys already in `app/backend/.env` (`AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET`) · if `ci` hits frontend timeouts → re-run once (038 audit F4)
- e2e now on `bar_test`; **stop the dev backend before `test:e2e`** (shared BullMQ queue — 036 handoff Limitations); frontend e2e needs no other `next dev` in `app/frontend`; frontend unit tests time out under heavy machine load (038 handoff)
- Local DB `bar`: demo history 22 Sep–22 Oct · staff `Field (demo)` + `Field` (LINE) · T1 open: ฿240 paid + 3 × จินโทนิค (180/200/200), remaining ฿580 · SonarQube 9000

## Carry over (executors keep unchanged — Cowork/Field edit)
- Milestones: checkpoint 25 Oct (orders API live, else cut web checkout polish — never the core slice) · gate 8 Nov (order → pay → close demo; freeze dropped — Field 22 Oct) · AWS 9–20 Nov · if ahead: bottle keep → dashboard → customer QR · LINE OA → Sem 2 · Metee ~1 mobile brief/wk (≤ 10 h), demo = phone order → POS live
- Parked: customer session CD-06 R3–R5 + CD-07 R4 (after 8 Nov) · CD-15 R4 DS StatusChip (Field edits DS) · structure review F5/F6 order read model + F7 venue↔order↔payment cycle (after 8 Nov; BRIEF-013 S3) · menu Redis cache (ex-017, after 8 Nov — Field 20 Oct)
- Field to-do: advisor heads-up AI → owner insight (DR-014) · DS `--chart-1/2` (CD-05 R2) · decide: drop web `/staff` from CLAUDE.md + `frontend.md` (open since 10 Oct) · delete branches: merged (#45, #46, #48–#52, #54–#72 + `feat/BRIEF-017-void-comp-issues`, `feat/BRIEF-027-sold-out-auto-void`, `feat/BRIEF-028-web-login-real-api`, `feat/BRIEF-029-pos-floor-open-table`, `feat/BRIEF-030-pos-session-panel-close`, `feat/BRIEF-031-pos-order-entry` + local `docs/workflow-rev19`, `docs/rules-class-helpers`) and stale `docs/state-1018` (#53 closed), `docs/planning-1017-evening`, `docs/schema-38-tables`; optional auto-delete head branches
- Dev env isolation (Field 23 Oct — after 036–038): e2e still shares Redis with the dev backend (BullMQ payments queue steals test expiry jobs; e2e flushdb signs out dev sessions) → own Redis DB index / queue prefix for tests, together with BRIEF-013 S2 (BullMQ drops the DB index) · until then stop the dev backend before backend test:e2e · after any e2e/seed reset: re-run seed:staff with Field's LINE sub (dev DB staff is "Field (demo)" / U-demo-owner since BRIEF-036) · demo menu needs created_at ≥ 7 days for "ขายน้อย" (BRIEF-036 run proof backdated it by hand)
- Before AWS (9 Nov): BRIEF-013 S2 — BullMQ connection drops `rediss://` TLS + DB index
- Before >1 backend task: BRIEF-013 S1 — expiry job that fires early is a silent no-op → re-schedule
- Follow-ups: before a real-bar pilot → IAM brief (incl. `venue:update_payment` owner-only, `PermissionsGuard` as APP_GUARD — BRIEF-027 AC-6) · BRIEF-027 S2 (`runAsSystem` CLS helper when a 2nd system job appears) · BRIEF-028 S4 (menu "from" price → satang helper in 031) · BRIEF-029 S1 (`guestLabel` field parse) · BRIEF-030 S2 (group chip from the station ticket once charge items exist) · Sonar: add a coverage report path to `sonar-project.properties` (gate shows 0 %) + 18 pre-existing issues (setup.ts, SessionDrawer, backend order / payment / menu / seed) — cleanup brief or fix when each module is next touched (BRIEF-031) · S2 tooling: `migration:run` / `start:dev` build `@bar/contracts` first + BRIEF-018 PIN on PromptPay ID change · BRIEF-011 audit S3 · BRIEF-021 S1 + auth rate limiting · BRIEF-011 S1/S4 + `FRONTEND_URL` note + old IAM names · BRIEF-015 S3/S4 · BRIEF-016 S3 · BRIEF-019 S2 · BRIEF-024 S1 (shared exception instance), S2 (table-wide `hasPending`) · stale docs: FRD §13/§15 PWA, `docs/briefs/ui/*.md` tokens · DR-005 follow-ups (protected, Field): `backend.md` Auth + CLAUDE.md Auth row "Bearer for mobile" · BRIEF-038: `menu:write` for `?includeHidden` with IAM · `docs/erd.html` after 042 / 043 (Cowork, Field-approved) · DR-023 rule line "new tables with `updated_at` attach the trigger" → `backend.md` / CLAUDE.md (Field)
- Payment brief IDs (Field, 19 Oct): 013 core ✅ · 023 split · 024 PromptPay ID ✅ · 025 slip → EasySlip (CD-03 Q2 real slip) · 026 gateway + webhook (Xendit vs Omise DR; webhook URL = tunnel) · 027 sold-out auto-void ✅
- Sizing: BRIEF-013 ~2.2k vs ~500 · BRIEF-027 ~1.2k vs ~700 · BRIEF-028 ~860 vs ~500 · 036 ~1.8k · 037 ~1.5k · 038 ~1.2k — race-heavy backend ≈ 1.7×, UI ≈ 1.6× (tests ≈ 40 %) → estimates now count tests
- Design: CD-11 re-copy (R1 + R5) before the 8 Nov export · CD-02 "แจ้งโอนแล้ว" alert variant next revision · canvas index/recipe → `docs/design/README.md`
- BRIEF-018 (void/comp + PIN, after IAM): DR-016 draft text in commit `0406c18` (was `e9e8c88` before the 20 Oct rebase) · add AC: void after a completed payment (`paid > total`, BRIEF-013 S5)
- Printed bill with PromptPay QR (ใบแจ้งยอด, field visit — Field 21 Oct): print = create payment (lock); decide expiry for printed bills + re-print after new orders; QR from `qrPayload` (ESC/POS) → own CD + brief after 8 Nov
- Before AWS (9 Nov): web + API under one domain (`pos.` / `api.` via Cloudflare) — `lax` host-only cookies need same site; no `proxy.ts` gate until then (BRIEF-028 Q1)

## Queue
1. BRIEF-039 (Draft) → 042 → 043 → 044 modifier CRUD → menu UI 040 / 041
2. BRIEF-023 split equal (Deferred, DR-019) · IAM brief · BRIEF-018 void/comp + PIN · BRIEF-025 slip (week of 26 Oct) · BRIEF-026 gateway
