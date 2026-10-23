# Handoff — BRIEF-041 Web POS: menu photos — upload in the editor + list thumbnails

| | |
|---|---|
| **Implementer** | kj (Claude Code) |
| **Date** | 2026-10-23 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-041-menu-photo-ui` (seed `9a3a5d2`, merged `origin/main` `d4590b4` first) |
| **Assigned auditor** | Cowork |
| **Status** | Implemented — run proof done on the real API + `bar-app-dev` (below) |
| **AI usage** | n/a (Field's brief, agent-written) |

## Summary
- **Editor photo field** (`editor/PhotoField.tsx`, in ข้อมูลหลัก): 4:3 drop zone + picker (`accept` jpeg/png/webp). `hooks/usePhotoUpload.ts`: client pre-check (type, 1 B…`IMAGE_MAX_BYTES`) → `POST /menu/items/image-upload-url` → multipart `POST` to S3 (`fields` first, file last, plain `axios` with `onUploadProgress` + `AbortController`) → progress bar, "ยกเลิกการอัปโหลด". The draft changes only when the upload finishes, so cancel / failure keep the previous photo. บันทึก is disabled while uploading.
- **Draft:** `MenuDraft.photo` = `keep` (no `imageKey`) · `remove` (`null`) · `new` (the `tmp/…` key + blob preview). It counts toward dirty / leave guard; `reload` resets to `keep`.
- **List thumbnail** 40×40 in the name cell from `imageUrl`, `image` icon fallback; a broken thumbnail refetches the list once (`MenuList`).
- **API:** `lib/api/menu.ts` `createImageUploadUrl`, `uploadToS3`. No new dependency, no contract change.
- **Mocks:** presign + fake bucket (`https://mock-bucket.test/`) handlers; mocked items turn `imageKey` into an inline image `imageUrl`.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ mocked | `PhotoField.test.tsx` "valid JPG…" · `e2e/menu-photo.spec.ts` |
| AC-2 | ✅ | "6 MB file or a GIF…" (0 presign requests) |
| AC-3 | ✅ | "S3 rejection…" (403 once, new file succeeds) |
| AC-4 | ✅ | "remove saves null", "untouched sends no imageKey"; replace = AC-1 |
| AC-5 | ✅ | "save disabled while uploading; cancel…" |
| AC-6 | ✅ | gates + run proof below |

## Gate Evidence (G1)
Working tree at the work commit:
| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/frontend lint` | 0 | pass |
| `pnpm --filter @bar/frontend typecheck` | 0 | pass |
| `pnpm --filter @bar/frontend test` | 0 | 159 passed (32 files) |
| `pnpm --filter @bar/frontend test:e2e` | 0 | 18 passed (run before a one-line nested-ternary refactor in `PhotoField`; unit rerun after) |
| `pnpm --filter @bar/frontend build` | 0 | pass |

## Sonar
Gate ERROR (as on main: `new_coverage` 0 %, 17 issues). One issue in this brief's files (S3358 nested ternary in `PhotoField`) → fixed after the scan; not re-scanned. The rest are `test/setup.ts` and backend files from before.

## Run proof
Real API `:3001` + `next dev :3000` on this work tree (HEAD `e6395c1`, work `f1d25e1`), Field signed in via LINE, viewport 1280×900, the in-app browser. The test item is "จินโทนิค" (ไฮบอล) from BRIEF-040's proof. The file picker was driven from page JS (a canvas-made 800×600 JPG put on the input via `DataTransfer`), everything after is the real app, API and bucket.
1. **Upload (AC-1):** pick JPG → `POST /menu/items/image-upload-url` **200** → multipart `POST` to `bar-app-dev.s3.ap-southeast-1.amazonaws.com` **204** (so the bucket CORS for `http://localhost:3000` works) → preview "Photo A" in the 4:3 box with เปลี่ยนรูป / ลบรูป → บันทึก → redirect to `/pos/menu?highlight=…`; the row shows a thumbnail (`naturalWidth` 800). The reloaded editor serves the photo from `menu/<itemId>/<uuid>.jpg` (the API promoted `tmp/…`).
2. **Error (AC-2):** a 6 MB file → "อัปโหลดไม่สำเร็จ / ไฟล์ต้องเป็น JPG, PNG หรือ WebP ไม่เกิน 5 MB / เลือกไฟล์ใหม่", the saved photo stays shown; the next valid pick clears the error (AC-3 retry).
3. **Replace (AC-4):** pick "Photo B" → บันทึก → the list thumbnail is a new key (`3e03a5fe…` vs `fed48377…`).
4. **Remove (AC-4):** ลบรูป → box empty → บันทึก → the list row falls back to the icon.
Not exercised on the real bucket: the cancel (AC-5, covered by the component test) and a real S3 403 (AC-3, covered by the component test). Screenshots were viewed in the session only (the browser tool cannot write them to files), as in BRIEF-040. The test item has no photo now; replaced/removed objects stay in the bucket (orphan cleanup is out of scope).

## Limitations
- `applyAccept` had to be off in the GIF test (the picker's `accept` would drop it before our check) — in the browser the picker filters but a drop of any file still reaches the pre-check.
- No signed URL is logged or shown beyond `<img src>`.
