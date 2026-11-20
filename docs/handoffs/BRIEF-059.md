# Handoff — BRIEF-059 Staff app: queue on the real API, live updates, card actions (M3)

| | |
|---|---|
| **Implementer** | methee (Claude agent, Cowork session — executor per DR-030) · **Brief revision** 2 · **Date** 2026-11-20 |
| **Branch** | `feat/BRIEF-059-mobile-queue-live-actions` (worktree `.worktrees/BRIEF-059`) |
| **Status** | BLOCKED — code + automated gates green; AC-10 device run, Android screenshots and the local Sonar scan still need Metee's machine (see *Not run*) |

> Committed as S once the BLOCKED rows are closed. After the push, append **Work commit** and **CI run** below (uncommitted — they land in the ship commit H).

**Work commit:** `<S>` · **CI run:** <url>

## Gates
| Gate | Command | Exit | Result |
|---|---|---|---|
| Lint | `pnpm --filter @bar/mobile lint` | 0 | clean |
| Typecheck | `pnpm --filter @bar/mobile typecheck` | 0 | clean |
| Unit / component | `pnpm --filter @bar/mobile test` | 0 | 19 suites, 92 passed |
| Export | `pnpm --filter @bar/mobile export:check` | 0 | Android bundle, 4469 modules (run on x86_64 Linux; the Cowork VM is aarch64 and the Hermes `linux64-bin/hermesc` cannot run there) |
| Sonar | `pnpm sonar` + `pnpm sonar:report` | — | **not run** — needs the local SonarQube + `SONAR_HOST_URL` (missing from `.env`) on Metee's Mac |

Baseline on the untouched branch (`819f197`): lint 0 · typecheck 0 · test 48/48 · export bundling OK (Hermes step as above).
Gates were run on a clean `pnpm install --frozen-lockfile` copy of the worktree, so the Mac's `node_modules` was not touched. No `--no-verify`.

## Acceptance lock
None — BRIEF-059 finishes under Rev 23 (workflow §6 *Finish under Rev 23*: no lock commit, CI `lock` skips it via `LEGACY_BRIEFS`). The brief has no e2e section; the ACs are covered by the component/unit tests below.

## Owner approvals
none

## Builder's choices
| Item | Chosen | Why (inside the bound) |
|---|---|---|
| Toast variants | served = `success` · new order and "{ชื่อ} รับออเดอร์" = `default` (info) · stale 409 / 403 = `warning` · network = `danger` | HeroUI Native Toast has no `info` variant; `default` is the neutral one |
| 409 Toast duration | `persistent` | CD-08 §8: "Toast duration 0 for … 409" |
| 403 Toast copy | the read-only line "บัญชีนี้ดูคิวได้อย่างเดียว — เปลี่ยนสถานะไม่ได้ ให้ผู้จัดการตรวจสิทธิ์" | the brief asks for a warning Toast without copy; this is the CD-08 §6 read-only string |
| Network failure on an action | danger Toast "บันทึกไม่สำเร็จ / สถานะยังไม่เปลี่ยน ตรวจการเชื่อมต่อแล้วกดอีกครั้ง", state unchanged | CD-08 §4 action table, failure column; without it the error would be silent |
| `{items}` in the served Toast | "{n} รายการ · ดูได้ที่สรุปโต๊ะ" (active lines) | same wording as the new-order Toast; CD-08 gives no item-list format |
| Tab badge | count of `order.created` events since the ออเดอร์ tab was last focused/pressed | queue·5; highlight itself fades after 3 s (§7) |
| Buttons before venue/permissions load | hidden until both are known | avoids showing "เสิร์ฟแล้ว" on a kitchen-on table before `/venue` arrives |
| 409 when the refetched ticket is gone from the queue (e.g. already sent) | warning Toast | brief: info only when "now accepted or later" *and* the name is known |
| Socket token refresh | reuses the REST client's single refresh promise (`refreshAccessToken()` extracted in `lib/api/client.ts`) | brief: "refresh tokens once via the BRIEF-022 client"; a failed refresh already routes to login·5 |
| Socket file | `src/lib/realtime/socket.ts` (brief §2) | `mobile.md` says `lib/socket.ts`; the brief path is the exact item |

## Questions the brief did not answer
- `mobile.md` names `lib/socket.ts`, the brief names `src/lib/realtime/socket.ts` — followed the brief; `mobile.md` could be aligned by Field.
- CD-08 §9 says the highlight lasts "until acted on or the user leaves the tab"; the brief Pre-decided "~3 s" — followed the brief.

## Read beyond the Read list
- `app/frontend/src/lib/socket/socket.ts` — to mirror the web's `/staff` URL and `unauthorized` recovery.
- `app/backend/src/modules/notifications/{notifications.gateway,handshake-token}.ts` — to confirm namespace `/staff` and `auth.token`.
- DR-030 — learning-mode lines in the brief are overridden.

## Run proof
Automated only so far: the real-API branch is exercised by component tests that stub the axios transport (`/tickets`, `/venue`, `/me/permissions`, `/tickets/:id/{accept,ready,send}`) and a fake socket.io client (`order.created`, `ticket.status_changed`, drop/reconnect, `unauthorized`).

### Not run — needs Metee (status stays BLOCKED until done)
1. **AC-10 real device** — Android dev build against the dev backend over the ngrok tunnel: POS creates an order → card + Toast on the phone within ~2 s → phone รับออเดอร์ → POS shows "กำลังเตรียม · {name}" → phone เสิร์ฟแล้ว → gone on both → POS and phone tap รับออเดอร์ on one order within 1 s → one wins, the other gets the info Toast. Screen recording in this handoff. (Also closes BRIEF-022 AC-9, deferred here.)
2. **Screenshots** (dark + light, `mobile.md` manual evidence) — `.field-kit/proof/AC2-orders-kitchen-off.png`, `AC3-orders-kitchen-on.png`, `AC5-orders-conflict-toast.png`, `AC6-orders-read-only.png`, `AC7-orders-new-order.png`, `AC8-orders-disconnected.png`.
3. **Sonar** — `pnpm sonar` then `pnpm sonar:report`; paste the summary here; fix findings (an agent may fix them).

## AC check
| AC | Met? | Evidence (test / step) | Screenshot |
|---|---|---|---|
| 1 | ✅ | `orders-actions.test.tsx` AC-1 · `lib/api/tickets.test.ts` | pending (device) |
| 2 | ✅ | `orders-actions.test.tsx` AC-2 (only `accept` + `send` posted) · `next-action.test.ts` | pending |
| 3 | ✅ | `orders-actions.test.tsx` AC-3 · `next-action.test.ts` | pending |
| 4 | ✅ | `seat-line.test.ts` · `orders-actions.test.tsx` AC-4 | pending |
| 5 | ✅ | `orders-actions.test.tsx` AC-5 ×2 (one POST, refetch, info / warning Toast) | pending |
| 6 | ✅ | `orders-actions.test.tsx` AC-6 ×2 · `useVenueAndPermissions.test.tsx` (refetch on foreground) | pending |
| 7 | ✅ | `orders-live.test.tsx` AC-7 ×2 · `socket.test.ts` | pending |
| 8 | ✅ | `orders-live.test.tsx` AC-8 · `socket.test.ts` (exactly one refresh, new token) | pending |
| 9 | ✅ | `orders-actions.test.tsx` AC-9 · `next-action.test.ts` | pending |
| 10 | ⏳ | not run — device | recording pending |
| 11 | ✅ (gates) | gates above · `orders-live.test.tsx` AC-11 (mock mode: no socket, no banner); mock-mode app smoke on a device still pending | — |

## Disclosures
- **Spec vs reality gaps:** none in the API — `/tickets`, `/venue`, `/me/permissions`, WS `/staff` with `auth.token` all exist as the brief says.
- **Compromises:** export:check was run on x86_64 Linux, not on Metee's Mac; the Mac run happens with the device run.
- **Callers affected:** `lib/api/client.ts` refresh logic was moved into `refreshAccessToken()` (same behaviour, now shared with the socket) — BRIEF-022 client tests re-run green. BRIEF-010 tests updated: the พร้อมเสิร์ฟ filter now needs kitchen on, and the station label shows only on split orders (R18, as the brief says).
- **Out-of-scope defects found:** none.
- **Living docs / env keys / migrations:** none. `.env` needs `EXPO_PUBLIC_USE_MOCKS=0` + `EXPO_PUBLIC_API_URL=https://<ngrok>/api` for the device run; `SONAR_HOST_URL` for Sonar.
