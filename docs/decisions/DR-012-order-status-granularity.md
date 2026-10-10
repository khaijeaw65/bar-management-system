# DR-012 — Order status granularity: per order, per item, or per station ticket

| | |
|---|---|
| **Status** | Approved — Field · 2026-10-10 |
| **Raised by** | Field via Cowork · 2026-10-10 |
| **Brief** | none yet — found during the CD-08 retrofit (staff app detail); affects BRIEF-012 (orders), CD-06/07 (customer QR status), CD-15 (POS issues) |
| **Category** | Flow/Architecture · Data |

> Related: DR-011 "counter seats skip READY" (approved 2026-10-10).

## Context
FRD §6 defines the state machine **per order** (`PENDING → ACCEPTED → READY → SENT`, branch `ISSUE`) and CD-08 D3 made status per order: one button moves the whole order. `schema.sql` also has `order_item.status` (`pending | preparing | ready | cancelled`), and the rev-1 CD-08 detail drew a chip on every item ("รอ / กำลังทำ / พร้อม") that simply mirrored the order.

Two problems surfaced in review (Field, 2026-10-10):
1. **The label "กำลังทำ" doesn't fit every item.** A bottle of Leo isn't "being made". `ACCEPTED` really means "someone has taken this order" (CD-08 R14 shows the acceptor's name: "… · บีม").
2. **Item chips repeat the order chip.** Under D3 every item moves with the order, so per-item chips add noise without information. The only state that differs per item is `cancelled` (set at the POS).

Against that: **item-level progress is useful for the customer** (CD-06 QR status: "how is my order doing?"). The concern on the other side is accuracy: per-item status is only correct if staff tap per item, and at peak time (Friday 22:00) those taps are the first thing skipped. A stale "still being made" on a drink the guest already holds is worse than no status.

Known limitation of per-order status: a mixed order (beer + fries) only becomes READY when everything is done, so the beer waits for the fries, or staff serve it and tap later.

## Options
**A) Per order only (current D3)** — staff: one tap per step for the whole order; item chips hidden except "ยกเลิก". Customer sees order steps (ส่งแล้ว → ร้านรับแล้ว → พร้อมเสิร์ฟ → เสิร์ฟแล้ว).
*Pros:* simplest, no schema/API change, status stays accurate. *Cons:* mixed orders wait for the slowest item; no item detail for the customer.

**B) Per item for prepared items only (food, cocktails)** — new menu flag (e.g. `menu_item.requires_prep`); those items get their own ready tap; the order is READY when all prepared items are ready.
*Pros:* detailed customer view; mixed orders can be served partly. *Cons:* schema change + new endpoint (`POST /order-items/:id/ready`) + "partly ready" UI and rules; more taps per order; accuracy depends on staff discipline at peak.

**C) Per order, split into station tickets at placement** — FRD §6 "Kitchen routing": when an order is placed, items are split by menu tag into separate tickets (drinks → bar, food → kitchen), each with its own order-level status.
*Pros:* staff keep one tap per ticket; beer never waits for fries; customer sees "เครื่องดื่ม · พร้อมเสิร์ฟ / อาหาร · ร้านรับแล้ว" (near item-level). *Cons:* needs a station/routing tag on menu items and a ticket concept (one `order_record` per station, or a grouping key); best paired with a kitchen display (later phase).

Independent of the option (label only, no data change): rename the `accepted` label from "กำลังทำ" to **"รับแล้ว"** in the DS StatusChip, CD-00 §2, CD-02/04/08/14/15, BRIEF-010 filters and FRD §6 wording.

## Recommendation
**A for Semester 1, with C as the planned path** when food volume or the customer QR screen needs it. A keeps the core slice (order → pay → close, gate 8 Nov) simple and accurate; C later adds most of B's customer value without per-item taps, and A does not block it. Apply the "รับแล้ว" label now. Decide the customer-facing view (CD-06/07) together with this DR.

Open questions for the discussion:
- Does the customer QR status (CD-06/07) need item detail in S1, or are order steps enough?
- For C: one `order_record` per station ticket, or one order with a station grouping key?
- If every item of an order is cancelled at the POS, which status ends the order? (`order_status` has no `cancelled`; raised in CD-08 R12.)

---

## Decision — Field only
**Decision:** Approved with change: A + C, both in Phase 1, **before the 8 Nov gate**.
- Status stays **per order** (one tap per step); no per-item status taps. Item chips hidden except cancelled.
- **C — station tickets at placement:** items split by menu station tag (drinks → bar, food → kitchen) into **one `order_record` per station**, linked by a shared **`placement_id`**. Each ticket runs the existing order state machine.
- Station = existing `menu_item.kitchen_tag`, values **`bar` | `food` only** (`both` dropped); every non-charge item has exactly one.
- **Charge-type items** go on their own ticket created as `sent` (never in the queue, still on the bill).
- **Always split** — no venue setting; a one-station bar sees both tickets on the same screen.
- Add **`order_status.CANCELLED`** (terminal) — auto-set when every item of the order/ticket is cancelled.
- Customer QR (CD-06/07) shows order/ticket steps + **cancelled items struck through**; no per-item progress.
- Rename the `accepted` label "กำลังทำ" → **"รับแล้ว"** everywhere (DS StatusChip, CD-00 §2, CD-02/04/08/14/15, BRIEF-010 filters, FRD §6).
**Why:** Per-item taps fail the "faster than walking to the POS" test for a 1–2 staff bar; station tickets keep one tap per ticket while stopping drinks waiting on food.
**Date:** 2026-10-10

---

## Amendment 1 — `accepted` label = "กำลังเตรียม" (Field, 2026-10-10)
Supersedes the label in the Decision above: the `accepted` label is **"กำลังเตรียม"**, not "รับแล้ว" — everywhere the Decision lists (DS StatusChip, CD-00 §2, CD-02/04/08/14/15, BRIEF-010 filters, FRD §6); customer side (CD-06/07) reads **"ร้านกำลังเตรียม"**. With the acceptor name (CD-08 R14): "กำลังเตรียม · ชื่อ" (name truncated at 360 px).
**Why:** "เตรียม" covers every item (taking out a bottle, mixing, cooking), and guests already know "ร้านกำลังเตรียม" from delivery apps; "รับแล้ว" was exact for staff but said little to the guest. Label only — no data or API change.
**Date:** 2026-10-10 · recorded by Cowork on Field's explicit instruction
