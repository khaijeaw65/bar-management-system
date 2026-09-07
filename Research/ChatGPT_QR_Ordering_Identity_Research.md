# QR Ordering Identity Strategy — Thailand Counter Bar

## Purpose

This is product and implementation context for building a QR-based ordering PWA for a counter bar in Thailand. It covers the customer-identity decision: LINE login, guest ordering, regular recognition, bottle-keep, loyalty, and privacy.

**Core product principle:** nobody should have to identify themselves to buy a drink. Offer identity only when it unlocks an immediately understandable benefit.

## Context and assumptions

- Customers scan a QR code at a table or counter to open a web/PWA ordering session.
- LINE Login is available and is the initial identity provider.
- A customer may order quietly as a guest, or may want a more personal regular-customer relationship with the bar.
- Identity can improve favorites, one-tap reorders, loyalty, order history, and bottle-keep management, but is not inherently necessary to complete an order.
- Payment can be handled independently from account creation.

## Executive recommendation

Use an **anonymous-by-default, progressively identified** model:

1. QR scan starts an anonymous visit and opens the menu immediately.
2. The guest can browse, add items, order, pay, and see order status without login.
3. Offer LINE connection after an order or when a benefit requires identity (especially bottle keep, loyalty, or saved favorites).
4. Make membership and marketing separate choices.
5. Keep the domain model provider-agnostic so phone OTP can be added later.

Do **not** begin every session with a mandatory “Login with LINE / Continue as guest” choice. It makes a fast ordering tool feel like an account-registration system before the customer has received value.

## Guest vs. forced login

### Why guest-first is the default

QR ordering already has a small funnel: see QR → scan → browser opens → load menu → decide → add items. A login redirect or authorization step adds friction at the point where the customer simply wants another drink.

Forced identity is only justified when identity is essential to fulfilment or legal obligations. It is not essential for a normal bar order. Therefore:

| Model | Recommendation | Reason |
|---|---|---|
| Forced LINE login | Avoid | Blocks quick, private, first-time ordering. |
| Forced phone OTP | Avoid | More friction and no clear value before ordering. |
| Guest with LINE shown immediately | Acceptable | Useful for existing members, but should not dominate. |
| Guest-first, invite after value is experienced | Best default | Connects identity to a concrete benefit. |
| Anonymous session plus optional persistent identity | Best architecture | Separates ordering reliability from customer data collection. |

### Recommended opening screen

```text
BAR NAME

[ View menu ]

Already a member? Continue with LINE →
```

The menu is the primary action. A returning member can still choose LINE without making it a gate.

### Better moment to invite identity

Show the invitation after a successful first order, on receipt/order-status, or when the guest selects a feature that needs it:

```text
Want us to remember this?

• Reorder your favourites next time
• Keep track of your bottle balance
• Save order history and member rewards

[ Connect LINE ]  [ Maybe later ]
```

This frames the choice as a fair exchange rather than data collection as a condition of service.

## What motivates a bar customer to identify themselves

“Personalization” alone is weak. Customers respond to reduced future effort or tangible value.

| Incentive | Value | Implementation note |
|---|---:|---|
| Bottle-keep balance and ordering | Very high | Make this the headline member benefit for regulars. |
| One-tap reorder / saved favourites | Very high | Show a small, editable “Your usual” list. |
| Loyalty points or a clear reward | High | Explain the earn/redeem rule plainly. |
| Member-only events, menu drops, or promotions | Medium-high | Require separate marketing consent for proactive messages. |
| Order history / digital receipts | Medium | Useful, but not a compelling primary hook. |
| Recommendations | Medium | Keep them product-based and transparent. |
| “We know who you are” | Low / risky | Never position identity as surveillance. |

### Bottle keep is the killer incentive

For a regular, this is concrete and urgent:

```text
Your bottle
Macallan 12 — 320 ml remaining
Last opened: 12 Aug

[ Order from this bottle ]
```

It makes account connection useful without requiring an abstract loyalty pitch.

## Thailand and LINE Login

LINE is a sensible first provider for a Thailand-focused bar. LINE Thailand reported 56 million monthly active users in Thailand in June 2024, so its adoption is broad enough that it should feel familiar to many local customers. The main risk is not whether guests have LINE; it is whether they understand why the bar wants identity.

Implementation guidance:

- Use LINE as the only identity option in v1 to minimize decision overload.
- Label it in benefit language: “Connect LINE to save your bottle and favourites,” not just “Login.”
- Ask only for the scopes/data needed by the feature.
- Build a generic identity-link model from day one; add phone OTP later only if customers or operations need it.
- Do not put LINE, phone, and email as equal first-screen buttons. Put alternatives behind “Other ways to identify yourself” when introduced.

## Patterns to borrow from F&B products

Successful ordering and loyalty flows generally treat account creation as an enhancement:

- Let guests complete an order.
- Offer loyalty enrollment at checkout, receipt, or after payment.
- Use lightweight identifiers (often phone/email in other markets) rather than password accounts.
- Explain the benefit at the moment of enrollment: saved payment, faster reordering, points, or history.

For this bar, substitute LINE for the primary lightweight identifier and make bottle keep the differentiator.

## Soft recognition without forcing identity

Authentication, identification, and recognition are separate concepts:

| Concept | Meaning | Example |
|---|---|---|
| Authentication | Prove control of an account | LINE authorization. |
| Identification | Associate a visit with a customer record | Attach the visit to Customer 183. |
| Recognition | Use prior relationship context appropriately | Show saved bottle balance after consented sign-in. |

### 1. Anonymous visit session (required)

On scan, create a random server-side visit session tied to the QR/table context. The customer can use the menu, cart, active tab, order status, and payment without a customer account.

```text
Visit
├── visit_id (random)
├── venue_id
├── table_or_counter_id
├── session_secret / browser session binding
├── started_at / expires_at
└── orders[]
```

### 2. Explicit “remember this device” (optional)

After purchase, invite the customer to save a random pseudonymous device token. On a later visit from the same browser, offer a neutral message such as “Welcome back — reorder a favourite?”

Rules:

- Make this an opt-in, not a hidden default.
- Give an easy “Forget this device” control.
- Do not reveal sensitive history on a shared device.
- Treat this token as personal-data-adjacent tracking for privacy design; pseudonymous is not automatically anonymous.

### 3. Member QR / membership pass (excellent for regulars)

After a customer links LINE, provide a rotating or signed membership QR code. On a later visit they can scan it to identify themselves without a LINE authorization dance. Do not encode raw customer data in the QR; use a short-lived signed token or opaque reference.

### 4. Staff-assisted identification (optional)

For bottle keep, staff may look up a customer only after the customer asks for it (for example, by showing their member QR). Avoid staff guessing or exposing customer information on a public-facing screen.

## Recommended UX flow

```text
QR scan
  → Validate venue/table QR
  → Create anonymous Visit
  → Menu / cart / order / payment
  → Order status + receipt
  → Optional “remember this” / LINE member invitation
  → Link Visit and eligible orders to Customer after authorization
```

### Returning member flow

```text
QR scan
  → Menu opens immediately
  → “Already a member? Continue with LINE” (optional)
  → Member signs in
  → Safe member home: favourites, rewards, bottle keep
  → Order
```

Never display an unexpected personalized greeting or detailed drinking history before a deliberate member action. A quiet customer should be able to remain quiet.

## Architecture principles

### Separate orders, visits, customers, and identities

**Order ≠ Customer.** An order belongs to a visit; a visit may optionally be associated with a customer later.

```text
Customer (optional)
├── customer_id
├── display_name (optional)
├── preferences
├── loyalty_account
└── bottle_keep_accounts

CustomerIdentity (0..n)
├── identity_id
├── customer_id
├── provider: LINE | PHONE | EMAIL
├── provider_subject (unique per provider)
└── verified_at

Visit (always created)
├── visit_id
├── venue_id
├── table_or_counter_id
├── customer_id (nullable)
└── session expiry data

Order
├── order_id
├── visit_id
├── customer_id (nullable denormalized only if useful)
└── payment / fulfilment state
```

### Important implementation decisions

- Use opaque internal IDs; never use a LINE ID as a public identifier.
- Verify LINE authorization server-side and store only the minimum stable subject identifier needed for linking.
- Link a guest visit to a customer only after explicit successful authorization.
- Use short-lived, signed QR/session tokens; do not trust a raw table ID supplied by the client.
- Make QR codes venue-specific and support revocation/replacement.
- Keep a clear audit trail for bottle transactions: bottle account, event type, amount, staff/system actor, timestamp, and correction reason.
- Keep staff notes constrained and role-restricted; they should not become an unstructured behavioral profile.

## Privacy and Thailand PDPA design

This is implementation guidance, not legal advice; have a Thailand-qualified advisor review the final privacy notice, retention policy, and marketing practices.

Once linked to a person, LINE identity, display name, order history, preferences, visit frequency, bottle balance, and phone number are personal data. A persistent device token may also be personal data/personal-data-adjacent when it can single out or reconnect a person or device.

### Practical PDPA checklist

1. **Purpose limitation:** define and disclose each purpose before or at collection.
2. **Data minimization:** collect only the fields needed for that purpose.
3. **Legal basis:** document the basis for each processing activity; do not assume one blanket consent covers everything.
4. **Privacy notice:** use concise Thai-first, accessible language at the identity-connection point, linking to the full notice.
5. **Separate marketing:** joining membership or tracking a bottle must not automatically opt a person into promotions or LINE broadcasts.
6. **Consent records:** where consent is the basis, record the text/version, timestamp, method, and withdrawal state.
7. **Controls:** allow a member to view/edit preferences, unlink identity where feasible, opt out of marketing, and request access/deletion through a clear channel.
8. **Retention:** set purpose-based retention periods. Keep tax/accounting records as required; expire anonymous visits quickly; delete or anonymize stale profile data according to policy.
9. **Security:** apply role-based staff access, encryption in transit and at rest where appropriate, secret management, access logs, and supplier agreements with payment/identity vendors.
10. **No hidden profiling:** do not derive or store judgments such as “drinks heavily,” “usually alone,” or “high-value drinker.” Prefer customer-visible, useful data such as saved favourites and bottle balance.

### Suggested data-purpose map

| Data | Purpose | Product handling |
|---|---|---|
| Visit/session token | Operate the current order | Expire quickly after visit/order support window. |
| Table/counter identifier | Route and fulfil the order | Do not treat as customer identity. |
| LINE provider subject | Link a member account | Store securely; do not expose to staff unnecessarily. |
| Display name | Optional recognition | Let customer edit/hide it. |
| Favourites | Reorder/personalization | Customer-visible and editable. |
| Order history | History, support, rewards | Retain per disclosed policy. |
| Bottle balance/events | Bottle fulfilment/accounting | Maintain auditable ledger. |
| Marketing opt-in | Send promotions | Separate, granular, withdrawable. |

### Product language

Use language that emphasizes choice and benefit:

- “Remember your favourites,” not “Track your preferences.”
- “See your visit history,” not “Track your visits.”
- “Welcome back faster,” not “We identify returning customers.”
- “Member offers (optional),” not pre-ticked promotional consent.

## MVP phases

### Phase 1 — Reliable anonymous ordering

- QR validation and anonymous Visit creation
- Menu, cart, ordering, payment, order status
- Secure table/counter routing
- No account required

**Success measure:** completion rate from menu open to placed order; time to first order; support/staff corrections.

### Phase 2 — LINE membership

- LINE authorization and generic `CustomerIdentity` model
- Link current visit after authorization
- Saved favourites and order history
- Clear privacy notice and consent/version records

**Success measure:** voluntary connection rate after order; return reorder usage; no drop in guest order completion.

### Phase 3 — Loyalty and bottle keep

- Member rewards ledger
- Bottle-keep ledger and staff workflow
- Member QR/pass for fast return identification
- Separate promotions opt-in

**Success measure:** bottle-account accuracy, member return rate, reward redemption, marketing opt-in rate (not forced enrollment).

### Phase 4 — Respectful regular experience

- Safe member landing screen with favourites and bottles
- Controlled staff view with minimum necessary context
- Device-remember option only if it demonstrably improves the experience
- Account/privacy self-service controls

**Success measure:** repeat ordering speed, satisfaction, privacy/support requests, staff usefulness without uncomfortable over-personalization.

## Final product decisions

- **Default:** guest ordering with an anonymous visit session.
- **Primary identity provider in v1:** LINE Login.
- **When to ask:** after value is delivered or when an identity-only feature is selected.
- **Best conversion incentive:** bottle keep, then one-tap reorders/favourites and clear rewards.
- **Secondary provider:** phone OTP later, only if real demand warrants it.
- **Recognition:** opt-in, contextual, and discreet; never surprise the guest with detailed behavioral history.
- **Privacy:** purpose-limited data, transparent notice, separate marketing consent, editable preferences, retention rules, and auditable access.
- **Architecture:** provider-agnostic identities and optional customer association; do not make order creation depend on authentication.

## Reference starting points

- LINE Thailand, [LINE Business / news resources](https://lineforbusiness.com/th/)
- Thailand Personal Data Protection Committee / GPPC, [privacy and compliance resources](https://gppc.pdpc.or.th/)
- Toast, [loyalty product documentation](https://central.toasttab.com/s/article/Toast-Loyalty-Overview-1493012576886)

