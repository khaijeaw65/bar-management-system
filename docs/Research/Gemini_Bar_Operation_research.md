Part A — How small bars operate
A1. Staffing
Real practice: A 10–30 seat Thai bar typically runs with 1–2 staff on weekdays and 3 on weekends. The owner usually doubles as the bartender/manager. There is rarely a dedicated cashier or cook; runners handle tables, and the bartender manages the POS.
Evidence: General Thai SME hospitality practice (Wongnai merchant guidelines).
Verdict on my app: OK — Your system assumes a highly cross-functional, lean team.
Suggestion: Ensure the POS/tablet UI is optimized for one-handed, fast tapping while pouring drinks.
Confidence: High
A2. Devices
Real practice: Most rely on a single iPad or Android tablet (Loyverse, Ocha, FoodStory) at the bar. Staff frequently use their own personal smartphones to take orders at tables via staff apps. Kitchen printers are rare in 10-30 seat bars; verbal orders to the back or passing a handwritten slip are standard.
Evidence: Pantip merchant discussions on POS systems, Wongnai POS hardware tiers.
Verdict on my app: OK — Supporting staff phone apps and verbal kitchens matches reality.
Suggestion: Do not mandate a kitchen screen; allow all tickets to live on the main bar tablet.
Confidence: High
A3. Peak hours
Real practice: The major rush hits Friday and Saturday nights between 20:30 and 23:30. The first thing to break is order tracking (forgetting who ordered what in a multi-item round) and bill calculation at closing time.
Evidence: General hospitality bar operations.
Verdict on my app: OK — Live order queue addresses the exact breaking point.
Suggestion: Ensure your queue UI can display at least 8–10 concurrent orders on one screen without scrolling.
Confidence: High
A4. Business day
Real practice: Bars close after midnight (e.g., 01:00 or 02:00). Owners define the business day from opening until the last guest leaves. Popular POS systems (Loyverse, Ocha) allow setting a "custom end of day" (e.g., 05:00) so a 01:30 AM checkout still registers as "Friday's sales."
Evidence: Loyverse and FoodStory shift-management documentation.
Verdict on my app: MISSING — If your app cuts off daily sales at midnight, Friday's revenue will bleed into Saturday.
Suggestion: Add a setting for "End of Business Day" time (default 05:00 AM).
Confidence: High
A5. Turnover & trust
Real practice: Staff turnover is extremely high. Fraud is common, specifically "bill swapping" (staff print a fake bill, pocket the cash, and void the real order).
Evidence: Thai news reports on cashier fraud and POS bill tampering.
Verdict on my app: OK — Your audit logs and permission-gated voids directly address this.
Suggestion: Ensure the owner dashboard prominently highlights daily void totals.
Confidence: High
A6. Software adoption
Real practice: Thai bars predominantly use Loyverse (because it is free/cheap) or FoodStory/Wongnai POS (for LINE MAN integration and static QR ordering). Staff abandon systems if they lag during the 21:00 rush or require too many taps to fire a drink.
Evidence: Pantip POS recommendations.
Verdict on my app: OK — Providing a lightweight, low-friction alternative fits the market.
Suggestion: Benchmark your order-entry speed against Loyverse.
Confidence: High
A7. Typical ticket size
Real practice: Guests order in multiple small rounds (e.g., 3 beers, then 2 shots 30 mins later) rather than one large restaurant-style order.
Evidence: Global bartender forums (r/bartenders) on pacing.
Verdict on my app: OK — Continuous session ordering fits this behavior.
Suggestion: Make "add to existing table" a one-tap action from the main screen.
Confidence: High
Part B — Validate each area of my design
B1. Ordering at the counter / tables
Real practice: Static QR codes on tables are heavily pushed by Wongnai POS and widely adopted in Thailand. However, counter-seating guests prefer ordering verbally from the bartender for the social experience.
Evidence: Wongnai POS Mobile Order documentation.
Verdict on my app: OK — Offering three paths is correct, provided the staff app path is ultra-fast.
Suggestion: Ensure the bartender POS interface is faster than the guest QR flow.
Confidence: High
B2. Shared table, counter seats, split bills
Real practice: Thai groups heavily rely on "หารเท่า" (equal split) via PromptPay apps (like Check Bill by Jsor). However, putting paper QRs on counter seats is impractical; counters are wet, cramped, and papers get lost.
Evidence: Thai web tools dedicated entirely to equal-split bills.
Verdict on my app: OVERKILL — Paper QRs per counter seat will fail physically.
Suggestion: Ditch counter QRs. Let the bartender assign counter guests to "Seat 1, Seat 2" on the POS, and print one final QR when they leave. Equal split for tables is fine.
Confidence: High
B3. Order status / queue
Real practice: Small bars rarely distinguish between "preparing" and "ready" during a rush. Staff just want to mark a ticket as "done/served" to clear the screen. Multi-step status tracking causes bottlenecks.
Evidence: Operational realities of 1-3 staff bars; staff abandon tools that require extra data entry during peak hours.
Verdict on my app: OVERKILL — Too many taps per order line for a small team.
Suggestion: Compress status to: New → Done.
Confidence: High
B4. Sold-out items ("86")
Real practice: Word of mouth between staff. Auto-moving waiting orders to "issue" is smart, but forcing staff to deal with an "issue" queue mid-rush causes friction.
Evidence: Standard restaurant/bar workflows.
Verdict on my app: OK — Hiding it on the QR is excellent, but the issue flow might annoy staff.
Suggestion: When an item is 86'd, auto-cancel the pending items and trigger a quick pop-up for the staff to go tell the table, rather than creating a mandatory "issue resolution" workflow.
Confidence: Medium
B5. Voids, comps, charges
Real practice: Employee theft via voids is a massive pain point. Owners need strict control, but when the owner isn't there, a manager needs power to fix mistakes.
Evidence: Thai crime reports on restaurant cashier fraud.
Verdict on my app: OK — The spike threshold dashboard and permission gating are highly valuable.
Suggestion: Make sure voided items print a void slip (if a printer exists) so kitchen/bar staff know not to make it.
Confidence: High
B6. Payment
Real practice: Fake PromptPay slips generated by AI are a massive epidemic in Thailand. While payment gateways solve this, they charge ~1-2.5%. Small bars operate on tight margins and heavily prefer free PromptPay static QRs combined with Bank LINE Official audio alerts (e.g., KBank Live, SCB Connect) or POS sound alerts.
Evidence: Merchant guides on checking fake slips and GB Prime Pay / Xendit fee structures.
Verdict on my app: WRONG ASSUMPTION — Small bars will likely reject the gateway fee for every transaction.
Suggestion: Support a "Static PromptPay" mode where the app generates a free PromptPay QR (no webhook), and the manager manually taps "Confirm Payment Seen" after hearing their bank's LINE alert.
Confidence: High
B7. Closing tables / idle tables
Real practice: Bar patrons frequently leave their tables for 15–30 minutes to smoke, talk to other tables, or step outside.
Evidence: Bar operational norms.
Verdict on my app: OVERKILL — Auto-closing an idle table will anger guests who return to find their session gone.
Suggestion: Remove auto-close entirely. Keep the idle warning on the POS so staff can physically check the table, but force manual closure.
Confidence: High
B8. Staff access & roles
Real practice: Staff share passwords because logging in/out is too slow during a shift. Ex-staff accessing data is a real threat.
Evidence: Common POS security complaints.
Verdict on my app: OK — LINE login is a brilliant, culturally aligned solution for Thai staff. Time-bound access solves the "owner is out" problem.
Suggestion: Allow a 4-digit fast-PIN for switching users on the shared bar POS, linked to their LINE identity, so they don't have to authenticate via LINE for every single void.
Confidence: High
B9. Menu management
Real practice: Thailand's Alcoholic Beverage Control Act (Section 30 and 32) strictly prohibits advertising alcohol promotions, "Happy Hour", price reductions, or buy-1-get-1 deals. Authorities aggressively fine venues based on social media and digital menus.
Evidence: Thai tax and alcohol control laws.
Verdict on my app: FATAL LEGAL RISK — Systematically enabling "Happy Hour" visibility on guest-facing QR menus invites severe fines for the venue.
Suggestion: Rename promo features to avoid illegal terminology. Do not show "discounted" prices on the guest QR menu; apply the discount silently at checkout, or limit promo features to food only.
Confidence: High
B10. Bottle keep (ฝากเหล้า)
Real practice: Bottles are kept for 1 to 3 months. The biggest dispute isn't just expiry, but how much was left in the bottle.
Evidence: Standard Thai nightclub/bar rules.
Verdict on my app: MISSING — Tracking "existence only" will lead to arguments when a guest claims their bottle was half full, and staff bring out a near-empty one.
Suggestion: Add a simple 4-state volume selector (Full, 3/4, Half, 1/4) when checking a bottle in.
Confidence: High
B11. Guest memory / AI
Real practice: Bartenders keep notes on regulars mentally or in Line OA. Thai PDPA is strict regarding unauthorized data processing.
Evidence: Thai PDPA regulations.
Verdict on my app: OVERKILL — AI summarization is over-engineered for a 3-staff bar, and introduces unnecessary API costs and PDPA compliance weight.
Suggestion: Cut the AI. Stick to a simple free-text "Staff Notes" field tied to the LINE login profile.
Confidence: Medium
B12. Inventory & cost
Real practice: Small bars rarely track per-mL cocktail pours because it's too tedious to reconcile. They track whole bottles and daily keg volume.
Evidence: General hospitality inventory practices.
Verdict on my app: OK — Deducting whole units is the most a small bar will actually do reliably.
Suggestion: Keep it exactly as is. Don't add mL tracking.
Confidence: High
B13. Owner dashboard
Real practice: Owners primarily check total cash vs. system revenue to ensure the drawer matches.
Evidence: Standard SME retail practices.
Verdict on my app: MISSING — Without a shift close / cash reconciliation view, the dashboard is just analytics, not an operational tool.
Suggestion: Add a "Shift Close" report showing Expected Cash, Actual Cash, and Over/Short.
Confidence: High
B14. Notifications
Real practice: Staff personal phones are in their pockets, often on silent, or too noisy during a busy Friday shift.
Evidence: Service industry physical realities.
Verdict on my app: WRONG ASSUMPTION — Push notifications will be ignored during the rush.
Suggestion: Rely on visual/audio cues directly on the shared POS tablet (e.g., a bell chime on the iPad) rather than personal phone pushes.
Confidence: High
Part C — Things you missed
C1. Shift Close & Cash Drawer: (See B13). You absolutely must include a shift close process (opening float + expected cash). Without this, owners cannot trust the system to secure their money.
C2. Tipping: Guests ordering via QR will want to tip digitally. If using PromptPay, allow a "round up" or custom tip field.
C3. Tax Invoices (ใบกำกับภาษีอย่างย่อ): Small bars need the ability to print a basic thermal receipt with their Tax ID if a customer asks for it.
C4. Offline Mode: Internet drops happen frequently in crowded bars. While you cut it, ensure your app at least handles temporary disconnects gracefully (queueing orders locally and syncing when back online) rather than crashing or showing error screens.
🚨 Top 5 Risks (Will make staff stop using it)
Gateway Fee Resistance: Bar owners will refuse to use your payment flow if forced to pay 1-2.5% on every PromptPay transaction.
Too Many Taps: Multi-step order statuses (New → Prep → Ready → Served) will be abandoned during a 9 PM Friday rush.
Paper Counter QRs: Managing paper QR codes on a wet, crowded counter will physically fail.
No Cash Reconciliation: If staff can't balance the cash drawer at the end of the night, the owner will go back to Loyverse.
Night-time Sales Bleed: Without a 05:00 AM "End of Day" cut-off, reporting will be broken.
✂️ Top 5 Cuts (Features you can drop with least loss)
AI Guest Summaries: Over-engineered; a text box works fine.
Auto-closing Idle Tables: Too risky; guests step away frequently.
Automated "Issue" Workflow for 86'd items: Just auto-cancel and refund/void.
Push Notifications to Personal Phones: Will be ignored. Rely on POS sounds.
Kitchen Screen Splitting: 1-3 staff bars don't need dedicated KDS routing; one master view is sufficient.