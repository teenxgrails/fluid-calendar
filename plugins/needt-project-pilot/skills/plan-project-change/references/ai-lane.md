# AI capability lane

## Boundary

Define what the model may decide and what remains deterministic. Run deterministic validation before and after model calls. Require explicit user consent before material silent changes unless the product contract says otherwise.

## Contract

Specify:

- provider-neutral interface and provider adapters;
- exact input/output JSON schemas and validation;
- model/config selection without hard-coded provider coupling;
- timeout, retry, cancellation, rate-limit, and circuit-breaker behavior;
- deterministic or degraded fallback;
- prompt/version ownership;
- idempotency and duplicate handling;
- secrets, retention, redaction, and tenant/user boundaries;
- latency and cost budgets;
- logging that excludes sensitive content by default.

## Evaluation

Create a small versioned evaluation set before implementation. Include happy paths, ambiguous input, malformed output, prompt injection, unsafe requests, long input, multilingual input when relevant, timeout, provider error, and schema drift.

Define measurable thresholds such as schema-valid rate, task extraction precision, user acceptance rate, p95 latency, fallback rate, and cost per operation. Do not accept “looks good” as an AI evidence gate.

## Rollout

Prefer provider `None` or deterministic behavior as a safe default. Gate AI capabilities independently, expose provenance to users, monitor fallback/error rates, and preserve a one-step disable path.
