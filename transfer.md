# Transfer — AI-Powered Bar Management System (Planning Context)

**Purpose:** Bring a fresh chat up to speed to continue the SAME design/planning work
that a prior chat was doing. This is a working-context handoff, not just a status file.
Read alongside `FRD.md`, `handoff.md`, and the project instruction.

**Last updated:** 2026-09-07

---

## What this project is

Senior project (2 semesters, Computer Engineering, Thailand). A **production-grade
AI-powered bar management system** for small-to-medium **counter bars** in Thailand
(counter seating + some tables). Grading criteria from advisor (อ.สนายุ จินตนาวรรณกุล):
**production-grade + AI integration + solid system design.**

Inspired by real operational pain (The Bear-style guest intelligence) and Thai bar
culture (bottle-keep, PromptPay). NOT fine dining — casual counter bar.

### Team
- ณัฐวัฒน์ จิรกุลประดิษฐ์ (66210096) — Project Lead
- เมธี สิริปาณสาร (630107030019) — Frontend Developer

---

## How to behave in this chat (working style)

The prior chat worked as a **collaborative pair-programmer / senior engineer**, and this
style worked well — keep it:

- **One question at a time.** When the user is thinking through a design decision, don't
  dump 5 questions or a full solution. Ask one, wait, build on the answer.
- **Challenge assumptions constructively.** Push back with reasoning when something is
  off (e.g. "member QR sounds good but the save/retrieve UX kills it") — the user values
  this and often changes direction based on it.
- **Practical over theoretical. Simple before complex.** Flag when something is scope creep
  or over-engineering.
- **The user sometimes feels overwhelmed** — when that happens, slow down, reduce to the
  smallest next step, explain one concept at a time (see how member-QR / device-token /
  session-token were each explained separately with plain examples).
- **Let the user reach conclusions.** Often the best move is to lay out A vs B with
  trade-offs and let them decide, rather than declaring the answer.
- The user pulls in **Grok / GPT / Gemini** for external research, then brings results
  back here to synthesize and filter. Expect this pattern; help write prompts for those
  tools and then filter what comes back against scope.

---

## Where we are

**FRD BASELINED at v1.2** — dual independent review passed (GPT ~98%, Grok 9.2/10); field-validated at 2 live bars; all edge cases + concurrency collisions closed. Requirements phase done — do not reopen the FRD without a genuine new business requirement.

**Design/planning is essentially COMPLETE.** Full feature set mapped, filtered, and locked.

**Deadline: Apr 2027** (exact date TBD, per advisor) — ~8 months runway. Modules are complete; remaining work is fine-tuning + build, not adding features. Extra runway buys depth/polish/testing/thesis quality, NOT scope expansion.
Not yet building. See `handoff.md` for the authoritative current status and semester roadmap.

**Immediate next work:** application architecture → ERD → infra → API (in that order).

---

## Locked decisions (do NOT re-litigate unless user explicitly reopens)

- **ORM: TypeORM** (Prisma ruled out — build-time binary download conflicts with network constraints).
- **IAM:** AWS-style. Users → Groups + individual Policies. Time-bound group membership
  (no separate "shift" concept). **Most-permissive-wins**, no explicit deny (avoids false
  denies mid-service). Permissions computed per-request, cached in Redis, invalidated on change.
- **Identity:** Guest-first, LINE login optional. Invite AFTER first order. Consent before
  save (PDPA — separate data consent from marketing consent, un-pre-checked). Provider-agnostic
  model (LINE now, phone OTP later). **Order ≠ Customer; Visit always created, Customer linked later.**
  Three separate concepts: Authentication / Identification / Recognition.
- **Recognition ladder:** LINE OA button (Sem 2) → LINE login → staff lookup (always works).
- **Member QR: CUT** (bad save/retrieve UX — buried in photo gallery).
- **Delete = anonymize** (null identity fields, delete photo from S3, set `anonymized_at`;
  keep order/payment rows for financial + audit integrity; handle active bottle-keep first).
- **Sessions:** static QR per table, state machine `OPEN→ACTIVE→IDLE→CLOSED`. Opens on first
  order OR staff manual. Idle → notify POS → auto-close if ignored.
- **Orders:** quick-tap mobile UI (3 taps max), status `PENDING→ACCEPTED→READY→SENT` + `ISSUE`
  branch. Drink flows differ: beer bottle / beer draft / cocktail (customizable) / spirits.
- **Inventory:** category A (track precise ml) / B (track loose) / C (don't track). Unit vs volume.
- **Payment:** PromptPay QR (locked amount) + webhook auto-confirm → WebSocket notify. Merge
  or split-equal only (no item-level split). Cash fallback with reason code.
- **Comps/voids:** mandatory reason code + manager PIN. Solo staff self-approve but heavily flagged.
- **Cashout:** blind cash count (staff enters raw count before seeing expected) + dual sign-off.
- **Variance:** expected (recipe × orders) vs actual, per-shift, categories A & B.
- **Bottle keep:** track existence + rough estimate (full/half/low), NOT precise volume.
  Separate from bar inventory. Shows "order from my bottle" when identified.
- **Guest Intelligence:** memory aid for staff, not behavior coach. AI summarizes PREFERENCES
  only — **never behavioral judgments** ("drinks heavily", "usually alone") — PDPA + non-creepy.
- **Analytics:** owner "money view" + manager "action view" + fraud view (comps/voids patterns).
  **No staff performance leaderboard** (surveillance, cut).
- **Notifications:** WebSocket (real-time) + Web Push (backgrounded) = Semester 1 core.
  LINE OA (customer-facing) = Semester 2. (Earlier "WebSocket is Phase 2" was a misread — it's core.)
- **Offline mode: CUT** (strong venue Wi-Fi; sync complexity not worth it; keep basic retry UX only).
- **Frontend: PWA** (not LINE LIFF — LIFF UI breaks, scalability concerns). Installable to home screen.

---

## Tech stack (locked)

Frontend: Next.js PWA + Tailwind · Backend: NestJS + PostgreSQL + TypeORM ·
Cache: Redis (ACL + session) · AI: OpenAI API · Auth: LINE SSO + JWT + refresh rotation ·
Payment: PromptPay + webhook (Omise / GB Prime Pay) · Infra: AWS (ECS/ECR, RDS, S3, ElastiCache) ·
CI/CD: GitHub Actions · Stretch: EKS (only AFTER ECS solid — resume/learning goal, don't jump early).

---

## Still open (not yet decided)

1. Monorepo — Turborepo/Nx vs separate repos?
2. Kitchen POS — single-POS vs separate kitchen display (build config toggle from start).
3. Queue — BullMQ (Redis) vs in-process vs none for Semester 1?
4. WebSocket — NestJS Gateway (socket.io) vs raw ws?
5. Project deadline: Apr 2027 (exact date TBD). Semester split is self-imposed pacing, not a hard gate.
6. Thesis template / required chapters (user getting from program).
7. Architecture altitude to start at: system-level vs module-level.

---

## Roadmap (semester-based — see handoff.md for detail)

**Semester 1:** design/setup (architecture → ERD → infra → API) → foundation (auth, IAM,
menu/inventory) → customer & ordering (session, identity, order, payment, notification).
Target: working vertical slice **order → pay → close**.

**Semester 2:** control & integrity (comps/voids, variance, audit, cashout) → differentiators
(guest intelligence, bottle keep, promotion, analytics) → LINE OA.

---

## Documentation note (for later)

Docs serve two audiences: **dev files** (terse, split-by-topic FRD for Cursor/Claude Code)
vs **thesis** (Thai, Semester 2, template TBD, needs prose rationale + methodology). Don't
conflate. The design **rationale** ("why X over Y") is thesis-gold and lives in planning-chat
history — capture it before it fades. A separate Cowork session will own documentation.

---

## Working principles (carry forward)

- Don't expand scope mid-build — finish core vertical slice first.
- AI does ~40% (boilerplate/CRUD); human owns architecture + integration + edge cases.
- Treat AI-tool velocity as buffer, not scope-expansion room.
- Don't let perfectionist infra (EKS ambition) starve the product.
- Reference `FRD.md` for scope; never silently reintroduce cut features.
- Design philosophy: identity is a benefit the customer chooses, never a gate. Never a single
  point of failure — always a human fallback. Speed first (wet hands, low light, loud, rushed).
