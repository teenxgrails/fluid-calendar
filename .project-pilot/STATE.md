# Project state

Updated: 2026-07-22

## Current outcome

Ship a stable **Needt v0.1 personal beta** on `use.needt.app`. The feature set is
frozen: work now moves from feature creation to production verification, blocker
fixes, and release evidence.

## Status

- Completed:
  - Single-user Needt shell, deterministic scheduler, smart-scheduling data,
    scheduled chunks, optional provider-neutral AI, and connector API.
  - Calendar, Today daily agenda, Focus timer, Boards, Mail, Settings, command
    palette, responsive mobile shell, PWA/offline foundation, and realtime worker.
  - Dark/light design-token foundation and the current cross-screen design pass.
  - Docker startup fix pins the Prisma 6 CLI instead of downloading Prisma 7.
- Active:
  - Release stabilization and evidence collection.
  - Coolify/VPS is confirmed as the v0.1 production target.
  - Two local AI companion commits exist on `main` but are not yet on `origin/main`.
- Verify:
  - Latest Today, Focus, Boards, mobile, Settings, integration map, and AI companion
    changes have implementation evidence but not one current end-to-end release pass.
  - Production web + worker are running the latest schema and code.
  - Authenticated create → schedule → complete/reschedule flow on desktop and PWA.
  - Live Google, Outlook, Apple/iCloud, Mail, AI, Redis/SSE, and connector behavior.
- Blocked:
  - Provider-level verification needs production credentials and access owned by
    the project owner.

## Next action

**Owner: Codex.** Publish the two local companion commits and the project-plan
update, then deploy the same commit to the Coolify web and worker.

Inputs: production access, database connection, Redis, and current environment
values.

Done condition: `origin/main`, the production web service, and the worker report the
same commit; migrations including `20260722013000_daily_agendas` are applied; the
health endpoint reports database connectivity.

## Open decisions

- None currently blocking RC0. Creem remains implemented but is not a personal-beta
  gate; the AI companion is included in the release candidate and must pass smoke.
