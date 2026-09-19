# QR Ordering Customer Identity — Research & Recommendations

**Context for project:** QR-based ordering system (PWA) for a counter bar in Thailand. LINE SSO available. Goal: handle customer identity/login when a customer scans the table QR to order.

**Core tension:** Identity helps with personalization, bottle-keep tracking, and returning-customer recognition — but must not add friction or feel creepy. Regulars exist (some want personal interaction, some want to order quietly).

---

## 1. Best Practices: Optional vs Forced Login (Conversion Impact & Friction)

**Strong consensus: keep login optional. Make guest the default path.**

- Forced account creation is a major abandonment driver. Baymard Institute and related studies show ~24% of online cart abandonments occur specifically because users were asked to create an account. Password/account fatigue causes ~60% of consumers to abandon processes.
- Successful QR ordering systems emphasize: scan → browse → order in under a minute with **zero account required**. Every extra step (app download, password, forced name) costs orders.
- QR ordering already carries some cognitive load. Adding a login wall multiplies drop-off.
- For bars, QR’s main value is speed and not leaving the seat / not waiting at a crowded counter. Forcing identity undermines that advantage.
- Best model for most F&B (especially bars/pubs): hybrid. QR available as an option alongside staff-taken orders. Guests who want speed/privacy self-serve; those who want interaction still get it.
- Risk of “ghost” remote orders exists with open QR links. Always tie the order to the specific table QR / session.

**Recommendation for this project:**
- Guest is the primary, zero-friction path.
- After (or during) a successful order, lightly offer “Login with LINE to save preferences / bottle-keep / get recognized next time.”
- Never block the order behind login.

---

## 2. What Actually Motivates Customers to Login / Identify Themselves

Real incentives that work in restaurants and bars (especially with regulars):

| Incentive | Why it works | Fit for counter bar |
|-----------|--------------|---------------------|
| **Bottle-keep / personal stash tracking** | High perceived utility for regulars | Excellent primary reason |
| **Immediate tangible reward** | Free drink/side on first login, or points toward next free item | High conversion |
| **Visible progress / recognition** | “Welcome back, [Name] – your usual?” or points progress | Strong emotional pull for regulars |
| **Exclusive / early access** | Member-only specials, first dibs on limited bottles, birthday treat | Good secondary |
| **Seamless re-order of favorites** | One-tap “usuals” or saved customizations | High convenience |
| **Soft VIP / status treatment** | Staff see “regular” flag and can greet accordingly (if guest wants) | Matches the personal-interaction segment |

**Avoid long-term pure percentage discounts** — they train price sensitivity. Free item or points toward a free item feels more generous for the same cost.

**Timing matters:** A soft post-order prompt (“Save this order history + bottle-keep with LINE?”) converts better than a pre-order wall.

---

## 3. Privacy Concerns & PDPA (Thailand) Implications

The Personal Data Protection Act B.E. 2562 (PDPA) treats name, phone number, LINE ID, order history, and preferences as personal data.

### Key obligations (you are the Data Controller)

- **Lawful basis**: Consent is safest for loyalty, preferences, and marketing. Contractual necessity covers the minimum data needed to fulfil the *current* order (table + order details).
- **Notice**: Clear, concise privacy notice *before or at the time of collection*. State purpose, retention period, and rights (access, correction, deletion). Can be a short expandable section or link on the ordering page + LINE consent flow.
- **Data minimisation**: Collect only what is needed. Optional display name for guests is fine; do not force more.
- **Sensitive data**: Avoid biometrics, health data, etc. Bottle-keep is fine when limited to what the guest provides.
- **Retention**: Define and publish periods (e.g. active order history 2–3 years; inactive profiles deleted after X months of inactivity).
- **LINE**: When using LINE Login / Official Account, LINE acts as a processor. You remain the controller and need proper agreements + your own privacy notice.
- **Rights**: Provide an easy way for customers to view or delete their data.

**Practical low-risk approach:**
- Guest path collects almost nothing (table identifier + optional display name).
- Full identity (LINE profile, preferences, bottle-keep history) only on explicit opt-in.
- Always offer a clear “Forget me / Order as guest” option.

---

## 4. How Successful F&B Apps Handle Guest vs Member Flow

Common high-performing patterns:

- **Guest-first + progressive identity**: Order as guest → after success, offer to “Save with LINE / phone for next time.” Some systems create a soft/stealth account from data already given and let the customer claim it later via OTP or LINE.
- **LINE-centric in Thailand**: Brands such as Bar B Q Plaza / Gon, Tao Bin, Starbucks Thailand, and many others use LINE Login + Official Account as the membership layer. Ordering often happens inside a LINE Mini App or a QR flow that lands in a LINE-friendly web experience. No separate app download required.
- **Table-linked + optional identity**: The order is always tied to the table QR (prevents remote ghost orders). Identity is additive for personalization only.
- **Loyalty without forced app**: Apple/Google Wallet passes, phone-number lookup, or LINE OA stamp/loyalty cards achieve higher adoption than dedicated apps.
- **Staff-assisted fallback**: For guests without LINE or who prefer human service, staff can place the order and optionally link a profile later.

---

## 5. LINE Login Adoption Friction in Thailand + Alternatives

**LINE Login has unusually low friction in Thailand.**

- LINE has ~54 million users (well over 80% of the population). It functions as the default messaging, booking, reservation, and loyalty channel for many Thais.
- No new password, no extra app download if the user already has LINE, and profile data can be shared with consent. Conversion is typically much higher than classic email/password or even phone OTP alone.
- Real implementations (Gon / Bar B Q Plaza QR + LINE flow, Tao Bin, etc.) show strong results when menu → order → pay → loyalty lives inside or is tightly linked to LINE.

**Caveats:**
- Tourists, some expats, and a minority of older locals may not have LINE or may prefer not to link it.
- Always keep a pure guest path.

**Good alternatives / complements:**
- Optional phone number + OTP (very familiar in Thailand).
- Session-only display name (so staff can call “Khun [Name]”).
- Post-order “claim this visit” via LINE or phone.
- For bottle-keep: a short code or staff-linked profile that the regular can reference without full digital identity every visit.

---

## 6. Creative Approaches to Recognizing Returning Customers Without Forcing Identification

1. **Device / browser persistence (with consent)**  
   After first successful order or soft opt-in, store a long-lived token (or use privacy-friendly device fingerprinting). Next scan on the same device → “Welcome back — continue as [Name]?” or surface previous favorites. Explicit “Forget me” required for PDPA.

2. **Table + soft identity**  
   Order always starts from the table QR. If the device is recognized and the guest has previously consented, personalize the menu. Otherwise stay fully anonymous. Staff tablet can still show soft “possible regular” signals only when the guest has opted in.

3. **Bottle-keep as the identity hook**  
   Regulars already care about their bottle. Let them enter a short code or scan a personal bottle-keep QR that links their stash without requiring full login every visit. Full LINE profile remains optional for richer history and points.

4. **Staff-assisted recognition**  
   For the “want personal interaction” segment: staff know faces/names. The system can support a quick “link this table to [Regular]” action on the staff side when the guest is known and happy to be recognized.

5. **Wallet pass or LINE OA card**  
   One-time add to Apple/Google Wallet or LINE Official Account → persistent, low-friction channel for points, bottle-keep status, and “welcome back” without re-login every time.

6. **Progressive disclosure**  
   - First visit: pure guest.  
   - Second visit (same device): light prompt “Want us to remember your usuals?”  
   - Only then offer LINE or phone.

---

## Recommended End-to-End Flow

1. Customer scans table QR → fast mobile menu loads (no login).
2. Optional display-name field (for calling the order).
3. Browse → customize → order → pay (or pay at counter).
4. Soft post-order prompt:  
   > Save preferences, bottle-keep & get recognized next time?  
   > [Login with LINE]  [Use phone number]  [No thanks]
5. If accepted → full profile + loyalty + bottle-keep tracking created.
6. Returning recognized device → gentle “Welcome back” + favorites + bottle-keep status, with clear “Order as guest instead” and “Forget me” options.
7. Staff always have a parallel path for interaction-oriented regulars (can take order verbally and optionally link profile).

---

## Design Principles Summary

- **Identity is a benefit the customer chooses, never a gate.**
- Guest path = near-zero data collection + maximum speed.
- LINE Login is the preferred identity provider for Thai regulars (high adoption, low friction).
- Bottle-keep and “remember my usuals” are the strongest natural motivators.
- PDPA compliance is achieved through explicit consent, data minimisation, clear notice, and easy deletion.
- Hybrid service model (QR + human) respects both quiet orderers and social regulars.
- Recognition should feel helpful, not surveillance-like. Always provide an easy exit.

---

*Research synthesized from industry reports on QR ordering conversion, Thailand PDPA guidance, LINE for Business case studies (Gon / Bar B Q Plaza, Tao Bin, etc.), restaurant loyalty program best practices, and privacy-friendly returning-visitor techniques. Current as of August 2026.*
