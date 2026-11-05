# DEF-13 — Slip Scanner Camera Inaccessible Over Local LAN IP

| | |
|---|---|
| **Defect ID** | DEF-13 |
| **Status** | Open |
| **Surface** | Web POS Checkout (`app/frontend/src/app/pos/tables/_components/checkout/useSlipScanner.ts`) |
| **Severity** | High (Local tablet testing) / Handled in Prod via HTTPS |
| **Discovered** | 2026-11-02 (Hands-on test for Demo) |

---

## 1. Summary
When accessing the POS from a tablet or phone over local Wi-Fi (`http://192.168.1.168:3010`), the slip camera scanner immediately transitions to `denied` state and cannot access the camera.

## 2. Root Cause
- Per W3C Media Capture specifications, `navigator.mediaDevices.getUserMedia` is restricted strictly to **Secure Contexts** (`https://` or `localhost`).
- Plain HTTP on local LAN IPs (`192.168.x.x`) leaves `navigator.mediaDevices` undefined or blocks `getUserMedia`.

## 3. Workaround & Permanent Resolution
1. **Local Dev / Testing Workaround:**  
   - In Chrome on the test device: Open `chrome://flags/#unsafely-treat-insecure-origin-as-secure`, enter `http://192.168.1.168:3010`, and enable it.
2. **Feature Enhancement:**  
   - Add a fallback photo file picker button: `<input type="file" accept="image/*" capture="environment">`. This allows the mobile/tablet browser to snap a photo via native camera or upload from gallery even over insecure HTTP.
3. **Production:**  
   - Already addressed in system architecture: Production POS is deployed over HTTPS on AWS/Cloudflare.
