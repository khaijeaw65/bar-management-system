# Feature interview notes — re-scope (DR-031 / DR-032 / DR-033 Approved 2026-11-08)

> Running log of Field's answers, topic by topic. Source: Field, interview, 2026-11-08. Becomes `docs/features/<f>/requirements.md` after the DRs are approved.

## Stock lifecycle (build order — Q8)
Sales cycle (done): open seat → order → pay → close. Stock cycle (new): purchase order → receive → stock → open new container → sale → low / out → reorder list → purchase order. Side exits: adjustment (breakage / expired), waste (void after served), loss (open-new-container / override).

| Step | Slice | Stage |
|---|---|---|
| 1 | Stock items: name, unit, container + yield, category A/B/C, opening stock | foundation |
| 2 | Purchasing: supplier, purchase order, receive (qty + cost) | stock in |
| 3 | Sale deduction: recipes (menu → stock), deduct on order placed, auto-86, low-stock | stock out |
| 4 | Loss: open-new-container, override log, adjustments with reason, periodic count | stock checked |
| 5 | Reorder list → purchase order (+ ML forecast later) | loop closes |

## Topic 1 — Inventory (functional decisions locked)
| # | Decision |
|---|---|
| Goal | Owner knows what stock is left, what went missing, when to reorder |
| Users | Owner / manager: set up, receive (via purchasing), review loss · Bartender / staff: report low stock, tap "open new container" · System: deducts on sale |
| Q1 loss | **"เปิดของใหม่" (open new container)** tap for any container item, food + drinks (bottle, keg, food pack): sold since last open vs expected yield → missing portions per container; flag above a threshold (e.g. > 10 %); comps / voids excluded; sales beyond one container's yield → assume a new container + flag "อาจลืมกดเปิดของใหม่". Plus optional weekly / monthly full count by owner |
| Q2 low stock | Two entry points: tap during service (urgent) + checklist at close (pre-filled from system stock; staff tick / add; lives in shift close) → one reorder list |
| Q3 auto-86 | Yes: warn at threshold, auto-86 at 0; blocks **new** orders only (never cancels waiting orders — manual 86 still does); one-tap override "ยังมีของ" + optional "how many left"; **override log** (who, when, system qty vs claimed qty) followed up — claim not met → unaccounted qty in loss report ("ควรตรวจสอบ"); auto-restore on receive; per-item switch, default on for unit / container items, off for category B |
| Q4 deduction | On order placed. Cancelled before made → stock returns. Void after served → stays deducted, recorded as waste |
| Q5 tracking | Optional per menu item (no recipe = not tracked). Food deducts by portion or unit (not grams); category C untracked. Changes FRD §5 food rule |
| Q6 receiving | Only through the Purchasing module (no interim form) |
| Q7 | Opening stock in step 1; adjustment with reason (logged) in step 4 |

Superseded: "negative stock never blocks a sale" → "a stock-driven 86 is always one tap to override and never cancels sent orders".

## Topic 6 — Compliance lock (idea logged, discuss later)
- **No-alcohol day mode:** on a no-sale day the venue can still open as a restaurant — alcohol items (and bottle-keep serving) locked on POS / staff app / guest QR; food, soft drinks, mocktails open; optional no-alcohol-day menu / mocktail promo; report ban-day vs normal-day revenue; no-sale day is an ML forecast feature. Needs a manual alcohol flag per menu item.

## Topic 3 — Purchasing (functional decisions locked)
| # | Decision |
|---|---|
| Goal | Stock enters with its real cost (quantity + cost → P&L later) |
| Users | Owner / manager only (IAM `purchasing` permission) |
| P1 intake | Both: PO flow for distributors (order → receive) **and** quick "ซื้อหน้าร้าน" receipt without PO for cash buys (Makro / market), optional receipt photo (S3) |
| P2 approval | None — permission-gated + audit log |
| P3 mismatch | Receive what arrived; PO closes with shortfall noted; no backorder tracking |
| P4 supplier payment | Paid / unpaid + due date per receipt; unpaid shown on owner dashboard; cost flows to P&L |
| P5 reorder → PO | Default supplier per stock item; reorder list → one tap → one PO per supplier |
| P6 sending | Copy / share a Thai PO message now. Later: LINE OA auto-send + "รับทราบ" button (PO → supplier confirmed) on the same message builder |
| P7 cost | Weighted average cost |
| P8 units | Purchase unit + conversion per stock item (e.g. 1 case = 12 bottles); order / receive in cases, stock in bottles |

**LINE OA = venue opt-in setting** (Field, 2026-11-08) — guest features and supplier auto-send both gated by it; copy / share stays the fallback. OA admins log in with their own personal LINE (OA app or OA Manager on the POS tablet) — no second device. Assumed: OA chat mode works with our webhook on (verify at OA setup).

## Topic 2 — Shift & cash close (builds on DR-014 #7; functional decisions locked)
| # | Decision |
|---|---|
| S1 shifts | Sequential shifts, one open at a time per venue (one cash drawer); day / night handover works |
| S2 cash in / out | Pay-in / pay-out entries with reason adjust expected cash; a "ซื้อหน้าร้าน" receipt marked "paid from drawer" creates the pay-out automatically |
| S3 close flow | One flow: (1) open-tab warning (2) blind cash count (3) PromptPay / transfer totals shown by system (4) low-stock checklist (5) summary → manager review |
| S4 open tabs | Close allowed; open tabs carry over to the next shift; payments count in the shift that takes the money. Alcohol after hours is the compliance lock's job (Topic 6, venue's licensed hours) — no bypass |

Three separate cut-offs: business day (06:00, accounting) · alcohol sale hours (legal, Topic 6) · shift close (cash).

## Topic 4 — Expenses + P&L (functional decisions locked)
| # | Decision |
|---|---|
| Goal | Owner sees what the shop really made this month and which items earn the most |
| E1 expenses | Editable default categories (rent, wages, utilities, performer fees, repairs, other); recurring fixed costs auto-created monthly; performer fees (events) and supplier bills (purchasing) flow in automatically |
| E2 cost of goods | Cost of what was sold (recipe × weighted average cost) for tracked items; untracked purchases (ice, garnish) = expense in the month bought |
| E3 P&L | Revenue (after voids) − cost sold − comps (at cost) − waste (at cost) − loss (at cost) = gross profit [both waste and loss are subtracted; loss excludes comps / voids so nothing is counted twice] − expenses by category = net profit; vs last month; margin per menu item |
| E4 wages | **Payroll lite**: pay profile (daily rate or monthly salary + pay period) · attendance (from check-in) · advances = drawer pay-out linked to staff, auto-deducted · pay run = days × rate (or salary) + manual bonus − advances → owner marks paid → wages expense in P&L · owner-only (`payroll` permission). Not included: tax withholding, social security, OT rules, payslips, service-charge sharing / tip pooling. VAT not handled |

## Topic 4b — Staff schedule + check-in (new module; "staff time clock" un-parked)
| # | Decision |
|---|---|
| Boundary | Attendance for pay only — staff performance analytics stays cut (no scores, no ranking) |
| A1 check-in | Staff app scans a QR shown on the POS screen ("เข้างาน / ออกงาน"); anything beyond that is bar workflow, not system. **GPS = optional add-on, only if the advisor asks** |
| A1a / A1b | Rotating QR (~30 s short-lived signed code — a photo stops working) · fallback: manager checks staff in on POS, logged "checked in by manager" |
| A2 roster | Weekly roster by owner / manager; staff see it in the staff app + push reminder; no swap workflow (manager edits) |
| A3 late / no-show | Factual attendance record (scheduled vs actual), owner-only, used for pay |
| A4 missing check-out | Shift close lists "ยังไม่ได้ออกงาน" and checks them out at close; replaces the manual "who worked tonight" tick |

## Topic 5 — Events + reservation (in progress)

**Event types:** ① Ticketed concert (online tickets, door check-in) · ② Live / DJ night (no ticket, linked DR-010 promo) · ③ Private (auto from a whole-bar booking; calendar only). Tickets exist only for type ①.

| # | Decision |
|---|---|
| Goal | Run event nights, charge for them, see whether each event was worth it (report vs same weekday without event, minus performer fee) |
| V2 promotion | Public event page link (no login): upcoming events + "จองโต๊ะ"; reusable later by LINE OA broadcast |
| C1 CMS | Form-based CMS: owner edits event (title, poster, description, date / time, type, ticket price + capacity, performer) + venue profile block (name, address, map, hours, socials); page renders from a fixed template — no page builder |
| T1 ticket sale | Web-first: event page → name + phone + qty → amount-locked PromptPay QR → slip verify → e-ticket page with QR (+ LINE push if venue enabled LINE OA). 15-min hold while paying (expiry job), capacity per event, one price + optional early-bird, refunds manual outside the system |
| T1a anti-bot | All five: (1) Cloudflare Turnstile before a hold — **new dependency → DR** (2) Redis rate limit per IP / phone (3) caps per order + per phone per event (4) 15-min hold auto-release (5) payment + slip check as final gate. Optional: name on ticket + ID check at door (bar workflow) |
| T2 door | Staff app scans ticket QR → valid / already used / wrong event; one use only; fallback name / phone search; report sold vs checked in |
| T3 cover charge | Dropped (type ① = ticket, type ② = promo; manual charge item still possible) |
| T4 table reservation | Kept — for type ② nights and normal days |
| V3 who books | Staff enter bookings (phone / LINE / IG DM). Guest self-booking from the public page = later, nice-to-have (same anti-bot layers) |
| Table bookings | **No deposit, no minimum spend** — held until a **release time** (e.g. until 21:00), then released |
| P-1 scope | Reservation scope = **whole bar** or **selected tables / seats** (no zones — zone is agreed on the call / chat). Whole bar: calendar shows "Private"; public page shows "ปิดรับลูกค้าทั่วไป"; blocks overlapping table bookings + ticket sales |
| F1 booking fee | Whole-bar booking = **booking fee (ค่าเหมาร้าน)** per booking, amount-locked PromptPay link + slip verify; "ยืนยันแล้ว" when paid; **separate revenue, not deducted** from the party bill; cancel → owner chooses refund (manual, recorded) or forfeit (revenue). Table / seat bookings: no fee |
| F2 / P-3 bill | One host bill for the party; no minimum spend |
| P-4 | Open bar / per-head packages parked (breaks stock + margin tracking); manual charge item if needed |
| F3 permissions | New IAM: `event:manage` (owner / manager — events, tickets, CMS, whole-bar bookings) · `reservation:write` (staff default — table / seat bookings) |
| Privacy | No per-guest no-show count; a reservation records only its own status (arrived / released / cancelled) |
| R1 release | **No auto-release.** Two warnings: 5 min before the booking time ("โต๊ะ 5 คุณเอ จะมา 20:00") and 5 min before the release time ("ยังไม่มา — จะถึงเวลาปล่อย 21:00"). Staff check with the guest, then **extend** or **cancel** (with confirmation). Past release time the table shows "เลยเวลาปล่อย" until staff act |
| R2 POS display | From X min before (venue setting, e.g. 60): "จอง 20:00 · คุณเอ · 4 คน · ปล่อย 21:00"; walk-ins can still be seated after a warning (warn, never block) |
| R3 arrival | "ลูกค้ามาแล้ว" opens the seat with name + headcount pre-filled → free guest attach (guest intelligence coverage) |

Topic 5 functional decisions locked.

## Topic 6 — Compliance lock + no-alcohol day mode (functional decisions locked)
| # | Decision |
|---|---|
| Goal | POS follows Thai alcohol law automatically; on no-sale days the bar can still open as a restaurant |
| K1 source | Sale hours = venue setting, default current law (11:00–24:00, afternoon ban lifted 2026), editable to the venue's license. No-sale calendar = yearly preset of major Buddhist holidays (seeded by us), owner can add (election days, local orders) / remove. **⚠ Get advice from the advisor on the legal rules before building** |
| K2 lock | Outside hours / no-sale day: alcohol items hidden on guest QR, greyed with reason on POS + staff app; orders placed before the lock still served, open tabs still paid; **no override**; bottle-keep serving locked too |
| K3 no-alcohol day mode | Auto on no-sale days: POS banner "วันนี้งดขายแอลกอฮอล์ — โหมดร้านอาหาร"; optional "เมนูวันงดขาย" category / mocktail promo shown that day only; warning when creating an event on a no-sale day; report ban-day vs normal-day revenue |
| K4 alcohol flag | Required flag on every menu item and modifier option (e.g. "+ shot"); one-time review list for existing items |

## Topic 7 — Bottle keep from the bill (builds on DR-014 #9; functional decisions locked)
| # | Decision |
|---|---|
| B1 create | At checkout, bottle items show "ฝากขวด?" → one tap → record linked to the order line; guest name + phone (free text if unknown), optional link to customer profile |
| B2 level | No level tracking (DR-014 kept); staff may note "เหลือครึ่งขวด"; the post-it on the bottle stays the truth |
| B3 serving | Staff side now: pick the guest's bottle → pour at ฿0, no stock deduction (already sold); mixers charged normally; compliance lock applies. Guest self-order from bottle stays S2 |
| B4 old bottles | No expiry; "ไม่ได้แตะนาน" filter (no activity for X days) → owner marks finished with reason |

## Topic 8 — Own ML, no LLM (functional decisions locked; architecture in DR-032)
| # | Decision |
|---|---|
| M1 forecast | Usage per stock item per day → reorder list / PO hint ("ควรสั่ง Jameson 4 ขวดก่อนศุกร์") + busy level per night shown on the roster. Inputs: weekday, payday window, holidays, no-sale days, promo, event type, tickets sold so far |
| M2 anomaly | Inputs: voids / comps, void after payment attempt, manual vs verified payments, cash over / short, loss per container, unmet "ยังมีของ" claims, tickets sold vs checked in. Output: owner-only alert list, facts + "ควรตรวจสอบ"; may name the staff involved (fraud view) — never a ranking or score |
| M3 guest intelligence | When a guest is attached (QR login, staff attach, reservation arrival): POS seat panel + staff app show usual order, recommended items, flags, active bottle keep, notes. Venue opt-in + guest consent; never spend |
| M4 ML health | Owner-only page: last run, status, each model's metrics vs baseline (forecast error vs simple average, anomaly precision on planted cases) |

All 8 topics: functional interview complete (2026-11-08). Next: must / should tiering → update DR-031 / DR-032 → approval → feature specs.

---

## Tiers (proposed by Cowork, Field "look good" — confirm when updating DR-031)
| Tier | Module | Size |
|---|---|---|
| Must | Stock items → Purchasing → Sale deduction + auto-86 → Loss (open new container) | L |
| Must | Shift & cash close (+ low-stock checklist) | S |
| Must | Expenses + P&L | M |
| Must | Compliance lock + no-alcohol day mode (after advisor legal advice) | S |
| Must | Events (calendar + promo + CMS public page) + table / whole-bar reservation | M |
| Must | Bottle keep from the bill + staff serving from bottle | S |
| Must | ML: forecast + anomaly + ML health page | L |
| Must | Guest intelligence (recommendation) — project title "with Guest Intelligence" | M |
| Should | Ticketing + anti-bot (Turnstile DR) + door check-in | M |
| Should | Staff schedule + check-in + payroll lite | M |
| Should | Reorder list → one-tap PO per supplier (step 5) | S |
| Later | LINE OA (guest + supplier, venue opt-in), guest self-booking, private-party packages | — |
New IAM permissions: `purchasing`, `payroll`, `event:manage`, `reservation:write`.

## Infra (DR-033 Approved 2026-11-08)
- Drop Vercel: web runs on AWS too. Split: ECS `web` (Next.js standalone) · ECS `api` (NestJS) · ECS `worker` (same NestJS codebase, BullMQ entrypoint) · ECS scheduled task `ml` (Python, daily). RDS · ElastiCache · S3. ALB in front.
- Cloudflare stays for DNS (+ free WAF / DDoS + Turnstile) — Route 53 rejected (no real gain, rewrites DR-001 plan).
- EKS rejected for now: control plane ~$73 / month + nodes ≈ $130–200 / month idle vs ECS Fargate ≈ $30–50; AWS window starts 9 Nov; scope just doubled. Stays the stretch goal — late S2 "migrate same images to EKS" showcase.
- Changes locks: DR-002 (Vercel), CLAUDE.md "one NestJS process", infra.md.

## Rejected in chat (do not re-propose)
- Any LLM (advisor) · real bar sales data (not obtainable) · interim receiving form (Purchasing module instead) · PO approval · backorder tracking
- Auto-release of table bookings (staff must check with the guest) · deposit / minimum spend on table bookings (bars use a release time) · minimum spend on whole-bar bookings (booking fee covers it) · zones (agreed on the call / chat)
- Cover charge · open bar / per-head packages · bottle sets as a module (they are menu items) · bottle-keep level tracking
- GPS check-in (overkill — flag only if the advisor asks) · per-guest no-show count (behaviour judgment)
- LINE OA supplier auto-send now (later; LINE OA = venue opt-in) · Route 53 · EKS now
- Cut: payroll beyond lite (tax, social security, OT, payslips), full accounting, multi-branch, e-Tax, customer credit tab

## Timeline (proposed — confirm in the next session)
| When | Build | Docs / design | ML track |
|---|---|---|---|
| 8–9 Nov | — | DRs, timeline, CD briefs, 10 Nov deck | — |
| **10 Nov** | — | **Advisor 2nd update**: feature map, café-vs-bar, ML plan, ask K1 alcohol-law rules | — |
| 9–20 Nov | AWS on ECS (DR-033) | DR approval → FRD v2 + schema / ERD → CD sessions | synthetic data generator |
| **21–29 Nov** | exam prep — reviews only | Claude Design sessions if time | — |
| 30 Nov – 13 Dec | **exams 3, 4, 8 Dec**; agents build in gaps: stock items, purchasing backend | 14 Dec deck | notebook baselines + metrics |
| **14 Dec** | **Semester 1 project final exam** — show core slice live on AWS + re-scope docs / ERD / designs + ML proof (synthetic data + baseline metrics) + stock / purchasing if done | | |
| 15 Dec – Jan | sale deduction + loss · shift close · compliance · bottle keep | specs just-in-time | Python batch job + `ml_*` tables |
| Feb | expenses + P&L · events + CMS + reservations | | forecast + anomaly live · ML health |
| 1–15 Mar | guest intelligence · Should tier if ahead | CD-11 journeys | recommendation model |
| 15 Mar | **feature freeze** → buffer, report, presentation (Apr) | | final metrics |

## Docs plan (order)
1. Update DR-031 (all interview decisions + tiers) · DR-032 (+ M1–M4) · draft DR-033 infra · DR-034 Turnstile only when ticketing starts → Field approves → one docs PR
2. FRD v2.0 (§5, 8, 10, 11, 12, 14 + new sections Purchasing, Events / Reservation, Compliance, Staff & payroll)
3. `schema.sql` + ERD (new domains Purchasing, Staff / HR, Events)
4. CLAUDE.md / AGENTS.md (protected — Field edits): AI row, frontend hosting, architecture shape · `infra.md`
5. Feature specs (`requirements.md` / `design.md` / `ui.md`) just-in-time per module

## UI design plan (Claude Design, base project per `docs/design/README.md`)
CD-16 stock items / recipes / open new container / auto-86 + override / loss · CD-17 suppliers / PO / receive / cash buy / reorder / copy-share · CD-18 shift close + roster + check-in QR + payroll lite · CD-19 expenses + P&L + ML insights (forecast, alerts, ML health) · CD-20 events + CMS + public event page + tickets + door check-in · CD-21 reservations on POS floor · CD-22 compliance + no-alcohol mode + bottle keep from bill · CD-23 staff app (low stock, open new container, check-in scan, ticket scan, guest intel — Metee) · CD-11 journeys updated last
