# DR-014 — Ops simplification from field experience + research

| | |
|---|---|
| **Status** | Approved — Field · 2026-10-12 |
| **Raised by** | Field via Cowork · 2026-10-11/12 |
| **Brief** | BRIEF-012 (orders), BRIEF-013 (payment), IAM brief, dashboard brief, menu brief · CD-02/03/05/06/07/08/12/13/15 |
| **Category** | Flow/Architecture · Data · Scope |

## Context
Grok + Gemini research (`docs/research/Grok_Bar_Operation_research.md`, `Gemini_Bar_Operation_research.md`), cross-checked against primary sources (`docs/research/Claude_verified_ops_findings.md`), plus Field's field experience (two counter bars — small and medium — and one week at a large bar):
- Small bar: verbal ordering only, POS used for management. Medium bar: table QR because it is bigger and serves food.
- Order/POS staff count cash at close and report to the manager/owner (large bar). Loyverse ships the same shift flow.
- Payment to the owner's or a bar PromptPay account (static QR image saved by staff, or transfer by PromptPay ID); staff screenshot the guest's slip as evidence; nobody checks it with the bank. Fake slips are a real fraud vector. Gateways cost ~1.65% + VAT (Omise); slip-verification APIs cost a flat monthly package (EasySlip ฿99–700/month for 250–2,500 checks).
- Bottle keep: regulars only, no fixed period, post-it on the bottle, case by case.
- Promotions: almost every bar runs them (social media / LINE OA; shown in a promo section or under the category on QR menus). Alcohol-promotion advertising carries legal risk (Section 32 enforcement, ฿50,000 fine 2020).
- An AI guest summary adds little (few notes, read in seconds); AI is a grading criterion, so it moves to the owner.

## Decision — Field only
**Decision:** Approved (Field, 2026-10-12, in session):
1. **READY only when the kitchen screen is on** (`venue.kitchen_display_enabled`). Otherwise every seat goes ใหม่ → กำลังเตรียม → เสิร์ฟแล้ว (`pending → accepted → sent`). Generalises DR-011 (counter seats) to all seats when the kitchen screen is off. กำลังเตรียม stays: it claims the ticket (CD-08 R14).
2. **No idle auto-close.** Idle = warning on the POS only; closing is always manual. FRD §3 auto-close removed.
3. **Sold-out (86) on waiting items → auto-cancel** those items (`cancel_reason` ของหมด, cancelled by system) + alert "แจ้งลูกค้าโต๊ะ …". The ISSUE flow stays for problems staff report themselves (CD-08 รายงานปัญหา).
4. **Business-day cut-off = venue setting**, default **06:00** Asia/Bangkok (used by `order_record.business_date`, shift membership "until end of tonight", reports).
5. **Counter QR optional, off by default.** The bartender opens the counter seat on the POS / staff app. Table QR ordering stays (medium bars with food).
6. **Two payment modes per venue**, behind one payment-confirmation interface:
   - **Gateway webhook** — GB Prime Pay first (demo); Omise as a later adapter.
   - **Normal way** — money goes to the owner/bar PromptPay; the app generates an **amount-locked PromptPay QR** (EMVCo, free) and staff **scan the slip's verification QR → slip-verification API** (EasySlip first adapter) → paid automatically, evidence stored. Guests may still pay by static QR or PromptPay ID; the slip check covers all three. Our own checks: unique slip reference (reuse), receiver account = venue PromptPay, amount ≥ bill. Fallback: manual confirm + reason.
   - Gate (8 Nov) = normal way with manual confirm. Slip scan + gateway webhook in BRIEF-013. **Before BRIEF-013:** confirm EasySlip returns the receiver account (else it is not usable).
7. **Shift close (S1, after the gate):** opening float → staff count cash at close → manager sees expected vs counted and the difference. Optional per venue.
8. **Staff switch on the shared POS with a 4-digit PIN** linked to each person's LINE identity; every POS action is attributed to the person who switched in.
9. **Bottle keep = simple record:** guest, bottle, date kept, note, status `active | finished`. No expiry logic, no level tracking, no reminders (physical post-it stays human work). "Order from my bottle" stays S2.
10. **Promotions stay** (DR-010, promo section or category). Guest QR shows the promo price as-is — **no crossed-out "was" price** on alcohol. FRD notes legal compliance is the venue's responsibility. **CD-12 R5:** S1 can create a promo item.
11. **AI = owner insight suite** (replaces the AI guest summary, which is dropped):
    - Core: (1) sales summary daily/weekly, (2) anomaly / fraud alerts (voids/comps by reason and person, voids after a payment attempt, manual vs verified payments, failed/reused slips, cash over/short), (3) menu & stock suggestions (sold-out frequency, slow movers). Next: promo results, peak-hour load, payment-fee view. Stretch: "ask your data" via tool calling on fixed report endpoints only.
    - **SQL calculates, AI explains** — the model never computes figures; each insight shows its source numbers.
    - **Totals only** to OpenAI; no guest data; staff sent as aliases, mapped back on our server. Alerts state facts + "ควรตรวจสอบ", never accuse.
    - Stored insights (new `ai_insight` table), generated by a BullMQ job (daily/weekly) or on demand.
    - Guest notes stay plain text (S2, opt-in). IAM engine stays, seeded with **3 groups (Owner / Manager / Staff)**, policy editor under "ขั้นสูง". Notifications: POS sound + badge first; phone push only for new order, call staff, ready (mutable).

**Why:** matches how small and medium Thai bars actually operate (fewer taps, no screenshots, no forced setup), keeps the core slice simple for the 8 Nov gate, and moves AI to where it pays (owner decisions, fraud) while staying PDPA-safe.
**Date:** 2026-10-12

## Follow-ups (not decided here)
- Schema diff (needs Field's OK on the exact change): `venue` settings (business-day cut-off, payment mode, PromptPay ID/type), `shift`, staff POS PIN, `ai_insight`, `payment.confirmed_via += slip_verify` + unique `slip_trans_ref`, `bottle_keep` simplification.
- Advisor heads-up: AI feature moved from guest summary to owner insight.
- Canvas updates: CD-08/15 (READY conditional), CD-02 (no auto-close; PIN switch), CD-03/07 (slip scan), CD-05 (AI insight card), CD-06 (promo display), CD-13 (3 groups, PIN).
