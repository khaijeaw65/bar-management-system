# Audit — BRIEF-031 Web POS: order for a table (menu → cart → send)

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-22 |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-22 |
| **Branch / commit** | `feat/BRIEF-031-pos-order-entry` · `bd3778f` (audited work commit; handoff `4896335`) |
| **Depth** | Full (core flow — order placement) |
| **Brief revision** | 1 |
| **Recommendation** | **CHANGES REQUIRED** — Must fix 1 (duplicate-order path, needs the Rev 2 rule below) · Must fix 2 (JSX limit) → **PASS** (Rev 2 `1342d41` + Suggestions 3 / 4 `69bc334`) ← Field makes the final call |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence (test / file) | Note |
|---|---|---|---|
| AC-1 | ✅ | `cart.ts` `cartReducer` add/merge by signature, `undo` removes only the last add; `ItemSheet` required / `maxSelect` · `useCart.test.ts`, `ItemSheet.test.tsx`, `CartPanel.test.tsx` · run proof: ช้างดราฟต์ ×2 merged, โอลด์แฟชั่น sheet blocked until น้ำแข็ง chosen | |
| AC-2 | ✅ | `MenuTile` inert + "หมด" / "โปร · เริ่ม HH:MM" · `MenuPanel.test.tsx` | |
| AC-3 | ⚠️ | one POST, key from `createCart`, retry reuses key — tests + e2e + run proof (one UUID key, 201, drawer `#2` ฿500.00) | Correct for an **unchanged** cart; Finding 1 |
| AC-4 | ✅ | `sendFailure` → `unavailable` by `variantId`, lines to top, struck, excluded from preview, send blocked · test + e2e · run proof screenshot (สิงห์ดราฟต์) | Server frees the key on failure (`orders.controller.ts` → `idempotency.cancel`), so editing then resending with the same key is safe here |
| AC-5 | ✅ | `closed` locks the cart · test | |
| AC-6 | ✅ | `LeaveDialog` · test | |
| AC-7 | ✅ | `lib/utils/money.ts` integer satang; 3 × ฿33.33 = ฿99.99 · `money.test.ts`, `useCart.test.ts` | DR-002 Amendment 1; 028 S4 + 030 S3 closed via `cmpMoney` / `lowestMoney` |
| AC-8 | ✅ | `MenuPanel.test.tsx` loading / error / no-result / disconnected; charge tiles hidden | |
| AC-9 | ✅ | G1: lint / typecheck / test 76 / e2e 9 / build exit 0 · run proof on 3000 / 3001 as Field, 5 screenshots | |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | **Must fix** | **High** | Duplicate order after a lost response. `cart.ts`: after `notice: "network"` the cart stays editable (`add` / `qty` / `remove` clear the notice); `IDEMPOTENCY_KEY_REUSED` → reducer makes a **new key** and shows "ส่งอีกครั้งได้". Server side (`IdempotencyService`): a key is `REUSED` only when an earlier request with that key **succeeded** (stored body) or is still running — failures are released by `cancel()`. **Scenario:** send → server commits order #5 → response lost → cashier adds one item → send → `409 REUSED` → new key → send → order #6 contains everything again → table billed twice. The Alert "ส่งซ้ำจะไม่เกิดออเดอร์ซ้ำ" is only true for an unchanged cart. Root cause is the Rev 1 §2 rule for `REUSED` (brief wording), not the implementation. **Updated (needs Field's OK as Rev 2):** (a) after a network failure the cart is **frozen** to the attempted body — add / qty / remove / undo / name changes disabled; actions = "ส่งอีกครั้ง" (same key, same body → server replays 201 if it had committed) or "ทิ้งตะกร้า"; (b) `IDEMPOTENCY_KEY_REUSED` keeps the key, locks the cart and shows Alert "ออเดอร์นี้อาจถูกส่งไปแล้ว — ตรวจที่โต๊ะก่อนสั่งเพิ่ม" + "กลับไปที่โต๊ะ" (no resend from this cart); (c) `409 ITEM_UNAVAILABLE` / `403` keep today's behaviour (editable, same key — the server released it). New test: network failure → edit controls disabled → retry sends the identical body + key. |
| 2 | Must fix | Low | `OrderScreen.tsx` returns 43 JSX lines (handoff). **Current:** over the `frontend.md` hard limit (40). **Updated:** extract the cart column (or group the props) so the return is ≤ 40 — tiny, rides with Finding 1. |
| 3 | Suggestion | Low | HeroUI logs "aria-label or aria-labelledby prop is required" for the item-sheet radios in e2e. **Updated:** pass `aria-labelledby` on the `RadioGroup` (the group heading id) — not blocking. |

Checked and fine: unavailable lines are never auto-removed and a later menu sync never clears a 409 flag; preview + body both exclude flagged lines; charge items hidden; `useDisconnected` reuse; drawer entry (primary in empty state, secondary in meta row); `apiPost` sends `Idempotency-Key`; no cart state in Zustand.

Note (not a finding): 1,942 insertions vs ~650–800 estimate (~2.5×). Accepted size (Q2).

## Recommendation to Field
The order screen is good and the run proof is convincing. One real money bug: if a send's response is lost and the cashier edits the cart before retrying, the current rule can create the order twice. It came from my Rev 1 wording for `IDEMPOTENCY_KEY_REUSED`, so it needs your OK on the corrected rule (Finding 1 a–c) as Rev 2. Small change: freeze the cart after a network failure and never mint a new key on `REUSED`.

**Next command:** Field approves BRIEF-031 Rev 2 (Finding 1 rule) → Cowork writes Rev 2 into the checkout → `execute BRIEF-031` — commit Rev 2 exactly as written, fix Must fix #1 and #2 → Cowork re-audits.

## Evidence Coverage
- Reviewed work SHA: `bd3778f`
- Sources/diff inspected independently: `763d201..bd3778f` — `cart.ts`, `usePlaceOrder.ts`, `useCart.ts`, `CartPanel.tsx` (notice copy), `lib/utils/money.ts`, `lib/api/orders.ts`; backend `IdempotencyService` (`begin` / `finish` / `cancel`) and `orders.controller.ts` cancel-on-failure; handoff + screenshots
- Tests run or independently inspected: **inspected, not re-run** (no pnpm on the Cowork shell). Independent gate evidence = GitHub `ci` on the PR head
- Written uncommitted; the executor commits it unchanged at PASS (H). Pre-merge summary must verify S..H contains evidence-only changes (§7).
- Repeated blocker: none

## Sonar (local scan)
- Handoff Sonar section present: yes — not run, optional

## Re-audit — 2026-10-22 · `1342d41` (Brief Rev 2)
| | |
|---|---|
| **Brief** | `a168621` "Rev 2 — Field-approved" = the text Cowork wrote (committed unchanged) |
| **Scope** | `bd3778f..1342d41` — `cart.ts`, `usePlaceOrder.ts`, `CartPanel.tsx` (+ test), `OrderScreen.tsx` / new `OrderColumns.tsx`, `useCart.test.ts`, Sonar fixes in `MenuItemRow`, `QtyStepper`, `useMenuSync`, `page.tsx` |

| # | Result | Evidence |
|---|---|---|
| Must fix 1 | ✅ Resolved | `editsLocked(state) = pending \|\| closed \|\| notice !== null` guards add / undo / qty / remove / rememberName → cart frozen after `network` and `reused`. `reused` no longer mints a key (reducer only sets `notice`); `usePlaceOrder.send` refuses when `notice === "reused"`; footer shows only "กลับไปที่โต๊ะ" for `reused`, "ส่งอีกครั้ง" + "ทิ้งตะกร้า" for `network`. Tests: "retries a failed send with the same key and body…", "a network failure can discard the frozen cart", "a reused key locks the cart and sends nothing further". AC-10 met. |
| Must fix 2 | ✅ Resolved | Cart column moved to `OrderColumns.tsx`; `OrderScreen` return ≤ 40 lines (handoff). |
| Suggestion 3 | open | aria-label warning — unchanged, not blocking. |
| Sonar (required, Rev 2) | ✅ for this brief's files | Handoff: scanned `1342d41`; issues in files 031 adds / changes fixed (nested ternaries, `localeCompare`, `cartReducer` complexity split into helpers, `fieldset` stepper, `find`, read-only props) and re-scan shows none left there. Gate still **ERROR** for two reasons outside this brief — `new_coverage` 0 because `sonar-project.properties` has no coverage report path, and 18 new violations in files 031 doesn't touch (`setup.ts`, `SessionDrawer.tsx`, backend order / payment / menu / seed). Written reasons given; no exclusions or "won't fix" added. Accepted per §5. |
| New suggestion 4 | Low | A menu sync can flag a line while the cart is frozen after a network failure; "ส่งอีกครั้ง" then does nothing (send refuses flagged lines) and the Alert says "ลบออกก่อน" while removing is locked. Safe (no duplicate possible), just confusing. **Updated:** in that state show "ทิ้งตะกร้า" as the only action with the network copy, when 033 or a polish pass touches the cart. |

**Field, 2026-10-22 (session): fix Suggestions 3 and 4 in this brief before the PASS commit.**
- **S3 →** item-sheet `RadioGroup`(s) get `aria-labelledby` = the group heading's id (or `aria-label` on the group component HeroUI warns about); e2e runs without the "aria-label or aria-labelledby prop is required" warning.
- **S4 →** cart frozen after a network failure **and** a line flagged unavailable: the Alert shows the network title with body "มีรายการหมดระหว่างรอ — ส่งตะกร้านี้ซ้ำไม่ได้ ทิ้งตะกร้าแล้วสั่งใหม่", "ส่งอีกครั้ง" is hidden, "ทิ้งตะกร้า" is the only action. Unit test in `useCart.test.ts` / `CartPanel.test.tsx`.
- Gates + Sonar re-run on the new commit; Cowork re-checks that commit only.

**Result: PASS on the Must fixes** — final PASS after the S3 / S4 commit is re-checked. Follow-ups for Field: Sonar coverage config (tooling) and the 18 pre-existing issues (cleanup brief or per-module as each is next touched).

**Next command:** superseded by the re-check below.

## Re-check — 2026-10-22 · `69bc334` (Suggestions 3 / 4, Field instruction)
| # | Result | Evidence |
|---|---|---|
| S3 | ✅ | `ItemSheet.tsx`, `ModifierGroup.tsx`, `NameChips.tsx`: each group's `Label` gets a `useId()` id and the `RadioGroup` / chip group `aria-labelledby` points at it. Handoff: e2e 9 passed with no "aria-label or aria-labelledby prop is required" log; `ItemSheet.test.tsx` asserts the accessible names. |
| S4 | ✅ | `CartPanel.tsx`: `notice === "network" && blocked > 0` → Alert "ส่งออเดอร์ไม่สำเร็จ / มีรายการหมดระหว่างรอ — ส่งตะกร้านี้ซ้ำไม่ได้ ทิ้งตะกร้าแล้วสั่งใหม่"; "ส่งอีกครั้ง" rendered only when `!blocked`; "ทิ้งตะกร้า" always shown in the network state. Tests in `CartPanel.test.tsx` + `useCart.test.ts`. |
| Gates | ✅ | test 81 / e2e 9 / lint / typecheck / build exit 0 (handoff, on `69bc334`) |
| Sonar | ✅ for this brief's files | re-scan of `69bc334`: no open issues in files 031 adds / changes; gate ERROR only for coverage config + the same 18 pre-existing issues elsewhere (unchanged reasons) |

Diff `1342d41..69bc334` touches only the order screen components and their tests — no money, idempotency or API change, so the Rev 2 review stands.

**Final result: PASS** — zero Must fix, zero open suggestions in this brief.

**Next command:** `execute BRIEF-031` (PASS commit + PR) — audit + handoff + state on the branch first, then PR, merge when `ci` is green.
