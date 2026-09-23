# infra/

All infrastructure files live here. Application code never does.

| Path | What | When |
|---|---|---|
| `infra/docker-compose.yml` | Local dev: Postgres 16 + Redis | Created by the first brief that needs a local DB (`BE-000` or later) |
| `infra/terraform/` | AWS + Cloudflare (+ Vercel) as code | Last 2 weeks of November — see `docs/infra.md` |

Rules:
- Protected: agents edit files here only when a `Ready` brief lists the exact path as unlocked.
- Never commit Terraform state, `.tfvars` with secrets, or `.terraform/` (see `infra/terraform/.gitignore`).
- Decision: `docs/decisions/DR-001-iac-terraform.md`.

Run local dev from repo root:
```bash
docker compose -f infra/docker-compose.yml up -d
```
