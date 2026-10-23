# BRIEF-039 — Backend: menu photos (S3 presigned) + hidden-category reads

| | |
|---|---|
| **Status** | Ready — Rev 1 approved by Field 2026-10-23 |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | backend · contracts |
| **Revision** | 1 |
| **Depends on** | BRIEF-038 ✅ (#80 — menu write API, `MenuWriteService`) |
| **References** | CD-12 R7-2, editor·4, §4 "Upload photo", §9 Photo · DR-020 (Approved — presigned POST + presigned GET, private bucket) · BRIEF-038 audit F3 (Field 2026-10-23: `?includeHidden=true` + `isActive`) · `docs/schema.sql` §4 `menu_item.image_key` |
| **Audit depth** | Full (new dependency, external storage, credentials) |
| **Size** | ~1–1.5 days · est. **~700 net-new lines incl. tests** (tests ≈ 40 % counted) — above the ~500 target, see Q1 |

---

## 1. Goal
The manager can attach a photo to a menu item (JPG / PNG / WebP ≤ 5 MB, checked by S3 itself), every menu surface gets a short-lived photo URL, and the back office can see and un-hide hidden categories.

## 2. Scope
### In
- **Storage** — one `StorageService` in `app/backend/src/common/storage/` (the only code that talks to S3, DR-020) + config in `app/backend/src/providers/config/storage/`:
  - Env: `AWS_REGION`, `S3_BUCKET` (required), `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` (optional — set locally only; absent → SDK default credential chain = ECS task role later). Validated with zod like the other config modules; values never logged. Keys added to `app/backend/.env.example` with empty / placeholder values.
  - Methods (names free): presigned POST, head, copy, delete, presigned GET.
- **`POST /menu/items/image-upload-url`** `{ contentType: 'image/jpeg' | 'image/png' | 'image/webp' }` → `{ url, fields, key, expiresAt }`. Presigned POST valid 5 min; policy = exact `Content-Type` + `content-length-range` 1 … 5,242,880 bytes; key `tmp/<uuid>.<ext>`. No DB write, no event.
- **Item writes take `imageKey`** (`POST /menu/items`, `PATCH /menu/items/:id`, BRIEF-038 schemas):
  - Create: omitted / `null` = no photo; `tmp/…` = attach.
  - PATCH (whole form, like `modifierGroupIds`): **omitted → keep current**; `null` → remove; `tmp/…` → replace; the item's current key → keep; any other value → 400 `VALIDATION_ERROR`.
  - Attaching a `tmp/…` key: `HeadObject` first — missing / expired → 400 "อัปโหลดรูปใหม่อีกครั้ง"; size > 5 MB or a type outside the three → 400. Then `CopyObject` → `menu/<itemId>/<uuid>.<ext>` **before** the DB write; if the DB write fails, delete the copied object (best effort). After commit: delete the `tmp/` object and the item's previous `menu/…` object (best effort — a warning log, never fails the request; the bucket's 1-day `tmp/` lifecycle is the backstop).
- **Reads:** `MenuItem.imageUrl` = presigned GET (1 h) when `image_key` is set, else `null` — on every menu read and write response, incl. the `MENU_ITEM_STALE` `details`. Contracts: `imageUrl: z.url().nullable()` (DR-020).
- **Hidden categories (038 audit F3):** `GET /menu/categories?includeHidden=true` and `GET /menu/items?includeHidden=true` also return hidden categories and their items (items keep `availableNow: false`, existing category rule). Default (param absent / `false`) unchanged. `MenuCategory` gains `isActive: boolean` on every category response.
- Contracts (`CreateImageUploadUrlSchema`, `ImageUploadUrlSchema`, `imageKey` on create / update item, `imageUrl`, `MenuCategory.isActive`, `includeHidden` query), OpenAPI, `docs/api/README.md` Menu table + env section.

### Out (do NOT build here)
- Modifier groups / options CRUD + `MODIFIER_GROUP_IN_USE` → **BRIEF-044** (Q1) · photo UI (BRIEF-041) · CloudFront / public URLs · resize / crop / thumbnails · an orphan-cleanup job · the production bucket, IAM role, Terraform (AWS sprint, 9–20 Nov).

## 3. Contract
| Method | Path | Request → Response | Permission |
|---|---|---|---|
| POST | `/menu/items/image-upload-url` | `{ contentType }` → `{ url, fields, key, expiresAt }` | `menu:write` |
| POST | `/menu/items` | BRIEF-038 + `imageKey?: string \| null` → `MenuItem` | `menu:write` |
| PATCH | `/menu/items/:id` | BRIEF-038 + `imageKey?: string \| null` → `MenuItem` | `menu:write` |
| GET | `/menu/categories?includeHidden=true` | → `MenuCategoryList` (`isActive` on each) | `menu:read` (see Pre-decided) |
| GET | `/menu/items?includeHidden=true` | → `MenuItemList` | `menu:read` (see Pre-decided) |
- **WS events:** none new (`menu.changed` from item writes already covers a photo change).
- **Errors:** 400 `VALIDATION_ERROR` (type, missing / expired / oversized upload, foreign key) · existing BRIEF-038 errors.
- **Business rules:** bucket stays private; S3 enforces type + size at upload; the server re-checks with `HeadObject` before attaching · photo objects live under `menu/<itemId>/` only.

## 4. Acceptance Criteria
- **AC-1** — Presign with each allowed type → 200, key `tmp/<uuid>.<ext>`, policy carries the exact type and the 1 … 5 MB range (unit test decodes the policy); another type → 400.
- **AC-2** — Create with a `tmp/` key → object copied to `menu/<itemId>/…`, `imageUrl` is a presigned GET, the `tmp/` object deleted; a missing / oversized / wrong-type `tmp/` object → 400 and no item row.
- **AC-3** — PATCH: omitted keeps the photo, `null` removes it (old object deleted after commit), a new `tmp/` key replaces it (old deleted), any other key → 400.
- **AC-4** — DB write fails after the copy → the copied object is deleted; no item points at a missing object.
- **AC-5** — `includeHidden=true` returns hidden categories (`isActive: false`) and their items; default reads unchanged; `isActive` present on every category response.
- **AC-6** — The backend boots and the e2e suite runs with **no AWS access keys** and no network (e2e overrides `StorageService` with an in-memory fake); no credential value appears in logs.
- **AC-7** — Gates + run proof pass; OpenAPI + `openapi:check`; README updated.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1, AC-4 | unit | `app/backend/src/common/storage/*.spec.ts`, `menu-write.service.spec.ts` (fake storage) |
| AC-2, AC-3, AC-5, AC-6 | e2e (real Postgres, fake storage) | `app/backend/test/menu-photos.e2e-spec.ts` |
| contracts | unit | `app/packages/contracts/src/schemas/menu-write.test.ts` |

Gate commands (all must pass):
```bash
pnpm --filter @bar/contracts build
pnpm --filter @bar/contracts lint && pnpm --filter @bar/contracts typecheck && pnpm --filter @bar/contracts test
pnpm --filter @bar/backend lint && pnpm --filter @bar/backend typecheck && pnpm --filter @bar/backend test && pnpm --filter @bar/backend test:e2e
pnpm --filter @bar/backend openapi:check
```
Run proof (real dev bucket `bar-app-dev`, keys from `app/backend/.env`): presign → `curl -F` upload a JPG → `POST /menu/items` with the key → `GET /menu/items/:id` → `curl` the `imageUrl` = 200 `image/jpeg` · a 6 MB file → S3 rejects (`EntityTooLarge`) · a `text/plain` upload on a JPEG policy → S3 rejects · PATCH `imageKey: null` → the `menu/…` object is gone (HeadObject 404). Output trimmed in the handoff; no keys or signed URLs pasted in full.

### Local Sonar scan
- **Required for this brief: yes.**

## 6. Constraints
- `StorageService` is the only S3 caller; no S3 call inside a DB transaction except the copy-before-write above.
- `save()` on `menu_item`; no schema change (`image_key` exists). Need one → stop, raise a DR.
- No inline permission checks; credentials only from config, never logged or returned.

## 7. Decision Points (Field Guard)
- **Pre-decided (exact):**
  - `app/backend/package.json`: `@aws-sdk/client-s3@^3.1156.0`, `@aws-sdk/s3-presigned-post@^3.1156.0`, `@aws-sdk/s3-request-presigner@^3.1156.0` (DR-020; latest 3.x on 2026-10-23).
  - Endpoint `POST /menu/items/image-upload-url`; content types `image/jpeg`, `image/png`, `image/webp` (DR-020 — the UI may offer fewer).
  - `?includeHidden=true` on `GET /menu/categories` and `GET /menu/items` + `MenuCategory.isActive` (Field, BRIEF-038 audit F3, 2026-10-23). The routes stay `menu:read`; requiring `menu:write` for `includeHidden` arrives with the IAM brief (permissions aren't enforced yet; no inline checks).
  - Paths `app/backend/src/common/storage/`, `app/backend/src/providers/config/storage/`; env keys `AWS_REGION`, `S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`.
- **Q1 — Split the planned BRIEF-039. ✅ Decided (Field, 2026-10-23): A — photos + F3 here; modifier CRUD → BRIEF-044.** The plan had modifier-group CRUD + photos in one brief (~1,300+ lines at the recent ~1.8× rate). *Cowork recommends:* **A — this brief = photos (DR-020) + F3; modifier groups / options CRUD → BRIEF-044** (next menu backend brief; needs its own Q on deleting a group whose options appear on past orders). *Alternative:* **B — keep both here** (one review, ~3× the size target).
- **Likely DRs:** none.

## 8. Unlocked Protected Files
- `none` (`app/backend/package.json` change is covered by DR-020).

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
| 1 | 2026-10-23 | Initial Draft (Cowork) — photos (DR-020) + BRIEF-038 audit F3; modifier CRUD proposed as BRIEF-044 (Q1) |
| 1 | 2026-10-23 | Ready — Field in session: "approve all" (039 Q1 = A: photos + F3 here, modifier CRUD → BRIEF-044) |
