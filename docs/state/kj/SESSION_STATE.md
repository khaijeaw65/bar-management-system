# State — KJ
Updated: 2026-10-17 20:40 · Agent: Cowork
> Tracked branch snapshot, ≤ 40 lines — the only planning/progress file (workflow §2). Brief/DR/PR evidence is authoritative.

## Resume
Field reviews BRIEF-012 Draft Rev 1 and decides Q1–Q5 (Q1 blocks Ready: menu + venue tables don't exist yet).

## Active
- Brief: BRIEF-012 orders · Stage: Draft (seed on `feat/BRIEF-012-orders`, local, not pushed)
- Uncommitted: none · Checks: docs only
- Done 17 Oct: BRIEF-009 (#34), BRIEF-007 (#35), BRIEF-015 (#41 + #43), BRIEF-011 (#45), workflow Rev 18 (#46), Rev 19 (#48)

## Next steps
1. Field decides BRIEF-012 Q1–Q5. Q1 = A → Cowork seeds BRIEF-016 (venue settings + menu read + seed, ~1.5 d) first
2. Field approves Ready → `ทำ BRIEF-016` then `ทำ BRIEF-012` (Cursor) → `ตรวจ` → PR after PASS
3. Q2 = yes → Cowork drafts BRIEF-017 (void/comp + PIN, issue/resolve, auto-cancelled, sold-out auto-cancel)
4. Confirm PR #47 closed unmerged (superseded by #48)

## Blockers / Coordination
- BRIEF-012 Ready blocked on Q1 · Shared files: none · Review queue: none

## Carry over (executors keep unchanged — Cowork/Field edit)
- Milestones: checkpoint 25 Oct (orders API live, else cut web checkout polish — never the core slice) · gate 8 Nov (order → pay → close demo; 2–8 Nov no new features) · AWS 9–20 Nov · if ahead: bottle keep → dashboard → customer QR · LINE OA → Sem 2 · Metee ~1 mobile brief/wk (≤ 10 h), demo = phone order → POS live
- Parked: customer session CD-06 R3–R5 + CD-07 R4 (after 8 Nov) · CD-03 R3 screen review (Field, before BRIEF-013) · CD-15 R4 DS StatusChip (Field edits DS)
- Field to-do: advisor heads-up AI → owner insight (DR-014) · DS `--chart-1/2` (CD-05 R2) · decide: drop web `/staff` from CLAUDE.md + `frontend.md` (open since 10 Oct) · delete merged branches (#45, #46, #48 + local `docs/workflow-rev19`); optional auto-delete head branches
- Follow-ups: before a real-bar pilot → BRIEF-011 audit S3 + IAM brief · BRIEF-011 S1/S4 + re-audit `FRONTEND_URL` note + old IAM names · BRIEF-015 audit S3/S4 · stale docs: FRD §13/§15 PWA, `docs/briefs/ui/*.md` tokens
- BRIEF-013 inputs: CD-03 Q2 (one real EasySlip slip), F1 columns, F2 split lock, 409 in-flight
- Design: CD-11 re-copy (R1 + R5) before the 8 Nov export · CD-02 "แจ้งโอนแล้ว" alert variant next revision · canvas index/recipe → `docs/design/README.md`

## Queue
1. BRIEF-016 venue settings + menu read (if Q1 = A)
2. BRIEF-012 orders
3. BRIEF-017 void/comp + PIN + issue flow (if Q2 = yes)
4. BRIEF-013 payment + webhook
5. IAM brief (full policy editor)
6. Web screen briefs after CDs
