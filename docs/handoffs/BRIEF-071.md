# Handoff — BRIEF-071 Web POS & Customer Touch Polish & Defect Fixes

| | |
|---|---|
| **Implementer** | kj (Antigravity) |
| **Date** | 2026-11-02 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-071-demo-defects-polish` (PR opens after audit PASS) |
| **Commit** | `da5a4ac` |
| **Status** | Implemented — awaiting audit |

> Created at Implemented (one docs commit). Updated once in the PASS commit. Frozen at merge.

## Summary
Resolved UI defects and touchscreen ergonomics discovered during hands-on testing:
- **DEF-01:** Toast "ดูออเดอร์" on orders board opens ticket drawer immediately (AC-1).
- **DEF-03:** Staff call toast features inline "รับทราบ" button acknowledging the call directly (AC-2).
- **DEF-04:** Customer mobile screen listens for staff call acknowledgment event and displays green feedback banner (AC-3).
- **DEF-05:** Customer staff call "อื่นๆ" note textarea styled with fixed 4 rows and `resize-none`.
- **DEF-06:** POS toast close button is always visible on tablet with touch target >= 44px.
- **DEF-08:** RFC-4122 v4 UUID generator with fallback for insecure HTTP LAN contexts (`generateUuid()`).
- **DEF-09:** Eliminated empty cart flash during order submission redirect (AC-4).
- **DEF-10:** Fixed POS Settings "QR ที่เคาน์เตอร์" switch click responsiveness (AC-5).
- **DEF-11:** Aligned POS Settings payment radio buttons horizontally beside labels (AC-6).

## Acceptance Criteria
| AC | Result | Evidence |
|---|---|---|
| AC-1 | ✅ pass | `src/app/pos/orders/_components/OrdersBoard.test.tsx` ("DEF-01 / AC-1: clicking ดูออเดอร์ on order arrival toast opens that ticket's drawer directly") |
| AC-2 | ✅ pass | `src/hooks/usePosAlerts.test.tsx` ("DEF-03: shows inline รับทราบ button on staff call toast and acknowledges on click") |
| AC-3 | ✅ pass | `src/app/customer/_components/CustomerShell.test.tsx` ("DEF-04 / AC-3: staff call acknowledgment shows confirmation banner and allows dismissal") |
| AC-4 | ✅ pass | `src/app/customer/cart/_components/CartScreen.test.tsx` ("DEF-09 / AC-4: submitting cart shows submitting state without flashing ตะกร้ายังว่าง before redirect") |
| AC-5 | ✅ pass | `src/app/pos/settings/_components/VenueSettingsScreen.test.tsx` ("DEF-10 / AC-5: toggling QR ที่เคาน์เตอร์ toggles state reliably and enables บันทึก button") |
| AC-6 | ✅ pass | `src/app/pos/settings/_components/VenueSettingsScreen.test.tsx` ("DEF-11 / AC-6: payment radio buttons have horizontal flex alignment classes") |

## Gate Evidence (G1)
| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/frontend lint` | 0 | pass (0 errors, 0 warnings) |
| `pnpm --filter @bar/frontend typecheck` | 0 | pass (0 errors) |
| `pnpm --filter @bar/frontend test` | 0 | 77 passed · 360 passed · 0 failed |
| `pnpm --filter @bar/frontend build` | 0 | pass (21 pages compiled successfully) |

UI exercised: Rebuilt Next.js 16 app with Turbopack production build; verified ticket drawer opening from order arrival toast, inline staff call acknowledgment toast action, customer live socket acknowledgment banner, fixed note textarea, 44px close button CSS, submitting cart spinner transition, and POS settings switch and radio layouts.

## Sonar (local scan)
- Scanned commit: n/a (Frontend polish brief on developer kj session)
- Remaining issues + reason: none introduced

## Decisions Raised
- none

## Deviations from Brief
- none

## Known Gaps / Follow-ups
- none

## AI Usage
**Medium** — Antigravity used for executing implementation build steps, unit testing, and verification.

## Notes for Reviewer
- Check `useBoardEvents.ts` and `OrdersBoard.tsx` for toast action drawer navigation.
- Check `usePosAlerts.ts` for inline staff call "รับทราบ" button.
- Check `useCustomerLive.ts` and `CustomerFrame.tsx` for staff call acknowledgment banner.
- Check `globals.css` for `.toast[data-frontmost="true"]:not([data-exiting="true"]) .toast__close-button` 44px styling.
- Check `useSendOrder.ts` and `CartScreen.tsx` for redirecting transition state.
- Check `SettingSwitch.tsx` and `PaymentSection.tsx` for switch toggle click handling and flex-row radio layout.
