# Realtime calendar sync

Needt uses one production image in two process modes:

- **Web:** `node server.js` (the image default)
- **Worker:** `node dist/worker/index.js` (Coolify command override)

Provider notifications never perform calendar work inside the HTTP request. A
verified Google or Microsoft webhook enqueues a feed-specific BullMQ job, the
worker syncs that feed, and Redis pub/sub notifies the authenticated browser
through `/api/stream`. The existing `/api/cron/*` routes remain the periodic
safety net because provider notifications are not guaranteed delivery.

## Environment

Both the web and worker services need the same application secrets plus:

```bash
REDIS_URL=redis://default:password@redis:6379
WEBHOOK_BASE_URL=https://use.needt.app
```

`WEBHOOK_BASE_URL` defaults to `NEXTAUTH_URL`. In production it must be a public
HTTPS origin with a valid certificate. The resulting provider endpoints are:

- `https://use.needt.app/api/webhooks/google`
- `https://use.needt.app/api/webhooks/outlook`

Keep `REDIS_URL` private. Google channel tokens and Microsoft `clientState`
values are randomly generated, stored in `CalendarWebhook`, and checked before a
job is accepted.

## Coolify

1. Add a Redis resource to the Coolify project and copy its internal connection
   URL into `REDIS_URL`.
2. Deploy the Needt repository as the web service. Keep the Docker image's
   default command (`node server.js`).
3. Create a second application/service from the same repository, branch,
   Dockerfile, and environment variables.
4. In the second service, override the command with:

   ```bash
   node dist/worker/index.js
   ```

5. Do not expose a public port for the worker. It only needs outbound access to
   Postgres, Redis, Google, and Microsoft Graph.
6. Deploy the web service first so migrations run, then deploy the worker.
7. Keep one worker replica initially. Calendar sync jobs support retries and
   feed-level deduplication; additional replicas can be added when load requires
   them.

The worker creates a recurring renewal scheduler at startup. It refreshes
expiring Google watch channels and Microsoft Graph subscriptions every six
hours. `SIGTERM` and `SIGINT` close all BullMQ workers cleanly during deploys.

## Google Calendar

The existing OAuth redirect remains:

```text
https://use.needt.app/api/calendar/google
```

In Google Cloud Console:

1. Enable Google Calendar API for the OAuth project.
2. Add the redirect above to the OAuth client's authorized redirect URIs.
3. Configure the OAuth consent screen and authorized domains for `needt.app`.
4. Ensure `WEBHOOK_BASE_URL` is publicly reachable over HTTPS.

Google requires a separate `events.watch` channel for each calendar, requires a
valid HTTPS certificate, sends only change headers (not event bodies), and does
not automatically renew channels. Needt therefore validates
`X-Goog-Channel-ID`, `X-Goog-Resource-ID`, and `X-Goog-Channel-Token`, then runs
an incremental sync using the stored Google `syncToken`.

Reference: [Google Calendar push notifications](https://developers.google.com/workspace/calendar/api/guides/push).

## Microsoft Outlook / Graph

The existing OAuth redirect remains:

```text
https://use.needt.app/api/calendar/outlook
```

In Microsoft Entra admin center:

1. Add the redirect above to the app registration's Web platform.
2. Grant delegated `User.Read`, `Calendars.ReadWrite`, and `offline_access`
   permissions and consent them for the account/tenant.
3. Keep the Outlook webhook public. Microsoft validates it by POSTing a
   `validationToken`; Needt returns that token as `text/plain` before reading a
   notification body.

Needt persists the Graph subscription ID, expiry, and random `clientState`.
Every change notification must match both the subscription and `clientState`
before a feed sync is queued. Outlook sync continues from the feed's delta token
and falls back to the existing full-sync path when required.

References:

- [Receive Microsoft Graph change notifications through webhooks](https://learn.microsoft.com/en-us/graph/change-notifications-delivery-webhooks)
- [Microsoft Graph subscription resource and lifetimes](https://learn.microsoft.com/en-us/graph/api/resources/subscription?view=graph-rest-1.0)

## Operations and fallback

- A provider webhook queues only its own `CalendarFeed`.
- Successful calendar sync publishes `calendar-updated` and queues the user's
  deterministic reschedule.
- Successful scheduling publishes `tasks-updated`.
- `/api/stream` is session-authenticated, Node.js runtime only, and sends a
  heartbeat to prevent proxy idle timeouts.
- The browser reconnects automatically and refreshes both TanStack Query cache
  keys and the existing Zustand calendar/task stores.
- Keep `/api/cron/sync-calendars` and `/api/cron/reschedule` scheduled as
  periodic recovery paths for missed provider notifications.
