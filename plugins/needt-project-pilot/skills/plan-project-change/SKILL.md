---
name: plan-project-change
description: Turn a feature, product idea, AI capability, design direction, refactor, migration, or milestone into an implementation-ready cross-functional plan grounded in repository evidence. Use when the user asks for a PRD, feature spec, UX plan, AI plan, architecture plan, coding plan, phased roadmap, task breakdown, dependency graph, implementation prompt for another AI, or a combined product-to-code delivery plan.
---

# Plan Project Change

Build a plan another capable agent can execute without rediscovering intent or inventing interfaces. Use existing repository conventions and create the smallest artifact set that makes the change safe.

## Ground the plan

1. Read the nearest `AGENTS.md` and relevant project documentation.
2. Inspect the actual code paths, schemas, APIs, tests, design conventions, and recent related changes.
3. Name evidence with file paths and symbols. Mark anything not verified as an assumption.
4. Identify the user outcome, current behavior, constraints, non-goals, and measurable done condition.
5. Ask only questions whose answers would materially change the plan. Otherwise choose a sensible default and record it.

## Select planning depth

- **Fast:** concise goal, affected files, steps, and checks.
- **Standard:** complete change contract with requirements, flows, architecture, tasks, and verification.
- **Deep:** add alternatives, migration/rollback, risk register, observability, staged rollout, and execution waves.

Use Standard by default for multi-file changes. Use Deep for AI, auth, billing, destructive data changes, public APIs, large design systems, or cross-service work.

## Use the repository's planning system

- If `openspec/` exists and an OpenSpec planning skill is available, use it to create or update the change artifacts. Do not create a competing spec folder.
- If a GitHub issue is the source, retain its acceptance criteria and trace plan requirements back to it.
- If a project command center exists, link the change from `.project-pilot/ROADMAP.md` and update `STATE.md` only after the plan is accepted or implementation starts.
- Use [change-plan.md](assets/change-plan.md) only when no stronger project template exists.

## Create one cross-functional contract

Read [plan-contract.md](references/plan-contract.md) for the required structure. Include a lane only when relevant:

- **Product:** target user, problem, outcome, scope, non-goals, requirements, acceptance examples.
- **Experience/design:** journeys, information architecture, states, responsive behavior, tokens/components, accessibility, and visual evidence. Read [design-lane.md](references/design-lane.md).
- **AI/data:** provider boundary, input/output schemas, deterministic fallback, evaluation cases, privacy, safety, latency, and cost. Read [ai-lane.md](references/ai-lane.md).
- **Engineering:** interfaces, data model, failure behavior, migration, observability, tests, rollout, and rollback. Read [engineering-lane.md](references/engineering-lane.md).

Separate `DESIGN` (visual system and tokens) from `EXPERIENCE` (flows, behavior, states, accessibility) for substantial UI work. Seal both into explicit engineering acceptance criteria.

## Make the work executable

Assign stable IDs to requirements (`REQ-001`) and tasks (`T-001`). Every task must state:

- requirement IDs it satisfies;
- exact files or modules to inspect/change when known;
- dependencies;
- implementation outcome, not just an activity;
- verification command or observable evidence;
- rollback or failure handling when material.

Build a dependency graph, then group independent tasks into execution waves. Parallelize only tasks with stable contracts and non-overlapping ownership. Put integration, migration, and end-to-end verification after their prerequisites.

## Run a plan preflight

Before handing off, verify:

- every in-scope requirement maps to at least one task and one check;
- design covers loading, empty, error, success, disabled, keyboard, and responsive states;
- AI behavior has strict schemas, fallback, evaluation, and user-consent boundaries;
- data changes include forward migration, compatibility, and rollback/recovery;
- security, privacy, accessibility, performance, and observability are explicitly considered;
- non-goals prevent scope creep;
- no task depends on an unresolved interface.

End with the first executable wave, its inputs, and the exact evidence required to advance. Do not implement unless the user asked to build as well as plan.
