# State — KJ
Updated: 2026-10-19 23:40 · Agent: Cursor
> Tracked branch snapshot, ≤ 40 lines — the only planning/progress file (workflow §2). Brief/DR/PR evidence is authoritative.

## Resume
BRIEF-024 Rev 2 **Implemented** (`5db6b52`). Next: `audit BRIEF-024` (Cowork).

## Active
- Brief: BRIEF-024 PromptPay ID settings · Stage: Implemented · Branch: `feat/BRIEF-024-promptpay-id-settings` · work `5db6b52`
- Includes main through BRIEF-013 (#64)
- Seeded 19 Oct: BRIEF-023 (`feat/BRIEF-023-payment-split-equal`, Q1 open)

## Next steps
1. `audit BRIEF-024` (Cowork)
2. **Decide by 25 Oct:** phone new-order (CD-14) for the 8 Nov demo — 3rd Metee brief before the 2–8 Nov freeze, or demo = web POS order + phone login/queue
3. Tunnel (ngrok static domain + https LINE callback) — before BRIEF-026 webhook

## Blockers / Coordination
- Shared files: none · Review queue: none (PR opens after audit PASS)
- Setup: `app/frontend/.env.local` missing (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_API_MOCKING`)

## Carry over (executors keep unchanged — Cowork/Field edit)
- Milestones: checkpoint 25 Oct (orders API live, else cut web checkout polish — never the core slice) · gate 8 Nov (order → pay → close demo; 2–8 Nov no new features) · AWS 9–20 Nov · if ahead: bottle keep → dashboard → customer QR · LINE OA → Sem 2 · Metee ~1 mobile brief/wk (≤ 10 h), demo = phone order → POS live
- Parked: customer session CD-06 R3–R5 + CD-07 R4 (after 8 Nov) · CD-03 R3 screen review (Field, before BRIEF-013) · CD-15 R4 DS StatusChip (Field edits DS) · structure review F5/F6 order read model + F7 venue↔order cycle (after 8 Nov)
- Field to-do: advisor heads-up AI → owner insight (DR-014) · DS `--chart-1/2` (CD-05 R2) · decide: drop web `/staff` from CLAUDE.md + `frontend.md` (open since 10 Oct) · delete branches: merged (#45, #46, #48–#52, #54–#60 + local `docs/workflow-rev19`, `docs/rules-class-helpers`) and stale unmerged `docs/state-1018` (#53 closed), `docs/planning-1017-evening`, `docs/schema-38-tables` (duplicate of the 013 ERD commit); optional auto-delete head branches
- Follow-ups: before a real-bar pilot → BRIEF-011 audit S3 + IAM brief · BRIEF-021 S1 (mobile refresh accepts only mobile families) + auth rate limiting · BRIEF-011 S1/S4 + re-audit `FRONTEND_URL` note + old IAM names · BRIEF-015 audit S3/S4 · BRIEF-016 audit S3 (S2 → BRIEF-024) · BRIEF-019 audit S2 (row-reader error context) · stale docs: FRD §13/§15 PWA, `docs/briefs/ui/*.md` tokens · DR-005 follow-ups (protected, Field): `backend.md` Auth section + CLAUDE.md Auth row "Bearer for mobile"
- Payment brief IDs (Field, 19 Oct): 013 core · 023 split · 024 PromptPay ID settings · 025 slip → EasySlip (CD-03 Q2 real slip) · 026 gateway + webhook (Xendit vs Omise DR; webhook URL = tunnel domain)
- Design: CD-11 re-copy (R1 + R5) before the 8 Nov export · CD-02 "แจ้งโอนแล้ว" alert variant next revision · canvas index/recipe → `docs/design/README.md`
- BRIEF-018 (void/comp + PIN, after IAM): DR-016 draft text in commit `e9e8c88`

## Queue
1. BRIEF-024 PromptPay ID settings (Implemented — audit)
2. BRIEF-017 issue flow + sold-out (86) + menu cache
3. BRIEF-023 split equal
4. IAM brief (full policy editor) · BRIEF-018 void/comp + PIN · BRIEF-025 slip · BRIEF-026 gateway
