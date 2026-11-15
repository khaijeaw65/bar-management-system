# Payments — requirements

> Spec-Anchored feature requirements (`docs/features/payments/requirements.md`). Updated in the same PR whenever a brief or DR changes requirements or ACs.
> **As-built record (2026-11-15).** Written after the feature shipped, from the FRD, DRs, approved CDs and merged briefs — it records what was built and why; no new requirement. Field confirms it once; later briefs change it like any feature spec.

| | |
|---|---|
| **Owner** | Field |
| **Status** | Built |
| **Backlog item** | FRD §7 · core vertical |
| **Design** | [design.md](design.md) — as built |
| **FRD** | [`docs/FRD.md`](../../FRD.md) → Payment |
| **UI** | [ui.md](ui.md) · owner: kj |
| **Briefs** | [BRIEF-013](../../briefs/BRIEF-013-payments-core.md) · [BRIEF-024](../../briefs/BRIEF-024-promptpay-id-settings.md) · [BRIEF-025](../../briefs/BRIEF-025-promptpay-slip-verify.md) · [BRIEF-033](../../briefs/BRIEF-033-pos-payment-checkout.md) |

## Why / who

The bar takes the money for a bill: an amount-locked PromptPay QR to the bar's own account, a scanned slip checked with the bank, cash, or a gateway webhook — without staff eyeballing fake slips. Payment settles the bill; closing the table is separate. The Payment Center page is its own feature: [`pos-payment-page`](../pos-payment-page/requirements.md); guest-side paying is in `guest-qr`.

## Flow (user steps)

Business words only.

| Step | User does | Sees / enters (business words + example value) | Rule |
|---|---|---|---|
| 1 | Bartender opens checkout for T3 | "ยอด ฿1,240" + choose PromptPay / เงินสด | Amount is locked for this attempt |
| 2 | PromptPay: guest scans the QR | QR for exactly ฿1,240, expires in 15 min | Comp / void on this bill blocked while pending |
| 3 | Bartender scans the guest's slip | "ยืนยันสลิปแล้ว" | Slip used once; receiver = venue PromptPay; amount ≥ bill |
| 4 | Slip API down / no slip QR | manual confirm with a reason | Logged |
| 5 | Cash | marks paid; change optional |  |
| 6 | Payment settled | table stays open until staff close it | Payment ≠ session close |

## Requirements

Every line cites where it was decided.

| R | Requirement | Source |
|---|---|---|
| R1 | Payment modes per venue: own PromptPay (amount-locked EMVCo QR built on the server) or gateway webhook | DR-014 #6 · FRD §7 |
| R2 | Slip verification (EasySlip first adapter): reference unique, receiver = venue PromptPay, amount ≥ bill; API down / no QR → manual confirm with reason | DR-014 · BRIEF-025 |
| R3 | A payment attempt locks its amount; while pending, comp / void on the bill is blocked and price changes do not alter it | FRD §7 |
| R4 | PromptPay attempt expires after 15 min (cancelled); staff can cancel | CD-03 Q1 · BRIEF-013 |
| R5 | Late webhook for an already-settled bill is ignored and logged | FRD §7 |
| R6 | Settlement never closes the session | FRD §7 |
| R7 | Frontend renders the QR from `qrPayload` as SVG | DR-018 |
| R8 | Checkout is merge only; split-equal deferred | DR-019 |
| R9 | Venue PromptPay ID editable only with `venue:update_payment` (owner) | BRIEF-024 · DR-029 |

## Invariants

Indexed in `docs/features/INVARIANTS.md`; enforcement in `design.md`.

| I | Invariant | Why | Source |
|---|---|---|---|
| I-1 | A gateway transaction is applied once | No double settlement | FRD §7 · CLAUDE.md |
| I-2 | A transfer slip can confirm only one payment | Slip reuse is the main fraud | DR-014 · BRIEF-025 |
| I-3 | While a payment is pending, the bill cannot be voided / comped | Paid amount and bill must not diverge | FRD §7 |

## Acceptance criteria

Delivered and verified in the merged briefs above (each brief's §3 ACs + audit). New ACs are added here by the next brief that changes this feature.

## Not handled (on purpose)

- Split-equal (DR-019)
- Gateway adapter beyond GB Prime Pay (BRIEF-026 not built)
- Printed bill with QR (backlog)

## Open questions

None — built.
