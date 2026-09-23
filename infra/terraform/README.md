# infra/terraform/

Empty until the cloud-setup brief (last 2 weeks of November). Layout and backend are decided in that brief, not here.

Starting proposal (to confirm in the brief):
- One root module, one environment (`demo`) — no workspaces/multi-env until needed.
- Remote state: S3 backend with `use_lockfile = true` (Terraform ≥ 1.10, no DynamoDB table).
- Providers: `hashicorp/aws`, `cloudflare/cloudflare` (DNS). `vercel/vercel` optional.
- Resource order: `docs/infra.md` → *Terraform Rollout Plan*.
