# AI-Powered Bar Management PWA — Product Design Review

## Context

This product is a real-world pilot intended for small-to-medium counter bars in Thailand.

### Planned stack

- Next.js PWA
- NestJS
- PostgreSQL
- Redis
- AWS
- OpenAI API
- LINE SSO
- PromptPay QR payment

### Planned features

- IAM with time-bound group membership + per-request Redis permission cache
- QR-based table ordering with session management
- Order queue with status flow: pending → accepted → ready → sent / issue
- Inventory tracking by category: precise ml, loose volume, untracked garnish
- Drink recipes with ingredient substitution
- Guest intelligence: profile, preferences, AI summary from bartender notes
- PromptPay QR + webhook auto-confirm payment
- Offline mode with local queue + sync
- Variance tracking: expected vs actual usage per shift
- 86'd items with real-time menu sync
- Comps and voids with manager approval
- End-of-shift cashout reconciliation

---

# 1. Critical UX Failure Points in a Real Bar

A bar environment is hostile to conventional mobile UX:

- Wet or dirty hands
- One-handed operation
- Low lighting
- Loud music
- Bartenders constantly moving
- Customers standing directly in front of staff
- Multiple orders arriving simultaneously
- Constant interruptions
- Network instability
- Battery/charging constraints
- Staff with different technical ability

## Core UX principle

**The bartender should not have to "operate the software."**

The ideal interaction is:

> See → tap once or twice → continue working.

If the bartender has to stop and think about which screen, menu, or confirmation they need, the UX is already creating friction.

## Avoid tiny controls

Do not design the bartender UI like a conventional SaaS dashboard.

Instead of:

> Order #1827 → Details → Edit → Confirm → Send

Prefer:

```text
┌─────────────────────────┐
│ 🔴  12  Whiskey Coke    │
│     Table 4             │
│     1×                  │
│                         │
│ [ ACCEPT ]              │
└─────────────────────────┘

┌─────────────────────────┐
│ 🟡  13  Margarita       │
│     Table 7             │
│     2×                  │
│                         │
│ [ READY ]               │
└─────────────────────────┘
```

Use:

- Large touch targets
- High contrast
- Minimal text
- Clear status indicators
- Minimal navigation depth

## Haptic and audio feedback

New orders should be noticeable without requiring the bartender to stare at the phone.

For example:

> New order → vibration + subtle sound

The UI should communicate important state changes through multiple channels where appropriate.

---

# 2. Bartender Mobile Information Hierarchy

The bartender screen should answer:

> **"What do I need to do right now?"**

Do not prioritize analytics, inventory, guest profiles, or AI insights on the primary screen.

## Priority 1 — Actionable orders

The first screen should focus on:

1. What is the newest order?
2. What needs attention?
3. Which table/session is it for?
4. How many drinks?
5. Are there special requests?

Example:

```text
🔥 NEW

T04 · 19:42
2 drinks

Whiskey Coke ×2
• Less ice

[ ACCEPT ]
```

## Priority 2 — Problems

Issues should interrupt the normal workflow.

Example:

```text
⚠️ T07

Mojito ×1
Mint unavailable

[ SUBSTITUTE ]
[ 86 ITEM ]
```

Do not bury operational problems inside order details.

## Priority 3 — 86'd / unavailable items

Unavailable products need to be highly visible.

A bartender discovering halfway through an order that an ingredient or menu item is unavailable is one of the worst operational failures.

## Priority 4 — Quick actions

Useful actions include:

```text
+ ADD ORDER
+ COMP
+ VOID
🔎 SEARCH
```

However, do not expose every administrative feature to the bartender.

---

# 3. Order-Flow Edge Cases

The planned:

> pending → accepted → ready → sent / issue

flow is too clean for real-world bar operations.

Real orders are messy.

## Customer orders while a previous order is pending

Example:

```text
Order #101
2 beers

Order #102
1 Margarita
```

The system needs to distinguish between:

- Order
- Order session / tab
- Table
- Guest

A useful model is:

```text
Table
 └── Dining Session
      ├── Order #001
      ├── Order #002
      └── Order #003
```

This allows multiple ordering events within one table session.

## Customer orders twice

A QR customer may:

1. Scan the table
2. Order a drink
3. Wait
4. Scan again
5. Order another drink

These should not necessarily become unrelated table sessions.

## Multiple customers share one table

A single table can have multiple guests.

Potential model:

```text
Table 5
  └─ Session 812
      ├─ Guest A
      │   └─ Order
      └─ Guest B
          └─ Order
```

Even if the first MVP does not expose full guest-level UI, the data model should not prevent it.

## Customer changes their mind

Example:

> "Actually, make that a vodka soda."

Recommended distinction:

- Before accepted → customer can potentially edit
- After accepted → modification request / staff intervention

Do not treat both cases as the same operation.

## Payment succeeds but webhook is delayed

A major PromptPay edge case:

```text
Customer pays
      ↓
Payment provider
      ↓
Webhook delayed
      ↓
Customer sees "Payment pending"
      ↓
Customer pays again
```

The system needs:

- Idempotency
- Payment reconciliation
- Manual verification
- Clear payment states

A duplicated webhook must never create a duplicated payment.

## Webhook arrives more than once

Payment confirmation should be idempotent.

The system should safely process the same payment event multiple times without creating multiple payments or duplicate order transitions.

## Payment and order events arrive out of order

Distributed systems do not guarantee the exact ordering you intuitively expect.

For example:

```text
Payment webhook
      ↓
Payment service

Order update
      ↓
Order service
```

Payment should have its own state machine rather than being tightly coupled to order status.

## Customer closes the browser

Persist important state.

The system should distinguish between:

- Cart
- Submitted order
- Payment
- Payment pending
- Payment confirmed

## Customer loses network during payment

The client needs to distinguish:

> Request definitely was not sent

from:

> Request was sent, but the response is unknown.

The second state is critical because retrying blindly can create duplicate operations.

---

# 4. Data Model Red Flags

## Do not make one order status represent every state

Separate state machines are safer.

### Order

```text
DRAFT
SUBMITTED
ACCEPTED
PREPARING
READY
COMPLETED
CANCELLED
```

### Payment

```text
UNPAID
PENDING
PAID
FAILED
REFUNDED
```

### Fulfillment

```text
WAITING
IN_PROGRESS
READY
ISSUE
```

Avoid a single giant enum such as:

```text
ORDER_STATUS =
PENDING_PAYMENT
PAID
ACCEPTED
READY
SENT
...
```

That becomes difficult to maintain and reason about.

## Preserve operational history

Avoid simply doing:

```text
order.status = "VOID"
```

and losing history.

Instead, retain information such as:

```text
Order
OrderStatusHistory
Void
VoidReason
ApprovedBy
CreatedAt
```

An owner will eventually ask:

> "Why are today's sales lower?"

The system needs to answer that question.

---

# 5. Inventory Model

The idea of:

- Precise ml
- Loose volume
- Untracked garnish

is good.

Do not force every inventory item into the same measurement model.

Use a tracking policy.

Example:

```text
InventoryItem

tracking_mode:
    EXACT_VOLUME
    UNIT
    APPROXIMATE
    UNTRACKED
```

Examples:

### Whiskey

```text
750 ml bottle
Recipe uses 45 ml
```

### Beer

```text
1 bottle
```

### Lime

```text
APPROXIMATE
```

### Mint

```text
UNTRACKED
```

This makes inventory behavior explicit instead of creating fake precision.

---

# 6. Ingredient Substitution

Ingredient substitution is useful but potentially dangerous.

If the recipe says:

```text
Whiskey Coke
45ml Bourbon A
```

but the bartender actually uses:

```text
45ml Bourbon B
```

the inventory system must consume:

**B**, not A.

Do not mutate the recipe to represent what happened.

Record actual usage separately:

```text
Recipe:
    Bourbon A

Actual ingredient:
    Bourbon B

Actual quantity:
    45 ml
```

This is important for accurate inventory and variance tracking.

---

# 7. Variance Tracking

Do not stop at:

```text
Expected = 4,500 ml
Actual = 4,200 ml
Variance = -300 ml
```

An owner will immediately ask:

> "Why?"

Possible explanations include:

- Wastage
- Spillage
- Complimentary drink
- Staff drink
- Incorrect pour
- Substitution
- Stock count error
- Recipe mismatch
- Unrecorded consumption
- Potential loss/theft

Variance investigation should therefore be a first-class concept.

---

# 8. Features That Sound Good but May Fail

## AI Guest Intelligence

Potentially valuable, but not during a rush.

A bartender does not want to read:

> "AI Insight: Customer prefers smoky whiskey and dislikes sweet cocktails."

If the information takes several taps to find, it probably will not be used.

Prefer:

```text
John

⭐ Usually orders:
Old Fashioned

⚠️ Avoid:
Very sweet drinks
```

AI should **compress information**, not create more information.

## AI-Generated Bartender Notes

Do not make staff write long natural-language notes.

Use fast structured inputs:

```text
[+ Note]

🥃 Likes whiskey
🍬 Dislikes sweet
🔥 Likes strong drinks
```

AI can summarize those later.

## Advanced Analytics

Useful eventually, but not an MVP priority.

Owners care first about:

> How much money did I make?

> What sold?

> What's wasting money?

> Which items are almost out?

> How much cash should I have?

Those are more valuable than sophisticated AI analytics.

---

# 9. What a Bar Owner Will Immediately Notice Is Missing

## Daily sales summary

A simple owner dashboard should quickly show:

```text
TODAY

Sales       ฿18,420
Orders          127
Customers       83

Cash         ฿6,200
PromptPay     ฿9,840
Other         ฿2,380
```

The exact metrics can evolve, but the owner needs a fast answer to:

> "How did the bar do today?"

## Cash drawer reconciliation

The end-of-shift workflow should support:

```text
Opening cash
+ Cash sales
- Refunds
- Cash payouts
= Expected cash

Actual cash
= ฿X

Variance
= -฿300
```

This is immediately understandable to an owner.

## Staff accountability

Owners will ask:

> Who voided this?

> Who gave this comp?

> Who changed this order?

> Who adjusted inventory?

Sensitive operations should retain:

```text
actor
timestamp
reason
approval
```

## Staff shift management

If variance is tracked per shift, shifts need to be explicit.

A useful lifecycle is:

```text
Staff
 ↓
Shift
 ↓
Opening
 ↓
Transactions
 ↓
Closing
```

Otherwise "per shift" becomes ambiguous.

## Price changes

If an owner changes:

> Mojito ฿180 → ฿200

existing orders must not suddenly become ฿200.

Historical order lines should snapshot the price:

```text
unit_price = 180
```

The product/menu price can later become:

```text
unit_price = 200
```

Historical transactions must remain unchanged.

## Tax and service charge

The pricing model should leave room for:

```text
Subtotal
Service charge
VAT
Discount
Total
```

Do not hard-code:

```text
Total = sum(items)
```

Even if the initial pilot does not need sophisticated accounting.

---

# 10. Emergency / Degraded-Mode UX

A highly valuable feature is an explicit emergency/offline mode.

Imagine the Wi-Fi dies during a rush.

The system should not simply become:

> "Please wait..."

Instead:

```text
⚠ OFFLINE

Orders will sync automatically.

[ CONTINUE ]
```

The bartender keeps working.

After connectivity returns:

```text
✓ 7 orders synced
⚠ 1 order needs attention
```

This is likely more valuable operationally than another AI feature.

---

# 11. Offline Mode Architecture

Do not think about offline support simply as:

```text
if offline:
    save locally
else:
    API
```

A stronger approach is an operation log.

Example:

```text
operation_id
device_id
created_at
entity_id
operation_type
payload
sync_status
```

The server can then safely process:

```text
operation #ABC
```

multiple times without creating duplicate effects.

This is especially important for:

- Orders
- Payments
- Voids
- Inventory adjustments
- Menu changes

Offline sync should be designed around **idempotent operations**.

---

# 12. Recommended MVP Scope

The planned feature set is ambitious. For a real pilot, prioritize operational reliability over feature count.

## Tier 1 — Must work flawlessly

### Customer

```text
QR
 ↓
Menu
 ↓
Cart
 ↓
Order
 ↓
Payment
```

### Bartender

```text
New order
 ↓
Accept
 ↓
Prepare
 ↓
Ready
 ↓
Complete
```

### Owner

```text
Sales
 ↓
Payments
 ↓
Voids / Comps
 ↓
Shift close
```

### System

```text
Offline
 ↓
Sync
 ↓
Audit log
 ↓
Inventory deduction
```

## Tier 2

- Inventory variance
- 86'd items
- Ingredient substitution
- Staff permissions

## Tier 3

- AI guest intelligence
- AI summaries
- Advanced analytics
- Predictive inventory
- Recommendations

---

# 13. Architecture / Domain Thinking

A high-level architecture could look like:

```text
                    ┌──────────────┐
                    │ Customer PWA │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │    API       │
                    │   NestJS     │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
     ┌────▼────┐      ┌────▼────┐      ┌────▼─────┐
     │ Orders  │      │ Payment │      │Inventory │
     └─────────┘      └─────────┘      └──────────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
                    ┌──────▼───────┐
                    │ PostgreSQL   │
                    └──────────────┘
                           │
                    ┌──────▼───────┐
                    │    Redis     │
                    └──────────────┘
```

Conceptually, think in terms of business events:

```text
OrderSubmitted
OrderAccepted
OrderItemSubstituted
OrderReady
OrderVoided
PaymentConfirmed
PaymentFailed
InventoryConsumed
InventoryAdjusted
ShiftOpened
ShiftClosed
```

This approach helps with:

- Auditability
- Offline sync
- Payment reconciliation
- Inventory tracking
- State transitions
- Troubleshooting

---

# 14. The Biggest Product Insight

The killer feature probably is **not AI**.

It is:

> **"The bar can keep operating even when everything is chaotic."**

If a bartender can process ten simultaneous orders without thinking about the software, the product has real value.

AI then becomes the intelligence layer on top:

```text
                 AI
        ┌─────────────────┐
        │ Guest insights  │
        │ Summaries       │
        │ Recommendations │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │ BAR OPERATIONS  │
        │                 │
        │ Orders          │
        │ Payments        │
        │ Inventory       │
        │ Shifts          │
        │ Audit           │
        └─────────────────┘
```

A reasonable project effort split would be approximately:

**70% operational foundation**

- Orders
- Payments
- Inventory
- Offline mode
- Audit
- Permissions
- Shift management

**30% AI / intelligence**

- Guest summaries
- Recommendations
- Natural-language insights
- Analytics assistance

The real pilot will probably expose operational problems before AI problems.

A bar owner is much more likely to say:

> "Why did this order disappear?"

or:

> "Why does this payment say unpaid? The customer already paid."

or:

> "Why is my whiskey inventory wrong?"

than:

> "Your AI isn't sophisticated enough."

Those operational questions determine whether the bar continues using the system after the pilot.
