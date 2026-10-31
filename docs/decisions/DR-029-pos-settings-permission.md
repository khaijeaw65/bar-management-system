# DR-029 — Which permission opens `/pos/settings`

| | |
|---|---|
| **Status** | Approved |
| **Raised by** | kj (Claude Code, executor) · 2026-10-31 |
| **Brief** | BRIEF-056 |
| **Category** | Brief deviation |

## Context
BRIEF-056's page map says `/pos/settings` needs `venue:read`. The default พนักงาน policy (BRIEF-053 §3) **includes `venue:read`**. With the map as written, พนักงาน gets the ตั้งค่า rail item and can open the page, which contradicts AC-2 ("rail shows โต๊ะ, ออเดอร์, เมนู only") and AC-4 (`/pos/settings` as พนักงาน → "ไม่มีสิทธิ์"). The brief's own settings rules (read-only form without `venue:update`, payment section with `venue:read_payment`) assume someone can open the page without `venue:update`.

## Options
**A) Map `/pos/settings` to `venue:update`** — AC-2 and AC-4 hold with the default policies (ผู้จัดการ and เจ้าของ open it; พนักงาน does not). A custom role with only `venue:read` / `venue:read_payment` can no longer open the page, so the read-only form branch is reachable only by someone holding `venue:update`.
**B) Keep `venue:read`; change AC-2 / AC-4** — พนักงาน sees ตั้งค่า (read-only venue form, no payment section). Keeps read-only roles useful; floor staff see a settings page they cannot change.
**C) `venue:update` OR `venue:read_payment`** — as A, plus a role that may only view the PromptPay account can open the page.

## Recommendation
A — it is what the acceptance criteria and the rail description say, and the default roles map cleanly (พนักงาน has no back-office page; ผู้จัดการ sees settings with the payment section read-only). Revisit C when a real "bookkeeper" role appears.

## If Approved — Locks
`/pos/settings` is gated by one permission in `src/lib/permissions/pos-routes.ts`; the rail and the route guard read that single entry.

---

## Decision — Field only
**Decision:** Approved: A — `/pos/settings` needs `venue:update`
**Why:** Matches AC-2 / AC-4 with the default policies — พนักงาน has no back-office page; ผู้จัดการ and เจ้าของ open settings (payment section read-only for ผู้จัดการ). Revisit C if a read-only "bookkeeper" role appears.
**Date:** 2026-10-31 · recorded by Cowork on Field's explicit instruction (session: "Yes, approve A")
