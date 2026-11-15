# Stock — requirements

> Spec-Anchored feature requirements (`docs/features/stock/requirements.md`). Updated in the same PR whenever a brief or DR changes requirements or ACs.

| | |
|---|---|
| **Owner** | Field |
| **Status** | Draft |
| **Backlog item** | DR-031 Must #1 (stock items → sale deduction → loss) · build order steps 1, 3, 4 |
| **Design** | [design.md](design.md) — As-is mapped · To-be **proposals** awaiting Field (P# in its *Open questions*) |
| **FRD** | [`docs/FRD.md`](../../FRD.md) → Stock |
| **UI** | [ui.md](ui.md) — from CD-16 + CD-17 rev 2 (approved, snapshot pending) · owner: kj |
| **Briefs** | none yet — sliced at stage 4 of `/new-feature` |
| **Sources** | DR-031 #1 · `docs/research/2026-11-08-feature-interview-notes.md` Topic 1 · CD-16, CD-17 |

## Why / who

Owners and managers lose money on expensive liquor per pour and today have no stock tracking (field visits: "no inventory tracking"). They need to know what is left, what went missing and when to reorder. Replaces nothing — new (FRD §5 inventory text superseded).

## Flow (user steps)

Business words only — no tables, columns or endpoints. Tech (`design.md`) and UI (`ui.md`, Claude Design) both read this table.

| Step | User does | Sees / enters (business words + example value) | Rule |
|---|---|---|---|
| 1 | Owner adds a stock item | "Jameson 700 ml · ขวด · 1 ขวด = 23 shots · category A · มีอยู่ 6 ขวด" | Opening stock is entered once here; later stock only comes in through purchasing |
| 2 | Owner links a menu item to its recipe (optional) | "Jameson highball = 1 shot Jameson + soda" | No recipe = not tracked; food by portion or unit, never grams; category C untracked |
| 3 | Guest order is placed | stock goes down by the recipe ("Jameson 6 ขวด → 5.96") | Deduct on order placed; cancelled before made → returns; void after served → stays out, counted as waste |
| 4 | Stock hits the warning level / zero | "Jameson เหลือน้อย" · at 0 the item is 86'd for new orders | Never cancels orders already waiting; per-item switch |
| 5 | Bartender taps "ยังมีของ" on an 86'd item | "เหลือประมาณ 1 ขวด" (optional count) | Override is always one tap and is logged (who, when, system vs claimed) |
| 6 | Bartender taps "เปิดของใหม่" on a new bottle | "ขวดก่อนขายได้ 19 / 23 shots — หาย 4 (17 %) ควรตรวจสอบ" | Missing above the threshold (e.g. > 10 %) is flagged; comps / voids excluded |
| 7 | Owner counts stock or adjusts with a reason | "นับจริง 4 ขวด · ระบบ 5 · ปรับ −1 (แตก)" | Every adjustment has a reason and is logged |

## Requirements

Every line has a **Source**. Written 2026-11-15 from the approved interview notes and DRs — no new requirement.

| R | Requirement | Source |
|---|---|---|
| R1 | Stock item: name, unit, container + yield, category A/B/C, opening stock, warning level | Field, interview, 2026-11-08 (notes Topic 1 · Stock lifecycle step 1) |
| R2 | Recipe per menu item is optional; no recipe = not tracked; food deducts by portion or unit; category C untracked | Field, interview, 2026-11-08 (notes Topic 1 Q5) |
| R3 | Deduct on order placed; cancelled before made → stock returns; void after served → stays deducted and is recorded as waste | Field, interview, 2026-11-08 (notes Topic 1 Q4) |
| R4 | Low stock: warn at threshold; auto-86 at 0 for new orders only (never cancels waiting orders); auto-restore on receive; per-item switch, default on for unit / container items, off for category B | Field, interview, 2026-11-08 (notes Topic 1 Q3) |
| R5 | Override "ยังมีของ" is one tap with an optional "how many left"; override log (who, when, system qty vs claimed qty); a claim not met shows as unaccounted quantity in the loss report ("ควรตรวจสอบ") | Field, interview, 2026-11-08 (notes Topic 1 Q3) |
| R6 | "เปิดของใหม่" tap per container (bottle, keg, food pack): sold since last open vs expected yield → missing portions; flag above a threshold; comps / voids excluded; sales beyond one container's yield → assume a new container + flag "อาจลืมกดเปิดของใหม่" | Field, interview, 2026-11-08 (notes Topic 1 Q1) |
| R7 | Low stock reaches the reorder list from two places: a tap during service and the checklist at shift close | Field, interview, 2026-11-08 (notes Topic 1 Q2) |
| R8 | Optional weekly / monthly full count by the owner; adjustment with reason (breakage / expired) is logged | Field, interview, 2026-11-08 (notes Topic 1 Q1, Q7) |
| R9 | Stock is received only through Purchasing — no interim receiving form | Field, interview, 2026-11-08 (notes Topic 1 Q6) |

## Invariants

Business rules that must never break. Each one gets an index row in `docs/features/INVARIANTS.md` once `design.md` names its enforcing test or constraint.

| I | Invariant | Why | Source |
|---|---|---|---|
| I-1 | A stock-driven 86 never cancels orders already sent or waiting, and is always one tap to override | Staff must never lose an order because the system count is wrong | Field, interview, 2026-11-08 · DR-031 superseded rule |
| I-2 | Order line and its stock deduction are written together or not at all | Stock and sales must never drift apart | DR-031 (under the hood, transaction boundary) |

## Acceptance criteria

Written when the feature is sliced into briefs (`/new-feature` stage 4), grouped by endpoint, screen or flow.

## Not handled (on purpose)

- Purchasing, suppliers and receiving → `purchasing`
- Reorder list → PO → `purchasing` (Should)
- Gram-level food tracking — too variable
- Bottle-keep pours → `bottle-keep` (no stock deduction, already sold)

## Open questions

Unanswered questions block the listed brief from `Ready`.

| # | Question | Recommended | Blocks |
|---|---|---|---|
| Q1 | Loss threshold default (e.g. 10 %) — venue setting or fixed? | venue setting, default 10 % | first loss brief |
