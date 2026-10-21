# State — KJ
Updated: 2026-10-22 00:15 · Agent: Cursor
> Tracked branch snapshot, ≤ 40 lines — the only planning/progress file (workflow §2). Brief/DR/PR evidence is authoritative.

## Resume
BRIEF-030 session panel + close **Implemented**, awaiting audit. Next: `audit BRIEF-030`.

## Active
- Brief: BRIEF-030 · Stage: Implemented · Branch: `feat/BRIEF-030-pos-session-panel-close` · SHA `11569c2` · Handoff `docs/handoffs/BRIEF-030.md`
- Done 21 Oct: BRIEF-029 (#70) · BRIEF-028 (#69) · BRIEF-027 (#68) · earlier: 017 (#67) · 024 (#66) · 013 (#64)
- Drafts in checkout (decided, seed as deps merge): 031 → 033 → 032 · BRIEF-023 Q1 open

## Next steps
1. `audit BRIEF-030` → then 031 → 033 · 032 if time · Sun night: full demo run + re-plan 26 Oct–2 Nov
2. PASS commit lands on the branch **before** any conflict resolve / merge (#69 lesson)
3. **Decide by 25 Oct:** CD-14 phone new-order — leaning web POS order + phone queue (BRIEF-010, Metee)
4. **Week of 26 Oct:** PromptPay bank scan (BRIEF-013 AC-12 manual half) · BRIEF-025 EasySlip · 10 Nov: order → pay → close on the web POS

## Blockers / Coordination
- Shared files: none · Review queue: Cowork — `audit BRIEF-030`
- Local DB: C1 (เจ, no order) and C2 (เจ, 2× ช้างดราฟต์) left open by this proof; T5 (ต้น) and T6 (แพร) still open from 029. `NEXT_PUBLIC_API_MOCKING` missing from frontend `.env.local`

## Carry over (executors keep unchanged — Cowork/Field edit)
- Milestones: checkpoint 25 Oct (orders API live, else cut web checkout polish — never the core slice) · gate 8 Nov (order → pay → close demo; 2–8 Nov no new features) · AWS 9–20 Nov · if ahead: bottle keep → dashboard → customer QR · LINE OA → Sem 2 · Metee ~1 mobile brief/wk (≤ 10 h), demo = phone order → POS live
- Parked: customer session CD-06 R3–R5 + CD-07 R4 (after 8 Nov) · CD-15 R4 DS StatusChip (Field edits DS) · structure review F5/F6 order read model + F7 venue↔order↔payment cycle (after 8 Nov; BRIEF-013 S3) · menu Redis cache (ex-017, after 8 Nov — Field 20 Oct)
- Field to-do: advisor heads-up AI → owner insight (DR-014) · DS `--chart-1/2` (CD-05 R2) · decide: drop web `/staff` from CLAUDE.md + `frontend.md` (open since 10 Oct) · delete branches: merged (#45, #46, #48–#52, #54–#70 + `feat/BRIEF-017-void-comp-issues`, `feat/BRIEF-027-sold-out-auto-void`, `feat/BRIEF-028-web-login-real-api`, `feat/BRIEF-029-pos-floor-open-table` + local `docs/workflow-rev19`, `docs/rules-class-helpers`) and stale `docs/state-1018` (#53 closed), `docs/planning-1017-evening`, `docs/schema-38-tables`; optional auto-delete head branches
- Before AWS (9 Nov): BRIEF-013 S2 — BullMQ connection drops `rediss://` TLS + DB index
- Before >1 backend task: BRIEF-013 S1 — expiry job that fires early is a silent no-op → re-schedule
- Follow-ups: before a real-bar pilot → IAM brief (incl. `venue:update_payment` owner-only, `PermissionsGuard` as APP_GUARD — BRIEF-027 AC-6) · BRIEF-027 S2 (`runAsSystem` CLS helper when a 2nd system job appears) · BRIEF-028 S4 (menu "from" price → satang helper in 031) · BRIEF-029 S1 (`guestLabel` field parse) · S2 tooling: `migration:run` / `start:dev` build `@bar/contracts` first + BRIEF-018 PIN on PromptPay ID change · BRIEF-011 audit S3 · BRIEF-021 S1 + auth rate limiting · BRIEF-011 S1/S4 + `FRONTEND_URL` note + old IAM names · BRIEF-015 S3/S4 · BRIEF-016 S3 · BRIEF-019 S2 · BRIEF-024 S1 (shared exception instance), S2 (table-wide `hasPending`) · stale docs: FRD §13/§15 PWA, `docs/briefs/ui/*.md` tokens · DR-005 follow-ups (protected, Field): `backend.md` Auth + CLAUDE.md Auth row "Bearer for mobile"
- Payment brief IDs (Field, 19 Oct): 013 core ✅ · 023 split · 024 PromptPay ID ✅ · 025 slip → EasySlip (CD-03 Q2 real slip) · 026 gateway + webhook (Xendit vs Omise DR; webhook URL = tunnel) · 027 sold-out auto-void ✅
- Sizing: BRIEF-013 ~2.2k vs ~500 · BRIEF-027 ~1.2k vs ~700 · BRIEF-028 ~860 vs ~500 — race-heavy backend ≈ 1.7×, UI ≈ 1.6× (tests ≈ 40 %)
- Design: CD-11 re-copy (R1 + R5) before the 8 Nov export · CD-02 "แจ้งโอนแล้ว" alert variant next revision · canvas index/recipe → `docs/design/README.md`
- BRIEF-018 (void/comp + PIN, after IAM): DR-016 draft text in commit `0406c18` (was `e9e8c88` before the 20 Oct rebase) · add AC: void after a completed payment (`paid > total`, BRIEF-013 S5)
- Printed bill with PromptPay QR (ใบแจ้งยอด, field visit — Field 21 Oct): print = create payment (lock); decide expiry for printed bills + re-print after new orders; QR from `qrPayload` (ESC/POS) → own CD + brief after 8 Nov
- Before AWS (9 Nov): web + API under one domain (`pos.` / `api.` via Cloudflare) — `lax` host-only cookies need same site; no `proxy.ts` gate until then (BRIEF-028 Q1)

## Queue
1. BRIEF-030 (Implemented, awaiting audit) · 031 → 033 → 032 (Drafts, untracked)
2. BRIEF-023 split equal (Q1 open) · IAM brief · BRIEF-018 void/comp + PIN · BRIEF-025 slip (week of 26 Oct) · BRIEF-026 gateway
