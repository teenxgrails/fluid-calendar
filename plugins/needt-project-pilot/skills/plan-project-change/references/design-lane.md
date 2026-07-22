# Design and experience lane

## DESIGN contract

Define visual choices as reusable tokens and components:

- color roles and contrast targets;
- typography hierarchy;
- spacing, density, radius, elevation, and motion;
- component variants and interaction states;
- existing project primitives to reuse;
- explicit references or screenshots that establish direction.

Never invent a new control style when the repository documents a house pattern.

## EXPERIENCE contract

Describe behavior independently from visual polish:

- named user and goal;
- entry points and navigation;
- primary and alternate journeys;
- information hierarchy;
- loading, empty, partial, error, offline, success, and permission states;
- keyboard order, focus, screen-reader names, reduced motion, and contrast;
- narrow, medium, and wide viewport behavior;
- destructive action confirmation and recovery.

## Engineering handoff

For each surface, list route, component owner, data dependencies, states, events, analytics, and acceptance evidence. Prefer deterministic screenshots or visual tests for high-value states. Distinguish pixel/reference fidelity from functional acceptance.
