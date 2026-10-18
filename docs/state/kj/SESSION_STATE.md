# State — KJ
Updated: 2026-10-18 12:50 · Agent: Cursor
> Tracked branch snapshot, ≤ 40 lines — the only planning/progress file (workflow §2). Brief/DR/PR evidence is authoritative.

## Resume
BRIEF-020 Implemented on `feat/BRIEF-020-backend-structure-cleanup`. Next: `audit BRIEF-020` (Cowork). Work SHA `bcf1359`. No PR until PASS.

## Active
- Brief: BRIEF-020 backend structure cleanup · Stage: Implemented (Rev 1)
- Branch: `feat/BRIEF-020-backend-structure-cleanup` · Work SHA: `bcf1359` · PR: after audit PASS
- Checks: G1 on `bcf1359` — lint / typecheck / openapi:check exit 0 · unit 62 · e2e 53
- Done 18 Oct: BRIEF-019 (#52) · Done 17 Oct: BRIEF-009 (#34), BRIEF-007 (#35), BRIEF-015 (#41 + #43), BRIEF-011 (#45), workflow Rev 18 (#46), Rev 19 (#48), BRIEF-016 (#49), BRIEF-012 (#50)

## Next steps
1. Cowork: `audit BRIEF-020` on work SHA `bcf1359`
2. After PASS: open the PR · merge when `ci` is green (Field's own PR, pre-approved)
3. After merge: Field-approved `docs/rules/backend.md` src-tree update (docs branch) — BRIEF-020 Open items
4. Cowork seeds BRIEF-013 — inputs in Carry over
5. BRIEF-017 Rev 2 on local `feat/BRIEF-017-void-comp-issues` — rebase after BRIEF-013, then Ready

## Blockers / Coordination
- none · Shared files: none · Review queue: none

## Carry over (executors keep unchanged — Cowork/Field edit)
- Milestones: checkpoint 25 Oct (orders API live, else cut web checkout polish — never the core slice) · gate 8 Nov (order → pay → close demo; 2–8 Nov no new features) · AWS 9–20 Nov · if ahead: bottle keep → dashboard → customer QR · LINE OA → Sem 2 · Metee ~1 mobile brief/wk (≤ 10 h), demo = phone order → POS live
- Parked: customer session CD-06 R3–R5 + CD-07 R4 (after 8 Nov) · CD-03 R3 screen review (Field, before BRIEF-013) · CD-15 R4 DS StatusChip (Field edits DS) · structure review F5/F6 order read model + F7 venue↔order cycle (after 8 Nov)
- Field to-do: advisor heads-up AI → owner insight (DR-014) · DS `--chart-1/2` (CD-05 R2) · decide: drop web `/staff` from CLAUDE.md + `frontend.md` (open since 10 Oct) · delete merged branches (#45, #46, #48, #49, #52 + local `docs/workflow-rev19`); optional auto-delete head branches
- Follow-ups: before a real-bar pilot → BRIEF-011 audit S3 + IAM brief · BRIEF-011 S1/S4 + re-audit `FRONTEND_URL` note + old IAM names · BRIEF-015 audit S3/S4 · BRIEF-016 audit S2/S3 · stale docs: FRD §13/§15 PWA, `docs/briefs/ui/*.md` tokens
- BRIEF-013 inputs: CD-03 Q2 (one real EasySlip slip), F1 columns, F2 split lock, 409 in-flight
- Design: CD-11 re-copy (R1 + R5) before the 8 Nov export · CD-02 "แจ้งโอนแล้ว" alert variant next revision · canvas index/recipe → `docs/design/README.md`
- BRIEF-018 (void/comp + PIN, after IAM): DR-016 draft text in commit `e9e8c88`

## Queue
1. BRIEF-020 backend structure cleanup (Implemented, audit next)
2. BRIEF-013 payment + webhook
3. BRIEF-017 issue flow + sold-out (86) + menu cache
4. IAM brief (full policy editor)
5. BRIEF-018 void/comp + PIN approval
6. Web screen briefs after CDs
