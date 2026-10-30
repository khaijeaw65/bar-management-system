# BRIEF-051 — Web POS: call-staff bell, QR-order cues and sound (C6)

| | |
|---|---|
| **Status** | Ready — Rev 1 approved by Field 2026-10-30 |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | frontend |
| **Revision** | 1 |
| **Depends on** | BRIEF-048 ✅ (`staffCall` on `GET /tables`, `table.staff_called` / `table.staff_call_cleared`, `POST /tables/:seatId/acknowledge-call`) · BRIEF-050 ✅ · BRIEF-032 ✅ (ticket board query + rail Badge) — seed is based on an older local `main`: **merge `origin/main` first** |
| **References** | CD-02 handoff (TopBar NotificationBell "T2 เรียกพนักงาน", table card Badge "ออเดอร์ใหม่ 2") · CD-15 (rail Badge, realtime) · CD-11 (notifications matrix) · DR-014 #11 (POS sound + badge = primary channel) · FRD §13 · BRIEF-048 contracts |
| **Audit depth** | Compact+ (UI; one staff action) |
| **Size** | ~1 day · est. ~600–800 net-new lines incl. tests |

---

## Interview — Selected (by KJ), 2026-10-30
| Q | Selected (by KJ) |
|---|---|
| Bell on POS | Table card badge + top-bar NotificationBell list on every POS page (survives reload — from `GET /tables`) |
| Clearing | "รับทราบ" on the card badge, in the session panel, and in the top-bar list → `POST /tables/:seatId/acknowledge-call` |
| Sound | QR (guest) order + call-staff, two short chimes made with Web Audio (no file, no dependency); top-bar mute toggle per device (localStorage, try/catch); staff-entered orders silent |
| QR order cue | Table card Badge "ออเดอร์ใหม่ n" + Toast "ออเดอร์ใหม่จาก QR · T3 · #007" |
| *(proposed)* "ออเดอร์ใหม่ n" source | Count of `pending` tickets per `seat.id` from the existing ticket-board query (`useTicketBoard`) — same data as the rail Badge, no new API; counts all new tickets on the seat (POS-entered ones go straight past `pending` only if staff accept them) |
| *(proposed)* QR detection | `order.created` payload with `createdBy === null` = guest order (BRIEF-048: `created_by` NULL = customer QR) |
| *(proposed)* Audio unlock | Browsers block audio until a user gesture: the first tap anywhere in the POS after load unlocks the `AudioContext`; until then the mute icon shows "แตะเพื่อเปิดเสียง" |

## 1. Goal
Staff at the POS notice — by sound, badge and list — when a guest orders from the QR or rings the bell, and clear the bell in one tap from wherever they are.

## 2. Scope
### In
- **Tables query live for bells:** `useVenueEvents` (or a new `usePosAlerts` hook mounted in `BoardEvents`) listens to `table.staff_called` / `table.staff_call_cleared` → invalidate the tables query; on `table.staff_called` also play the bell chime + Toast "T3 เรียกพนักงาน · เช็คบิล".
- **Table card (`TableCard.tsx`):** bell Badge (warning tone) "เรียกพนักงาน" + reason ("เช็คบิล" for `bill`, note text for `other`, none → just the label) + time ("เมื่อกี้" / "3 นาทีที่แล้ว"); "รับทราบ" Button (44 px) on the badge — stops the card tap from opening the drawer; also shown on **free** seats (bell lives on the seat). Badge "ออเดอร์ใหม่ n" (accent) when the seat has `pending` tickets.
- **Session panel (`SessionHeader` / `SessionDrawer`):** the same bell row with "รับทราบ" at the top when the seat has a call.
- **Top bar NotificationBell (`PosTopBar`):** bell icon with a count of open calls; popover lists each call "T2 เรียกพนักงาน · เช็คบิล · เมื่อกี้" with "รับทราบ" per row and "ไปที่โต๊ะ" (→ `/pos/tables`, opens that seat's drawer); empty state "ไม่มีการเรียก". Mute toggle next to it ("ปิดเสียง" / "เปิดเสียง").
- **Acknowledge:** `lib/api/tables.ts` `acknowledgeCall(seatId)`; optimistic remove from the tables cache, rollback + Toast on error; the WS `table.staff_call_cleared` keeps every POS in sync.
- **QR order cue:** on `order.created` with `createdBy === null` → order chime + Toast "ออเดอร์ใหม่จาก QR · {seat.label} · #{orderNumber 3 digits}" with action "ดูออเดอร์" (→ `/pos/orders`).
- **Sound (`lib/sound/chime.ts`):** Web Audio — two distinct short tones (order: two rising notes ~0.4 s; bell: three notes ~0.6 s), master gain modest; unlock on first `pointerdown`; respects the mute flag (`localStorage` key `bar.pos.sound`, try/catch, default on); no sound when the tab is muted or audio is locked (no error). Throttle: at most one chime per kind per 2 s (a burst of events = one sound).
- **Tests:** unit (chime throttle + mute + locked context with a fake `AudioContext`; QR detection; per-seat pending count), component (card badges + รับทราบ, top-bar list + mute, drawer row), e2e (MSW + mocked staff socket: guest order → Toast + card badge; bell → card + list → รับทราบ → gone).

### Out (do NOT build here)
- Staff-app (mobile) push / acknowledge (Metee's brief) · customer payment (C5) · kitchen display sounds · per-user sound settings server-side · notification history / log · any backend change.

## 3. Contract
- **Uses:** `GET /tables` (`staffCall`), `POST /tables/:seatId/acknowledge-call`, `GET /tickets` board query, WS `/staff` `table.staff_called`, `table.staff_call_cleared`, `order.created` (BRIEF-048 / 032).
- **Contracts changes:** none. **Backend:** none.
- **Permissions:** acknowledge needs `tables:read` (BRIEF-048) — every POS user has it in S1.
- **Business rules:** one bell per seat, newer call overwrites (BRIEF-048) · bell cleared by acknowledge or visit close · sound + badge = primary channel on the POS (DR-014 #11) · staff-entered orders don't chime.

## 4. Acceptance Criteria
- **AC-1** — Guest rings เช็คบิล on T3 → within a second every open POS shows the T3 card bell badge "เรียกพนักงาน · เช็คบิล", the top-bar count +1, a Toast, and plays the bell chime (sound on).
- **AC-2** — "รับทราบ" from the card, the drawer, or the top-bar list → `POST /tables/<T3>/acknowledge-call` once → badge and list row gone on this POS and on a second POS (WS); the card tap still opens the drawer elsewhere on the card.
- **AC-3** — Reload the POS with an open call → badge and list come back from `GET /tables`; a free seat with a call shows the badge.
- **AC-4** — Guest order (QR) → order chime + Toast "ออเดอร์ใหม่จาก QR · T3 · #007" + T3 Badge "ออเดอร์ใหม่ 1"; staff accept the ticket → Badge gone. A POS-entered order → no chime, no QR Toast.
- **AC-5** — Mute on → no sound, badges/Toasts unchanged; setting survives reload; blocked storage → defaults to on without errors.
- **AC-6** — Before any tap after load, events show badges/Toasts silently and the mute icon reads "แตะเพื่อเปิดเสียง"; after one tap chimes play.
- **AC-7** — Five guest orders within 2 s → one order chime; one bell event and one order event together → one of each.
- **AC-8** — Acknowledge fails (network) → badge restored + Toast "ยังรับทราบไม่ได้ ลองอีกครั้ง".
- **AC-9** — Gates + run proof pass.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-5 – AC-7 | unit (fake AudioContext, fake timers) | `app/frontend/src/lib/sound/chime.test.ts` |
| AC-1 – AC-4, AC-8 | component (Vitest + Testing Library, mocked staff socket) | `app/frontend/src/app/pos/**/_components/*.test.tsx` |
| AC-1, AC-2, AC-4 | e2e (Playwright 1280×800, MSW + mocked socket) | `app/frontend/e2e/pos-alerts.spec.ts` |

Gate commands (all must pass):
```bash
pnpm --filter @bar/frontend lint
pnpm --filter @bar/frontend typecheck
pnpm --filter @bar/frontend test
pnpm --filter @bar/frontend test:e2e
pnpm --filter @bar/frontend build
```
Run proof (real stack, ports BRIEF-046; no `next dev` during e2e): POS at 1280×800 + a phone window (390×844). Phone scans T3 → orders → POS chimes, Toast "ออเดอร์ใหม่จาก QR · T3 · #…", T3 Badge "ออเดอร์ใหม่ 1" → accept → Badge gone → phone rings เช็คบิล → POS chimes, card + top-bar list → "รับทราบ" in the list → gone → mute → ring again (after 60 s) → silent, badge shown. Screenshots in `docs/handoffs/assets/BRIEF-051/`: card with both badges, top-bar list open, drawer bell row, QR Toast, muted state. Sound noted as heard in the handoff (no recording needed).

### Local Sonar scan
- **Required: yes.**
- Approved exclusions: none.

## 6. Constraints
- `docs/rules/frontend.md` Hard Limits; DS tokens only (bell Badge = warning tone, "ออเดอร์ใหม่" = accent); HeroUI v3 (Badge/Chip, Button, Popover, Toast, Switch or icon Button for mute).
- One listener set per POS page (mounted in `BoardEvents`), never per card.
- No new dependency; no audio files; `localStorage` only in the sound-setting helper.
- Thai copy as above; "ไปที่โต๊ะ" opens the seat drawer through the existing tables route state.

## 7. Decision Points (Field Guard)
- **Pre-decided (exact):** files `src/lib/sound/chime.ts`, `src/hooks/usePosAlerts.ts` (or the extension of `useVenueEvents`), `src/lib/api/tables.ts` `acknowledgeCall`; storage key `bar.pos.sound`; the three *(proposed)* rows once Field approves.
- **Likely DRs:** none. If the per-seat "ออเดอร์ใหม่" count needs a backend field → stop, raise a DR.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates (incl. run proof) and evidence; dependencies have completion conditions
- [x] Size within workflow §2
- [x] No unresolved decision blocking the main outcome
- [x] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-30 | Initial Draft (Cowork) — customer side C6 (POS cues) |
| 1 | 2026-10-30 | Ready — Field in session: "approve BRIEF-051 Rev 1 Ready" (incl. the three *(proposed)* rows) |
