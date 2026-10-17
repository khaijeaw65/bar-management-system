# State — KJ
Updated: 2026-10-17 21:33 · Agent: Cursor
> Tracked branch snapshot, ≤ 40 lines — the only planning/progress file (workflow §2). Brief/DR/PR evidence is authoritative.

## Resume
`ตรวจ BRIEF-012` (Cowork) — Implemented on `feat/BRIEF-012-orders`. No PR until audit PASS.

## Active
- Brief: BRIEF-012 orders + station tickets · Stage: Implemented (handoff written, not audited)
- Uncommitted: none · Checks: gates green (see handoff)
- Done 17 Oct: BRIEF-009 (#34), BRIEF-007 (#35), BRIEF-015 (#41 + #43), BRIEF-011 (#45), workflow Rev 18 (#46), Rev 19 (#48), BRIEF-016 (#49)

## Next steps
1. `ตรวจ BRIEF-012` (Cowork) → PASS commit → PR · target: orders API live by checkpoint 25 Oct
2. Cowork seeds BRIEF-013 (payment + webhook) — inputs in Carry over
3. BRIEF-017 Rev 2 (issues + 86 + cache, Q1–Q3 decided) on local `feat/BRIEF-017-void-comp-issues` — rebase after BRIEF-013, then Ready
4. Cowork: CD-02 R5 → BRIEF-018, CD-15 R5 split 017/018, `/tickets` names in CD-08/15
5. Confirm PR #47 closed unmerged (superseded by #48)

## Blockers / Coordination
- none · Shared files: none · Review queue: BRIEF-012 awaiting Cowork

## Carry over (executors keep unchanged — Cowork/Field edit)
- Milestones: checkpoint 25 Oct (orders API live, else cut web checkout polish — never the core slice) · gate 8 Nov (order → pay → close demo; 2–8 Nov no new features) · AWS 9–20 Nov · if ahead: bottle keep → dashboard → customer QR · LINE OA → Sem 2 · Metee ~1 mobile brief/wk (≤ 10 h), demo = phone order → POS live
- Parked: customer session CD-06 R3–R5 + CD-07 R4 (after 8 Nov) · CD-03 R3 screen review (Field, before BRIEF-013) · CD-15 R4 DS StatusChip (Field edits DS)
- Field to-do: advisor heads-up AI → owner insight (DR-014) · DS `--chart-1/2` (CD-05 R2) · decide: drop web `/staff` from CLAUDE.md + `frontend.md` (open since 10 Oct) · delete merged branches (#45, #46, #48, #49 + local `docs/workflow-rev19`); optional auto-delete head branches
- Follow-ups: before a real-bar pilot → BRIEF-011 audit S3 + IAM brief · BRIEF-011 S1/S4 + re-audit `FRONTEND_URL` note + old IAM names · BRIEF-015 audit S3/S4 · BRIEF-016 audit S2/S3 · stale docs: FRD §13/§15 PWA, `docs/briefs/ui/*.md` tokens
- BRIEF-013 inputs: CD-03 Q2 (one real EasySlip slip), F1 columns, F2 split lock, 409 in-flight
- Design: CD-11 re-copy (R1 + R5) before the 8 Nov export · CD-02 "แจ้งโอนแล้ว" alert variant next revision · canvas index/recipe → `docs/design/README.md`
- BRIEF-018 (void/comp + PIN, after IAM): DR-016 draft text in commit `e9e8c88`

## Queue
1. BRIEF-012 orders (Implemented, awaiting audit)
2. BRIEF-013 payment + webhook
3. BRIEF-017 issue flow + sold-out (86) + menu cache
4. IAM brief (full policy editor)
5. BRIEF-018 void/comp + PIN approval
6. Web screen briefs after CDs
