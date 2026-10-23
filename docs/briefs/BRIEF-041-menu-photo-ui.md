# BRIEF-041 — Web POS: menu photos — upload in the editor + list thumbnails

| | |
|---|---|
| **Status** | Ready — Rev 2 approved by Field 2026-10-23 |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | frontend |
| **Revision** | 2 |
| **Depends on** | BRIEF-040 ✅ (#90) · BRIEF-039 ✅ (presign API) · **dev bucket `bar-app-dev`: CORS allows `POST` from `http://localhost:3000` + `tmp/` 1-day lifecycle (Field, AWS console) — set 2026-10-23** ✅ |
| **References** | CD-12 editor·4 (upload states), §4 "Upload photo", §9 Photo, R7-2 · DR-020 (presigned POST, ≤ 5 MB, jpeg / png / webp) · contracts `IMAGE_MAX_BYTES`, `ImageUploadUrlSchema` |
| **Audit depth** | Compact (UI; S3 enforces type + size) |
| **Size** | ~1 day · est. ~400–500 net-new lines incl. tests |

---

## 1. Goal
The manager attaches, replaces or removes a menu item's photo in the editor, with a visible upload, and sees it on the menu list.

## 2. Scope
### In
- **Editor photo card** (CD-12 editor, 4:3, 208×156 at 1280): drop zone + file picker → client pre-check (type jpeg / png / webp, size ≤ `IMAGE_MAX_BYTES`) → `POST /menu/items/image-upload-url` → multipart `POST` to `url` (`fields` first, file last) with a progress bar and "ยกเลิกการอัปโหลด" (abort) → preview → on save send `imageKey` (the returned `tmp/…` key). The form stays editable while uploading; **บันทึก is disabled until the upload finishes**.
- เปลี่ยนรูป (new upload) · ลบรูป (`imageKey: null`) · an untouched photo sends no `imageKey` (keep).
- Errors (editor·4): wrong type / too big (client) · S3 rejection (403 policy / 400 `EntityTooLarge`) · network → "อัปโหลดไม่สำเร็จ / ไฟล์ต้องเป็น JPG, PNG หรือ WebP ไม่เกิน 5 MB / เลือกไฟล์ใหม่".
- **List thumbnail** on `/pos/menu` rows from `imageUrl`; no photo → `image` icon fallback. A broken image (`imageUrl` expired after 1 h) triggers one refetch of the menu query.
- **List Switch fix (Rev 2, BRIEF-040 regression found by Field):** in `MenuItemRow.tsx` the sold-out Switch must not trigger the row's `onAction` — its pointer / click / key events stop at the Switch wrapper. The test clicks the **visible** switch control (not the hidden input) and asserts the toggle request fires and `router.push` does not; `e2e` clicks the switch on `/pos/menu` in a real browser and asserts the URL stays `/pos/menu`.
- `lib/api/menu.ts` presign call; the S3 upload uses `axios` (`onUploadProgress`, `AbortController`) — no new dependency.

### Out (do NOT build here)
- Cropping / resizing (CSS `object-fit: cover` only) · photos on POS order tiles and customer screens · CloudFront · orphan cleanup.

## 3. Contract
- **Endpoints used:** `POST /menu/items/image-upload-url`; `imageKey` on `POST` / `PATCH /menu/items` (BRIEF-039); S3 presigned POST (external).
- **Contracts changes:** none.
- **Business rules:** S3 enforces type + 5 MB; the API re-checks before attaching (BRIEF-039).

## 4. Acceptance Criteria
- **AC-1** — Pick a valid JPG → progress → preview → บันทึก sends `imageKey` → the list row shows the thumbnail.
- **AC-2** — A 6 MB file or a GIF → error state, no presign request.
- **AC-3** — S3 rejects the upload → the same error state; picking a new file retries.
- **AC-4** — ลบรูป saves `imageKey: null`; เปลี่ยนรูป replaces; an untouched photo sends no `imageKey`.
- **AC-5** — บันทึก is disabled while uploading; ยกเลิกการอัปโหลด aborts and restores the previous photo.
- **AC-6** — Gates + run proof against the real dev bucket.
- **AC-7 (Rev 2)** — Clicking the sold-out Switch on a `/pos/menu` row toggles availability and stays on the list (component test on the visible control + e2e in a real browser); a click elsewhere on the row still opens the editor.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1 – AC-5 | component (MSW + mocked upload) | `src/app/pos/menu/[id]/_components/PhotoField.test.tsx` |
| AC-1 | e2e (MSW) | `e2e/menu-photo.spec.ts` |
| AC-7 | component + e2e | `MenuList.test.tsx` (visible control) · `e2e/menu-editor.spec.ts` or a new spec |

Gate commands (all must pass):
```bash
pnpm --filter @bar/frontend lint
pnpm --filter @bar/frontend typecheck
pnpm --filter @bar/frontend test
pnpm --filter @bar/frontend test:e2e
pnpm --filter @bar/frontend build
```
Run proof (real API + `bar-app-dev`): upload a JPG in the editor → save → thumbnail on the list → replace → remove · a 6 MB file → error · screenshots in the handoff (no signed URLs pasted).

### Local Sonar scan
- **Required for this brief: yes.**

## 6. Constraints
- `frontend.md` Hard Limits; tokens only; no new dependency; never log or display a signed URL beyond the `<img src>`.

## 7. Decision Points (Field Guard)
- **Pre-decided:** accepted types jpeg / png / webp (DR-020; CD-12 copy updated to include WebP) · `axios` for the S3 upload · bucket CORS / lifecycle are Field's console task before execution.
- **Likely DRs:** none.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates (incl. run proof) and evidence; dependencies have completion conditions
- [x] Size within workflow §2 (≤ ~3 working days, ~500 net-new lines); otherwise split
- [x] No unresolved decision blocking the main outcome
- [x] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-23 | Initial Draft (Cowork) — menu UI part 2 (photo) |
| 1 | 2026-10-23 | Ready — Field in session: "approve BRIEF-041 Rev 1 Ready" (bucket CORS + lifecycle set) |
| 2 | 2026-10-23 | + list Switch stops row `onAction` (BRIEF-040 regression, found by Field) — Field-approved ("approve BRIEF-041 Rev 2 (switch fix)") |
