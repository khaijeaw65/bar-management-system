# DR-020 — Menu photos on S3: presigned upload + presigned read

| | |
|---|---|
| **Status** | Approved |
| **Raised by** | Cowork · 2026-10-22 |
| **Brief** | BRIEF-039 (menu photos API) · BRIEF-041 (photo UI) |
| **Category** | Dependency · Flow/Architecture |

## Context
CD-12 R7 (Field accepted 17 Oct) needs menu photos: `POST /menu/items/image-upload-url`, type + 5 MB checked **server-side**, `image_key` stored on the item (column already in `schema.sql` §4). Field created a dev bucket on 22 Oct: `bar-app-dev`, `ap-southeast-1`, private, credentials in `app/backend/.env` (gitignored). The backend has no AWS SDK yet, and `MenuItemSchema.imageUrl` is `z.null()` today. Photos were planned for after the AWS sprint; Field moved them forward (22 Oct).

## Options
**A) Presigned POST for upload + presigned GET for read (bucket stays private)** — `@aws-sdk/client-s3` + `@aws-sdk/s3-presigned-post` + `@aws-sdk/s3-request-presigner`. Upload policy enforces `content-length-range` ≤ 5 MB and `Content-Type` ∈ `image/jpeg|png|webp` at S3 itself (a presigned PUT can't enforce size). Uploads go to `tmp/<uuid>`; on item save the backend copies to `menu/<itemId>/<uuid>.<ext>` and deletes the tmp object (the bucket's 1-day `tmp/` lifecycle cleans abandoned uploads). Menu responses carry `imageUrl` = presigned GET (1 h). Works the same on the AWS-sprint bucket (ECS task role instead of keys). / Three small SDK packages; image URLs expire (clients refetch the menu, which they already do).
**B) Presigned PUT + public-read objects** — one fewer package, permanent URLs. / Size can't be enforced server-side (breaks CD-12 R7); public objects need the bucket's public-access block turned off.
**C) Upload through the backend (multipart → S3)** — full control. / Every photo passes through the API (memory, timeouts, ECS bandwidth later); new multipart dependency anyway.

## Recommendation
A — it is the only option that meets R7 (server-side type + size) with a private bucket, and it moves unchanged to the production bucket in the AWS sprint (credentials come from the task role, not env keys). A CDN (CloudFront) for public, cacheable URLs can replace presigned GET later without touching the upload path.

## If Approved — Locks
- `app/backend`: `@aws-sdk/client-s3`, `@aws-sdk/s3-presigned-post`, `@aws-sdk/s3-request-presigner` (latest 3.x at install, exact versions in the brief); one `StorageService` in `common/storage/` — the only place that talks to S3.
- Env keys: `AWS_REGION`, `S3_BUCKET`, `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` (local dev only; validated in config, never logged). Production uses the ECS task role (no keys).
- Bucket private; upload = presigned POST (≤ 5 MB, jpeg / png / webp, 5 min); read = presigned GET (1 h); keys `tmp/…` → `menu/<itemId>/…` on save.
- Contracts: `MenuItemSchema.imageUrl` → `z.url().nullable()`.

---

## Decision — Field only
**Decision:** Approved: A
**Why:** Only option that enforces type + 5 MB server-side with a private bucket; moves unchanged to the production bucket.
**Date:** 2026-10-22 · recorded by Cowork on Field's explicit instruction (session)
