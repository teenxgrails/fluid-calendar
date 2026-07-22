# Cross-functional plan contract

## Required sections

1. **Outcome** — one sentence describing the user-visible result.
2. **Repository reality** — current behavior and evidence paths.
3. **Scope** — in scope, non-goals, constraints, assumptions.
4. **Requirements** — stable IDs with testable language.
5. **Experience contract** — journeys and UI states when relevant.
6. **AI/data contract** — schemas, evaluation, fallback, and safety when relevant.
7. **Engineering contract** — interfaces, storage, errors, observability, migration.
8. **Execution graph** — task IDs, dependencies, waves, touched surfaces.
9. **Verification matrix** — requirement to evidence mapping.
10. **Rollout and recovery** — release, monitoring, rollback, cleanup.
11. **Open decisions** — only unresolved choices that can change implementation.

## Requirement quality

Write requirements as observable behavior:

`REQ-004: When provider parsing exceeds 8 seconds, scheduling continues with the deterministic parser and the UI identifies the fallback.`

Avoid implementation-only statements such as “add a timeout.” Use `MUST`, `SHOULD`, and `MAY` only when their strength is intentional.

## Task quality

A ready task contains:

- `ID` and outcome;
- requirements covered;
- dependencies;
- likely files/symbols;
- implementation notes and invariants;
- tests/evidence;
- completion condition.

## Verification matrix

| Requirement | Unit       | Integration | UI/e2e   | Manual evidence | Status  |
| ----------- | ---------- | ----------- | -------- | --------------- | ------- |
| REQ-001     | named test | named test  | scenario | artifact        | planned |

Use `n/a` with a reason; never leave a coverage cell silently blank.

## Execution wave rules

- Wave 0: research, contracts, spikes, migrations that unblock others.
- Wave 1: independent core implementation behind stable interfaces.
- Wave 2: integration and user-facing composition.
- Wave 3: regression, accessibility, performance, rollout, and documentation.

Do not force four waves when fewer are sufficient.
