# State — KJ
Updated: 2026-10-18 18:25 · Agent: Cursor
> Tracked branch snapshot, ≤ 40 lines — the only planning/progress file (workflow §2). Brief/DR/PR evidence is authoritative.

## Resume
BRIEF-021 is implemented on `feat/BRIEF-021-mobile-auth-backend` (`08e2a8e`). Next: Field's AC-12 phone login, then `audit BRIEF-021`.

## Active
- Brief: BRIEF-021 mobile LINE login · Stage: Implemented, AC-12 open (Rev 1)
- Branch: `feat/BRIEF-021-mobile-auth-backend` · Work SHA: `08e2a8e` · PR: none until audit PASS
- Checks: G1 on `08e2a8e` — lint / typecheck / openapi:check exit 0 · contracts 20 · unit 66 · e2e 61
- Done 18 Oct: BRIEF-020 (#54), BRIEF-019 (#52)

## Next steps
1. Field: Android LINE login over the tunnel, ending at `barapp://auth?code=…` (AC-12)
2. `audit BRIEF-021` (Cowork) after that screenshot is in the handoff
3. After BRIEF-020's docs note: Field-approved `docs/rules/backend.md` src-tree update
4. Cowork seeds BRIEF-013 · BRIEF-017 Rev 2 rebases after it

## Blockers / Coordination
- AC-12 waits on Field (phone, ngrok static domain, LINE callback). Shared files: none · Review queue: none

## Carry over (executors keep unchanged — Cowork/Field edit)
- Milestones: checkpoint 25 Oct (orders API live, else cut web checkout polish — never the core slice) · gate 8 Nov (order → pay → close demo; 2–8 Nov no new features) · AWS 9–20 Nov · if ahead: bottle keep → dashboard → customer QR · LINE OA → Sem 2 · Metee ~1 mobile brief/wk (≤ 10 h), demo = phone order → POS live
- Parked: customer session CD-06 R3–R5 + CD-07 R4 (after 8 Nov) · CD-03 R3 screen review (Field, before BRIEF-013) · CD-15 R4 DS StatusChip (Field edits DS) · structure review F5/F6 order read model + F7 venue↔order cycle (after 8 Nov)
- Field to-do: advisor heads-up AI → owner insight (DR-014) · DS `--chart-1/2` (CD-05 R2) · decide: drop web `/staff` from CLAUDE.md + `frontend.md` (open since 10 Oct) · delete merged branches (#45, #46, #48, #49, #52 + local `docs/workflow-rev19`); optional auto-delete head branches
- Follow-ups: before a real-bar pilot → BRIEF-011 audit S3 + IAM brief · BRIEF-011 S1/S4 + re-audit `FRONTEND_URL` note + old IAM names · BRIEF-015 audit S3/S4 · BRIEF-016 audit S2/S3 · stale docs: FRD §13/§15 PWA, `docs/briefs/ui/*.md` tokens
- BRIEF-013 inputs: CD-03 Q2 (one real EasySlip slip), F1 columns, F2 split lock, 409 in-flight
- Design: CD-11 re-copy (R1 + R5) before the 8 Nov export · CD-02 "แจ้งโอนแล้ว" alert variant next revision · canvas index/recipe → `docs/design/README.md`
- BRIEF-018 (void/comp + PIN, after IAM): DR-016 draft text in commit `e9e8c88`

## Queue
1. BRIEF-021 mobile auth (AC-12, then audit)
2. BRIEF-022 mobile LINE login (Metee, unblocked after 021)
3. BRIEF-013 payment + webhook
4. BRIEF-017 issue flow + sold-out + menu cache
5. IAM brief (full policy editor)
6. BRIEF-018 void/comp + PIN approval
