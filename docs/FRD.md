# Functional Requirements Document (FRD)
## AI-Powered Bar Management System with Guest Intelligence

**Version:** 1.2 — BASELINE (approved). Full scope; hardened for concurrency/edge cases; build sequenced by semester (see handoff.md).
**Review status:** Dual independent review passed — GPT (~98%, approved to close) + Grok (9.2/10, all 17 edge cases closed). Do not reopen without a new business requirement or implementation discovery.
**Target:** Small-to-medium counter bars in Thailand (counter seating + tables)
**Last updated:** 2026-08-23 (rev: field research + GPT consistency pass + Grok edge-case pass — 17 collisions resolved via re-validation principle)

---

## 1. Overview

A unified bar management platform for small-to-medium counter bars. Unlike generic POS systems, it integrates order management, inventory cost tracking, guest intelligence, and PromptPay payment into one system. Built as a PWA (mobile for floor staff, desktop/tablet for POS).

**Design philosophy:**
- Identity is a benefit customers *choose*, never a gate.
- AI summarizes preferences (what to serve), never behavioral judgments.
- Never a single point of failure — always a human fallback.
- Speed first: wet hands, low light, loud, rushed environment.

---

## 2. User Roles & Access Control (IAM)

### Model (AWS IAM-style)
- **Users** are assigned to **Groups** and/or given individual **Policies**.
- **Groups** and **Policies** carry **permissions** (e.g. `orders.create`, `orders.void`, `inventory.edit`, `payments.process`, `staff.manage`).
- **Time-bound group membership:** a user can be added to a group with an `expires_at` (e.g. a bartender temporarily elevated to Manager for one shift). No separate "shift" concept.
- **Conflict resolution:** most-permissive-wins (union of all active permissions). No explicit deny — avoids false denies that block staff mid-service.
- **Per-request evaluation:** permissions (ACL) computed and cached in Redis. Cache invalidated immediately on any ACL change (group add/remove, policy change, expiry). Near-realtime revocation.
- **In-progress critical actions:** permission is evaluated at the **start** of a critical action (void, comp, dual sign-off) and remains valid until that action **completes or is cancelled** — a time-bound elevation expiring mid-action does not abort an action already underway.

### Default roles
| Role | Devices | Responsibilities |
|------|---------|-----------------|
| Owner | Desktop + Tablet | Full access — reports, pricing, staff, settings |
| Manager | Desktop + Tablet | Floor + back-office — inventory, voids/discounts, reports, shifts |
| Bartender | Mobile | Orders, bar tab, guest notes, receipts, payments |
| Waiter | Mobile | Orders, tables, request bill handoff |

Roles can be combined on one user (small bar: owner also bartends). Only Owner/Manager can assign group memberships.

---

## 3. Table & Session Management

### Core principle
- **Session ties to the table/seat, NOT to a person.** QR resolves to the session; scanning (or sharing) attaches a person to that session. Names are labels on orders within the session. One table = one session = one bill (unless separate per-seat QR chosen at open).

### QR
- **Tables:** static QR printed per table → resolves to `/(table)/{id}`.
- **Counter seats:** portable **paper QR handed at seating** (no fixed spot to mount a sticker). Numbered per seat; collected/reused when the guest leaves. Same static-QR concept, made movable.
- **Reprintable on demand** (wear, tear, spill, loss — happens constantly in a bar). Reprint resolves to the **same** table → works immediately. Optional **regenerate** (new signed token, invalidate old) for the rare security case (leaked/misused QR). Counter paper QRs are freely reissued.

### Session state machine
- `OPEN → ACTIVE → IDLE → CLOSED`.
- **Opens** when: staff opens manually (reservation/VIP) OR first order placed (walk-in, self-service).
- **`ACTIVE → IDLE`:** occurs after no relevant session activity (new order, item change, payment activity) for the configured inactivity threshold. Any such activity resets the idle timer.
- **Closes** when: staff closes after payment OR ignored idle notification auto-closes.
- **Idle handling:** after inactivity threshold, notify POS to check table. If ignored for a further period → auto-close.

### Separate vs shared — decided ONCE at table open
- **Shared (default):** one QR for the table/seat. Can be **shared to friends** (like Wongnai's "แชร์ QR ให้เพื่อน") → everyone who scans joins the **same** session → all orders → same table → **one bill**. Each person can still enter their own name (shown on their order items) so staff knows whose drink is whose.
- **Separate:** staff issues **per-seat QR** at open → each person gets their own session, own bill, no cross-attribution. For strangers sharing a counter, or groups who want individual tabs from the start.
- **No nested sessions, no runtime break-out.** The separate-or-shared choice is made at open (which QR you scan), never retrofitted after orders pool. "Pooled then want to separate" resolves via split-equal or private settle (see §7), not item attribution.

### Concurrency at open / scan
- **Open race (staff-open vs first-order-open on same table):** first successful write wins; a concurrent second attempt attaches to the existing session rather than creating a duplicate.
- **Paper QR scanned by a different device while session is ACTIVE:** treated as another person joining the same session (shared model) — consistent with share-QR. If the intent was a fresh separate tab, staff issues a new per-seat QR.
- **Reprint collision (old + new paper QR both in circulation):** a reprint re-binds to the **same** session by default; a **regenerate** issues a new token and **invalidates the old** (old paper → "invalid, ask staff").

### Guest attach (optional)
- Primary guest only. Name (optional) + photo (optional, requires consent checkbox). Not forced — bar context, not fine dining. (Distinct from the per-person name-on-order label above, which is just for calling orders.)

> Validated against Wongnai's live `mobile-order.wongnai.com` system (session = "โต๊ะ 3 | คุณ Filippo", share-QR-to-friends, name-on-orders) — confirms the session-tied-to-table + shared-QR model works in production.

---

## 4. Customer Identity

### Principle
Nobody identifies themselves to buy a drink. Identity offered only when it unlocks a concrete benefit (bottle-keep, favourites).

### Flow
1. Scan QR → menu loads instantly (no login).
2. Optional nickname (so staff can call the order).
3. Browse → order → pay → receive drink.
4. **After order** → soft invite: "Remember your bottle & favourites? [Connect LINE] [No thanks]".
5. If accepted → **consent screen first** (PDPA), then LINE login → profile created.

### Consent (PDPA)
- Checkboxes un-pre-checked.
- **Separate** data consent from marketing consent:
  - ☐ Save my preferences & bottle-keep (required for feature)
  - ☐ Send promotions via LINE (optional)
- Short, benefit-framed text + link to full policy.

### Returning-customer recognition (fallback ladder)
- **Fast:** LINE OA "My Bottle" button (Semester 2, nothing to save).
- **Fast:** LINE login (one tap, usually already logged in).
- **Human:** staff lookup by name / **visual profile photo** (manual recognition by staff using the stored photo — **NOT** automated facial recognition, which is out of scope). Always works — drunk/tourist/forgot phone.

### Three concepts (kept separate)
- **Authentication** — prove control of an account (LINE).
- **Identification** — link a visit to a customer record.
- **Recognition** — use past context appropriately.

### Data deletion ("Forget me")
- **Anonymize, not hard delete:** null out identity fields (name, phone, line_id), delete photo from S3, set `anonymized_at`. Keep order/payment records intact (financial + audit integrity). `customer_id` persists but points to nobody.
- **Active bottle-keep at deletion:** if the customer has an active (unfinished, unexpired) bottle, **block anonymization until it is resolved** (finished, forfeited, or expired) — the customer paid for it and staff must be able to serve it on a return visit. Once resolved, anonymization proceeds normally. (Chosen over silently retaining an orphaned bottle, since an anonymized customer can no longer be matched to their bottle at the counter.)
- **Propagation:** anonymization also strips identity (name/photo) from any **currently open session cards** for that `customer_id` and invalidates cached / WebSocket payloads carrying the photo — the deleted photo must not linger on staff screens.

### Cut
- **Member QR** — dropped. Bad save/retrieve UX (buried in photo gallery). LINE OA button does the job better.

---

## 5. Menu & Inventory

### Menu item vs inventory item (important distinction)
- **A menu item is not the same as an inventory item.** Multiple menu items can map to one inventory source, each deducting a different amount. E.g. "Hazy IPA (M)" and "Hazy IPA (L)" are two menu items pointing to **one keg**, deducting different volumes. Menu has two entries; inventory has one keg — no double-counting.
- This is a **many-menu-items → one-inventory-item** relationship (matters for the ERD).

### Menu item types
- **Simple** — one inventory item (e.g. bottled beer).
- **Recipe-based** — multiple ingredients + quantities (cocktails).
- **Charge / non-product** — a fee that hits the bill but is NOT a product: **puke fine, otoshi (cover), corkage, breakage, misc**. No inventory deduction, no kitchen routing. Fixed amount (e.g. puke fine = 200) or open amount (staff types it). **Permission-gated + audit-logged** (arbitrary charges on a customer's bill are a control concern, like comps/voids). *(Observed live: "puke fine" as a menu item at a real bar.)*
- Kitchen routing tag: `bar` / `food` / `both` (not applicable to charge-type).

### Drink type flows
- **Beer (bottle):** tap → deduct 1 unit. No customization.
- **Beer (draft/sized):** owner lists **either** as one item + size modifier (S/M/L) **or** as separate per-pour items ("Hazy IPA (M)", "Hazy IPA (L)") — one tap each, better for QR self-service. **Both deduct the correct volume from the same keg.** *(Real bars observed using per-pour items — favors the "3 taps max" speed principle.)*
- **Cocktail:** tap → optional customize (adjust/substitute/add + free-text note) → deduct recipe ingredients (adjusted). Unresolvable combos → flag for manual review.
- **Spirits/Whiskey:** tap → serving style (neat/rocks/water/mixer) → deduct shot volume (+ mixer). Double-shot supported.

### Inventory tracking by category
- **Category A** — track precisely (spirits ml, wine ml, expensive mixers).
- **Category B** — track loosely (juices, syrup, soda — approximate ml).
- **Category C** — don't track (ice, garnish, mint). Owner sets category per ingredient.

### Food inventory
- **Simpler than drinks** — 86 toggle (mark unavailable when out) + optional daily prep count. **No ingredient-level deduction** (food prep too variable to track by gram; not worth the complexity). Food customization is light (free-text note + basic flags), not the deep cocktail-style engine.

### Cost tracking
- Track ingredient cost → compute cost-per-drink and margin.

### Restock requests
- Bartender taps "Request Restock" (+ optional note) → notifies active POS session.
- Auto low-stock alert for Category A & B; manual request covers all (including C).

### 86'd items
- Bartender marks item unavailable → QR menu hides it immediately, POS shows "86'd" badge → **auto-restores when available stock returns to the level required to fulfil the item** (not merely any stock change). Staff can also manually un-86 an item.
- **86 mid-order:** marking an item/ingredient 86'd also evaluates **dependent orders already in `PENDING`/`ACCEPTED`** and moves them to `ISSUE` (§6 resolution: substitute / remove / escalate). Already-`SENT` orders are untouched.

### Restock requests concurrency
- A restock request **snapshots the item's stock level + 86 state at request time**, so a request isn't confusing if the item is 86'd or adjusted moments later.

---

## 6. Order Flow & Queue

### Order taking
- Quick-tap mobile UI, **3 taps max** per drink. Large buttons (wet hands, low light).
- Counter: bartender logs on mobile, tied to bar seat / tab name.
- Table: QR self-service OR waiter logs it.

### Order status state machine
`PENDING → ACCEPTED (preparing) → READY → SENT`
Branch: `ISSUE` (out of stock / equipment problem). **Resolution paths out of `ISSUE`:**
- **Substitute/resolved** → back to `ACCEPTED` (e.g. bartender swaps ingredient, resumes prep).
- **Removed** → item cancelled/voided (see cancelled-item display below), removed from bill.
- **Escalate** → manager handles directly (still resolves to one of the above).

### Order card shows
Table/seat, **who ordered each item** (name label per line, e.g. "สั่งโดย: Filippo" — supports shared sessions with multiple people), order details (drinks + customization).

### Cancelled / voided item display
Cancelled items stay **visible on the bill, struck through / marked cancelled**, with the amount removed from the total — not erased. Preserves the audit trail (matches §8 audit principle + anonymize-don't-delete philosophy). *(Observed live: cancelled tap item shown as "รายการอาหารถูกยกเลิก", amount removed from total.)*

### Kitchen routing
Orders split by menu item tag → drinks to bartender screen, food to kitchen display (if enabled). Config supports single-POS OR separate kitchen POS.

### Customer-facing (QR ordering surface)
- **Call staff (bell):** one tap → notification to POS ("Table 3 needs staff"). The human-fallback escape hatch for QR ordering — special request, confusion, QR issue, or just wanting a person. Aligns with the "never a single point of failure, always a human fallback" principle.
- **Running tab view (cart):** customer sees their own session's ordered items, running total, per-item status (preparing / ready / served), and a data-freshness timestamp — same state machine, customer-side. (Observed live in Wongnai's ordering UI.)

---

## 7. Payment

### Two axes (configurable): WHERE payment happens × HOW it's confirmed

**WHERE (location):**
- At table/seat — staff brings QR/receipt, or customer pays from own phone.
- At POS — customer comes to the counter to check out.

**HOW (confirmation):**
- **Auto (webhook)** — locked-amount PromptPay QR, confirmed by the **payment gateway/bank**, not by a human eyeballing a slip. → **headline feature.**
- **Manual** — staff marks paid after customer shows payment evidence. Realistic fallback; what real bars commonly do.
- **Cash** — staff marks paid + reason code.

### Why webhook auto-confirm is the differentiator (not gold-plating)
Both real bars observed rely on **manual slip verification** (staff looks at a payment screenshot → closes tab). This is vulnerable to **fake payment slips** — a known fraud vector in Thailand. Webhook auto-confirm fixes it: the tab only closes when the **bank confirms money actually arrived**, which can't be faked. This is a genuine, defensible improvement over existing practice — good thesis point.

### Split options
- **Merge bill** (one QR) OR **Split bill** (equal, separate QR per person). **No item-level split** (out of scope — izakaya continuous ordering makes per-item attribution unrealistic, and pooled orders can't be cleanly attributed).
- Follows the session model (§3):
  - **Shared session** (one QR) → merge (one payment) OR split-equal at checkout. "Pooled but someone wants their own" → split-equal or private settle, NOT item attribution.
  - **Separate per-seat sessions** → each pays their own naturally.
- **Counter tabs:** staff asks combine or split at checkout.
- **Charge-type items (puke fine, corkage, etc.) are assigned to a specific tab**, NOT included in split-equal math. (If sober friends want to cover it, they pay that person's bill — a payment choice, not a split calculation.)

### Payment-in-flight collisions (state frozen during a payment attempt)
A payment attempt **locks the amount** for that attempt. While a payment is pending/in-flight:
- **Idle auto-close is blocked** — payment activity resets the idle timer; a table cannot auto-close mid-payment.
- **Comp/void of items in that bill is blocked** — must cancel/regenerate the payment first (prevents the paid amount and the bill diverging).
- **Time-based price changes (happy hour boundary) do not alter the locked amount** — the frozen amount stands for that attempt; new prices apply to later orders or a regenerated QR.
- **Manual mark vs late webhook:** if staff marks a session paid manually and the real webhook arrives afterward for an already-settled session, the webhook is **ignored and logged** — no double settlement.

### Other
- **Payment settlement ≠ session closure.** "Payment confirmed" means the payment transaction is successfully settled (bank webhook, manual mark, or cash). The **session stays open** until staff explicitly closes it. "Pay only after you've finished" is the bar norm — tab stays open until the customer leaves / staff closes (see §3 session lifecycle).
- **Cash payment record** stores the bill amount; cash received and change are optional fields (staff may enter for drawer reconciliation, but only the settled bill amount is required).
- **Receipt** generation (digital; PromptPay QR on receipt for the on-receipt-QR variant).

> Observed live (two bars): Bar A — "pay with staff," staff shows PromptPay QR from own phone, no receipt QR. Bar B — QR on receipt, two sub-flows (staff carries receipt to table + customer shows payment evidence → staff confirms; OR customer checks out at POS → staff generates receipt). Both use manual confirmation → motivates the webhook auto-confirm headline.

---

## 8. Control & Integrity

### Comps & Voids
- **Comp** = free drink intentionally given. **Void** = order cancelled before payment.
- Both are fraud vectors (sweethearting, void-and-pocket).
- Every comp/void → **mandatory reason code** + **manager PIN authorization** (fast, in-place — not a remote queue).
- Permission-gated (`orders.comp`, `orders.void`).
- **Solo staff** (no manager present) → self-approve allowed but heavily flagged in audit for owner review.

### Variance Tracking
- Expected usage (recipe × orders) vs actual stock count → per-shift variance report. Flags overpour / spillage / theft. Applies to Category A & B.

### Audit Log
- Immutable log of all critical actions: order edits, stock adjustments, price changes, comps, voids, deletions, cash-method changes. Who / what / when.

### End-of-Shift Cashout
- **Blind cash counting:** system does NOT show expected total; staff enters raw physical count first, then system compares → variance flagged.
- **Dual sign-off** (outgoing staff + incoming manager) locks shift report.
- **Settle point (operational, not system-enforced):** bars force a settlement point at a cutoff (e.g. midnight) — staff manually go table-to-table settling all open tabs (hand off QR/bill to each). Cashout runs **against settled tabs**. The system's role is only to support fast per-session settle + close; the forcing is an operational practice, not a batch feature. New sessions open fresh afterward.

### Concurrency & state re-validation (cross-cutting principle)
Many collisions above share one root: **state can change between when an action starts and when it completes.** The consistent rule:
- **Re-validate at completion:** actions that span time (order awaiting acceptance, bottle-keep order, payment attempt) re-check the relevant state at the moment they complete; if it's no longer valid, route to `ISSUE` or block.
- **Freeze what must be frozen:** a payment attempt locks its amount; that amount is immune to later price/comp/void changes until the attempt completes or is cancelled.
- **Concurrent writes:** first-write-wins (or optimistic locking that forces a refresh) for simultaneous submits to the same session — no duplicate sessions, no lost updates. (Exact locking strategy is an implementation/architecture decision.)

---

## 9. Pricing & Promotion

### Happy Hour
- Time-triggered automatic price changes (e.g. 17:00–19:00). Items shift price state by system clock. `[HH]` tag keeps discount metrics separate from regular sales analytics.

### Promotion Engine
- Types: time-based, bundle (e.g. bucket of 5), event-based.
- Manual discount → mandatory reason code, permission-gated (who can discount).
- Margin impact report (value surrendered vs volume lift).
- **Loyalty / stamp cards — NOT in scope.**

---

## 10. Guest Intelligence (Differentiator)

- **Guest profile (organic, not form-filled):** name, photo (both optional + consent), drink preferences, visit history, flags (allergy, VIP), color tags, linked bottle-keep.
- **AI summary:** condenses bartender notes into quick-read. **Preferences only — no behavioral profiling** (no "drinks heavily", "usually alone"). PDPA + non-creepy.
- **Role:** memory aid for staff, not a behavior coach. System surfaces "has this person been here, what do they like"; bartender decides how to use it.
- **Surfaces:** bartender screen (when regular identified) + QR menu ("recommended for you", own history only).

---

## 11. Bottle Keep (Differentiator)

- Register bottle to guest profile: type, purchase date, expiry (bar policy, e.g. 90 days).
- **Track existence, not precise volume** (customers self-pour / share — precise ml is unrealistic). Status: Active / Finished / Expired. Optional rough estimate (Full / Half / Low).
- **Separate from bar inventory** (already sold, not bar stock — excluded from variance).
- Shows on ordering page when identified: "Order from my bottle" (top of menu, one tap).
- **Status re-checked at order acceptance:** if the bottle becomes Finished/Expired between the customer tapping "order from my bottle" and staff acceptance, the order moves to `ISSUE` (§6) rather than pouring from a bottle no longer valid.
- Expiry reminder → Semester 2 (needs LINE OA).

---

## 12. Analytics

### Owner dashboard ("money view")
Revenue (daily/weekly/monthly + trend), top & worst sellers, margin & pour cost %, variance (leakage), payment breakdown (cash vs PromptPay).

### Manager dashboard ("action view")
Today's live sales, low stock / reorder alerts, dead stock (slow movers), pending restock requests.

### Fraud view (not staff performance)
Comps/voids totals grouped by reason; flag abnormal spikes by person/reason. **No staff performance leaderboard** (surveillance, cut).

---

## 13. Notifications

- **Channels:** WebSocket (in-app, real-time), Web Push (PWA backgrounded), LINE OA (customer-facing, Semester 2).
- **Priority routing:** active in PWA → WebSocket; backgrounded → Web Push.
- **Triggers:** idle table, new table opened, restock request, low stock, payment confirmed, new QR order, food ready, **call staff (customer → POS via bell)**.

---

## 14. Explicitly Cut / Deferred

**Cut (won't build):**
- Offline mode — venues have strong Wi-Fi; complexity (sync conflicts) not worth it. Keep only basic network-drop retry UX.
- Member QR — bad save/retrieve UX.
- Staff performance analytics — surveillance, low value.
- Item-level bill split — too complex.
- Multi-language, cross-border payments (WeChat/Alipay), card pre-auth, tip pooling.

**Deferred (Semester 2 or later):**
- LINE OA (customer): promo broadcast, reservation, business-day announcements, "My Bottle" button, bottle expiry reminders.
- React Native app (if PWA UX insufficient).
- Loyalty / stamp cards.
- Phone OTP identity (model is provider-agnostic to allow this later).
- EKS migration (after ECS is solid).

---

## 15. Frontend Surfaces

- **PWA**, installable to home screen (feels native, Web Push capable).
- **Staff (bartender/waiter):** mobile-responsive.
- **POS (owner/manager):** desktop + tablet.
- Two zones in counter bars: counter (direct bartender interaction, no QR needed) + tables (QR self-service or waiter).
