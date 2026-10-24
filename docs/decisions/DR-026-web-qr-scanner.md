# DR-026 — Web QR scanner for slip checks: `barcode-detector`

| | |
|---|---|
| **Status** | Pending |
| **Raised by** | Cowork · 2026-10-24 (BRIEF-025) |
| **Brief** | BRIEF-025 |
| **Category** | Dependency |

## Context
BRIEF-025 verifies PromptPay slips at the POS. Field wants a **live scan inside the POS page** with a photo as backup, so the cashier never switches to the camera app while holding the iPad (interview 2026-10-24). Browsers can open the camera (`getUserMedia`) without a package, but decoding a QR from video needs one: the standard `BarcodeDetector` API exists in Chrome on Android, **not in iPad / iOS Safari**. Every option keeps the server side identical (`POST /payments/:id/verify-slip` with `{ payload }` or `{ image }`); only how the tablet gets the QR text differs.

npm, checked 2026-10-24: `barcode-detector` 3.2.3 (MIT, 9 releases in 2026, latest 19 Oct; one dependency `zxing-wasm` 3.1.6) · `@zxing/browser` 0.2.1 (MIT, Jul 2026; peer `@zxing/library` 0.23.0) · `qr-scanner` 1.4.2 (2022) and `html5-qrcode` 2.3.8 (2023) unmaintained — not considered.

**Interview (2026-10-24):**
| # | Question | Selected (by KJ) |
|---|---|---|
| 1 | Scan method | Live scan, photo backup (frame from the live view + pick image) |
| 2 | Package | **`barcode-detector`** |

## Options

**A) `barcode-detector` — polyfill of the standard `BarcodeDetector`** *(recommended; Field's pick — the camera loop is a pattern new to the owner)*
1. "สแกนสลิป" → `getUserMedia({ video: { facingMode: 'environment' } })` → `<video>` plays in the checkout modal.
2. Every ~250 ms `new BarcodeDetector({ formats: ['qr_code'] }).detect(video)` — native on Android Chrome; ZXing WebAssembly (`.wasm`, ~1 MB, loaded only on this screen) on iPad Safari.
3. First QR text → stop the camera tracks → `POST verify-slip { payload }`.
- **DB transaction:** none on the client; server as in BRIEF-025 §3b (EasySlip call outside, lock + save inside).
- **Failure → what's left → who cleans:** no QR decoded → loop keeps trying, no EasySlip check spent; camera denied → photo buttons only; wasm fails to load → same as denied (photo path). Camera tracks are stopped by the hook on result / close / unmount — nothing left running.
- Our code: ~40 lines of camera + detect loop. **Extra setup:** `zxing-wasm` fetches its `.wasm` from jsDelivr by default → must be configured to load it from our origin.

**B) `@zxing/browser`**
1. "สแกนสลิป" → `BrowserQRCodeReader.decodeFromVideoDevice(undefined, video, callback)` — the library opens the camera and loops.
2. Callback with QR text → `controls.stop()` → `POST verify-slip { payload }`.
- **DB transaction:** as A. **Failure:** as A (library stops the stream via `controls.stop()`).
- Less of our code; pure JS decoding (slower, pickier with screen glare); library-specific API; adds ~150–250 KB to the scan screen's chunk; no wasm / CDN setup.

**C) No package — photo only (baseline, familiar: upload a file, server calls an API)**
1. "ถ่ายรูป" → frame from the live view (or pick an image) → resize to ~150 KB → `POST verify-slip { image }` → EasySlip reads the QR from the image.
- **DB transaction:** as A. **Failure:** blurry / glare → `SLIP_INVALID` after the upload → retake; **each try may spend an EasySlip check** (their docs don't say whether errors count).
- No dependency; slower per bill (~2–4 s); no free retries.

## Recommendation
**A**, as Field selected: fastest and most glare-tolerant read of a QR on a phone screen, the web-standard API (when Safari ships `BarcodeDetector` natively, the polyfill is removed and our code stays), the most actively maintained option, and free retries before a check is spent. C stays inside A as the backup path.

## If Approved — Locks
- `barcode-detector@^3.2.3` added to `app/frontend/package.json` only (lockfile updated in the same PR); no other scanner package.
- Our code uses only the standard `BarcodeDetector` interface (`formats: ['qr_code']`, `detect()`), imported from the polyfill in one hook (`useSlipScanner`).
- The `.wasm` is served from the web app's own origin (configured in that hook / build) — never a CDN; loaded only on the scan screen.
- Camera tracks are always stopped on result, close and unmount.

---

## Decision — Field only
**Decision:** <Approved: A · Rejected · Approved with change: …>
**Why:** <one or two lines>
**Date:** YYYY-MM-DD
