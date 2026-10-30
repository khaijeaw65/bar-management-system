# Audit — BRIEF-049 Web: customer QR — check-in, menu, item sheet, cart, send (C3)

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-30 |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-30 |
| **Branch / commit** | `feat/BRIEF-049-customer-order-ui` · **S = `c9b1b5b`** · handoff `885bbb1` · merge of `main` (048) `bf058ee` · seed `fc6ea91` |
| **Depth** | Full (customer-facing order path) |
| **Brief revision** | 1 |
| **Recommendation** | **CHANGES REQUIRED** — evidence only: the brief's real-stack run proof stops before the POS window and J2, and has no screenshots (Must fix 1). No code change required. |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1 | ✅ | `useWelcome`: one `POST /customer/sessions` per scan (query key dedups strict mode, no refetch), PATCH only when a name was typed, `router.replace('/customer/menu')`; `CustomerShell` loads `GET /customer/session` | |
| AC-2 | ✅ | invalid QR → `ScanProblem` (no retry); `guarded()` turns any `GUEST_SESSION_INVALID` into one expired signal → `GuestExpired`; `client.ts` skips the staff refresh for `/customer/*` (+ test) | |
| AC-3 | ✅ | `hasOptions` picks half `Drawer` vs full `Modal`; required/max rules from shared `lib/order/catalog.ts`; `customerBody` sends no `orderedByName` (DR-028) | e2e J1 on MSW |
| AC-4 | ✅ | `sendFailure` → `ITEM_UNAVAILABLE` flags lines; `blocked` until removed; e2e J2 on MSW | real-stack J2 → Must fix 1 |
| AC-5 | ✅ | key lives in cart state (and storage) until 201 → `reset` makes a new key; network retry reuses it; e2e checks two requests, same key | after a 409 the same key is reused with a new body — fine because BRIEF-048 cancels the key on a failed order |
| AC-6 | ✅ | promo price without strikethrough; `statusLabel` / `windowNote` greyed + time; search + chips; e2e 360×780 no horizontal scroll | |
| AC-7 | ✅ | `cart-storage.ts`: every access in try/catch, zod-parsed load, memory fallback; tests incl. throwing stub | key by seat — Finding 3 |
| AC-8 | ✅ | `git mv` to `lib/order/`, POS imports only; additive `reset` action; POS tests unchanged + green per handoff | |
| AC-9 | ⚠️ | lint / typecheck / unit 205 / e2e 29 / build per handoff; **Cowork re-ran frontend `tsc --noEmit` on `885bbb1` (exit 0)**; Sonar required → BRIEF-049 files 0 open after fixes | run proof incomplete → Must fix 1 |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Routes / file paths = brief §7 | ✅ | `/scan/[qrToken]`, `/customer/layout`, `/customer/menu`, `/customer/cart`, `lib/order/*`, `lib/api/customer.ts` |
| No new dependency · tokens only · HeroUI v3 | ✅ | `no-arbitrary-values` lint passes per handoff |
| `localStorage` only in the cart helper | ✅ | only other use is the pre-existing `pos/reports` tab |
| POS behaviour unchanged | ✅ | moved logic, imports updated, one additive reducer action |
| Guest auth isolation on the client | ✅ | `/customer/*` never triggers `/auth/refresh` |
| 047 audit notes | ✅ | `expiresAt` not used by the UI; unavailable variants / options rendered disabled |
| Thai copy from CD-06 · targets ≥ 44 px | ✅ | `min-h-11` on options, full-width primary CTAs |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Must fix (evidence) | Medium | **Current:** brief §5 run proof is "J1 on the phone → POS (`/pos/tables`, second window) shows T3 active and the order with 'สั่งโดย ต้น' → mark one item sold out on the POS → J2 from the phone; screenshots (welcome, menu, item full sheet, cart, 409 line)". The handoff proves scan → nickname → order #1 on the real stack, and states the POS window and J2 were **not** done and no screenshots were attached. **Updated:** on the same SHA, real API: (a) POS `/pos/tables` shows T3 active and the order with "สั่งโดย ต้น", (b) mark an item in the phone's cart sold out on the POS → send from the phone → 409 line → "ลบออก" → send → 201, (c) attach the 5 screenshots under `docs/handoffs/assets/BRIEF-049/` and list them in the handoff. No code change expected; S stays `c9b1b5b` unless (a)/(b) find a bug. |
| 2 | Suggestion | Low | **Current:** a `429 RATE_LIMITED` (second order within 10 s of a successful one) falls through `sendFailure` to `network` → "เชื่อมต่อไม่ได้ · ลองอีกครั้ง". **Updated (this brief if cheap, else C4):** map `RATE_LIMITED` to its own notice "กรุณารอสักครู่ก่อนสั่งอีกครั้ง" (message from the server) — the retry path already works. |
| 3 | Suggestion | Info | **Current:** cart storage key is `bar.customer.cart.<seatId>` because `CustomerSession` has no session id (047 contract). **Updated:** accept for S1 — the key resets to a fresh idempotency key after every 201, and a new session on the same seat and phone is almost always the same guest. If Field wants it per session later, add `id` to `CustomerSession` in a backend brief. |
| 4 | Suggestion (backend follow-up) | Low | **Current:** the customer menu sends categories that have no guest items (e.g. `ค่าบริการ`, charge only) → an empty chip "ยังไม่มีเมนูในหมวดนี้". **Updated:** `CustomerMenuService` drops categories with no remaining items — one filter; carry in C4's backend touch or the next `/customer` backend change. |
| 5 | Info | — | Variants / options with `isAvailable: false` render disabled (POS-consistent). Deactivated variants (BRIEF-038) therefore show greyed forever rather than hidden; fine for S1, revisit with Finding 4. |
| 6 | Info | — | Size ~2.1k lines incl. tests vs ~900–1,100 estimate — UI tests ≈ 45 %; sizing note for C4. |

## Recommendation to Field
The code is in good shape: one POST per scan, guest 401 isolated from staff refresh, the idempotency key held until 201, POS logic moved without behaviour change, Sonar clean on the new files. What's missing is the half of the run proof that shows the phone and the POS working together — that is exactly what you will demo, so it's worth the 10 minutes.

**Next command:** `execute BRIEF-049` (fix Must fix #1 — evidence only; optionally Suggestion #2).

---

## Re-audit 1 — 2026-10-30 (Cowork)
| | |
|---|---|
| **Reviewed** | `798a7d0` (screenshots, no code change) · code S still `c9b1b5b` |
| **Result** | **CHANGES REQUIRED** — new Must fix 2 (found in the screenshots); Must fix 1 partly closed |

### Must fix 1 (evidence) — partly closed
- ✅ Screenshots in `docs/handoffs/assets/BRIEF-049/`: `1-welcome`, `2-menu`, `3-item-full-sheet`, `3a-item-required-missing`, `4-cart`, `5-cart-409-line` (real API, 390 wide). They show: table label + nickname, greyed promos with start time, required-option badge, cart "สั่งในชื่อ ต้น", sold-out line "หมดแล้ว — ลบออกเพื่อสั่งต่อ" with "ลบออก" and the send button disabled.
- ⚠️ Not in the repo yet: (a) the POS `/pos/tables` view of T3 with "สั่งโดย ต้น", (b) J2 finishing — "ลบออก" → send → 201. The Cowork shell can't reach the dev database to check. **Updated:** one more screenshot each (`6-pos-t3-order.png`, `7-after-remove-201.png` — the success Toast is enough) **or** the trimmed proof lines written into the final handoff at the PASS commit.

### Must fix 2 (new) — Medium
**Current:** the full-screen item sheet (`SheetShell`, `Modal size="full"`) has no close control — screenshot `3-item-full-sheet` shows only the title, options and the add button. On a phone there is no backdrop to tap and no Escape key, so a guest who opens a cocktail and changes their mind can only add it or press the browser back button (which leaves the menu). CD-06 §7: "close IconButton on the photo".
**Updated:** add a close `Button isIconOnly` (`aria-label="ปิด"`, 44 × 44, `ti-x` / Lucide equivalent used in the app) in the full sheet header (or on the photo, per CD-06), wired to `onClose`; component test: open a full sheet → tap ปิด → sheet gone, cart unchanged. The half sheet (`Drawer`) closes by backdrop / swipe — add the same button there only if it is one line.

### Suggestions (re-audit)
| # | Severity | Current → Updated |
|---|---|---|
| 7 | Low | **Current:** in the dark theme an **unselected** radio shows no ring (screenshot 3: "ดับเบิ้ล", "ปกติ" look like plain text). Same HeroUI `Radio` as the POS, so a theme token issue, not this brief's markup. **Updated:** DS follow-up — raise the unselected control border token contrast for dark (Field's DS edit, CD-15 R4 family); not blocking. |
| 8 | Info | Two "เพิ่ม … แล้ว" Toasts stack over the cart header after navigating (screenshot 4). Optional: shorter Toast timeout on the menu, or dismiss on route change. |

**Next command:** `execute BRIEF-049` (fix Must fix #2; add the two evidence items for Must fix #1).

---

## Re-audit 2 — 2026-10-30 (Cowork)
| | |
|---|---|
| **Reviewed** | **S = `ff7869c`** (close button + test; screenshots refreshed, `7-after-remove-201.png` added) |
| **Result** | **CHANGES REQUIRED** — evidence only (Must fix 1 remainder). Must fix 2 closed. No code change expected. |

- ✅ **Must fix 2 closed.** `SheetShell` adds a `CloseButton` (`isIconOnly`, `size-11` = 44 px, `aria-label="ปิด"`, `lucide-react` `X` — already a dependency, used elsewhere) in both the full `Modal` and the half `Drawer` header, wired to `onClose`. New component test opens a full and a half sheet, taps ปิด, dialog gone, cart unchanged. Screenshot `3-item-full-sheet` now shows the ✕ top right.
- ⚠️ **Must fix 1 — still open, narrowed:**
  - (a) **POS view missing:** no `6-pos-t3-order.png` (or text) showing T3 active on `/pos/tables` with the order line "สั่งโดย ต้น".
  - (b) **201 not visible:** `7-after-remove-201.png` shows the menu with an older "เพิ่ม ไฮบอลมะนาวโซดา แล้ว" Toast over the header — not the send result. The proof of J2 finishing is the "ส่งออเดอร์แล้ว · #00x" Toast or the order on the POS.
  - **Updated (either way is enough):** one POS screenshot of T3's order panel after the J2 send — it proves (a) and (b) together (order with "สั่งโดย ต้น", จินโทนิค only, no ไฮบอล) — **or** the success-Toast screenshot + the POS screenshot. No code change; S stays `ff7869c`.
- Note (Suggestion 8 confirmed): stale add-Toasts stay on screen across the send; dismissing Toasts on route change would make the success Toast the only one — optional, cheap.

**Next command:** `execute BRIEF-049` (Must fix #1 evidence: POS screenshot of T3's order after the J2 send).

---

## Re-audit 3 — 2026-10-30 (Cowork)
| | |
|---|---|
| **Reviewed** | S = `ff7869c` (no code change) + `docs/handoffs/assets/BRIEF-049/6-pos-t3-order.png` (untracked, in the checkout) |
| **Result** | **PASS** — no Must fix open |

- ✅ **Must fix 1 closed.** `6-pos-t3-order.png` (POS `/pos/tables`, real API): T3 "มีแขก" with orders #1–#4, every line "สั่งโดย ต้น" (#1 2× น้ำเปล่า; #2–#4 1× จินโทนิค · ก้อนใหญ่), **no ไฮบอลมะนาวโซดา line** — the J2 send after "ลบออก" reached the POS as a guest order (`opened_via` QR, the phone's nickname snapshot). Together with `5-cart-409-line.png` this is the full phone → POS proof the brief asks for.
- Packaging: the PASS commit must include `6-pos-t3-order.png` (it is untracked) alongside this report, the final handoff (list all 8 screenshots, Sonar, deviations) and state.
- Open Suggestions carried to the next briefs: #2 `RATE_LIMITED` notice (C4), #4 hide empty guest categories (C4 backend touch), #7 dark-theme unselected radio ring (DS, Field), #8 dismiss Toasts on route change (C4).

**Next command:** `execute BRIEF-049` (PASS commit + PR — include `docs/handoffs/assets/BRIEF-049/6-pos-t3-order.png`).
