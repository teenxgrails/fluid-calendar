---
name: organize-project
description: Organize an existing or new software project into a durable command center with vision, roadmap, backlog, current state, decisions, risks, and next actions. Use when the user asks to organize a repository, prioritize work, build or repair a roadmap, capture a backlog, resume after a break, report status, choose what to do next, coordinate parallel workstreams, or reduce project chaos without immediately implementing a feature.
---

# Organize Project

Create a small, evidence-backed operating system for the repository. Preserve existing planning systems and make one clear source of truth for each kind of information.

## Start with evidence

1. Read the nearest `AGENTS.md` and repository instructions completely.
2. Inspect the current branch, worktree status, recent commits, package scripts, architecture docs, issue/spec folders, and existing plans.
3. Run `python3 scripts/project_os.py status --root <repo-root>` from this skill directory when `.project-pilot/` exists.
4. Distinguish facts found in the repository from assumptions and proposals.
5. Do not change product code while the request is only to organize, plan, review, or report.

## Choose the lightest useful mode

- **Fast:** One small task, few files, no schema/API/user-flow impact. Give a short plan and verification command; do not create planning artifacts unless asked.
- **Standard:** A multi-file feature or meaningful design change. Maintain state and create one implementation-ready change plan.
- **Deep:** A milestone, new subsystem, migration, cross-cutting UX, or AI feature. Maintain project artifacts, explicit requirements, risks, dependency waves, and evidence gates.

Escalate the mode when uncertainty, reversibility cost, security, data migration, or user impact is high. Avoid process for its own sake.

## Establish the command center

If the user asks to initialize or repair project organization and no equivalent system exists, run:

```bash
python3 scripts/project_os.py init --root <repo-root> --name "<project name>"
python3 scripts/project_os.py check --root <repo-root>
```

The command creates missing files only. Never overwrite existing files. Read [operating-model.md](references/operating-model.md) before merging information from multiple planning systems.

Prefer existing sources:

- Treat `AGENTS.md` as binding project instruction.
- Use existing `ARCHITECTURE.md`, `DECISIONS.md`, issue trackers, and release docs instead of cloning their content.
- When `openspec/` exists, keep change specifications and task details there. Use `.project-pilot/` only for portfolio-level direction and state.
- When a compatible specialist skill is available, route design, OpenSpec, issue implementation, or deployment work through it; keep this skill responsible for coordination and state.

## Triage and prioritize

Normalize incoming work into outcomes, not vague activity. For each item capture:

- outcome and user value;
- urgency or deadline;
- dependencies and blockers;
- risk and reversibility;
- rough size: `S`, `M`, or `L`;
- evidence required to call it done.

Order work by: blocker removal, deadline/risk, user value, dependency leverage, then effort. Keep at most one primary objective in `Now`; put ready successors in `Next`; park ideas in `Later` or the backlog.

## Produce an actionable status

Report:

1. **Outcome:** the current milestone and why it matters.
2. **Reality:** completed, active, blocked, and unverified work based on evidence.
3. **Now:** one highest-value next action with owner, inputs, and done condition.
4. **Next:** dependency-ordered follow-ups.
5. **Risks/decisions:** only items requiring attention.

After substantive planning or delivery work, update `.project-pilot/STATE.md` and the relevant roadmap checkbox. Record non-obvious durable choices in the repository's existing decision log. Do not mark work complete because code exists; require the planned evidence.

## Keep handoffs small

For a new change, invoke `plan-project-change`. For an audit or completion decision, invoke `verify-project-work`. Handoffs must name the goal, source artifacts, constraints, touched surfaces, acceptance checks, and unresolved decisions.
