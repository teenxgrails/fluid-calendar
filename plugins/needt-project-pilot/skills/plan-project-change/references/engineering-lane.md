# Engineering lane

## Architecture

State the component boundary, public interfaces, invariants, ownership, and data flow. Compare at least one simpler alternative for high-cost or hard-to-reverse decisions.

## Data and compatibility

For schema or API changes, specify:

- additive migration order;
- backfill or default behavior;
- old/new version compatibility;
- indexes and query impact;
- rollback or recovery when rollback is unsafe;
- cleanup criteria after adoption.

Never rewrite migration history to make a plan look simpler.

## Failure design

List expected failures, user-visible behavior, retry ownership, idempotency, timeouts, partial success, and observability. Define which failures are safe to suppress and which must surface.

## Test shape

- Unit tests for pure rules and edge cases.
- Integration tests at database, provider, queue, or API boundaries.
- Contract tests for external providers and schemas.
- UI/e2e tests for critical journeys and error recovery.
- Regression tests tied to the original defect for fixes.
- Manual evidence only where automation is disproportionate.

Name the exact project commands. Do not invent scripts that do not exist.
