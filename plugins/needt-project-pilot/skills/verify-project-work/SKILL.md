---
name: verify-project-work
description: Audit a plan, implementation, milestone, or release against requirements and concrete evidence, then issue an honest ready/not-ready verdict. Use when the user asks to review completeness, verify a phase, inspect implementation against a spec, check design fidelity, validate AI behavior, assess release readiness, find delivery gaps, perform a pre-merge audit, or decide whether work can be marked done.
---

# Verify Project Work

Judge outcomes against contracts and evidence. A clean diff or successful build is useful evidence, not proof that every requirement is satisfied.

## Build the audit set

1. Read repository instructions, the governing spec/issue/plan, and durable decisions.
2. Inspect the actual diff, affected code paths, migrations, tests, and user-facing surfaces.
3. Extract every requirement and acceptance criterion into a traceability table.
4. Identify risk surfaces: data, auth, privacy, external providers, AI, accessibility, performance, concurrency, and rollback.
5. Read [evidence-gates.md](references/evidence-gates.md) and select gates proportional to risk.

## Verify in layers

Run the narrowest relevant checks first, then broader regression checks when warranted:

1. static/type/schema validation;
2. focused unit and integration tests;
3. build or package validation;
4. critical user journey and failure recovery;
5. visual/accessibility checks for changed UI;
6. evaluation and fallback checks for changed AI behavior;
7. migration, monitoring, rollout, and recovery readiness.

Use actual project scripts. If a check cannot run because of missing secrets, services, hardware, or user access, mark it `not verified` and state the exact unblocker. Never silently downgrade it to passed.

## Review the plan itself

For plan audits, verify requirement coverage, dependency order, stable interfaces, file evidence, testability, non-goals, risk controls, and rollback. Reject plans that hide unresolved product decisions inside implementation tasks.

## Report with severity

Use these levels:

- **Blocker:** unsafe to merge/release or a core requirement fails.
- **Major:** important requirement or recovery path is missing; fix before completion.
- **Minor:** worthwhile improvement that does not invalidate the outcome.
- **Future:** explicitly out-of-scope follow-up with no current acceptance impact.

Attach every finding to a requirement, file/line, command output, screenshot, or reproducible scenario. Distinguish observed fact from inference.

## Issue the verdict

Return:

1. **Verdict:** `ready`, `ready with minor follow-ups`, or `not ready`.
2. **Coverage:** passed, failed, and unverified requirements.
3. **Findings:** severity-ordered with evidence and smallest safe remediation.
4. **Checks run:** exact commands and results.
5. **Residual risk:** what remains after fixes.
6. **Next action:** one concrete step required to advance.

Do not modify code when the user asked only for review or verification. If the user asks to fix as well, resolve blockers/majors, rerun affected gates, and update project state only after evidence passes.
