# Audit — BRIEF-041 Web POS: menu photos — upload in the editor + list thumbnails

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-23 |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-23 |
| **Branch / commit** | `feat/BRIEF-041-menu-photo-ui` · **S = `f1d25e1`** (work) · handoff `c6eef73` / state `e6395c1` / run proof `fa4f668` · `main` merged at `6333446` (after #90) · seeds `f655c21` + Ready `9a3a5d2` |
| **Depth** | Compact (UI; S3 enforces type + size, the API re-checks) |
| **Brief revision** | 1 |
| **Recommendation** | **PASS** ← Field makes the final call |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1 | ✅ | `usePhotoUpload`: pre-check → `POST /menu/items/image-upload-url` → `uploadToS3` (fields first, file last) → preview → draft `photo = { kind: "new", key }` → `imageKey` on save · list thumbnail from `imageUrl` · component + e2e · **real bucket:** presign 200, S3 204 (CORS for :3000 works), promoted to `menu/<itemId>/…`, thumbnail shown | |
| AC-2 | ✅ | type via `ImageContentTypeSchema`, size 1 B … `IMAGE_MAX_BYTES` → error, **0 presign requests** · real: 6 MB → error, saved photo kept | |
| AC-3 | ✅ | S3 failure → error state; next pick retries (component test with a 403); real 403 not forced | |
| AC-4 | ✅ | `imageKeyOf`: `keep` → no field · `remove` → `null` · `new` → `tmp/` key · real: replace (new key) and remove (icon fallback) | |
| AC-5 | ✅ | draft changes only after a finished upload, so cancel / failure keep the previous photo; บันทึก disabled while uploading; `AbortController` on cancel, unmount and a new pick · component test (real-bucket cancel not exercised) | |
| AC-6 | ✅ | Handoff: lint, typecheck, test 159, e2e 18, build · run proof on the real API + `bar-app-dev` · Cowork re-ran frontend `tsc --noEmit` + `eslint` on the branch (exit 0) | e2e ran before a one-line ternary refactor in `PhotoField`; unit re-run after → `ci` on H covers e2e |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| No credential leak to S3 | ✅ | `uploadToS3` uses the bare `axios` default; the API client is its own `axios.create()` instance and nothing sets `axios.defaults` / global interceptors (`git grep`) → no Authorization header, no cookies, no refresh retry on the S3 call |
| Signed URLs | ✅ | only in `<img src>`; not logged |
| Broken / expired thumbnail | ✅ | one list refetch per mount (`useRef` guard), not per image — no refetch loop |
| Blob previews | ✅ | `revokeObjectURL` on replace and unmount |
| Dependencies / contracts | ✅ | none / none |
| Scope | ✅ | editor + list only; no crop, POS tiles, CloudFront |
| Sonar | ✅ | the one new issue (S3358) fixed after the scan; not re-scanned — trivial |
| Size | ✅ | ~392 net app lines — within target |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Info (check) | — | The handoff says replaced / removed objects "stay in the bucket". BRIEF-039's API deletes the replaced or removed `menu/…` object and the `tmp/` slot after commit (best effort; its own run proof showed HEAD 404 after a remove). If objects really remain, the backend log will show `could not delete …` — then the dev IAM user lacks `s3:DeleteObject`; worth a look before the AWS-sprint IAM policy (039 audit F3). Not blocking. |
| 2 | Info | — | Run proof drove the file picker from page JS (`DataTransfer`); everything after the pick was the real app, API and bucket — acceptable for a picker. Screenshots stayed in the session. |

## Recommendation to Field
PASS. Small, careful brief: the upload goes straight to S3 without your session riding along, the draft only changes after a finished upload (so cancel and failure are safe), and the real bucket round-trip — including your CORS setting — is proven.

**Next command:** `execute BRIEF-041` (PASS commit: this audit + handoff + state, then PR; Field's own PR — merge once `ci` is green on H and S..H is evidence-only).

## Evidence Coverage
- Reviewed work SHA: `f1d25e1` (handoff `fa4f668`; `git diff main...feat/BRIEF-041-menu-photo-ui`)
- Sources inspected independently: `usePhotoUpload.ts`, `lib/api/menu.ts` (`uploadToS3`), `_lib/draft.ts` (`PhotoDraft`, `imageKeyOf`), `MenuList.tsx` (refetch guard), axios usage across `src` (`git grep`)
- Tests: Cowork re-ran frontend `tsc --noEmit` + `eslint` on touched files (exit 0); Vitest / Playwright / build not re-run (macOS-built binaries) → handoff exits + `ci` on H.
- Run proof: read from the handoff.
- Written uncommitted; the executor commits it unchanged at PASS.

## Field, 2026-10-23 (session): Rev 2 — list Switch fix
Field found on the running app that clicking the sold-out Switch on `/pos/menu` opens the editor. Cause (BRIEF-040, merged #90): `MenuItemRow` puts the `Switch` inside a `Table.Row` with `onAction` and nothing stops the Switch's pointer events from reaching the row's press handler. BRIEF-040's test clicked the hidden checkbox (`getByRole("switch")`) in jsdom, which skips that path — Cowork's BRIEF-040 audit accepted AC-1 on that test.
Field approved **BRIEF-041 Rev 2** ("approve BRIEF-041 Rev 2 (switch fix)"); written into `docs/briefs/BRIEF-041-menu-photo-ui.md` (uncommitted, executor commits it unchanged).

**Result now: CHANGES REQUIRED** — **Must fix #3 (AC-7):** stop the Switch's pointer / click / key events from reaching the row; component test on the **visible** control (toggle request fires, `router.push` not called); e2e clicks the switch in a real browser and the URL stays `/pos/menu`; a row click elsewhere still opens the editor.

**Next command:** `execute BRIEF-041` (commit the Rev 2 brief exactly as written — `docs(BRIEF-041): Rev 2 — Field-approved`; fix Must fix #3; report the new S for a compact re-check).

## Re-audit — 2026-10-23 (Cowork) · S = `f4aa6f3`
**Change since `f1d25e1`:** `e32a50f` = the Rev 2 brief committed exactly as Cowork wrote it (+6 / −2); `f4aa6f3` = `MenuItemRow.tsx`, `MenuList.test.tsx`, `e2e/menu.spec.ts`.

| Check | Result |
|---|---|
| Must fix #3 (AC-7) | ✅ The Switch sits in a wrapper that stops `pointerdown/up`, `mousedown/up`, `click`, `keydown/up` before they reach the row's `onAction`. A click on the visible control toggles through `toggle.toggle(!available)` (skipped while pending). |
| Manual toggle — double-toggle risk? | ✅ none in this version: HeroUI 3.2.6 `switch.js` renders `Switch.Control` as a plain `span` (`data-slot="switch-control"`) **outside** `SwitchButton` (rendered by `Switch.Content`, which holds the input). The visible track therefore never toggled on its own — under BRIEF-040 a click on it only reached the row. Keyboard (Space on the focused input) still toggles through `onChange`; the wrapper only stops the key events from opening the row. |
| Tests | component test now clicks the visible `switch-control` (request fires, `router.push` not called); e2e (real browser): click the control → "สิงห์ หมดแล้ว", URL stays `/pos/menu`; click the row header → editor URL. |
| Typecheck | Cowork re-ran frontend `tsc --noEmit` + `eslint` on `f4aa6f3` (exit 0); Vitest / Playwright → executor's run + `ci` on H. |

**Suggestion (Low):** the manual toggle depends on HeroUI keeping the control outside the button; a future HeroUI upgrade that moves it inside would toggle twice per click. Assert **exactly one** `mark-(un)available` request per click in the component test so an upgrade fails loudly. Not blocking.

**Result: PASS** — zero Must fix. Audited S = `f4aa6f3`.

**Next command:** `execute BRIEF-041` (PASS commit: this audit unchanged + handoff + state, then PR; Field's own PR — merge once `ci` is green on H and S..H is evidence-only).

## Field, 2026-10-23 (session): low suggestion approved
Field: "approve low suggestion" → do it on this branch before the PASS commit (test-only, inside AC-7; no brief revision needed — test structure is not a Field Guard trigger).
- **Must fix #4 (Field-requested):** in `MenuList.test.tsx` "a row tap opens the editor, the switch toggles without opening it", assert **exactly one** `POST …/mark-unavailable` request for the one click on the visible control (and none for `mark-available`).
- Result until re-checked: **CHANGES REQUIRED** (test-only). Next command: `execute BRIEF-041` (add the assertion; report the new S for a compact re-check).

## Re-check — 2026-10-23 (Cowork) · S = `a57debf`
`a57debf` changes only `MenuList.test.tsx` (+3 / −1): all `/mark-` requests from the one click on the visible control must equal `[POST …/<id>/mark-unavailable]` — exactly one request, and no `mark-available`. Must fix #4 ✅. No app code changed since `f4aa6f3`.

**Result: PASS** — zero Must fix. Audited S = `a57debf`.

**Next command:** `execute BRIEF-041` (PASS commit: this audit unchanged + handoff + state, then PR; Field's own PR — merge once `ci` is green on H and S..H is evidence-only).
