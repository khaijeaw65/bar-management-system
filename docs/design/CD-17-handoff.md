---
id: CD-17
title: Back office + POS — เปิดของใหม่ · loss report · override log · count · adjust
revision: 2
status: approved   # R2–R6 accepted by Field 2026-11-15 · source snapshot pending (before stock brief)
approved_by: Field
approved_on: 2026-11-15
canvas: https://claude.ai/artifact/HhGhQQe3XrQWouuqAfVSjZ
canvas_version: 1794728931-f584   # rev 2 (toast fix + stickies green); snapshot pinned when taken
ds_version: 1791561405-c72e
source: docs/design/source/CD-17/   # after approval
surfaces: [web-pos, web-backoffice]
sizes: [1280x800, 1024x768, 390x844]
brief: CD-17-stock-loss-count.md
drs: [DR-031]
depends_on: [CD-16]
supersedes: brief paste text where they conflict
---

# CD-17 — เปิดของใหม่ · ของหาย · ยังมีของ · นับสต็อก · ปรับยอด

Built on The Loft Bar Design System (real DS components; dark/light Theme tweak). **Do not port canvas markup** — HeroUI v3 + tokens (`docs/rules/frontend.md`). Sample data only. Template `cd-template.md` v2.

## 0. Review items
| # | Item | Recommendation |
|---|---|---|
| R1 ✓ | Pain point = CD-16 R1; Q1 เปิดของใหม่ also on POS (Field 15 Nov). | Done. |
| R2 ✓ | **Loss math + 3 different actions.** Missing = container size − sold between this open and the next (comps / voids-before-made excluded; void after served = waste, not missing). Tapping เปิดของใหม่ books the missing amount off stock at once. **ใส่เหตุผล** (closed container) moves a known part to "ตัดออกมีเหตุผล" — stock unchanged. **ปรับยอด** (unopened stock, e.g. a whole bottle broke) changes stock. Count shortfall + unmet "ยังมีของ" claims add to หายรวม. | Accept — keeps stock honest without double counting. |
| R3 ✓ | **New IAM permission `inventory:open_container`** (bartender group): read-only stock list + เปิดของใหม่ button. Everything else stays `inventory:manage`. IAM/seed change → stock brief Pre-decided item. | Accept. |
| R4 ✓ | **Wrong tap after the 5 s undo:** no delete from the bar (audit). Owner sees the odd container in detail (low sold, flag) and fixes with ปรับยอด if needed. | Accept. |
| R5 ✓ | **ยังมีของ = own sub-tab with count** (brief D5 said a section inside ของหาย). Easier to see; doesn't push the loss table down. Unmet qty still in หายรวม. | Accept. |
| R6 ✓ | **Who counts:** S2 = `inventory:manage` only. Delegating to staff = new `inventory:count` later if a bar asks. One draft count per venue. | Accept. |

## 1. Overview
- **Goal:** one tap per opened container; the owner sees what went missing, which container, who opened it, in ฿.
- **Users + context:** ต้น (bartender) Friday 23:00, POS tablet at the bar, one hand · Beam (manager) next morning / Sunday afternoon, laptop or phone.
- **Entry → exit:** bar — rail สต็อก › รายการสต็อก › เปิดของใหม่. Owner — rail สต็อก › นับสต็อก / ของหาย › ของหาย · ยังมีของ · นับสต็อก · ประวัติ.
- **Outcome:** bar 1 tap + 5 s undo, no confirm · loss sorted by ฿ · blind count → one confirm.
- **Out of scope (D8):** staff-app button (CD-28) · low-stock checklist at close (CD-19) · receive / PO (CD-18) · ML anomalies (CD-26) · per-item thresholds.
- **Journeys:** J1 ต้น opens Jameson bottle (27 % missing) → Beam ของหาย → detail → ใส่เหตุผล หก 60 ml (E1–E4) · J2 blind count 5 items → variance → confirm 3 (−฿178.00) (E1–E3).

## 2. Boards
| Board | Type | States |
|---|---|---|
| `overview` | OVERVIEW | goal, pain, users, outcome, entry/exit, journeys, out of scope, decisions |
| `journey-1` | JOURNEY | POS list → warning Toast → ของหาย → detail + ใส่เหตุผล → explained |
| `journey-2` | JOURNEY | count empty → full → variance → history + Toast |
| `loss · 1280` | STATES | 1 loaded · 2 loading · 3 empty · 4 error · 5 filter ต้องดู |
| `detail · 1024 · สิทธิ์` | STATES | 6 detail Jameson · 7 อาจลืมกด (Jim Beam) · 8 loss 1024 · 9 no permission (bartender) |
| `open · POS` | STATES | 1 bartender list · 2 within threshold · 3 over threshold · 4 sold beyond 1 container · 5 undone · 6 error |
| `adjust` | STATES | 1 ปรับยอด (whole bottle broke) · 2 ใส่เหตุผล validation · 3 pending |
| `override` | STATES | 1 รอตรวจ / ไม่ตรง / ตรงแล้ว · 2 ตรวจแล้ว dialog · 3 empty |
| `count · 1280` | STATES | 1 empty · 2 draft 3/5 · 3 validation · 4 variance · 5 confirming |
| `history` | STATES | 1 all · 2 search Jameson |
| `phone · 390` | STATES | count draft · variance · loss · detail |
| `flow` | FLOW MAP | open · loss · override + count |
| `Screen` | shared | screen component every board mounts (`renderVals()` = sample data) |

## 3. State coverage
| State | Open (POS) | Loss | Detail | Adjust / explain | Override | Count | History |
|---|---|---|---|---|---|---|---|
| default | ✓ open·1 | ✓ ·1 | ✓ ·6 | ✓ adjust·1 | ✓ ·1 | ✓ ·1 | ✓ ·1 |
| loading | shared CD-16 list·2 | ✓ ·2 | shared loss·2 | n/a | shared loss·2 | shared loss·2 | shared loss·2 |
| empty | n/a (CD-16 list·3) | ✓ ·3 | n/a | n/a | ✓ ·3 | ✓ ·1 | **not drawn** (same as override·3 copy) |
| error + retry | ✓ ·6 | ✓ ·4 | shared loss·4 | Toast error (CD-16 pattern) | shared | shared | shared |
| validation | n/a | n/a | n/a | ✓ ·2 | n/a | ✓ ·3 | n/a |
| pending | n/a (optimistic + undo) | n/a | n/a | ✓ ·3 | n/a | ✓ ·5 | n/a |
| success feedback | ✓ ·2–4 | n/a | ✓ J1·5 | ✓ J1·5 | n/a | ✓ J2·4 | ✓ J2·4 |
| failure per reason | ✓ ·6 | n/a | n/a | ✓ ·2 | n/a | ✓ ·3 | n/a |
| stale / conflict | **open: two taps on the same container within seconds** → brief decides (server idempotency key) | n/a | n/a | n/a | n/a | count vs sales during count → R2 note: system qty frozen at submit time (count·4 Alert) | n/a |
| permission denied | n/a (button needs `inventory:open_container`) | ✓ ·9 | shared ·9 | shared | shared | shared (R6) | shared |
| long Thai text | shared CD-16 ·7 | ✓ ·8 (1024 truncation) | n/a | n/a | n/a | n/a | n/a |
| smallest size | 1024 shared CD-16 | ✓ ·8 · 390 | ✓ 390 | n/a (Drawer full width on phone — not drawn) | n/a | ✓ 390 | n/a |

## 4. Action table
No stock API yet — every row **needs API (stock brief, planned 30 Nov)**. Names are proposals.

| Action | API (status) | Permission | Success → UI | Failure → UI | Recovery | Idempotency |
|---|---|---|---|---|---|---|
| open container | `POST /inventory/items/:id/open` → `{ previous: {sold, size, missing, pct, overThreshold, soldBeyond} }` (needs API) | `inventory:open_container` | Toast open·2/3/4 + row resets | network → open·6 · 403 → button hidden | tap again | client key per tap; undo = `DELETE /inventory/opens/:id` within 5 s |
| loss report | `GET /inventory/loss?from&to&flagged` (needs API) | `inventory:manage` | loss·1 | loss·4 · 403 → ·9 | retry | n/a |
| item loss detail | `GET /inventory/items/:id/loss?from&to` (needs API) | `inventory:manage` | detail·6/7 | loss·4 pattern | retry | n/a |
| explain loss | `POST /inventory/opens/:id/explanations {qty, reason, note}` (needs API) | `inventory:manage` | J1·5 + Toast | 400 qty > missing / note missing → adjust·2 | fix | n/a |
| adjust stock | `POST /inventory/items/:id/adjustments {direction, qty, reason, note}` (needs API) | `inventory:manage` | detail + history row | 400 → adjust·2 pattern | fix | client key per form |
| override (ยังมีของ) list / check | `GET /inventory/overrides` · `POST /inventory/overrides/:id/check {note}` (needs API) — claims themselves are created by CD-04/14/28 | `inventory:manage` | override·1 / ·2 → row ตรวจแล้ว | retry | — | idempotent |
| count draft / submit / confirm | `PUT /inventory/counts/current` (draft) · `POST …/submit` → variance · `POST …/confirm` (needs API) | `inventory:manage` | count·4 → J2·4 | 400 → count·3 · network on confirm → Toast error, stay on variance | retry | confirm idempotent per count id |
| history | `GET /inventory/transactions?item&type&cursor` (needs API) | `inventory:manage` | history·1/2 | loss·4 pattern | retry | n/a |

## 5. e2e script
- **J1:** E1 POST open Jameson → Toast "หาย 27%" with เลิกทำ; row shows "ขวดใหม่ ขายไป 0 / 700 ml" · E2 loss list shows Jameson 294 ml · 14 % · ฿327.60 + เกินเกณฑ์ · E3 detail bottle 3 = 190 ml · 27 % · E4 explain 60 ml หก → bottle 3 = 130 ml · 19 %, ตัดออกมีเหตุผล lists −฿66.86, stock unchanged.
- **J2:** E1 count sheet shows no system column · E2 submit → variance Jameson −120 ml, Jim Beam −20 ml, หมูยอ −2 ชิ้น, total −฿178.00 · E3 confirm → 3 `count` transactions; หายรวม includes ฿178.00.

## 6. Strings & sample data
All in `Screen.dc.html` `renderVals()` (lossRows, JAM / JIM detail, OR open rows, V override, CR count, H0 history, DR drawers, TOASTS). Key strings: "เปิดของใหม่" · "เลิกทำ" · "หายไม่ทราบเหตุ" · "ตัดออกมีเหตุผล" · "อาจลืมกดเปิดของใหม่" · "ยังมีของ ไม่ตรง" · "นับแบบไม่เห็นยอดในระบบ" · "ยืนยันปรับยอด 3 รายการ".

## 7. Layout & tokens
CD-16 shell. Sub-nav = DS SegmentedControl under Tabs. Loss stat tiles = DS StatTile ×4 (2×2 on phone). Drawer 480 right (desk) / bottom sheet (phone). Tokens only.

## 8. Components → platform
Tabs · SegmentedControl · Tag(count) · StatTile · Badge(dot) · Input(suffix) · Radio · Alert · Toast(action) · Skeleton · DataTable(loading) → HeroUI v3 Tabs · Tabs/ButtonGroup · Chip · custom StatTile (DS §6) · Chip · Input · RadioGroup · Alert · Toast · Skeleton · Table. Drawer + alert dialog drawn from tokens (DS gap, same as CD-12 R8).

## 9. Behaviour rules
- Loss math and action semantics: R2. Threshold = venue setting (default 10 %, CD-21); flag when missing % > threshold.
- Sold beyond one container since last open → system assumes one extra container, no loss computed for those containers, flag "อาจลืมกดเปิดของใหม่".
- Undo window 5 s (Toast action); after that, R4.
- Count: system qty frozen at submit; rows left blank are skipped; confirm writes only rows with a difference; one open draft per venue.
- Override status: รอตรวจ → ตรงแล้ว / ไม่ตรง automatically from the next receive or count; ตรวจแล้ว is the owner's acknowledgement only.
- **Standard questions:** period chips single-select ("ต้องดู" = filter, count shows rows); history search trimmed, substring, case-insensitive, Escape clears query only · min sizes 1024 / 390 · names truncate in tables · icon-only buttons have `aria-label` · status never colour only (every Badge has a word).
- User-mindset: bar = 1 tap, no dialog (undo instead) ✓ · every error says how to fix ✓ · blind count stated on screen ✓.

## 10. Revisions
| Rev | Date | Change | Authority |
|---|---|---|---|
| 1 | 2026-11-15 | Canvas built (12 boards + shared Screen) | Q1 Field 15 Nov |
| 2 | 2026-11-15 | Fix: Toast without action crashed 3 boards (React #31) → pass `action` null · R2–R6 accepted → approved | Field |

## 11. Source snapshot
Pending — take before the stock brief (30 Nov) per cd-template §6.
