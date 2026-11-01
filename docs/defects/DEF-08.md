# DEF-08 — `crypto.randomUUID` Unsupported in Insecure (HTTP / LAN) Contexts

| | |
|---|---|
| **Defect ID** | DEF-08 |
| **Status** | Resolved |
| **Surface** | Customer Web (`app/frontend/src/app/customer`) & POS Web (`app/frontend/src/app/pos`) |
| **Severity** | Critical (Mobile / Tablet LAN testing) |
| **Discovered** | 2026-11-02 (Hands-on test for Demo) |

---

## 1. Summary
Per the W3C Web Cryptography API specification, `crypto.randomUUID()` is strictly restricted to **Secure Contexts** (`https://` or `localhost`). When mobile phones or POS tablets access the application via LAN HTTP (e.g. `http://192.168.1.168:3010`), `crypto.randomUUID` is undefined.

## 2. Symptoms
1. **Customer Pay:** Tapping "สร้าง QR พร้อมเพย์" called `createPayment(crypto.randomUUID())` in `usePayActions.ts`. The uncaught exception caused the mutation to abort, and `PayScreen` fell through to display "QR หมดอายุ" (ExpiredView).
2. **POS Checkout:** Attempting to checkout or generate a new QR on touch tablets threw `crypto.randomUUID is not a function` at `useCheckout.ts:75`.
3. **Customer Cart:** `createCart()` crashed on load with `Uncaught TypeError: crypto.randomUUID is not a function`.

## 3. Resolution
- Created [`src/lib/utils/uuid.ts`](../../app/frontend/src/lib/utils/uuid.ts) with `generateUuid()`, providing an RFC-4122 v4 generator with fallbacks for insecure contexts.
- Replaced direct `crypto.randomUUID()` invocations in `usePayActions.ts`, `useCheckout.ts`, `cart.ts`, `group.ts`, `draft.ts`, and `useMenuSave.ts`.
- Updated `PayScreen.tsx` to handle mutation errors gracefully without prematurely falling into the "QR หมดอายุ" expired state.
