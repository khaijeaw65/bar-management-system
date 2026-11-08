# DR-032 — Replace the LLM API with our own ML models (no LLM)

| | |
|---|---|
| **Status** | Approved |
| **Raised by** | Field via Cowork · 2026-11-07 (session, after advisor review) · updated 2026-11-08 with interview Topic 8 (M1–M4) |
| **Brief / Feature** | none yet → `docs/features/ml-insight/`, `guest-intelligence/` · supersedes DR-014 #11 |
| **Category** | Flow/Architecture · Dependency · Sensitive (guest data) |

## Context
Advisor review (Nov 2026): the AI part should be machine learning we build and train ourselves, not a call to an LLM API (OpenAI / Claude / Gemini). Field confirmed in session (2026-11-07):
- **No LLM at all** — not for explanations, not for note summaries.
- **AI guest intelligence comes back**, opt-in per venue, to help bartenders who join later know what regulars usually drink.
- **No real sales data** from the visited bars is available → training data must be synthetic + a public dataset.

DR-014 #11 (owner insight via OpenAI, `ai_insight` table) is not built — no code or migration to remove.

## The models (same for every option below)
| Model | Purpose | Method | Replaces |
|---|---|---|---|
| Demand forecast (M1) | usage per **stock item** per day → reorder list / PO hint ("ควรสั่ง Jameson 4 ขวดก่อนศุกร์") + busy level per night on the roster | LightGBM vs a seasonal-naive baseline; features: day of week, payday window, Thai public holidays, no-sale days, promo active, event type, tickets sold so far (DR-031) | DR-014 #11 (3) menu & stock suggestions |
| Anomaly detection (M2) | unusual shifts: voids / comps by reason and person, voids after payment attempt, manual vs verified payments, cash over / short, loss per container ("เปิดของใหม่"), unmet "ยังมีของ" override claims, tickets sold vs checked in | Isolation Forest (unsupervised — no labels needed) + the fixed rule checks | DR-014 #11 (2) fraud alerts |
| Recommendation (M3) | "guests who like A also like B" — guest intelligence + upsell | item-based collaborative filtering on order history | dropped AI guest summary |

- **Sales summary** (DR-014 #11 (1)) = SQL report + Thai text template. No model needed.
- **Anomaly output (M2):** owner-only alert list — facts + "ควรตรวจสอบ"; an alert may name the staff involved (fraud view) but there is **never a staff ranking or score** (FRD cut: staff performance analytics).
- **ML health page (M4):** owner-only — last run, status, each model's metrics vs its baseline (forecast error vs simple average, anomaly precision on planted cases, recommendation hit-rate). Reads `ml_model_run`.
- **Explanations** = Thai templates filled from the numbers, e.g. "ยอด void กะนี้สูงกว่าค่าปกติ 3 เท่า — ควรตรวจสอบ". Facts + "ควรตรวจสอบ", never accuse (unchanged).

## Data plan (no real data)
1. **Synthetic generator** (Python) — realistic bar patterns (weekend peaks, payday window, holidays, promos, rainy nights) + **injected fraud patterns** with known labels.
2. **Public dataset** — a real restaurant/bar sales dataset to validate the forecast on real-world noise (choose in `ml-insight/design.md`).
3. **Evaluation** — forecast: time-based backtest, MAPE vs seasonal-naive baseline; anomaly: precision / recall on the injected cases; recommendation: hit-rate@k on held-out orders. Every model run stores its metrics.
4. **Honest limit** (for the advisor): models are proven on synthetic + public data; the pipeline retrains on a pilot bar's real data without code changes.

## Options

### Option A — Python batch job → Postgres; NestJS reads results *(recommended)*
- **Pros / Cons:** NestJS stays the only API; ML runs daily anyway; cheap (scheduled container, no always-on service); Python stack is standard for ML / no on-demand prediction (next run only); a second language in the repo `[new to Field: Python ML stack]`.
- **Under the hood:**
  1. Schedule fires daily after the 06:00 business-day cut-off (local: `docker compose run ml`; AWS: EventBridge → ECS scheduled task — DR-033).
  2. Job reads orders / stock / shifts / events from Postgres (DB role: read app tables, write `ml_*` only), trains or loads the model, predicts.
  3. Writes results to `ml_model_run` (version, metrics, period) + result tables (`ml_forecast`, `ml_anomaly`, `guest_recommendation`).
  4. NestJS `InsightModule` reads the latest successful run and fills the Thai templates for the dashboard / bartender screen.
  - **Transaction boundary:** one job = one transaction for its result rows + `ml_model_run.status = succeeded`.
  - **Failure & cleanup:** job fails → transaction rolls back, run marked `failed`, NestJS keeps showing the previous successful run with its date.

### Option B — Python FastAPI inference service [new to Field]
- **Pros / Cons:** on-demand predictions / a second always-on service (more ECS cost, health checks, auth between services), breaks the "one backend process" lock harder; not needed for daily forecasts.

### Option C — Train in Python, export to ONNX, run in Node [new to Field]
- **Pros / Cons:** inference inside NestJS / ONNX export of LightGBM / Isolation Forest / CF adds conversion steps and debugging pain; training still needs Python.

## Guest intelligence (applies to every option)
- **Attach points (M3):** guest QR login, staff attach at seat open, reservation "ลูกค้ามาแล้ว" (DR-031 module 6). Shown on the POS seat panel + staff app.
- **Two-layer opt-in:** `venue.guest_intelligence_enabled` (default off) **and** the customer's PDPA consent (FRD §4). Either off → nothing collected or shown.
- **Bartender sees:** usual order (top 3 items + modifiers — SQL), recommended items (CF), flags (allergy, VIP), active bottle keep, staff notes (plain text).
- **Never shown:** spend amounts or behaviour judgments ("ดื่มหนัก"). Preferences only.
- **Cold start:** no history → venue's popular items.
- **Known risk:** works only for identified guests (LINE login via QR, or staff attach at seat open). Counter QR is off by default (DR-014 #5) → guest attach on the POS must be fast (search by name / phone) or the feature sees few guests.

## Recommendation
Option A. Daily batch fits every model above, keeps NestJS as the single API, and costs a scheduled container instead of a service. Order: synthetic generator (9–20 Nov) + notebook baselines with metrics (by the 14 Dec Semester 1 final) → Python batch job + `ml_*` tables (Dec–Jan) → forecast + anomaly live + ML health page (Feb) → recommendation / guest intelligence (1–15 Mar).

## If Approved — Locks
- `CLAUDE.md` / `AGENTS.md` (protected — Field edits): Tech Stack row **AI → "Own ML: Python (pandas, scikit-learn, LightGBM) batch job — no LLM API"**; Architecture Shape adds **"+ one Python ML batch job (scheduled, writes to Postgres; no API)"**.
- No LLM / OpenAI dependency anywhere in the repo.
- Schema: `ai_insight` + `ai_insight_kind` removed from `schema.sql`; new `ml_model_run`, `ml_forecast`, `ml_anomaly`, `guest_recommendation`, `venue.guest_intelligence_enabled` (exact columns in feature `design.md`, Field's OK).
- New repo path `app/ml/` (Python, own lint/test in CI); infra: ECS scheduled task + DB role (read app tables, write `ml_*`) — see DR-033 / `infra.md`.
- Anomaly alerts may name staff; no staff ranking or score anywhere. ML health page is owner-only.
- DR-014 #11 superseded; FRD §10 / §12 rewritten.

---

## Decision — Field only
**Decision:** Approved: A (Python daily batch job → Postgres, M1–M4 as written)
**Why:** Advisor requires own-trained ML, no LLM; a daily batch job fits every model and keeps NestJS the only API.
**Date:** 2026-11-08 (Field, in session — recorded by Cowork)
