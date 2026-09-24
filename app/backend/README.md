# @bar/backend

From the repo root, start Postgres 16 and Redis, then migrate and run the API:

```bash
docker compose -f infra/docker-compose.yml up -d
cp app/backend/.env.example app/backend/.env
pnpm --filter @bar/backend migration:run
pnpm --filter @bar/backend start:dev
```

Health: `GET http://localhost:3001/api/health`

Migration scripts compile with `nest build`, then the TypeORM CLI loads `dist/database/data-source.js` (`node --env-file=.env`). That file is the ESM data source; Node cannot resolve the `.js` imports in the `.ts` source without an extra loader, so the CLI runs the compiled output.

```bash
pnpm --filter @bar/backend migration:revert
pnpm --filter @bar/backend test
pnpm --filter @bar/backend test:e2e
```
