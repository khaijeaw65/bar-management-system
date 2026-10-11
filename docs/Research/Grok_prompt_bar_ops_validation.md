# Research prompt — validate a bar management system against real small-bar operations (Thailand)

## Your role
You are a hospitality-operations researcher. I am building a bar management system (senior capstone, production-grade) for **small-to-medium counter bars in Thailand** — typically counter seating + a few tables, **1–3 staff on shift**, often **one POS/tablet**, kitchen (if any) told verbally.

Research how real bars actually operate, then **review how my app handles each area** and flag:
- **MISSING** — something real bars need that my design doesn't cover
- **OVERKILL** — something my design does that a small bar won't use or that adds friction
- **WRONG ASSUMPTION** — my assumed pain point doesn't match reality
- **OK** — matches real practice

## Sources to prefer
Thai sources first where possible: Pantip, Wongnai / Wongnai POS, LINE MAN Wongnai merchant docs, FoodStory, Ocha POS, Loyverse (popular in Thai bars), bar-owner Facebook groups, YouTube/TikTok bar-owner vlogs, Thai news on bar businesses. Then global: r/bartenders, r/barowners, r/restaurantowners, Toast/Square/Lightspeed docs and community forums, hospitality trade press. **Cite a source for every claim**; say "no source found" rather than guess.

## Output format (per question)
```
Q# — <short title>
Real practice: <what small bars actually do — Thailand first, then global>
Evidence: <links / quotes>
Verdict on my app: OK | MISSING | OVERKILL | WRONG ASSUMPTION — <one line why>
Suggestion: <smallest change, if any>
Confidence: high | medium | low
```
End with: **Top 5 risks** (things most likely to make real staff stop using the app) and **Top 5 cuts** (features I could drop with least loss).

---

## Part A — How small bars operate (context questions)

A1. **Staffing:** how many staff are on shift in a small Thai counter bar (10–30 seats) on a weekday vs a Friday? Who does what — does the owner also bartend? Is there a separate cashier, waiter, cook?
A2. **Devices:** how many POS terminals / tablets does a small bar have? Do staff use their own phones for work? Is there a kitchen screen or printer, or is the kitchen told verbally?
A3. **Peak hours:** when is the rush (time of night, days)? What breaks first during the rush?
A4. **Business day:** bars close after midnight — how do owners define "today's sales" (calendar day vs closing time vs a cut-off like 06:00)? How does it show in common Thai POS (Loyverse, Ocha, FoodStory)?
A5. **Turnover & trust:** how often do bar staff change? How do owners control access (shared PIN, shared password, personal logins)? Problems with ex-staff access?
A6. **Software adoption:** what POS do small Thai bars actually use today, what do they pay, and why do some still use paper? What makes staff abandon a POS?
A7. **Typical ticket size:** how many items per order round in a bar (vs a restaurant)? How often does one round mix drinks and food?

## Part B — Validate each area of my design

For each: **my assumed pain point** → **how my app handles it** → question for you.

### B1. Ordering at the counter / tables
- **Assumed pain (observed at 2 bars):** orders are verbal or on paper; nowhere everyone can see; staff don't know which table is waiting or what's been served; at rush hour guests wait long to order.
- **My app:** three ways in — (1) guest scans a table/seat QR and orders on their own phone, no login, no app install, optional nickname; (2) staff take the order on a phone app (3 taps per drink); (3) cashier enters it on the POS tablet. Everyone sees a live order queue.
- **Q:** Do Thai bar guests actually use QR self-ordering, or prefer telling the bartender (especially at the counter)? Which customers resist? Is offering three entry paths right, or is one redundant for a 1–3 staff bar?

### B2. Shared table, counter seats, split bills
- **My app:** one table = one session = one bill; friends scan or share the same QR and join; each order line shows "ordered by <name>". Counter seats get a numbered paper QR each → separate bill per person by default. Splitting = **equal split only** (no per-item split); charges like corkage/fines stay on one person.
- **Q:** How do Thai groups actually split bar bills (equal / per item / one pays + transfers)? Is "equal split only" acceptable? Are paper QRs per counter seat practical or annoying (lost, wet, reused)?

### B3. Order status / queue
- **My app:** status per order (not per item): new → preparing ("กำลังเตรียม") → ready → served; issue branch (out of stock / equipment). Counter seats skip "ready" (bartender hands it over). One tap per step. If a venue enables a kitchen screen, a mixed order splits into a bar ticket and a kitchen ticket with separate status; otherwise one ticket. Orders numbered #001 daily.
- **Q:** Do small bars track "ready" vs "served" at all, or just "done"? Will staff tap status during a rush, or will statuses go stale? Is the issue/escalation flow overkill? Is the bar/kitchen split needed for bars with a small kitchen?

### B4. Sold-out items ("86")
- **Assumed pain:** sold-out is told verbally, so guests/staff still order it and it gets voided later.
- **My app:** one tap marks an item sold out → hidden/greyed on the QR menu and POS instantly; orders already waiting that include it move to "issue" for staff to substitute or cancel.
- **Q:** How do bars communicate 86'd items today? Is auto-moving waiting orders to "issue" helpful or noise?

### B5. Voids, comps, charges
- **Assumed pain:** voids/comps leave no trace; staff can't fix an order themselves because a void is money; owner can't see unusual voids.
- **My app:** void/comp needs a reason; manager PIN or a self-approve permission; all audit-logged; dashboard flags reasons "higher than usual" (> 2× the 4-week weekly average). Charge items exist: otoshi/cover, corkage, breakage, puke fine — permission-gated.
- **Q:** How common is void/comp theft in small bars, and how do owners control it? Is a manager PIN realistic when the owner isn't on site? Are the charge types right for Thai bars (corkage, cover charge, service charge, VAT)? Is the spike threshold sensible?

### B6. Payment
- **Assumed pain:** cashiers check PromptPay transfer slips by eye (can be faked); splitting on a calculator is slow; guests wait long for the bill on a full night.
- **My app:** locked-amount PromptPay QR confirmed automatically by the payment gateway (GB Prime Pay webhook); cash; manual confirm by a manager with reason; equal split → one QR per person; guest can also pay from their own phone. Paying doesn't close the table automatically. 15-min QR expiry.
- **Q:** How widespread is fake-slip fraud in Thai bars? Do small bars accept gateway fees (~0.x–1% per PromptPay txn) vs free direct PromptPay to the owner's account? What do they use today (static QR sticker, staff phone, EDC)? Is self-pay from the guest's phone wanted in bars?

### B7. Closing tables / idle tables
- **My app:** table states free → open → active → idle (no activity for a threshold) → closed. Idle notifies staff; ignored idle auto-closes. Can only close when paid.
- **Q:** Do bars need idle detection, or is it overkill for 10–30 seats? Risk of auto-close?

### B8. Staff access & roles
- **Assumed pain:** shared device/password; nobody knows who voided or took cash; ex-staff can still log in; no way to give temporary manager rights.
- **My app:** each staff logs in with LINE; new staff request access by logging in, owner approves; AWS-style groups + permissions (most-permissive wins); time-bound membership ("manager until end of tonight"); full audit log.
- **Q:** Is LINE login realistic for bar staff? Is group/permission management overkill for a 1–3 staff bar (vs simple Owner / Manager / Staff roles)? Is "temporary manager for tonight" a real need?

### B9. Menu management
- **Assumed pain:** price changes/new items mean reprinting the menu; no photos for guests.
- **My app:** web back office (also phone): items with photo, variants (sizes), modifiers (ice level, add-ons), category, station (bar/kitchen), sold-out toggle; time-window promos (happy hour) seeded, editor later.
- **Q:** How often do bars change menus/prices? Are modifiers needed for bars (vs restaurants)? How do Thai bars run happy hour / promos (time-based price, buy-1-get-1, bucket deals)?

### B10. Bottle keep (ฝากเหล้า)
- **My app:** register a bottle to a guest profile (type, purchase date, expiry e.g. 90 days); track existence only (active / finished / expired, optional full/half/low), not ml; separate from bar inventory; returning guest can "order from my bottle"; expiry reminders via LINE OA later.
- **Q:** How do Thai bars run bottle keep today (tags, notebook, photos, LINE)? Typical expiry rules? Common disputes (lost bottle, level disagreement, expired bottle)? What's missing?

### B11. Guest memory / AI
- **My app:** guest profile is optional with PDPA consent (LINE login); bartender writes free-text notes; AI (OpenAI) summarizes **preferences only** ("likes gin, less sweet") — never behavioural judgments; AI never sees spending or visit counts.
- **Q:** Do bartenders want this, or is it creepy for guests? Any Thai PDPA pitfalls for storing guest preferences? Simpler alternatives?

### B12. Inventory & cost
- **My app:** simple items deduct 1 unit; recipe items (cocktails) deduct ingredients; food = sold-out toggle only (no gram tracking); restock requests from staff; variance view (leakage) for the owner.
- **Q:** Do small bars track pour cost / variance at all? What level is realistic (bottle counts weekly)? Overkill?

### B13. Owner dashboard
- **Assumed pain:** owner learns revenue by counting cash at close; doesn't know what sells; manager has no picture of tonight.
- **My app:** revenue (day/week/month + trend), top/worst sellers, payment split, voids/comps by reason and by person, tonight live (open seats, waiting/issue orders), phone-friendly.
- **Q:** What numbers do small bar owners actually check, and how often? What's missing (e.g. cash drawer reconciliation, shift close report, tips, staff hours)?

### B14. Notifications
- **My app:** staff phone push + in-app: new order, call staff (guest taps a bell), order ready, idle table, restock request, payment confirmed. POS shows toasts/badges.
- **Q:** Will push notifications on staff's personal phones be accepted? Risk of notification fatigue in a 1–3 staff bar?

## Part C — Things I may have missed
C1. **Shift open/close & cash drawer:** opening float, cash count at close, over/short. (Not in my Semester-1 scope — should it be?)
C2. **Tips / service charge** handling in Thai bars.
C3. **Tax invoices / receipts** (e-receipt, ใบกำกับภาษีอย่างย่อ, VAT registration thresholds) — what does a small bar legally need?
C4. **Alcohol law** constraints in Thailand that affect ordering/payment software (sale hours 11:00–14:00 & 17:00–24:00/extended zones, Buddhist holidays no-sale days, ID/age checks, promotions on alcohol banned under the Alcoholic Beverage Control Act — does showing "happy hour" or promo prices on a QR menu risk violating it?).
C5. **Offline / bad internet:** how often does it hit Thai bars; what do current POS do? (I cut offline mode — is that a mistake?)
C6. **Printing:** do bars still need printed order tickets or receipts?
C7. **Reservations / VIP tables, minimum spend, table charge** — common in Thai bars?
C8. Anything else a Thai bar owner would ask in the first 5 minutes of a demo.
