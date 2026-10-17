# State — KJ
Updated: 2026-10-17 21:05 · Agent: Cursor
> Tracked branch snapshot, ≤ 40 lines — the only planning/progress file (workflow §2). Brief/DR/PR evidence is authoritative.

## Resume
BRIEF-016 Implemented on `feat/BRIEF-016-venue-menu-read`. Next: `ตรวจ BRIEF-016` (Cowork). No PR until PASS.

## Active
- Brief: BRIEF-016 venue + menu read · Stage: Implemented (Rev 2)
- Branch: `feat/BRIEF-016-venue-menu-read` · Work SHA: `7be2120` · PR: none yet
- Checks: G1 green — contracts 13, backend unit 48, e2e 38, lint / typecheck / build / openapi:check exit 0
- Next brief: BRIEF-012 Draft Rev 3 (local `feat/BRIEF-012-orders`) waits for Ready and this merge

## Next steps
1. Cowork `ตรวจ BRIEF-016` on work SHA `7be2120`
2. After PASS: one docs commit (audit + handoff + state), then open the PR
3. Field approves BRIEF-012 Rev 3 Ready → `ทำ BRIEF-012`

## Blockers / Coordination
- none · BRIEF-012 builds on BRIEF-016 · Shared files: none · Review queue: none

## Carry over (executors keep unchanged — Cowork/Field edit)
- Milestones: checkpoint 25 Oct (orders API live, else cut web checkout polish — never the core slice) · gate 8 Nov (order → pay → close demo; 2–8 Nov no new features) · AWS 9–20 Nov · if ahead: bottle keep → dashboard → customer QR · LINE OA → Sem 2 · Metee ~1 mobile brief/wk (≤ 10 h), demo = phone order → POS live
- Parked: customer session CD-06 R3–R5 + CD-07 R4 (after 8 Nov) · CD-03 R3 screen review (Field, before BRIEF-013) · CD-15 R4 DS StatusChip (Field edits DS)
- Field to-do: advisor heads-up AI → owner insight (DR-014) · DS `--chart-1/2` (CD-05 R2) · decide: drop web `/staff` from CLAUDE.md + `frontend.md` (open since 10 Oct) · delete merged branches (#45, #46, #48 + local `docs/workflow-rev19`); optional auto-delete head branches
- Follow-ups: before a real-bar pilot → BRIEF-011 audit S3 + IAM brief · BRIEF-011 S1/S4 + re-audit `FRONTEND_URL` note + old IAM names · BRIEF-015 audit S3/S4 · stale docs: FRD §13/§15 PWA, `docs/briefs/ui/*.md` tokens
- BRIEF-013 inputs: CD-03 Q2 (one real EasySlip slip), F1 columns, F2 split lock, 409 in-flight
- Design: CD-11 re-copy (R1 + R5) before the 8 Nov export · CD-02 "แจ้งโอนแล้ว" alert variant next revision · canvas index/recipe → `docs/design/README.md`

## Queue
1. BRIEF-016 venue settings + menu read
2. BRIEF-012 orders
3. BRIEF-017 void/comp + PIN + issue flow
4. BRIEF-013 payment + webhook
5. IAM brief (full policy editor)
6. Web screen briefs after CDs
