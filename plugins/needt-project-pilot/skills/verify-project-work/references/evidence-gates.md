# Evidence gates

## Universal gates

- Requirements trace to implementation and at least one check.
- Changed code passes the repository's focused static and test commands.
- Failure paths are exercised, not only happy paths.
- Documentation and configuration match runtime behavior.
- No secret, generated artifact, debug output, or unrelated user change is included.

## Data gate

- Migration is additive or has a documented recovery strategy.
- Existing rows and old application versions have defined behavior.
- Backfill, indexes, constraints, and rollback limitations are tested.

## API/provider gate

- Request/response contracts are validated.
- Auth, timeout, rate limit, retry, idempotency, and partial failure are covered.
- Provider failure degrades according to the product contract.

## UI gate

- Loading, empty, error, success, disabled, and destructive states work.
- Keyboard navigation, focus, labels, contrast, and reduced motion are checked.
- Responsive behavior is verified at meaningful widths.
- Visual evidence uses the project's reference or snapshot convention.

## AI gate

- Outputs are schema-validated and unsafe/malformed results fail closed or fall back.
- A versioned evaluation set covers ambiguity, injection, timeout, and provider errors.
- Quality, latency, cost, and fallback thresholds meet the plan.
- User consent and provenance behavior match requirements.
- Logs and traces avoid sensitive content.

## Release gate

- Feature flags/config defaults are safe.
- Monitoring identifies correctness and failure-rate regressions.
- Rollback or disable steps are executable.
- Manual-only checks name an owner and recorded evidence.
