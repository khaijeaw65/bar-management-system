# Handoff — BRIEF-041 Web POS: menu photos — upload in the editor + list thumbnails

| | |
|---|---|
| **Implementer** | kj (Claude Code) |
| **Date** | 2026-10-23 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-041-menu-photo-ui` (seed `9a3a5d2`, merged `origin/main` `d4590b4` first) |
| **Assigned auditor** | Cowork |
| **Status** | Implemented — **run proof on the real API + bucket still open** (Limitations) |
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
| AC-6 | ⚠️ gates ✅, run proof open | below |

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

## Limitations
- **Run proof not done.** It needs a LINE-signed-in browser session against the real API and `bar-app-dev`; an agent cannot sign in. Not run: real upload, replace, remove, 6 MB error, bucket CORS. Field to sign in at `:3000` (or `next dev` with the real API) and say when; the agent then drives it and adds screenshots.
- `applyAccept` had to be off in the GIF test (the picker's `accept` would drop it before our check) — in the browser the picker filters but a drop of any file still reaches the pre-check.
- No signed URL is logged or shown beyond `<img src>`.
