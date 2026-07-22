# Deploy Needt with Coolify + Neon

Needt production runs on the existing VPS through Coolify. Neon provides
PostgreSQL, Redis backs realtime updates and BullMQ, and the same Docker image is
deployed as a web service and a background worker. Coolify is the production
source of truth for v0.1; Vercel is not part of the release path.

## 1. Create Neon

1. Create a Neon project.
2. Copy the pooled connection string into `DATABASE_URL`.
3. Copy the direct connection string into `DIRECT_URL`.
4. Keep both values in the shared Coolify environment for the web and worker.

`DATABASE_URL` is used by the app at runtime. `DIRECT_URL` is used by Prisma migrations.

## 2. Create the Coolify services

1. Connect the GitHub repository and deploy `main` with
   `docker/production/Dockerfile` as the web service.
2. Keep the image default command for web startup.
3. Create a Redis resource and set its internal URL as `REDIS_URL` on both
   services.
4. Create a second service from the same repository, branch, Dockerfile, and
   environment. Override only its command:

```bash
node dist/worker/index.js
```

5. Do not expose the worker publicly. Deploy web first, then worker, and keep both
   on the same Git commit.
6. The web entrypoint applies lockfile-pinned Prisma migrations before starting
   Next.js. A failed migration must fail the deployment instead of starting a
   mismatched application.

## 3. Environment Variables

Required:

```bash
DATABASE_URL="postgresql://...-pooler..."
DIRECT_URL="postgresql://..."
NEXTAUTH_URL="https://use.needt.app"
NEXT_PUBLIC_APP_URL="https://use.needt.app"
NEXT_PUBLIC_SITE_URL="https://use.needt.app"
NEXTAUTH_SECRET="random-32-plus-character-secret"
CRON_SECRET="random-cron-secret"
REDIS_URL="redis://default:password@redis:6379"
WEBHOOK_BASE_URL="https://use.needt.app"
```

Calendar OAuth:

```bash
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
AZURE_AD_CLIENT_ID=""
AZURE_AD_CLIENT_SECRET=""
AZURE_AD_TENANT_ID="common"
```

Optional AI and push:

```bash
ANTHROPIC_API_KEY=""
OPENAI_API_KEY=""
AI_CUSTOM_URL=""
AI_ENCRYPTION_KEY=""
NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""
VAPID_SUBJECT="mailto:you@example.com"
```

Apple/iCloud CalDAV credentials are entered in the app at runtime and never stored in env.

## 4. Domain

1. Add `use.needt.app` to the Coolify web service. The separate marketing
   deployment owns `needt.app`.
2. Point DNS to the VPS/Coolify proxy target.
3. Confirm Coolify provisions HTTPS and the worker has no public domain.

Set `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL`, and
`WEBHOOK_BASE_URL` to the exact public HTTPS origin.

## 5. OAuth Redirect URIs

Register exact production redirect URIs:

Google:

```text
https://use.needt.app/api/auth/callback/google
https://use.needt.app/api/calendar/google/auth
```

Microsoft/Azure:

```text
https://use.needt.app/api/auth/callback/azure-ad
https://use.needt.app/api/calendar/outlook/auth
```

Keep local redirect URIs for development if needed.

## 6. Scheduled recovery jobs

Provider webhooks and the BullMQ worker handle realtime updates. Keep two Coolify
scheduled tasks as recovery paths:

- `/api/cron/sync-calendars` every 15 minutes.
- `/api/cron/reschedule` every 30 minutes.

Manual test:

```bash
curl -H "x-cron-secret: $CRON_SECRET" https://use.needt.app/api/cron/reschedule
curl -H "x-cron-secret: $CRON_SECRET" https://use.needt.app/api/cron/sync-calendars
```

The calendar cron remains a CalDAV safety net. Google and Outlook changes use verified provider webhooks plus the separate BullMQ worker documented in [realtime-sync.md](./realtime-sync.md); manual provider sync routes remain available.

## 7. Health Check

```bash
curl https://use.needt.app/api/health
```

Expected result:

```json
{ "ok": true, "db": "ok", "buildSha": "..." }
```

## 8. Notes

- The app remains single-user in product behavior, but tables keep `userId` seams so future SaaS conversion does not require a database rewrite.
- Prisma is configured with `directUrl`.
- `@prisma/adapter-neon` and `@neondatabase/serverless` are installed. Runtime uses the Neon driver adapter automatically when `DATABASE_URL` is a Neon pooled URL containing `neon.tech` and `-pooler.`; local Postgres keeps the standard Prisma client path.
- Production deploys are triggered from `main` in Coolify. Verify both web and
  worker show the same SHA before a release smoke.
