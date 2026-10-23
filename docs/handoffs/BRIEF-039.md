# Handoff — BRIEF-039 Backend: menu photos (S3 presigned) + hidden-category reads

| | |
|---|---|
| **Implementer** | kj (Claude Code) |
| **Date** | 2026-10-23 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-039-menu-photos-api` (seed `3cbc85a`; PR opens after audit PASS) |
| **Commit** | Work SHA `f2ed6cf` (gates ran on `ed1b45c`; the amend changed only the IAM note in `docs/api/README.md`) |
| **Assigned auditor** | Cowork |
| **Status** | Implemented — awaiting audit · real-bucket run proof complete (re-run after the IAM fix) |

## Summary
- **Storage:** `common/storage/StorageService` (the only S3 caller, DR-020) + `providers/config/storage/` (`AWS_REGION`, `S3_BUCKET` required; keys optional, passed only when both are set; blank = unset; the error message names the variable, never a value). Methods: `presignUpload` (presigned POST, 5 min, `eq $Content-Type` + `content-length-range 1 … 5,242,880`, key `tmp/<uuid>.<ext>`), `head` (null on 404), `copy`, `remove`, `presignRead` (1 h). `StorageModule` is imported by `MenuModule`.
- **`POST /menu/items/image-upload-url`** `{ contentType }` → `{ url, fields, key, expiresAt }` (200, `menu:write`, no DB write, no event). `expiresAt` = clock + 5 min.
- **`imageKey` on create / PATCH** (`MenuPhotoService` + `MenuWriteService`): a `tmp/` key must match the shape we issue, then `HeadObject` (missing → 400 "อัปโหลดรูปใหม่อีกครั้ง"; > 5 MB / 0 byte / type outside the three → 400) → `CopyObject` to `menu/<itemId>/<uuid>.<ext>` (extension from the stored Content-Type, not the key) **before the transaction opens** → DB write → after commit delete the `tmp/` object and the replaced / removed `menu/` object (best effort, warning log with the key only). DB write fails → the copy is deleted. PATCH: omitted = keep · `null` = remove · `tmp/…` = replace · current key = keep · anything else = 400 (judged under the row lock). Create: only `tmp/` or null/omitted. The item id on create is generated in the service (`randomUUID()`), so the copy can target `menu/<itemId>/` before the row exists.
- **Reads:** `imageUrl` = presigned GET (1 h) or `null` on every menu read/write response and in `MENU_ITEM_STALE.details` (`MenuCatalogService.toItem` is now async). **`?includeHidden=true`** on `GET /menu/categories` and `GET /menu/items` (also `false`; anything else → 400); hidden items keep `availableNow: false`. `MenuCategory.isActive` on every category response.
- **Contracts / docs:** `CreateImageUploadUrlSchema`, `ImageUploadUrlSchema`, `ImageContentTypeSchema`, `IMAGE_MAX_BYTES`, `imageKey`, `imageUrl: z.url().nullable()`, `MenuCategory.isActive`, `MenuCategoriesQuerySchema`, `includeHidden`. `openapi.json` regenerated, `docs/api/README.md` Menu table + photo env/IAM note, `.env.example`, backend README.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `storage.service.spec.ts` (policy decoded for each type: exact `$Content-Type`, `content-length-range 1 5242880`, key; 5-min expiry) · `menu-photos.e2e-spec.ts` "presigns … into tmp/" ×3 + "rejects another type" (gif, text/plain, missing → 400) · run proof 1 (real bucket: 200, S3 rejects a mismatching `Content-Type` against the policy) |
| AC-2 | ✅ (fake storage + real bucket, run proof 2–5) | e2e "copies the upload to menu/<itemId>/…" (image_key, presigned `imageUrl` on POST / GET / list, only the `menu/` object left) · "rejects a missing, oversized, wrong-type or foreign key" (400 ×4, no item row) · `menu-write.service.spec.ts` (empty object, 5 MB + 1, shape check) |
| AC-3 | ✅ | e2e "PATCH imageKey" ×7 (keep omitted / current key, null removes, tmp replaces + old deleted, first photo, other key 400, stale drops the copy and `details.imageUrl`, cleanup failure still 200) · unit spec mirrors them |
| AC-4 | ✅ | `menu-write.service.spec.ts` "deletes the copied object when the DB write fails" · e2e "removes the copied object when the DB write is refused" (unknown modifier group → 400, `menu/` empty) |
| AC-5 | ✅ | e2e "includeHidden" ×3 (hidden category + its item, default and `false` unchanged, `categoryId` / `available` combos, 400 on `yes` / `1`, `isActive` on list / create / reorder / rename) · `menu-catalog.service.spec.ts` |
| AC-6 | ✅ | `set-auth-env.ts` forces both AWS keys empty; the photo e2e asserts they are falsy and overrides `StorageService` with `test/fake-storage.ts`; the other 21 e2e files boot with `AWS_REGION` / `S3_BUCKET` defaults and no keys · `configuration.spec.ts` (no value in the error) · run-proof backend log has no key text (grep 0) |
| AC-7 | ✅ | gates below · `openapi:check` exit 0 · README |

## Gate Evidence (G1)
Run on `ed1b45c` (same tree as `f2ed6cf` except one README sentence). The older `dist/main` backend (another session) was stopped before e2e; Field's `nest start --watch` process (22 Oct) was left running. e2e used the `bar_test` DB.

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/contracts build` | 0 | pass |
| `pnpm --filter @bar/contracts lint` · `typecheck` | 0 · 0 | pass |
| `pnpm --filter @bar/contracts test` | 0 | 65 passed · 0 failed |
| `pnpm --filter @bar/backend lint` (oxlint + class-files) | 0 | pass |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 128 passed (37 files) |
| `pnpm --filter @bar/backend test:e2e` | 0 | 144 passed (22 files) |
| `pnpm --filter @bar/backend openapi:check` | 0 | committed `openapi.json` = regenerated |
| `pnpm --filter @bar/frontend typecheck` · `lint` (not in brief — fixtures) | 0 · 0 | pass |
| run proof (below) | 0 | health 200 on the work tree; real bucket end-to-end ✅ |

`demo-history-seed.e2e-spec.ts` failed once in my first full e2e run (`ORDER BY 1::text` orders by a constant, so the payment-method order is arbitrary) and passed alone ×2 and in the final full run. Pre-existing, not touched here — worth a one-word fix (`ORDER BY confirmed_via::text`) in a later brief.

## Run proof
`nest build` on the work tree · `migration:run` → no migrations pending · fresh `PORT=3002 node --env-file=.env dist/main.js` → `/api/health` **200**, `db=up`. (A `nest start --watch` process from 22 Oct owns :3001 and restarted itself from my build; my own instance ran on :3002.) Session for `Field (demo)` minted with a local script (HS256 + the Redis `session:` key, no LINE). Real dev bucket `bar-app-dev`, key `bar-app-local` from `.env`.

| Step | Result |
|---|---|
| presign `image/jpeg` | **200**, `key tmp/<uuid>.jpg`, `url https://bar-app-dev.s3.ap-southeast-1.amazonaws.com/`, fields `Content-Type, bucket, X-Amz-*, key, Policy, X-Amz-Signature` |
| presign `image/gif` / `text/plain` | **400** `VALIDATION_ERROR` "รองรับเฉพาะรูป JPG, PNG หรือ WebP" |
| `curl -F` `text/plain` on the JPEG policy | S3 **403** "Invalid according to Policy: Policy Condition failed: ["eq", "$Content-Type", "image/jpeg"]" ✅ |
| `curl -F` a real 64×64 JPG | ❌ S3 **403 AccessDenied** — IAM user `bar-app-local` is "not authorized to perform: s3:PutObject … no identity-based policy allows" |
| `curl -F` a 6 MB file | ❌ same 403 (S3 checks IAM before the size condition) — `EntityTooLarge` **not observed** |
| `POST /menu/items` with a `tmp/` key that is not in the bucket | **500**: `HeadObject` on a missing key returns **403** (not 404) because the same user also lacks `s3:ListBucket`. No item row created (count 0). With `ListBucket` this is the designed 400 |
| `GET /menu/categories?includeHidden=true` | 200, `isActive` on all 6 |

**Re-run after Field's IAM fix (2026-10-23, fresh `PORT=3002` backend on `e64b3dc`, `/api/health` 200)** — the first run (and the re-run right after the first grant) got 403 `AccessDenied`; Field then fixed the policy on `bar-app-local` (cause not reported), after which everything below passed:

| Step | Result |
|---|---|
| presign `image/jpeg` → `curl -F` a real 64×64 JPG | presign **200**; S3 **204** · `HEAD tmp/<uuid>.jpg` → 200 `image/jpeg` 1349 bytes |
| `POST /menu/items` `{ …, imageKey: tmp/… }` | **201**; `imageUrl` host `bar-app-dev.s3.ap-southeast-1.amazonaws.com`, path `/menu/<itemId>/<uuid>.jpg`, `X-Amz-Expires=3600` |
| `GET /menu/items/:id` → `curl imageUrl` | **200 `image/jpeg`, 1349 bytes, identical to the uploaded file** (`cmp`) |
| after the save | `HEAD tmp/…` → **404** (deleted) · `HEAD menu/<itemId>/…` → 200 |
| 6 MB file on a JPEG policy | S3 **400 `EntityTooLarge`** (proposed 5,245,149 > max 5,242,880) |
| `text/plain` on a JPEG policy | S3 **403** "Policy Condition failed: [\"eq\", \"$Content-Type\", \"image/jpeg\"]" |
| create with a `tmp/` key not in the bucket | **400** `VALIDATION_ERROR` "ไม่พบรูปที่อัปโหลด หรือหมดอายุแล้ว…" (with `ListBucket` S3 answers 404, so the 500 seen before the grant is gone) |
| `PATCH imageKey: null` | **200**, `imageUrl: null` · `HEAD menu/<itemId>/…` → **404** (deleted) |
| backend log | no key text (grep 0) |

Earlier results on the unfixed IAM user (upload 403, create 500 on a missing object) are superseded.

**Local data touched:** the proof item `รูปทดสอบ 039` was created and then deleted from dev DB `bar` (no orders); its S3 objects are gone (tmp deleted on save, `menu/` deleted by the PATCH). Scratch files only in the session scratchpad. My :3002 backend stopped.

## Sonar (local scan)
- Scanned commit: `f2ed6cf` (working tree of the same code) · Quality Gate: **ERROR** — `new_coverage` 0.0 % (no coverage path, known) and `new_violations` 16.
- Issues by severity: BLOCKER 0 · HIGH 5 · MEDIUM 5 · LOW 6 · INFO 1 (`pnpm sonar:report`).
- **None of the 16 is in a file this brief adds or changes** (all pre-existing: `setup.ts`, `order-query.service.ts`, `request-hash.ts`, `promptpay-payload.ts`, `seed-menu-catalog.ts`, `menu-availability.ts`, `document.ts`, `http-input.ts`, `permissions.guard.ts`, `payment.service.ts`, `sold-out.service.ts`, `auth.ts`, `globals.css`). No exclusions, won't-fix or gate change.
- Who fixed: n/a (nothing found in new code).

## Decisions Raised
- None. Pre-decided items used exactly: the three `@aws-sdk` packages `^3.1156.0` (resolved to 3.1156.0), the endpoint, the three content types, `includeHidden`, the two paths, the four env keys.

## Deviations from Brief
- None needing a DR. Interpretations (auditor please check):
  - **`POST …/image-upload-url` answers 200**, not 201 (AC-1 says 200; nothing is created).
  - **The copy runs before the transaction opens**, not inside it (§6 allows only the copy "before the write"; this keeps S3 out of every row lock). Consequence: a PATCH for an unknown id or a stale `updatedAt` copies first and deletes the copy on the way out.
  - **Item id on create is generated in the service** (`insertItem(id, …)`) so `menu/<itemId>/` exists before the row.
  - **`StorageService` lives in `common/storage/` (brief) although `backend.md` plans `providers/infrastructures/storage/aws-s3-storage.service.ts`.** Followed the brief; the rules file is protected, so the mismatch is for Field/Cowork to settle.
  - **Frontend fixtures (2 files, 5 lines)** gained `isActive: true` because `MenuCategory.isActive` is now required (`MenuPanel.test.tsx`, `mocks/handlers.ts`); frontend typecheck was red otherwise. No UI change.
  - `IMAGE_MAX_BYTES` is exported from contracts so the photo UI (BRIEF-041) can pre-check the size.
  - Test helper `test/fake-storage.ts` is imported by two `src/**/*.spec.ts`.

## Known Gaps / Follow-ups
- **Size:** ~1,250 net lines in `app/` (tests ≈ 790, ≈ 63 %) vs ~700 estimated — 1.8× again (race/IO-heavy backend ≈ 1.7×).
- 403-on-missing-object means a bucket without `ListBucket` turns "upload expired" into a 500; documented in `docs/api/README.md`. Not mapped to 400 on purpose (a real permission error should stay loud). Confirmed: with `ListBucket` granted, a missing tmp object is a 400.
- `imageUrl` is re-signed on every read (URL changes between requests; a client that caches the menu keeps a working URL for an hour). Per-item signing is local crypto, no network.
- Orphans: an abandoned `menu/<itemId>/` copy after a crash between copy and commit is possible (no cleanup job — brief out of scope).
- BRIEF-044 modifier CRUD, BRIEF-041 photo UI, IAM enforcement of `includeHidden` (still `menu:read`).

## AI Usage
**High** — Claude Code wrote all code, tests and docs (Field 0 % coding, reviewer mode).

## Review Routing
- Assigned auditor: Cowork
- Next command: `audit BRIEF-039`
- Work SHA: `f2ed6cf` · self-check: brief §2–§4 ↔ `menu-write.ts` / `menu.ts` ↔ `menu-photo.service.ts` / `menu-write.service.ts` / `storage.service.ts` ↔ `menu-photos.e2e-spec.ts`; no schema or migration change (`image_key` exists); `PermissionsGuard` decorators on all new routes

## Notes for Reviewer
- Start with `menu-write.service.ts` `createItem` / `updateItem` / `nextImageKey` and `menu-photo.service.ts` — the copy-before-write and cleanup order.
- Check the DR-020 lock list: no key or signed URL is logged or committed (`MenuPhotoService` logs only the object key on a failed delete).
