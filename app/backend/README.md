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

## Phone & webhooks via tunnel

A phone on another network, LINE's login redirect, and later the payment webhook all reach this API through one stable HTTPS URL. Nothing in Compose or `package.json` starts the tunnel.

1. Create a free ngrok account and one static domain. The domain stays the same across restarts, so LINE and the phone do not need a new URL each time.
2. Start the API on port 3001, then run `ngrok http --url=<static-domain> 3001`.
3. Set `LINE_CALLBACK_URL=https://<static-domain>/api/auth/line/callback` in `.env`. Add that same URL in the LINE Developers console → LINE Login channel → Callback URL. Keep the localhost callback for web login on this machine.
4. The Expo app (BRIEF-022) uses `EXPO_PUBLIC_API_URL=https://<static-domain>/api`.
5. The payment webhook (BRIEF-013) will use `https://<static-domain>/api/...` on this same tunnel. Nothing else is set up here.

`MOBILE_REFRESH_TTL_DAYS` (default 30) is the sliding lifetime of an Expo staff session. Web sessions stay on `REFRESH_TTL_DAYS`.

## Seed order

After migrations, run these in order. Each command is safe to run again: it upserts by a natural key and does not insert a duplicate.

1. `pnpm --filter @bar/backend seed:staff -- --line-user-id <LINE sub> --name "<display name>"`
2. `pnpm --filter @bar/backend seed:venue` — the venue (`slug` `main`, kitchen display off, business-day cut-off 06:00) and the floor seats
3. `pnpm --filter @bar/backend seed:menu` — the sample menu

