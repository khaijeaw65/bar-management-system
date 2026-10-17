# @bar/backend

From the repo root, start Postgres 16 and Redis, then migrate and run the API:

```bash
docker compose -f infra/docker-compose.yml up -d
cp app/backend/.env.example app/backend/.env
pnpm --filter @bar/backend migration:run
pnpm --filter @bar/backend start:dev
```

Health: `GET http://localhost:3001/api/health`

Migration scripts compile with `nest build`, then the TypeORM CLI loads `dist/providers/database/data-source.js` (`node --env-file=.env`). That file is the ESM data source; Node cannot resolve the `.js` imports in the `.ts` source without an extra loader, so the CLI runs the compiled output.

```bash
pnpm --filter @bar/backend migration:revert
pnpm --filter @bar/backend test
pnpm --filter @bar/backend test:e2e
```

## Auth

Staff sign in with LINE on the web. Only a pre-registered LINE identity gets a session. An unknown LINE account is stored as a pending access request and sent back to the login page.

After migrations, provision the first owner with that person's LINE user id (`sub`):

```bash
pnpm --filter @bar/backend seed:staff -- --line-user-id <LINE sub> --name "<display name>"
```

Running it again for the same LINE user id prints `already registered`.

`JWT_ACCESS_SECRET` must be at least 32 characters. `REDIS_URL`, `LINE_CHANNEL_ID`, `LINE_CHANNEL_SECRET`, `LINE_CALLBACK_URL`, and `FRONTEND_URL` are required before the API will boot. Use the placeholders in `.env.example` for local development and replace the LINE values with the channel from the LINE console.
