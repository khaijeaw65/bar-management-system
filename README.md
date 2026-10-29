# Bar Management System

AI-powered bar management system for small-to-medium counter bars in Thailand — POS, order → pay → close, bottle-keep, PromptPay QR payment, real-time bar/kitchen display, and AI owner insight (sales / anomaly / menu).

Senior capstone project — DPU Computer Engineering (2 semesters, deadline April 2027).

| Role | Name |
|---|---|
| Project Lead / Backend | ณัฐวัฒน์ จิรกุลประดิษฐ์ (66210096) |
| Frontend Developer | เมธี สิริปาณสาร (630107030019) |
| Advisor | อ.สนายุ จินตนาวรรณกุล |

---

## Stack

| Layer | Choice |
|---|---|
| Backend | NestJS modular monolith (ESM) + TypeORM, Vitest |
| Frontend | Next.js 16 + HeroUI v3 + Tailwind v4, axios + TanStack Query |
| Mobile | Expo (React Native) — staff surface |
| Shared | `@bar/contracts` — shared enums, types, Zod schemas |
| Data | PostgreSQL 16 · Redis 7 (permission cache, sessions, BullMQ, WebSocket pub/sub) |
| Auth | LINE SSO + JWT + refresh token rotation |
| Payment | PromptPay QR + webhook |
| AI | OpenAI API |
| Infra | AWS (ECS/ECR, RDS, S3, ElastiCache) + Cloudflare via Terraform · frontend on Vercel |
| CI | GitHub Actions + local SonarQube |

Architecture and stack are locked — see [`CLAUDE.md`](CLAUDE.md) and `docs/decisions/`.

---

## Repo layout

```
app/
  backend/             NestJS API + WebSocket gateway + webhooks   (@bar/backend)
  frontend/            Next.js web — POS, staff, customer QR        (@bar/frontend)
  mobile/              Expo staff app                               (@bar/mobile)
  packages/contracts/  shared types/schemas                         (@bar/contracts)
docs/                  FRD, schema, ERD, briefs, decisions, rules, state
infra/                 docker-compose (local) + terraform (cloud, from late Nov)
ops/github/            branch rulesets
scripts/               SonarQube scan + report
```

pnpm workspace + Turborepo.

---

## Quick start

Requires **Node ≥ 22**, **pnpm 10**, Docker.

```bash
pnpm install

# Postgres + Redis (and SonarQube)
docker compose -f infra/docker-compose.yml up -d

# Backend
cp app/backend/.env.example app/backend/.env     # fill LINE_* values
pnpm --filter @bar/backend migration:run
pnpm --filter @bar/backend seed:staff -- --line-user-id <LINE sub> --name "<name>"
pnpm --filter @bar/backend start:dev             # http://localhost:3011/api

# Frontend
cp app/frontend/.env.example app/frontend/.env.local
pnpm --filter @bar/frontend dev                  # http://localhost:3010

# Mobile (dev build)
pnpm --filter @bar/mobile start
```

- Ports: web **3010** · API **3011** · Playwright MSW e2e **3100** · reserved for a future real-API e2e **3110 / 3111**. An older `.env` / `.env.local` keeps 3001 / 3000 until you copy the new `.env.example` values.
- Health check: `GET http://localhost:3011/api/health`
- OpenAPI UI (local): `http://localhost:3011/api/docs`
- Phone / LINE callback / webhooks over a tunnel (ngrok): see [`app/backend/README.md`](app/backend/README.md#phone--webhooks-via-tunnel)

---

## Common commands (repo root)

| Command | What |
|---|---|
| `pnpm dev` | Run all apps in dev mode |
| `pnpm build` | Build everything |
| `pnpm lint` · `pnpm typecheck` · `pnpm test` | Checks across the workspace (same as CI) |
| `pnpm --filter @bar/backend test:e2e` | Backend e2e (needs Docker services) |
| `pnpm --filter @bar/backend openapi:check` | Verify `docs/api/openapi.json` matches the code |
| `pnpm sonar` · `pnpm sonar:report` | Local SonarQube scan before commit — see `docs/quality/README.md` |

CI runs affected lint + typecheck + test, backend e2e when affected, and the OpenAPI drift check.

---

## Docs map

| Need | Go to |
|---|---|
| Feature scope (and what's cut) | [`docs/FRD.md`](docs/FRD.md) |
| Database | [`docs/schema.sql`](docs/schema.sql) · [`docs/erd.html`](docs/erd.html) |
| API spec | [`docs/api/openapi.json`](docs/api/openapi.json) |
| Architecture decisions | [`docs/decisions/`](docs/decisions/) (DR-###) |
| Work items | [`docs/briefs/`](docs/briefs/) (BRIEF-###) |
| Current progress | `docs/state/kj/` · `docs/state/methee/` |
| Workflow, roles, Git, merge rules | [`docs/rules/workflow.md`](docs/rules/workflow.md) |
| Infra plan | [`docs/infra.md`](docs/infra.md) · [`infra/README.md`](infra/README.md) |
| Agent context | [`CLAUDE.md`](CLAUDE.md) · [`AGENTS.md`](AGENTS.md) |

---

## How work happens

Every change goes through a brief: **Draft → Ready → Implemented → Audit PASS → PR → CI green → merge → Done**. One brief = one branch = one PR. New dependencies, schema/contract changes, architecture or auth/payment/PDPA changes need an approved DR first. Details: [`docs/rules/workflow.md`](docs/rules/workflow.md).
