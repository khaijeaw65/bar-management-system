# BRIEF-062 — Staff app: tables tab, table summary, acknowledge staff call (M5)

| | |
|---|---|
| **Status** | Ready — Rev 1 approved by Field 2026-10-31 (in session) |
| **Implementer** | metee (learning mode — writes ≥ 70 % himself; agent ≤ 20 %, workflow §8) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **PR** | <executor fills> |
| **Affected apps** | mobile |
| **Revision** | 1 |
| **Depends on** | **BRIEF-059 merged** (client, socket, permissions) · **BRIEF-061 merged** (`acknowledgedBy` on the cleared event) — work can start on mocks before 061 |
| **References** | `docs/design/CD-08-handoff.md` (tables·1–8, notifications·c in-app call Toast, R8, R10-2, §6 Strings) · DR-009 (staff app: table list read-only; **never** close / pay / void on mobile) · BRIEF-048 (bell), BRIEF-061 (ack log) · `docs/rules/mobile.md` |
| **Audit depth** | Full (writes a seat state) |
| **Size** | ~8–10 h (evenings) |

---

## 1. Goal
A waiter sees every table at a glance — busy / free, which one is calling — taps a table to see what is still waiting and what was already served, and answers a guest's call with one tap so the others know it's taken.

## 2. Scope
### In
- **Tab โต๊ะ** between ออเดอร์ and อื่นๆ (`LayoutGrid` icon), shown with `tables:read` only.
- **Grid** (tables·1): `GET /tables` (`TableListSchema`), sections โต๊ะ / เคาน์เตอร์ by `kind`, `sortOrder`; header "ใช้งาน n · ว่าง m". Tile: label, guestLabel (1 line, if any), `itemCount` when busy; free tiles muted. States: loading Skeleton (tables·4), empty "ยังไม่มีโต๊ะ" (tables·5), error Alert + "ลองอีกครั้ง" (tables·6), socket down banner (tables·7, M3 banner component).
- **Call-staff** (tables·2, notifications·c): tile with `staffCall` uses the DS call skin + reason text (bill → "เรียกเช็คบิล", other → "เรียกพนักงาน" + note, transfer → "แจ้งโอนแล้ว"); while any call is open, a sticky Toast "{seat} เรียกพนักงาน" with button **"รับทราบ"** → `POST /tables/:seatId/acknowledge-call` → Toast closes, tile back to normal. Live `table.staff_call_cleared` with `acknowledgedBy` → other phones close the Toast and show info Toast "{displayName} รับเรียก {seat} แล้ว"; `acknowledgedBy: null` → close silently.
  - A `transfer` call shows the tile cue only — **no** "รับทราบ" (it is cleared by the POS payment flow, BRIEF-052).
- **Summary sheet** (tables·3) on tile tap (busy seats): `GET /tickets?visitId={id}&status=pending,accepted,ready,issue,sent` → "ยังไม่เสิร์ฟ" (not sent; status chip per ticket) and "เสิร์ฟแล้ว" ("#0044 · เสิร์ฟ 21:22 น." from `sentAt` + items); none waiting → "ไม่มีออเดอร์ค้าง". Footer note "ชำระเงินและปิดโต๊ะทำที่ POS". Tapping a ticket opens the M4 detail. The "สั่งออเดอร์" button is **hidden** until M6 (new order).
- **Live:** refetch tables on `visit.opened`, `visit.state_changed`, `table.staff_called`, `table.staff_call_cleared`, `order.created`, `ticket.status_changed` (one listener set in the M3 socket module); reconnect → refetch.

### Out (do NOT build here)
- Open / close table, payment, QR show, void (POS only — DR-009 "never on mobile").
- "สั่งออเดอร์" / new order (CD-14) → M6 · push → push briefs.
- Any change to `app/backend`, `app/frontend`, `app/packages/contracts`.

## 3. Contract
| Call | Permission | Returns |
|---|---|---|
| `GET /tables` | `tables:read` | `TableList` (`currentVisit`, `staffCall`) |
| `GET /tickets?visitId=…&status=pending,accepted,ready,issue,sent` | `orders:read` | `TicketList` |
| `POST /tables/:seatId/acknowledge-call` | `tables:read` | `{ ok: true }` · idempotent · writes an audit row with the caller (BRIEF-061) |
| WS `/staff` | — | `table.staff_called` (`TableStaffCalledPayloadSchema`) · `table.staff_call_cleared` (`acknowledgedBy` per BRIEF-061) · `visit.opened` · `visit.state_changed` |
- **Contracts changes:** none (uses BRIEF-061's field).

## 4. Acceptance Criteria
- **AC-1** — Given `tables:read`, then the โต๊ะ tab shows; without it, the tab is hidden.
- **AC-2** — Given `GET /tables`, then tiles render in โต๊ะ / เคาน์เตอร์ sections by `sortOrder`, header counts busy / free correctly; loading, empty, error + retry states as §2.
- **AC-3** — Given a seat with `staffCall.reason='bill'`, then its tile shows the call skin + "เรียกเช็คบิล" and the sticky Toast "{seat} เรียกพนักงาน" with "รับทราบ"; tapping it sends exactly one acknowledge call and the Toast closes.
- **AC-4** — Given `table.staff_call_cleared` with `acknowledgedBy = เอ` from another device, then this phone closes the Toast and shows "เอ รับเรียก {seat} แล้ว"; with `acknowledgedBy: null`, it closes silently.
- **AC-5** — Given a `transfer` call, then the tile shows "แจ้งโอนแล้ว" and **no** "รับทราบ" action exists.
- **AC-6** — Given a busy tile, when tapped, then the sheet shows ยังไม่เสิร์ฟ (non-sent tickets) and เสิร์ฟแล้ว ("#n · เสิร์ฟ HH:MM น."), or "ไม่มีออเดอร์ค้าง"; no close / pay / void / สั่งออเดอร์ control exists.
- **AC-7** — Given any of the six live events, then tables refetch once (debounced 300 ms); reconnect → refetch.
- **AC-8 (real device)** — Guest scans a table QR and presses เรียกพนักงาน → phone shows the tile + Toast within ~2 s → phone "รับทราบ" → POS bell clears → `audit_log` row names this staff (query in the handoff). Second phone signed in as another staff shows "{name} รับเรียก … แล้ว". Screen recording in the handoff.
- **AC-9** — Gates pass; mocks mode runs the tab (mock call + acknowledge).

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1–AC-3, AC-5, AC-6 | component | `src/__tests__/app/tables.test.tsx` · `src/__tests__/app/table-summary.test.tsx` |
| AC-4, AC-7 | component (mock socket) | `src/__tests__/app/tables-live.test.tsx` |
| AC-8 | manual | screen recording + audit query in the handoff |
| AC-9 | command | gates + mocks smoke |

Gate commands (all must pass):
```bash
pnpm --filter @bar/mobile lint
pnpm --filter @bar/mobile typecheck
pnpm --filter @bar/mobile test
pnpm --filter @bar/mobile export:check
```
### Local Sonar scan
- Required: yes (always for Metee). Approved exclusions: none.

## 6. Constraints
- `docs/rules/mobile.md`; copy exactly as CD-08 §6 (if §2 differs, CD-08 wins; reason labels for call tiles follow the POS wording from BRIEF-051 if CD-08 has none).
- Reuse M3's socket module and banner; no second socket.
- Permissions only from `/me/permissions`.
- **Learning mode:** Metee writes the screens, the live handling and all tests. Handoff: AI usage Low / Medium / High.

## 7. Decision Points (Field Guard)
- **Pre-decided:** no new package · acknowledge allowed with `tables:read` (Field 2026-10-31) · refetch debounce 300 ms.
- **Likely DRs:** none.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates and evidence; dependencies have completion conditions (059 + 061 merged)
- [x] No unresolved decision blocking the main outcome
- [x] Field explicitly approved this revision (2026-10-31, in session)

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-31 | Initial Draft (Cowork) — M5 per DR-009 (tables read-only) + Field: phone acknowledges calls, logged |
| 1 | 2026-10-31 | Ready — Rev 1 approved by Field in session ("approve 061–065 Rev 1, DR-003 Am. 2, schema docs + .env.example edit") |
