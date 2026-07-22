# Project Pilot operating model

## Source-of-truth map

| Concern              | Preferred location                       | Rule                                   |
| -------------------- | ---------------------------------------- | -------------------------------------- |
| Binding instructions | `AGENTS.md`                              | Never duplicate or weaken them.        |
| Product direction    | `.project-pilot/PROJECT.md`              | Keep concise and stable.               |
| Milestones           | `.project-pilot/ROADMAP.md`              | Track outcomes, not file edits.        |
| Current position     | `.project-pilot/STATE.md`                | Update after meaningful work.          |
| Unscheduled ideas    | `.project-pilot/BACKLOG.md`              | Triage before promotion.               |
| Architecture         | Existing `ARCHITECTURE.md`               | Link from plans; do not clone.         |
| Durable decisions    | Existing `DECISIONS.md`                  | Append dated, non-obvious decisions.   |
| Change contract      | Existing OpenSpec change, issue, or plan | Prefer the repository convention.      |
| Execution evidence   | Tests, build logs, screenshots, traces   | Reference exact commands or artifacts. |

## Planning states

Use only these states:

- `proposed`: intent exists but scope is not approved.
- `ready`: requirements, dependencies, and checks are clear.
- `active`: implementation is in progress.
- `blocked`: a named external decision or prerequisite prevents progress.
- `verify`: implementation exists but evidence is incomplete.
- `done`: acceptance evidence passes.

Never use `done` as a synonym for “someone worked on it.”

## Work-in-progress policy

- Keep one milestone outcome in `Now` unless the user explicitly authorizes parallel workstreams.
- Parallelize only independent tasks with disjoint ownership or files.
- Do not start a downstream task while its contract or dependency remains unstable.
- Move discoveries outside the active scope to the backlog instead of silently expanding work.

## Recovery protocol

When project state is stale or contradictory:

1. Trust repository evidence and tests over prose status.
2. Compare the roadmap, active specs, git history, and worktree.
3. Mark uncertain items `verify`; do not guess completion.
4. Repair only the smallest authoritative files.
5. State what changed and why.
