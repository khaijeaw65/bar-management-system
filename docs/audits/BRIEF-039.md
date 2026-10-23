# Audit — BRIEF-039 Backend: menu photos (S3 presigned) + hidden-category reads

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-23 |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-23 |
| **Branch / commit** | `feat/BRIEF-039-menu-photos-api` · **S = `f2ed6cf`** (work) · handoff `a7d412a` → `412d364` (run-proof updates) · seeds `8a5043e` + Ready `3cbc85a` |
| **Depth** | Full (new dependency, external storage, credentials) |
| **Brief revision** | 1 |
| **Recommendation** | **CHANGES REQUIRED** (1 Must fix) ← Field makes the final call |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1 | ✅ | `StorageService.presignUpload`: key `tmp/<uuid>.<ext>`, `Fields` + `eq $Content-Type`, `content-length-range 1 … IMAGE_MAX_BYTES`, 300 s · spec decodes the policy per type · e2e 3 types 200, gif / text / missing 400 · run proof: S3 403 on a mismatching type, `EntityTooLarge` on 6 MB | 200 not 201 — matches AC-1 wording |
| AC-2 | ✅ | `MenuPhotoService.attach`: `TMP_KEY_PATTERN` (uuid-only, no path tricks) → `HeadObject` (null → 400) → type re-check from stored `ContentType` → size 1 … 5 MB → `CopyObject` to `menu/<itemId>/<uuid>.<ext>`; id generated in the service so the copy precedes the row · `release(tmpKey)` after commit · e2e + real bucket (`cmp` identical bytes, tmp 404 after save) | |
| AC-3 | ✅ | `nextImageKey`: omitted keep · null remove · attached tmp replace · current keep · else 400 (judged under the row lock); `replaced` released after commit · e2e ×7 incl. stale (copy dropped) and cleanup failure still 200 · real bucket PATCH null → object 404 | |
| AC-4 | ✅ | `createItem` / `updateItem` catch → `photos.discard(photo)` · unit + e2e (refused modifier group → `menu/` empty) | |
| AC-5 | ✅ | `includeHidden` `true` / `false` only (else 400) on both lists; `listed` = `categoryActive` only, so the bypass is exact; hidden items `availableNow: false` · `MenuCategory.isActive` on list / create / rename / reorder | |
| AC-6 | ⚠️ | Boot without keys ✅ (`set-auth-env` forces keys empty, other 21 suites boot) · fake storage in photo e2e ✅ · config errors name the variable only (spec) ✅ · log grep 0 ✅ — **but** a signing failure is not contained: Finding 1 | |
| AC-7 | ✅ | Handoff gates on `ed1b45c` (tree = `f2ed6cf` + one README line): contracts 65, backend unit 128, e2e 144, `openapi:check` 0 · Cowork re-ran contracts + backend `tsc --noEmit` and `check-class-files` (exit 0) | |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Dependencies (DR-020) | ✅ | exactly the three `@aws-sdk/*@^3.1156.0` in `app/backend/package.json`; lockfile = their tree |
| Only `StorageService` talks to S3 | ✅ | `common/storage/`; `MenuPhotoService` / `MenuCatalogService` call it |
| No storage call inside a DB transaction (§6) | ❌ | copy is outside (stricter than the brief ✅) — but `presignRead` runs inside `SoldOutService.toggle` (`@Transactional`) via `setAvailability → toItem` — Finding 1 |
| Credentials | ✅ | keys only when both set; blank = unset; never logged or returned; `.env.example` placeholders |
| Contracts | ✅ | `imageUrl: z.url().nullable()` (DR-020 lock), `imageKey` max 500, upload schemas, `isActive`, `includeHidden` |
| Permissions | ✅ | `menu:write` on presign; reads stay `menu:read` (Pre-decided) |
| No schema change | ✅ | `image_key` existed |
| Frontend touched (not an affected app) | ✅ | 2 fixture files gain `isActive: true` — forced by the contract, no UI change |
| Sonar | ✅ | none in files this brief adds or changes |
| Size | ⚠️ | ~1,194 net app lines (tests ≈ 63 %) vs ~700 — I/O-heavy test setup again |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | **Must fix** | High | **Current:** `MenuCatalogService.toItem` awaits `storage.presignRead(record.imageKey)` with no error handling. `toItem` serves `GET /menu/items` (POS order entry, `Promise.all` over every item), `getItem`, the write responses **and** `setAvailability`, which `SoldOutService.toggle` calls inside `@Transactional()` before auto-voiding. With static keys signing is local and can't fail, but with the ECS task role (AWS sprint) the SDK resolves credentials over the network: one failure → the whole POS menu returns 500, and an 86 rolls back with its auto-voids — a decorative photo taking down the core slice. **Updated:** signing never fails a menu read or write — catch in `toItem` (or a `StorageService.tryPresignRead`) → `imageUrl: null` + `warn` with the object key only. Tests: storage `presignRead` rejects → `GET /menu/items` 200 with `imageUrl: null` for that item, and `markUnavailable` still commits + auto-voids (unit with the fake, or e2e with `FakeStorage` set to throw). |
| 2 | Suggestion (BRIEF-042) | Low | Handoff: `demo-history-seed.e2e-spec.ts` orders by `1::text` (a constant) → payment-method order is arbitrary; failed once. **Updated:** `ORDER BY confirmed_via::text` — BRIEF-042 already touches `demo-history`, fold it in there. |
| 3 | Info (AWS sprint) | — | Without `s3:ListBucket`, `HeadObject` on a missing key returns 403 → a 500 instead of the designed 400 (seen in the first run proof; fixed on the dev user). **Updated:** the production IAM policy / Terraform (9–20 Nov) grants `s3:ListBucket` on the bucket + `Get/Put/Delete` on `tmp/*` and `menu/*`. Carry over. |
| 4 | Info (Field, rules) | — | `backend.md` still plans `providers/infrastructures/storage/aws-s3-storage.service.ts`; DR-020 (Approved) + the brief put `StorageService` in `common/storage/`. Approved DR > rules, so the code is right; the rules line is stale → Field-approved edit of `backend.md`. |
| 5 | Info (setup) | — | `AWS_REGION` and `S3_BUCKET` are now required at boot. An existing `app/backend/.env` without them (e.g. Metee's checkout) stops the backend until they are added — any value works without photos. Session-start env check reports it; worth one line to Metee. |

## Recommendation to Field
CHANGES REQUIRED — one small fix. The upload path is careful (S3-enforced policy, server re-check, copy outside the transaction, cleanup after commit, uuid-only keys) and the real-bucket proof is complete. The gap is the read side: signing a photo URL can currently fail the POS menu and the sold-out toggle. Degrade to "no photo" instead — ~10 lines + one test.

**Next command:** `execute BRIEF-039` (fix Must fix #1; report the new S for a compact re-check).

## Evidence Coverage
- Reviewed work SHA: `f2ed6cf` (handoff `412d364`; `git diff main...HEAD`)
- Sources inspected independently: `storage.service.ts`, `storage.module.ts`, `providers/config/storage/*` (env parsing, credentials), `menu-photo.service.ts`, `menu-write.service.ts` / repository diffs (create / update order, `nextImageKey`, lock query), `menu-catalog.service.ts` diff (`toItem` signing, `includeHidden`), `menu-availability.ts` (`listed`), `sold-out.service.ts` (`@Transactional` toggle → `setAvailability`), `menu.controller.ts` / `menu-item-write.controller.ts` diffs, contracts `menu.ts` / `menu-write.ts`, `package.json`, `.env.example`, `set-auth-env.ts`, e2e test list
- Tests: Cowork re-ran contracts + backend `tsc --noEmit` and `check-class-files` (exit 0) on `412d364`; oxlint, Vitest, Jest, e2e and `openapi:check` not re-run (macOS-built binaries) → handoff exits + `ci` on H.
- Run proof: read from the handoff (real bucket, incl. the superseded pre-IAM-fix run).
- Written uncommitted; the executor commits it unchanged at PASS.

## Re-audit — 2026-10-23 (Cowork) · S = `a8dabae`
**Change since `f2ed6cf`:** one fix commit, 4 files (+50 / −2): `menu-catalog.service.ts`, its spec, `test/fake-storage.ts`, `test/menu-photos.e2e-spec.ts`. No contract, schema, dependency or other module change.

| Finding | Result | Evidence |
|---|---|---|
| 1 (Must fix) | ✅ Fixed | `toItem` → `photoUrl(imageKey)`: `null` without a key; `presignRead` wrapped in try / catch → `null` + `warn` with the object key and the error **name** only (no message, no credentials). Unit: signing rejects → `getItem`, `listItems` (both entries `null`) and `setAvailability` (`changed: true`, `availableNow: false`) all answer. e2e with `FakeStorage.failRead`: `GET /menu/items` and `/:id` 200 with `imageUrl: null`, `POST …/mark-unavailable` 200 and `is_available = false` in the DB (the `@Transactional` toggle commits), signing restored → URL back. |

Signing still runs inside the 86 transaction; it can no longer fail it, and with the task role the SDK caches credentials — accepted, no change needed.

- Cowork re-ran backend `tsc --noEmit` and `check-class-files` on `a8dabae` (exit 0). Unit / e2e not re-run here (macOS-built binaries) → executor's run + `ci` on H.
- Findings 2–5 unchanged (Suggestion / Info, no action on this branch).

**Result: PASS** — zero Must fix. Audited S = `a8dabae`.

**Next command:** `execute BRIEF-039` (PASS commit: this audit unchanged + handoff + state, then PR; Field's own PR — merge once `ci` is green on H and S..H is evidence-only).

## Re-check — 2026-10-23 (Cowork) · `3853a4b` (§7 compact re-check after a post-PASS change)
**Trigger:** `ci` red on the PASS head `6f2c39e` — the known `demo-history-seed` flake (Finding 2).

| Check | Result |
|---|---|
| `6f2c39e` (PASS commit) | evidence only — this audit committed unchanged (byte-identical), handoff, KJ state |
| `3853a4b` diff | `test/demo-history-seed.e2e-spec.ts` only, 1 line: `ORDER BY 1::text` (a constant expression, not column 1 → arbitrary order) → `ORDER BY confirmed_via::text`; the expected `['cash', 'manual', 'slip_verify']` is now the deterministic alphabetical order. No app code, contract, schema or dependency change |

Finding 2 is fixed here instead of in BRIEF-042 — BRIEF-042 no longer needs it.

**Result: PASS** (unchanged). Audited S = `3853a4b`.

**Next command:** `execute BRIEF-039` — commit this re-check unchanged as the new H (`docs(BRIEF-039): audit re-check 3853a4b`), push, merge once `ci` is green on that H (Field's own PR; S..H evidence-only).
