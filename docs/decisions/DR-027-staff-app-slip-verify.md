# DR-027 — Slip verification on the staff app (amends DR-009 / CD-03 Q1)

| | |
|---|---|
| **Status** | Approved |
| **Raised by** | Cowork · 2026-10-24 (BRIEF-025 interview) |
| **Brief** | BRIEF-025 (decision only — built in a later mobile brief) |
| **Category** | Flow/Architecture |

## Context
DR-009 keeps money actions (payments, close) on the POS; CD-03 Q1 (Field, 2026-10-17) put slip scanning on the **POS tablet camera**, with staff-app scanning "S2, only if asked". In the BRIEF-025 interview (2026-10-24) Field asked for slip checking on **both POS and the staff app** — a staff member at a table should be able to confirm a transfer without walking to the POS. The staff app (Expo, Metee) has no camera package yet and its shell (BRIEF-010) is not merged, so nothing is built now; this DR settles the boundary so the mobile plan and the IAM brief can count on it.

**Interview (2026-10-24):** Staff app → **DR now, mobile brief later** (Selected by KJ).

## Options

**A) Keep POS only (DR-009 as is — baseline)**
1. Staff at the table tell the guest "ชำระที่เคาน์เตอร์" → cashier scans on the POS (BRIEF-025).
- No mobile work; one place for money. Staff walk to the POS for every PromptPay bill.

**B) Staff app may verify slips; manual confirm stays POS-only** *(recommended)*
1. Staff app → table → the pending PromptPay payment (created on the POS) → "สแกนสลิป" → live scan (Expo camera barcode scanning) or photo.
2. `POST /payments/:id/verify-slip` — **the same endpoint and rules as BRIEF-025**, no new API.
3. Server: EasySlip call outside the transaction → lock + checks + save inside → `payment.status_changed` → the POS checkout shows "ยืนยันสลิปแล้ว" live.
- **DB transaction:** identical to BRIEF-025 §3b. **Failure → what's left → who cleans:** any rejection or service down → payment stays pending; the staff app says "ยืนยันที่ POS" — manual confirm (unverified money) stays on the POS, where it is flagged for the owner. Two devices scan the same slip → UNIQUE `slip_trans_ref` lets one win.
- Needs: `expo-camera` in `app/mobile` (dependency — decided in the mobile brief), the staff member holding `payments:create` (IAM brief / group seeds).

**C) Staff app may verify **and** manually confirm**
- As B, plus manual confirm with reason on the phone. Unverified money confirmed away from the POS and the cashier — weakest control; contradicts DR-014's "manual is the flagged exception".

## Recommendation
**B.** It gives Field the "confirm at the table" flow with zero new backend work (same endpoint, same checks, verified by the bank), while the only unverified path — manual confirm — stays on the POS where the owner's flagging and the cashier's eyes already are.

## If Approved — Locks
- DR-009 amended: the staff app may call `POST /payments/:id/verify-slip`; creating payments, cancelling, manual confirm and closing stay on the POS.
- CD-03 Q1 amended: slip scan on the POS tablet **and** the staff app (S1, after BRIEF-010 and the phone-order work).
- Same endpoint, same rules, same permission (`payments:create`) — no staff-app-specific API.
- The mobile brief decides `expo-camera` (dependency) and its own scan / photo UX (CD-08 update).

---

## Decision — Field only
**Decision:** Approved: B (staff app may call `verify-slip`; manual confirm, create, cancel and close stay on the POS)
**Why:** Confirm transfers at the table with no new backend work, while unverified money stays on the POS.
**Date:** 2026-10-24 · recorded by Cowork on Field's explicit instruction (session: "approve DR-027 B")
