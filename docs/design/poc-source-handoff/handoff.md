# POC — source-snapshot handoff: Bar menu (desktop web)

> **Experiment only.** Isolated from production CDs, `cd-template.md` and `board-convention.md`. Tests whether an approved Claude Design canvas source snapshot is enough for a coding agent to implement a page without screenshots or verbal explanation.

## 1. Approval
| | |
|---|---|
| Artifact | https://claude.ai/artifact/9UYwPkuKn5FYLiSgq57sWM ("POC design handoff — Bar menu") |
| Approved | Field, 2026-10-10 (in session) |
| Revision | 1 |
| Canvas version | `1791613503-f864` (version the snapshot was read from) |
| Design system | The Loft Bar Design System https://claude.ai/artifact/AXVdDV921SWCiAxGJxD78D, version `1791561405-c72e` (copied into the canvas) |

Boards (stable ID = board title in `canvas.json`; the canvas requires the first file to be `Main.dc.html`):
| Board ID | File | Size |
|---|---|---|
| `POC-design-handoff/menu/default` | `source/project/Main.dc.html` | 1280×800, dark |
| `POC-design-handoff/menu/no-results` | `source/project/NoResults.dc.html` | 1280×800, dark |

## 2. Source inventory (byte copies of the published canvas files; SHA-256 verified against the artifact service)
| SHA-256 | Bytes | Path (under `source/`) | What it is |
|---|---|---|---|
| `fa5ae907d574f541afd7fced8fb280fe277ca6ed98a37ab962fc3c3ae77dab48` | 3911 | `project/Main.dc.html` | board: default |
| `c74385fca773d2e6a2c7dbaca1d6863fe764eec75aa3a9b9e04389083cf84ae4` | 3602 | `project/NoResults.dc.html` | board: no results |
| `6f2d218b4ee2b90ebde2cfec18d72f37786750d8d9243ec3d0677d11764ba785` | 713 | `project/canvas.json` | board index, IDs, sizes, DS record |
| `8dabe62f5f9313829b05ac90564785a94d08e508abbe7b33727de87ec5d83aad` | 334785 | `project/ds/theloftbardesignsystem_99bbff/_ds_bundle.js` | DS component implementations (React, compiled) |
| `7866bbdf568cd66d45e96b2489b917076ee3e7ab42478f8ef7ef2d1b34f9bc1c` | 311 | `project/ds/…/styles.css` | imports all token files |
| `99c03da4fee89686b67b4e1ea9a9895d1fa9ab5fdfff6ddb50eb1b4a484be8cf` | 6613 | `project/ds/…/tokens/colors.css` | colour tokens (dark + light) |
| `9645fa74a5f12cbea4cfaa7613810ebe4f79db1c5a7b2d93eb5198eb52ec69e2` | 1727 | `project/ds/…/tokens/typography.css` | type tokens |
| `636c636975a82e319862efceb54e5822da01937eabec0f0b5a1292169b002c52` | 445 | `project/ds/…/tokens/spacing.css` | spacing tokens |
| `8a8fa95063c7b34da5520acae8c002430eb799e0b8c913c66a7af97bfb49ee85` | 225 | `project/ds/…/tokens/radius.css` | radius tokens |
| `49d239c658fe4bec8642074191d22011eef872bcefd79f9e8df08120f0f1931e` | 1567 | `project/ds/…/tokens/elevation.css` | shadows, z-index |
| `8ab8369728a9af235c3998a3cad388d0c348d802f7e4a9a999cb95e48ce2b30d` | 691 | `project/ds/…/tokens/fonts.css` | Noto Sans Thai @font-face + font stacks |
| `7a259174df15534fdab234363690592a165b829732d1724487cd1df4240989cb` | 1555 | `project/ds/…/tokens/heroui.css` | HeroUI variable bridge |
| `f722b6aff937e6950b8ba19ae2917327f202e3c1b9ebddfbbfde602c1d76b40e` | 415 | `project/ds/…/tokens/motion.css` | durations, easing |
| `b0dca6d6222bca9864348d20f2d0522d9a428b6b9100d3bba4f434f5d2d917a6` | 852 | `project/ds/…/tokens/base.css` | base element styles |
| `9acb585d8662ca4ed1b1cf5889dfa1393f8555103b3986e1ea1e3af4faef70bd` | 47484 | `project/ds/…/assets/fonts/NotoSansThai-Regular.ttf` | font 400 |
| `2e0c06600ac07f9e22c9d360d3e3b37651af9aff9d2dd4b418ba9fd6856c51ea` | 47552 | `project/ds/…/assets/fonts/NotoSansThai-SemiBold.ttf` | font 600 |
| `0be544f347b3ab6382bdc2b555a783727a4858a3dc140670406924670967d916` | 47480 | `project/ds/…/assets/fonts/NotoSansThai-Bold.ttf` | font 700 |
| `3411692820cb8d47543f69496aa25fd603a358f4498046f41c508a5a3342210e` | 357796 | `blobs/8bfda7adea891787e687d261a73a3d6e.js` | canvas asset `/_blob/8bfda7…` = Lucide icons UMD, byte-identical to npm `lucide@0.468.0` `dist/umd/lucide.min.js` |

`…` = `theloftbardesignsystem_99bbff`.

## 3. Dependencies and missing resources
| Reference in the boards | In snapshot? | Cursor can use it? |
|---|---|---|
| `./support.js` | **No** — canvas runtime injected by the Claude Design editor (it renders `<x-dc>`, `<sc-for>`, `<sc-if>`, `<x-import>`, `{{holes}}`). Not served as a canvas file. | No, and not needed. **The boards cannot be opened as plain HTML in a browser**; read them as text. |
| `/_blob/8bfda7adea891787e687d261a73a3d6e` | Yes → `source/blobs/8bfda7….js` | Yes (reference only). The app already has `lucide-react`; use that. |
| `ds/…/styles.css`, tokens, fonts, `_ds_bundle.js` | Yes | Yes, as **reference**. Colour values match the repo's `docs/design/tokens-v2.css` (spot-checked 12 tokens). |
| `TheLoftBarDesignSystem_99bbff.<Comp>` in `<x-import>` | Implementations in `_ds_bundle.js`: `MenuItemCard` (line 105), `Button` (1124), `Badge` (973), `Tag` (1580), `StatusChip` (1511; `STATUS_SETS` at 1464: `menu.soldout` = "หมด", tone void), `EmptyState` (2170), `SearchField` (3109) | Yes — read the functions for exact sizes/colours. |

**Blocking for a faithful build (decide before implementing):**
- **D1 — tokens + font: RESOLVED.** BRIEF-008 merged to main 2026-10-10 (PR #27, `b41ddc6`): `globals.css` now carries design-system v2 tokens (`--bg-app #1C1610`, `--surface-raised #362B1E`, …) and `layout.tsx` loads Noto Sans Thai. Use the v2 Tailwind utilities from `@theme inline` (see BRIEF-008 §2).
- **D2 — workflow.** Executors work only inside a Ready brief (`docs/rules/workflow.md`). There is no brief for this POC page.

## 4. Sample data (exact)
| id | Thai name | category | price | available |
|---|---|---|---|---|
| `chang-draft` | ช้างดราฟต์ | `draft` | ฿120.00 | yes |
| `rain-cocktail` | ค็อกเทลพิเศษประจำเดือน “ฝนแรกที่บางกอก” จินมะลิ ส้มซ่า โซดาตะไคร้ | `cocktail` | ฿320.00 | yes |
| `lime-highball` | ไฮบอลมะนาวโซดา | `highball` | ฿180.00 | yes |
| `yum-moo-yor` | ยำหมูยอ | `food` | ฿150.00 | **no (sold out)** |

Categories (order): `all` ทั้งหมด 4 · `draft` เบียร์สด 1 · `cocktail` ค็อกเทล 1 · `highball` ไฮบอล 1 · `food` อาหาร 1. Note the curly quotes “ ” in the long name.

## 5. Behaviour
- **Search:** trim the input; empty → no text filter. Match = item Thai name contains the query (substring, `toLocaleLowerCase('th')` on both sides). No fuzzy matching, no tone-mark normalisation.
- **Category:** single select, default `all`; `all` = no category filter. Search AND category combine.
- **Chip counts** are fixed category totals — they do not change while searching.
- **Results line:** ≥ 1 result → `แสดง {n} รายการ`. 0 results with a non-empty query → `ไม่พบผลลัพธ์สำหรับ “{query}”` + empty state (title `ไม่พบเมนูที่ค้นหา`, description `ลองค้นหาด้วยคำอื่น หรือล้างคำค้นหาเพื่อดูเมนูทั้งหมด`, icon search-x) + secondary button `ล้างคำค้นหา` (icon x) that clears the query only and keeps the selected category.
- **Sold out** items stay in results, dimmed (opacity .5) with chip `หมด`. Available items show **no** availability label (DS rule). No item click action (no cart).
- **Not designed, do not invent:** a category with 0 items and an empty query (not reachable with this data); loading/error states; light theme; mobile layout.

## 6. Board → component → web (HeroUI v3, installed 3.2.6)
| Board element | DS component (canvas) | Web (`@heroui/react`) |
|---|---|---|
| Page shell (padding 40/48, gap 24, bg `bg-app`) | markup | semantic HTML + Tailwind tokens |
| Eyebrow `THE LOFT BAR` (label 11/600, caps tracking, `text-accent`) + `เมนู` (display 34/700) | markup | `<h1>` + text |
| Search (400×44, placeholder `ค้นหาเมนู`) | `SearchField` | `SearchField` |
| Category filters with counts | `Tag` (selected + count) | `TagGroup` / `Tag` (single selection) — or `ToggleButtonGroup` if TagGroup cannot show counts; report which |
| Item card (tile: 108 px initial-letter placeholder, name, price) | `MenuItemCard layout="tile"` (bar-specific, DS §6) | custom `MenuItemCard` built on `Card` |
| Sold-out chip `หมด` | `StatusChip kind="menu" status="soldout"` | `Chip` (void tone tokens) |
| Empty state | `EmptyState` | `EmptyState` |
| Clear button | `Button variant="secondary" size="md"` | `Button` (secondary) |
| Icons (search, search-x, x) | Lucide UMD | `lucide-react` (already a dependency) |

## 7. Scope and acceptance
In: one isolated demo route (suggested `app/frontend/src/app/poc/menu/`), local sample data, working search + category filter, both designed states, dark only, 1280 px desktop.
Out: cart, auth, backend/API, realtime, light theme, new dependencies, changes to shared components or production routes.

- [ ] Header, search, filters, results line and 4-column grid match `Main.dc.html` (sizes, spacing tokens, order).
- [ ] Exact Thai copy and prices from §4–§5; long name wraps (no truncation in the design).
- [ ] Sold-out card dimmed with `หมด`; available cards unlabeled.
- [ ] Typing `มาร์การิต้า` shows the no-results state exactly as `NoResults.dc.html`; `ล้างคำค้นหา` restores the grid.
- [ ] Category filter works and combines with search.
- [ ] Tokens only (no hex in `.tsx`), existing components, no new dependencies; lint, typecheck, tests pass.

## 8. Rules for the implementer
- The canvas source is a **reference**, not production code: do not port `<x-dc>`, `<x-import>`, `sc-for`, `{{holes}}`, `DCLogic`, `support.js`, `_ds_bundle.js` or the Lucide UMD. Rebuild with the repo's stack (`docs/rules/frontend.md`).
- When the source and this file disagree, report it; do not pick silently. When something is missing, **report it — do not invent** sizes, copy, colours or behaviour.
- Report every value you inferred (anything not literally in the source or this file).

## 9. Snapshot verification (Cowork, 2026-10-10, read back from the repo)
- 18/18 files match the artifact service's SHA-256 + size.
- Present in the board files: all Thai copy and prices (§4–§5), sold-out flag, both states, layout values (1280×800, padding `--sp-10`/`--sp-11`, gap `--sp-8`, search 400×44, 4-column grid, `layout="tile"`).
- 16 tokens referenced by the boards, 0 undefined in the snapshot; 5 DS components referenced, all implemented in `_ds_bundle.js`, their internal token references all defined (one dynamic `var(--text-…)` string in StatusChip is code, not a missing token).
- Unresolved: `./support.js` (editor runtime; not needed, boards are not renderable standalone).
- **Verdict: PASS as a reference snapshot** (complete information, not self-contained as a runnable page). Implementation readiness: D1 resolved (BRIEF-008 merged); D2 (brief) open.

## 10. Result (2026-10-10)
- Cursor Phase A needed no design explanation; questions = workflow (brief), system gap (type/space/radius/motion tokens not in Tailwind), 6 unspecified behaviours → answered by BRIEF-900 §7.
- Phase B: PR #28 (`38b6a6f`), gates pass, 2 inferred values, 3 designer questions. Cowork audit PASS.
- Field visual comparison (localhost `/poc/menu` vs canvas): **clean — POC passed.**
- Follow-ups: adopt source snapshot in `cd-template.md` (Field decision) · token follow-up brief · close PR #28 without merging.
