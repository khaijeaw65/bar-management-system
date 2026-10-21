# State — KJ
Updated: 2026-10-21 22:50 · Agent: Cursor
> Tracked branch snapshot, ≤ 40 lines — the only planning/progress file (workflow §2). Brief/DR/PR evidence is authoritative.

## Resume
BRIEF-027 audit **PASS** (0 Must fix; AC-6 403 deferral accepted). Work SHA `5763b38`. Next: PR, then merge when `ci` is green.

## Active
- Brief: BRIEF-027 · Stage: Audit PASS · Branch: `feat/BRIEF-027-sold-out-auto-void` · backend + contracts · auditor Cowork
- Handoff: `docs/handoffs/BRIEF-027.md` · audit: `docs/audits/BRIEF-027.md` · AC-6 403 deferred to the IAM brief
- Done 19–20 Oct: BRIEF-017 (#67) · BRIEF-024 (#66) · BRIEF-013 (#64) · Rev 21 seed-PR rule (#65)

## Next steps
1. Open the PR, then merge when `ci` is green (Field's PR, pre-approved)
2. **Decide by 25 Oct:** phone new-order (CD-14) for the 8 Nov demo — 3rd Metee brief before the 2–8 Nov freeze, or demo = web POS order + phone login/queue
3. **Week of 26 Oct (Field, 20 Oct — on hold until then):** PromptPay real-world check (PATCH real ID → QR → scan with a banking app, name + amount, no transfer — BRIEF-013 AC-12 manual half) · BRIEF-025 slip → EasySlip
4. Tunnel (ngrok static domain + https LINE callback) — before BRIEF-026 webhook

## Blockers / Coordination
- Shared files: none · Review queue: none (PASS, 2 Suggestions parked) · frontend untouched
- Setup: `app/frontend/.env.local` missing (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_API_MOCKING`)

## Carry over (executors keep unchanged — Cowork/Field edit)
- Milestones: checkpoint 25 Oct (orders API live, else cut web checkout polish — never the core slice) · gate 8 Nov (order → pay → close demo; 2–8 Nov no new features) · AWS 9–20 Nov · if ahead: bottle keep → dashboard → customer QR · LINE OA → Sem 2 · Metee ~1 mobile brief/wk (≤ 10 h), demo = phone order → POS live
- Parked: customer session CD-06 R3–R5 + CD-07 R4 (after 8 Nov) · CD-15 R4 DS StatusChip (Field edits DS) · structure review F5/F6 order read model + F7 venue↔order↔payment cycle (after 8 Nov; BRIEF-013 S3) · menu Redis cache (ex-017, after 8 Nov — Field 20 Oct)
- Field to-do: advisor heads-up AI → owner insight (DR-014) · DS `--chart-1/2` (CD-05 R2) · decide: drop web `/staff` from CLAUDE.md + `frontend.md` (open since 10 Oct) · delete branches: merged (#45, #46, #48–#52, #54–#67 + `feat/BRIEF-017-void-comp-issues` + local `docs/workflow-rev19`, `docs/rules-class-helpers`) and stale `docs/state-1018` (#53 closed), `docs/planning-1017-evening`, `docs/schema-38-tables`; optional auto-delete head branches
- Before AWS (9 Nov): BRIEF-013 S2 — BullMQ connection drops `rediss://` TLS + DB index
- Before >1 backend task: BRIEF-013 S1 — expiry job that fires early is a silent no-op → re-schedule
- Follow-ups: before a real-bar pilot → IAM brief (incl. `venue:update_payment` owner-only) + BRIEF-018 PIN on PromptPay ID change · BRIEF-011 audit S3 · BRIEF-021 S1 + auth rate limiting · BRIEF-011 S1/S4 + `FRONTEND_URL` note + old IAM names · BRIEF-015 S3/S4 · BRIEF-016 S3 · BRIEF-019 S2 · BRIEF-024 S1 (shared exception instance), S2 (table-wide `hasPending`) · stale docs: FRD §13/§15 PWA, `docs/briefs/ui/*.md` tokens · DR-005 follow-ups (protected, Field): `backend.md` Auth + CLAUDE.md Auth row "Bearer for mobile"
- Payment brief IDs (Field, 19 Oct): 013 core ✅ · 023 split · 024 PromptPay ID ✅ · 025 slip → EasySlip (CD-03 Q2 real slip) · 026 gateway + webhook (Xendit vs Omise DR; webhook URL = tunnel) · 027 sold-out auto-void (Field, 20 Oct)
- Sizing: BRIEF-013 came out ~2.2k added lines vs ~500 estimate — size module-scale briefs from that (BRIEF-013 S4)
- Design: CD-11 re-copy (R1 + R5) before the 8 Nov export · CD-02 "แจ้งโอนแล้ว" alert variant next revision · canvas index/recipe → `docs/design/README.md`
- BRIEF-018 (void/comp + PIN, after IAM): DR-016 draft text in commit `0406c18` (was `e9e8c88` before the 20 Oct rebase) · add AC: void after a completed payment (`paid > total`, BRIEF-013 S5)

## Queue
1. BRIEF-027 sold-out (audit PASS) · BRIEF-023 split equal (Q1 open)
2. IAM brief (full policy editor) · BRIEF-018 void/comp + PIN · BRIEF-025 slip (week of 26 Oct) · BRIEF-026 gateway
