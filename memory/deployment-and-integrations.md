---
name: deployment-and-integrations
description: How Axxeler CRM is deployed in production and how Meta/Google integrations get their credentials
metadata:
  type: project
---

Axxeler CRM (this repo) deploys to https://crm.axxeler.in. Frontend = nginx SPA + `/api/` reverse-proxy to the backend container; backend = Express + Prisma(Postgres) + Redis/BullMQ. Images are `ghcr.io/wasiq2004/axxeler-crm-*:latest`, built by GitHub Actions and auto-deployed by Watchtower (~5 min after each git push). So shipping = commit + push to `main`.

Meta and Google integrations do NOT require env-var credentials. They read credentials from the DB `IntegrationConfig` table, populated at runtime via Settings → Integrations (Meta App ID/Secret) and the Google Sheets tab (Google OAuth client + connect flow). env vars are only fallback. "Not connecting" in prod is usually missing credentials (must come from developers.facebook.com / Google Cloud Console) — not a code bug.

OAuth redirect URIs and webhook URLs must use the public https origin (NOT `:4000`). Frontend builds these via `getServerOrigin()` in [[src/api/serverOrigin.ts]] which returns `window.location.origin` in prod and `:4000` only on localhost.

Uploads (avatars/logos) are served at `/api/uploads/<file>` by the backend (multer disk storage → `UPLOAD_DIR=/app/uploads` volume + `express.static`). nginx must keep `location ^~ /api/` (priority over the static-asset regex) and `client_max_body_size` ≥ the multer limit, or uploaded images 404 / large uploads 413.

Backend `tsc` has ~41 pre-existing type errors; the Dockerfile builds with `tsc ... || true` and `noEmitOnError:false`, so JS still emits. Don't treat those as regressions.
