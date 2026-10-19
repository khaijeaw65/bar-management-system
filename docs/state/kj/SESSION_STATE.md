# State — KJ
Updated: 2026-10-19 22:10 · Agent: Cowork (Claude)
> Tracked branch snapshot, ≤ 40 lines — the only planning/progress file (workflow §2). Brief/DR/PR evidence is authoritative.

## Resume
BRIEF-013 Draft Rev 3 — all decisions in (Q1–Q7). Waiting on Field's explicit Ready approval, then `execute BRIEF-013`.

## Active
- Brief: BRIEF-013 payments core (merge checkout) · Stage: Draft Rev 3 · Branch: `feat/BRIEF-013-payments-core` (rebased on main #60)
- Seeded 19 Oct: BRIEF-023 split equal (`feat/BRIEF-023-payment-split-equal`, Q1 open) · BRIEF-024 PromptPay ID settings (`feat/BRIEF-024-promptpay-id-settings`, Q1–Q3 open)
- Done 18 Oct: BRIEF-022 (#57) · BRIEF-021 (#56) · BRIEF-020 (#54) · BRIEF-019 (#52)

## Next steps
1. Field: approve BRIEF-013 Rev 3 → Ready → `execute BRIEF-013`
2. Field: BRIEF-024 Q1–Q3 → Ready (needed before the 8 Nov demo — real QR scan check)
3. **Decide by 25 Oct:** phone new-order (CD-14) for the 8 Nov demo — 3rd Metee brief before the 2–8 Nov freeze, or demo = web POS order + phone login/queue
4. Tunnel (ngrok static domain + https LINE callback) — before BRIEF-026 webhook

## Blockers / Coordination
- Seed branches are local only — push from the Mac (cloud session has no push access)
- Shared files: none · Review queue: none

## Carry over (executors keep unchanged — Cowork/Field edit)
- Milestones: checkpoint 25 Oct (orders API live, else cut web checkout polish — never the core slice) · gate 8 Nov (order → pay → close demo; 2–8 Nov no new features) · AWS 9–20 Nov · if ahead: bottle keep → dashboard → customer QR · LINE OA → Sem 2 · Metee ~1 mobile brief/wk (≤ 10 h), demo = phone order → POS live
- Parked: customer session CD-06 R3–R5 + CD-07 R4 (after 8 Nov) · CD-03 R3 screen review (Field, before BRIEF-013) · CD-15 R4 DS StatusChip (Field edits DS) · structure review F5/F6 order read model + F7 venue↔order cycle (after 8 Nov)
- Field to-do: advisor heads-up AI → owner insight (DR-014) · DS `--chart-1/2` (CD-05 R2) · decide: drop web `/staff` from CLAUDE.md + `frontend.md` (open since 10 Oct) · delete branches: merged (#45, #46, #48–#52, #54–#60 + local `docs/workflow-rev19`, `docs/rules-class-helpers`) and stale unmerged `docs/state-1018` (#53 closed), `docs/planning-1017-evening`, `docs/schema-38-tables` (duplicate of the 013 ERD commit); optional auto-delete head branches
- Follow-ups: before a real-bar pilot → BRIEF-011 audit S3 + IAM brief · BRIEF-021 S1 (mobile refresh accepts only mobile families) + auth rate limiting · BRIEF-011 S1/S4 + re-audit `FRONTEND_URL` note + old IAM names · BRIEF-015 audit S3/S4 · BRIEF-016 audit S3 (S2 → BRIEF-024) · BRIEF-019 audit S2 (row-reader error context) · stale docs: FRD §13/§15 PWA, `docs/briefs/ui/*.md` tokens · DR-005 follow-ups (protected, Field): `backend.md` Auth section + CLAUDE.md Auth row "Bearer for mobile"
- Payment brief IDs (Field, 19 Oct): 013 core · 023 split · 024 PromptPay ID settings · 025 slip → EasySlip (CD-03 Q2 real slip) · 026 gateway + webhook (Xendit vs Omise DR; webhook URL = tunnel domain)
- Design: CD-11 re-copy (R1 + R5) before the 8 Nov export · CD-02 "แจ้งโอนแล้ว" alert variant next revision · canvas index/recipe → `docs/design/README.md`
- BRIEF-018 (void/comp + PIN, after IAM): DR-016 draft text in commit `e9e8c88`

## Queue
1. BRIEF-013 payments core (Draft Rev 3 → Ready)
2. BRIEF-024 PromptPay ID settings
3. BRIEF-017 issue flow + sold-out (86) + menu cache (Rev 2 rebases after 013)
4. BRIEF-023 split equal
5. IAM brief (full policy editor) · BRIEF-018 void/comp + PIN · BRIEF-025 slip · BRIEF-026 gateway
