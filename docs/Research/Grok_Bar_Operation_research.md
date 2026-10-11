Part A — How small bars operate
A1 — Staffing

Real practice: Small Thai counter bars (10–30 seats) commonly run with 1–3 staff on a weekday; Fridays/weekends often add 1 more or rely on the owner/partner. Owner frequently bartends or doubles as cashier/manager. Roles blur: bartender takes orders + pours + may handle cash; separate waiter/cook rare unless there is a small kitchen (told verbally). High staff-finding difficulty reported in nightlife areas.

Evidence: YouTube bar-owner vlogs (lady-bar and small-bar costs, staff struggles in Pattaya/Bangkok); Daywork job listings for bar-back/front-of-house (often 1–2 roles); general F&B shift notes for bars (16:00–00:00/02:00). Global: 1 bartender per ~40–50 guests at peak + barback.

Verdict on my app: OK — design assumes 1–3 staff.

Suggestion: None critical.

Confidence: medium (anecdotal + job ads; limited pure “counter bar” census).
A2 — Devices

Real practice: Most small Thai bars use 1 POS/tablet (or phone). Staff phones sometimes used for orders/notes. Kitchen screen/printer uncommon in pure counter bars; verbal or paper ticket to any kitchen. Loyverse marketed for bars on existing Android/iOS devices.

Evidence: Loyverse bar POS pages (Android/iOS, open tickets); Wongnai/FoodStory/Ocha comparisons (tablet-centric for small venues); StoreHub bar tab notes.

Verdict on my app: OK.

Suggestion: None.

Confidence: medium-high.
A3 — Peak hours

Real practice: Rush typically 21:00–01:00/02:00, heaviest Fri–Sat. What breaks first: order accuracy, tab/split tracking, stock of popular pours, staff attention.

Evidence: Global nightlife scheduling (Fri/Sat 22:00–02:00); Thai bar-owner content on peak service pressure.

Verdict on my app: OK.

Suggestion: None.

Confidence: medium.
A4 — Business day

Real practice: Bars close after midnight; “today’s sales” usually defined by closing/shift cut-off (often 04:00–06:00 or when last tab closes), not calendar midnight. Common Thai POS (Loyverse, Ocha, FoodStory/Wongnai) support shift/day reports configurable by user.

Evidence: POS comparison pages (shift/close reports standard); general hospitality practice. No explicit “all Thai bars use X cut-off” source found.

Verdict on my app: OK if you expose a configurable cut-off.

Suggestion: Make business-day cut-off explicit and owner-settable.

Confidence: medium.
A5 — Turnover & trust

Real practice: Nightlife staff turnover is high; owners often use shared devices/PINs or simple passwords. Ex-staff access is a known risk.

Evidence: Thai retail/nightlife staffing notes on turnover; general POS security discussions. Specific bar Facebook-group quotes not retrieved.

Verdict on my app: OK (personal logins + approval + audit).

Suggestion: Keep onboarding extremely light.

Confidence: medium.
A6 — Software adoption

Real practice: Popular free/low-cost options for small venues: Loyverse (core free), Wongnai POS / FoodStory, Ocha, Qashier, StoreHub. Many still use paper or basic calculators because of cost, training friction, or distrust of complexity. Staff abandon POS when it slows the rush, requires too many taps, or offline fails.

Evidence: 2026 POS comparison round-ups (Loyverse free, Wongnai budget Android, FoodStory iPad, Ocha for cafés); Loyverse bar-specific pages.

Verdict on my app: OK if friction stays low.

Suggestion: Prioritise 1–2 tap flows above all.

Confidence: high.
A7 — Typical ticket size

Real practice: Bar rounds are usually 1–4 drink items (often same item repeated); food + drink mixes less frequent than in restaurants unless the bar has a real kitchen.

Evidence: Limited direct Thai bar ticket data; general bar vs restaurant order patterns from POS marketing. No Pantip/large sample found.

Verdict on my app: OK.

Suggestion: Optimise for repeated single-item adds.

Confidence: low-medium.
Part B — Validate each area
B1 — Ordering at the counter / tables

Real practice: Counter guests strongly prefer telling the bartender; table QR self-order is actively pushed by Wongnai/FoodStory for restaurants and gaining traction, but pure bar counter culture remains verbal. Resistance highest among older Thai regulars and tourists who want interaction.

Evidence: Wongnai Mobile Order / Order & Pay product pages and Facebook posts (restaurant-focused); ThaiQROrder marketing; no strong “bars love guest QR” sources found.

Verdict on my app: OK (three paths), but QR path may see low uptake at pure counters.

Suggestion: Make staff/POS path the default; treat guest QR as optional add-on.

Confidence: medium.
B2 — Shared table, counter seats, split bills

Real practice: Thai groups commonly do equal split or one person pays then friends transfer via PromptPay/LINE. Per-item split less common at small bars. Paper QR per counter seat is practical only if laminated/reusable; wet/lost risk exists.

Evidence: StoreHub bar-tab marketing (split by guest/table); general Thai payment culture. Specific Pantip bar-split threads not retrieved.

Verdict on my app: OK for equal split; paper QR risk is real.

Suggestion: Offer digital seat numbers + optional paper; allow “one pays” as primary close.

Confidence: medium.
B3 — Order status / queue

Real practice: Small bars rarely track formal “ready vs served”; status is mental or paper. Staff will skip taps in a rush → stale data. Issue/escalation and bar/kitchen split useful only if a real kitchen exists.

Evidence: General small-venue observation from POS marketing; no detailed Thai bar status-flow studies found.

Verdict on my app: OVERKILL for pure counter bars; OK if kitchen exists.

Suggestion: Collapse to “new → done” by default; make “ready” optional.

Confidence: medium.
B4 — Sold-out items (“86”)

Real practice: Verbal 86 is common; staff still take the order then void. Instant hide is valuable.

Evidence: Universal bar practice; POS 86 features marketed.

Verdict on my app: OK.

Suggestion: Keep auto-move to issue optional/quiet.

Confidence: medium-high.
B5 — Voids, comps, charges

Real practice: Void/comp theft exists but is not the dominant complaint in small owner-operated bars; control is usually trust + end-of-night cash count. Manager PIN realistic only if owner is reachable or pre-approves. Charge types: corkage (ค่าเปิดขวด) exists; cover/otoshi less universal in casual Thai bars; service charge and VAT depend on registration. Spike thresholds are arbitrary.

Evidence: YouTube/TikTok cost videos; corkage explanations; limited hard theft statistics for small bars.

Verdict on my app: OK for audit log; PIN + spike may be friction.

Suggestion: Soften to “reason + optional PIN”; default simple Owner/Staff.

Confidence: medium.
B6 — Payment

Real practice: Fake-slip fraud is documented and ongoing (Pattaya restaurant cases, AI-generated slips, static QR overlays). Many small bars still use static PromptPay sticker or staff phone (free) and visually check. Gateway fees (0.x–1 %) deter some. Guest self-pay is wanted in restaurants more than intimate bars.

Evidence: Thai Examiner, Pattaya Mail, SlipPulse, Kasikorn, Thaiger reports on fake slips; payment-gateway marketing.

Verdict on my app: OK (locked-amount + webhook is strong).

Suggestion: Offer free direct PromptPay fallback + clear fee disclosure.

Confidence: high on fraud; medium on fee tolerance.
B7 — Closing tables / idle tables

Real practice: 10–30 seat bars rarely need automated idle detection; staff know who is still there. Auto-close risk is real if guests step out.

Evidence: No strong Thai bar idle-feature demand found.

Verdict on my app: OVERKILL.

Suggestion: Make idle optional/off by default.

Confidence: medium.
B8 — Staff access & roles

Real practice: LINE is ubiquitous in Thailand; staff already live in it. Full AWS-style groups are overkill for 1–3 people; simple Owner / Manager / Staff + temporary elevation is closer to reality. Temporary “manager tonight” is occasionally useful.

Evidence: LINE OA usage across Thai SMEs; POS role models.

Verdict on my app: OK for LINE login; groups may be OVERKILL.

Suggestion: Ship three fixed roles first; advanced permissions later.

Confidence: medium-high.
B9 — Menu management

Real practice: Price/menu changes are infrequent for core drinks; happy-hour / bucket / BOGO common and often time-based. Modifiers (ice, sweetness) useful for cocktails, less so for beer/shots. Photos help guests.

Evidence: Wongnai/FoodStory menu tools; Thai bar promo culture (buckets, happy hour). Alcohol promo restrictions exist (see C4).

Verdict on my app: OK.

Suggestion: Keep modifier set small by default.

Confidence: medium.
B10 — Bottle keep (ฝากเหล้า)

Real practice: More established in Japanese-style bars/karaoke; some Thai venues offer it with name tags, notebooks or photos. Typical expiry 1–6 months (often 3). Disputes: lost bottle, level arguments, expired disposal. Tracking existence + level is valuable.

Evidence: Japanese bottle-keep sources (widely adopted concept); limited Thai karaoke/bar Facebook posts offering keep; general storage notes.

Verdict on my app: OK / useful differentiator.

Suggestion: Add simple photo + last-seen level.

Confidence: medium (Thai-specific volume lower than Japan).
B11 — Guest memory / AI

Real practice: Good bartenders already keep mental notes. Formal profiles + AI summary can feel creepy to some guests; PDPA consent is required. Simpler free-text notes on a guest card are safer.

Evidence: PDPA principles; no large Thai bar “AI preference” studies found.

Verdict on my app: borderline — useful but risk of creepiness.

Suggestion: Make fully optional and visible to guest; start with free-text only.

Confidence: medium.
B12 — Inventory & cost

Real practice: Most small Thai bars do weekly/monthly bottle counts at best; full pour-cost variance is rare. Recipe deduction is nice-to-have.

Evidence: POS inventory marketing vs real small-operator behaviour.

Verdict on my app: OVERKILL for many; OK if kept dead-simple.

Suggestion: Default to bottle-count only; recipe optional.

Confidence: medium.
B13 — Owner dashboard

Real practice: Owners primarily check total cash + bank at close, top sellers, and voids. Live “tonight” view is valued. Missing common needs: simple cash-drawer reconciliation, shift close summary, basic staff hours.

Evidence: POS report features; owner vlogs.

Verdict on my app: OK core; MISSING shift/cash close.

Suggestion: Add one-page shift close (cash expected vs counted).

Confidence: medium-high.
B14 — Notifications

Real practice: Staff will tolerate a few critical pushes on personal phones; notification fatigue is real in a 1–3 person team during rush.

Evidence: General mobile POS feedback.

Verdict on my app: OK if rate-limited and prioritised.

Suggestion: Critical only (new order, payment, call staff); mute-able.

Confidence: medium.
Part C — Things I may have missed
C1 — Shift open/close & cash drawer

Should be in scope soon. Opening float + end-of-shift cash count vs system expected is basic control almost every owner does (paper or mental).

Confidence: high.
C2 — Tips / service charge

Tips are informal (cash to staff or shared); formal service charge less universal in small counter bars than in hotels/restaurants. Handle as optional add-on or note.

Confidence: medium.
C3 — Tax invoices / receipts

Small bars often issue simple receipts or none; ใบกำกับภาษีอย่างย่อ / full tax invoice required only if VAT-registered (threshold applies). e-receipt growing but not universal.

Confidence: medium (confirm current Revenue Department thresholds).
C4 — Alcohol law constraints

As of late 2026: retail/bar sales generally 11:00–24:00 (afternoon ban lifted permanently May 2026); licensed entertainment venues can run later. Full-day bans on major Buddhist holidays. Age 20. Promotions/advertising of alcohol are restricted under the Alcoholic Beverage Control Act — displaying “happy hour” or discounted alcohol prices on a public QR menu carries legal risk.

Evidence: Royal Gazette announcements 2025–2026, Visit-Thailand / BKKScene / Prachatai summaries.

Verdict: MISSING compliance guardrails.

Suggestion: Time-window menu + optional “promo” flag that can be disabled; never auto-advertise discounts on alcohol.

Confidence: high.
C5 — Offline / bad internet

Thai bars in secondary cities or older buildings experience drops. Most modern POS offer limited offline queue. Cutting offline is a risk for reliability perception.

Confidence: medium.
C6 — Printing

Many small bars still want a paper ticket for the bar or kitchen and a simple receipt. Digital-only is acceptable only if staff trust the screen.

Confidence: medium.
C7 — Reservations / VIP / minimum spend / table charge

Common in larger or tourist nightlife; less so in pure small counter bars. Optional later.

Confidence: medium.
C8 — First 5 minutes of a demo

Owners will ask: “Does it work when the internet dies?”, “How much does PromptPay cost me?”, “Can my staff learn it in 10 minutes?”, “Can I still just write on paper if I want?”, “Does it handle ฝากเหล้า?”, “Is the tax/receipt side covered?”
Top 5 risks (most likely to make real staff stop using the app)

Too many taps or status updates during the 21:00–01:00 rush.
Push notification fatigue on personal phones.
Internet drop with no graceful offline path.
Forced complex roles/PINs when the owner is not present.
Guest QR path that regulars ignore, creating dual workflows.

Top 5 cuts (features with least loss for a 1–3 staff counter bar)

Full idle-table auto-close and notifications.
Fine-grained AWS-style permission groups (keep 3 simple roles).
Per-item AI preference summaries (start with free-text notes).
Full recipe-level inventory variance (keep bottle count).
Mandatory “ready” status step and complex issue branch (collapse to new/done).

Sources used throughout are the web results cited above (Wongnai/FoodStory/Loyverse/Ocha/StoreHub product pages, 2026 POS comparisons, Thai alcohol-law announcements, fake-slip news reports, bottle-keep explanations, staffing/job listings, and owner-content summaries). Where primary Pantip threads or large observational studies were not retrieved, confidence is marked lower and “no source found” is noted.