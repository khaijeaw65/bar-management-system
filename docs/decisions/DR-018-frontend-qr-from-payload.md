# DR-018 — Frontend renders the PromptPay QR from `qrPayload`

| | |
|---|---|
| **Status** | Approved |
| **Raised by** | Cowork · 2026-10-21 |
| **Brief** | BRIEF-033 (Q1) |
| **Category** | Dependency · Brief deviation |

## Context
DR-002 #12 planned that the backend returns the PromptPay QR as a base64 PNG and the frontend shows it with a plain `<img>` ("no QR library on the frontend"). BRIEF-013 shipped `Payment.qrPayload` — the EMVCo PromptPay string built in `payment/application/promptpay-payload.ts` (with CRC16) — and no image. Something has to turn the string into a picture.

## Options
**A) Frontend renders `qrPayload` as SVG with `qrcode.react@^4.2.0`** — no backend or contract change; SVG is sharp on any screen; reusable by the customer pay page (CD-07) and the staff app; thermal printers take the payload string directly (ESC/POS `GS ( k`) / one small frontend dependency (~15 kB, no deps).
**B) Backend adds `qrImage` (base64 PNG) to `Payment`** — matches DR-002 #12 / needs its own backend brief, a backend QR dependency and a contract change before BRIEF-033; ~5–10 kB extra on every payment response and event.

## Recommendation
A — the contract already carries the payload, and it keeps BRIEF-033 off a backend dependency. A server-side image is only needed later for emailed / LINE e-receipts; it can be added then from the same payload without undoing A.

## If Approved — Locks
- `app/frontend`: PromptPay QR = `QRCodeSVG` from `qrcode.react@^4.2.0`, value = `Payment.qrPayload`, colours from the `qr-bg` / `qr-ink` tokens. DR-002 #12 superseded. Backend unchanged.

---

## Decision — Field only
**Decision:** Approved: A
**Why:** No backend change on the critical path; the payload is the single source for screen, printer and (later) server-side images.
**Date:** 2026-10-21 · recorded by Cowork on Field's explicit instruction (session)
